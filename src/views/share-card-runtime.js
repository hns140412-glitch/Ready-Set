(function(root){'use strict';
/* Single active Ready share card renderer. User-accepted interim four-card composition.
   Visual source and dynamic data are separate. No Kakao API, source photo, invented awards. */
const W=720,H=1280,CREW=new Set(['dubi','lori','ink','nova','take','zero']);
const font=(size,hand)=>'900 '+size+'px '+(hand?'"Nanum Brush Script","Apple SD Gothic Neo",system-ui':'"Apple SD Gothic Neo",system-ui');
const time=ms=>Number.isFinite(ms)&&ms>=0?String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0'):'확인 중';
function create(options={}){
 const project=options.projectShare,notify=options.toast||(()=>{}),load=options.loadImage||((src)=>new Promise((ok,fail)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=()=>fail(Error('SHARE_LAYER_LOAD_FAILED:'+src));i.src=src;}));
 const scenePath=options.sceneAsset||(()=>null),rootPath=options.assetRoot||'./assets/share-card/';
 const src=n=>rootPath.replace(/\/?$/,'/')+n;
 let prepared=null,url=null,previous=null;
 function validate(d){
  if(!d?.ok)return {ok:false,reason:d?.reason||'SHARE_DATA_MISSING'};
  if(!['drop','sail'].includes(d.theme)||!['pre','result'].includes(d.kind))return {ok:false,reason:'SHARE_MODE_INVALID'};
  if(!Array.isArray(d.tasks)||!d.tasks.length||!Number.isFinite(d.targetMs)||d.targetMs<0)return {ok:false,reason:'SHARE_TASK_EVIDENCE_MISSING'};
  if(d.kind==='result'&&(!Number.isInteger(d.doneCount)||!Number.isInteger(d.total)||d.total<1||d.doneCount<0||d.doneCount>d.total||!Number.isFinite(d.focusMs)))return {ok:false,reason:'SHARE_RESULT_UNVERIFIED'};
  return {ok:true};
 }
 function fit(ctx,value,x,y,max,size,rows=3){ctx.font=font(size,false);ctx.textAlign='left';const out=[];let str='';
  for(const c of String(value||'')){if(str&&ctx.measureText(str+c).width>max){out.push(str);str=c;}else str+=c;}
  if(str)out.push(str);if(out.length>rows){out.length=rows;let last=out[rows-1];while(last.length>1&&ctx.measureText(last+'…').width>max)last=last.slice(0,-1);out[rows-1]=last+'…';}
  out.forEach((l,i)=>ctx.fillText(l,x,y+i*(size+7)));return out.length;
 }
 function contain(ctx,img,x,y,w,h){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,k=Math.min(w/iw,h/ih);ctx.drawImage(img,x+(w-iw*k)/2,y+(h-ih*k)/2,iw*k,ih*k);}
 function text(ctx,v,x,y,size=28,bold=true){ctx.font=(bold?900:650)+' '+size+'px "Apple SD Gothic Neo",system-ui';ctx.fillStyle='#2a241e';ctx.textAlign='left';ctx.fillText(String(v??''),x,y);}
 async function draw(d){
  const gate=validate(d);if(!gate.ok)return gate;
  const art=scenePath(d.theme,d.kind);if(!art)throw Error('SHARE_GOLDEN_SCENE_NOT_APPROVED');
  const [scene,paper,logo,fx,canopy]=await Promise.all([
   load(art),load(src('ui/parchment.svg')),load(src('ui/wood-logo.svg')),load(src('fx/sun-glints.svg')),
   d.theme==='drop'&&d.kind==='pre'?load(src('fx/drop-canopy.svg')):Promise.resolve(null)
  ]);
  if((scene.naturalWidth||scene.width)<720||(scene.naturalHeight||scene.height)<1000)throw Error('SHARE_SCENE_SIZE_UNDER_GATE');
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');if(!c)return {ok:false,reason:'SHARE_CANVAS_UNAVAILABLE'};
  // L1 environmental art; same shared island, per-state approach, no baked child/data.
  c.drawImage(scene,0,0,720,1030);c.drawImage(fx,0,0,720,1030);
  if(canopy)c.drawImage(canopy,-50,-80,510,315);
  const grad=c.createLinearGradient(0,0,0,460);grad.addColorStop(0,d.theme==='sail'&&d.kind==='result'?'rgba(255,242,216,.55)':'rgba(225,242,255,.67)');grad.addColorStop(.65,'rgba(255,255,255,.17)');grad.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=grad;c.fillRect(0,0,720,460);
  // L2 brand (separate master), L3 approved child Visual ID, L4 selected existing crew.
  c.drawImage(logo,530,23,163,97);
  if(d.avatar?.shared===true){
   if(!d.avatar.sceneAsset)throw Error('SHARE_APPROVED_PROFILE_ART_MISSING');
   let im;try{im=await load(d.avatar.sceneAsset);}catch{throw Error('SHARE_APPROVED_PROFILE_ART_LOAD_FAILED');}
   c.save();c.shadowColor='rgba(15,49,64,.4)';c.shadowBlur=22;c.shadowOffsetY=12;contain(c,im,220,588,315,404);c.restore();
  }
  const members=(Array.isArray(d.crew)?d.crew:[]).filter(x=>CREW.has(x.id)).slice(0,3);
  let n=0;for(const m of members){
   const path=m.asset||'./assets/character-formation/crew/'+m.id+'-locked-visual-id.webp';
   let im;try{im=await load(path);}catch{throw Error('SHARE_LOCKED_COMPANION_ART_LOAD_FAILED:'+m.id);}
   const x=members.length===1?490:members.length===2?(n?490:48):[42,478,578][n],w=members.length>=3?110:140;
   c.save();c.shadowColor='#16324655';c.shadowBlur=13;c.shadowOffsetY=8;contain(c,im,x,794,w,170);c.restore();n++;
  }
  // L5 headings and mission copy; real data, not text extracted from concept board.
  const top=d.theme==='drop'&&d.kind==='pre'?300:d.theme==='sail'&&d.kind==='pre'?330:210;
  const headline=String(d.copy?.title||'탐험 기록');
  c.textBaseline='alphabetic';c.textAlign='left';c.lineJoin='round';c.font=font(53,true);
  const lines=[];let line='';for(const ch of headline){if(line&&c.measureText(line+ch).width>550){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
  c.lineWidth=8;c.strokeStyle='rgba(255,251,235,.95)';c.fillStyle='#132b4b';
  lines.slice(0,3).forEach((v,i)=>{c.strokeText(v,46,top+i*68);c.fillText(v,46,top+i*68);});
  const mission=String(d.tasks[0]?.label||'');c.font=font(27,false);c.lineWidth=5;c.strokeStyle='#fff8e8';c.fillStyle='#203a55';
  c.strokeText(mission.slice(0,26),54,top+Math.min(lines.length,3)*70+1);c.fillText(mission.slice(0,26),54,top+Math.min(lines.length,3)*70+1);
  // L6 small companion reaction line stays factual.
  const reaction=String(d.copy?.reaction||'');if(reaction){
   c.fillStyle='rgba(255,250,225,.92)';c.beginPath();if(c.roundRect)c.roundRect(26,943,Math.min(600,Math.max(250,reaction.length*12+40)),47,23);else c.rect(26,943,574,47);c.fill();
   c.fillStyle='#1a3851';c.font='700 19px system-ui';c.fillText(reaction.slice(0,40),43,974);
  }
  // L7 original-style parchment; factual fields are composed afterward.
  c.drawImage(paper,0,1010,720,250);text(c,d.kind==='pre'?'오늘의 탐험':'오늘의 탐험 기록',81,1080,24);
  if(d.kind==='pre'){
   c.fillStyle='#2a241e';fit(c,d.tasks.slice(0,2).map(t=>t.label).join(' · '),81,1122,560,34,1);
   c.strokeStyle='#ac8754';c.lineWidth=2;c.beginPath();c.moveTo(76,1144);c.lineTo(642,1144);c.stroke();
   text(c,'오늘의 할 일',81,1189,22,false);text(c,String(d.total)+'개',226,1191,32);
   text(c,'목표 시간',390,1189,22,false);text(c,time(d.targetMs),521,1191,32);
  }else{
   const cells=[['집중 시간',time(d.focusMs)],['완료 과제',String(d.doneCount)+'/'+String(d.total)],['획득 별',d.stars===null?'기록 대기':'+'+d.stars]];
   c.strokeStyle='#bc9459';c.lineWidth=2;[255,463].forEach(x=>{c.beginPath();c.moveTo(x,1061);c.lineTo(x,1189);c.stroke();});
   cells.forEach((v,i)=>{const x=[56,280,489][i];text(c,v[0],x,1087,22,false);text(c,v[1],x,1151,36);});
   text(c,'오늘의 탐험 · '+String(d.date||'날짜 확인 중'),80,1213,18,false);
  }
  return {ok:true,canvas:cv,data:d};
 }
 function caption(d){
  const line=d.kind==='pre'?'오늘의 할 일 '+d.total+'개 · 목표 '+time(d.targetMs):
   '완료 '+d.doneCount+'/'+d.total+' · 집중 '+time(d.focusMs)+(d.stars===null?'':' · 획득 별 +'+d.stars);
  const companion=(d.crew||[]).filter(x=>x.primary&&x.name).map(x=>'함께한 동행탐험대원 · '+x.name).join('');
  return ['Ready & Set · '+String(d.copy.title||''),line,String(d.copy?.reaction||''),companion].filter(Boolean).join('\n');
 }
 async function prepare(kind='result'){
  try{const data=project?.(kind),out=await draw(data);if(!out.ok)return out;
   const blob=await new Promise(ok=>out.canvas.toBlob(ok,'image/png'));if(!blob?.size)return {ok:false,reason:'SHARE_PNG_EXPORT_FAILED'};
   return {ok:true,canvas:out.canvas,blob,data,caption:caption(data),file:new File([blob],'Ready_Set_'+data.theme+'_'+data.kind+'.png',{type:'image/png'})};
  }catch(e){return {ok:false,reason:e?.message||'SHARE_RENDER_FAILED'};}
 }
 function release(){if(url){URL.revokeObjectURL(url);url=null;}document.querySelector('#readySharePreview')?.remove();prepared=null;previous?.focus?.({preventScroll:true});previous=null;}
 function nativeShare({imageOnly=false}={}){
  if(!prepared)return {ok:false,reason:'SHARE_PREVIEW_REQUIRED'};
  if(!navigator.share||navigator.canShare?.({files:[prepared.file]})===false){notify('파일 공유가 지원되지 않아요. 이미지 저장과 문구 복사를 이용해 주세요.');return {ok:false,reason:'NATIVE_FILE_SHARE_UNAVAILABLE'};}
  let p;try{p=navigator.share({title:'Ready & Set',files:[prepared.file],...(imageOnly?{}:{text:prepared.caption})});}
  catch(e){return {ok:false,reason:e.name||'SHARE_FAILED'};}
  return Promise.resolve(p).then(()=>({ok:true,method:'NATIVE_SHARE_REQUESTED'}),e=>({ok:false,reason:e?.name||'SHARE_FAILED'}));
 }
 async function copyCaption(){if(!prepared)return {ok:false,reason:'PREVIEW_REQUIRED'};try{await navigator.clipboard.writeText(prepared.caption);notify('공유 문구를 복사했어요.');return {ok:true};}catch{return {ok:false,reason:'COPY_NOT_AVAILABLE'};}}
 function saveImage(){if(!prepared)return {ok:false,reason:'PREVIEW_REQUIRED'};const u=URL.createObjectURL(prepared.file),a=document.createElement('a');a.href=u;a.download=prepared.file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);return {ok:true};}
 async function showPreview(kind='result'){
  if(prepared)return {ok:false,reason:'PREVIEW_ALREADY_OPEN'};
  const r=await prepare(kind);if(!r.ok){notify('승인된 공유카드 원화 또는 실제 과제·결과 기록을 확인해 주세요.');return r;}
  prepared=r;previous=document.activeElement;url=URL.createObjectURL(r.blob);
  const modal=document.createElement('section');modal.id='readySharePreview';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','동행탐험 공유카드 이미지와 문구 미리보기');
  modal.style.cssText='position:fixed;inset:0;z-index:9999;display:grid;place-items:center;overflow:auto;padding:12px;background:#14263ccf;';
  const panel=document.createElement('div');panel.style.cssText='box-sizing:border-box;width:min(100%,440px);max-height:96dvh;overflow:auto;background:#fff9ed;border-radius:20px;padding:14px;color:#1b324b;box-shadow:0 18px 55px #0007';
  const heading=document.createElement('h2');heading.textContent=kind==='pre'?'탐험 시작 공유':'탐험 완료 공유';heading.style.cssText='font:800 20px system-ui;margin:3px 0 10px';
  const img=document.createElement('img');img.src=url;img.alt='실제 탐험 정보와 승인된 캐릭터로 구성된 공유카드';img.style.cssText='display:block;width:min(100%,320px);margin:auto;border-radius:17px;box-shadow:0 7px 17px #2137';
  const cap=document.createElement('textarea');cap.value=r.caption;cap.maxLength=500;cap.setAttribute('aria-label','함께 보낼 공유 문구');cap.style.cssText='box-sizing:border-box;display:block;width:100%;min-height:104px;margin:12px 0;white-space:pre-wrap;font:500 13px/1.5 system-ui;background:#fff;border:1px solid #d6c9a4;border-radius:10px;padding:10px;color:#20354a;resize:vertical';
  cap.addEventListener('input',()=>{if(prepared)prepared.caption=cap.value;});
  const hint=document.createElement('p');hint.textContent='아이폰 공유 메뉴에서 카카오톡을 선택하세요. 사진과 글이 동시에 전달되지 않으면 문구 복사와 이미지만 공유를 사용하세요.';hint.style.cssText='font:12px/1.5 system-ui;color:#52616b';
  const actions=document.createElement('div');actions.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px';
  function btn(name,fn,primary=false){const b=document.createElement('button');b.type='button';b.textContent=name;b.style.cssText='border:0;border-radius:12px;min-height:48px;padding:8px;background:'+(primary?'#ffe15e':'#e6f0f5')+';font:800 12px system-ui;color:#183950';b.onclick=fn;actions.appendChild(b);return b;}
  const first=btn('모바일 공유 메뉴 열기',()=>nativeShare(),true);
  btn('문구 복사',()=>copyCaption());btn('이미지만 공유',()=>nativeShare({imageOnly:true}));btn('이미지 저장',saveImage);const close=btn('닫기',release);close.style.gridColumn='1 / -1';
  panel.append(heading,img,cap,hint,actions);modal.append(panel);document.body.append(modal);modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();release();}});first.focus({preventScroll:true});
  return {ok:true,method:'PREVIEW_READY',kind};
 }
 return Object.freeze({version:'READY_SHARE_LAYERED_ACTIVE_20260928',project,prepare,render:async kind=>{const r=await prepare(kind);return r.ok?r.canvas:r;},share:showPreview,showPreview,nativeShare,copyCaption,saveImage,release,draw});
}
root.ReadyRebuildShareCard=Object.freeze({version:'READY_SHARE_LAYERED_ACTIVE_20260928',create});
})(typeof globalThis!=='undefined'?globalThis:this);
