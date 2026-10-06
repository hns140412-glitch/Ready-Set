(() => {
  'use strict';
  if (window.__readyJourneyLoader) return;
  window.__readyJourneyLoader = true;

  const VERSION = '2026.10.06-stage-c-first-run-owner-phased-boot-v1';
  const IMPLEMENTATION_HOLD = true;
  // Canonical identity owner. index.html may still execute the byte-identical legacy URL;
  // Stage-C only loads this when no owner is present, so there is never a second owner.
  const IDENTITY='./ready-onboarding-identity-v2.js?v=20260913-deferred';
  // Phase 1: needed while identity is incomplete (onboarding completion + role activation).
  const FIRST_RUN = [
    './ready-role-context-v1.js',
    './ready-onboarding-flow-completion-v1.js'
  ];
  // Phase 2: core runtime, only after identity is READY.
  const AFTER_IDENTITY=['./ready-foundation-v1.js','./ready-foundation-control-v1.js',
    './ready-stage-d.js',
    './ready-stage-e.js',
    './ready-stage-f.js',
    './ready-parent-capture-intake-v1.js',
    './ready-homework-analysis-bridge-v1.js',
    './ready-stage-g1-fix.js',
    './ready-stage-g13-authority-recovery.js',
    './ready-stage-g14-planner-authority.js',
    './ready-base-native-v2.js',
    './ready-planner-selection-bridge-v1.js',
    './ready-focus-tools-v1.js',
    './ready-schedule-base-v1.js',
    './ready-parent-setup-hub-v1.js',
    './ready-base-selftest-v1.js'
  ];

  const html = document.documentElement;
  const mark = (state, detail = '') => {
    html.dataset.readyBootState = state;
    if (detail) html.dataset.readyBootDetail = detail;
  };

  const requested = new Map();
  const load = (src, timeout = 0) => {
    if (requested.has(src)) return requested.get(src);
    const pending = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      const timer = timeout ? setTimeout(() => reject(new Error(`LOAD_TIMEOUT:${src}`)), timeout) : null;
      s.onload = () => { clearTimeout(timer); resolve(src); };
      s.onerror = () => { clearTimeout(timer); requested.delete(src); reject(new Error(`LOAD_FAILED:${src}`)); };
      document.head.appendChild(s);
    });
    requested.set(src, pending);
    return pending;
  };
  const loadAll = async list => {
    for (const src of list) {
      try {
        await load(src);
      } catch (error) {
        console.error('[Ready Core Boot]', src, error);
        mark('DEGRADED', src);
      }
    }
  };

  const identityReady = () => !!window.ReadyIdentityV1?.isReady?.();

  // Only called once identity is READY: the first-run owner has finished.
  function releaseHeldLayers() {
    if (!identityReady()) return;
    html.classList.remove('identityFirstPaint', 'worldFirstPaint', 'readyFirstRun');
    document.getElementById('readyFirstRun')?.remove();
    document.getElementById('worldStage')?.remove();
    document.getElementById('homeView')?.classList.remove('worldShell');
    document.querySelectorAll('.worldLegacySection').forEach(el => el.classList.remove('worldLegacySection'));
    html.dataset.readyIdentityImplementation = IMPLEMENTATION_HOLD ? 'HOLD' : 'ACTIVE';
    html.dataset.readyWorldImplementation = IMPLEMENTATION_HOLD ? 'HOLD' : 'ACTIVE';
  }

  function renderCore() {
    releaseHeldLayers();
    window.ReadyStageF?.render?.();
    window.ReadyStageG11?.hydrateParentInputs?.();
    window.ReadyStageG14?.render?.();
    window.ReadyBaseNativeV2?.render?.();
    window.ReadyBaseRuntimeV1?.syncSelectedTask?.();
    window.ReadyFocusToolsV1?.render?.();
    window.ReadyScheduleBaseV1?.render?.();
    window.ReadyParentSetupHubV1?.render?.();
  }

  // Preserve the first-run owner: never remove #readyFirstRun while identity is incomplete.
  function holdFirstRun() {
    const owner = window.ReadyIdentityV1;
    (owner.recover || owner.render)?.call(owner);
    html.classList.add('readyFirstRun');
    window.ReadyOnboardingFlowCompletionV1?.sync?.();
    mark('FIRST_RUN');
  }

  let coreBoot = null;
  const bootCore = () => {
    if (coreBoot) return coreBoot;
    coreBoot = (async () => {
      mark('CORE_LOADING');
      releaseHeldLayers();
      await loadAll(AFTER_IDENTITY);
      renderCore();
      if (html.dataset.readyBootState !== 'DEGRADED') mark('READY');
    })();
    return coreBoot;
  };

  async function boot() {
    mark('BOOT');
    if (!window.ReadyIdentityV1) await load(IDENTITY);
    if (!window.ReadyIdentityV1) throw new Error('IDENTITY_OWNER_MISSING');
    await loadAll(FIRST_RUN);
    html.dataset.readyStageLoader = VERSION;
    if (!identityReady()) {
      holdFirstRun();
      return;
    }
    await bootCore();
  }

  let booted = false;
  const recover = () => {
    if (!booted || !window.ReadyIdentityV1) return;
    if (!identityReady()) { holdFirstRun(); return; }
    if (!coreBoot) { bootCore().catch(fail); return; }
    coreBoot.then(renderCore);
  };

  function fail(error) {
    console.error('[Ready Core Boot]', error);
    mark('ERROR', error.message || 'UNKNOWN');
    html.dataset.readyStageLoader = 'ERROR';
  }

  boot().then(() => { booted = true; }, error => { booted = true; fail(error); });

  window.addEventListener('pageshow', recover);
  window.addEventListener('focus', recover);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
})();
