export type FaixaPontuacao = 'maxima' | 'media' | 'baixa' | 'zero';

export interface Dupla {
  id: string;
  nomeExibicao: string;
  pontuacaoTotal: number;
  ordem: number;
  [key: string]: any;
}

export interface ObjetoJogo {
  id: string;
  nome: string;
  imagemUrl: string;
  precoReaisCentavos: number;
  categoria?: string;
  [key: string]: any;
}

export interface ResultadoRodada {
  erroPercentualAbsoluto: number;
  faixa: FaixaPontuacao;
  pontosGanhos: number;
  [key: string]: any;
}

export interface RodadaAtual {
  numero: number;
  duplaId?: string;
  objeto: ObjetoJogo | null;
  palpiteReaisCentavos?: number | null;
  tempoRespostaMs?: number | null;
  esgotouTempo?: boolean;
  resultado?: ResultadoRodada | null;
  palpites?: any[];
  cedulaEmRevelacao?: any;
  [key: string]: any;
}

export interface CotacaoMoeda {
  codigoISO4217: string;
  valorEmReais: number;
  atualizadoEm: string;
  origem: 'api' | 'fallback-local';
}

export interface CedulaEmRevelacao {
  paisISO: string;
  codigoISO4217: string;
  denominacao: number;
  imagemPath: string;
}

export interface ConfiguracoesJogo {
  numeroDeRodadas: number;
  tempoLimiteSegundosPorPalpite: number;
  paisesDestaque: string[];
  [key: string]: any;
}

export interface GameState {
  telaAtiva?: string;
  telaAtual?: string;
  duplas: Dupla[];
  rodadaAtual: RodadaAtual | null;
  historicoRodadas: RodadaAtual[];
  cotacoes: Record<string, CotacaoMoeda>;
  cedulaEmRevelacao: CedulaEmRevelacao | null;
  configuracoes: ConfiguracoesJogo;
  [key: string]: any;
}

export type Objeto = ObjetoJogo;
export type Palpite = any;
export type EventBus = any;