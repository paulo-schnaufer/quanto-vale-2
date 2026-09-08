import './shared/theme.css';
import { store } from './core/store';
import { bus } from './core/events';

const appDiv = document.querySelector<HTMLDivElement>('#app');

if (appDiv) {
  appDiv.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h1>Quanto Vale? 2.0</h1>
      <p>Core inicializado com sucesso.</p>
    </div>
  `;
}

bus.on('STATE_CHANGED', (state) => {
  console.log('[Core Store Update]:', state);
});

console.log('Setup D-14 Concluído:', store.getState());