(() => {
  'use strict';
  const VERSION='2026.09.10-stage-identity-owner-v8.0';
  const IDENTITY='./ready-onboarding-identity-v1.js';
  const AFTER_IDENTITY=['./ready-character-candidate-v1.js','./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./ready-stage-g1-fix.js','./ready-stage-g14-planner-authority.js','./ready-base-native-v2.js','./ready-planner-selection-bridge-v1.js','./ready-focus-tools-v1.js','./ready-schedule-base-v1.js','./ready-world-base-v1.js','./ready-world-shell-v1.js','./ready-base-selftest-v1.js'];
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(src);s.onerror=()=>reject(new Error(`LOAD_FAILED:${src}`));document.head.appendChild(s)});
  const mark=(state,detail='')=>{document.documentElement.dataset.readyBootState=state;if(detail)document.documentElement.dataset.readyBootDetail=detail};
  const releaseStaticPaint=()=>document.documentElement.classList.remove('identityFirstPaint');
  const bootIdentity=async()=>{
    mark('IDENTITY_LOADING');
    await load(IDENTITY);
    if(!window.ReadyIdentityV1)throw new Error('IDENTITY_OWNER_MISSING');
    releaseStaticPaint();
    mark('IDENTITY_READY');
  };
  const bootRest=async()=>{
    for(const src of AFTER_IDENTITY){
      try{
        await load(src);
      }catch(error){
        console.error('[Ready Optional Boot]',src,error);
        mark('DEGRADED',src);
        continue;
      }
      if(src.includes('ready-character-candidate-v1.js')) window.ReadyCharacterCandidateV1?.render?.();
    }
    window.ReadyStageF?.render?.();
    window.ReadyStageG11?.hydrateParentInputs?.();
    window.ReadyStageG14?.render?.();
    window.ReadyBaseNativeV2?.render?.();
    window.ReadyBaseRuntimeV1?.syncSelectedTask?.();
    window.ReadyFocusToolsV1?.render?.();
    window.ReadyScheduleBaseV1?.render?.();
    window.ReadyWorldShellV1?.render?.();
    window.ReadyCharacterCandidateV1?.render?.();
    if(document.documentElement.dataset.readyBootState!=='DEGRADED')mark('READY');
  };
  const recover=()=>{
    releaseStaticPaint();
    if(window.ReadyIdentityV1&&!window.ReadyIdentityV1.isReady?.()){
      document.documentElement.classList.add('readyFirstRun');
      window.ReadyCharacterCandidateV1?.render?.();
    }
  };
  (async()=>{
    mark('BOOT');
    await bootIdentity();
    bootRest().catch(error=>{console.error('[Ready Post Identity Boot]',error);mark('DEGRADED',error.message||'POST_IDENTITY')});
    window.addEventListener('pageshow',recover);
    window.addEventListener('focus',recover);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recover()});
    document.documentElement.dataset.readyStageLoader=VERSION;
  })().catch(error=>{
    console.error('[Ready Identity Boot]',error);
    mark('IDENTITY_ERROR',error.message||'UNKNOWN');
    document.documentElement.dataset.readyStageLoader='ERROR';
    const t=document.getElementById('toast');if(t){t.textContent=`Identity 시작 오류 · ${error.message}`;t.hidden=false;}
  });
})();