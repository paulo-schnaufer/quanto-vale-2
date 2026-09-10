// features/selecao-objeto/index.ts
//
// Responsabilidade: sorteia o objeto do turno corrente (sem repetição
// dentro da sessão, enquanto o catálogo permitir) e o revela para a
// dupla antes do cronômetro de palpite. A seleção é feita pelo sistema —
// esta tela existe para anunciar o objeto sorteado, não para oferecer
// escolha.
//
// Montagem: após setup-duplas (1º turno) ou após revelacao-cedulas
// (turnos seguintes). Desmontagem: ao avançar para captura-palpite.

import type { Screen, Teardown } from '../../core/screen-contract';
import type { ObjetoJogo } from '../../core/game-state.types';
import { CATALOGO_OBJETOS } from './catalogo';
import { determinarProximoTurno, sortearObjeto } from './sorteio';
import './style.css';

const TEMPO_AUTO_AVANCO_MS = 3000;

// Paleta usada apenas para o placeholder colorido enquanto as fotos reais
// dos objetos não existem em public/assets/objetos/.
const CORES_PLACEHOLDER = ['#F6A21E', '#5DA9E9', '#66C18C', '#E96A6A', '#B48EDE', '#F2C14E'];

function corPlaceholder(id: string): string {
  let hash = 0;
  for (let indice = 0; indice < id.length; indice += 1) {
    hash = (hash * 31 + id.charCodeAt(indice)) >>> 0;
  }
  return CORES_PLACEHOLDER[hash % CORES_PLACEHOLDER.length];
}

function renderizar(root: HTMLElement, objeto: ObjetoJogo): void {
  root.innerHTML = '';
  root.classList.add('tela-selecao-objeto');

  const cartao = document.createElement('div');
  cartao.className = 'selecao-objeto__cartao';

  const imagemWrap = document.createElement('div');
  imagemWrap.className = 'selecao-objeto__imagem-wrap';
  imagemWrap.style.backgroundColor = corPlaceholder(objeto.id);

  const imagem = document.createElement('img');
  imagem.className = 'selecao-objeto__imagem';
  imagem.src = objeto.imagemUrl;
  imagem.alt = '';
  imagem.draggable = false;

  const fallback = document.createElement('span');
  fallback.className = 'selecao-objeto__imagem-fallback';
  fallback.textContent = objeto.nome;
  fallback.hidden = true;

  // Enquanto as fotos reais não existirem, a imagem simplesmente não
  // carrega (404) e o placeholder colorido com o nome assume o lugar.
  imagem.addEventListener('error', () => {
    imagem.hidden = true;
    fallback.hidden = false;
  });

  imagemWrap.append(imagem, fallback);

  const nome = document.createElement('h1');
  nome.className = 'selecao-objeto__nome';
  nome.textContent = objeto.nome; // preço nunca é exibido nesta tela

  cartao.append(imagemWrap, nome);
  root.append(cartao);
}

export const selecaoObjetoScreen: Screen = {
  id: 'selecao-objeto',

  mount(root, ctx): Teardown {
    const turno = determinarProximoTurno(ctx.state);

    if (!turno) {
      // Guarda defensiva: chegar aqui sem um próximo turno significa que
      // a sessão já deveria ter terminado (decisão que pertence a
      // revelacao-cedulas/screen-router, não a esta feature). Recupera
      // navegando para o placar em vez de travar a atração.
      console.error(
        '[selecao-objeto] Nenhum próximo turno disponível; navegando para placar-vitrine como recuperação.'
      );
      ctx.navegar('placar-vitrine');
      return () => {};
    }

    // rodada:iniciada sempre precede objeto:selecionado.
    ctx.bus.emit('rodada:iniciada', { numero: turno.numero, duplaId: turno.duplaId });

    const objeto = sortearObjeto(CATALOGO_OBJETOS, ctx.state.historicoRodadas);
    ctx.bus.emit('objeto:selecionado', { objeto });

    renderizar(root, objeto);

    let jaAvancou = false;
    const avancar = (): void => {
      if (jaAvancou) return;
      jaAvancou = true;
      ctx.navegar('captura-palpite');
    };

    const timeoutId = window.setTimeout(avancar, TEMPO_AUTO_AVANCO_MS);

    const aoClicar = (): void => avancar();
    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Enter') avancar();
    };

    root.addEventListener('click', aoClicar);
    window.addEventListener('keydown', aoTeclar);

    return () => {
      window.clearTimeout(timeoutId);
      root.removeEventListener('click', aoClicar);
      window.removeEventListener('keydown', aoTeclar);
    };
  },
};
