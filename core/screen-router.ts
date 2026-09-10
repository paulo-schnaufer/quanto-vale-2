import { store } from './store';
import { bus } from './events';
import type { ScreenId, Screen, ScreenContext, Teardown } from './screen-contract';

export type { ScreenId };

const screens = new Map<ScreenId, Screen>();
let teardownAtual: Teardown | void = undefined;

export function registrarScreen(screen: Screen): void {
  if (!screen) return;
  screens.set(screen.id, screen);
  console.log(`[Router] Tela registrada no mapa oficial: ${screen.id}`);
}

export function navegarPara(id: ScreenId): void {
  const screen = screens.get(id);
  if (!screen) {
    console.error(`[Router] Tela não encontrada: ${id}. Telas que existem no mapa:`, Array.from(screens.keys()));
    return;
  }

  const appDiv = document.querySelector<HTMLElement>('#app');
  if (!appDiv) return;

  if (teardownAtual) teardownAtual();
  appDiv.innerHTML = '';

  const context: ScreenContext = {
    state: store.getState(),
    navegar: navegarPara,
    bus: bus
  };

  teardownAtual = screen.mount(appDiv, context);
  store.setState({ telaAtual: id });
  console.log(`[Router] Navegou para: ${id}`);
}

export function proximaDuplaDaRodada(state: any) {
  if (!state.duplas || state.duplas.length === 0) return null;
  const palpitesDaRodada = state.rodadaAtual?.palpites || [];
  const duplasQueJaJogaram = new Set(palpitesDaRodada.map((p: any) => p.duplaId));
  const proxima = state.duplas.find((dupla: any) => !duplasQueJaJogaram.has(dupla.id));
  return proxima || null;
}

export function sessaoTerminou(state: any): boolean {
  const totalRodadas = state.configuracoes?.numeroDeRodadas || 3;
  const numeroAtual = state.rodadaAtual?.numero || 1;
  const proxima = proximaDuplaDaRodada(state);
  return numeroAtual >= totalRodadas && proxima === null;
}