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
    const telaAtual = store.getState().telaAtual;
    if (telaAtual === 'boas-vindas' || telaAtual === 'placar-vitrine') {
      navegarPara('configuracoes');
    }
  }
});

bus.on('pontuacao:calculada', ({ duplaId, rodadaConcluida }) => {
  const state = store.getState();
  const duplasAtualizadas = [...state.duplas];
  const indexDupla = duplasAtualizadas.findIndex((d) => d.id === duplaId);
  if (indexDupla !== -1) {
    const dupla = { ...duplasAtualizadas[indexDupla] };
    dupla.pontuacaoTotal += rodadaConcluida.resultado.pontosGanhos;
    duplasAtualizadas[indexDupla] = dupla;
  }
  store.setState({
    rodadaAtual: rodadaConcluida,
    duplas: duplasAtualizadas,
    historicoRodadas: [...state.historicoRodadas, rodadaConcluida]
  });
});

bus.on('sessao:reiniciada', () => {
  store.setState({ duplas: [], rodadaAtual: null, historicoRodadas: [], cedulaEmRevelacao: null });
});

bus.on('duplas:definidas', ({ duplas }) => store.setState({ duplas }));
bus.on('objeto:selecionado', ({ objeto }) => store.setState({ rodadaAtual: { ...store.getState().rodadaAtual, objeto, palpites: [] } }));
bus.on('cedula:revelada', (payload) => store.setState({ rodadaAtual: { ...store.getState().rodadaAtual, cedulaEmRevelacao: payload } }));
bus.on('configuracoes:atualizadas', (nov) => store.setState({ configuracoes: { ...store.getState().configuracoes, ...nov } }));
bus.on('palpite:enviado', (payload) => {
  const state = store.getState();
  const duplaAtual = proximaDuplaDaRodada(state);
  if (!duplaAtual) return;
  const novoPalpite = { duplaId: duplaAtual.id, ...payload };
  store.setState({ rodadaAtual: { ...state.rodadaAtual, palpites: [...(state.rodadaAtual?.palpites || []), novoPalpite] } });
});

iniciarCotacoes(bus);
navegarPara('boas-vindas');