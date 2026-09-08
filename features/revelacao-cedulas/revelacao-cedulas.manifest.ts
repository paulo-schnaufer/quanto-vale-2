// features/revelacao-cedulas/revelacao-cedulas.manifest.ts
//
// Leitura do manifesto de cédulas (public/assets/cedulas/cedulas.manifest.json).
// Fica fora de GameState — assim como a feature `configuracoes` faz sua
// própria leitura do mesmo arquivo para listar países disponíveis, cada
// feature que precisa do manifesto o busca por conta própria.

export interface CedulaManifestoEntry {
  paisISO: string;
  nomePais: string;
  codigoISO4217: string;
  denominacao: number;
  arquivo: string;
}

const MANIFESTO_URL = '/assets/cedulas/cedulas.manifest.json';

let manifestoCache: Promise<CedulaManifestoEntry[]> | null = null;

/**
 * Busca o manifesto uma única vez por sessão de app (arquivo estático local,
 * não muda em runtime) e reutiliza a mesma Promise em chamadas seguintes,
 * inclusive concorrentes. Em caso de falha, limpa o cache para permitir
 * nova tentativa no próximo turno, em vez de travar a feature pelo resto
 * da sessão.
 */
export function carregarManifestoCedulas(): Promise<CedulaManifestoEntry[]> {
  if (!manifestoCache) {
    manifestoCache = fetch(MANIFESTO_URL)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(`Manifesto de cédulas respondeu HTTP ${resposta.status}`);
        }
        return resposta.json() as Promise<CedulaManifestoEntry[]>;
      })
      .catch((erro) => {
        manifestoCache = null;
        throw erro;
      });
  }
  return manifestoCache;
}

/** Caminho público da imagem da cédula, a partir do nome de arquivo do manifesto. */
export function caminhoImagemCedula(arquivo: string): string {
  return `/assets/cedulas/${arquivo}`;
}
