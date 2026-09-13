(() => {
  'use strict';
  if(window.__readyJourneyLoader)return;
  window.__readyJourneyLoader=true;
  const VERSION='2026.09.13-stage-first-journey-parent-setup-v3';
  const IDENTITY='./ready-onboarding-identity-v2.js?v=20260913-deferred';
  const CANDIDATE='./ready-character-candidate-v1.js?v=20260911-mood2';
  const AFTER_IDENTITY=['./ready-role-context-v1.js','./ready-onboarding-flow-completion-v1.js','./ready-foundation-v1.js','./ready-foundation-control-v1.js','./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./ready-parent-capture-intake-v1.js','./ready-homework-analysis-bridge-v1.js','./ready-stage-g1-fix.js','./ready-stage-g14-planner-authority.js','./ready-base-native-v2.js','./ready-planner-selection-bridge-v1.js','./ready-focus-tools-v1.js','./ready-schedule-base-v1.js','./ready-world-base-v1.js','./ready-world-shell-v1.js','./ready-parent-setup-hub-v1.js','./ready-base-selftest-v1.js'];
  const load=(src,timeout=0)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;const timer=timeout?setTimeout(()=>reject(new Error(`LOAD_TIMEOUT:${src}`)),timeout):null;s.onload=()=>{clearTimeout(timer);resolve(src)};s.onerror=()=>{clearTimeout(timer);reject(new Error(`LOAD_FAILED:${src}`))};document.head.appendChild(s)});
  const mark=(state,detail='')=>{document.documentElement.dataset.readyBootState=state;if(detail)document.documentElement.dataset.readyBootDetail=detail};
  const releaseStaticPaint=()=>{document.documentElement.classList.remove('identityFirstPaint');document.documentElement.classList.remove('worldFirstPaint')};
  const safeRead=()=>{if(window.ReadyIdentityV1)return window.ReadyIdentityV1.get();try{return JSON.parse(localStorage.getItem('readyset_identity_v1')||'{}')||{}}catch{return {}}};
  const safeWrite=v=>window.ReadyIdentityV1?window.ReadyIdentityV1.patch(v):localStorage.setItem('readyset_identity_v1',JSON.stringify(v));
  const installReferenceStyle=()=>{
    if(document.getElementById('ready-character-reference-ui-v1'))return;
    const s=document.createElement('style');s.id='ready-character-reference-ui-v1';s.textContent=`
      #readyCharacterCandidateMount.ccPanel{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin-top:18px!important}
      #readyCharacterCandidateMount .ccConsult{display:block}
      #readyCharacterCandidateMount .ccKicker{font-size:10px!important;letter-spacing:.18em!important;font-weight:950!important;color:#52748a!important;margin:0 0 7px!important}
      #readyCharacterCandidateMount .ccConsult>b{font-size:24px!important;line-height:1.18!important;letter-spacing:-.035em!important;color:#123f63!important}
      #readyCharacterCandidateMount .ccConsult>p{font-size:13px!important;line-height:1.5!important;margin:7px 0 18px!important;color:#5d7a8d!important;font-weight:750!important}
      #readyCharacterCandidateMount .ccTileGrid{display:grid!important;grid-template-columns:1fr!important;gap:13px!important;margin-top:14px!important}
      #readyCharacterCandidateMount .ccTile{display:grid!important;grid-template-columns:118px minmax(0,1fr)!important;grid-template-rows:auto auto!important;column-gap:16px!important;align-items:center!important;min-height:128px!important;margin:0!important;padding:12px!important;border-radius:24px!important;background:rgba(255,255,255,.92)!important;border:2px solid rgba(255,255,255,.85)!important;box-shadow:0 13px 28px rgba(24,83,116,.11)!important;color:#153f5d!important;text-align:left!important;overflow:hidden!important}
      #readyCharacterCandidateMount .ccTile:active{transform:scale(.985)}
      #readyCharacterCandidateMount .ccTile .ccArt{grid-row:1/3!important;width:118px!important;height:104px!important;aspect-ratio:auto!important;border-radius:19px!important;margin:0!important;position:relative!important;overflow:hidden!important;background:linear-gradient(145deg,#dceff1,#82b9c3)!important}
      #readyCharacterCandidateMount .ccTone2 .ccArt{background:linear-gradient(145deg,#f0dfd7,#c49ab4)!important}
      #readyCharacterCandidateMount .ccTone3 .ccArt{background:linear-gradient(145deg,#e0e4ef,#7f9bb3)!important}
      #readyCharacterCandidateMount .ccArt:before{content:'';position:absolute;left:50%;top:16%;width:43px;height:43px;transform:translateX(-50%);border-radius:50%;background:rgba(255,255,255,.78);box-shadow:0 38px 0 15px rgba(255,255,255,.58)}
      #readyCharacterCandidateMount .ccArt:after{content:'';position:absolute;right:12px;bottom:13px;width:29px;height:29px;border-radius:9px;background:rgba(20,62,83,.18);transform:rotate(-8deg)}
      #readyCharacterCandidateMount .ccArt i{display:none!important}
      #readyCharacterCandidateMount .ccTile strong{font-size:17px!important;line-height:1.2!important;margin:0!important;align-self:end!important;color:#153f5d!important}
      #readyCharacterCandidateMount .ccTile small{font-size:11px!important;line-height:1.4!important;margin:6px 0 0!important;align-self:start!important;color:#71899a!important;font-weight:700!important}
      #readyCharacterCandidateMount .ccConsult>small{font-size:10px!important;line-height:1.45!important;margin:14px 3px 0!important;color:#6d8798!important}
      #readyCharacterCandidateMount .ccTextButton{margin-top:12px!important}
      #readyCharacterCandidateMount .ccSummary{gap:9px!important}
      #readyCharacterCandidateMount .ccSummary span{border-radius:16px!important;padding:12px 14px!important;background:rgba(255,255,255,.9)!important}
      @media(max-width:390px){#readyCharacterCandidateMount .ccTile{grid-template-columns:98px minmax(0,1fr)!important;min-height:112px!important;column-gap:13px!important}#readyCharacterCandidateMount .ccTile .ccArt{width:98px!important;height:90px!important}#readyCharacterCandidateMount .ccTile strong{font-size:15px!important}}
    `;document.head.appendChild(s);
  };
  const fallbackConsult=detail=>{
    const mount=document.querySelector('#readyCharacterCandidateMount');if(!mount)return;
    installReferenceStyle();
    const i=safeRead();if(i.onboardingStep!=='CHARACTER')return;
    if(mount.dataset.candidateFallback==='1')return;
    mount.dataset.candidateFallback='1';mount.classList.add('ccPanel');
    mount.innerHTML='<div class="ccConsult"><b>사진은 그대로 보관 중이에요.</b><p>기분 선택 화면을 다시 연결해 주세요. 생성과 비용은 잠겨 있어요.</p><button data-fallback-handoff style="min-height:44px">다시 연결</button></div>';
    mount.querySelector('[data-fallback-handoff]')?.addEventListener('click',()=>ensureCandidate(true));
  };

  const mountCandidate=()=>{
    installReferenceStyle();
    const mount=document.querySelector('#readyCharacterCandidateMount'),candidate=window.ReadyCharacterCandidateV1;
    if(!mount||!candidate)return false;
    try{if(candidate.mount)candidate.mount(mount);else if(candidate.render)candidate.render(mount);else return false}catch(error){console.error('[Ready Candidate Mount]',error);return false}
    return mount.dataset.candidateUi===candidate.version || !!mount.querySelector('[data-mood-tile],[data-candidate-action],.ccMaking,.ccReady,.ccRefine,.ccIntro');
  };
  let candidateLoading=null,candidateAttempted=false;
  const ensureCandidate=async(force=false)=>{
    const step=safeRead().onboardingStep;
    if(step!=='CHARACTER')return true;
    if(window.ReadyCharacterCandidateV1){if(mountCandidate())return true}
    if(candidateLoading)return candidateLoading;
    if(candidateAttempted&&!force){fallbackConsult('CANDIDATE_UNAVAILABLE');return false}
    candidateAttempted=true;
    candidateLoading=(async()=>{
      try{
        if(!globalThis.ReadyMoodDirectionV2)await load('./ready-mood-direction-v2.js?v=20260911-mood2',8000);
        if(!window.ReadyCharacterCandidateV1)await load(`${CANDIDATE}${force?'&retry='+Date.now():''}`,8000);
        if(!window.ReadyCharacterCandidateV1)throw new Error('CANDIDATE_GLOBAL_MISSING');
        if(!mountCandidate())throw new Error('CANDIDATE_MOUNT_FAILED');
        document.querySelector('#readyCharacterCandidateMount')?.removeAttribute('data-candidate-fallback');
        mark('CANDIDATE_READY');return true;
      }catch(error){console.error('[Ready Candidate Boot]',error);mark('DEGRADED',error.message||'CANDIDATE_BOOT_FAILED');fallbackConsult(error.message||'CANDIDATE_BOOT_FAILED');return false}
      finally{candidateLoading=null}
    })();return candidateLoading;
  };
  // The mounted PHOTO button owns activation. Recovery must not replace it
  // between Safari focus/pageshow and the synthesized click.
  window.addEventListener('ready-character-consultation',()=>{releaseStaticPaint();ensureCandidate()});
  const bootIdentity=async()=>{
    mark('IDENTITY_LOADING');
    if(!window.ReadyIdentityV1)await load(IDENTITY);
    if(!window.ReadyIdentityV1)throw new Error('IDENTITY_OWNER_MISSING');
    window.ReadyIdentityV1.render?.();
    releaseStaticPaint();
    mark('IDENTITY_READY');
  };
  const bootRest=async()=>{
    await ensureCandidate();
    for(const src of AFTER_IDENTITY){try{await load(src)}catch(error){console.error('[Ready Optional Boot]',src,error);mark('DEGRADED',src)}}
    window.ReadyOnboardingFlowCompletionV1?.render?.();window.ReadyStageF?.render?.();window.ReadyStageG11?.hydrateParentInputs?.();window.ReadyStageG14?.render?.();window.ReadyBaseNativeV2?.render?.();window.ReadyBaseRuntimeV1?.syncSelectedTask?.();window.ReadyFocusToolsV1?.render?.();window.ReadyScheduleBaseV1?.render?.();window.ReadyWorldShellV1?.render?.();window.ReadyParentSetupHubV1?.render?.();mountCandidate();if(document.documentElement.dataset.readyBootState!=='DEGRADED')mark('READY');
  };
  const recover=()=>{
    releaseStaticPaint();
    const i=safeRead();
    if(window.ReadyIdentityV1&&!window.ReadyIdentityV1.isReady?.()){
      (window.ReadyIdentityV1.recover||window.ReadyIdentityV1.render)?.();
      document.documentElement.classList.add('readyFirstRun');
      if(i.onboardingStep==='CHARACTER'){
        if(!document.querySelector('#readyCharacterCandidateMount'))window.ReadyIdentityV1.render?.();
        if(!mountCandidate())ensureCandidate();
      }
      setTimeout(()=>window.ReadyOnboardingFlowCompletionV1?.render?.(),0);
    }
  };
  (async()=>{mark('BOOT');await bootIdentity();bootRest().catch(error=>{console.error('[Ready Post Identity Boot]',error);mark('DEGRADED',error.message||'POST_IDENTITY');fallbackConsult(error.message||'POST_IDENTITY')});window.addEventListener('pageshow',recover);window.addEventListener('focus',recover);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recover()});document.documentElement.dataset.readyStageLoader=VERSION})().catch(error=>{console.error('[Ready Identity Boot]',error);releaseStaticPaint();mark('IDENTITY_ERROR',error.message||'UNKNOWN');document.documentElement.dataset.readyStageLoader='ERROR';const t=document.getElementById('toast');if(t){t.textContent=`Identity 시작 오류 · ${error.message}`;t.hidden=false}});
})();