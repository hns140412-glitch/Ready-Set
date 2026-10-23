(() => {
  'use strict';
  if(window.ReadyOnboardingFlowCompletionV1)return;
  const VERSION='2026.09.13-first-journey-completion-v4-idempotent-steps';
  const INTRO_KEY='readyset_intro_seen_v1';
  const identity=()=>window.ReadyIdentityV1?.get?.()||{};
  const patch=p=>window.ReadyIdentityV1?.patch?.(p);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const guides=[
    {id:'lumi',name:'루미',asset:'./assets/guide-lumi.png',line:'차분하게 옆에서 길을 같이 찾아요.'},
    {id:'pico',name:'피코',asset:'./assets/guide-pico.png',line:'가볍고 빠르게 다음 단서를 찾아요.'},
    {id:'mori',name:'모리',asset:'./assets/guide-mori.png',line:'천천히 살피며 끝까지 같이 가요.'}
  ];
  const themes=[
    {id:'TODAYS_ISLAND',title:'오늘의 섬',line:'오늘 할 일을 하나씩 발견하는 기본 탐험'},
    {id:'SKY_ROUTE',title:'하늘길',line:'멀리 있는 목표를 길처럼 이어 보는 탐험'},
    {id:'FOREST_TRAIL',title:'숲길',line:'작은 단서를 따라 차근차근 가는 탐험'}
  ];
  function root(){return document.getElementById('readyFirstRun')}
  function installStyle(){
    if(document.getElementById('readyOnboardingCompletionStyle'))return;
    const s=document.createElement('style');s.id='readyOnboardingCompletionStyle';s.textContent=`
      .rof-intro{min-height:100dvh;box-sizing:border-box;padding:max(64px,calc(env(safe-area-inset-top) + 38px)) 26px max(34px,calc(env(safe-area-inset-bottom) + 22px));background:linear-gradient(#83d3ff,#ebfaff 58%,#71cfe5);color:#123f63;display:flex;flex-direction:column}.rof-intro .brand{font-size:11px;font-weight:950;letter-spacing:.18em}.rof-intro h1{font-size:36px;line-height:1.04;letter-spacing:-.045em;margin:14px 0 10px}.rof-intro p{font-size:14px;line-height:1.55;font-weight:750;opacity:.74;margin:0}.rof-intro .flow{margin-top:30px;display:grid;gap:10px}.rof-intro .flow span{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:17px;background:rgba(255,255,255,.78);font-size:12px;font-weight:900}.rof-intro .flow i{width:26px;height:26px;border-radius:9px;background:#0d8ee9;color:#fff;display:grid;place-items:center;font-style:normal;font-size:11px}.rof-intro button,.rof-primary{width:100%;border:0;border-radius:18px;background:#0d8ee9;color:#fff;padding:15px;font-size:15px;font-weight:950}.rof-intro button{margin-top:auto}.rof-defer{width:100%;border:1px solid rgba(18,63,99,.18);border-radius:18px;background:rgba(255,255,255,.84);color:#15537b;padding:14px;font-weight:950;margin:8px 0}.rof-defer small{display:block;font-size:10px;opacity:.62;margin-top:4px}.rof-grid{display:grid;gap:12px;margin:24px 0}.rof-guide,.rof-theme{width:100%;border:2px solid transparent;border-radius:24px;background:rgba(255,255,255,.86);padding:13px;text-align:left;color:#123f63;box-shadow:0 14px 30px rgba(24,93,133,.12)}.rof-guide{display:grid;grid-template-columns:86px 1fr;align-items:center;gap:14px}.rof-guide img{width:86px;height:86px;border-radius:22px;object-fit:cover;background:#eef8fb}.rof-guide b,.rof-guide small,.rof-theme b,.rof-theme small{display:block}.rof-guide b,.rof-theme b{font-size:16px}.rof-guide small,.rof-theme small{font-size:11px;line-height:1.4;opacity:.66;margin-top:5px}.rof-theme{padding:18px}.rof-theme[data-selected='1'],.rof-guide[data-selected='1']{border-color:#0d8ee9;background:#fff}.rof-summary{padding:16px;border-radius:20px;background:rgba(255,255,255,.78);font-size:12px;line-height:1.55;margin:18px 0}.rof-summary b{display:block;font-size:15px;margin-bottom:5px}
    `;
    s.textContent+=`
      .rof-intro.rof-brand-entry{isolation:isolate;position:relative;overflow:hidden;background:linear-gradient(180deg,#72b8ef 0%,#ccecfb 47%,#9edccc 100%);padding:max(49px,calc(env(safe-area-inset-top) + 20px)) 23px max(32px,calc(env(safe-area-inset-bottom) + 18px));}
      .rof-brand-entry::before{content:'';position:absolute;inset:12% -30% auto;height:55%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,255,255,.66),rgba(255,255,255,0) 70%);z-index:-1;pointer-events:none}
      .rof-brand-entry .brand{display:flex;align-items:center;justify-content:space-between;font-size:13px;letter-spacing:.18em;color:#164765;}
      .rof-brand-entry .brand small{font-size:11px;letter-spacing:0;font-weight:850;background:rgba(255,255,255,.75);padding:7px 11px;border-radius:999px}
      .rof-brand-entry .brandIntroTitle{text-align:center;margin:7vh 0 5px;color:#fff;text-shadow:0 4px 16px rgba(19,96,142,.25),0 2px 0 #2e749c;font:900 clamp(37px,11.8vw,55px)/1.05 system-ui,-apple-system,sans-serif;letter-spacing:-.06em}
      .rof-brand-entry .brandIntroLine{text-align:center;margin:9px auto 0;line-height:1.45;font-size:16px;font-weight:900;color:#165c70}
      .rof-brand-entry .brandIntroActor{width:min(80vw,350px);flex:1;min-height:220px;max-height:390px;position:relative;display:flex;align-items:center;justify-content:center;margin:auto}
      .rof-brand-entry .brandIntroActor::before{content:'';position:absolute;bottom:17%;width:85%;height:21%;background:rgba(17,116,125,.22);filter:blur(23px);border-radius:50%}
      .rof-brand-entry .brandIntroActor img{max-height:100%;width:100%;object-fit:contain;filter:drop-shadow(0 15px 14px rgba(14,91,105,.18))}
      .rof-brand-entry .brandIntroCaption{text-align:center;display:block;color:#14526a;font-size:12px;font-weight:800;margin-top:-18px;margin-bottom:15px;z-index:1}
      .rof-brand-entry .brandIntroButton{position:relative;margin-top:0;min-height:58px;border-radius:24px;background:#f9fff8;color:#136659;box-shadow:0 7px 0 rgba(41,112,91,.18),0 16px 32px rgba(25,98,98,.2);font-size:19px;letter-spacing:-.025em}
      .rof-brand-entry .brandIntroButton:focus-visible{outline:4px solid #155c92;outline-offset:3px}
      .rof-brand-entry .brandIntroFooter{text-align:center;display:block;color:#1e6372;opacity:.86;font-size:11px;font-weight:800;margin-top:21px}
      @media(max-height:690px){.rof-brand-entry .brandIntroTitle{margin-top:2vh}.rof-brand-entry .brandIntroActor{min-height:135px;max-height:245px}.rof-brand-entry .brandIntroCaption{margin-top:-5px}}
    `;
    document.head.appendChild(s);
  }
  function startIntro(){
    localStorage.setItem(INTRO_KEY,'1');
    window.ReadyIdentityV1?.render?.();
    setTimeout(sync,0);
  }
  function welcome(r){
    if(localStorage.getItem(INTRO_KEY)==='1')return false;
    const existing=r.querySelector('#rofIntroStart');
    if(existing){
      if(existing.dataset.bound!=='1'){existing.dataset.bound='1';existing.addEventListener('click',startIntro)}
      return true;
    }
    r.innerHTML=`<div class="rof-intro rof-brand-entry"><div class="brand"><span>GUIDE</span><small>FIRST JOURNEY</small></div><h1 class="brandIntroTitle">Ready & Set</h1><p class="brandIntroLine">오늘도, 작은 도전이<br>큰 이야기가 되어!</p><div class="brandIntroActor"><img src="./characters/ui_cutouts/dubi.png" alt="첫 탐험을 기다리는 탐험대원 두비"></div><span class="brandIntroCaption">우리의 탐험은 여기서 시작돼요.</span><button id="rofIntroStart" class="brandIntroButton" type="button">시작하기 &rarr;</button><small class="brandIntroFooter">탐험대원 첫 만남 · 나의 준비 · 첫 섬 · 베이스캠프</small></div>`;
    const button=r.querySelector('#rofIntroStart');
    button.dataset.bound='1';
    button.addEventListener('click',startIntro);
    return true;
  }
  function addCharacterDefer(r,i){
    if(!r||r.querySelector('#rofCharacterDefer'))return;
    const sky=r.querySelector('.firstRunSky');if(!sky)return;
    const btn=document.createElement('button');btn.id='rofCharacterDefer';btn.type='button';btn.className='rof-defer';btn.innerHTML='<b>캐릭터는 나중에 완성하고 계속</b><small>지금은 비용 없이 인트로·시간표·숙제 기능부터 사용할 수 있어요.</small>';
    const back=sky.querySelector('.firstRunBack');sky.insertBefore(btn,back||null);
    btn.onclick=()=>{
      patch({characterSetupState:'DEFERRED_NO_COST',characterCandidateState:'DEFERRED',status:'CHARACTER_DEFERRED',onboardingStep:window.ReadyFirstJourneyScenesV1?'PACK_BAG':'EXPLORER'});renderStep();
    };
  }
  function explorer(r,i){
    const selected=i.explorerId||'lumi';
    r.innerHTML=`<div class="firstRunSky"><div class="firstRunCopy"><span>4 / 5 · EXPLORER</span><h1>${esc(i.nickname||'나')}와 같이 갈<br>탐험대를 골라볼까?</h1><p>길잡이는 답을 대신 정하지 않고, 다음 행동을 찾도록 옆에서 도와줘요.</p></div><div class="rof-grid">${guides.map(g=>`<button type="button" class="rof-guide" data-guide="${g.id}" data-selected="${selected===g.id?'1':'0'}"><img src="${g.asset}" alt="${g.name}"><span><b>${g.name}</b><small>${g.line}</small></span></button>`).join('')}</div><button type="button" class="rof-primary" id="rofExplorerNext">이 탐험대와 계속</button><button type="button" class="firstRunBack" id="rofExplorerBack">← 캐릭터 단계</button></div>`;
    r.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{r.querySelectorAll('[data-guide]').forEach(x=>x.dataset.selected='0');b.dataset.selected='1';const g=guides.find(x=>x.id===b.dataset.guide);patch({explorerId:g.id,explorerName:g.name});});
    r.querySelector('#rofExplorerNext').onclick=()=>{const now=identity(),g=guides.find(x=>x.id===(now.explorerId||selected))||guides[0];patch({explorerId:g.id,explorerName:g.name,teamName:`${now.nickname||'Ready'} 탐험대`,onboardingStep:'THEME',status:'EXPLORER_SELECTED'});renderStep()};
    r.querySelector('#rofExplorerBack').onclick=()=>{patch({onboardingStep:'CHARACTER'});window.ReadyIdentityV1?.render?.();setTimeout(sync,0)};
  }
  function theme(r,i){
    const selected=i.journeyTheme||'TODAYS_ISLAND';
    r.innerHTML=`<div class="firstRunSky"><div class="firstRunCopy"><span>5 / 5 · FIRST WORLD</span><h1>첫 탐험의 분위기를<br>정해볼까?</h1><p>나중에 바꿀 수 있어요. 먼저 기능을 시작하는 데 필요한 기본 세계만 정합니다.</p></div><div class="rof-grid">${themes.map(t=>`<button type="button" class="rof-theme" data-theme="${t.id}" data-selected="${selected===t.id?'1':'0'}"><b>${t.title}</b><small>${t.line}</small></button>`).join('')}</div><div class="rof-summary"><b>다음은 실제 준비 단계</b>보호자 모드라면 첫 화면에서 <strong>시간표 → 숙제 입력 → Planner</strong> 순서로 바로 이어집니다. 캐릭터 완성은 기능 사용을 막지 않아요.</div><button type="button" class="rof-primary" id="rofFinish">Ready & Set 열기</button><button type="button" class="firstRunBack" id="rofThemeBack">← 탐험대 다시 선택</button></div>`;
    r.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{r.querySelectorAll('[data-theme]').forEach(x=>x.dataset.selected='0');b.dataset.selected='1';patch({journeyTheme:b.dataset.theme})});
    r.querySelector('#rofFinish').onclick=()=>{
      const now=identity(),themeId=now.journeyTheme||selected,g=guides.find(x=>x.id===(now.explorerId||'lumi'))||guides[0];
      try{
        window.ReadyIdentityV1.complete({explorerId:g.id,explorerName:g.name,teamName:now.teamName||`${now.nickname||'Ready'} 탐험대`,journeyTheme:themeId,characterSetupState:now.characterVisualId?(now.characterSetupState||'CONFIRMED'):'DEFERRED_NO_COST',status:'READY'});
        document.getElementById('readyFirstRun')?.remove();
        document.documentElement.classList.remove('readyFirstRun','identityFirstPaint');
        window.ReadyRoleContextV1?.activateIdentityRole?.({reload:true});
      }catch(e){alert(`시작 준비를 마치지 못했어요 · ${e.message}`)}
    };
    r.querySelector('#rofThemeBack').onclick=()=>{patch({onboardingStep:'EXPLORER'});renderStep()};
  }
  function renderStep(){
    installStyle();const r=root(),i=identity();if(!r||i.status==='READY')return;
    if(i.onboardingStep==='MODE'){welcome(r);return}
    if(i.onboardingStep==='CHARACTER'){addCharacterDefer(r,i);return}
    if(i.onboardingStep==='EXPLORER'||i.onboardingStep==='THEME'){
      // Canonical Core6 is the sole owner of these two scenes.
      // Never fight its MutationObserver by painting the legacy 3-guide markup.
      if(window.ReadyExplorerIntroCanonicalV1){
        if(r.querySelector('[data-rc-screen]')?.dataset.rcScreen!==i.onboardingStep)
          window.ReadyExplorerIntroCanonicalV1.render(r);
        return;
      }
      if(i.onboardingStep==='EXPLORER'){if(!r.querySelector('#rofExplorerNext'))explorer(r,i);return}
      if(!r.querySelector('#rofFinish'))theme(r,i);
    }
  }
  function sync(){requestAnimationFrame(renderStep)}
  const observer=new MutationObserver(sync);observer.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('pageshow',sync);window.addEventListener('ready-character-candidate-ready',sync);
  window.ReadyOnboardingFlowCompletionV1={version:VERSION,render:renderStep,sync};
  sync();
})();