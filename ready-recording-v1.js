(() => {
  'use strict';
  if (window.ReadyRecordingV1) return;

  const VERSION='2026.09.19-recording-v3-m4a-transfer';
  const DB_NAME='readyset_audio',STORE_NAME='audio';
  const $=s=>document.querySelector(s);
  let mediaRecorder=null,mediaStream=null,chunks=[],currentAudio=null,currentFile=null,currentStored=false,currentOriginalId=null,currentCleanFile=null,cleanState='IDLE',cleanPromise=null,recordGeneration=0,recordStartedAt=0,recordTicker=null,contextTicker=null;

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
  function recordingPrefix(){try{return String(localStorage.getItem('ready_recording_prefix')||"Judy's grammar recording").trim()||"Judy's grammar recording"}catch{return "Judy's grammar recording"}}
  function recordingDate(d=new Date()){return `${d.getFullYear()} ${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')}`}
  function makeFile(blob){
    const info=mimeInfo(blob?.type),name=`${recordingPrefix()} ${recordingDate()}.${info.ext}`;
    return new File([blob],name,{type:info.type,lastModified:Date.now()});
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
      tx.objectStore(STORE_NAME).put({id,kind:'ORIGINAL',originalMeaning:'FIRST_ENCODED_BROWSER_CAPTURE',captureProcessing:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},name:file.name,type:file.type,size:file.size,blob:file,createdAt:Date.now(),sessionId:activeContract()?.session_id||null,taskId:activeTask()?.task_id||null});
      tx.oncomplete=()=>{db.close();resolve(id)};tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }
  async function storeClean(file,sourceOriginalId){
    const db=await openDb(),id=`clean_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,'readwrite');
      tx.objectStore(STORE_NAME).put({id,kind:'CLEAN',sourceOriginalId:sourceOriginalId||null,pipeline:'LOCAL_FAST_V1',processing:{cloud:false,paidApi:false,highPassHz:80,lowPassHz:12000,adaptiveGate:true,mildCompression:true,peakNormalize:true,mono:true,format:'PCM16_WAV'},name:file.name,type:file.type,size:file.size,blob:file,createdAt:Date.now(),sessionId:activeContract()?.session_id||null,taskId:activeTask()?.task_id||null});
      tx.oncomplete=()=>{db.close();resolve(id)};tx.onerror=()=>{db.close();reject(tx.error)};
    });
  }

  function encodePcm16Wav(samples,sampleRate){
    const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
    const write=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};
    write(0,'RIFF');view.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,samples.length*2,true);
    let offset=44;for(let i=0;i<samples.length;i++,offset+=2){const s=Math.max(-1,Math.min(1,samples[i]));view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true)}
    return new Blob([buffer],{type:'audio/wav'});
  }

  function cleanVoiceSamples(audioBuffer){
    const rate=audioBuffer.sampleRate,length=audioBuffer.length,channels=Math.max(1,audioBuffer.numberOfChannels),mono=new Float32Array(length);
    for(let ch=0;ch<channels;ch++){const src=audioBuffer.getChannelData(ch);for(let i=0;i<length;i++)mono[i]+=src[i]/channels}
    const high=new Float32Array(length),hpRc=1/(2*Math.PI*80),dt=1/rate,hpA=hpRc/(hpRc+dt);
    let px=0,py=0;for(let i=0;i<length;i++){const x=mono[i],y=hpA*(py+x-px);high[i]=y;px=x;py=y}
    const cutoff=Math.min(12000,rate*.45),lpRc=1/(2*Math.PI*cutoff),lpA=dt/(lpRc+dt),band=new Float32Array(length);
    let low=0;for(let i=0;i<length;i++){low+=lpA*(high[i]-low);band[i]=low}
    const frame=Math.max(64,Math.floor(rate*.02)),rms=[];
    for(let s=0;s<length;s+=frame){let sum=0,n=Math.min(frame,length-s);for(let i=0;i<n;i++){const v=band[s+i];sum+=v*v}rms.push(Math.sqrt(sum/Math.max(1,n)))}
    const sorted=[...rms].sort((a,b)=>a-b),noise=sorted[Math.floor(sorted.length*.2)]||0,gate=Math.max(.0018,noise*1.55),out=new Float32Array(length);
    let smoothGain=1,peak=0;
    for(let f=0,s=0;s<length;f++,s+=frame){
      const desired=((rms[f]||0)<gate)?0.35:1,step=(desired-smoothGain)/(Math.min(frame,length-s)||1);
      for(let i=s;i<Math.min(length,s+frame);i++){
        smoothGain+=step;let v=band[i]*smoothGain,a=Math.abs(v);
        if(a>.28)v=Math.sign(v)*(.28+(a-.28)/3);
        out[i]=v;peak=Math.max(peak,Math.abs(v));
      }
    }
    const normalize=peak>0?Math.min(1.5,.88/peak):1,fade=Math.min(Math.floor(rate*.006),Math.floor(length/2));
    for(let i=0;i<length;i++){let g=normalize;if(i<fade)g*=i/Math.max(1,fade);if(i>=length-fade)g*=(length-1-i)/Math.max(1,fade);out[i]*=Math.max(0,g)}
    return out;
  }

  async function makeCleanCopy(blob,sourceFile){
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('AUDIO_CONTEXT_UNAVAILABLE');
    const ctx=new Ctx();
    try{
      const data=await blob.arrayBuffer(),decoded=await ctx.decodeAudioData(data.slice(0)),clean=cleanVoiceSamples(decoded),wav=encodePcm16Wav(clean,decoded.sampleRate);
      const base=String(sourceFile?.name||'Ready-Set_recording').replace(/\.[^.]+$/,'');
      return new File([wav],`${base}_clean.wav`,{type:'audio/wav',lastModified:Date.now()});
    }finally{try{await ctx.close?.()}catch{}}
  }

  function updateFormatNote(){
    const note=$('#formatNote');if(!note||!currentFile)return;
    const info=mimeInfo(currentFile.type),format=info.ext==='m4a'?'M4A/AAC':`실제 포맷 ${info.ext.toUpperCase()}`;
    const base=`전송 파일 · ${currentFile.name} · ${format} · ${Math.max(1,Math.round(currentFile.size/1024))}KB`;
    note.textContent=cleanState==='PROCESSING'?`${base} · 내부 CLEAN 처리 중`:cleanState==='READY'?`${base} · 내부 CLEAN 보관 완료`:cleanState==='FALLBACK'?`${base} · 내부 CLEAN 생략`:base;
  }

  function startLocalClean(blob,sourceFile,sourceOriginalId,generation){
    cleanState='PROCESSING';currentCleanFile=null;updateFormatNote();
    const promise=(async()=>{
      try{
        const file=await makeCleanCopy(blob,sourceFile);await storeClean(file,sourceOriginalId);
        if(generation===recordGeneration){currentCleanFile=file;cleanState='READY';updateFormatNote();ensureReviewActions()}
        return file;
      }catch(error){
        if(generation===recordGeneration){cleanState='FALLBACK';updateFormatNote();ensureReviewActions()}
        return null;
      }
    })();
    if(generation===recordGeneration)cleanPromise=promise;
    return promise;
  }

  function ensureReviewActions(){
    const panel=$('#reviewPanel');if(!panel)return;['#duoMainGuide','#duoGuestGuide','#duoText','#coachVoiceBtn'].forEach(sel=>{const el=$(sel);if(el)el.hidden=true});
    let share=$('#shareRecordingBtn');
    if(!share){share=document.createElement('button');share.id='shareRecordingBtn';share.type='button';share.textContent='녹음 파일 전송';panel.appendChild(share)}
    const save=$('#saveRecordingBtn'),retry=$('#rerecordBtn');
    if(save){save.textContent=currentStored?'녹음 확인':'원본 저장';save.className='btn dark'}if(retry){retry.textContent='다시 녹음';retry.className='btn outline'}share.textContent=currentFile&&mimeInfo(currentFile.type).ext==='m4a'?'M4A 파일 전송':'녹음 파일 전송';share.className='btn outline';
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
    if(!keepPreview){recordGeneration++;currentAudio=null;currentFile=null;currentStored=false;currentOriginalId=null;currentCleanFile=null;cleanState='IDLE';cleanPromise=null;const preview=$('#audioPreview');if(preview){if(preview.src)URL.revokeObjectURL(preview.src);preview.removeAttribute('src')}if($('#reviewPanel'))$('#reviewPanel').hidden=true}
    if($('#recordClock'))$('#recordClock').textContent='00:00';
    if($('#recordState'))$('#recordState').textContent='READY';
    setRecordButton('녹음 시작',false)
  }

  async function finishRecording(){
    stopTicker();stopStream();
    const generation=recordGeneration,type=mediaRecorder?.mimeType||chunks[0]?.type||'audio/webm';
    currentAudio=new Blob(chunks,{type});currentFile=makeFile(currentAudio);currentStored=false;currentCleanFile=null;cleanState='IDLE';cleanPromise=null;
    const preview=$('#audioPreview');
    if(preview){if(preview.src)URL.revokeObjectURL(preview.src);preview.src=URL.createObjectURL(currentAudio)}
    let storeError=false;
    try{currentOriginalId=await storeOriginal(currentFile);currentStored=true}catch{storeError=true}
    if($('#reviewPanel'))$('#reviewPanel').hidden=false;
    if($('#recordState'))$('#recordState').textContent='REVIEW';
    setRecordButton('녹음 시작',false);
    ensureReviewActions();
    if(!storeError)startLocalClean(currentAudio,currentFile,currentOriginalId,generation);
    else{cleanState='FALLBACK';updateFormatNote()}
    toast(storeError?'원본 자동 보관에 실패했어요. 저장 버튼으로 다시 시도해 주세요.':'원본 보관 완료 · 전송용 음성을 기기에서 최적화해요.');
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
      const file=currentFile,info=mimeInfo(file.type),label=info.ext==='m4a'?'M4A/AAC':'실제 '+info.ext.toUpperCase()+' 포맷';
      if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:'Ready & Set 녹음',text:`${activeLabel()||'영어 녹음'} · ${label}`,files:[file]});return}
      const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`${label} 녹음 파일을 기기에 저장했어요.`);
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
  window.ReadyRecordingV1=Object.freeze({version:VERSION,render,open:openRecording,save:saveRecording,share:shareRecording,validate:()=>({version:VERSION,recordingRequired:taskNeedsRecording(),recVisible:$('#recBtn')?.hidden===false,mediaRecorderSupported:!!window.MediaRecorder,fileShareSupported:!!navigator.share,originalStore:DB_NAME,originalMeaning:'FIRST_ENCODED_BROWSER_CAPTURE',browserCaptureDsp:true,cleanState,cleanCopyGenerated:cleanState==='READY',cleanPipeline:'LOCAL_FAST_V1',cleanInternalOnly:true,transferM4aFirst:true,transferUsesOriginalCapture:true,cloudProcessing:false,paidApi:false,timerContinuesDuringRecording:true})});
})();