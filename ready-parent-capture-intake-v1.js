(() => {
  'use strict';
  if (window.ReadyParentCaptureIntakeV1) return;

  const VERSION = '2026.09.13-parent-capture-intake-v1.1';
  const ROLE = (window.ReadyRoleContextV1?.isParent?.() || new URLSearchParams(location.search).get('role') === 'parent') ? 'PARENT' : 'CHILD';
  const DB_NAME = 'readyset_capture_v1';
  const STORE = 'captures';
  const TALENT_SUBJECTS = ['연산','한자','국어','사회','수학','생각하는 피자'];
  const KINDS = [
    ['COVER','표지'],
    ['RANGE','숙제 범위'],
    ['INSTRUCTION','문제·지시사항'],
    ['ANSWER_REFERENCE','답안·해설지']
  ];
  const sessionId = `talent_capture_${new Date().toLocaleDateString('sv-SE')}`;
  const state = {subject:TALENT_SUBJECTS[0],kind:'COVER',stream:null,urls:[]};
  const toast = msg => window.toast ? window.toast(msg) : alert(msg);

  function openDB(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)){
          const s=db.createObjectStore(STORE,{keyPath:'id'});
          s.createIndex('sessionId','sessionId',{unique:false});
          s.createIndex('subject','subject',{unique:false});
          s.createIndex('analysisState','analysisState',{unique:false});
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function putCapture(record){
    const db=await openDB();
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
  }
  async function allCaptures(){
    const db=await openDB();
    const rows=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});
    db.close();return rows.filter(x=>x.sessionId===sessionId);
  }
  async function updateAnalysisState(next='PENDING_ANALYSIS'){
    const db=await openDB();
    const rows=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');const s=tx.objectStore(STORE);rows.filter(x=>x.sessionId===sessionId).forEach(x=>s.put({...x,analysisState:next,queuedAt:new Date().toISOString()}));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
  }

  function installStyles(){
    if(document.getElementById('rsCaptureStyle')) return;
    const s=document.createElement('style');s.id='rsCaptureStyle';s.textContent=`
      .rsc-wrap{margin:12px 0;padding:13px;border:1px solid #d9d0c1;border-radius:18px;background:#fffdf6}.rsc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.rsc-head b{font-size:15px}.rsc-head small{display:block;color:#786f61;line-height:1.4;margin-top:3px}.rsc-tools{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0}.rsc-tools select,.rsc-file{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9d0c1;border-radius:11px;background:#fff}.rsc-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rsc-btn{border:0;border-radius:12px;padding:11px 10px;font-weight:900;background:#1f1f1d;color:#fff}.rsc-btn.alt{background:#ffe275;color:#30280f}.rsc-progress{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.rsc-chip{padding:6px 8px;border-radius:999px;background:#f1eee6;font-size:10px;font-weight:850}.rsc-chip.on{background:#dff1ff;color:#245178}.rsc-note{font-size:10px;line-height:1.45;color:#71695f;margin-top:9px}.rsc-recent{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:9px}.rsc-recent figure{margin:0;position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#eee}.rsc-recent img{width:100%;height:100%;object-fit:cover}.rsc-recent span{position:absolute;left:4px;bottom:4px;right:4px;background:rgba(0,0,0,.62);color:#fff;font-size:8px;padding:3px 4px;border-radius:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rsc-camera{position:fixed;inset:0;z-index:10000;background:#0b0d0e;display:flex;flex-direction:column}.rsc-camera[hidden]{display:none}.rsc-video{width:100%;height:calc(100dvh - 150px);object-fit:cover;background:#111}.rsc-cameraTop{position:absolute;left:12px;right:12px;top:max(12px,env(safe-area-inset-top));z-index:2;display:flex;justify-content:space-between;align-items:center;color:#fff;font-weight:900;text-shadow:0 1px 5px #000}.rsc-cameraBottom{height:150px;display:grid;grid-template-columns:1fr 82px 1fr;align-items:center;gap:10px;padding:12px 18px max(16px,env(safe-area-inset-bottom));box-sizing:border-box;color:#fff}.rsc-shutter{width:76px;height:76px;border-radius:50%;border:7px solid #fff;background:#ffec6b;box-shadow:inset 0 0 0 3px #111}.rsc-cameraBottom button:not(.rsc-shutter){border:0;background:transparent;color:#fff;font-weight:900;font-size:13px}.rsc-count{text-align:center;font-size:11px;color:#d9d9d9}
      @media(max-width:520px){.rsc-tools,.rsc-actions{grid-template-columns:1fr}.rsc-recent{grid-template-columns:repeat(3,1fr)}}
    `;document.head.appendChild(s);
  }
  function kindLabel(v){return KINDS.find(x=>x[0]===v)?.[1]||v}
  function nextSubject(){const i=TALENT_SUBJECTS.indexOf(state.subject);state.subject=TALENT_SUBJECTS[(i+1)%TALENT_SUBJECTS.length]}
  function stopCamera(){if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null}document.getElementById('rscCamera')?.setAttribute('hidden','')}
  async function saveBlob(blob,source='CAMERA'){
    const id=`cap_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const record={id,sessionId,packageType:'TALENT_WEEKLY_ASSIGNMENT',subject:state.subject,captureKind:state.kind,capturedAt:new Date().toISOString(),source,blob,status:'CAPTURED_LOCAL',analysisState:'PENDING',visibility:state.kind==='ANSWER_REFERENCE'?'PARENT_ONLY':'PARENT_SOURCE',provenance:'PARENT_CAPTURE'};
    await putCapture(record);await refresh();return record;
  }
  async function captureFrame(){
    const v=document.getElementById('rscVideo');if(!v||!v.videoWidth)return;
    const max=1600,scale=Math.min(1,max/v.videoWidth),c=document.createElement('canvas');c.width=Math.round(v.videoWidth*scale);c.height=Math.round(v.videoHeight*scale);c.getContext('2d').drawImage(v,0,0,c.width,c.height);
    const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',0.84));if(!blob)return;
    await saveBlob(blob);toast(`${state.subject} · ${kindLabel(state.kind)} 촬영 저장`);
  }
  async function openCamera(){
    const cam=document.getElementById('rscCamera'),v=document.getElementById('rscVideo');if(!cam||!v)return;
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});v.srcObject=state.stream;await v.play();cam.removeAttribute('hidden');await refreshCameraLabel();
    }catch(e){document.getElementById('rscFile')?.click();toast('카메라 직접 연결이 어려워 기기 촬영 화면으로 전환했어요.')}
  }
  async function refreshCameraLabel(){const rows=await allCaptures();const n=rows.filter(x=>x.subject===state.subject).length;const el=document.getElementById('rscCameraLabel');if(el)el.textContent=`${state.subject} · ${kindLabel(state.kind)} · ${n}장`}
  async function handleFile(file){if(!file)return;await saveBlob(file,'FILE_INPUT');toast(`${state.subject} 촬영 원본 저장`)}
  async function refresh(){
    const root=document.getElementById('rscCaptureRoot');if(!root)return;
    const rows=await allCaptures(),counts=Object.fromEntries(TALENT_SUBJECTS.map(s=>[s,rows.filter(x=>x.subject===s).length]));
    const progress=root.querySelector('.rsc-progress');if(progress)progress.innerHTML=TALENT_SUBJECTS.map(s=>`<span class="rsc-chip ${s===state.subject?'on':''}">${s} ${counts[s]}장</span>`).join('');
    state.urls.forEach(URL.revokeObjectURL);state.urls=[];
    const recent=root.querySelector('.rsc-recent');if(recent){recent.innerHTML=rows.slice(-8).reverse().map(x=>{const u=URL.createObjectURL(x.blob);state.urls.push(u);return `<figure><img src="${u}" alt="${x.subject} ${kindLabel(x.captureKind)}"><span>${x.subject} · ${kindLabel(x.captureKind)}</span></figure>`}).join('')}
    const total=root.querySelector('[data-rsc-total]');if(total)total.textContent=`현재 ${rows.length}장 임시저장`;
    const sel=root.querySelector('#rscSubject');if(sel)sel.value=state.subject;const kind=root.querySelector('#rscKind');if(kind)kind.value=state.kind;
    await refreshCameraLabel();
  }
  async function queueAnalysis(){
    const rows=await allCaptures();if(!rows.length){toast('먼저 숙제 사진을 촬영해 주세요.');return}
    await updateAnalysisState('PENDING_ANALYSIS');
    setTimeout(()=>toast(`사진 ${rows.length}장 저장 완료 · 권별 분류 완료 · 분석 대기 등록`),120);
    await refresh();return rows;
  }
  function cameraShell(){
    if(document.getElementById('rscCamera'))return;
    const el=document.createElement('div');el.id='rscCamera';el.className='rsc-camera';el.hidden=true;el.innerHTML=`<div class="rsc-cameraTop"><span id="rscCameraLabel">촬영 준비</span><button id="rscClose" type="button" style="border:0;background:rgba(0,0,0,.45);color:#fff;border-radius:999px;padding:9px 12px;font-weight:900">촬영 완료</button></div><video id="rscVideo" class="rsc-video" playsinline muted></video><div class="rsc-cameraBottom"><button id="rscNextBook" type="button">다음 권</button><button id="rscShutter" class="rsc-shutter" type="button" aria-label="촬영"></button><div><button id="rscKindCycle" type="button">촬영 종류 변경</button><div class="rsc-count">찍으면 바로 임시저장</div></div></div>`;document.body.appendChild(el);
    el.querySelector('#rscClose').onclick=stopCamera;
    el.querySelector('#rscShutter').onclick=()=>captureFrame().catch(e=>toast(`촬영 저장 오류 · ${e.message}`));
    el.querySelector('#rscNextBook').onclick=()=>{nextSubject();refresh().catch(()=>{})};
    el.querySelector('#rscKindCycle').onclick=()=>{const i=KINDS.findIndex(x=>x[0]===state.kind);state.kind=KINDS[(i+1)%KINDS.length][0];refresh().catch(()=>{})};
  }
  function mount(){
    if(ROLE!=='PARENT')return;
    const parent=document.getElementById('rsfParent');if(!parent||document.getElementById('rscCaptureRoot'))return;
    installStyles();cameraShell();
    const talent=[...parent.querySelectorAll('.rsf-section')].find(s=>s.querySelector('h3')?.textContent?.includes('재능'));
    if(!talent)return;
    const root=document.createElement('div');root.id='rscCaptureRoot';root.className='rsc-wrap';root.innerHTML=`<div class="rsc-head"><div><b>빠른 촬영</b><small>권을 고르고 찍으면 자동 임시저장돼요. 같은 권은 계속 찍고, 끝나면 다음 권으로 넘겨요.</small></div><span class="rsf-badge" data-rsc-total>현재 0장</span></div><div class="rsc-tools"><select id="rscSubject" aria-label="재능 권 선택">${TALENT_SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select><select id="rscKind" aria-label="촬영 종류">${KINDS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div><div class="rsc-actions"><button id="rscOpenCamera" class="rsc-btn" type="button">촬영 시작</button><button id="rscQueue" class="rsc-btn alt" type="button">저장하고 분석</button></div><input id="rscFile" class="rsc-file" type="file" accept="image/*" capture="environment" hidden><div class="rsc-progress"></div><div class="rsc-recent"></div><div class="rsc-note">답안·해설지는 <b>부모 전용</b>으로 저장되며 아이 화면에 노출하지 않습니다. 사진은 먼저 기기에 보존되고, AI 분석은 서버 승인 상태일 때만 실행됩니다. 분석 결과도 부모가 확인하기 전에는 숙제 FACT로 확정되지 않습니다.</div>`;
    talent.insertBefore(root,talent.children[2]||talent.firstChild);
    root.querySelector('#rscSubject').onchange=e=>{state.subject=e.target.value;refresh().catch(()=>{})};
    root.querySelector('#rscKind').onchange=e=>{state.kind=e.target.value;refresh().catch(()=>{})};
    root.querySelector('#rscOpenCamera').onclick=()=>openCamera();
    root.querySelector('#rscQueue').onclick=()=>queueAnalysis().catch(e=>toast(`저장 오류 · ${e.message}`));
    root.querySelector('#rscFile').onchange=e=>{const f=e.target.files?.[0];handleFile(f).finally(()=>{e.target.value=''})};
    refresh().catch(e=>console.warn('[Ready Capture]',e));
  }
  const observer=new MutationObserver(()=>mount());observer.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopCamera()});
  window.addEventListener('pagehide',stopCamera);
  window.ReadyParentCaptureIntakeV1={version:VERSION,mount,allCaptures,queueAnalysis,dbName:DB_NAME,storeName:STORE};
  mount();
})();