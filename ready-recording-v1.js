(() => {
  'use strict';
  if (window.ReadyRecordingV1) return;

  const VERSION='2026.09.19-recording-v4-realtime-m4a-clean';
  const DB_NAME='readyset_audio',STORE_NAME='audio';
  const $=s=>document.querySelector(s);
  let mediaRecorder=null,originalRecorder=null,mediaStream=null,audioCtx=null,processedDestination=null,chunks=[],originalChunks=[],currentAudio=null,currentFile=null,currentOriginalFile=null,currentStored=false,currentOriginalId=null,currentCleanId=null,transferBaseName='',originalCaptureMode='DIRECT',realtimeFilterMode='WEB_AUDIO',recordStartedAt=0,recordTicker=null,contextTicker=null;

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

  function stopStream(){mediaStream?.getTracks?.().forEach(track=>track.stop());mediaStream=null;processedDestination=null;if(audioCtx){try{audioCtx.close?.()}catch{}audioCtx=null}}
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
  function recordingPrefix(){try{return String(localStorage.getItem('ready_recording_prefix')||"Judy's grammar recording").trim()||"Judy's grammar recording"}catch{return "Judy's grammar recording"}}
  function recordingDate(d=new Date()){return `${d.getFullYear()} ${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')}`}
  function defaultTransferBase(){return `${recordingPrefix()} ${recordingDate()}`}
  function sanitizeFileBase(value){return String(value||'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,' ').replace(/\.(m4a|mp4|webm|ogg|wav)$/i,'').replace(/\s+/g,' ').trim().slice(0,120)||defaultTransferBase()}
  function makeNamedFile(blob,base,{original=false}={}){
    const info=mimeInfo(blob?.type),cleanBase=sanitizeFileBase(base),name=`${cleanBase}${original?' original':''}.${info.ext}`;
    return new File([blob],name,{type:info.type,lastModified:Date.now()});
  }
  function transferFile(){
    if(!currentAudio||!currentFile)return null;
    const base=sanitizeFileBase(transferBaseName||defaultTransferBase());
    return makeNamedFile(currentAudio,base,{original:false});
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE_NAME))req.result.createObjectStore(STORE_NAME,{keyPath:'id'})};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function storeOriginal(file){
    const db=await openDb(),id=`original_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,'readwrite');
      tx.objectStore(STORE_NAME).put({id,kind:'ORIGINAL',originalMeaning:'FIRST_ENCODED_BROWSER_CAPTURE',captureMode:originalCaptureMode,captureProcessing:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},name:file.name,type:file.type,size:file.size,blob:file,createdAt:Date.now(),sessionId:activeContract()?.session_id||null,taskId:activeTask()?.task_id||null});
      tx.oncomplete=()=>{db.close();resolve(id)};tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }
  async function storeClean(file,sourceOriginalId){
    const db=await openDb(),id=`clean_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,'readwrite');
      tx.objectStore(STORE_NAME).put({id,kind:'CLEAN',sourceOriginalId:sourceOriginalId||null,pipeline:'REALTIME_LOCAL_FILTER_V1',processing:{cloud:false,paidApi:false,echoCancellation:true,noiseSuppression:true,autoGainControl:true,highPassHz:80,lowPassHz:12000,mildCompression:true,sameContainerAsTransfer:true},name:file.name,type:file.type,size:file.size,blob:file,createdAt:Date.now(),sessionId:activeContract()?.session_id||null,taskId:activeTask()?.task_id||null});
      tx.oncomplete=()=>{db.close();resolve(id)};tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }

  function preferredMime(){
    const candidates=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm'];
    return candidates.find(m=>MediaRecorder.isTypeSupported?.(m))||'';
  }
  function buildProcessedStream(stream){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){realtimeFilterMode='BROWSER_DSP_ONLY';return stream}
    try{
      audioCtx=new Ctx();
      const src=audioCtx.createMediaStreamSource(stream),hp=audioCtx.createBiquadFilter(),lp=audioCtx.createBiquadFilter(),comp=audioCtx.createDynamicsCompressor(),dest=audioCtx.createMediaStreamDestination();
      hp.type='highpass';hp.frequency.value=80;hp.Q.value=.65;
      lp.type='lowpass';lp.frequency.value=Math.min(12000,(audioCtx.sampleRate||48000)*.45);lp.Q.value=.55;
      comp.threshold.value=-18;comp.knee.value=14;comp.ratio.value=2.2;comp.attack.value=.008;comp.release.value=.18;
      src.connect(hp).connect(lp).connect(comp).connect(dest);
      processedDestination=dest;realtimeFilterMode='WEB_AUDIO';
      audioCtx.resume?.();
      return dest.stream;
    }catch{realtimeFilterMode='BROWSER_DSP_ONLY';return stream}
  }
  function makeRecorder(stream,mime){
    try{return new MediaRecorder(stream,mime?{mimeType:mime}:undefined)}
    catch{try{return new MediaRecorder(stream)}catch{return null}}
  }
  function ensureFilenameEditor(){
    const panel=$('#reviewPanel');if(!panel||!currentFile)return;
    let wrap=$('#recordFilenameWrap');
    if(!wrap){
      wrap=document.createElement('label');wrap.id='recordFilenameWrap';wrap.className='recordFilenameWrap';
      wrap.innerHTML='<span>전송 파일명</span><div><input id="recordFilenameInput" type="text" maxlength="120" autocomplete="off" spellcheck="false"><b id="recordFilenameExt"></b></div>';
      const note=$('#formatNote');panel.insertBefore(wrap,note||null);
      const input=wrap.querySelector('#recordFilenameInput');
      input.addEventListener('input',()=>{transferBaseName=sanitizeFileBase(input.value);updateFormatNote()});
      input.addEventListener('change',()=>{input.value=sanitizeFileBase(input.value);transferBaseName=input.value;updateFormatNote()});
    }
    const input=$('#recordFilenameInput'),ext=$('#recordFilenameExt'),info=mimeInfo(currentFile.type);
    if(input&&document.activeElement!==input)input.value=sanitizeFileBase(transferBaseName||defaultTransferBase());
    if(ext)ext.textContent='.'+info.ext;
  }
  function updateFormatNote(){
    const note=$('#formatNote');if(!note||!currentFile)return;
    const file=transferFile()||currentFile,info=mimeInfo(file.type),format=info.ext==='m4a'?'M4A/AAC':`실제 포맷 ${info.ext.toUpperCase()}`;
    note.textContent=`전송 파일 · ${file.name} · ${format} · ${Math.max(1,Math.round(file.size/1024))}KB`;
    ensureFilenameEditor();
  }

  function ensureRecordingSettings(){
    const settings=$('#settingsView .scroll');if(!settings)return;
    let card=$('#recordingFilenameSettings');
    if(!card){
      card=document.createElement('section');card.id='recordingFilenameSettings';card.className='glassCard';
      card.innerHTML='<h2>녹음 파일</h2><label class="inputBlock">기본 파일명<input id="recordingPrefixInput" maxlength="80" autocomplete="off" spellcheck="false"></label><small class="muted">전송 전에도 파일명을 다시 수정할 수 있어요. 날짜는 자동으로 붙고, 확장자는 M4A/AAC를 우선 사용해요.</small>';
      const data=[...settings.querySelectorAll('.glassCard')].find(x=>x.querySelector('h2')?.textContent==='데이터');
      settings.insertBefore(card,data||null);
      const input=card.querySelector('#recordingPrefixInput');
      input.addEventListener('change',()=>{const value=sanitizeFileBase(input.value).replace(/\s+\d{4}\s+\d{2}\s+\d{2}$/,'').trim();try{localStorage.setItem('ready_recording_prefix',value||"Judy's grammar recording")}catch{}input.value=recordingPrefix()});
    }
    const input=$('#recordingPrefixInput');if(input&&document.activeElement!==input)input.value=recordingPrefix();
  }

  function ensureReviewActions(){
    const panel=$('#reviewPanel');if(!panel)return;['#duoMainGuide','#duoGuestGuide','#duoText','#coachVoiceBtn'].forEach(sel=>{const el=$(sel);if(el)el.hidden=true});
    let share=$('#shareRecordingBtn');
    if(!share){share=document.createElement('button');share.id='shareRecordingBtn';share.type='button';share.textContent='녹음 파일 전송';panel.appendChild(share)}
    const save=$('#saveRecordingBtn'),retry=$('#rerecordBtn');
    if(save){save.textContent=currentStored?'녹음 확인':'원본 저장';save.className='btn dark'}if(retry){retry.textContent='다시 녹음';retry.className='btn outline'}share.textContent=currentFile&&mimeInfo(currentFile.type).ext==='m4a'?'M4A 파일 전송':'녹음 파일 전송';share.className='btn outline';ensureFilenameEditor();
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
    stopTicker();stopStream();chunks=[];mediaRecorder=null;originalRecorder=null;originalCaptureMode='DIRECT';realtimeFilterMode='WEB_AUDIO';
    if(!keepPreview){currentAudio=null;currentFile=null;currentOriginalFile=null;currentStored=false;currentOriginalId=null;currentCleanId=null;transferBaseName='';originalChunks=[];const preview=$('#audioPreview');if(preview){if(preview.src)URL.revokeObjectURL(preview.src);preview.removeAttribute('src')}if($('#reviewPanel'))$('#reviewPanel').hidden=true}
    if($('#recordClock'))$('#recordClock').textContent='00:00';
    if($('#recordState'))$('#recordState').textContent='READY';
    setRecordButton('녹음 시작',false)
  }

  async function finishRecording(){
    stopTicker();
    const cleanType=mediaRecorder?.mimeType||chunks[0]?.type||'audio/mp4',originalType=originalRecorder?.mimeType||originalChunks[0]?.type||cleanType;
    const cleanBlob=new Blob(chunks,{type:cleanType}),originalBlob=new Blob(originalChunks.length?originalChunks:chunks,{type:originalType});
    transferBaseName=defaultTransferBase();
    currentAudio=cleanBlob;currentFile=makeNamedFile(cleanBlob,transferBaseName);currentOriginalFile=makeNamedFile(originalBlob,transferBaseName,{original:true});currentStored=false;
    const preview=$('#audioPreview');
    if(preview){if(preview.src)URL.revokeObjectURL(preview.src);preview.src=URL.createObjectURL(currentAudio)}
    let storeError=false;
    try{
      currentOriginalId=await storeOriginal(currentOriginalFile);currentStored=true;
      currentCleanId=await storeClean(currentFile,currentOriginalId);
    }catch{storeError=true}
    stopStream();
    if($('#reviewPanel'))$('#reviewPanel').hidden=false;
    if($('#recordState'))$('#recordState').textContent='REVIEW';
    setRecordButton('녹음 시작',false);
    ensureReviewActions();updateFormatNote();
    toast(storeError?'녹음 자동 보관에 실패했어요. 파일은 전송할 수 있어요.':'원본과 전송용 녹음을 각각 보관했어요.');
  }

  async function startRecording(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('이 브라우저는 마이크 녹음을 지원하지 않습니다.');return}
    stopBgm();
    try{
      mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const mime=preferredMime(),processedStream=buildProcessedStream(mediaStream);
      chunks=[];originalChunks=[];
      mediaRecorder=makeRecorder(processedStream,mime);
      if(!mediaRecorder){realtimeFilterMode='BROWSER_DSP_ONLY';mediaRecorder=makeRecorder(mediaStream,mime)}
      if(!mediaRecorder)throw new Error('MEDIA_RECORDER_CREATE_FAILED');
      originalRecorder=makeRecorder(mediaStream,mime);if(!originalRecorder)originalCaptureMode='FALLBACK_TRANSFER'
      let cleanStopped=false,originalStopped=!originalRecorder,finished=false;
      const maybeFinish=()=>{if(!finished&&cleanStopped&&originalStopped){finished=true;finishRecording()}};
      mediaRecorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
      mediaRecorder.onstop=()=>{cleanStopped=true;maybeFinish()};
      mediaRecorder.onerror=()=>{stopTicker();stopStream();toast('녹음 중 문제가 생겼어요. 다시 녹음해 주세요.')};
      if(originalRecorder){
        originalRecorder.ondataavailable=e=>{if(e.data?.size)originalChunks.push(e.data)};
        originalRecorder.onstop=()=>{originalStopped=true;maybeFinish()};
        originalRecorder.onerror=()=>{originalCaptureMode='FALLBACK_TRANSFER';originalStopped=true;maybeFinish()};
      }
      mediaRecorder.start(250);
      if(originalRecorder){try{originalRecorder.start(250)}catch{originalRecorder=null;originalCaptureMode='FALLBACK_TRANSFER';originalStopped=true}}
      recordStartedAt=Date.now();
      if($('#recordState'))$('#recordState').textContent='RECORDING';
      setRecordButton('녹음 끝내기',true)
      recordTicker=setInterval(()=>{if($('#recordClock'))$('#recordClock').textContent=fmt(Date.now()-recordStartedAt);renderContext()},250);
    }catch(error){stopStream();toast(error?.name==='NotAllowedError'?'마이크 권한이 필요합니다.':'녹음을 시작할 수 없습니다.')}
  }

  async function saveRecording(){
    if(!currentAudio||!currentFile){toast('먼저 녹음을 완료해 주세요.');return}
    try{if(!currentStored&&currentOriginalFile){currentOriginalId=await storeOriginal(currentOriginalFile);currentStored=true}markRecordingCompleted();toast(`녹음 확인 완료 · ${(transferFile()||currentFile).name}`)}
    catch{toast('녹음 원본을 저장하지 못했습니다.')}
  }

  async function shareRecording(){
    if(!currentFile){toast('먼저 녹음을 완료해 주세요.');return}
    try{
      const file=transferFile()||currentFile,info=mimeInfo(file.type),label=info.ext==='m4a'?'M4A/AAC':'실제 '+info.ext.toUpperCase()+' 포맷';
      if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:'Ready & Set 녹음',text:`${activeLabel()||'영어 녹음'} · ${label}`,files:[file]});return}
      const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`${label} 녹음 파일을 기기에 저장했어요.`);
    }catch(error){if(error?.name!=='AbortError')toast('파일 전송을 시작하지 못했습니다.')}
  }

  function openRecording(){
    if(!taskNeedsRecording())return;
    stopBgm();resetRecording();window.ReadyBaseRuntimeV1?.nav?.('recording');startContextTicker();
  }
  function returnToFocus(){
    if(mediaRecorder?.state==='recording'||originalRecorder?.state==='recording'){toast('녹음을 먼저 끝내주세요.');return false}
    stopContextTicker();resetRecording();window.ReadyBaseRuntimeV1?.nav?.('focus');resumeBgm();setTimeout(render,0);return true;
  }

  function bind(){
    const rec=$('#recBtn');if(rec&&!rec.dataset.recordingBound){rec.dataset.recordingBound='1';rec.addEventListener('click',openRecording)}
    const action=$('#recordAction');if(action&&!action.dataset.recordingBound){action.dataset.recordingBound='1';action.addEventListener('click',()=>{if(mediaRecorder?.state==='recording'){mediaRecorder.stop();if(originalRecorder?.state==='recording')originalRecorder.stop()}else startRecording()})}
    const save=$('#saveRecordingBtn');if(save&&!save.dataset.recordingBound){save.dataset.recordingBound='1';save.addEventListener('click',saveRecording)}
    const retry=$('#rerecordBtn');if(retry&&!retry.dataset.recordingBound){retry.dataset.recordingBound='1';retry.addEventListener('click',()=>resetRecording())}
    const back=$('#recordBackBtn');if(back&&!back.dataset.recordingBound){back.dataset.recordingBound='1';back.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();returnToFocus()},true)}
    renderContext();renderRecState()
  }
  function render(){ensureRecordingLayout();ensureRecordingSettings();bind();renderRecState();if($('#recordingView')?.classList.contains('active')){stopBgm();if(!contextTicker)startContextTicker()}else stopContextTicker()}

  window.addEventListener('pageshow',()=>setTimeout(render,0));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(render,0)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.ReadyRecordingV1=Object.freeze({version:VERSION,render,open:openRecording,save:saveRecording,share:shareRecording,validate:()=>({version:VERSION,recordingRequired:taskNeedsRecording(),recVisible:$('#recBtn')?.hidden===false,mediaRecorderSupported:!!window.MediaRecorder,fileShareSupported:!!navigator.share,originalStore:DB_NAME,originalMeaning:'FIRST_ENCODED_BROWSER_CAPTURE',browserCaptureDsp:true,realtimeClean:true,cleanPipeline:'REALTIME_LOCAL_FILTER_V1',originalAndTransferSameContainer:true,transferM4aFirst:true,editableTransferFilename:true,persistentFilenamePrefix:true,originalCaptureFallback:true,realtimeFilterFallback:true,filterMode:realtimeFilterMode,transferHasNoCleanSuffix:true,cloudProcessing:false,paidApi:false,timerContinuesDuringRecording:true})});
})();