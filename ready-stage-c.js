(() => {
  'use strict';
  const VERSION = '2026.09.09-stage-base-home-v1';
  const css=document.createElement('link');
  css.rel='stylesheet';css.href=`./ready-base-home-v1.css?v=${encodeURIComponent(VERSION)}`;document.head.appendChild(css);
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
    if (!window.ReadyStageE || !window.ReadyStageF || !window.ReadyAssignmentModel || !window.ReadyStageG11 || !window.ReadyStageG12 || !window.ReadyStageG13 || !window.ReadyStageG14) throw new Error('BASE_HOME_V1_BOOT_MISSING');
    window.ReadyStageF.render?.();
    window.ReadyStageG11.hydrateParentInputs?.();
    window.ReadyStageG12.render?.();
    window.ReadyStageG13.render?.();
    window.ReadyStageG14.render?.();
    const f=window.ReadyStageF.validate?.(),e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),h=window.ReadyStageG12.validate?.(),i=window.ReadyStageG13.validate?.(),j=window.ReadyStageG14.validate?.();
    if(!f?.roleMarker||!f?.homePrimary||!f?.assignmentFactModel)throw new Error('BASE_HOME_V1_ROLE_OR_FACT_MODEL_MISSING');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('BASE_HOME_V1_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('BASE_HOME_V1_REGRESSION_FIX_MISSING');
    if(!h?.legacyCategoryHidden)throw new Error('BASE_HOME_V1_HOME_TODOS_MISSING');
    if(!i?.pendingSessionBridge||!i?.timeIsSecondary||!i?.timeSaveRewardRemoved)throw new Error('BASE_HOME_V1_SESSION_AUTHORITY_MISSING');
    if(!j?.scheduleAuthority||!j?.noFreeTimeInference||!j?.morningBreakfastAnchor||!j?.scienceConditionalCycle||!j?.gradingDependency||!j?.englishNextClassFromTimetable)throw new Error('BASE_HOME_V1_PLANNER_AUTHORITY_MISSING');
    document.documentElement.dataset.readyBaseHome = VERSION;
    document.documentElement.dataset.readyStageLoader = VERSION;
  })().catch(error => {
    console.error('[Ready Base Loader]', error);
    document.documentElement.dataset.readyStageLoader = 'ERROR';
    const t = document.getElementById('toast');
    if (t) { t.textContent = `Preview 업데이트 오류 · ${error.message}`; t.hidden = false; }
  });
})();