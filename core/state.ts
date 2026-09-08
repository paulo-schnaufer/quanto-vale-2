import { GameState } from './types';

export const ESTADO_INICIAL: GameState = {
  telaAtiva: 'boas-vindas',
  rodadaAtual: 1,
  duplas: [],
  objetoAtual: null,
  palpitesRodadaAtual: [],
  cotacoes: {},
  historicoRodadas: [],
  configuracoes: {
    numeroDeRodadas: 3,
    tempoLimiteSegundosPorPalpite: 30,
    paisesDestaque: ['us', 'jp', 'gb', 'ar', 'mx']
  }
};