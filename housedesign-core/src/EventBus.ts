/**
 * 事件总线 - 发布/订阅模式
 */
type EventCallback<T = unknown> = (payload: T) => void;

export class EventBus {
  private readonly listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    this.listeners.get(event)?.forEach((callback) => {
      callback(payload);
    });
  }

  once<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    const unsubscribe = this.on<T>(event, (payload) => {
      callback(payload);
      unsubscribe();
    });
    return unsubscribe;
  }

  clear(): void {
    this.listeners.clear();
  }
}
