import type { CotacaoMoeda } from '../../core/types';
import { resolverMoedasDosPaises } from './manifesto-cedulas';

/**
 * Feature: cotacoes
 *
 * Integração com a API pública AwesomeAPI (economia.awesomeapi.com.br),
 * escolhida por retornar diretamente "BRL por unidade de moeda
 * estrangeira" (campo `bid`), sem exigir inversão de taxa no cliente —
 * único requisito da spec quanto à escolha da API.
 *
 * Endpoint: GET https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,...
 */

const API_BASE_URL = 'https://economia.awesomeapi.com.br/last';

interface EntradaAwesomeApi {
  bid?: string;
}

/**
 * Busca as cotações de câmbio para as moedas referenciadas pelos países
 * em `paisesDestaque` (via manifesto de cédulas).
 *
 * Lança em qualquer falha — rede, timeout (via `signal`), JSON inválido,
 * ou valor não numérico/não positivo para qualquer moeda esperada — para
 * que o chamador aplique o fallback completo, conforme a regra "qualquer
 * falha cai para fallback" da spec. Nunca retorna um resultado parcial
 * misturando `origem: 'api'` e `origem: 'fallback-local'`.
 */
export async function buscarCotacoesViaApi(
  paisesDestaque: readonly string[],
  signal: AbortSignal
): Promise<Record<string, CotacaoMoeda>> {
  const moedas = await resolverMoedasDosPaises(paisesDestaque, signal);
  if (moedas.length === 0) {
    throw new Error('Nenhuma moeda resolvida a partir do manifesto de cédulas');
  }

  const pares = moedas.map((moeda) => `${moeda}-BRL`).join(',');
  const resposta = await fetch(`${API_BASE_URL}/${pares}`, { signal });
  if (!resposta.ok) {
    throw new Error(`API de câmbio indisponível (HTTP ${resposta.status})`);
  }

  const corpo = (await resposta.json()) as Record<string, EntradaAwesomeApi>;
  const agora = new Date().toISOString();
  const resultado: Record<string, CotacaoMoeda> = {};

  for (const moeda of moedas) {
    const chave = `${moeda}BRL`;
    const valor = Number(corpo?.[chave]?.bid);
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new Error(`Cotação ausente ou malformada para ${moeda}`);
    }
    resultado[moeda] = {
      codigoISO4217: moeda,
      valorEmReais: valor,
      atualizadoEm: agora,
      origem: 'api',
    };
  }

  return resultado;
}
