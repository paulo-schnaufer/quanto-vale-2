// features/configuracoes/manifesto-cliente.ts
//
// Cliente de leitura do manifesto de cédulas. Deliberadamente fora do
// GameState: nenhuma outra feature além de `configuracoes` precisa da
// lista completa de países disponíveis — as demais só leem
// `configuracoes.paisesDestaque`, que já vem filtrado.

export interface EntradaManifestoCedula {
  paisISO: string;
  nomePais: string;
  codigoISO4217: string;
  denominacao: number;
  arquivo: string;
}

const CAMINHO_MANIFESTO = 'assets/cedulas/cedulas.manifest.json';

// Cache em memória pelo tempo de vida da aplicação: o manifesto não
// muda durante uma sessão do estande, e reabrir o painel de
// configurações (F2 várias vezes) não deve refazer a requisição.
let promessaCache: Promise<EntradaManifestoCedula[]> | null = null;

/**
 * Busca o manifesto de cédulas em `public/assets/cedulas/cedulas.manifest.json`.
 * Lança em caso de falha de rede, HTTP não-2xx ou JSON malformado —
 * quem chama decide como degradar (ver configuracoes.screen.ts).
 */
export async function buscarPaisesDisponiveis(): Promise<EntradaManifestoCedula[]> {
  if (!promessaCache) {
    const base = import.meta.env.BASE_URL ?? '/';
    promessaCache = fetch(`${base}${CAMINHO_MANIFESTO}`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(`Falha ao carregar manifesto de cédulas: HTTP ${resposta.status}`);
        }
        return resposta.json() as Promise<EntradaManifestoCedula[]>;
      })
      .catch((erro) => {
        // Não mantém uma promessa rejeitada em cache: uma falha pontual
        // (ex.: rede instável no estande) não deve bloquear permanentemente
        // futuras tentativas de reabrir o painel.
        promessaCache = null;
        throw erro;
      });
  }
  return promessaCache;
}

/** Extrai os países distintos do manifesto, preservando a ordem de aparição. */
export function paisesUnicos(manifesto: EntradaManifestoCedula[]): EntradaManifestoCedula[] {
  const vistos = new Set<string>();
  const unicos: EntradaManifestoCedula[] = [];
  for (const entrada of manifesto) {
    if (!vistos.has(entrada.paisISO)) {
      vistos.add(entrada.paisISO);
      unicos.push(entrada);
    }
  }
  return unicos;
}
