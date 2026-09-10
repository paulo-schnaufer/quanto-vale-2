// features/placar-vitrine/placar-vitrine.screen.ts
import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';
import { construirRanking } from './ranking';
import './placar-vitrine.css';

/** Tempo de inatividade após o qual a tela retorna a boas-vindas. */
const TIMEOUT_INATIVIDADE_MS = 30_000;

/** Eventos de interação do usuário que resetam o timer de inatividade. */
const EVENTOS_DE_ATIVIDADE: readonly (keyof DocumentEventMap)[] = [
  'pointerdown',
  'keydown',
  'touchstart',
];

function formatarPontos(pontos: number): string {
  return pontos.toLocaleString('pt-BR');
}

function renderizarLista(
  root: HTMLElement,
  duplas: Parameters<typeof construirRanking>[0],
): void {
  const lista = root.querySelector<HTMLOListElement>('.pv-lista');
  if (!lista) return;

  lista.innerHTML = '';

  const ranking = construirRanking(duplas);

  if (ranking.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'pv-vazio';
    vazio.textContent = 'Nenhuma dupla registrada nesta sessão.';
    lista.replaceWith(vazio);
    return;
  }

  for (const { dupla, posicao, empatada } of ranking) {
    const item = document.createElement('li');
    item.className = 'pv-item';
    if (posicao === 1) {
      item.classList.add('pv-item--primeiro');
    }

    const posEl = document.createElement('span');
    posEl.className = 'pv-posicao';
    posEl.textContent = `${posicao}º`;

    const nomeEl = document.createElement('span');
    nomeEl.className = 'pv-nome';
    nomeEl.textContent = dupla.nomeExibicao;

    const pontosEl = document.createElement('span');
    pontosEl.className = 'pv-pontos';
    pontosEl.textContent = `${formatarPontos(dupla.pontuacaoTotal)} pts`;

    item.append(posEl, nomeEl, pontosEl);

    if (empatada) {
      const etiqueta = document.createElement('span');
      etiqueta.className = 'pv-etiqueta-empate';
      etiqueta.textContent = 'empate';
      item.appendChild(etiqueta);
    }

    lista.appendChild(item);
  }
}

export const placarVitrineScreen: Screen = {
  id: 'placar-vitrine',

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    root.innerHTML = `
      <section class="pv-screen" aria-live="polite">
        <h1 class="pv-titulo">Placar final</h1>
        <ol class="pv-lista" aria-label="Ranking das duplas"></ol>
        <button type="button" class="pv-botao-nova-partida">Nova partida</button>
      </section>
    `;

    // Estado é lido uma única vez no mount: por contrato, quando esta
    // tela monta, revelacao-cedulas já aplicou tudo que precisava via
    // seus eventos. Esta feature não escreve estado e não assina bus.
    renderizarLista(root, ctx.state.duplas);

    const botao = root.querySelector<HTMLButtonElement>('.pv-botao-nova-partida');

    let timerInatividade: ReturnType<typeof setTimeout> | undefined;

    const irParaBoasVindas = (): void => {
      // Apenas navega. A limpeza de estado (sessao:reiniciada) é
      // responsabilidade de boas-vindas/setup-duplas, não desta tela.
      ctx.navegar('boas-vindas');
    };

    const reiniciarTimerInatividade = (): void => {
      if (timerInatividade !== undefined) {
        clearTimeout(timerInatividade);
      }
      timerInatividade = setTimeout(irParaBoasVindas, TIMEOUT_INATIVIDADE_MS);
    };

    const handleAtividade = (): void => {
      reiniciarTimerInatividade();
    };

    for (const nomeEvento of EVENTOS_DE_ATIVIDADE) {
      document.addEventListener(nomeEvento, handleAtividade);
    }

    const handleClickBotao = (): void => {
      irParaBoasVindas();
    };
    botao?.addEventListener('click', handleClickBotao);

    reiniciarTimerInatividade();

    const teardown: Teardown = () => {
      if (timerInatividade !== undefined) {
        clearTimeout(timerInatividade);
      }
      for (const nomeEvento of EVENTOS_DE_ATIVIDADE) {
        document.removeEventListener(nomeEvento, handleAtividade);
      }
      botao?.removeEventListener('click', handleClickBotao);
    };

    return teardown;
  },
};
