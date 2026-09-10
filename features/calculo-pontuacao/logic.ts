// features/calculo-pontuacao/logic.ts
//
// Funções puras de cálculo. Não tocam no DOM, no EventBus nem no store —
// isso facilita testar a fórmula isoladamente e mantém mount() enxuto.

import type {
  RodadaAtual,
  ResultadoRodada,
  FaixaPontuacao,
} from '../../core/game-state.types';

/** Pontuação fixa por faixa, conforme spec da feature. */
export const PONTOS_POR_FAIXA: Record<FaixaPontuacao, number> = {
  maxima: 1000,
  media: 600,
  baixa: 250,
  zero: 0,
};

/**
 * erroPercentualAbsoluto = |palpite - preco| / preco
 *
 * Guarda defensiva (preco === 0):
 *   - palpite também 0  -> erro 0
 *   - qualquer outro caso (inclui palpite null/undefined) -> erro 1 (máximo)
 */
export function calcularErroPercentualAbsoluto(
  precoReaisCentavos: number,
  palpiteReaisCentavos: number | null
): number {
  if (precoReaisCentavos === 0) {
    return palpiteReaisCentavos === 0 ? 0 : 1;
  }

  if (palpiteReaisCentavos === null || palpiteReaisCentavos === undefined) {
    // Não deveria acontecer quando esgotouTempo === false (captura-palpite
    // garante palpite não-nulo nesse caso), mas o guard evita NaN/Infinity
    // se o contrato for violado por algum motivo.
    return 1;
  }

  return Math.abs(palpiteReaisCentavos - precoReaisCentavos) / precoReaisCentavos;
}

/** Limites inclusivos na borda superior de cada faixa (ver critérios de aceite: erro == 0.05 -> 'maxima'). */
export function faixaPorErro(erroPercentualAbsoluto: number): FaixaPontuacao {
  if (erroPercentualAbsoluto <= 0.05) return 'maxima';
  if (erroPercentualAbsoluto <= 0.15) return 'media';
  if (erroPercentualAbsoluto <= 0.3) return 'baixa';
  return 'zero';
}

/**
 * Calcula o ResultadoRodada completo a partir da rodada corrente.
 *
 * Regra de prioridade: esgotouTempo === true sempre força faixa 'zero' e
 * pontosGanhos: 0, independentemente do erro percentual (que ainda é
 * reportado no resultado para fins de exibição/telemetria, mas não
 * influencia a pontuação).
 */
export function calcularResultado(rodada: RodadaAtual): ResultadoRodada {
  const precoReaisCentavos = rodada.objeto?.precoReaisCentavos ?? 0;
  const erroPercentualAbsoluto = calcularErroPercentualAbsoluto(
    precoReaisCentavos,
    rodada.palpiteReaisCentavos
  );

  if (rodada.esgotouTempo) {
    return {
      erroPercentualAbsoluto,
      faixa: 'zero',
      pontosGanhos: 0,
    };
  }

  const faixa = faixaPorErro(erroPercentualAbsoluto);
  return {
    erroPercentualAbsoluto,
    faixa,
    pontosGanhos: PONTOS_POR_FAIXA[faixa],
  };
}
