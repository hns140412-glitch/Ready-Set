(() => {
  'use strict';
  const VERSION='2026.09.10-stage-identity-owner-v8.2';
  const IDENTITY='./ready-onboarding-identity-v1.js';
  const CANDIDATE='./ready-character-candidate-v1.js?v=20260910-character-v9-mount2';
  const AFTER_IDENTITY=['./ready-stage-c-base.js','./ready-stage-d.js','./ready-stage-e.js','./ready-stage-f.js','./ready-stage-g1-fix.js','./ready-stage-g14-planner-authority.js','./ready-base-native-v2.js','./ready-planner-selection-bridge-v1.js','./ready-focus-tools-v1.js','./ready-schedule-base-v1.js','./ready-world-base-v1.js','./ready-world-shell-v1.js','./ready-base-selftest-v1.js'];
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(src);s.onerror=()=>reject(new Error(`LOAD_FAILED:${src}`));document.head.appendChild(s)});
  const mark=(state,detail='')=>{document.documentElement.dataset.readyBootState=state;if(detail)document.documentElement.dataset.readyBootDetail=detail};
  const releaseStaticPaint=()=>document.documentElement.classList.remove('identityFirstPaint');
  const safeRead=()=>{try{return JSON.parse(localStorage.getItem('readyset_identity_v1')||'{}')||{}}catch{return {}}};
  const safeWrite=v=>localStorage.setItem('readyset_identity_v1',JSON.stringify(v));
  const CONSULT_STEPS=[
    {key:'MOOD',title:'어떤 분위기가 끌려?',hint:'첫인상과 움직임의 느낌을 골라봐.',tiles:[['BOLD','당당한 발견가','선명하고 자신감 있게'],['PLAYFUL','자유로운 탐험가','경쾌하고 재치 있게'],['MYSTERIOUS','신비로운 관찰가','차분하고 호기심 있게']]},
    {key:'STYLE',title:'어떤 스타일로 떠나볼까?',hint:'착장과 헤어 스타일링의 방향을 골라봐.',tiles:[['FIELD','필드 익스플로러','활동적인 아웃도어'],['URBAN','모던 어드벤처','깔끔하고 세련된 캐주얼'],['STORY','스토리 트래블러','특별한 여행자 무드']]},
    {key:'GEAR',title:'탐험의 한 장면을 완성한다면?',hint:'캐릭터를 기억하게 할 대표 아이템을 골라봐.',tiles:[['CAMERA','기록하는 발견가','카메라와 기록 장비'],['OPTICS','멀리 보는 탐험가','쌍안경과 관찰 도구'],['MAP','길을 만드는 탐험가','지도와 나침반']]}
  ];
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
    const i=safeRead(),cs=i.characterStyleConsultation||{version:1,step:0,picks:{}},picks=cs.picks||{};
    const complete=CONSULT_STEPS.every(x=>picks[x.key]);
    const idx=Math.max(0,Math.min(2,Number(cs.step)||0)),step=CONSULT_STEPS[idx];
    mount.classList.add('ccPanel');mount.dataset.candidateFallback='1';
    if(complete){
      mount.innerHTML=`<div class="ccConsult"><span class="ccKicker">STYLE CONSULTATION · COMPLETE</span><b>좋아, Judy의 탐험 스타일이 모였어.</b><p>이제 같은 얼굴 기준으로 서로 다른 세 가지 후보를 만들 차례야.</p><div class="ccSummary">${CONSULT_STEPS.map(x=>`<span><small>${x.key}</small><strong>${(x.tiles.find(t=>t[0]===picks[x.key])||[])[1]||''}</strong></span>`).join('')}</div><button data-fallback-handoff>후보 생성 단계 연결</button><small>${detail?`연결 진단 · ${detail}`:'선택 내용은 안전하게 저장되어 있어요.'}</small></div>`;
      mount.querySelector('[data-fallback-handoff]')?.addEventListener('click',()=>ensureCandidate(true));return;
    }
    mount.innerHTML=`<div class="ccConsult"><span class="ccKicker">STYLE CONSULTATION · ${idx+1} / 3</span><b>${step.title}</b><p>${step.hint}</p><div class="ccTileGrid">${step.tiles.map((t,n)=>`<button class="ccTile ccTone${n+1}" data-fallback-key="${t[0]}"><span class="ccArt"><i></i><i></i><i></i></span><strong>${t[1]}</strong><small>${t[2]}</small></button>`).join('')}</div>${idx?'<button class="ccTextButton" data-fallback-back>이전 선택</button>':''}<small>얼굴은 기준 사진 그대로 두고, 스타일만 선택해요.</small></div>`;
    mount.querySelectorAll('[data-fallback-key]').forEach(b=>b.onclick=()=>{const nextPicks={...picks,[step.key]:b.dataset.fallbackKey};const next=Math.min(2,idx+1);safeWrite({...i,characterStyleConsultation:{version:1,step:next,picks:nextPicks,completedAt:CONSULT_STEPS.every(x=>nextPicks[x.key])?new Date().toISOString():null},updatedAt:new Date().toISOString()});fallbackConsult(detail)});
    mount.querySelector('[data-fallback-back]')?.addEventListener('click',()=>{safeWrite({...i,characterStyleConsultation:{...cs,step:Math.max(0,idx-1),picks},updatedAt:new Date().toISOString()});fallbackConsult(detail)});
  };
  const mountCandidate=()=>{
    installReferenceStyle();
    const mount=document.querySelector('#readyCharacterCandidateMount'),candidate=window.ReadyCharacterCandidateV1;
    if(!mount||!candidate)return false;
    try{if(candidate.mount)candidate.mount(mount);else if(candidate.render)candidate.render(mount);else return false}catch(error){console.error('[Ready Candidate Mount]',error);return false}
    return mount.dataset.candidateUi===candidate.version || !!mount.querySelector('[data-style-tile],[data-candidate-action],.ccMaking,.ccReady,.ccRefine,.ccIntro');
  };
  let candidateLoading=null;
  const ensureCandidate=async(force=false)=>{
    if(window.ReadyCharacterCandidateV1&&!force){if(mountCandidate())return true}
    if(candidateLoading&&!force)return candidateLoading;
    candidateLoading=(async()=>{
      try{
        if(force)delete window.ReadyCharacterCandidateV1;
        await load(`${CANDIDATE}${force?'&retry='+Date.now():''}`);
        if(!window.ReadyCharacterCandidateV1)throw new Error('CANDIDATE_GLOBAL_MISSING');
        if(!mountCandidate())throw new Error('CANDIDATE_MOUNT_FAILED');
        document.querySelector('#readyCharacterCandidateMount')?.removeAttribute('data-candidate-fallback');
        mark('CANDIDATE_READY');return true;
      }catch(error){console.error('[Ready Candidate Boot]',error);mark('DEGRADED',error.message||'CANDIDATE_BOOT_FAILED');fallbackConsult(error.message||'CANDIDATE_BOOT_FAILED');return false}
      finally{candidateLoading=null}
    })();return candidateLoading;
  };
  const bootIdentity=async()=>{mark('IDENTITY_LOADING');await load(IDENTITY);if(!window.ReadyIdentityV1)throw new Error('IDENTITY_OWNER_MISSING');releaseStaticPaint();mark('IDENTITY_READY')};
  const bootRest=async()=>{
    await ensureCandidate();
    for(const src of AFTER_IDENTITY){try{await load(src)}catch(error){console.error('[Ready Optional Boot]',src,error);mark('DEGRADED',src)}}
    window.ReadyStageF?.render?.();window.ReadyStageG11?.hydrateParentInputs?.();window.ReadyStageG14?.render?.();window.ReadyBaseNativeV2?.render?.();window.ReadyBaseRuntimeV1?.syncSelectedTask?.();window.ReadyFocusToolsV1?.render?.();window.ReadyScheduleBaseV1?.render?.();window.ReadyWorldShellV1?.render?.();mountCandidate();if(document.documentElement.dataset.readyBootState!=='DEGRADED')mark('READY');
  };
  const recover=()=>{releaseStaticPaint();if(window.ReadyIdentityV1&&!window.ReadyIdentityV1.isReady?.()){document.documentElement.classList.add('readyFirstRun');if(document.querySelector('#readyCharacterCandidateMount')){if(!mountCandidate())ensureCandidate()}}};
  (async()=>{mark('BOOT');await bootIdentity();bootRest().catch(error=>{console.error('[Ready Post Identity Boot]',error);mark('DEGRADED',error.message||'POST_IDENTITY');fallbackConsult(error.message||'POST_IDENTITY')});window.addEventListener('pageshow',recover);window.addEventListener('focus',recover);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recover()});document.documentElement.dataset.readyStageLoader=VERSION})().catch(error=>{console.error('[Ready Identity Boot]',error);mark('IDENTITY_ERROR',error.message||'UNKNOWN');document.documentElement.dataset.readyStageLoader='ERROR';const t=document.getElementById('toast');if(t){t.textContent=`Identity 시작 오류 · ${error.message}`;t.hidden=false}});
})();