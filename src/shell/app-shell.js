export function createAppShell(options = {}) {
  const app = options.app || 'ready-set';
  const views = new Map();
  let activeView = null;

  function registerView(id, controller) {
    if (!id || typeof id !== 'string') throw new TypeError(app + ': view id required');
    if (!controller || typeof controller.render !== 'function') {
      throw new TypeError(app + ': view controller requires render()');
    }
    if (views.has(id)) throw new Error(app + ': duplicate view ' + id);
    views.set(id, Object.freeze({ ...controller }));
    return id;
  }

  async function show(id, context = {}) {
    const next = views.get(id);
    if (!next) throw new Error(app + ': unknown view ' + id);
    const prev = activeView ? views.get(activeView) : null;
    if (prev?.leave) await prev.leave({ from: activeView, to: id, context });
    activeView = id;
    await next.render({ app, view: id, context });
    if (next.enter) await next.enter({ app, view: id, context });
    return id;
  }

  return Object.freeze({
    app,
    registerView,
    show,
    activeView: () => activeView,
    registeredViews: () => [...views.keys()]
  });
}
