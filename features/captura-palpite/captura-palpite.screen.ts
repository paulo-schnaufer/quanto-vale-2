// features/captura-palpite/captura-palpite.screen.ts
import type { Screen, ScreenContext, Teardown } from '../../core/screen-contract';

const ID_TELA = 'captura-palpite' as const;

/** Abaixo desta proporção de tempo restante, o anel fica amarelo. */
const LIMIAR_AMARELO = 0.5;
/** Abaixo desta proporção de tempo restante, o anel fica vermelho. */
const LIMIAR_VERMELHO = 0.2;
/** Frequência de atualização do visual do cronômetro. */
const INTERVALO_TICK_MS = 100;

type CorTempo = 'verde' | 'amarelo' | 'vermelho';

function corPorProporcaoRestante(proporcaoRestante: number): CorTempo {
  if (proporcaoRestante <= LIMIAR_VERMELHO) return 'vermelho';
  if (proporcaoRestante <= LIMIAR_AMARELO) return 'amarelo';
  return 'verde';
}

/**
 * Converte a string digitada (vírgula ou ponto como separador decimal, até
 * 2 casas) em centavos. Retorna null para entrada vazia, não numérica ou
 * negativa — nesses casos a tela nunca deve permitir o envio.
 */
function parseReaisParaCentavos(valorDigitado: string): number | null {
  const normalizado = valorDigitado.trim().replace(',', '.');
  if (normalizado === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;
  const valorEmReais = Number(normalizado);
  if (!Number.isFinite(valorEmReais) || valorEmReais < 0) return null;
  return Math.round(valorEmReais * 100);
}

export const capturaPalpiteScreen: Screen = {
  id: ID_TELA,

  mount(root: HTMLElement, ctx: ScreenContext): Teardown {
    const { state, bus, navegar } = ctx;

    const objeto = state.rodadaAtual?.objeto ?? null;
    const tempoLimiteSegundos = state.configuracoes.tempoLimiteSegundosPorPalpite;
    const tempoLimiteMs = tempoLimiteSegundos * 1000;

    const momentoDeMontagem = performance.now();
    let jaEnviado = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // ---- Montagem do DOM ---------------------------------------------

    root.innerHTML = '';
    root.classList.add('captura-palpite');

    const objetoContainer = document.createElement('div');
    objetoContainer.className = 'captura-palpite__objeto';
    if (objeto) {
      const imagem = document.createElement('img');
      imagem.src = objeto.imagemUrl;
      imagem.alt = objeto.nome;
      imagem.className = 'captura-palpite__objeto-imagem';

      const nome = document.createElement('p');
      nome.className = 'captura-palpite__objeto-nome';
      nome.textContent = objeto.nome;

      objetoContainer.append(imagem, nome);
    }

    const anelContainer = document.createElement('div');
    anelContainer.className = 'captura-palpite__anel-container';
    anelContainer.innerHTML = `
      <svg class="captura-palpite__anel" viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle class="captura-palpite__anel-fundo" cx="60" cy="60" r="54" />
        <circle class="captura-palpite__anel-progresso" cx="60" cy="60" r="54" />
      </svg>
      <span class="captura-palpite__segundos" aria-live="polite"></span>
    `;

    const form = document.createElement('form');
    form.className = 'captura-palpite__form';
    form.noValidate = true;
    form.innerHTML = `
      <label class="captura-palpite__label" for="captura-palpite-input">
        Quanto você acha que custa?
      </label>
      <div class="captura-palpite__campo-wrapper">
        <span class="captura-palpite__prefixo">R$</span>
        <input
          id="captura-palpite-input"
          class="captura-palpite__input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0,00"
        />
      </div>
      <p class="captura-palpite__erro" role="alert" aria-live="assertive"></p>
      <button type="submit" class="captura-palpite__botao">Confirmar palpite</button>
    `;

    root.append(objetoContainer, anelContainer, form);

    const inputEl = form.querySelector<HTMLInputElement>('.captura-palpite__input')!;
    const erroEl = form.querySelector<HTMLParagraphElement>('.captura-palpite__erro')!;
    const segundosEl = anelContainer.querySelector<HTMLSpanElement>('.captura-palpite__segundos')!;
    const progressoEl = anelContainer.querySelector<SVGCircleElement>(
      '.captura-palpite__anel-progresso'
    )!;

    const raio = 54;
    const circunferencia = 2 * Math.PI * raio;
    progressoEl.style.strokeDasharray = `${circunferencia}`;
    progressoEl.style.strokeDashoffset = '0';

    // ---- Helpers de UI --------------------------------------------------

    function limparErro(): void {
      erroEl.textContent = '';
      inputEl.classList.remove('captura-palpite__input--erro');
    }

    function mostrarErro(mensagem: string): void {
      erroEl.textContent = mensagem;
      inputEl.classList.add('captura-palpite__input--erro');
    }

    function pararCronometro(): void {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function atualizarVisualDoTempo(msRestante: number): void {
      const proporcaoRestante = Math.max(0, msRestante / tempoLimiteMs);
      const segundosRestantes = Math.max(0, Math.ceil(msRestante / 1000));

      segundosEl.textContent = `${segundosRestantes}s`;
      progressoEl.style.strokeDashoffset = `${circunferencia * (1 - proporcaoRestante)}`;

      const cor = corPorProporcaoRestante(proporcaoRestante);
      anelContainer.classList.remove(
        'captura-palpite--verde',
        'captura-palpite--amarelo',
        'captura-palpite--vermelho'
      );
      anelContainer.classList.add(`captura-palpite--${cor}`);
    }

    // ---- Envio (garantidamente único) ------------------------------------

    function enviar(payload: {
      palpiteReaisCentavos: number | null;
      tempoRespostaMs: number;
      esgotouTempo: boolean;
    }): void {
      if (jaEnviado) return;
      jaEnviado = true;
      pararCronometro();
      bus.emit('palpite:enviado', payload);
      navegar('calculo-pontuacao');
    }

    function tentarEnvioManual(): void {
      if (jaEnviado) return;

      const centavos = parseReaisParaCentavos(inputEl.value);
      if (centavos === null) {
        mostrarErro('Digite um valor numérico válido (ex.: 12,50).');
        return;
      }

      limparErro();
      const tempoRespostaMs = performance.now() - momentoDeMontagem;
      enviar({
        palpiteReaisCentavos: centavos,
        tempoRespostaMs,
        esgotouTempo: false,
      });
    }

    function aoEsgotarTempo(): void {
      enviar({
        palpiteReaisCentavos: null,
        tempoRespostaMs: tempoLimiteMs,
        esgotouTempo: true,
      });
    }

    // ---- Cronômetro -------------------------------------------------

    atualizarVisualDoTempo(tempoLimiteMs);

    intervalId = setInterval(() => {
      const decorrido = performance.now() - momentoDeMontagem;
      const restante = tempoLimiteMs - decorrido;

      if (restante <= 0) {
        atualizarVisualDoTempo(0);
        aoEsgotarTempo();
        return;
      }

      atualizarVisualDoTempo(restante);
    }, INTERVALO_TICK_MS);

    // ---- Listeners ----------------------------------------------------

    function aoSubmeterForm(evento: SubmitEvent): void {
      evento.preventDefault();
      tentarEnvioManual();
    }

    function aoDigitar(): void {
      if (erroEl.textContent) limparErro();
    }

    form.addEventListener('submit', aoSubmeterForm);
    inputEl.addEventListener('input', aoDigitar);

    // Operável sem mouse: foco automático no campo ao montar.
    inputEl.focus();

    // ---- Teardown -------------------------------------------------------

    return () => {
      pararCronometro();
      form.removeEventListener('submit', aoSubmeterForm);
      inputEl.removeEventListener('input', aoDigitar);
    };
  },
};
