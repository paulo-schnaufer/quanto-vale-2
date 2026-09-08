// features/calculo-pontuacao/view.ts
//
// Helpers puramente de apresentação: nenhum deles lê ctx.state ou toca
// no bus. Mantidos separados de index.ts para deixar o mount() legível.

import type { FaixaPontuacao } from '../../core/game-state.types';

const FORMATADOR_BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatarCentavos(centavos: number | null): string {
  if (centavos === null) return '—';
  return FORMATADOR_BRL.format(centavos / 100);
}

export interface ApresentacaoFaixa {
  titulo: string;
  corVar: string; // nome da CSS var definida em style.css
}

/**
 * esgotouTempo é tratado como um caso de mensagem à parte ("tempo esgotado"),
 * mesmo a faixa resultante sendo 'zero' — para não confundir a dupla com um
 * "Não foi dessa vez" quando na verdade ela nem chegou a responder.
 */
export function apresentacaoParaResultado(
  faixa: FaixaPontuacao,
  esgotouTempo: boolean
): ApresentacaoFaixa {
  if (esgotouTempo) {
    return { titulo: 'Tempo esgotado!', corVar: '--faixa-zero' };
  }

  switch (faixa) {
    case 'maxima':
      return { titulo: 'Mandou bem!', corVar: '--faixa-maxima' };
    case 'media':
      return { titulo: 'Quase lá!', corVar: '--faixa-media' };
    case 'baixa':
      return { titulo: 'Quase lá!', corVar: '--faixa-baixa' };
    case 'zero':
    default:
      return { titulo: 'Não foi dessa vez', corVar: '--faixa-zero' };
  }
}
