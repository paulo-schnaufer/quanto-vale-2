import './shared/theme.css';
import { store } from './core/store';
import { bus } from './core/events';
import { iniciarCotacoes } from './features/cotacoes';

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

iniciarCotacoes(bus);

console.log('Setup de Cotações Iniciado. Estado atual:', store.getState());