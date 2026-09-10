// features/configuracoes/validacao.ts
//
// Regras de negócio da feature, isoladas em funções puras — sem DOM,
// sem bus, sem estado global. Facilita testar a validação isoladamente
// e manter o handler de submit do formulário burro (só orquestra).

import type { ConfiguracoesJogo } from '../../core/game-state.types';

export const LIMITES = {
  numeroDeRodadas: { min: 1, max: 15 },
  tempoLimiteSegundosPorPalpite: { min: 5, max: 60 },
  paisesDestaqueMinimo: 3,
} as const;

export interface ErrosValidacao {
  numeroDeRodadas?: string;
  tempoLimiteSegundosPorPalpite?: string;
  paisesDestaque?: string;
}

export interface EntradaFormulario {
  /** Já convertido para número pelo chamador; NaN se o campo estava vazio ou não-numérico. */
  numeroDeRodadas: number;
  tempoLimiteSegundosPorPalpite: number;
  paisesDestaque: string[];
  /**
   * Total de países distintos no manifesto. Usa-se `Infinity` enquanto o
   * manifesto ainda não carregou, para não gerar um erro de "máximo"
   * artificial antes de sabermos o valor real — nesse meio-tempo o
   * mínimo de 3 já bloqueia o salvamento de qualquer forma, porque não
   * há checkboxes para marcar.
   */
  totalDePaisesNoManifesto: number;
}

function ehInteiro(valor: number): boolean {
  return Number.isInteger(valor);
}

/** Valida os campos do formulário contra os limites da spec. Campo ausente no retorno = válido. */
export function validar(entrada: EntradaFormulario): ErrosValidacao {
  const erros: ErrosValidacao = {};

  const { min: minRodadas, max: maxRodadas } = LIMITES.numeroDeRodadas;
  if (!ehInteiro(entrada.numeroDeRodadas)) {
    erros.numeroDeRodadas = 'Informe um número inteiro.';
  } else if (entrada.numeroDeRodadas < minRodadas || entrada.numeroDeRodadas > maxRodadas) {
    erros.numeroDeRodadas = `Deve estar entre ${minRodadas} e ${maxRodadas}.`;
  }

  const { min: minTempo, max: maxTempo } = LIMITES.tempoLimiteSegundosPorPalpite;
  if (!ehInteiro(entrada.tempoLimiteSegundosPorPalpite)) {
    erros.tempoLimiteSegundosPorPalpite = 'Informe um número inteiro.';
  } else if (
    entrada.tempoLimiteSegundosPorPalpite < minTempo ||
    entrada.tempoLimiteSegundosPorPalpite > maxTempo
  ) {
    erros.tempoLimiteSegundosPorPalpite = `Deve estar entre ${minTempo} e ${maxTempo}.`;
  }

  const minPaises = LIMITES.paisesDestaqueMinimo;
  const maxPaises = entrada.totalDePaisesNoManifesto;
  if (entrada.paisesDestaque.length < minPaises) {
    erros.paisesDestaque = `Selecione pelo menos ${minPaises} países.`;
  } else if (entrada.paisesDestaque.length > maxPaises) {
    // Defensivo: inatingível via checkboxes normais (não há como marcar
    // mais países do que o manifesto oferece), mas protege contra um
    // estado de seleção inconsistente vindo de fora desta função.
    erros.paisesDestaque = `Selecione no máximo ${maxPaises} países.`;
  }

  return erros;
}

export function formularioValido(erros: ErrosValidacao): boolean {
  return Object.keys(erros).length === 0;
}

/** Monta o payload de `configuracoes:atualizadas` a partir de uma entrada já validada. */
export function construirConfiguracoes(entrada: EntradaFormulario): ConfiguracoesJogo {
  return {
    numeroDeRodadas: entrada.numeroDeRodadas,
    tempoLimiteSegundosPorPalpite: entrada.tempoLimiteSegundosPorPalpite,
    paisesDestaque: [...entrada.paisesDestaque],
  };
}
