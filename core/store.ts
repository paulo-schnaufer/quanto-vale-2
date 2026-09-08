import { GameState } from './types';
import { ESTADO_INICIAL } from './state';
import { bus } from './events';

class Store {
  private state: GameState = { ...ESTADO_INICIAL };

  getState(): Readonly<GameState> {
    return Object.freeze({ ...this.state });
  }

  setState(partialState: Partial<GameState>): void {
    this.state = { ...this.state, ...partialState };
    bus.emit('STATE_CHANGED', this.state);
  }

  reset(): void {
    this.state = { ...ESTADO_INICIAL };
    bus.emit('STATE_CHANGED', this.state);
  }
}

export const store = new Store();