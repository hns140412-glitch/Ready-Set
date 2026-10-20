/* Ready & Set: local first-journey interaction scenes.
 * Provenance: latest TAKY 2026-10-01 override supersedes legacy 5-6-person onboarding. No fabricated island artwork,
 * central verified family session, relationship score, or generated character.
 * Existing identity owner keeps the only persistence record.
 */
(() => {
 'use strict';
 if(window.ReadyFirstJourneyScenesV1)return;
 const steps=['TEAM_NAME','MAIN_INTRO_CHOICE','PACK_BAG','DEPARTURE','ISLAND_FIRST_SIGHT','ISLAND_NAME',
              'BASECAMP_DISCOVERY','BASECAMP_NAME','BASECAMP_ARRIVAL'];
 const gear=[
  ['map','지도','길을 찾아볼 때'],
  ['lantern','랜턴','어두운 곳을 비출 때'],
  ['water','물통','쉬어 갈 때'],
  ['camera','카메라','발견을 기록할 때'],
  ['hat','모자','밖으로 나갈 때'],
  ['compass','나침반','방향을 정할 때']
 ];
 const $=s=>document.querySelector(s);
 const identity=()=>window.ReadyIdentityV1?.get?.()||{};
 const patch=diff=>window.ReadyIdentityV1.patch(diff);
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status={lastStep:null,transitions:0,completed:false};
 function style(){
  if($('#readyFirstJourneyScenesStyle'))return;
  const el=document.createElement('style');el.id='readyFirstJourneyScenesStyle';
  el.textContent=`
    .rfj-scene{min-height:100dvh;box-sizing:border-box;display:flex;flex-direction:column;position:relative;padding:max(50px,calc(env(safe-area-inset-top) + 24px)) 24px max(32px,calc(env(safe-area-inset-bottom) + 22px));background:linear-gradient(#80c6f1 0%,#d8f5ff 52%,#b8e9db 100%);color:#103e61;overflow:hidden}
    .rfj-scene .rfj-kicker{font-size:11px;font-weight:900;letter-spacing:.17em}.rfj-scene h1{font-size:clamp(28px,9vw,38px);line-height:1.1;letter-spacing:-.055em;margin:13px 0 9px}.rfj-scene p{font-size:14px;font-weight:700;line-height:1.55;max-width:360px}
    .rfj-scene .rfj-body{flex:1;min-height:120px;display:flex;flex-direction:column;justify-content:center;gap:11px}.rfj-scene button,.rfj-scene input{font:inherit}
    .rfj-scene .rfj-choice{width:100%;padding:15px 16px;text-align:left;background:rgba(255,255,255,.87);border:2px solid transparent;color:#15445c;border-radius:20px;min-height:62px;display:flex;gap:12px;align-items:center;justify-content:space-between;font-weight:850}
    .rfj-scene .rfj-choice[aria-pressed=true]{border-color:#1872ab;background:#fff}.rfj-choice small{font-size:11px;opacity:.66;font-weight:650}
    .rfj-scene .rfj-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rfj-scene .rfj-grid .rfj-choice{min-height:78px;flex-direction:column;gap:1px;align-items:flex-start}
    .rfj-scene .rfj-crew-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .rfj-scene .rfj-crew-grid .rfj-choice{min-height:135px;align-items:center;justify-content:center;text-align:center;padding:9px 4px;flex-direction:column}
    .rfj-scene .rfj-crew-grid img{width:82px;height:82px;max-width:100%;object-fit:contain}
    .rfj-scene .rfj-crew-count{font-size:12px;font-weight:900;color:#12578b}
    @media(max-height:740px){.rfj-scene .rfj-crew-grid img{width:55px;height:55px}.rfj-scene .rfj-crew-grid .rfj-choice{min-height:97px}}
    .rfj-scene .rfj-primary{width:100%;border:0;border-radius:22px;min-height:57px;font-size:17px;font-weight:900;color:#fff;background:#1379b8;box-shadow:0 7px 17px rgba(22,89,136,.22)}
    .rfj-scene .rfj-primary:disabled{opacity:.4}.rfj-scene .rfj-secondary{border:0;background:transparent;color:#185d85;font-weight:800;min-height:43px}
    .rfj-scene .rfj-field{font-size:24px;padding:17px 14px;border:2px solid #8cbfd8;border-radius:18px;background:white;color:#153e57;width:100%;box-sizing:border-box}
    .rfj-scene .rfj-art{width:min(76vw,260px);height:205px;object-fit:contain;display:block;margin:0 auto;filter:drop-shadow(0 15px 13px rgba(34,95,118,.18))}
    .rfj-scene .rfj-note{font-size:11px;opacity:.68;font-weight:650;margin:8px 0}
    .rfj-scene .rfj-progress{font-size:12px;font-weight:850;letter-spacing:.11em;opacity:.75}
    @media(max-height:690px){.rfj-scene{padding-top:28px}.rfj-scene .rfj-art{height:140px}.rfj-scene h1{margin:7px 0 5px}}
  `;
  document.head.appendChild(el);
 }
 function screen(root,step,num,title,detail,body,nextLabel){
  root.innerHTML=`<section class="rfj-scene" data-rfj-step="${step}"><div class="rfj-kicker">READY & SET · FIRST JOURNEY</div><div class="rfj-progress">${num} / 12</div><h1>${title}</h1><p>${detail}</p><div class="rfj-body">${body}</div><button type="button" class="rfj-primary" id="rfjNext" disabled>${nextLabel}</button><button type="button" class="rfj-secondary" id="rfjBack">이전 장면</button></section>`;
  status.lastStep=step;
  const b=root.querySelector('#rfjNext'),back=root.querySelector('#rfjBack');
  const previous={TEAM_NAME:'MODE',MAIN_INTRO_CHOICE:'EXPLORER',PACK_BAG:'CHARACTER',DEPARTURE:'PACK_BAG',ISLAND_FIRST_SIGHT:'DEPARTURE',
   ISLAND_NAME:'ISLAND_FIRST_SIGHT',BASECAMP_DISCOVERY:'ISLAND_NAME',
   BASECAMP_NAME:'BASECAMP_DISCOVERY',BASECAMP_ARRIVAL:'BASECAMP_NAME'};
  back.onclick=()=>{patch({onboardingStep:previous[step]}); if(previous[step]==='MODE'||previous[step]==='CHARACTER'){window.ReadyIdentityV1?.render?.(root)}else if(previous[step]==='EXPLORER'){window.ReadyExplorerIntroCanonicalV1?.render?.(root)}else if(previous[step]==='CHARACTER'){window.ReadyIdentityV1?.render?.(root)}else render()};
  return b;
 }
 function move(next,fields={}){
  patch({...fields,onboardingStep:next,status:'FIRST_JOURNEY_IN_PROGRESS'});
  status.transitions++;render();
 }
 function render(){
  const record=identity(),step=record.onboardingStep;
  if(!steps.includes(step)||record.status==='READY')return false;
  const root=$('#readyFirstRun');if(!root)return false;
  if(root.querySelector('[data-rfj-step]')?.dataset.rfjStep===step)return true;
  style();
  const actor='<img class="rfj-art" src="./characters/ui_cutouts/dubi.png" alt="기존 탐험대원 두비">';
  if(step==='TEAM_NAME'){
   const next=screen(root,step,1,'우리 탐험대 이름을 지어 볼까?','함께 부를 탐험대 이름을 직접 정해요.',
    '<label for="rfjTeamName">탐험대 이름</label><input class="rfj-field" id="rfjTeamName" maxlength="32" autocomplete="off" placeholder="우리 탐험대 이름">','이 이름으로 만나러 가기');
   const input=root.querySelector('#rfjTeamName');input.value=record.teamName||'';
   const update=()=>{next.disabled=!input.value.trim()||/[<>\x00-\x1f]/.test(input.value)};
   input.addEventListener('input',update);update();
   next.onclick=()=>{patch({teamName:input.value.trim(),onboardingStep:'EXPLORER'});
    window.ReadyExplorerIntroCanonicalV1?.render?.(root)};
  }else if(step==='MAIN_INTRO_CHOICE'){
   const crew=[['dubi','두비'],['lori','로리'],['ink','잉크'],['nova','노바'],['take','테이크'],['zero','제로']];
   const seen=new Set(record.introSeenCrewIds||[]);
   if(crew.some(([id])=>!seen.has(id))){
    patch({onboardingStep:'EXPLORER'});
    window.ReadyExplorerIntroCanonicalV1?.render?.(root);
    return true;
   }
   let selectedId=null;
   const body='<div class="rfj-crew-grid">'+crew.map(([id,name])=>`<button type="button" class="rfj-choice" data-rfj-primary="${id}" aria-pressed="false"><img src="./characters/ui_cutouts/${id}.png" alt=""><b>${name}</b></button>`).join('')+'</div><p class="rfj-note">여섯 명 모두 계속 함께합니다. 지금은 첫 동행 희망 1명만 고르며, 관계·친밀도와 정식 주 동행 확정은 중앙 탐험대 엔진에서 별도로 처리합니다.</p>';
   const next=screen(root,step,3,'첫 동행, 한 명을 골라요','여섯 친구 중 처음 함께 출발하고 싶은 대원 한 명을 골라요.',body,'이 친구와 첫 탐험 시작');
   root.querySelectorAll('[data-rfj-primary]').forEach(button=>button.onclick=()=>{
    selectedId=button.dataset.rfjPrimary;
    root.querySelectorAll('[data-rfj-primary]').forEach(item=>
     item.setAttribute('aria-pressed',String(item.dataset.rfjPrimary===selectedId)));
    next.disabled=false;
   });
   next.onclick=()=>{
    if(!crew.some(([id])=>id===selectedId))return;
    const name=crew.find(([id])=>id===selectedId)[1];
    const nextStep=!record.legalName||!record.birthDate||!record.schoolStage?'PROFILE':
      record.characterVisualId||record.characterSetupState==='DEFERRED_NO_COST'?'PACK_BAG':
      record.sourcePhoto?'CHARACTER':'PHOTO';
    patch({onboardingStep:nextStep,introPreferredCrewId:selectedId,
      explorerId:selectedId,explorerName:name,
      introChoiceState:'SINGLE_PREFERENCE_PENDING_CANONICAL_MAIN',
      journeyTheme:record.journeyTheme||'TODAYS_ISLAND',
      status:'INTRO_CREW_PREVIEW_SELECTED'});
    window.ReadyIdentityV1?.render?.(root);
   };
  }else if(step==='PACK_BAG'){
   const selected=new Set(record.packedItems||[]);
   const body='<div class="rfj-grid">'+gear.map(([id,name,note])=>`<button type="button" class="rfj-choice" data-rfj-gear="${id}" aria-pressed="${selected.has(id)}"><b>${name}</b><small>${note}</small></button>`).join('')+'</div>';
   const next=screen(root,step,5,'출발할 준비를 해볼까?','실제로 가져갈 탐험 장비를 직접 골라 주세요. (1~6개)',body,'출발 준비 끝!');
   const update=()=>{next.disabled=!selected.size;root.querySelectorAll('[data-rfj-gear]').forEach(x=>x.setAttribute('aria-pressed',String(selected.has(x.dataset.rfjGear))))};
   root.querySelectorAll('[data-rfj-gear]').forEach(x=>x.onclick=()=>{const key=x.dataset.rfjGear;selected.has(key)?selected.delete(key):selected.add(key);update()});
   update();next.onclick=()=>move('DEPARTURE',{packedItems:[...selected]});
  }else if(step==='DEPARTURE'){
   let route=record.departureMode||null;
   const body=actor+'<div class="rfj-grid"><button type="button" class="rfj-choice" data-rfj-route="FALL">구름 낙하하기<small>하늘길</small></button><button type="button" class="rfj-choice" data-rfj-route="SAIL">배 타고 가기<small>바닷길</small></button></div>';
   const next=screen(root,step,6,'드디어 출발이야!','구름을 지나 내려갈까? 배를 타고 항해할까?',body,'우리의 섬을 향해!');
   const update=()=>{next.disabled=!route;root.querySelectorAll('[data-rfj-route]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.rfjRoute===route)))};
   root.querySelectorAll('[data-rfj-route]').forEach(x=>x.onclick=()=>{route=x.dataset.rfjRoute;update()});update();
   next.onclick=()=>move('ISLAND_FIRST_SIGHT',{departureMode:route});
  }else if(step==='ISLAND_FIRST_SIGHT'){
   const next=screen(root,step,7,'저기, 우리의 섬이야!','확정된 원본 섬을 만나는 단계예요. 섬 이름은 다음 장면에서 직접 정합니다.',actor+'<p class="rfj-note">원본 섬 시각 자료는 승인 에셋 연결이 필요하며, 임의 섬 이미지를 생성하지 않습니다.</p>','우리 섬 이름짓기');
   next.disabled=false;next.onclick=()=>move('ISLAND_NAME',{islandSeen:true});
  }else if(step==='ISLAND_NAME'){
   const body='<label for="rfjIslandName">섬 이름을 직접 적어 줘</label><input class="rfj-field" id="rfjIslandName" maxlength="32" autocomplete="off" placeholder="우리 섬 이름">';
   const next=screen(root,step,8,'이 섬의 이름은?','탐험대가 함께 부를 이름을 지어 주세요.',body,'이 이름으로 결정하기');
   const input=root.querySelector('#rfjIslandName');input.value=record.islandName||'';
   const validate=()=>{next.disabled=!input.value.trim()||/[<>\x00-\x1f]/.test(input.value)};input.addEventListener('input',validate);validate();
   next.onclick=()=>move('BASECAMP_DISCOVERY',{islandName:input.value.trim(),worldPlaceName:input.value.trim()});
  }else if(step==='BASECAMP_DISCOVERY'){
   const next=screen(root,step,9,'여기가 우리의 베이스캠프야!','준비하고, 쉬고, 다음 학습을 시작하는 우리만의 거점이에요.',actor,'베이스캠프 이름짓기');
   next.disabled=false;next.onclick=()=>move('BASECAMP_NAME',{basecampDiscovered:true});
  }else if(step==='BASECAMP_NAME'){
   const body='<label for="rfjBasecampName">우리 베이스캠프 이름</label><input class="rfj-field" id="rfjBasecampName" maxlength="32" autocomplete="off" placeholder="베이스캠프 이름">';
   const next=screen(root,step,10,'베이스캠프 이름을 정해 줘!','섬 이름과 베이스캠프 이름은 별도 기록으로 남겨요.',body,'이 이름으로 결정하기');
   const input=root.querySelector('#rfjBasecampName');input.value=record.basecampName||'';
   const validate=()=>{next.disabled=!input.value.trim()||/[<>\x00-\x1f]/.test(input.value)};input.addEventListener('input',validate);validate();
   next.onclick=()=>move('BASECAMP_ARRIVAL',{basecampName:input.value.trim()});
  }else if(step==='BASECAMP_ARRIVAL'){
   const title=escape(record.basecampName||'우리의 베이스캠프');
   const next=screen(root,step,11,`${title}에 도착했어!`,`${escape(record.islandName||'우리 섬')}에서 오늘의 도전이 시작돼요.`,actor,'Ready & Set 시작하기');
   next.disabled=false;
   next.onclick=()=>{
    const final=identity();
    if(!final.packedItems?.length||!['SAIL','FALL'].includes(final.departureMode)
       ||!final.islandName?.trim()||!final.basecampName?.trim())return;
    try{
      window.ReadyIdentityV1.complete({islandName:final.islandName,
        worldPlaceName:final.islandName,basecampName:final.basecampName,
        departureMode:final.departureMode,packedItems:final.packedItems,
        journeyEvidenceState:'LOCAL_SCENES_ONLY_CENTRAL_UNVERIFIED'});
      root.remove();document.documentElement.classList.remove('readyFirstRun','identityFirstPaint');
      status.completed=true;
      window.ReadyRoleContextV1?.activateIdentityRole?.({reload:true});
    }catch(error){next.textContent='저장 실패 · 다시 시도하기';next.dataset.error=String(error.message||error)}
   };
  }
  return true;
 }
 function beginAfterTheme(theme,root){
  const record=identity();
  if(!theme||!record.explorerId)return false;
  move('PACK_BAG',{journeyTheme:theme,teamName:record.teamName||((record.nickname||'Ready')+' 탐험대')});
  return true;
 }
 let lock=false;
 const observer=new MutationObserver(()=>{if(lock)return;lock=true;try{render()}finally{lock=false}});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('pageshow',render);
 window.ReadyFirstJourneyScenesV1=Object.freeze({version:'2026-10-17-FIRST-JOURNEY-LOCAL-SCENES',
  steps:steps.slice(),render,beginAfterTheme,snapshot:()=>({...status})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
