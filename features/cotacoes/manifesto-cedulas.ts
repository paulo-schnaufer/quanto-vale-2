/**
 * Feature: cotacoes
 *
 * Resolve, a partir do manifesto de cédulas, quais códigos de moeda
 * (ISO 4217) correspondem aos países em `configuracoes.paisesDestaque`.
 *
 * Isolado em módulo próprio porque é a única parte desta feature que
 * depende de um artefato externo ao `core/` (o manifesto público de
 * cédulas), além da própria API de câmbio.
 */

const MANIFESTO_URL = '/assets/cedulas/cedulas.manifest.json';

interface EntradaManifestoCedulas {
  paisISO: string;
  codigoISO4217: string;
  [chave: string]: unknown; // demais campos do manifesto não interessam aqui
}

/**
 * Busca o manifesto e retorna a lista (deduplicada) de códigos de moeda
 * referenciados pelos países em `paisesDestaque`.
 *
 * Lança em qualquer falha (fetch, parse, shape inesperado) — o chamador
 * decide o que fazer com isso (nesta feature, sempre cair no fallback
 * geral, ver `cotacoes-fallback.ts`).
 */
export async function resolverMoedasDosPaises(
  paisesDestaque: readonly string[],
  signal: AbortSignal
): Promise<string[]> {
  const resposta = await fetch(MANIFESTO_URL, { signal });
  if (!resposta.ok) {
    throw new Error(`Manifesto de cédulas indisponível (HTTP ${resposta.status})`);
  }

  const entradas = (await resposta.json()) as unknown;
  if (!Array.isArray(entradas)) {
    throw new Error('Manifesto de cédulas malformado: raiz não é um array');
  }

  const paisesBuscados = new Set(paisesDestaque);
  const moedas = new Set<string>();

  for (const entrada of entradas as EntradaManifestoCedulas[]) {
    const paisISO = entrada?.paisISO;
    const codigoISO4217 = entrada?.codigoISO4217;
    if (
      typeof paisISO === 'string' &&
      typeof codigoISO4217 === 'string' &&
      paisesBuscados.has(paisISO)
    ) {
      moedas.add(codigoISO4217.toUpperCase());
    }
  }

  return [...moedas];
}
