(() => {
  'use strict';
  if(window.ReadyHomeworkAnalysisBridgeV1)return;
  const VERSION='2026.09.13-homework-analysis-bridge-v1';
  const ROLE=new URLSearchParams(location.search).get('role')==='parent'?'PARENT':'CHILD';
  const toast=msg=>window.toast?window.toast(msg):alert(msg);
  const capture=()=>window.ReadyParentCaptureIntakeV1;

  function statusNode(){
    const root=document.getElementById('rscCaptureRoot');if(!root)return null;
    let n=root.querySelector('#rscAnalysisStatus');if(!n){n=document.createElement('div');n.id='rscAnalysisStatus';n.className='rsc-note';const actions=root.querySelector('.rsc-actions');actions?.insertAdjacentElement('afterend',n)}return n;
  }
  function setStatus(text,tone=''){const n=statusNode();if(!n)return;n.textContent=text;n.dataset.tone=tone}
  const dataUrl=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)});
  function latestKinds(rows){
    const m=new Map();for(const r of rows){const prev=m.get(r.captureKind);if(!prev||String(r.capturedAt)>String(prev.capturedAt))m.set(r.captureKind,r)}return [...m.values()].slice(0,4)
  }
  async function markRows(rows,analysisState,result=null){
    const api=capture();if(!api||!rows.length)return;
    const db=await new Promise((resolve,reject)=>{const q=indexedDB.open(api.dbName,1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    await new Promise((resolve,reject)=>{const tx=db.transaction(api.storeName,'readwrite'),s=tx.objectStore(api.storeName);for(const r of rows)s.put({...r,analysisState,analysisResult:result||r.analysisResult||null,analysisUpdatedAt:new Date().toISOString()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
  }
  async function analyzeSubject(subject,rows){
    const selected=latestKinds(rows);const images=[];
    for(const r of selected)images.push({captureKind:r.captureKind,dataUrl:await dataUrl(r.blob)});
    const requestId=`hw_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const res=await fetch('/api/homework-analysis',{method:'POST',headers:{'content-type':'application/json','x-ready-request-id':requestId},body:JSON.stringify({subject,packageType:'TALENT_WEEKLY_ASSIGNMENT',confirmCost:true,images})});
    const body=await res.json().catch(()=>({ok:false,error:'INVALID_ANALYSIS_RESPONSE'}));
    if(!res.ok)throw Object.assign(new Error(body?.message||body?.error||`ANALYSIS_${res.status}`),{status:res.status,code:body?.code||body?.error,body});
    await markRows(rows,'ANALYZED_PENDING_PARENT_CONFIRMATION',body.result);
    return body.result;
  }
  function talentRow(subject){return [...document.querySelectorAll('#rsfParent [data-rsf-talent]')].find(x=>x.dataset.rsfTalent===subject)||null}
  function applyCandidate(subject,result){
    const row=talentRow(subject);if(!row)return false;
    const range=row.querySelector('[data-range]'),instruction=row.querySelector('[data-instruction]'),answer=row.querySelector('[data-answer]');
    if(result.observedRange&&range)range.value=result.observedRange;
    if(result.teacherInstruction&&instruction)instruction.value=result.teacherInstruction;
    if(result.answerReferenceNote&&answer)answer.value=result.answerReferenceNote;
    row.dataset.analysisCandidate='1';return true;
  }
  async function run(){
    const api=capture();if(!api)return;
    const rows=await api.allCaptures();if(!rows.length){toast('먼저 숙제 사진을 촬영해 주세요.');return}
    await api.queueAnalysis();
    setStatus(`사진 ${rows.length}장 저장됨 · 분석 연결 확인 중…`);
    const groups=new Map();for(const r of rows){if(!groups.has(r.subject))groups.set(r.subject,[]);groups.get(r.subject).push(r)}
    const results=[];
    try{
      for(const [subject,items] of groups){setStatus(`${subject} 사진 분석 중…`);const result=await analyzeSubject(subject,items);results.push({subject,result})}
    }catch(e){
      if(e.status===423||e.code==='HOMEWORK_ANALYSIS_DISABLED'){
        setStatus(`사진 ${rows.length}장 저장 완료 · AI 분석은 관리자 승인 전이라 분석 대기 상태예요.`,'locked');return;
      }
      if(e.status===503){setStatus('사진은 저장됐어요. 분석 제공자 설정이 완료되면 이어서 분석할 수 있어요.','locked');return}
      setStatus(`사진은 저장됐어요 · 분석 연결 오류: ${e.message}`,'error');return;
    }
    await new Promise(r=>setTimeout(r,80));
    let applied=0;const recaptures=[];
    for(const {subject,result} of results){if(applyCandidate(subject,result))applied++;if(result.needsRecapture)recaptures.push(`${subject}: ${result.recaptureReason||'범위/지시사항이 선명하게 보이도록 다시 촬영'}`)}
    if(recaptures.length){setStatus(`분석 후보 ${applied}권 반영 · 다시 찍을 장: ${recaptures.join(' / ')} · 확인 후 FACT 저장·확인을 눌러주세요.`,'warn')}
    else setStatus(`분석 후보 ${applied}권 입력 완료 · 범위와 지시사항을 확인한 뒤 ‘재능 6권 FACT 저장 · 확인’을 눌러주세요.`,'ready');
    toast('사진 분석 후보를 입력했어요. 부모 확인 후 FACT로 확정해 주세요.');
  }
  function attach(){
    if(ROLE!=='PARENT'||!capture())return;
    const btn=document.getElementById('rscQueue');if(!btn||btn.dataset.analysisBridge==='1')return;
    btn.dataset.analysisBridge='1';btn.onclick=()=>run().catch(e=>{setStatus(`분석 준비 오류 · ${e.message}`,'error');toast('사진은 보존되어 있어요. 분석 준비 중 오류가 났어요.')});
    setStatus('촬영 원본은 기기에 먼저 저장됩니다. AI 분석은 서버 승인 상태일 때만 실행하고, 결과는 부모 확인 전까지 후보로 유지합니다.');
  }
  const obs=new MutationObserver(attach);obs.observe(document.documentElement,{subtree:true,childList:true});
  window.ReadyHomeworkAnalysisBridgeV1={version:VERSION,run,attach};attach();
})();
