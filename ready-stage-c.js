(() => {
  'use strict';
  const VERSION = '2026.09.08-stage-g1.2-home-todos';
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const join = src.includes('?') ? '&' : '?';
    script.src = `${src}${join}v=${encodeURIComponent(VERSION)}&cb=${Date.now()}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`LOAD_FAILED:${src}`));
    document.head.appendChild(script);
  });
  (async () => {
    await load('./ready-stage-c-base.js');
    await load('./ready-stage-d.js');
    await load('./ready-stage-e.js');
    await load('./ready-stage-f.js');
    await load('./ready-stage-g1-fix.js');
    await load('./ready-stage-g12-home-todos.js');
    if (!window.ReadyStageE || !window.ReadyStageF || !window.ReadyAssignmentModel || !window.ReadyStageG11 || !window.ReadyStageG12) throw new Error('STAGE_G12_BOOT_MISSING');
    window.ReadyStageF.render?.();
    window.ReadyStageG11.hydrateParentInputs?.();
    window.ReadyStageG12.render?.();
    const f=window.ReadyStageF.validate?.(),e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),h=window.ReadyStageG12.validate?.();
    if(!f?.roleMarker||!f?.homePrimary||!f?.assignmentFactModel)throw new Error('STAGE_G12_ROLE_OR_FACT_MODEL_MISSING');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('STAGE_G12_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('STAGE_G12_REGRESSION_FIX_MISSING');
    if(!h?.legacyCategoryHidden)throw new Error('STAGE_G12_HOME_TODOS_MISSING');
    document.documentElement.dataset.readyStageLoader = VERSION;
  })().catch(error => {
    console.error('[Ready Stage Loader]', error);
    document.documentElement.dataset.readyStageLoader = 'ERROR';
    const t = document.getElementById('toast');
    if (t) { t.textContent = `Preview 업데이트 오류 · ${error.message}`; t.hidden = false; }
  });
})();