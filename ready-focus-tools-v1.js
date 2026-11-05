(() => {
  'use strict';
  const VERSION='2026.09.15-focus-golden-v4';
  const $=s=>document.querySelector(s);
  let mediaRecorder=null,mediaStream=null,chunks=[],currentAudio=null,recordStartedAt=0,recordTicker=null,starting=false,previewUrl='';
  const MAX_RECORDING_MS=180000;
  function setRecordingActive(on){window.__readyRecordingActive=!!on}
  function revokePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=''}}

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
    clearInterval(recordTicker);recordTicker=null;stopStream();setRecordingActive(false);revokePreview();currentAudio=null;chunks=[];
    if($('#recordClock'))$('#recordClock').textContent='00:00';if($('#recordState'))$('#recordState').textContent='READY';
    if($('#reviewPanel'))$('#reviewPanel').hidden=true;if($('#audioPreview'))$('#audioPreview').removeAttribute('src');$('#waveform')?.classList.remove('active');
    const action=$('#recordAction');if(action){action.textContent='녹음 시작';action.classList.remove('recording')}
  }
  const runtime=()=>window.ReadyBaseRuntimeV1;
  function crew(){return runtime()?.crewGuide?.()||{id:'dubi',name:'두비',src:'./characters/ui_cutouts/dubi.png'}}
  function ensureRecordingMarkup(){
    $('#recordState')?.classList.add('recordState');$('#recordClock')?.classList.add('recordClock');
    const wave=$('#waveform');if(wave){wave.classList.add('waveform');if(!wave.children.length)for(let i=0;i<18;i++)wave.appendChild(document.createElement('i'))}
    const coach=$('#coachVoiceBtn');if(coach)coach.hidden=true; // no active coach-voice handler since app.js removal
  }
  function renderRecordingContext(){
    ensureRecordingMarkup();
    if($('#recordTimerContext'))$('#recordTimerContext').textContent=$('#remainingTime')?.textContent||'';
    runtime()?.applyCrew?.($('#recordGuidePortrait'));runtime()?.applyUserAvatar?.($('#recordAvatar'));
    if($('#guideDialogue')&&$('#reviewPanel')?.hidden!==false)$('#guideDialogue').textContent=`${crew().name}: 문장을 소리 내어 읽고 녹음한 뒤 저장해 주세요.`;
    const save=$('#saveRecordingBtn'),retry=$('#rerecordBtn');if(save&&!save.textContent.trim())save.textContent='녹음 저장';if(retry&&!retry.textContent.trim())retry.textContent='다시 녹음'
  }
  function finishRecording(){
    clearInterval(recordTicker);recordTicker=null;stopStream();setRecordingActive(false);
    if(!chunks.length){resetRecordingUI();toast('녹음된 소리가 없어요. 다시 녹음해 주세요.');return}
    const action=$('#recordAction');if(action){action.textContent='녹음 시작';action.classList.remove('recording')}
    if($('#recordState'))$('#recordState').textContent='REVIEW';$('#waveform')?.classList.remove('active');
    const main=crew(),pool=(runtime()?.crewCore6||['dubi','lori','ink','nova','take','zero']).filter(id=>id!==main.id),guest=runtime()?.crewGuide?.(pool[Math.floor(Math.random()*pool.length)]||'lori');
    runtime()?.applyCrew?.($('#duoMainGuide'),main);if(guest)runtime()?.applyCrew?.($('#duoGuestGuide'),guest);
    if($('#guideDialogue'))$('#guideDialogue').textContent=`${main.name}: 끝까지 녹음했어! 같이 들어보자.`;
    if($('#duoText'))$('#duoText').textContent=guest?`${main.name} · ${guest.name}: 녹음을 끝까지 완료한 것을 먼저 확인할게. 자동 평가는 하지 않아요.`:'';
    const type=mediaRecorder?.mimeType||chunks[0]?.type||'audio/webm';currentAudio=new Blob(chunks,{type});
    const preview=$('#audioPreview');if(preview){revokePreview();previewUrl=URL.createObjectURL(currentAudio);preview.src=previewUrl}if($('#reviewPanel'))$('#reviewPanel').hidden=false;
    if($('#formatNote'))$('#formatNote').textContent=/audio\/(mp4|m4a)/.test(type)?'이 기기에 m4a 형식으로 저장돼요.':'이 기기에 webm 형식으로 저장돼요.'
  }
  async function startRecording(){
    if(starting||mediaRecorder?.state==='recording')return;
    if(window.isSecureContext===false){toast('마이크 녹음은 https 주소에서만 할 수 있어요.');return}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('이 브라우저는 마이크 녹음을 지원하지 않습니다.');return}
    const action=$('#recordAction');starting=true;if(action)action.disabled=true;
    stopStream();window.ReadyBgmV1?.pause?.();
    try{
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(document.visibilityState==='hidden'){stopStream();return}
      const candidates=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm'];
      const mime=candidates.find(m=>MediaRecorder.isTypeSupported?.(m))||'';
      mediaRecorder=new MediaRecorder(mediaStream,mime?{mimeType:mime}:undefined);chunks=[];
      mediaRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};mediaRecorder.onstop=finishRecording;mediaRecorder.start(250);recordStartedAt=Date.now();setRecordingActive(true);
      if($('#recordState'))$('#recordState').textContent='RECORDING';$('#waveform')?.classList.add('active');const action=$('#recordAction');if(action){action.textContent='녹음 끝내기';action.classList.add('recording')}
      recordTicker=setInterval(()=>{const ms=Date.now()-recordStartedAt;if($('#recordClock'))$('#recordClock').textContent=fmt(ms);renderRecordingContext();if(ms>=MAX_RECORDING_MS&&mediaRecorder?.state==='recording'){mediaRecorder.stop();toast('녹음은 최대 3분까지 할 수 있어요.')}},250)
    }catch(error){stopStream();setRecordingActive(false);const n=error?.name;toast(n==='NotAllowedError'||n==='SecurityError'?'마이크 권한이 필요합니다.':n==='NotFoundError'?'마이크를 찾을 수 없습니다.':n==='NotReadableError'?'다른 앱이 마이크를 사용 중이에요.':'녹음을 시작할 수 없습니다.')}
    finally{starting=false;const a=$('#recordAction');if(a)a.disabled=false}
  }
  function storeAudio(blob,name,type){
    return new Promise((resolve,reject)=>{const req=indexedDB.open('readyset_audio',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('audio'))req.result.createObjectStore('audio',{keyPath:'id'})};req.onerror=()=>reject(req.error);req.onsuccess=()=>{const tx=req.result.transaction('audio','readwrite');tx.objectStore('audio').put({id:`a_${Date.now()}`,name,type,blob,createdAt:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)}})
  }
  async function saveRecording(){
    if(!currentAudio){toast('먼저 녹음을 완료해 주세요.');return}
    const ownsWait=window.ReadyBaseRuntimeV1?.setInterruption?.('SYSTEM_WAIT',true,'RECORDING_SAVE');
    try{
      const type=currentAudio.type||'audio/webm',ext=/audio\/(mp4|m4a)/.test(type)?'m4a':'webm',name=`ready-set-recording-${new Date().toISOString().replace(/[:.]/g,'-')}.${ext}`;
      await storeAudio(currentAudio,name,type);markRecordingCompleted();toast('녹음 저장 완료');resetRecordingUI();window.ReadyBaseRuntimeV1?.nav?.('focus');setTimeout(ensure,0)
    }catch{toast('녹음을 저장하지 못했습니다. 다시 시도해 주세요.')}finally{if(ownsWait)window.ReadyBaseRuntimeV1?.setInterruption?.('SYSTEM_WAIT',false)}
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
      #recordingView .recordingMain{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:6px 22px calc(30px + env(safe-area-inset-bottom))}
      #recordingView #recordTimerContext{font-weight:900;font-size:13px;color:#8a5a3d;align-self:center}
      #recordGuidePortrait{order:-2;width:min(46vw,176px);height:min(46vw,176px);border-radius:50%;box-shadow:0 14px 30px rgba(110,70,40,.16),inset 0 0 0 4px #fff}
      #recordAvatar{order:-1;width:52px;height:52px;margin:-58px 0 0 min(34vw,128px);border-radius:18px;display:grid;place-items:center;font-weight:950;font-size:19px;color:#5a3a28;background:linear-gradient(145deg,#ffe7d6,#eaa789);border:3px solid #fff;box-shadow:0 6px 14px rgba(90,58,40,.18);background-size:cover;background-position:center}
      #guideDialogue{max-width:330px;margin:4px 0 0;padding:12px 16px;border-radius:18px;background:#fff;font-weight:800;font-size:15px;line-height:1.45;color:#2a231f;box-shadow:0 8px 20px rgba(90,58,40,.08)}
      #guideDialogue:empty{display:none}
      #recordingView .recordState{margin-top:6px;color:#b0714f;font-weight:900}
      #recordingView .recordClock{color:#2a231f;font-variant-numeric:tabular-nums}
      #recordingView .waveform{width:100%;max-width:320px;height:64px;margin:4px 0}
      #recordAction{width:min(300px,100%);min-height:58px;border:0;border-radius:999px;background:#2a231f;color:#fff;font:900 17px/1 system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 12px 24px rgba(42,35,31,.22);touch-action:manipulation}
      #recordAction::before{content:"";width:14px;height:14px;border-radius:50%;background:#ff4b3e}
      #recordAction.recording{background:#d9483b}#recordAction.recording::before{border-radius:3px;background:#fff}
      #recordAction:disabled{opacity:.6}
      #reviewPanel{width:100%;max-width:340px;margin-top:8px;padding:14px;border-radius:22px;background:#fff;display:flex;flex-wrap:wrap;justify-content:center;gap:10px;box-shadow:0 10px 24px rgba(90,58,40,.1)}#reviewPanel[hidden]{display:none}
      #reviewPanel audio{flex-basis:100%;width:100%}
      #duoMainGuide,#duoGuestGuide{width:64px;height:64px;border-radius:50%}#duoGuestGuide{box-shadow:0 0 0 2px #f4c66d}
      #duoText,#formatNote{flex-basis:100%;margin:0;font-size:13px;font-weight:700;color:#6b5546;line-height:1.45}#formatNote{font-size:11px;opacity:.75}
      #rerecordBtn,#saveRecordingBtn{flex:1 1 40%;min-height:48px;border:0;border-radius:16px;font-weight:900;font-size:15px;background:#f3ebe3;color:#2a231f}#saveRecordingBtn{background:#2a231f;color:#fff}
      @media(max-width:390px){#focusView .clockHero{max-width:68vw;max-height:68vw}#focusView::after{opacity:.18}}
      @media(min-width:760px){#focusView{width:100%;max-width:none}#focusView .focusMain{width:min(430px,calc(100% - 48px));margin-left:auto;margin-right:clamp(28px,8vw,128px)}#focusView .focusHeader{width:min(430px,calc(100% - 48px));margin-left:auto;margin-right:clamp(28px,8vw,128px)}#focusView::before{width:62vmin;height:62vmin;left:4vw;top:14%;opacity:.2}#focusView::after{right:auto;left:22vw;top:56%;transform:rotate(18deg) scale(.7)}}
    `;document.head.appendChild(style)}
    document.documentElement.dataset.readyFocusTools=VERSION
  }

  // Never leave the mic open when the page is hidden, locked or unloaded.
  function stopForBackground(){if(mediaRecorder?.state==='recording'){try{mediaRecorder.stop()}catch{stopStream()}}else if(!starting)stopStream()}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopForBackground()});
  window.addEventListener('pagehide',stopForBackground);
  const rerender=()=>setTimeout(ensure,0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.addEventListener('pageshow',rerender);document.addEventListener('click',event=>{if(event.target.closest('[data-rev07-task],#focusMission,#recordBackBtn,#saveRecordingBtn'))rerender()});
  window.ReadyFocusToolsV1={version:VERSION,render:ensure,validate:()=>({version:VERSION,recordingRequired:taskExplicitlyNeedsRecording(),recordingVisible:$('#recBtn')?.hidden===false,recordingCompleted:recordingCompleted(),accessibleName:$('#recBtn')?.getAttribute('aria-label')||null,clockNumerals:$('#focusView .clockHero')?.querySelectorAll('.clockNumber').length||0,clockBrand:$('#focusView .clockBrand')?.textContent||null,targetLabel:$('#focusView .timeStrip>div:last-child small')?.textContent||null,recordingController:!!$('#recordAction')?.dataset.goldenBound})};
})();