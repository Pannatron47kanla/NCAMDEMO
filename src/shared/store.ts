export interface Store<S> {
  get(): S;
  set(next: S | ((prev: S) => S)): void;
  subscribe(listener: () => void): () => void;
}

/** A tiny observable value. In-memory repositories keep their data in one, and screens read it with `useStore`. */
export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      state = typeof next === 'function' ? (next as (prev: S) => S)(state) : next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
