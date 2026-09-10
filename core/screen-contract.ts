import type { GameState } from './game-state.types';

export type ScreenId = string;
export type Teardown = () => void;

export interface ScreenContext {
  state: GameState;
  navegar: (id: ScreenId) => void;
  bus: any;
}

export interface Screen {
  id: ScreenId;
  mount: (root: HTMLElement, ctx: ScreenContext) => Teardown | void;
}