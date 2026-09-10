import type { GameState } from './types';

export const ESTADO_INICIAL: GameState = {
  telaAtiva: 'boas-vindas',
  telaAtual: 'boas-vindas',
  duplas: [],
  rodadaAtual: null,
  historicoRodadas: [],
  cotacoes: {},
  cedulaEmRevelacao: null,
  configuracoes: {
    numeroDeRodadas: 3,
    tempoLimiteSegundosPorPalpite: 30,
    paisesDestaque: ['us', 'jp', 'gb', 'ar', 'mx']
  }
};