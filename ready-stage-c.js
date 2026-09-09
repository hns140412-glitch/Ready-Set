(() => {
  'use strict';
  const VERSION = '2026.09.09-stage-base-ui-v6.1';
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
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
    await load('./ready-stage-g14-planner-authority.js');
    await load('./ready-base-native-v2.js');
    await load('./ready-base-selftest-v1.js');
    if (!window.ReadyBaseRuntimeV1 || !window.ReadyStageE || !window.ReadyStageF || !window.ReadyAssignmentModel || !window.ReadyStageG11 || !window.ReadyStageG14 || !window.ReadyBaseNativeV2 || !window.ReadyBaseSelfTestV1) throw new Error('BASE_UI_V61_BOOT_MISSING');
    window.ReadyStageF.render?.(); window.ReadyStageG11.hydrateParentInputs?.(); window.ReadyStageG14.render?.(); window.ReadyBaseNativeV2.render?.();
    const r=window.ReadyBaseRuntimeV1.validate?.(),e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),j=window.ReadyStageG14.validate?.(),n=window.ReadyBaseNativeV2.validate?.();
    if(!r?.nativeRuntime||r?.legacyAppJsRequired!==false||!r?.plannerIdBinding||!r?.completionWritesPlanner||!r?.timeOptional)throw new Error('BASE_UI_V61_NATIVE_RUNTIME_MISSING');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('BASE_UI_V61_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('BASE_UI_V61_REGRESSION_FIX_MISSING');
    if(window.ReadyStageG13)throw new Error('BASE_UI_V61_G13_RUNTIME_STILL_LOADED');
    if(!j?.scheduleAuthority||!j?.noFreeTimeInference||!j?.scienceConditionalCycle||!j?.englishNextClassFromTimetable)throw new Error('BASE_UI_V61_PLANNER_AUTHORITY_MISSING');
    if(!n?.nativeHome||!n?.legacyCategoryAbsent||!n?.plannerSelectionBridgesCore)throw new Error('BASE_UI_V61_NATIVE_HOME_MISSING');
    if(document.getElementById('legacyCompatibility'))throw new Error('BASE_UI_V61_LEGACY_COMPATIBILITY_STILL_PRESENT');
    if([...document.scripts].some(s=>/\/app\.js(?:$|\?)/.test(s.src)))throw new Error('BASE_UI_V61_LEGACY_APP_JS_STILL_LOADED');
    const selftest=window.ReadyBaseSelfTestV1.run();
    if(!selftest?.pass)throw new Error(`BASE_UI_V61_SELFTEST_FAIL:${selftest?.failures?.map(x=>x.name).join(',')||'UNKNOWN'}`);
    document.documentElement.dataset.readyStageLoader = VERSION;
  })().catch(error => { console.error('[Ready Base Loader]', error); document.documentElement.dataset.readyStageLoader='ERROR'; const t=document.getElementById('toast'); if(t){t.textContent=`Preview 업데이트 오류 · ${error.message}`;t.hidden=false;} });
})();