(() => {
  'use strict';
  if (window.__readyJourneyLoader) return;
  window.__readyJourneyLoader = true;

  const VERSION = '2026.09.18-stage-c-exploration-journey-v2';
  const IMPLEMENTATION_HOLD = true;
  const CORE_CHAIN = [
    './ready-role-context-v1.js',
    './ready-foundation-v1.js',
    './ready-foundation-control-v1.js',
    './ready-stage-d.js',
    './ready-recording-v1.js',
    './ready-stage-e.js',
    './ready-stage-f.js',
    './ready-parent-capture-intake-v1.js',
    './ready-homework-analysis-bridge-v1.js',
    './ready-stage-g1-fix.js',
    './ready-stage-g13-authority-recovery.js',
    './ready-stage-g14-planner-authority.js',
    './ready-base-native-v2.js',
    './ready-planner-selection-bridge-v1.js',
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
    document.documentElement.classList.remove('identityFirstPaint', 'worldFirstPaint', 'readyFirstRun');
    document.getElementById('readyFirstRun')?.remove();
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
    window.ReadyScheduleBaseV1?.render?.();
    window.ReadyRecordingV1?.render?.();
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

  const recover = () => {
    releaseHeldLayers();
    renderCore();
  };

  boot().catch(error => {
    console.error('[Ready Core Boot]', error);
    releaseHeldLayers();
    document.documentElement.dataset.readyBootState = 'ERROR';
    document.documentElement.dataset.readyBootDetail = error.message || 'UNKNOWN';
    document.documentElement.dataset.readyStageLoader = 'ERROR';
  });

  window.addEventListener('pageshow', recover);
  window.addEventListener('focus', recover);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
})();
