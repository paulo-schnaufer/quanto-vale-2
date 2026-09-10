// features/revelacao-cedulas/revelacao-cedulas.logic.ts
//
// Funções puras da feature revelacao-cedulas. Isoladas do DOM e do bus
// para permitir teste unitário direto e deixar as regras de negócio
// legíveis fora do ruído de mount()/teardown().

import type { GameState, CotacaoMoeda } from '../../core/game-state.types';
import type { CedulaManifestoEntry } from './revelacao-cedulas.manifest';

/**
 * País-destaque do turno corrente, por round-robin determinístico sobre
 * `configuracoes.paisesDestaque`: rodada 1 → índice 0, rodada 2 → índice 1,
 * reiniciando do começo se houver mais rodadas que países cadastrados.
 * Sem sorteio — a ordem é sempre a mesma para o mesmo número de rodada.
 *
 * Pressupõe `rodadaAtual` já montado: por contrato de fluxo, esta tela só
 * monta depois de calculo-pontuacao, que já depende de rodadaAtual existir.
 * O fallback `?? 1` cobre apenas chamadas de teste fora desse fluxo.
 */
export function paisDoTurno(
  state: Pick<GameState, 'rodadaAtual' | 'configuracoes'>
): string {
  const paises = state.configuracoes.paisesDestaque;
  if (paises.length === 0) {
    throw new Error(
      '[revelacao-cedulas] configuracoes.paisesDestaque está vazio — impossível determinar o país do turno.'
    );
  }
  const numero = state.rodadaAtual?.numero ?? 1;
  const indice = (numero - 1) % paises.length;
  return paises[indice];
}

/**
 * Primeira entrada do manifesto cujo paisISO bate com o país informado.
 * Se houver mais de uma denominação cadastrada para o mesmo país, a ordem
 * de declaração no JSON decide — comportamento de Array.find.
 */
export function encontrarCedula(
  manifesto: CedulaManifestoEntry[],
  paisISO: string
): CedulaManifestoEntry | undefined {
  return manifesto.find((entrada) => entrada.paisISO === paisISO);
}

export interface ConversaoCedula {
  valorConvertido: number;
  quantidadeDeNotas: number;
}

/**
 * Converte o preço do objeto para a moeda da cédula e calcula quantas
 * notas ele "vale". Retorna null quando a cotação da moeda ainda não
 * está disponível — quem chama decide como exibir esse estado transitório.
 */
export function calcularConversao(
  precoReaisCentavos: number,
  cotacao: CotacaoMoeda | undefined,
  denominacao: number
): ConversaoCedula | null {
  if (!cotacao) return null;
  const valorConvertido = precoReaisCentavos / 100 / cotacao.valorEmReais;
  const quantidadeDeNotas = Math.max(1, Math.round(valorConvertido / denominacao));
  return { valorConvertido, quantidadeDeNotas };
}

/** Formata o texto de destaque: "≈ N notas de [denominação] [moeda]". */
export function formatarTextoNotas(
  quantidadeDeNotas: number,
  denominacao: number,
  codigoISO4217: string
): string {
  const denominacaoFormatada = new Intl.NumberFormat('pt-BR').format(denominacao);
  const substantivo = quantidadeDeNotas === 1 ? 'nota' : 'notas';
  return `≈ ${quantidadeDeNotas} ${substantivo} de ${denominacaoFormatada} ${codigoISO4217}`;
}
