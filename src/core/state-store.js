export function createStateStore(initialState = {}, options = {}) {
  const app = options.app || 'ready-set';
  let state = structuredClone(initialState);
  const listeners = new Set();
  let revision = 0;

  function snapshot() {
    return structuredClone(state);
  }

  function replace(nextState, meta = {}) {
    if (!nextState || typeof nextState !== 'object' || Array.isArray(nextState)) {
      throw new TypeError(app + ': state replacement must be an object');
    }
    const previous = state;
    state = structuredClone(nextState);
    revision += 1;
    const event = Object.freeze({
      app,
      revision,
      type: 'STATE_REPLACED',
      meta: Object.freeze({ ...meta })
    });
    for (const listener of listeners) listener(snapshot(), event, structuredClone(previous));
    return snapshot();
  }

  function update(recipe, meta = {}) {
    if (typeof recipe !== 'function') throw new TypeError(app + ': recipe must be a function');
    const draft = snapshot();
    const result = recipe(draft);
    return replace(result === undefined ? draft : result, meta);
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError(app + ': listener must be a function');
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    app,
    snapshot,
    replace,
    update,
    subscribe,
    revision: () => revision
  });
}
