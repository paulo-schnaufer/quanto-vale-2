// features/revelacao-cedulas/revelacao-cedulas.screen.ts
//
// Feature: revelacao-cedulas
// Converte o preço do objeto do turno para a moeda de um país-destaque
// (round-robin determinístico) e revela a cédula correspondente.
// Ver spec completa: quanto-vale-2-specs-modulos.md § "revelacao-cedulas".

import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';
import type { Unsubscribe } from '../../core/event-bus';
import { sessaoTerminou } from '../../core/screen-router';
import {
  carregarManifestoCedulas,
  caminhoImagemCedula,
  type CedulaManifestoEntry,
} from './revelacao-cedulas.manifest';
import {
  paisDoTurno,
  encontrarCedula,
  calcularConversao,
  formatarTextoNotas,
} from './revelacao-cedulas.logic';
import './revelacao-cedulas.css';

const DURACAO_AUTO_AVANCO_MS = 6000;

interface Elementos {
  placeholder: HTMLDivElement;
  imagem: HTMLImageElement;
  paisNome: HTMLParagraphElement;
  textoNotas: HTMLParagraphElement;
}

export const revelacaoCedulasScreen: Screen = {
  id: 'revelacao-cedulas',

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    const state = ctx.state;
    const rodadaAtual = state.rodadaAtual;

    // Guarda defensiva: por contrato de fluxo, rodadaAtual e seu objeto já
    // existem ao chegar aqui (a tela anterior, calculo-pontuacao, depende
    // dos dois para funcionar). Se isso falhar é violação de invariante do
    // núcleo, não um estado de jogo válido — registramos e seguimos sem
    // travar o app, em vez de deixar a tela presa sem poder navegar.
    if (!rodadaAtual || !rodadaAtual.objeto) {
      console.error(
        '[revelacao-cedulas] mount() sem rodadaAtual/objeto válido — navegando para selecao-objeto para não travar o fluxo.'
      );
      ctx.navegar('selecao-objeto');
      return () => {};
    }

    const objeto = rodadaAtual.objeto;
    const paisISO = paisDoTurno(state);
    const dupla = state.duplas.find((d) => d.id === rodadaAtual.duplaId);

    let jaAvancou = false;
    let jaEmitiuCedula = false;
    let desmontado = false;
    let unsubscribeCotacoes: Unsubscribe | null = null;

    const elementos = renderEsqueleto(root, {
      numeroRodada: rodadaAtual.numero,
      nomeDupla: dupla?.nomeExibicao ?? null,
      paisISO,
    });

    // --- Navegação ------------------------------------------------------

    function avancar(): void {
      if (jaAvancou) return;
      jaAvancou = true;
      window.clearTimeout(timeoutId);
      root.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeydown);
      const proximaTela = sessaoTerminou(ctx.state) ? 'placar-vitrine' : 'selecao-objeto';
      ctx.navegar(proximaTela);
    }

    function onClick(): void {
      avancar();
    }

    function onKeydown(evento: KeyboardEvent): void {
      if (evento.key === 'Enter') avancar();
    }

    root.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeydown);

    // O avanço automático nunca espera pelo manifesto nem pela cotação:
    // dispara sempre aos ~6s, ainda que a exibição esteja incompleta.
    const timeoutId = window.setTimeout(avancar, DURACAO_AUTO_AVANCO_MS);

    // --- Emissão do evento (uma vez por turno) --------------------------
    //
    // Deliberadamente independente de `jaAvancou`: mesmo que o usuário
    // avance antes do manifesto responder, o turno ainda precisa registrar
    // exatamente um cedula:revelada. Como a aplicação de estado no núcleo é
    // síncrona dentro de emit(), isso não interfere na tela seguinte —
    // nenhuma delas lê cedulaEmRevelacao.
    function emitirCedulaRevelada(entrada: CedulaManifestoEntry): void {
      if (jaEmitiuCedula) return;
      jaEmitiuCedula = true;
      ctx.bus.emit('cedula:revelada', {
        paisISO: entrada.paisISO,
        codigoISO4217: entrada.codigoISO4217,
        denominacao: entrada.denominacao,
        imagemPath: caminhoImagemCedula(entrada.arquivo),
      });
    }

    // --- Carregamento da cédula (manifesto) ------------------------------

    carregarManifestoCedulas()
      .then((manifesto) => {
        const entrada = encontrarCedula(manifesto, paisISO);
        if (!entrada) {
          // Configuração inconsistente (paisesDestaque com código fora do
          // manifesto) — fora do que esta feature pode corrigir sozinha.
          console.error(
            `[revelacao-cedulas] nenhuma cédula no manifesto para paisISO="${paisISO}". Verifique configuracoes.paisesDestaque.`
          );
          if (!desmontado) renderErro(elementos);
          return;
        }

        emitirCedulaRevelada(entrada);

        if (desmontado) return; // tela já saiu de cena; DOM não é mais tocado
        renderCedulaCarregada(elementos, entrada);
        atualizarConversao(entrada);
      })
      .catch((erro) => {
        // Falha catastrófica (rede/parse) ao buscar um asset estático local.
        // Sem manifesto não há paisISO/moeda/denominação válidos para compor
        // o payload de cedula:revelada — não emitimos dado inventado só para
        // "cumprir a métrica". A navegação segue garantida pelo timeout ou
        // por clique/Enter de qualquer forma.
        console.error('[revelacao-cedulas] falha ao carregar o manifesto de cédulas.', erro);
        if (!desmontado) renderErro(elementos);
      });

    // --- Conversão / cotação ---------------------------------------------

    function tentarExibirConversao(entrada: CedulaManifestoEntry): boolean {
      const cotacao = state.cotacoes[entrada.codigoISO4217];
      const conversao = calcularConversao(objeto.precoReaisCentavos, cotacao, entrada.denominacao);
      if (!conversao) return false;
      elementos.textoNotas.textContent = formatarTextoNotas(
        conversao.quantidadeDeNotas,
        entrada.denominacao,
        entrada.codigoISO4217
      );
      return true;
    }

    function atualizarConversao(entrada: CedulaManifestoEntry): void {
      if (tentarExibirConversao(entrada)) return;

      // Cotação ainda não chegou (fetch inicial em andamento): mostra
      // estado de carregamento e assina o evento que completa a exibição
      // assim que a taxa de câmbio existir.
      elementos.textoNotas.textContent = 'calculando…';
      unsubscribeCotacoes = ctx.bus.on('cotacoes:atualizadas', (payload) => {
        if (desmontado) return;
        const cotacaoChegou = payload.cotacoes[entrada.codigoISO4217];
        if (!cotacaoChegou) return;
        const conversao = calcularConversao(objeto.precoReaisCentavos, cotacaoChegou, entrada.denominacao);
        if (!conversao) return;
        elementos.textoNotas.textContent = formatarTextoNotas(
          conversao.quantidadeDeNotas,
          entrada.denominacao,
          entrada.codigoISO4217
        );
        unsubscribeCotacoes?.();
        unsubscribeCotacoes = null;
      });
    }

    // --- Teardown ---------------------------------------------------------

    return function teardown(): void {
      desmontado = true;
      window.clearTimeout(timeoutId);
      root.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeydown);
      unsubscribeCotacoes?.();
      unsubscribeCotacoes = null;
    };
  },
};

