// features/selecao-objeto/sorteio.ts
//
// Lógica pura (sem DOM, sem bus) da feature — isolada para ser testável
// unitariamente e para deixar mount() em index.ts enxuto.

import type { GameState, ObjetoJogo, RodadaAtual } from '/../core/game-state.types';
import { proximaDuplaDaRodada } from "../../core/screen-router";

export interface ProximoTurno {
  numero: number;
  duplaId: string;
}

/**
 * Determina número da rodada e dupla do próximo turno a jogar, usando
 * exclusivamente `proximaDuplaDaRodada` de core/screen-router.ts (fonte
 * única da regra de turno — nunca reimplementada aqui).
 *
 * Caso a rodada corrente (state.rodadaAtual.numero) já tenha sido jogada
 * por todas as duplas, avança hipoteticamente para numero+1 e repete a
 * consulta — sem mutar o estado real, apenas para reaproveitar a função
 * pura do core. `sessaoTerminou` é responsabilidade de revelacao-cedulas;
 * esta função retorna `null` apenas como guarda defensiva caso seja
 * montada em um estado inconsistente (sessão que já deveria ter
 * terminado).
 */
export function determinarProximoTurno(state: GameState): ProximoTurno | null {
  const numeroAtual = state.rodadaAtual?.numero ?? 1;

  const proximaNaRodadaAtual = proximaDuplaDaRodada(state);
  if (proximaNaRodadaAtual) {
    return { numero: numeroAtual, duplaId: proximaNaRodadaAtual.id };
  }

  const proximoNumero = numeroAtual + 1;
  if (proximoNumero > state.configuracoes.numeroDeRodadas) {
    return null;
  }

  // Clone raso só para reaproveitar proximaDuplaDaRodada, que só lê
  // `.numero` — nunca gravado de volta em GameState (toda escrita
  // acontece via evento, conforme a nota de arquitetura). O spread de
  // `state.rodadaAtual` quando ele é `null` resulta em `{}`, o que é
  // válido em JS e cobre o caso (raro) de o próprio primeiro turno já
  // cair neste ramo.
  const estadoHipotetico: GameState = {
    ...state,
    rodadaAtual: { ...state.rodadaAtual, numero: proximoNumero } as RodadaAtual,
  };

  const proximaNaProximaRodada = proximaDuplaDaRodada(estadoHipotetico);
  return proximaNaProximaRodada
    ? { numero: proximoNumero, duplaId: proximaNaProximaRodada.id }
    : null;
}

/**
 * Sorteia o próximo objeto do catálogo, sem repetir `objeto.id` já
 * presente em `historico` (historicoRodadas) nesta sessão. Se o
 * catálogo se esgotar, permite repetição priorizando os objetos com
 * menor contagem de uso no histórico.
 */
export function sortearObjeto(catalogo: ObjetoJogo[], historico: RodadaAtual[]): ObjetoJogo {
  if (catalogo.length === 0) {
    throw new Error('[selecao-objeto] Catálogo de objetos está vazio.');
  }

  const idsUsados = new Set(
    historico
      .map((rodada) => rodada.objeto?.id)
      .filter((id): id is string => Boolean(id))
  );

  const disponiveis = catalogo.filter((objeto) => !idsUsados.has(objeto.id));
  if (disponiveis.length > 0) {
    return escolherAleatorio(disponiveis);
  }

  // Catálogo esgotado: repete priorizando os menos usados no histórico.
  const contagemDeUso = new Map<string, number>(catalogo.map((objeto) => [objeto.id, 0]));
  for (const rodada of historico) {
    if (rodada.objeto && contagemDeUso.has(rodada.objeto.id)) {
      contagemDeUso.set(rodada.objeto.id, (contagemDeUso.get(rodada.objeto.id) ?? 0) + 1);
    }
  }

  const menorUso = Math.min(...catalogo.map((objeto) => contagemDeUso.get(objeto.id) ?? 0));
  const candidatosMenosUsados = catalogo.filter(
    (objeto) => (contagemDeUso.get(objeto.id) ?? 0) === menorUso
  );

  return escolherAleatorio(candidatosMenosUsados);
}

function escolherAleatorio<T>(itens: T[]): T {
  return itens[Math.floor(Math.random() * itens.length)];
}
