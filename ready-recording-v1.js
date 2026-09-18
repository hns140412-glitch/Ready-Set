(() => {
  'use strict';
  if (window.ReadyRecordingV1) return;

  const VERSION='2026.09.18-recording-v1';
  const DB_NAME='readyset_audio',STORE_NAME='audio';
  const $=s=>document.querySelector(s);
  let mediaRecorder=null,mediaStream=null,chunks=[],currentAudio=null,currentFile=null,currentStored=false,recordStartedAt=0,recordTicker=null,contextTicker=null;

  const toast=message=>{const t=$('#toast');if(!t)return;t.textContent=message;t.hidden=false;clearTimeout(t._recordTm);t._recordTm=setTimeout(()=>t.hidden=true,2400)};
  const fmt=ms=>{const sec=Math.max(0,Math.floor(Number(ms||0)/1000));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`};
  function setRecordButton(label,recording=false){const action=$('#recordAction');if(!action)return;action.className='bigRecord'+(recording?' recording':'');action.innerHTML='<i aria-hidden="true"></i><span></span>';action.querySelector('span').textContent=label;$('#waveform')?.classList.toggle('active',recording)}
  function ensureRecordingLayout(){
    const main=$('#recordingView .recordingMain');if(!main)return;
    const avatar=$('#recordAvatar'),guide=$('#recordGuidePortrait'),dialogue=$('#guideDialogue');
    let scene=$('#readyRecordingScene');
    if(!scene){scene=document.createElement('section');scene.id='readyRecordingScene';scene.className='guideScene';main.insertBefore(scene,main.firstChild);const bubble=document.createElement('div');bubble.className='guideBubble';scene.append(avatar,bubble);bubble.append(guide,dialogue)}
    avatar?.classList.add('userMiniAvatar');if(avatar){const name=String(state?.profile?.name||'RS').trim();avatar.textContent=name.slice(0,2).toUpperCase()||'RS';if(state?.profile?.photo){avatar.style.backgroundImage=`url(${state.profile.photo})`;avatar.style.backgroundSize='cover';avatar.textContent=''}}
    guide?.classList.add('guideOrb','mainGuide');if(guide)guide.textContent=String(state?.guide?.name||'루미').slice(0,1);
    let panel=$('#readyRecordingPanel');
    if(!panel){panel=document.createElement('section');panel.id='readyRecordingPanel';panel.className='recordPanel';const first=$('#recordState');main.insertBefore(panel,first);panel.append($('#recordState'),$('#recordClock'),$('#waveform'),$('#recordAction'))}
    $('#recordState')?.classList.add('recordState');$('#recordClock')?.classList.add('recordClock');const wave=$('#waveform');wave?.classList.add('waveform');if(wave&&!wave.children.length)wave.innerHTML='<i></i>'.repeat(17);
    $('#reviewPanel')?.classList.add('reviewPanel');$('#formatNote')?.classList.add('muted');setRecordButton(mediaRecorder?.state==='recording'?'녹음 끝내기':'녹음 시작',mediaRecorder?.state==='recording')
  }
  const activeContract=()=>window.ReadySetRev07?.contract?.();
  const activeTask=()=>{const c=activeContract();return c?.tasks?.find(t=>t.task_id===c.active_task_id)||null};
  const activeLabel=()=>String(activeTask()?.label||$('#focusMission')?.textContent||'').trim();

  function taskNeedsRecording(){
    const label=activeLabel();
    if(/(?:영어.*(?:문장\s*녹음|녹음|recording|speaking)|(?:문장\s*녹음|recording|speaking).*영어)/i.test(label))return true;
    const task=window.ReadyBaseRuntimeV1?.selectedPlannerTask?.();
    if(!task)return false;
    const subject=String(task.subject||''),flags=[task.activityType,task.activity,task.mode,task.tool,task.requiredTool,task.requiredTools,task.activities].flat().filter(Boolean).join(' ');
    return /영어/i.test(subject)&&/(?:문장\s*녹음|녹음|recording|record|speaking)/i.test(flags);
  }

  function recordingKey(){
    const c=activeContract(),task=activeTask();
    return `ready_recording_done:${c?.session_id||'active'}:${task?.task_id||activeLabel()||'task'}`;
  }
  function recordingCompleted(){try{return localStorage.getItem(recordingKey())==='1'}catch{return false}}
  function markRecordingCompleted(){try{localStorage.setItem(recordingKey(),'1')}catch{}renderRecState()}

  function stopStream(){mediaStream?.getTracks?.().forEach(track=>track.stop());mediaStream=null}
  function stopTicker(){clearInterval(recordTicker);recordTicker=null}
  function stopContextTicker(){clearInterval(contextTicker);contextTicker=null}
  function startContextTicker(){stopContextTicker();renderContext();contextTicker=setInterval(()=>{if($('#recordingView')?.classList.contains('active'))renderContext();else stopContextTicker()},500)}
  function stopBgm(){window.ReadyBaseRuntimeV1?.stopSound?.()}
  function resumeBgm(){if(state?.activeSession)window.ReadyBaseRuntimeV1?.applySound?.({play:true})}

  function mimeInfo(type=''){
    const t=String(type).toLowerCase();
    if(t.includes('mp4')||t.includes('m4a'))return{ext:'m4a',type:type||'audio/mp4'};
    if(t.includes('webm'))return{ext:'webm',type:type||'audio/webm'};
    if(t.includes('ogg'))return{ext:'ogg',type:type||'audio/ogg'};
    if(t.includes('wav'))return{ext:'wav',type:type||'audio/wav'};
    return{ext:'webm',type:type||'audio/webm'};
  }
  function makeFile(blob){
    const info=mimeInfo(blob?.type),stamp=new Date().toISOString().replace(/[:.]/g,'-');
    return new File([blob],`Ready-Set_${stamp}.${info.ext}`,{type:info.type,lastModified:Date.now()});
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE_NAME))req.result.createObjectStore(STORE_NAME,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function storeOriginal(file){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,'readwrite');
      tx.objectStore(STORE_NAME).put({id:`original_${Date.now()}`,kind:'ORIGINAL',name:file.name,type:file.type,size:file.size,blob:file,createdAt:Date.now(),sessionId:activeContract()?.session_id||null,taskId:activeTask()?.task_id||null});
      tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }

  function ensureReviewActions(){
    const panel=$('#reviewPanel');if(!panel)return;['#duoMainGuide','#duoGuestGuide','#duoText','#coachVoiceBtn'].forEach(sel=>{const el=$(sel);if(el)el.hidden=true});
    let share=$('#shareRecordingBtn');
    if(!share){share=document.createElement('button');share.id='shareRecordingBtn';share.type='button';share.textContent='녹음 파일 전송';panel.appendChild(share)}
    const save=$('#saveRecordingBtn'),retry=$('#rerecordBtn');
    if(save){save.textContent=currentStored?'녹음 확인':'원본 저장';save.className='btn dark'}if(retry){retry.textContent='다시 녹음';retry.className='btn outline'}share.className='btn outline';
    share.onclick=shareRecording;
  }
  function renderContext(){
    if($('#recordTimerContext'))$('#recordTimerContext').textContent=$('#remainingTime')?.textContent||'';
    if($('#guideDialogue'))$('#guideDialogue').textContent='타이머는 계속 이어져요. 문장을 읽고 녹음한 뒤 원본을 저장하거나 전송하세요.';
    ensureRecordingLayout();ensureReviewActions();
  }
  function renderRecState(){
    const rec=$('#recBtn');if(!rec)return;
    const required=taskNeedsRecording(),done=required&&recordingCompleted();
    rec.hidden=!required;rec.type='button';rec.setAttribute('aria-hidden',required?'false':'true');rec.setAttribute('aria-label',done?'문장 녹음 완료':'문장 녹음');
    rec.classList.toggle('completed',done);rec.dataset.completed=done?'true':'false';
    const label=rec.querySelector('span');if(label)label.textContent=done?'REC ✓':'REC';
    rec.closest('.timeStrip')?.classList.toggle('recording-required',required);
  }

  function resetRecording({keepPreview=false}={}){
    stopTicker();stopStream();chunks=[];mediaRecorder=null;
    if(!keepPreview){currentAudio=null;currentFile=null;currentStored=false;const preview=$('#audioPreview');if(preview){if(preview.src)URL.revokeObjectURL(preview.src);preview.removeAttribute('src')}if($('#reviewPanel'))$('#reviewPanel').hidden=true}
    if($('#recordClock'))$('#recordClock').textContent='00:00';
    if($('#recordState'))$('#recordState').textContent='READY';
    setRecordButton('녹음 시작',false)
  }

  async function finishRecording(){
    stopTicker();stopStream();
    const type=mediaRecorder?.mimeType||chunks[0]?.type||'audio/webm';
    currentAudio=new Blob(chunks,{type});currentFile=makeFile(currentAudio);currentStored=false;
    const preview=$('#audioPreview');
    if(preview){if(preview.src)URL.revokeObjectURL(preview.src);preview.src=URL.createObjectURL(currentAudio)}
    let storeError=false;
    try{await storeOriginal(currentFile);currentStored=true}catch{storeError=true}
    if($('#reviewPanel'))$('#reviewPanel').hidden=false;
    if($('#recordState'))$('#recordState').textContent='REVIEW';
    setRecordButton('녹음 시작',false);
    const info=mimeInfo(currentFile.type),note=$('#formatNote');
    if(note)note.textContent=`${storeError?'자동 보관 실패 · ':'원본 보관 완료 · ' }.${info.ext} · ${currentFile.type||'audio'} · ${Math.max(1,Math.round(currentFile.size/1024))}KB`;
    ensureReviewActions();
    toast(storeError?'원본 자동 보관에 실패했어요. 저장 버튼으로 다시 시도해 주세요.':'녹음 원본을 기기에 안전하게 보관했어요.');
  }

  async function startRecording(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('이 브라우저는 마이크 녹음을 지원하지 않습니다.');return}
    stopBgm();
    try{
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const candidates=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm'];
      const mime=candidates.find(m=>MediaRecorder.isTypeSupported?.(m))||'';
      mediaRecorder=new MediaRecorder(mediaStream,mime?{mimeType:mime}:undefined);chunks=[];
      mediaRecorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
      mediaRecorder.onstop=finishRecording;
      mediaRecorder.onerror=()=>{stopTicker();stopStream();toast('녹음 중 문제가 생겼어요. 다시 녹음해 주세요.')};
      mediaRecorder.start(250);recordStartedAt=Date.now();
      if($('#recordState'))$('#recordState').textContent='RECORDING';
      setRecordButton('녹음 끝내기',true)
      recordTicker=setInterval(()=>{if($('#recordClock'))$('#recordClock').textContent=fmt(Date.now()-recordStartedAt);renderContext()},250);
    }catch(error){stopStream();toast(error?.name==='NotAllowedError'?'마이크 권한이 필요합니다.':'녹음을 시작할 수 없습니다.')}
  }

  async function saveRecording(){
    if(!currentAudio||!currentFile){toast('먼저 녹음을 완료해 주세요.');return}
    try{if(!currentStored){await storeOriginal(currentFile);currentStored=true}markRecordingCompleted();toast(`녹음 확인 완료 · ${currentFile.name}`)}
    catch{toast('녹음 원본을 저장하지 못했습니다.')}
  }

  async function shareRecording(){
    if(!currentFile){toast('먼저 녹음을 완료해 주세요.');return}
    try{
      if(navigator.share&&navigator.canShare?.({files:[currentFile]})){await navigator.share({title:'Ready & Set 녹음',text:activeLabel()||'영어 녹음',files:[currentFile]});return}
      const url=URL.createObjectURL(currentFile),a=document.createElement('a');a.href=url;a.download=currentFile.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('기기에 파일을 저장했어요. 공유 앱에서 첨부할 수 있어요.');
    }catch(error){if(error?.name!=='AbortError')toast('파일 전송을 시작하지 못했습니다.')}
  }

  function openRecording(){
    if(!taskNeedsRecording())return;
    stopBgm();resetRecording();window.ReadyBaseRuntimeV1?.nav?.('recording');startContextTicker();
  }
  function returnToFocus(){
    if(mediaRecorder?.state==='recording'){toast('녹음을 먼저 끝내주세요.');return false}
    stopContextTicker();resetRecording();window.ReadyBaseRuntimeV1?.nav?.('focus');resumeBgm();setTimeout(render,0);return true;
  }

  function bind(){
    const rec=$('#recBtn');if(rec&&!rec.dataset.recordingBound){rec.dataset.recordingBound='1';rec.addEventListener('click',openRecording)}
    const action=$('#recordAction');if(action&&!action.dataset.recordingBound){action.dataset.recordingBound='1';action.addEventListener('click',()=>mediaRecorder?.state==='recording'?mediaRecorder.stop():startRecording())}
    const save=$('#saveRecordingBtn');if(save&&!save.dataset.recordingBound){save.dataset.recordingBound='1';save.addEventListener('click',saveRecording)}
    const retry=$('#rerecordBtn');if(retry&&!retry.dataset.recordingBound){retry.dataset.recordingBound='1';retry.addEventListener('click',()=>resetRecording())}
    const back=$('#recordBackBtn');if(back&&!back.dataset.recordingBound){back.dataset.recordingBound='1';back.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();returnToFocus()},true)}
    renderContext();renderRecState()
  }
  function render(){ensureRecordingLayout();bind();renderRecState();if($('#recordingView')?.classList.contains('active')){stopBgm();if(!contextTicker)startContextTicker()}else stopContextTicker()}

  window.addEventListener('pageshow',()=>setTimeout(render,0));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(render,0)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.ReadyRecordingV1=Object.freeze({version:VERSION,render,open:openRecording,save:saveRecording,share:shareRecording,validate:()=>({version:VERSION,recordingRequired:taskNeedsRecording(),recVisible:$('#recBtn')?.hidden===false,mediaRecorderSupported:!!window.MediaRecorder,fileShareSupported:!!navigator.share,originalStore:DB_NAME,cleanCopyGenerated:false,timerContinuesDuringRecording:true})});
})();