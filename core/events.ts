type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(event, list.filter(cb => cb !== callback));
  }

  emit<T>(event: string, payload?: T): void {
    const list = this.listeners.get(event);
    if (!list) return;
    list.forEach(cb => cb(payload));
  }
}

export const bus = new EventBus();