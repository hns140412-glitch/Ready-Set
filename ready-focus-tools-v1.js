(() => {
  'use strict';
  const VERSION='2026.09.15-focus-golden-v4';
  const $=s=>document.querySelector(s);
  let mediaRecorder=null,mediaStream=null,chunks=[],currentAudio=null,recordStartedAt=0,recordTicker=null;

  function toast(message){const t=$('#toast');if(!t)return;t.textContent=message;t.hidden=false;clearTimeout(t._focusTm);t._focusTm=setTimeout(()=>t.hidden=true,2200)}
  function fmt(ms){const seconds=Math.max(0,Math.floor(Number(ms||0)/1000));return`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
  function normalizeMissionLabel(value){return String(value||'').trim().replace(/영어\s*·\s*recording\b/ig,'영어 · 문장 녹음')}

  function activeMissionLabel(){
    const mission=normalizeMissionLabel($('#focusMission')?.textContent);
    if(mission)return mission;
    const c=window.ReadySetRev07?.contract?.();
    const task=c?.tasks?.find(t=>t.task_id===c.active_task_id);
    if(task?.label)return normalizeMissionLabel(task.label);
    const plannerTask=window.ReadyBaseRuntimeV1?.selectedPlannerTask?.();
    return normalizeMissionLabel(plannerTask?.title||plannerTask?.label||'');
  }

  function taskExplicitlyNeedsRecording(){
    const label=activeMissionLabel();
    if(/영어\s*·\s*문장\s*녹음/.test(label))return true;
    const task=window.ReadyBaseRuntimeV1?.selectedPlannerTask?.();
    if(!task)return false;
    const subject=String(task.subject||'');
    const flags=[task.activityType,task.activity,task.mode,task.tool,task.requiredTool,task.requiredTools,task.activities].flat().filter(Boolean).map(String).join(' ');
    return /영어/i.test(subject)&&/(?:문장\s*녹음|recording|record\b)/i.test(flags);
  }

  function sessionKey(){
    const id=window.ReadySetRev07?.contract?.()?.session_id||'active';
    return `ready_focus_recording_done:${id}:${activeMissionLabel()}`;
  }

  function recordingCompleted(){try{return sessionStorage.getItem(sessionKey())==='1'}catch{return false}}
  function markRecordingCompleted(){try{sessionStorage.setItem(sessionKey(),'1')}catch{}renderRecState()}

  function ensureClockDetails(){
    const clock=$('#focusView .clockHero');
    if(!clock)return;
    for(let n=1;n<=12;n++){
      if(clock.querySelector(`.clockNumber.n${n}`))continue;
      const number=document.createElement('span');
      number.className=`clockNumber n${n}`;number.textContent=String(n);number.setAttribute('aria-hidden','true');clock.appendChild(number)
    }
    let brand=clock.querySelector('.clockBrand');
    if(!brand){brand=document.createElement('span');brand.className='clockBrand';brand.textContent='Ready & Set';brand.setAttribute('aria-hidden','true');clock.appendChild(brand)}
  }

  function applyGoldenCopy(){
    const focus=$('#focusView');if(!focus)return;
    const headline=focus.querySelector('.focusTitle h1');if(headline)headline.textContent='그냥! 지금 하면 돼!';
    const mission=$('#focusMission');if(mission)mission.textContent=normalizeMissionLabel(mission.textContent);
    const targetLabel=focus.querySelector('.timeStrip>div:last-child small');if(targetLabel)targetLabel.textContent='목표 시간';
    ensureClockDetails()
  }

  function renderRecState(){
    const rec=$('#recBtn');if(!rec)return;
    const required=taskExplicitlyNeedsRecording();
    rec.hidden=!required;rec.setAttribute('aria-hidden',required?'false':'true');rec.setAttribute('aria-label','문장 녹음');rec.type='button';
    rec.closest('.timeStrip')?.classList.toggle('recording-required',required);
    const label=rec.querySelector('span'),done=required&&recordingCompleted();
    if(label)label.textContent=done?'REC ✓':'REC';rec.classList.toggle('completed',done);rec.dataset.completed=done?'true':'false'
  }

  function stopStream(){mediaStream?.getTracks?.().forEach(track=>track.stop());mediaStream=null}
  function resetRecordingUI(){
    clearInterval(recordTicker);recordTicker=null;stopStream();currentAudio=null;chunks=[];
    if($('#recordClock'))$('#recordClock').textContent='00:00';if($('#recordState'))$('#recordState').textContent='READY';
    if($('#reviewPanel'))$('#reviewPanel').hidden=true;if($('#audioPreview'))$('#audioPreview').removeAttribute('src');
    const action=$('#recordAction');if(action){action.textContent='녹음 시작';action.classList.remove('recording')}
  }
  function renderRecordingContext(){
    if($('#recordTimerContext'))$('#recordTimerContext').textContent=$('#remainingTime')?.textContent||'';
    if($('#guideDialogue'))$('#guideDialogue').textContent='문장을 읽고 녹음한 뒤 저장해 주세요.';
    const save=$('#saveRecordingBtn'),retry=$('#rerecordBtn');if(save&&!save.textContent.trim())save.textContent='녹음 저장';if(retry&&!retry.textContent.trim())retry.textContent='다시 녹음'
  }
  function finishRecording(){
    clearInterval(recordTicker);recordTicker=null;stopStream();
    const action=$('#recordAction');if(action){action.textContent='녹음 시작';action.classList.remove('recording')}
    if($('#recordState'))$('#recordState').textContent='REVIEW';
    const type=mediaRecorder?.mimeType||chunks[0]?.type||'audio/webm';currentAudio=new Blob(chunks,{type});
    const preview=$('#audioPreview');if(preview){preview.src=URL.createObjectURL(currentAudio)}if($('#reviewPanel'))$('#reviewPanel').hidden=false
  }
  async function startRecording(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('이 브라우저는 마이크 녹음을 지원하지 않습니다.');return}
    try{
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const candidates=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm'];
      const mime=candidates.find(m=>MediaRecorder.isTypeSupported?.(m))||'';
      mediaRecorder=new MediaRecorder(mediaStream,mime?{mimeType:mime}:undefined);chunks=[];
      mediaRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};mediaRecorder.onstop=finishRecording;mediaRecorder.start(250);recordStartedAt=Date.now();
      if($('#recordState'))$('#recordState').textContent='RECORDING';const action=$('#recordAction');if(action){action.textContent='녹음 끝내기';action.classList.add('recording')}
      recordTicker=setInterval(()=>{if($('#recordClock'))$('#recordClock').textContent=fmt(Date.now()-recordStartedAt);renderRecordingContext()},250)
    }catch(error){stopStream();toast(error?.name==='NotAllowedError'?'마이크 권한이 필요합니다.':'녹음을 시작할 수 없습니다.')}
  }
  function storeAudio(blob,name,type){
    return new Promise((resolve,reject)=>{const req=indexedDB.open('readyset_audio',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('audio'))req.result.createObjectStore('audio',{keyPath:'id'})};req.onerror=()=>reject(req.error);req.onsuccess=()=>{const tx=req.result.transaction('audio','readwrite');tx.objectStore('audio').put({id:`a_${Date.now()}`,name,type,blob,createdAt:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)}})
  }
  async function saveRecording(){
    if(!currentAudio){toast('먼저 녹음을 완료해 주세요.');return}
    try{
      const type=currentAudio.type||'audio/webm',ext=/audio\/(mp4|m4a)/.test(type)?'m4a':'webm',name=`ready-set-recording-${new Date().toISOString().replace(/[:.]/g,'-')}.${ext}`;
      await storeAudio(currentAudio,name,type);markRecordingCompleted();toast('녹음 저장 완료');resetRecordingUI();window.ReadyBaseRuntimeV1?.nav?.('focus');setTimeout(ensure,0)
    }catch{toast('녹음을 저장하지 못했습니다. 다시 시도해 주세요.')}
  }

  function bindRecordingRoundTrip(){
    const rec=$('#recBtn');
    if(rec&&!rec.dataset.goldenBound){rec.dataset.goldenBound='1';rec.addEventListener('click',()=>{if(!taskExplicitlyNeedsRecording())return;renderRecordingContext();window.ReadyBaseRuntimeV1?.nav?.('recording')})}
    const action=$('#recordAction');if(action&&!action.dataset.goldenBound){action.dataset.goldenBound='1';action.addEventListener('click',()=>{if(mediaRecorder?.state==='recording')mediaRecorder.stop();else startRecording()})}
    const save=$('#saveRecordingBtn');if(save&&!save.dataset.goldenBound){save.dataset.goldenBound='1';save.addEventListener('click',saveRecording)}
    const retry=$('#rerecordBtn');if(retry&&!retry.dataset.goldenBound){retry.dataset.goldenBound='1';retry.addEventListener('click',resetRecordingUI)}
    const back=$('#recordBackBtn');if(back&&!back.dataset.goldenBound){back.dataset.goldenBound='1';back.addEventListener('click',event=>{if(mediaRecorder?.state==='recording'){event.preventDefault();event.stopImmediatePropagation();toast('녹음을 먼저 끝내주세요.');return}resetRecordingUI();setTimeout(ensure,0)},true)}
    renderRecordingContext()
  }

  function ensure(){
    const focus=$('#focusView .focusHeaderTools'),rec=$('#recBtn');if(!focus||!rec)return;
    applyGoldenCopy();renderRecState();bindRecordingRoundTrip();
    let tools=$('#focusToolsBtn');if(!tools){tools=document.createElement('button');tools.id='focusToolsBtn';tools.className='iconButton';tools.type='button';tools.textContent='도구';tools.setAttribute('aria-label','집중 도구 열기');focus.prepend(tools)}
    let sheet=$('#focusToolsSheet');if(!sheet){sheet=document.createElement('div');sheet.id='focusToolsSheet';sheet.hidden=true;sheet.innerHTML='<div class="focusToolsCard"><b>집중 도구</b><button type="button" id="focusRecordTool">● 녹음</button><button type="button" id="focusToolsClose">닫기</button></div>';document.body.appendChild(sheet)}
    tools.onclick=()=>{sheet.hidden=!sheet.hidden};$('#focusToolsClose').onclick=()=>{sheet.hidden=true};$('#focusRecordTool').onclick=()=>{sheet.hidden=true;renderRecordingContext();window.ReadyBaseRuntimeV1?.nav?.('recording')};
    if(taskExplicitlyNeedsRecording()){tools.dataset.suggested='recording';tools.setAttribute('aria-label','집중 도구 열기 · 녹음 필요')}else{delete tools.dataset.suggested;tools.setAttribute('aria-label','집중 도구 열기')}

    let style=$('#focusToolsStyle');if(!style){style=document.createElement('style');style.id='focusToolsStyle';style.textContent=`
      #focusToolsSheet{position:fixed;inset:0;z-index:9998;background:rgba(20,16,14,.38);display:flex;align-items:flex-end}#focusToolsSheet[hidden]{display:none}
      .focusToolsCard{width:100%;padding:18px 18px calc(18px + env(safe-area-inset-bottom));background:#fffaf5;border-radius:28px 28px 0 0;display:grid;gap:10px}.focusToolsCard b{font-size:18px}.focusToolsCard button{border:0;border-radius:16px;padding:14px;font-weight:800;background:#fff}.focusToolsCard #focusRecordTool{background:#2a231f;color:#fff}
      #focusToolsBtn[data-suggested="recording"]::after{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-left:4px;vertical-align:top}
      #focusView{isolation:isolate}#focusView::before,#focusView::after{content:"";position:absolute;pointer-events:none;z-index:0}
      #focusView::before{width:76vmin;height:76vmin;left:-26vmin;top:18%;opacity:.18;background:repeating-conic-gradient(from -8deg,rgba(20,20,18,.55) 0 2deg,transparent 2deg 14deg);border-radius:50%}
      #focusView::after{right:5%;top:17%;width:86px;height:86px;opacity:.28;background:linear-gradient(45deg,transparent 44%,#1f1e1c 45% 55%,transparent 56%),linear-gradient(-45deg,transparent 44%,#1f1e1c 45% 55%,transparent 56%);transform:rotate(12deg) scale(.42)}
      #focusView .focusHeader,#focusView .focusMain{position:relative;z-index:1}#focusView .clockHero::after{content:none!important}
      #focusView .clockBrand{position:absolute;left:50%;top:31%;transform:translateX(-50%);z-index:2;font-size:clamp(11px,3vw,15px);font-weight:950;letter-spacing:-.03em;white-space:nowrap;color:#25231f}
      #focusView .timeStrip{grid-template-columns:1fr 1fr}#focusView .timeStrip.recording-required{grid-template-columns:1fr auto 1fr}
      #focusView .recButton{min-width:52px;min-height:52px;width:52px;height:52px;touch-action:manipulation}#focusView .recButton.completed span{font-size:9px;letter-spacing:0}#focusView .recButton.completed i{box-shadow:0 0 0 3px rgba(255,255,255,.12)}
      @media(max-width:390px){#focusView .clockHero{max-width:68vw;max-height:68vw}#focusView::after{opacity:.18}}
      @media(min-width:760px){#focusView{width:100%;max-width:none}#focusView .focusMain{width:min(430px,calc(100% - 48px));margin-left:auto;margin-right:clamp(28px,8vw,128px)}#focusView .focusHeader{width:min(430px,calc(100% - 48px));margin-left:auto;margin-right:clamp(28px,8vw,128px)}#focusView::before{width:62vmin;height:62vmin;left:4vw;top:14%;opacity:.2}#focusView::after{right:auto;left:22vw;top:56%;transform:rotate(18deg) scale(.7)}}
    `;document.head.appendChild(style)}
    document.documentElement.dataset.readyFocusTools=VERSION
  }

  const rerender=()=>setTimeout(ensure,0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.addEventListener('pageshow',rerender);document.addEventListener('click',event=>{if(event.target.closest('[data-rev07-task],#focusMission,#recordBackBtn,#saveRecordingBtn'))rerender()});
  window.ReadyFocusToolsV1={version:VERSION,render:ensure,validate:()=>({version:VERSION,recordingRequired:taskExplicitlyNeedsRecording(),recordingVisible:$('#recBtn')?.hidden===false,recordingCompleted:recordingCompleted(),accessibleName:$('#recBtn')?.getAttribute('aria-label')||null,clockNumerals:$('#focusView .clockHero')?.querySelectorAll('.clockNumber').length||0,clockBrand:$('#focusView .clockBrand')?.textContent||null,targetLabel:$('#focusView .timeStrip>div:last-child small')?.textContent||null,recordingController:!!$('#recordAction')?.dataset.goldenBound})};
})();