// --- Renderização (DOM puro, sem framework) ------------------------------

function renderEsqueleto(
  root: HTMLElement,
  dados: { numeroRodada: number; nomeDupla: string | null; paisISO: string }
): Elementos {
  root.innerHTML = '';
  root.classList.add('revelacao-cedulas');

  const header = document.createElement('header');
  header.className = 'revelacao-cedulas__header';

  const rodadaSpan = document.createElement('span');
  rodadaSpan.className = 'revelacao-cedulas__rodada';
  rodadaSpan.textContent = `Rodada ${dados.numeroRodada}`;
  header.appendChild(rodadaSpan);

  if (dados.nomeDupla) {
    const duplaSpan = document.createElement('span');
    duplaSpan.className = 'revelacao-cedulas__dupla';
    duplaSpan.textContent = dados.nomeDupla; // texto do usuário: textContent evita injeção
    header.appendChild(duplaSpan);
  }

  const figura = document.createElement('div');
  figura.className = 'revelacao-cedulas__figura';

  const placeholder = document.createElement('div');
  placeholder.className = 'revelacao-cedulas__placeholder';
  placeholder.textContent = dados.paisISO.toUpperCase();

  const imagem = document.createElement('img');
  imagem.className = 'revelacao-cedulas__imagem';
  imagem.alt = '';
  imagem.hidden = true;

  figura.append(placeholder, imagem);

  const paisNome = document.createElement('p');
  paisNome.className = 'revelacao-cedulas__pais';
  paisNome.textContent = 'Carregando país…';

  const textoNotas = document.createElement('p');
  textoNotas.className = 'revelacao-cedulas__notas';
  textoNotas.textContent = 'carregando cédula…';

  const dica = document.createElement('p');
  dica.className = 'revelacao-cedulas__dica';
  dica.textContent = 'Toque ou pressione Enter para continuar';

  root.append(header, figura, paisNome, textoNotas, dica);

  return { placeholder, imagem, paisNome, textoNotas };
}

function renderCedulaCarregada(elementos: Elementos, entrada: CedulaManifestoEntry): void {
  elementos.paisNome.textContent = entrada.nomePais;
  elementos.placeholder.textContent = entrada.paisISO.toUpperCase();
  elementos.imagem.alt = entrada.nomePais;

  // Tenta carregar a foto real da cédula; se ainda não existir (ver TODO de
  // asset na spec), o placeholder cinza-claro com o código do país continua
  // visível — sem exigir nenhum flag manual para trocar de comportamento
  // quando as fotos definitivas forem adicionadas.
  elementos.imagem.onload = () => {
    elementos.imagem.hidden = false;
    elementos.placeholder.hidden = true;
  };
  elementos.imagem.onerror = () => {
    elementos.imagem.hidden = true;
    elementos.placeholder.hidden = false;
  };
  elementos.imagem.src = caminhoImagemCedula(entrada.arquivo);
}

function renderErro(elementos: Elementos): void {
  elementos.paisNome.textContent = 'Não foi possível carregar a cédula deste turno.';
  elementos.textoNotas.textContent = '';
}
