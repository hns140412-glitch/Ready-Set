(function(root){
'use strict';
// Golden content source: Ready_Set_Share_Golden_Contract_REV_01.md.
// Draw one compact 900x600 information card, not a static screenshot/poster.
// Native OS share only; NEVER Kakao SDK/API, no invented award or child art.
function create(options={}){
  const projection=options.projectShare;
  const toast=options.toast||(()=>{});
  const guideArt=options.guideArt||{};
  const imageLoader=options.loadImage||function(url){
    return new Promise((resolve,reject)=>{
      const image=new Image(); image.crossOrigin='anonymous';
      image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('SHARE_ASSET_UNAVAILABLE'));image.src=url;
    });
  };
  let previewUrl=null,previewData=null,previewFile=null,previousFocus=null;
  const color={drop:{top:'#bce4ff',middle:'#eaf9ff',water:'#29a5df',land:'#5bc078',dark:'#133861',accent:'#ffcf4c'},
    sail:{top:'#8edafa',middle:'#d7f6ff',water:'#178dd8',land:'#58b477',dark:'#103c64',accent:'#ffcc52'}};

  function rr(ctx,x,y,w,h,r,fill){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}
  }
  function ellipse(ctx,x,y,rx,ry,fill){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
  }
  function line(ctx,points,fill){
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    points.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  }
  function label(ctx,value,x,y,{size=25,weight=700,color='#123b65',max=740,align='left'}={}){
    ctx.fillStyle=color;ctx.font=weight+' '+size+'px system-ui, sans-serif';ctx.textBaseline='alphabetic';ctx.textAlign=align;
    let txt=String(value??'');
    while(txt.length>1&&ctx.measureText(txt).width>max)txt=txt.slice(0,-2)+'…';
    ctx.fillText(txt,x,y);return txt;
  }
  function scene(ctx,m,theme,kind){
    const c=color[theme],g=ctx.createLinearGradient(0,0,0,395);
    g.addColorStop(0,c.top);g.addColorStop(1,c.middle);ctx.fillStyle=g;ctx.fillRect(0,0,900,395);
    // Clouds and the one shared island; movement differs, geographical world does not.
    for(const [x,y,k] of [[90,60,1],[420,48,.65],[805,97,.8]]){
      ellipse(ctx,x,y,75*k,21*k,'rgba(255,255,255,.76)');
      ellipse(ctx,x-24*k,y-12*k,45*k,20*k,'rgba(255,255,255,.76)');
      ellipse(ctx,x+31*k,y-14*k,36*k,24*k,'rgba(255,255,255,.76)');
    }
    ellipse(ctx,704,206,185,45,'rgba(255,255,255,.5)');
    ctx.fillStyle=c.water;ctx.fillRect(0,311,900,84);
    for(let i=0;i<7;i++){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(200+i*96,352+i%2*13);ctx.lineTo(255+i*96,352+i%2*13);ctx.stroke();}
    line(ctx,[[518,316],[672,138],[794,182],[865,318]],'#8a8061');
    line(ctx,[[540,297],[672,138],[794,182],[849,297]],c.land);
    ellipse(ctx,683,221,107,23,'#66d08a');
    line(ctx,[[650,166],[673,133],[694,169]],'#cf9b62');
    line(ctx,[[660,170],[673,133],[688,170]],'#fff1b4');
    line(ctx,[[716,211],[746,191],[754,283],[724,283]],'#f7f9f0');
    line(ctx,[[728,207],[746,191],[751,280],[739,280]],'#bcecff');
    ellipse(ctx,646,233,20,26,'#277d59');ellipse(ctx,799,248,16,24,'#2c865a');
    line(ctx,[[673,138],[673,118],[700,129],[673,137]],'#ef7b4f');
    if(theme==='sail'){
      ellipse(ctx,446,342,66,10,'rgba(11,66,120,.18)');
      line(ctx,[[378,330],[506,330],[480,344],[405,344]],'#85553c');
      ctx.strokeStyle='#755335';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(442,330);ctx.lineTo(442,204);ctx.stroke();
      line(ctx,[[438,207],[438,319],[370,310]],'#fff8e6');
      line(ctx,[[450,220],[497,303],[450,309]],'#f5d188');
    }else{
      // No unrelated/generated child character; thematic parachute motif only.
      ctx.fillStyle='#ffbc45';ctx.beginPath();ctx.arc(440,116,60,Math.PI,Math.PI*2);ctx.closePath();ctx.fill();
      line(ctx,[[382,116],[410,116],[439,181]],'#ef9563');
      line(ctx,[[440,116],[468,116],[439,181]],'#fff3d1');
      ctx.strokeStyle='#98613d';ctx.lineWidth=2;for(const a of [380,410,440,470,500]){ctx.beginPath();ctx.moveTo(a,116);ctx.lineTo(439,182);ctx.stroke();}
      rr(ctx,428,178,22,18,5,'#936940');
    }
    if(kind==='result'){
      for(const [x,y] of [[515,97],[840,57],[853,165]]){
        ctx.fillStyle='#ffcb48';ctx.beginPath();for(let i=0;i<10;i++){
          const a=-Math.PI/2+i*Math.PI/5,r=i%2?7:17;
          const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
          if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }ctx.closePath();ctx.fill();
      }
    }
    const overlay=ctx.createLinearGradient(0,0,630,0);
    overlay.addColorStop(0,'rgba(237,250,255,.93)');overlay.addColorStop(.64,'rgba(241,250,255,.66)');overlay.addColorStop(1,'rgba(241,250,255,0)');
    ctx.fillStyle=overlay;ctx.fillRect(0,0,610,311);
  }
  function drawCircleImage(ctx,img,x,y,size){
    ctx.save();ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.clip();
    const k=Math.max(size/img.width,size/img.height),w=img.width*k,h=img.height*k;
    ctx.drawImage(img,x-w/2,y-h/2,w,h);ctx.restore();
  }
  async function draw(canvas,data){
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('SHARE_CANVAS_UNAVAILABLE');
    const theme=data.theme,kind=data.kind,m=color[theme];
    scene(ctx,m,theme,kind);
    rr(ctx,27,23,190,44,22,'rgba(255,255,255,.91)');
    label(ctx,'Ready & Set',42,53,{size:25,weight:900,color:m.dark,max:170});
    label(ctx,kind==='pre'?'탐험 시작 공유':'탐험 완료 · 기록',36,94,{size:19,color:'#34617e'});
    const words=data.copy.title;
    const pieces=words.includes(' ')&&words.length>13?words.split(' '):[words];
    if(pieces.length>1){
      const a=Math.ceil(pieces.length/2);
      label(ctx,pieces.slice(0,a).join(' '),36,143,{size:38,weight:900,max:515,color:m.dark});
      label(ctx,pieces.slice(a).join(' '),36,187,{size:38,weight:900,max:515,color:m.dark});
    }else label(ctx,words,36,157,{size:39,weight:900,max:525,color:m.dark});
    label(ctx,data.copy.sub,38,224,{size:20,max:525,color:'#42647a'});
    rr(ctx,30,259,Math.min(530,Math.max(250,data.copy.reaction.length*13+32)),40,17,'rgba(255,255,255,.87)');
    label(ctx,data.copy.reaction,43,286,{size:17,max:502,color:m.dark});
    const assets=data.avatar;
    if(assets?.shared&&assets.asset){
      try{const img=await imageLoader(assets.asset);drawCircleImage(ctx,img,844,44,58);}
      catch{ // If asset URL/CORS is not readable, never substitute raw profile/source photo.
        rr(ctx,817,17,54,54,18,'#e4f3fb');label(ctx,'RS',844,52,{size:19,weight:900,max:40,align:'center',color:m.dark});
      }
    }else{
      rr(ctx,817,17,54,54,18,'#e4f3fb');label(ctx,'RS',844,52,{size:19,weight:900,max:40,align:'center',color:m.dark});
    }
    ctx.fillStyle='#fff';ctx.fillRect(0,395,900,205);
    ctx.strokeStyle='#e3ebed';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,396);ctx.lineTo(900,396);ctx.stroke();
    const left=kind==='pre'?String(data.total)+'개':String(data.doneCount)+'/'+String(data.total);
    const middle=kind==='pre'?'목표 '+options.formatTime(data.targetMs):options.formatTime(data.focusMs);
    const right=kind==='pre'?'출발 준비':data.stars===null?'기록 대기':'+'+data.stars;
    const captions=kind==='pre'?['오늘의 할 일','목표 시간','탐험 상태']:['완료한 과제','집중 시간','획득 별'];
    [left,middle,right].forEach((v,i)=>{
      const x=150+i*300;
      label(ctx,v,x,458,{size:i===1?30:34,weight:900,align:'center',max:270,color:m.dark});
      label(ctx,captions[i],x,491,{size:18,weight:700,align:'center',color:'#5e7382'});
      if(i<2){ctx.strokeStyle='#e7edef';ctx.beginPath();ctx.moveTo((i+1)*300,417);ctx.lineTo((i+1)*300,507);ctx.stroke();}
    });
    const short=data.tasks.slice(0,3).map(t=>t.label).join(' · ');
    rr(ctx,27,517,846,59,17,'#eff6fa');
    label(ctx,short,44,543,{size:20,weight:750,max:808,color:m.dark});
    label(ctx,data.date||'탐험 날짜 확인 중',44,565,{size:14,color:'#697f8c'});
    label(ctx,'오늘의 섬 · 함께하는 탐험',870,566,{size:14,align:'right',max:360,color:'#617d89'});
    return canvas;
  }
  function caption(data){
    const line=data.kind==='pre'?
      '오늘의 할 일 '+data.total+'개 · 목표 '+options.formatTime(data.targetMs):
      '완료 '+data.doneCount+'/'+data.total+' · 집중 '+options.formatTime(data.focusMs);
    const star=data.kind==='result'&&data.stars!==null?' · 획득 별 +'+data.stars:'';
    return 'Ready & Set · '+data.copy.title+'\n'+line+star+'\n'+data.copy.reaction;
  }
  async function prepare(kind='result'){
    const data=projection?.(kind);
    if(!data?.ok)return {ok:false,reason:data?.reason||'SHARE_PROJECTION_UNAVAILABLE'};
    const canvas=document.createElement('canvas');canvas.width=900;canvas.height=600;
    await draw(canvas,data);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob?.size)return {ok:false,reason:'SHARE_IMAGE_ENCODING_FAILED'};
    return {ok:true,canvas,blob,caption:caption(data),data,
      file:new File([blob],'Ready_Set_'+data.theme+'_'+kind+'.png',{type:'image/png'})};
  }
  function release(){
    if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
    const overlay=document.getElementById('readySharePreview');
    if(overlay)overlay.remove();
    previewData=null;previewFile=null;
    previousFocus?.focus?.({preventScroll:true});previousFocus=null;
  }
  function saveImage(){
    if(!previewFile)return {ok:false,reason:'SHARE_PREVIEW_NOT_READY'};
    const url=URL.createObjectURL(previewFile),a=document.createElement('a');
    a.href=url;a.download=previewFile.name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    return {ok:true,method:'DOWNLOAD_IMAGE'};
  }
  async function copyCaption(){
    if(!previewData)return {ok:false,reason:'SHARE_PREVIEW_NOT_READY'};
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(previewData.caption);}
      else{
        const t=document.createElement('textarea');t.value=previewData.caption;t.style.position='fixed';t.style.opacity='0';
        document.body.appendChild(t);t.select();if(!document.execCommand('copy'))throw Error('CLIPBOARD_UNAVAILABLE');t.remove();
      }
      toast('공유 문구를 복사했어요.');return {ok:true};
    }catch{return {ok:false,reason:'CLIPBOARD_UNAVAILABLE'};}
  }
  function nativeShare({imageOnly=false}={}){
    // Must synchronously invoke navigator.share from this actual second button tap:
    // pre-rendering in the first tap avoids losing iOS transient activation.
    if(!previewFile||!previewData)return {ok:false,reason:'SHARE_PREVIEW_NOT_READY'};
    if(!navigator.share||navigator.canShare?.({files:[previewFile]})===false){
      toast('파일 공유를 지원하지 않아요. 이미지 저장과 문구 복사를 이용해 주세요.');
      return {ok:false,reason:'NATIVE_FILE_SHARE_UNAVAILABLE'};
    }
    const payload={title:'Ready & Set',files:[previewFile]};
    if(!imageOnly)payload.text=previewData.caption;
    let request;
    try{request=navigator.share(payload);}catch(error){
      toast('공유 메뉴를 열지 못했어요. 이미지 저장과 문구 복사를 이용해 주세요.');
      return {ok:false,reason:error?.name||'SHARE_FAILED'};
    }
    return Promise.resolve(request).then(()=>({ok:true,method:'NATIVE_SHARE_REQUESTED'}),error=>{
      if(error?.name!=='AbortError')toast('공유를 완료하지 못했어요. 문구 복사와 이미지 공유를 이용해 주세요.');
      return {ok:false,reason:error?.name||'SHARE_FAILED'};
    });
  }
  async function showPreview(kind='result'){
    if(previewData)return {ok:false,reason:'SHARE_PREVIEW_ALREADY_OPEN'};
    let prepared;
    try{prepared=await prepare(kind);}catch(e){prepared={ok:false,reason:e?.message||'SHARE_PREPARE_FAILED'};}
    if(!prepared.ok){toast('실제 과제·결과 자료를 확인한 뒤 공유할 수 있어요.');return prepared;}
    previousFocus=document.activeElement;
    previewData=prepared;previewFile=prepared.file;
    previewUrl=URL.createObjectURL(prepared.blob);
    const overlay=document.createElement('section');overlay.id='readySharePreview';overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','탐험 공유 이미지 및 문구 미리보기');
    overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(16,31,41,.75);display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto;';
    const panel=document.createElement('div');
    panel.style.cssText='width:min(100%,540px);max-height:94dvh;overflow:auto;background:#fff;border-radius:22px;padding:16px;box-shadow:0 18px 65px #1116;';
    const h=document.createElement('h2');h.textContent=kind==='pre'?'탐험 시작 공유':'탐험 기록 공유';h.style.cssText='font:800 20px system-ui;margin:4px 0 12px;color:#102f4c;';
    const img=document.createElement('img');img.src=previewUrl;img.alt='실제 기록으로 생성한 탐험 공유 이미지';img.style.cssText='width:100%;height:auto;border-radius:16px;border:1px solid #dce8ec;display:block;';
    const captionEl=document.createElement('pre');captionEl.textContent=prepared.caption;captionEl.style.cssText='white-space:pre-wrap;font:500 14px/1.5 system-ui;padding:10px;background:#f4f7fa;border-radius:12px;color:#20394f;';
    const caution=document.createElement('p');caution.textContent='아이폰·공유 대상 앱에 따라 이미지와 문구가 함께 전달되지 않을 수 있어요. 이 경우 문구를 복사한 뒤 이미지만 공유해 주세요.';
    caution.style.cssText='font:12px/1.5 system-ui;color:#50616e;';
    const actions=document.createElement('div');actions.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;';
    function button(text,action,primary=false){
      const b=document.createElement('button');b.type='button';b.textContent=text;
      b.style.cssText='border:0;border-radius:12px;min-height:48px;padding:8px 9px;background:'+(primary?'#ffe15e':'#ecf3f8')+';color:#173955;font:800 13px system-ui;';
      b.addEventListener('click',action);actions.appendChild(b);return b;
    }
    const shareButton=button('모바일 공유 메뉴 열기',()=>{nativeShare();},true);
    button('문구 복사',()=>{copyCaption();});
    button('이미지만 공유',()=>{nativeShare({imageOnly:true});});
    button('이미지 저장',()=>{saveImage();});
    const close=button('닫기',release);close.style.gridColumn='1 / -1';
    panel.append(h,img,captionEl,caution,actions);overlay.appendChild(panel);document.body.appendChild(overlay);
    overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();release();}});
    shareButton.focus({preventScroll:true});
    return {ok:true,method:'PREVIEW_READY',kind};
  }
  return Object.freeze({version:'READY_NATIVE_SHARE_CARD_V02',project:projection,prepare,render:async kind=>{
    const result=await prepare(kind);return result.ok?result.canvas:result;
  },share:showPreview,showPreview,nativeShare,saveImage,copyCaption,release});
}
root.ReadyRebuildShareCard=Object.freeze({version:'READY_NATIVE_SHARE_CARD_V02',create});
})(typeof globalThis!=='undefined'?globalThis:this);
