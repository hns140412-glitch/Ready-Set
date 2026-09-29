(function(root){'use strict';
/* Ready share editing surface: actual DOM + independent live Canvas output.
   PROFILE/Visual ID and Planner/Result are owners; this view changes only a transient
   presentation selection. No fake child, invented rewards, baked board or Kakao API. */
const MODES=Object.freeze([
 {theme:'drop',kind:'pre',label:'낙하 · 탐험 시작'},
 {theme:'drop',kind:'result',label:'낙하 · 탐험 완료'},
 {theme:'sail',kind:'pre',label:'항해 · 탐험 시작'},
 {theme:'sail',kind:'result',label:'항해 · 탐험 완료'}
]);
const LABELS={mission:'오늘의 미션',target:'목표 시간',focus:'집중 시간',done:'완료 과제',stars:'획득 별',reaction:'응원 메시지'};
const permitted=new Set(['mission','target','focus','done','stars','reaction']);
function node(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;}
function make(options={}){
 const project=options.projectShare,card=options.card,assets=options.assets,navProfile=options.openProfile||(()=>{});
 const notify=options.toast||(()=>{}),doc=options.document||document;
 let rootEl=null,selected=null,fields={},messageText='',crewSelection=null,includeProfile=true,requestId=0,prior=null,loadStatus='';
 function scene(theme,kind){return assets?.scenes?.[theme]?.[kind]?.path||null;}
 function getOptions(){return {theme:selected.theme,fields:{...fields},messageText:messageText.trim().slice(0,80),crewIds:crewSelection?Array.from(crewSelection):null,includeProfile};}
 function current(){return project?.(selected.kind,getOptions())||{ok:false,reason:'SHARE_PROJECTION_UNAVAILABLE'};}
 function modeButtons(){return [...rootEl.querySelectorAll('[data-share-mode]')];}
 function status(txt,ok=false){
  const el=rootEl?.querySelector('[data-share-status]');if(el){el.textContent=txt;el.dataset.ok=String(ok);}
 }
 function makeModeBox(m,i){
  const b=node('button','rss-theme');b.type='button';b.dataset.shareMode=String(i);b.setAttribute('aria-pressed',String(m.theme===selected.theme&&m.kind===selected.kind));
  const image=node('img');image.alt='';image.src=scene(m.theme,m.kind)||'';
  const name=node('strong','',m.label);b.append(image,name);return b;
 }
 function makeField(key){
  const row=node('label','rss-switch-row');const span=node('span','',LABELS[key]);const toggle=node('input');
  toggle.type='checkbox';toggle.dataset.shareField=key;toggle.checked=fields[key]!==false;
  row.append(span,toggle);return row;
 }
 function setProfile(d){
  const wrap=rootEl.querySelector('[data-share-profile]');wrap.replaceChildren();
  const av=node('div','rss-profile-icon');
  if(d?.avatar?.shared&&d.avatar?.asset){
   const img=node('img');img.src=d.avatar.asset;img.alt='승인된 프로필 아바타';av.append(img);
  }else av.textContent='RS';
  const data=node('div','rss-profile-copy');
  data.append(node('b','',d?.avatar?.shared?'프로필 캐릭터 연결됨':'프로필 캐릭터 연결 대기'),
   node('small','',d?.avatar?.shared?'공유 동의한 Visual ID만 사용합니다.':'사진·캐릭터를 임의 생성하지 않습니다.'));
  const open=node('button','rss-secondary','프로필 확인');open.type='button';open.onclick=()=>{close();navProfile();};
  wrap.append(av,data,open);
  const toggle=rootEl.querySelector('[data-share-profile-toggle]');
  toggle.disabled=!d?.avatar?.shared;toggle.checked=includeProfile&&d?.avatar?.shared;
 }
 function setCrew(d){
  const holder=rootEl.querySelector('[data-share-crew]');holder.replaceChildren();
  const crew=Array.isArray(d?.crew)?d.crew.slice(0,3):[];
  if(crewSelection===null)crewSelection=new Set(crew.map(m=>m.id));
  if(!crew.length){holder.append(node('p','rss-help','선택된 동행탐험대원이 아직 없어요. 기존 탐험대 프로필에서 선택한 멤버만 표시합니다.'));return;}
  for(const m of crew){
   const label=node('label','rss-crew-item');const img=node('img');
   img.alt='';img.src=m.asset;const name=node('span','',m.name||m.id);
   const check=node('input');check.type='checkbox';check.value=m.id;check.checked=crewSelection.has(m.id);
   check.addEventListener('change',()=>{check.checked?crewSelection.add(m.id):crewSelection.delete(m.id);refreshImage();});
   label.append(img,name,check);holder.append(label);
  }
 }
 function setText(d,reset=false){
  const field=rootEl.querySelector('[data-share-message]');if(reset||!field.dataset.userEdited){
   messageText=d?.copy?.reaction||'';field.value=messageText;
  }
 }
 function renderMeta(d){
  const lbl=rootEl.querySelector('[data-share-meta]');
  if(!d?.ok){lbl.textContent='실제 과제 또는 완료 기록이 확인되지 않아 공유카드를 생성할 수 없습니다.';return;}
  lbl.textContent=selected.kind==='pre'?
   '실제 할 일 '+d.total+'개 · 목표 '+Math.round(d.targetMs/60000)+'분':
   '완료 '+d.doneCount+'/'+d.total+' · 집중 '+Math.floor(d.focusMs/60000)+'분 · '+(d.stars===null?'보상 증거 확인 대기':'확인된 별 '+d.stars);
 }
 async function refreshImage(){
  if(!rootEl)return;
  const seq=++requestId,d=current(),img=rootEl.querySelector('[data-share-card-image]');
  const holder=rootEl.querySelector('[data-share-card-holder]');
  const submit=rootEl.querySelector('[data-share-submit]');
  submit.disabled=true;img.hidden=true;holder.dataset.ready='false';
  renderMeta(d);
  if(!d.ok){status('과제 또는 결과 증거가 없어 공유를 보류합니다.');return;}
  status('실제 기록과 에셋을 확인하고 있습니다.');
  try{
   const output=await card.render(selected.kind,getOptions());
   if(seq!==requestId||!rootEl)return;
   if(!output?.toDataURL){status('공유 원화 또는 증거 미연결: '+(output?.reason||'RENDER_BLOCKED'));return;}
   img.src=output.toDataURL('image/png');img.hidden=false;
   holder.dataset.ready='true';submit.disabled=false;status('실제 데이터로 만든 공유카드입니다.',true);
  }catch(e){if(seq===requestId)status('공유카드를 만들 수 없습니다: '+(e.message||'RENDER_FAILED'));}
 }
 function choose(index){
  const m=MODES[index];if(!m)return;
  selected={theme:m.theme,kind:m.kind};const d=current();
  modeButtons().forEach((b,i)=>{const on=i===index;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
  rootEl.querySelector('[data-share-title]').textContent=m.kind==='pre'?'탐험 시작 공유':'탐험 완료 공유';
  rootEl.querySelectorAll('[data-share-field]').forEach(cb=>{const key=cb.dataset.shareField;cb.closest('label').hidden=m.kind==='pre'?['focus','done','stars'].includes(key):key==='target';});
  setText(d,true);rootEl.querySelector('[data-share-message]').dataset.userEdited='';
  setProfile(d);setCrew(d);refreshImage();
 }
 function close(){
  requestId++;rootEl?.remove();rootEl=null;crewSelection=null;prior?.focus?.({preventScroll:true});prior=null;
 }
 function open(kind='pre'){
  if(rootEl){close();return {ok:false,reason:'ALREADY_OPEN_RESET'};}
  prior=doc.activeElement;const theme=options.getProfileTheme?.()||'drop';
  selected={theme:theme==='sail'?'sail':'drop',kind:kind==='result'?'result':'pre'};
  const d=current();fields={mission:true,target:true,focus:true,done:true,stars:true,reaction:true};
  messageText='';crewSelection=null;
  rootEl=node('section','rss-overlay');rootEl.id='readyShareSettings';rootEl.setAttribute('role','dialog');
  rootEl.setAttribute('aria-modal','true');rootEl.setAttribute('aria-label','공유 카드 설정');
  rootEl.innerHTML=String.raw`
    <div class="rss-frame">
      <header class="rss-head"><button type="button" class="rss-back" data-share-close aria-label="공유 설정 닫기">‹</button><h2 data-share-title>공유 카드 설정</h2><span class="rss-head-spacer"></span></header>
      <main class="rss-main">
        <div class="rss-modes" data-share-modes role="group" aria-label="네 가지 탐험 공유 형태"></div>
        <div class="rss-workspace">
          <section class="rss-preview">
            <h3>공유 카드 미리보기</h3><div class="rss-card" data-share-card-holder>
              <img data-share-card-image alt="실제 탐험 데이터를 합성한 공유카드" hidden>
              <p class="rss-placeholder">승인된 환경 원화와 실제 과제 기록을 연결하면 미리보기가 표시됩니다.</p>
            </div><p class="rss-meta" data-share-meta></p>
          </section>
          <section class="rss-editor">
            <h3>프로필 캐릭터 <small>프로필 기준 자동 적용</small></h3><div class="rss-profile" data-share-profile></div>
            <label class="rss-switch-row"><span>공유 동의한 프로필 포함</span><input type="checkbox" data-share-profile-toggle></label>
            <h3>선택한 동행탐험대원 <small>최대 3명</small></h3><div class="rss-crew" data-share-crew></div>
            <h3>공유 카드에 포함할 정보</h3><div class="rss-fields" data-share-fields></div>
            <h3>응원 문구 <small>80자 이내</small></h3><textarea data-share-message rows="3" maxlength="80" aria-label="공유 문구 편집"></textarea>
            <p class="rss-help">원문 과제·실제 집중시간·검증된 별만 반영합니다. 프로필 테마는 기본 선택값이며, 다른 카드 선택은 이번 공유에만 적용돼요.</p>
          </section>
        </div>
      </main>
      <footer class="rss-footer"><p data-share-status role="status" aria-live="polite"></p><button data-share-submit type="button" disabled>공유 미리보기 · 모바일 공유 메뉴</button></footer>
    </div>`;
  doc.body.append(rootEl);
  const modes=rootEl.querySelector('[data-share-modes]');
  MODES.forEach((m,i)=>modes.append(makeModeBox(m,i)));
  const fieldList=rootEl.querySelector('[data-share-fields]');Object.keys(LABELS).forEach(key=>fieldList.append(makeField(key)));
  rootEl.addEventListener('click',e=>{
   if(e.target.closest('[data-share-close]'))close();
   const target=e.target.closest('[data-share-mode]');
   if(target)choose(Number(target.dataset.shareMode));
  });
  rootEl.addEventListener('change',e=>{
   const key=e.target.dataset.shareField;
   if(permitted.has(key)){fields[key]=e.target.checked;refreshImage();}
   if(e.target.matches('[data-share-profile-toggle]')){includeProfile=e.target.checked;refreshImage();}
  });
  rootEl.querySelector('[data-share-message]').addEventListener('input',e=>{
   messageText=e.target.value.slice(0,80);e.target.dataset.userEdited='true';refreshImage();
  });
  rootEl.querySelector('[data-share-submit]').onclick=async()=>{
   const result=await card.showPreview(selected.kind,getOptions());
   if(!result.ok)status('공유 준비 중단: '+(result.reason||'확인 필요'));
  };
  rootEl.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
  const idx=MODES.findIndex(m=>m.theme===selected.theme&&m.kind===selected.kind);
  choose(idx<0?0:idx);rootEl.querySelector('[data-share-close]').focus({preventScroll:true});
  return {ok:true};
 }
 return Object.freeze({open,close,currentOptions:getOptions,version:'READY_SHARE_SETTINGS_UI_V01'});
}
root.ReadyShareSettings=Object.freeze({create:make});
})(typeof globalThis!=='undefined'?globalThis:this);
`;