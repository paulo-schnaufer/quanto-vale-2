import './shared/theme.css';
import { store } from './core/store';
import { bus } from './core/events';
import { navegarPara, registrarScreen, proximaDuplaDaRodada } from './core/screen-router';

import { iniciarCotacoes } from './features/cotacoes';
import { calculoPontuacaoScreen } from './features/calculo-pontuacao';
import { boasVindasScreen, setupDuplasScreen } from './features/setup-duplas';
import { selecaoObjetoScreen } from './features/selecao-objeto';
import { capturaPalpiteScreen } from './features/captura-palpite';
import { revelacaoCedulasScreen } from './features/revelacao-cedulas';
import { configuracoesScreen } from './features/configuracoes';
import { placarVitrineScreen } from './features/placar-vitrine';

registrarScreen(calculoPontuacaoScreen);
registrarScreen(boasVindasScreen);
registrarScreen(setupDuplasScreen);
registrarScreen(selecaoObjetoScreen);
registrarScreen(capturaPalpiteScreen);
registrarScreen(revelacaoCedulasScreen);
registrarScreen(configuracoesScreen);
registrarScreen(placarVitrineScreen);

window.addEventListener('keydown', (evento) => {
  if (evento.key === 'F2') {
    evento.preventDefault();
    const telaAtual = store.getState().telaAtual || store.getState().telaAtiva;
    if (telaAtual === 'boas-vindas' || telaAtual === 'placar-vitrine') {
      navegarPara('configuracoes');
    }
  }
});

bus.on('pontuacao:calculada', (payload: any) => {
  const { duplaId, rodadaConcluida } = payload || {};
  const state = store.getState();
  const duplasAtualizadas = [...(state.duplas || [])];
  const indexDupla = duplasAtualizadas.findIndex((d) => d.id === duplaId);
  if (indexDupla !== -1) {
    const dupla = { ...duplasAtualizadas[indexDupla] };
    dupla.pontuacaoTotal = (dupla.pontuacaoTotal || 0) + (rodadaConcluida?.resultado?.pontosGanhos || 0);
    duplasAtualizadas[indexDupla] = dupla;
  }
  store.setState({
    rodadaAtual: rodadaConcluida,
    duplas: duplasAtualizadas,
    historicoRodadas: [...(state.historicoRodadas || []), rodadaConcluida]
  });
});

bus.on('sessao:reiniciada', () => {
  store.setState({ duplas: [], rodadaAtual: null, historicoRodadas: [], cedulaEmRevelacao: null });
});

bus.on('duplas:definidas', (payload: any) => store.setState({ duplas: payload?.duplas || [] }));

bus.on('objeto:selecionado', (payload: any) => {
  const rodadaAntiga = store.getState().rodadaAtual || {};
  store.setState({ rodadaAtual: { ...rodadaAntiga, objeto: payload?.objeto, palpites: [] } });
});

bus.on('cedula:revelada', (payload: any) => {
  const rodadaAntiga = store.getState().rodadaAtual || {};
  store.setState({ rodadaAtual: { ...rodadaAntiga, cedulaEmRevelacao: payload } });
});

bus.on('configuracoes:atualizadas', (novasConfig: any) => {
  const configAntiga = store.getState().configuracoes || {};
  store.setState({ configuracoes: { ...configAntiga, ...novasConfig } });
});

bus.on('palpite:enviado', (payload: any) => {
  const state = store.getState();
  const duplaAtual = proximaDuplaDaRodada(state);
  if (!duplaAtual) return;
  const novoPalpite = { duplaId: duplaAtual.id, ...payload };
  const rodadaAntiga = state.rodadaAtual || {};
  const palpitesAntigos = rodadaAntiga.palpites || [];
  store.setState({ rodadaAtual: { ...rodadaAntiga, palpites: [...palpitesAntigos, novoPalpite] } });
});

iniciarCotacoes(bus);
navegarPara('boas-vindas');