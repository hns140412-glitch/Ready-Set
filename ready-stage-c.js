(() => {
  'use strict';
  const VERSION='2026.09.10-stage-base-ui-v7.4';
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error(`LOAD_FAILED:${src}`));document.head.appendChild(s)});
  (async()=>{
    for(const src of ['./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./ready-stage-g1-fix.js','./ready-stage-g14-planner-authority.js','./ready-base-native-v2.js','./ready-planner-selection-bridge-v1.js','./ready-focus-tools-v1.js','./ready-schedule-base-v1.js','./ready-world-base-v1.js','./ready-onboarding-identity-v1.js','./ready-character-candidate-v1.js','./ready-world-shell-v1.js','./ready-base-selftest-v1.js'])await load(src);
    if(!window.ReadyBaseRuntimeV1||!window.ReadyStageE||!window.ReadyStageF||!window.ReadyAssignmentModel||!window.ReadyStageG11||!window.ReadyStageG14||!window.ReadyBaseNativeV2||!window.ReadyPlannerSelectionBridgeV1||!window.ReadyFocusToolsV1||!window.ReadyScheduleBaseV1||!window.ReadyWorldBaseV1||!window.ReadyIdentityV1||!window.ReadyCharacterCandidateV1||!window.ReadyWorldShellV1||!window.ReadyBaseSelfTestV1)throw new Error('BASE_UI_V74_BOOT_MISSING');
    window.ReadyStageF.render?.();window.ReadyStageG11.hydrateParentInputs?.();window.ReadyStageG14.render?.();window.ReadyBaseNativeV2.render?.();window.ReadyBaseRuntimeV1.syncSelectedTask?.();window.ReadyFocusToolsV1.render?.();window.ReadyScheduleBaseV1.render?.();window.ReadyWorldShellV1.render?.();window.ReadyCharacterCandidateV1.render?.();
    const r=window.ReadyBaseRuntimeV1.validate?.(),e=window.ReadyStageE.validate?.(),g=window.ReadyStageG11.validate?.(),j=window.ReadyStageG14.validate?.(),n=window.ReadyBaseNativeV2.validate?.(),b=window.ReadyPlannerSelectionBridgeV1.validate?.(),f=window.ReadyFocusToolsV1.validate?.(),s=window.ReadyScheduleBaseV1.validate?.(),wb=window.ReadyWorldBaseV1.validate?.(),id=window.ReadyIdentityV1.validate?.(),cc=window.ReadyCharacterCandidateV1.validate?.(),w=window.ReadyWorldShellV1.validate?.();
    if(!r?.nativeRuntime||r?.legacyAppJsRequired!==false||!r?.plannerIdBinding||!r?.plannerSelectedIsAuthority||!r?.completionWritesPlanner||!r?.timeOptional||!r?.completedTaskNotActive||!r?.resultStatusSingle)throw new Error('BASE_UI_V74_NATIVE_RUNTIME_MISSING');
    if(!b?.stablePlannerId||!b?.coreBridge)throw new Error('BASE_UI_V74_SELECTION_BRIDGE_MISSING');
    if(!f?.recordingDefaultHidden||!f?.onDemandTool)throw new Error('BASE_UI_V74_FOCUS_TOOLS_MISSING');
    if(!s?.weekly||!s?.daily||!s?.plannerLinked||!s?.noFreeTimeInference)throw new Error('BASE_UI_V74_SCHEDULE_MISSING');
    if(!wb?.nativeWorldBase||!wb?.noCardShell||!wb?.sceneTransition||wb?.legacyBaseUnderlay!==false)throw new Error('BASE_UI_V74_WORLD_BASE_INVALID');
    if(!id?.firstRunGate||!id?.nativeFirstPaintRelease||!id?.identityMasterContract||!id?.visualIdRequired||!id?.photoIsNotVisualId||!id?.legalNameSeparate||!id?.nicknamePrimary||!id?.shareNamePolicy||!id?.birthDateRequired||!id?.schoolStageRequired||!id?.characterTimeline||!id?.annualRefreshOptional||!id?.seasonalLayerContract||!id?.worldPlaceOptionalAfterArrival||!id?.profileForm||!id?.photoCapture||!id?.photoResize||!id?.characterApprovalGate)throw new Error('BASE_UI_V74_IDENTITY_CONTRACT_INVALID');
    if(!cc?.threeCandidateContract||!cc?.noFakeGeneration||!cc?.sourcePhotoIsIdentitySource||!cc?.explicitApprovalRequired||!cc?.versionedIdentity||!cc?.similarFlow||!cc?.resetFlow||!cc?.backendRequired||!cc?.kidFacingCopy||!cc?.fullBodyCandidateLayout||!cc?.visualIdApprovalGate)throw new Error('BASE_UI_V74_CHARACTER_CANDIDATE_INVALID');
    if(!w?.enabled||!w?.plannerDriven||w?.legacyCategoryGrid!==false||!w?.nativeFirstPaint||!w?.journeyScene||!w?.arrivalScene||!w?.visualIdSlots)throw new Error('BASE_UI_V74_WORLD_SCENE_INVALID');
    if(e?.minuteCapacityAuthority!==false||e?.nextTuesdayNormalSlot!==false)throw new Error('BASE_UI_V74_PLANNER_SEMANTICS_MISSING');
    if(!g?.wrappedModel||g?.talentSourceTuesdayActiveTasks!==0)throw new Error('BASE_UI_V74_REGRESSION_FIX_MISSING');
    if(window.ReadyStageG13)throw new Error('BASE_UI_V74_G13_RUNTIME_STILL_LOADED');
    if(!j?.scheduleAuthority||!j?.noFreeTimeInference||!j?.scienceConditionalCycle||!j?.englishNextClassFromTimetable)throw new Error('BASE_UI_V74_PLANNER_AUTHORITY_MISSING');
    if(!n?.nativeHome||!n?.legacyCategoryAbsent||!n?.plannerSelectionBridgesCore||!n?.internalMetadataHidden)throw new Error('BASE_UI_V74_NATIVE_HOME_MISSING');
    if(document.getElementById('legacyCompatibility'))throw new Error('BASE_UI_V74_LEGACY_COMPATIBILITY_STILL_PRESENT');
    if([...document.scripts].some(x=>/\/app\.js(?:$|\?)/.test(x.src)))throw new Error('BASE_UI_V74_LEGACY_APP_JS_STILL_LOADED');
    const selftest=window.ReadyBaseSelfTestV1.run();if(!selftest?.pass)throw new Error(`BASE_UI_V74_SELFTEST_FAIL:${selftest?.failures?.map(x=>x.name).join(',')||'UNKNOWN'}`);
    document.documentElement.dataset.readyStageLoader=VERSION;
  })().catch(error=>{console.error('[Ready Base Loader]',error);document.documentElement.dataset.readyStageLoader='ERROR';const t=document.getElementById('toast');if(t){t.textContent=`Preview 업데이트 오류 · ${error.message}`;t.hidden=false;}});
})();