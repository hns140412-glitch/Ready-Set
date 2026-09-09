(() => {
  'use strict';
  const VERSION='2026.09.10-stage-base-ui-v6.5';
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error(`LOAD_FAILED:${src}`));document.head.appendChild(s)});
  (async()=>{
    for(const src of ['./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./ready-stage-g1-fix.js','./ready-stage-g14-planner-authority.js','./ready-base-native-v2.js','./ready-planner-selection-bridge-v1.js','./ready-focus-tools-v1.js','./ready-schedule-base-v1.js','./ready-base-selftest-v1.js'])await load(src);
    if(!window.ReadyBaseRuntimeV1||!window.ReadyStageE||!window.ReadyStageF||!window.ReadyAssignmentModel||!window.ReadyStageG11||!window.ReadyStageG14||!window.ReadyBaseNativeV2||!window.ReadyPlannerSelectionBridgeV1||!window.ReadyFocusToolsV1||!window.ReadyScheduleBaseV1||!window.ReadyBaseSelfTestV1)throw new Error('BASE_UI_V65_BOOT_MISSING');
    window.ReadyStageF.render?.();window.ReadyStageG11.hydrateParentInputs?.();window.ReadyStageG14.render?.();window.ReadyBaseNativeV2.render?.();window.ReadyBaseRuntimeV1.syncSelectedTask?.();window.ReadyFocusToolsV1.render?.();window.ReadyScheduleBaseV1.render?.();
    const r=window.ReadyBaseRuntimeV1.validate?.(),e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),j=window.ReadyStageG14.validate?.(),n=window.ReadyBaseNativeV2.validate?.(),b=window.ReadyPlannerSelectionBridgeV1.validate?.(),f=window.ReadyFocusToolsV1.validate?.(),s=window.ReadyScheduleBaseV1.validate?.();
    if(!r?.nativeRuntime||r?.legacyAppJsRequired!==false||!r?.plannerIdBinding||!r?.plannerSelectedIsAuthority||!r?.completionWritesPlanner||!r?.timeOptional)throw new Error('BASE_UI_V65_NATIVE_RUNTIME_MISSING');
    if(!b?.stablePlannerId||!b?.coreBridge)throw new Error('BASE_UI_V65_SELECTION_BRIDGE_MISSING');
    if(!f?.recordingDefaultHidden||!f?.onDemandTool)throw new Error('BASE_UI_V65_FOCUS_TOOLS_MISSING');
    if(!s?.weekly||!s?.daily||!s?.plannerLinked||!s?.noFreeTimeInference)throw new Error('BASE_UI_V65_SCHEDULE_MISSING');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('BASE_UI_V65_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('BASE_UI_V65_REGRESSION_FIX_MISSING');
    if(window.ReadyStageG13)throw new Error('BASE_UI_V65_G13_RUNTIME_STILL_LOADED');
    if(!j?.scheduleAuthority||!j?.noFreeTimeInference||!j?.scienceConditionalCycle||!j?.englishNextClassFromTimetable)throw new Error('BASE_UI_V65_PLANNER_AUTHORITY_MISSING');
    if(!n?.nativeHome||!n?.legacyCategoryAbsent||!n?.plannerSelectionBridgesCore||!n?.internalMetadataHidden)throw new Error('BASE_UI_V65_NATIVE_HOME_MISSING');
    if(document.getElementById('legacyCompatibility'))throw new Error('BASE_UI_V65_LEGACY_COMPATIBILITY_STILL_PRESENT');
    if([...document.scripts].some(x=>/\/app\.js(?:$|\?)/.test(x.src)))throw new Error('BASE_UI_V65_LEGACY_APP_JS_STILL_LOADED');
    const selftest=window.ReadyBaseSelfTestV1.run();if(!selftest?.pass)throw new Error(`BASE_UI_V65_SELFTEST_FAIL:${selftest?.failures?.map(x=>x.name).join(',')||'UNKNOWN'}`);
    document.documentElement.dataset.readyStageLoader=VERSION;
  })().catch(error=>{console.error('[Ready Base Loader]',error);document.documentElement.dataset.readyStageLoader='ERROR';const t=document.getElementById('toast');if(t){t.textContent=`Preview 업데이트 오류 · ${error.message}`;t.hidden=false;}});
})();