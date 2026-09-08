import './shared/theme.css';
import { store } from './core/store';
import { bus } from './core/events';
import { iniciarCotacoes } from './features/cotacoes';
import { calculoPontuacaoScreen } from './features/calculo-pontuacao';
import { boasVindasScreen, setupDuplasScreen } from './features/setup-duplas';
import { selecaoObjetoScreen } from './features/selecao-objeto';

const screens = new Map();
function registrarScreen(screen) {
  screens.set(screen.id, screen);
  console.log(`[Núcleo] Tela registrada: ${screen.id}`);
}
registrarScreen(calculoPontuacaoScreen);
registrarScreen(boasVindasScreen);
registrarScreen(setupDuplasScreen);
registrarScreen(selecaoObjetoScreen);

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

  console.log(`[Núcleo] Pontuação aplicada! Dupla ${duplaId} ganhou ${rodadaConcluida.resultado.pontosGanhos} pontos.`);
});

const appDiv = document.querySelector<HTMLDivElement>('#app');

if (appDiv) {
  appDiv.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h1>Quanto Vale? 2.0</h1>
      <p>Aguardando integração das telas...</p>
    </div>
  `;
}

bus.on('cotacoes:atualizadas', (payload) => {
  console.log('[Núcleo] Cotações atualizadas recebidas:', payload);
});

bus.on('STATE_CHANGED', (state) => {
  console.log('[Core Store Update]:', state);
});

bus.on('sessao:reiniciada', () => {
  store.setState({
    duplas: [],
    rodadaAtual: null,
    historicoRodadas: [],
    cedulaEmRevelacao: null
  });
  console.log('[Núcleo] Sessão reiniciada. Estado limpo.');
});

bus.on('duplas:definidas', ({ duplas }) => {
  store.setState({ duplas });
  console.log('[Núcleo] Duplas definidas no estado:', duplas);
});

bus.on('rodada:iniciada', (payload) => {
  console.log(`[Núcleo] Iniciando turno da dupla ${payload.duplaId} na rodada ${payload.numero}`);
});

bus.on('objeto:selecionado', ({ objeto }) => {
  const state = store.getState();
  
  const rodadaAtual = {
    ...state.rodadaAtual,
    objeto: objeto,
    palpites: []
  };

  store.setState({ rodadaAtual });
  console.log('[Núcleo] Objeto sorteado e salvo no estado:', objeto.nome);
});

iniciarCotacoes(bus);

console.log('Setup de Cotações Iniciado. Estado atual:', store.getState());