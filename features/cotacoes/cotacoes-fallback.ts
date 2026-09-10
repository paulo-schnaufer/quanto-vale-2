import type { CotacaoMoeda } from '../../core/types';

/**
 * Feature: cotacoes
 *
 * Valores fixos de fallback (BRL por unidade de moeda estrangeira).
 * Assunção documentada na spec do projeto — NÃO são taxas de câmbio
 * reais/precisas; revisar periodicamente.
 */
export const VALORES_FALLBACK: Record<string, number> = {
  USD: 5.4,
  EUR: 5.9,
  GBP: 6.8,
  JPY: 0.036,
  ARS: 0.0055,
  MXN: 0.32,
};

/**
 * Mapa estático país (alpha-2) → moeda (ISO 4217), usado SOMENTE quando o
 * fallback precisa ser calculado sem depender do manifesto de cédulas
 * (ex.: o próprio fetch do manifesto também falhou). Cobre os países
 * default de `ESTADO_INICIAL` mais os principais países da zona do euro,
 * para não deixar um `paisesDestaque` europeu sem cotação de fallback.
 */
const PAIS_PARA_MOEDA_FALLBACK: Record<string, string> = {
  us: 'USD',
  jp: 'JPY',
  gb: 'GBP',
  ar: 'ARS',
  mx: 'MXN',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
  pt: 'EUR',
};

function construirCotacaoFallback(codigoISO4217: string, agora: string): CotacaoMoeda {
  return {
    codigoISO4217,
    valorEmReais: VALORES_FALLBACK[codigoISO4217] ?? 0,
    atualizadoEm: agora,
    origem: 'fallback-local',
  };
}

/**
 * Monta o conjunto completo de `CotacaoMoeda` em fallback para os países
 * em `paisesDestaque`, sem depender de rede.
 *
 * Se nenhum país for reconhecido pelo mapa estático (situação-limite,
 * ex.: `paisesDestaque` só contém países fora do mapa acima), cai para
 * todo o conjunto de moedas de `VALORES_FALLBACK`, garantindo que
 * `cotacoes:atualizadas` nunca seja emitido vazio.
 */
export function construirTodasCotacoesFallback(
  paisesDestaque: readonly string[]
): Record<string, CotacaoMoeda> {
  const agora = new Date().toISOString();

  const moedas = new Set<string>();
  for (const pais of paisesDestaque) {
    const moeda = PAIS_PARA_MOEDA_FALLBACK[pais];
    if (moeda) moedas.add(moeda);
  }

  const listaFinal = moedas.size > 0 ? [...moedas] : Object.keys(VALORES_FALLBACK);

  const resultado: Record<string, CotacaoMoeda> = {};
  for (const moeda of listaFinal) {
    resultado[moeda] = construirCotacaoFallback(moeda, agora);
  }
  return resultado;
}
