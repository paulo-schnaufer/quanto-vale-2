// features/calculo-pontuacao/index.ts
//
// Screen 'calculo-pontuacao'. Responsabilidade única: mostrar o resultado
// do turno e emitir 'pontuacao:calculada'. Não escreve em GameState
// diretamente (ver Nota de arquitetura em core/) — quem aplica a mutação
// (duplas[].pontuacaoTotal, historicoRodadas) é o núcleo, ao reagir ao
// evento emitido aqui.

import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';
import type { RodadaAtual } from '../../core/game-state.types';
import { calcularResultado } from './logic';
import { apresentacaoParaResultado, formatarCentavos } from './view';
import './style.css';

const AVANCO_AUTOMATICO_MS = 4000;

export const calculoPontuacaoScreen: Screen = {
  id: 'calculo-pontuacao',

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    const rodadaAtual = ctx.state.rodadaAtual;

    // Guarda defensiva: a tela só faz sentido com uma rodada em andamento.
    // Se por algum motivo montar sem rodadaAtual/objeto, não trava a UI —
    // apenas evita processar um resultado sem sentido.
    if (!rodadaAtual || !rodadaAtual.objeto) {
      root.innerHTML = '';
      console.error(
        '[calculo-pontuacao] mount() sem rodadaAtual/objeto válido — nada a calcular.'
      );
      return () => {};
    }

    const dupla = ctx.state.duplas.find((d) => d.id === rodadaAtual.duplaId);
    const resultado = calcularResultado(rodadaAtual);
    const apresentacao = apresentacaoParaResultado(
      resultado.faixa,
      rodadaAtual.esgotouTempo
    );

    root.innerHTML = '';
    root.appendChild(
      construirLayout({
        nomeDupla: dupla?.nomeExibicao ?? 'Dupla',
        precoReaisCentavos: rodadaAtual.objeto.precoReaisCentavos,
        palpiteReaisCentavos: rodadaAtual.palpiteReaisCentavos,
        pontosGanhos: resultado.pontosGanhos,
        titulo: apresentacao.titulo,
        corVar: apresentacao.corVar,
      })
    );

    let avancado = false;
    const avancar = () => {
      if (avancado) return; // garante exatamente um pontuacao:calculada por turno
      avancado = true;

      const rodadaConcluida: RodadaAtual = { ...rodadaAtual, resultado };

      ctx.bus.emit('pontuacao:calculada', {
        duplaId: rodadaAtual.duplaId,
        resultado,
        rodadaConcluida,
      });

      ctx.navegar('revelacao-cedulas');
    };

    const timerId = window.setTimeout(avancar, AVANCO_AUTOMATICO_MS);
    root.addEventListener('click', avancar);

    return () => {
      window.clearTimeout(timerId);
      root.removeEventListener('click', avancar);
    };
  },
};

function construirLayout(dados: {
  nomeDupla: string;
  precoReaisCentavos: number;
  palpiteReaisCentavos: number | null;
  pontosGanhos: number;
  titulo: string;
  corVar: string;
}): HTMLElement {
  const container = document.createElement('div');
  container.className = 'calculo-pontuacao';
  container.style.setProperty('--faixa-cor-ativa', `var(${dados.corVar})`);

  const feedback = document.createElement('h1');
  feedback.className = 'calculo-pontuacao__feedback';
  feedback.textContent = dados.titulo;

  const dupla = document.createElement('p');
  dupla.className = 'calculo-pontuacao__dupla';
  dupla.textContent = dados.nomeDupla;

  const comparacao = document.createElement('div');
  comparacao.className = 'calculo-pontuacao__comparacao';
  comparacao.appendChild(
    construirCartaoValor('Preço real', formatarCentavos(dados.precoReaisCentavos))
  );
  comparacao.appendChild(
    construirCartaoValor('Palpite da dupla', formatarCentavos(dados.palpiteReaisCentavos))
  );

  const pontos = document.createElement('p');
  pontos.className = 'calculo-pontuacao__pontos';
  pontos.textContent = `+${dados.pontosGanhos} pontos`;

  const dica = document.createElement('p');
  dica.className = 'calculo-pontuacao__dica';
  dica.textContent = 'Toque na tela para continuar';

  container.append(feedback, dupla, comparacao, pontos, dica);
  return container;
}

function construirCartaoValor(rotulo: string, valor: string): HTMLElement {
  const cartao = document.createElement('div');
  cartao.className = 'calculo-pontuacao__cartao';

  const rotuloEl = document.createElement('span');
  rotuloEl.className = 'calculo-pontuacao__cartao-rotulo';
  rotuloEl.textContent = rotulo;

  const valorEl = document.createElement('span');
  valorEl.className = 'calculo-pontuacao__cartao-valor';
  valorEl.textContent = valor;

  cartao.append(rotuloEl, valorEl);
  return cartao;
}
