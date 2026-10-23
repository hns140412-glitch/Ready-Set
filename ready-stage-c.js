(() => {
  'use strict';
  if (window.__readyJourneyLoader) return;
  window.__readyJourneyLoader = true;

  const VERSION = '2026.09.15-stage-c-schedule-timer-implementation-hold-v1';
  const IMPLEMENTATION_HOLD = true;
  const CORE_CHAIN = [
    './ready-role-context-v1.js',
    './ready-foundation-v1.js',
    './ready-foundation-control-v1.js',
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

  const load = (src, timeout = 0) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    const timer = timeout ? setTimeout(() => reject(new Error(`LOAD_TIMEOUT:${src}`)), timeout) : null;
    s.onload = () => { clearTimeout(timer); resolve(src); };
    s.onerror = () => { clearTimeout(timer); reject(new Error(`LOAD_FAILED:${src}`)); };
    document.head.appendChild(s);
  });

  function releaseHeldLayers() {
    // An unfinished world implementation may be held, but an unfinished user onboarding
    // must not be deleted by core boot/focus/pageshow. Profile/crew choice is the owner.
    const onboardingPending = window.ReadyIdentityV1?.isReady?.() === false;
    if (!onboardingPending) {
      document.documentElement.classList.remove('identityFirstPaint', 'worldFirstPaint', 'readyFirstRun');
      document.getElementById('readyFirstRun')?.remove();
    }
    document.documentElement.dataset.readyOnboardingPreserved = onboardingPending ? 'true' : 'false';
    document.getElementById('worldStage')?.remove();
    document.getElementById('homeView')?.classList.remove('worldShell');
    document.querySelectorAll('.worldLegacySection').forEach(el => el.classList.remove('worldLegacySection'));
    document.documentElement.dataset.readyIdentityImplementation = IMPLEMENTATION_HOLD ? 'HOLD' : 'ACTIVE';
    document.documentElement.dataset.readyWorldImplementation = IMPLEMENTATION_HOLD ? 'HOLD' : 'ACTIVE';
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

  async function boot() {
    document.documentElement.dataset.readyBootState = 'BOOT';
    releaseHeldLayers();
    for (const src of CORE_CHAIN) {
      try {
        await load(src);
      } catch (error) {
        console.error('[Ready Core Boot]', src, error);
        document.documentElement.dataset.readyBootState = 'DEGRADED';
        document.documentElement.dataset.readyBootDetail = src;
      }
    }
    renderCore();
    if (document.documentElement.dataset.readyBootState !== 'DEGRADED') {
      document.documentElement.dataset.readyBootState = 'READY';
    }
    document.documentElement.dataset.readyStageLoader = VERSION;
  }

  // First encounter and user onboarding own the screen before native app boot.
  // Heavy planner/role modules must not steal focus or remove the first-run overlay.
  let coreBootPromise = null;
  let coreBootCompleted = false;
  function needsFirstRun() {
    return window.ReadyIdentityV1?.isReady?.() === false;
  }
  function startCoreWhenReady() {
    if (needsFirstRun()) {
      document.documentElement.dataset.readyBootState = 'ONBOARDING';
      return;
    }
    if (coreBootPromise) return coreBootPromise;
    coreBootPromise = boot().then(() => {
      coreBootCompleted = true;
    }).catch(error => {
      console.error('[Ready Core Boot]', error);
      document.documentElement.dataset.readyBootState = 'ERROR';
      document.documentElement.dataset.readyBootDetail = error.message || 'UNKNOWN';
      document.documentElement.dataset.readyStageLoader = 'ERROR';
    });
    return coreBootPromise;
  }
  const recover = () => {
    if (needsFirstRun()) {
      document.documentElement.dataset.readyBootState = 'ONBOARDING';
      return;
    }
    if (!coreBootPromise) { startCoreWhenReady(); return; }
    if (!coreBootCompleted) return;
    releaseHeldLayers();
    renderCore();
  };

  startCoreWhenReady();
  window.addEventListener('ready-member-profile-local-commit', () => startCoreWhenReady());
  window.addEventListener('pageshow', recover);
  window.addEventListener('focus', recover);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
})();
