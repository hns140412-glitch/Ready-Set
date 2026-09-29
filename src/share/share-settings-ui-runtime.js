(function(root){'use strict';
/* Share-card UI only. Profile/Expedition and Result remain the sole owners.
   No new character, mission, award, or Kakao account record. */
const VARIANTS=[['drop','pre','낙하 · 탐험 시작'],['drop','result','낙하 · 탐험 완료'],['sail','pre','항해 · 탐험 시작'],['sail','result','항해 · 탐험 완료']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function create({project,card,scene,toast=()=>{}}={}){
 let host=null,origin=null,settings=null,available=null;
 const config=()=>({theme:settings.theme,includeAvatar:settings.avatar,
   crewIds:[...settings.crewIds],fields:{...settings.fields},messageStyle:settings.style});
 const get=(kind)=>project(kind,{theme:settings.theme});
 const button=(name,cls,attr='')=>'<button type="button" class="'+cls+'" '+attr+'>'+esc(name)+'</button>';
 function paint(){
  if(!host)return;
  const d=get(settings.kind),member=d?.avatar;
  const options=VARIANTS.map(([theme,kind,label])=>{
   const rec=project(kind,{theme}),enabled=rec?.ok;
   const path=scene(theme,kind),checked=settings.kind===kind&&settings.theme===theme;
   return '<button type="button" class="rs-share-option'+(checked?' selected':'')+'" data-share-variant="'+theme+':'+kind+'"'+(enabled?'':' disabled')+
    ' aria-pressed="'+checked+'"><span class="rs-share-option-art"'+(path?' style="background-image:url(&quot;'+esc(path)+'&quot;)"':'')+'></span><span>'+esc(label)+'</span></button>';
  }).join('');
  const crew=(Array.isArray(d?.crew)?d.crew:[]).map(m=>'<label class="rs-share-crew-item"><input type="checkbox" data-share-crew="'+esc(m.id)+'"'+(settings.crewIds.has(m.id)?' checked':'')+
   '><img alt="" src="'+esc(m.asset)+'"><span>'+esc(m.name||m.id)+'</span></label>').join('')||'<p class="rs-share-note">프로필에서 선택된 동행탐험대원이 아직 없어요.</p>';
  const avatar=member?.shared&&member?.asset?'<img class="rs-share-avatar" src="'+esc(member.asset)+'" alt="">':'<span class="rs-share-avatar rs-share-avatar-empty" aria-label="프로필 Visual ID 연결 전">RS</span>';
  const displayState=member?.shared?'승인된 프로필 캐릭터 자동 연결':'프로필 캐릭터 공유 동의 또는 승인 Visual ID 연결 필요';
  const fields=Object.entries({mission:'오늘의 미션',target:'목표 시간',focus:'집중 시간',done:'완료 과제',stars:'확인된 획득 별',reaction:'응원 메시지'}).map(([key,label])=>
   '<label class="rs-share-field"><span>'+esc(label)+'</span><input data-share-field="'+key+'" type="checkbox"'+(settings.fields[key]?' checked':'')+
   ((settings.kind==='pre'&&['focus','done','stars'].includes(key))?' disabled':'')+'></label>').join('');
  const resultNote=settings.kind==='result'&&!d?.ok?'<p role="status" class="rs-share-error">확인된 과제별 결과가 없으면 완료 카드를 만들지 않아요.</p>':'';
  host.innerHTML='<div class="rs-share-dialog" role="dialog" aria-modal="true" aria-label="공유 카드 설정">'+
   '<header class="rs-share-head"><button type="button" data-share-close aria-label="닫기">←</button><h2>공유 카드 설정</h2><span>Ready & Set</span></header>'+
   '<div class="rs-share-body"><section><h3>오늘의 탐험 공유 카드</h3><div class="rs-share-options">'+options+'</div></section>'+
   '<section class="rs-share-scene"><h3>공유 미리보기</h3><div class="rs-share-stage">'+
   '<div class="rs-share-stage-art"'+(scene(settings.theme,settings.kind)?' style="background-image:url(&quot;'+esc(scene(settings.theme,settings.kind))+'&quot;)"':'')+'></div>'+
   '<strong>'+esc(d?.copy?.title||'확인된 탐험 기록이 필요해요')+'</strong><span>'+esc(d?.tasks?.[0]?.label||'오늘의 과제 확인 중')+'</span>'+
   '<div class="rs-share-stage-info">'+(settings.kind==='pre'?'목표 '+(Number.isFinite(d?.targetMs)?Math.round(d.targetMs/60000)+'분':'확인 중'):
    '완료 '+(d?.doneCount??'?')+'/'+(d?.total??'?')+' · 집중 '+(Number.isFinite(d?.focusMs)?Math.floor(d.focusMs/60000)+'분':'확인 중'))+'</div></div></section>'+
   '<section class="rs-share-identity"><h3>내 캐릭터 <small>프로필 기준</small></h3><div class="rs-share-identity-line">'+avatar+
   '<span>'+esc(displayState)+'</span><label>이미지 포함 <input type="checkbox" data-share-avatar'+(settings.avatar?' checked':'')+(member?.shared?'':' disabled')+'></label></div>'+
   '<h3>선택한 동행탐험대원 <small>최대 3명 · 기존 선택만 사용</small></h3><div class="rs-share-crew">'+crew+'</div></section>'+
   '<section><h3>공유카드에 포함할 정보</h3><div class="rs-share-fields">'+fields+'</div>'+
   '<h3>응원 문구 톤</h3><div class="rs-share-styles">'+[['default','기본'],['warm','다정하게'],['cheer','힘차게']].map(([key,v])=>
     button(v,settings.style===key?'selected':'','data-share-style="'+key+'"')).join('')+'</div></section>'+resultNote+'</div>'+
   '<footer class="rs-share-footer">'+button('공유 미리보기','rs-share-submit','data-share-preview'+(!d?.ok?' disabled':''))+
   '<p>이미지와 문구를 만든 뒤 모바일 공유 메뉴에서 카카오톡을 선택해요. 카카오 API는 사용하지 않아요.</p></footer></div>';
  host.querySelector('[data-share-close]').onclick=close;
  host.querySelectorAll('[data-share-variant]').forEach(b=>b.onclick=()=>{const [theme,kind]=b.dataset.shareVariant.split(':');
    settings.theme=theme;settings.kind=kind;paint();});
  host.querySelectorAll('[data-share-crew]').forEach(b=>b.onchange=()=>{const id=b.dataset.shareCrew;
    if(b.checked){if(settings.crewIds.size>=3){b.checked=false;toast('동행탐험대원은 최대 3명까지 표시할 수 있어요.');return;}settings.crewIds.add(id);}
    else settings.crewIds.delete(id);
  });
  host.querySelectorAll('[data-share-field]').forEach(b=>b.onchange=()=>{settings.fields[b.dataset.shareField]=b.checked;});
  const av=host.querySelector('[data-share-avatar]');av.onchange=()=>settings.avatar=av.checked;
  host.querySelectorAll('[data-share-style]').forEach(b=>b.onclick=()=>{settings.style=b.dataset.shareStyle;paint();});
  host.querySelector('[data-share-preview]').onclick=async()=>{
    const cfg=config(),kind=settings.kind;const r=await card.showPreview(kind,cfg);
    if(r?.ok){detach();}else toast('승인된 원화 또는 실제 탐험 결과를 확인해 주세요.');
  };
 }
 function detach(){host?.remove();host=null;document.removeEventListener('keydown',onKey);}
 function close(){detach();origin?.focus?.({preventScroll:true});origin=null;}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();close();}}
 function open(kind='pre'){
   if(host)return {ok:false,reason:'SHARE_DIALOG_ALREADY_OPEN'};
   const data=project(kind),pre=project('pre'),result=project('result');
   settings={kind:kind==='result'?'result':'pre',theme:data?.theme||pre?.theme||'drop',
     avatar:!!data?.avatar?.shared,
     crewIds:new Set((data?.crew||[]).map(x=>x.id).slice(0,3)),
     fields:{mission:true,target:true,focus:true,done:true,stars:true,reaction:true},style:'default'};
   if(!data?.ok&&!pre?.ok&&!result?.ok){toast('공유할 수 있는 실제 과제·결과 기록이 없어요.');return {ok:false,reason:'NO_SHARE_CONTEXT'};}
   origin=document.activeElement;host=document.createElement('div');host.id='readyShareConfigurator';host.className='rs-share-overlay';document.body.append(host);
   document.addEventListener('keydown',onKey);paint();host.querySelector('[data-share-close]')?.focus({preventScroll:true});return {ok:true};
 }
 return Object.freeze({open,close,version:'READY_SHARE_CONFIG_UI_V01'});
}
root.ReadyShareConfigUI=Object.freeze({create});
})(typeof globalThis!=='undefined'?globalThis:this);
