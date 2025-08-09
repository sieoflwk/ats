export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    const arr = this.listeners.get(event) || [];
    arr.push(handler);
    this.listeners.set(event, arr);
  }

  off(event, handler) {
    const arr = this.listeners.get(event) || [];
    this.listeners.set(event, arr.filter(h => h !== handler));
  }

  emit(event, payload) {
    (this.listeners.get(event) || []).forEach(h => h(payload));
  }
}


