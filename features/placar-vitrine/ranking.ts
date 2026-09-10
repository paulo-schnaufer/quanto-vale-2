// features/placar-vitrine/ranking.ts
import type { Dupla } from '../../core/game-state.types';

/**
 * Uma dupla já posicionada no ranking final.
 * `posicao` é 1-indexed e compartilhada entre duplas empatadas
 * (ex.: dois 1º lugares -> o próximo ocupa a posição 3, não 2).
 */
export interface DuplaRankeada {
  dupla: Dupla;
  posicao: number;
  empatada: boolean;
}

/**
 * Constrói o ranking final a partir de `duplas`, sem mutar o array
 * original (regra: nunca escrever em GameState).
 *
 * Ordenação: pontuacaoTotal decrescente; em empate, `ordem` crescente
 * como critério de desempate estável (não altera a posição exibida,
 * apenas garante determinismo na ordem interna do grupo empatado).
 *
 * Posição: duplas com a mesma pontuacaoTotal recebem a mesma `posicao`
 * e são marcadas com `empatada: true`. A próxima posição distinta pula
 * o número de duplas empatadas (competition ranking / "1224").
 */
export function construirRanking(duplas: readonly Dupla[]): DuplaRankeada[] {
  const ordenadas = [...duplas].sort((a, b) => {
    if (b.pontuacaoTotal !== a.pontuacaoTotal) {
      return b.pontuacaoTotal - a.pontuacaoTotal;
    }
    return a.ordem - b.ordem;
  });

  const resultado: DuplaRankeada[] = [];

  for (let i = 0; i < ordenadas.length; i++) {
    const dupla = ordenadas[i];
    const anterior = ordenadas[i - 1];
    const proxima = ordenadas[i + 1];

    const mesmaPontuacaoQueAnterior =
      anterior !== undefined && anterior.pontuacaoTotal === dupla.pontuacaoTotal;
    const mesmaPontuacaoQueProxima =
      proxima !== undefined && proxima.pontuacaoTotal === dupla.pontuacaoTotal;

    const posicao = mesmaPontuacaoQueAnterior
      ? resultado[i - 1].posicao
      : i + 1;

    resultado.push({
      dupla,
      posicao,
      empatada: mesmaPontuacaoQueAnterior || mesmaPontuacaoQueProxima,
    });
  }

  return resultado;
}
