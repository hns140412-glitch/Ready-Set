(() => {
  'use strict';
  const VERSION = '2026.09.09-stage-g1.4-planner-authority';
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
    await load('./ready-stage-g13-authority-recovery.js');
    await load('./ready-stage-g14-planner-authority.js');
    if (!window.ReadyStageE || !window.ReadyStageF || !window.ReadyAssignmentModel || !window.ReadyStageG11 || !window.ReadyStageG12 || !window.ReadyStageG13 || !window.ReadyStageG14) throw new Error('STAGE_G14_BOOT_MISSING');
    window.ReadyStageF.render?.();
    window.ReadyStageG11.hydrateParentInputs?.();
    window.ReadyStageG12.render?.();
    window.ReadyStageG13.render?.();
    window.ReadyStageG14.render?.();
    const f=window.ReadyStageF.validate?.(),e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),h=window.ReadyStageG12.validate?.(),i=window.ReadyStageG13.validate?.(),j=window.ReadyStageG14.validate?.();
    if(!f?.roleMarker||!f?.homePrimary||!f?.assignmentFactModel)throw new Error('STAGE_G14_ROLE_OR_FACT_MODEL_MISSING');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('STAGE_G14_BASE_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('STAGE_G14_REGRESSION_FIX_MISSING');
    if(!h?.legacyCategoryHidden)throw new Error('STAGE_G14_HOME_TODOS_MISSING');
    if(!i?.pendingSessionBridge||!i?.timeIsSecondary||!i?.timeSaveRewardRemoved)throw new Error('STAGE_G14_SESSION_AUTHORITY_MISSING');
    if(!j?.scheduleAuthority||!j?.noFreeTimeInference||!j?.morningBreakfastAnchor||!j?.scienceConditionalCycle||!j?.gradingDependency||!j?.englishNextClassFromTimetable)throw new Error('STAGE_G14_PLANNER_AUTHORITY_MISSING');
    document.documentElement.dataset.readyStageLoader = VERSION;
  })().catch(error => {
    console.error('[Ready Stage Loader]', error);
    document.documentElement.dataset.readyStageLoader = 'ERROR';
    const t = document.getElementById('toast');
    if (t) { t.textContent = `Preview 업데이트 오류 · ${error.message}`; t.hidden = false; }
  });
})();