// src/lib/queueBus.ts
type Listener = () => void;

const listeners = new Set<Listener>();

export const queueBus = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  notify() {
    for (const fn of listeners) fn();
  },
};
