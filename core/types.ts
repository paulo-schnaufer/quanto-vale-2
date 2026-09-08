export type TelaAtiva = 
  | 'boas-vindas' 
  | 'setup-duplas' 
  | 'selecao-objeto' 
  | 'captura-palpite' 
  | 'cotacoes' 
  | 'calculo-pontuacao' 
  | 'revelacao-cedulas' 
  | 'placar-vitrine' 
  | 'configuracoes';

export interface Dupla {
  id: string;
  nome: string;
}

export interface ObjetoSorteado {
  id: string;
  nome: string;
  valorOriginalBRL: number;
  categoria: string;
  imagemUrl?: string;
}

export interface PalpiteDupla {
  duplaId: string;
  valorPalpitadoBRL: number;
}

export interface CotacaoMoeda {
  paisISO: string;
  codigoISO4217: string;
  taxaParaBRL: number;
  dataAtualizacao: string;
  origem: 'api' | 'fallback';
}

export interface PontuacaoRodada {
  duplaId: string;
  palpiteBRL: number;
  diferencaAbsoluta: number;
  pontosGanhos: number;
}

export interface HistoricoRodada {
  numeroRodada: number;
  objeto: ObjetoSorteado;
  palpites: PalpiteDupla[];
  pontuacoes: PontuacaoRodada[];
}

export interface ConfiguracoesApp {
  numeroDeRodadas: number;
  tempoLimiteSegundosPorPalpite: number;
  paisesDestaque: string[];
}

export interface GameState {
  telaAtiva: TelaAtiva;
  rodadaAtual: number;
  duplas: Dupla[];
  objetoAtual: ObjetoSorteado | null;
  palpitesRodadaAtual: PalpiteDupla[];
  cotacoes: Record<string, CotacaoMoeda>;
  historicoRodadas: HistoricoRodada[];
  configuracoes: ConfiguracoesApp;
}