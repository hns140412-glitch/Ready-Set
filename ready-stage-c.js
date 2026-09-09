(() => {
  'use strict';
  const VERSION = '2026.09.09-stage-base-ui-v2';
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const join = src.includes('?') ? '&' : '?';
    script.src = `${src}${join}v=${encodeURIComponent(VERSION)}&cb=${Date.now()}`;
    script.async = false; script.onload = resolve; script.onerror = () => reject(new Error(`LOAD_FAILED:${src}`)); document.head.appendChild(script);
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
    await load('./ready-base-native-v2.js');
    if (!window.ReadyStageE || !window.ReadyStageF || !window.ReadyAssignmentModel || !window.ReadyStageG11 || !window.ReadyStageG13 || !window.ReadyStageG14 || !window.ReadyBaseNativeV2) throw new Error('BASE_UI_V2_BOOT_MISSING');
    window.ReadyStageF.render?.(); window.ReadyStageG11.hydrateParentInputs?.(); window.ReadyStageG14.render?.(); window.ReadyBaseNativeV2.render?.();
    const e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),i=window.ReadyStageG13.validate?.(),j=window.ReadyStageG14.validate?.(),n=window.ReadyBaseNativeV2.validate?.();
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('BASE_UI_V2_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('BASE_UI_V2_REGRESSION_FIX_MISSING');
    if(!i?.pendingSessionBridge||!i?.timeIsSecondary||!i?.timeSaveRewardRemoved)throw new Error('BASE_UI_V2_SESSION_AUTHORITY_MISSING');
    if(!j?.scheduleAuthority||!j?.noFreeTimeInference||!j?.scienceConditionalCycle||!j?.englishNextClassFromTimetable)throw new Error('BASE_UI_V2_PLANNER_AUTHORITY_MISSING');
    if(!n?.nativeHome||!n?.legacyCategoryAbsent||!n?.plannerSelectionBridgesCore)throw new Error('BASE_UI_V2_NATIVE_HOME_MISSING');
    document.documentElement.dataset.readyStageLoader = VERSION;
  })().catch(error => { console.error('[Ready Base Loader]', error); document.documentElement.dataset.readyStageLoader='ERROR'; const t=document.getElementById('toast'); if(t){t.textContent=`Preview 업데이트 오류 · ${error.message}`;t.hidden=false;} });
})();