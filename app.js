
const VERSION={app:'0.9.2',master:'REV_06',schema:5,cache:'ready-set-v092'};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const categories={
  재능:['국어','한자','피자','수학','연산','기타'],
  학교:['독서','글쓰기','숙제','준비물','기타'],
  영어:['라이팅','문장 녹음','단어 외우기','기타']
};

const GUIDE_TYPES={
  lumi:{defaultName:'루미',personality:'포근하고 위트 있는 길잡이',home:'오늘 작전, 내가 옆에서 같이 봐줄게.',intro:'오늘도 천천히 시작해보자. 준비되면 바로 들어가자!'},
  pico:{defaultName:'피코',personality:'밝고 장난기 있는 길잡이',home:'준비 끝? 그럼 오늘 시계가 조금 긴장하겠는데?',intro:'좋아! 오늘도 가볍게 시작해서 끝까지 가보자!'},
  mori:{defaultName:'모리',personality:'차분하고 든든한 길잡이',home:'서두르지 않아도 괜찮아. 정한 만큼 같이 가보자.',intro:'호흡 한번 정리하고, 네 속도로 시작해보자.'}
};

const SOUND_MAP={
  '집중 피아노':'./assets/bgm-piano.wav',
  '자연 숲':'./assets/bgm-nature.wav',
  '잔잔한 물결':'./assets/bgm-water.wav',
  '로파이':'./assets/bgm-lofi.wav',
  'OFF':''
};

const initial={
  schemaVersion:5,
  profile:{name:'',photo:'',style:'editorial',shareAvatar:false},
  guide:{type:'lumi',name:'루미',voice:'warm'},
  guestHistory:[],
  selected:[],
  tasks:[],
  targetMin:25,
  sound:'집중 피아노',
  records:[],
  activeSession:null,
  recordingMeta:null
};

let state=load();
let mediaRecorder=null,mediaStream=null,chunks=[],recordStartedAt=0,recordTicker=null,currentAudio=null;
let previewTimer=null,currentGuestType='pico';

function load(){
  try{
    const x=JSON.parse(localStorage.getItem('readyset_state')||'null');
    if(!x)return structuredClone(initial);
    return migrate(x);
  }catch{return structuredClone(initial)}
}
function migrate(x){
  if(!x.schemaVersion)x.schemaVersion=1;
  x.profile=x.profile||{};
  x.guide=x.guide||{};
  if(x.schemaVersion<5){
    x.profile={name:x.profile.name||'',photo:x.profile.photo||'',style:x.profile.style||'editorial',shareAvatar:!!x.profile.shareAvatar};
    x.guide={type:x.guide.type||'lumi',name:x.guide.name||'루미',voice:x.guide.voice||'warm'};
    x.guestHistory=Array.isArray(x.guestHistory)?x.guestHistory:[];
    x.records=x.records||[];
    x.selected=x.selected||[];
    x.tasks=x.tasks||[];
    x.targetMin=x.targetMin||25;
    if(x.sound==='자연음')x.sound='자연 숲';
    x.sound=x.sound||'집중 피아노';
    x.schemaVersion=5;
  }
  return {
    ...structuredClone(initial),
    ...x,
    profile:{...initial.profile,...x.profile},
    guide:{...initial.guide,...x.guide}
  };
}
function save(){localStorage.setItem('readyset_state',JSON.stringify(state))}
function toast(msg){
  const t=$('#toast'); if(!t)return;
  t.textContent=msg;t.hidden=false;
  clearTimeout(t._tm);t._tm=setTimeout(()=>t.hidden=true,2400);
}
function nav(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));
  window.scrollTo(0,0);
  if(name==='home')renderHome();
  if(name==='mission')renderMission();
  if(name==='focus')renderFocus();
  if(name==='recording')renderRecordingContext();
  if(name==='history')renderHistory();
  if(name==='calendar')renderCalendar();
  if(name==='profile')renderProfile();
  if(name==='settings')renderSettings();
  if(name==='result')renderResult();
}
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));

function initials(){return (state.profile.name||'RS').trim().slice(0,2).toUpperCase()}
function styleFilter(s){
  return {
    editorial:'saturate(.95) contrast(1.03)',
    storybook:'saturate(.72) sepia(.14) brightness(1.06)',
    graphic:'saturate(1.2) contrast(1.12)',
    natural:'saturate(.86) contrast(.96) brightness(1.04)'
  }[s]||'none';
}
function applyAvatar(el){
  if(!el)return;
  if(state.profile.photo){
    el.textContent='';
    el.style.backgroundImage=`url(${state.profile.photo})`;
    el.style.backgroundSize='cover';
    el.style.backgroundPosition='center';
    el.style.filter=styleFilter(state.profile.style);
  }else{
    el.textContent=initials();
    el.style.backgroundImage='none';
    el.style.filter='none';
  }
}
function applyGuide(el,type=state.guide.type){
  if(!el)return;
  el.classList.remove('lumi','pico','mori','guest');
  el.classList.add('guidePortrait',type);
  el.setAttribute('data-guide',type);
}
function guideData(type=state.guide.type){return GUIDE_TYPES[type]||GUIDE_TYPES.lumi}

function renderHome(){
  applyAvatar($('#homeAvatar'));
  $('#heroTime').textContent=fmt(state.targetMin*60000);
  renderChips($('#homeChips'));
  applyGuide($('#homeGuidePortrait'));
  $('#homeGuideName').textContent=state.guide.name;
  $('#homeGuideLine').textContent=guideData().home;
}
function renderChips(root){
  if(!root)return;
  root.innerHTML='';
  state.selected.forEach(x=>{const s=document.createElement('span');s.textContent=x;root.appendChild(s)});
}

let sheetCategory='';
function openCategory(cat){
  sheetCategory=cat;
  $('#sheetTitle').textContent=`${cat} · 세부 과제 선택`;
  const root=$('#sheetOptions');root.innerHTML='';
  categories[cat].forEach(item=>{
    const key=`${cat} · ${item}`;
    const b=document.createElement('button');
    b.textContent=item;
    b.classList.toggle('on',state.selected.includes(key));
    b.onclick=()=>{
      state.selected.includes(key)
        ? state.selected=state.selected.filter(v=>v!==key)
        : state.selected.push(key);
      b.classList.toggle('on');
      save();renderMission();renderHome();
    };
    root.appendChild(b);
  });
  $('#categorySheet').hidden=false;
}
$$('[data-category]').forEach(b=>b.addEventListener('click',()=>openCategory(b.dataset.category)));
$$('[data-close-sheet]').forEach(b=>b.addEventListener('click',()=>$('#categorySheet').hidden=true));

function renderMission(){
  renderChips($('#missionChips'));
  const tl=$('#taskList');tl.innerHTML='';
  state.tasks.forEach((t,i)=>{
    const row=document.createElement('div');
    row.className='taskRow';
    row.innerHTML=`<span>${escapeHtml(t)}</span><button aria-label="삭제">×</button>`;
    row.querySelector('button').onclick=()=>{state.tasks.splice(i,1);save();renderMission()};
    tl.appendChild(row);
  });
  $$('[data-minutes]').forEach(b=>b.classList.toggle('on',String(state.targetMin)===b.dataset.minutes));
  $('#customMinutes').value=state.targetMin;
  $('#soundName').textContent=state.sound;
  const labels=[...state.selected,...state.tasks];
  $('#missionPreviewText').textContent=`${labels.length?labels.join(' · '):'과제를 선택해 주세요'} · ${state.targetMin}분`;
}
$('#addTaskBtn').onclick=()=>{
  const v=$('#taskInput').value.trim();
  if(!v)return;
  state.tasks.push(v);$('#taskInput').value='';
  save();renderMission();
};
let voiceRecognition=null;
$('#voiceTaskBtn').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$('#voiceHint').textContent='이 브라우저에서는 음성 입력을 지원하지 않아요. 텍스트로 입력해 주세요.';return}
  if(voiceRecognition){try{voiceRecognition.stop()}catch{};return}
  voiceRecognition=new SR();voiceRecognition.lang='ko-KR';voiceRecognition.interimResults=false;voiceRecognition.maxAlternatives=1;
  $('#voiceTaskBtn').classList.add('listening');$('#voiceHint').textContent='듣고 있어요… 과제를 말해 주세요.';
  voiceRecognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript?.trim();if(text){$('#taskInput').value=text;$('#voiceHint').textContent='음성 입력 완료. 확인 후 추가를 눌러주세요.'}};
  voiceRecognition.onerror=()=>{$('#voiceHint').textContent='음성 입력이 잘 되지 않았어요. 다시 누르거나 텍스트로 입력해 주세요.'};
  voiceRecognition.onend=()=>{$('#voiceTaskBtn').classList.remove('listening');voiceRecognition=null;if($('#voiceHint').textContent.startsWith('듣고'))$('#voiceHint').textContent='텍스트로 입력하거나 마이크를 눌러 말할 수 있어요.'};
  try{voiceRecognition.start()}catch{$('#voiceTaskBtn').classList.remove('listening');voiceRecognition=null}
};
$$('[data-minutes]').forEach(b=>b.onclick=()=>{
  if(b.dataset.minutes==='custom'){$('#customTimeWrap').hidden=false;return}
  $('#customTimeWrap').hidden=true;
  state.targetMin=+b.dataset.minutes;save();renderMission();
});
$('#customMinutes').onchange=e=>{
  state.targetMin=Math.max(1,Math.min(180,+e.target.value||25));
  save();renderMission();
};

function bgm(){
  return $('#bgmPlayer');
}
function setBgmSource(sound){
  const player=bgm(); if(!player)return;
  const src=SOUND_MAP[sound]||'';
  const resolved=src?new URL(src,location.href).href:'';
  if(player.src!==resolved){
    player.pause();
    if(src){player.src=src;player.load()}else{player.removeAttribute('src');player.load()}
  }
}
async function playBgm(sound=state.activeSession?.sound||state.sound,{preview=false}={}){
  const player=bgm(); if(!player)return false;
  if(sound==='OFF'){player.pause();updateBgmStatus();return true}
  setBgmSource(sound);
  player.volume=preview?.26:.34;
  try{
    await player.play();
    updateBgmStatus();
    return true;
  }catch{
    updateBgmStatus('재생하려면 음악 버튼을 한 번 눌러주세요');
    return false;
  }
}
async function fadeAudio(target=0,duration=260){
  const p=bgm();if(!p)return;
  const from=Number.isFinite(p.volume)?p.volume:.34;
  const steps=8,delay=Math.max(20,Math.floor(duration/steps));
  for(let i=1;i<=steps;i++){p.volume=from+(target-from)*(i/steps);await new Promise(r=>setTimeout(r,delay))}
  p.volume=target;
}
async function pauseBgm({fade=true}={}){const p=bgm();if(!p)return;if(fade&&!p.paused)await fadeAudio(0,220);p.pause();p.volume=.34;updateBgmStatus()}
async function resumeBgm(sound=state.activeSession?.sound||state.sound){
  const p=bgm();if(!p||sound==='OFF')return false;setBgmSource(sound);p.volume=.05;
  try{await p.play();await fadeAudio(.34,260);updateBgmStatus();return true}catch{updateBgmStatus('재생하려면 음악 버튼을 한 번 눌러주세요');return false}
}
function updateBgmStatus(custom=''){
  const el=$('#bgmStatus');if(!el)return;
  const s=state.activeSession;
  if(!s){el.textContent=custom||`${state.sound}`;return}
  if(s.pausedAt){el.textContent='타이머 멈춤 · BGM 일시정지';return}
  if(s.sound==='OFF'){el.textContent='BGM OFF';return}
  if(custom){el.textContent=custom;return}
  el.textContent=`${s.sound} · ${bgm()?.paused?'일시정지':'재생 중'}`;
}
function openSound(){
  const sh=$('#soundSheet');sh.hidden=false;
  $$('[data-sheet-sound]').forEach(b=>b.classList.toggle('on',b.dataset.sheetSound===state.sound));
}
$('#soundBtn').onclick=openSound;
$('#focusSoundBtn').onclick=openSound;
$('#changeBgm').onclick=openSound;
$$('[data-close-sound]').forEach(b=>b.onclick=()=>{
  $('#soundSheet').hidden=true;
  if(!state.activeSession)pauseBgm();
});
$$('[data-sheet-sound]').forEach(b=>b.onclick=async()=>{
  const sound=b.dataset.sheetSound;
  state.sound=sound;
  if(state.activeSession)state.activeSession.sound=sound;
  save();
  $$('[data-sheet-sound]').forEach(x=>x.classList.toggle('on',x===b));
  $('#soundName').textContent=sound;
  renderSettings();
  if(sound==='OFF')pauseBgm();
  else{
    clearTimeout(previewTimer);
    await playBgm(sound,{preview:!state.activeSession});
    if(!state.activeSession)previewTimer=setTimeout(()=>pauseBgm(),5000);
  }
  renderFocus();
});

$('#startBtn').onclick=async()=>{
  if(!state.selected.length&&!state.tasks.length){toast('먼저 오늘의 과제를 선택해 주세요.');return}
  const now=Date.now();
  state.activeSession={
    id:`s_${now}`,startAt:now,targetMs:state.targetMin*60000,
    pausedAt:null,issueMs:0,completed:false,
    selected:[...state.selected],tasks:[...state.tasks],
    sound:state.sound,recordingDone:false
  };
  save();
  nav('focus');
  if(state.sound!=='OFF')await resumeBgm(state.sound);
};

function sessionTimes(){
  const s=state.activeSession;
  if(!s)return{focus:0,issue:0,remaining:state.targetMin*60000};
  const now=s.completed?s.endAt:Date.now();
  const currentPause=s.pausedAt?now-s.pausedAt:0;
  const issue=(s.issueMs||0)+currentPause;
  const elapsed=Math.max(0,now-s.startAt);
  const focus=Math.max(0,elapsed-issue);
  return{focus,issue,remaining:s.targetMs-focus};
}
function fmt(ms){
  ms=Math.max(0,Math.floor(ms/1000));
  const m=Math.floor(ms/60),s=ms%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function renderFocus(){
  const s=state.activeSession;
  if(!s){if($('#focusView')?.classList.contains('active'))nav('mission');return}
  const labels=[...s.selected,...s.tasks];
  $('#focusMission').textContent=labels.join(' · ')||'오늘의 작전';
  $('#recBtn').hidden=!s.selected.includes('영어 · 문장 녹음');
  $('#targetTime').textContent=fmt(s.targetMs);
  $('#startClock').textContent=new Date(s.startAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});
  applyGuide($('#focusGuideMini'));
  updateBgmStatus();
  tickFocus();
}
function tickFocus(){
  const s=state.activeSession;if(!s)return;
  const t=sessionTimes();
  $('#remainingTime').textContent=t.remaining>=0?fmt(t.remaining):`+${fmt(-t.remaining)}`;
  $('#focusElapsed').textContent=fmt(t.focus);
  $('#issueElapsed').textContent=fmt(t.issue);
  $('#pauseBtn').textContent=s.pausedAt?'다시, 작전 속으로':'잠깐 멈춤';
  const d=new Date();
  $('#secondHand').style.transform=`rotate(${d.getSeconds()*6}deg)`;
  $('#minuteHand').style.transform=`rotate(${d.getMinutes()*6+d.getSeconds()*.1}deg)`;
  $('#hourHand').style.transform=`rotate(${((d.getHours()%12)*30)+d.getMinutes()*.5}deg)`;
  if(!s.completed&&$('#focusView').classList.contains('active'))requestAnimationFrame(tickFocus);
}
$('#pauseBtn').onclick=async()=>{
  const s=state.activeSession;if(!s)return;
  if(s.pausedAt){await resumePausedSession();return}
  s.pausedAt=Date.now();s.pauseReason='';await pauseBgm();save();renderFocus();$('#pauseSheet').hidden=false;
};
async function resumePausedSession(){
  const s=state.activeSession;if(!s||!s.pausedAt)return;
  s.issueMs+=(Date.now()-s.pausedAt);s.pausedAt=null;save();$('#pauseSheet').hidden=true;renderFocus();
  if(s.sound!=='OFF')await resumeBgm(s.sound);
}
$$('[data-pause-reason]').forEach(b=>b.onclick=()=>{
  const s=state.activeSession;if(!s)return;
  s.pauseReason=b.dataset.pauseReason;s.pauseEvents=s.pauseEvents||[];s.pauseEvents.push({reason:s.pauseReason,at:Date.now()});
  $$('[data-pause-reason]').forEach(x=>x.classList.toggle('on',x===b));save();
});
$$('[data-close-pause]').forEach(b=>b.onclick=()=>$('#pauseSheet').hidden=true);
$('#resumeFromSheetBtn').onclick=resumePausedSession;
$('#completeBtn').onclick=()=>completeSession();
function completeSession(){
  const s=state.activeSession;if(!s)return;
  pauseBgm();
  if(s.pausedAt){s.issueMs+=Date.now()-s.pausedAt;s.pausedAt=null}
  s.endAt=Date.now();s.completed=true;
  const t=sessionTimes();
  const rec={...s,focusMs:t.focus,issueMs:t.issue,deltaMs:t.focus-s.targetMs};
  state.records.unshift(rec);state.records=state.records.slice(0,200);
  state.activeSession=null;state.lastResult=rec;save();nav('result');
}

$('#recBtn').onclick=()=>{
  applyGuide($('#recIntroGuide'));
  $('#recIntro').hidden=false;
};
$('#cancelRecordBtn').onclick=()=>$('#recIntro').hidden=true;
$('#goRecordBtn').onclick=async()=>{
  $('#recIntro').hidden=true;
  await pauseBgm();
  nav('recording');
};
$('#recordBackBtn').onclick=async()=>{
  if(mediaRecorder?.state==='recording'){toast('녹음을 먼저 끝내주세요.');return}
  nav('focus');
  if(state.activeSession?.sound!=='OFF')await resumeBgm(state.activeSession.sound);
};

function renderRecordingContext(){
  const t=sessionTimes();
  $('#recordTimerContext').textContent=t.remaining>=0?fmt(t.remaining):`+${fmt(-t.remaining)}`;
  applyAvatar($('#recordAvatar'));
  applyGuide($('#recordGuidePortrait'));
  applyGuide($('#recIntroGuide'));
  $('#guideDialogue').textContent=`${state.guide.name}: ${guideData().intro}`;
}
$('#recordAction').onclick=async()=>{
  if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop();return}
  await startRecording();
};
async function startRecording(){
  await pauseBgm();
  if(!navigator.mediaDevices?.getUserMedia){toast('이 브라우저는 마이크 녹음을 지원하지 않습니다.');return}
  try{
    mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const candidates=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm'];
    const mime=candidates.find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported?.(m))||'';
    mediaRecorder=new MediaRecorder(mediaStream,mime?{mimeType:mime}:undefined);
    chunks=[];
    mediaRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    mediaRecorder.onstop=finishRecording;
    mediaRecorder.start(250);
    recordStartedAt=Date.now();
    $('#recordAction').classList.add('recording');
    $('#recordAction span').textContent='녹음 끝내기';
    $('#recordState').textContent='RECORDING';
    $('#waveform').classList.add('active');
    recordTicker=setInterval(()=>{
      $('#recordClock').textContent=fmt(Date.now()-recordStartedAt);
      renderRecordingContext();
    },250);
  }catch(e){
    toast(e.name==='NotAllowedError'?'마이크 권한이 필요합니다.':'녹음을 시작할 수 없습니다.');
  }
}
function chooseGuest(){
  const all=Object.keys(GUIDE_TYPES).filter(x=>x!==state.guide.type);
  const recent=new Set((state.guestHistory||[]).slice(-1));
  let pool=all.filter(x=>!recent.has(x));if(!pool.length)pool=all;
  currentGuestType=pool[Math.floor(Math.random()*pool.length)]||all[0]||'pico';
  state.guestHistory=[...(state.guestHistory||[]),currentGuestType].slice(-4);save();
}
function finishRecording(){
  clearInterval(recordTicker);
  mediaStream?.getTracks().forEach(t=>t.stop());
  $('#recordAction').classList.remove('recording');
  $('#recordAction span').textContent='녹음 시작';
  $('#recordState').textContent='REVIEW';
  $('#waveform').classList.remove('active');
  const type=mediaRecorder.mimeType||chunks[0]?.type||'audio/webm';
  currentAudio=new Blob(chunks,{type});
  $('#audioPreview').src=URL.createObjectURL(currentAudio);
  $('#reviewPanel').hidden=false;
  chooseGuest();
  applyGuide($('#duoMainGuide'),state.guide.type);
  applyGuide($('#duoGuestGuide'),currentGuestType);
  $('#guideDialogue').textContent='잠깐만. 같이 들어줄 친구 좀 잡아올게!';
  $('#duoText').textContent=`${state.guide.name}: 잡아왔다!  ·  ${GUIDE_TYPES[currentGuestType].defaultName}: 좋아, 끝까지 들어보자. 지금은 자동 평가보다 녹음을 끝까지 완료한 사실을 먼저 확인할게.`;
  const isM4A=/audio\/(mp4|m4a)/.test(type);
  $('#formatNote').textContent=isM4A
    ?'실제 MP4/M4A 계열 오디오로 저장할 수 있는 브라우저입니다.'
    :'이 브라우저의 원본 녹음 포맷은 WebM입니다. .m4a로 이름만 바꾸지 않으며, M4A 제출이 필요하면 별도 변환 계층이 필요합니다.';
  state.recordingMeta={mime:type,durationMs:Date.now()-recordStartedAt,guestType:currentGuestType};
  save();
}
$('#rerecordBtn').onclick=()=>{
  $('#reviewPanel').hidden=true;currentAudio=null;
  $('#recordClock').textContent='00:00';$('#recordState').textContent='READY';
  $('#guideDialogue').textContent=`${state.guide.name}: 좋아, 이번엔 네 속도로 다시 해보자.`;
};
$('#saveRecordingBtn').onclick=async()=>{
  if(!currentAudio)return;
  const type=currentAudio.type||'audio/webm';
  const ext=/audio\/(mp4|m4a)/.test(type)?'m4a':'webm';
  const d=new Date(),date=`${d.getFullYear()} ${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')}`;
  const base=(state.profile.name||'Judy').replace(/[\\/:*?"<>|]/g,'_');
  const filename=`${base}'s grammar recording ${date}.${ext}`;
  await storeAudio(currentAudio,filename,type);
  if(state.activeSession){state.activeSession.recordingDone=true;state.activeSession.guestType=currentGuestType;state.activeSession.recordingMime=type}
  save();toast(`저장 완료 · ${filename}`);
  setTimeout(async()=>{
    nav('focus');
    if(state.activeSession?.sound!=='OFF')await resumeBgm(state.activeSession.sound);
  },450);
};
function storeAudio(blob,name,type){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('readyset_audio',1);
    req.onupgradeneeded=()=>{
      if(!req.result.objectStoreNames.contains('audio'))req.result.createObjectStore('audio',{keyPath:'id'});
    };
    req.onerror=()=>reject(req.error);
    req.onsuccess=()=>{
      const tx=req.result.transaction('audio','readwrite');
      tx.objectStore('audio').put({id:`a_${Date.now()}`,name,type,blob,createdAt:Date.now()});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    };
  });
}

function resultSource(){return state.lastResult||state.records[0]||null}
function resultSceneFor(r){
  const delta=r.deltaMs;
  if(delta<=-120000)return{headline:'엣헴~! 오늘 좀 했습니다.',line:'잠깐… 시계보다 먼저 왔는데?',label:'TIME SAVE'};
  if(Math.abs(delta)<=60000)return{headline:'오? 계산대로인데?',line:'시계랑 거의 동시에 들어왔어요.',label:'차이'};
  if(delta>0)return{headline:'무사 귀환!',line:'헤헤… 조금 늦었습니다. 그래도 작전 완료!',label:'차이'};
  if(r.issueMs>120000)return{headline:'오늘은 사건이 좀 많았습니다.',line:'그래도 다시 돌아와서 끝냈네.',label:'차이'};
  return{headline:'작전 완료!',line:'오늘도 끝까지 잘 돌아왔어요.',label:'차이'};
}
function renderResult(){
  const r=resultSource();if(!r)return;
  applyAvatar($('#resultAvatar'));
  applyGuide($('#resultGuidePortrait'));
  const guest=$('#resultGuestPortrait');
  if(r.recordingDone&&r.guestType){guest.hidden=false;applyGuide(guest,r.guestType);guest.classList.add('guest')}else guest.hidden=true;
  const sc=resultSceneFor(r);
  $('#resultHeadline').textContent=sc.headline;
  $('#resultLine').textContent=sc.line;
  $('#resultTasks').textContent=[...r.selected,...r.tasks].join(' · ');
  $('#resultTarget').textContent=fmt(r.targetMs);
  $('#resultFocus').textContent=fmt(r.focusMs);
  $('#deltaLabel').textContent=sc.label;
  $('#resultDelta').textContent=fmt(Math.abs(r.deltaMs));
}
function renderHistory(){
  const root=$('#historyList');root.innerHTML='';
  if(!state.records.length){root.innerHTML='<div class="historyItem"><b>아직 기록이 없어요.</b><p>첫 타임어택을 완료하면 여기에 쌓입니다.</p></div>';return}
  state.records.forEach(r=>{
    const x=document.createElement('article');x.className='historyItem';
    x.innerHTML=`<header><b>${new Date(r.endAt).toLocaleDateString('ko-KR')}</b><small>${fmt(r.focusMs)} / ${fmt(r.targetMs)}</small></header><p>${escapeHtml([...r.selected,...r.tasks].join(' · '))}</p>`;
    root.appendChild(x);
  });
}
function renderCalendar(){
  const root=$('#calendarList');root.innerHTML='';
  state.records.slice(0,31).forEach(r=>{
    const x=document.createElement('article');x.className='historyItem';
    x.innerHTML=`<header><b>${new Date(r.endAt).toLocaleDateString('ko-KR')}</b><small>작전 완료</small></header><p>${escapeHtml([...r.selected,...r.tasks].join(' · '))}</p>`;
    root.appendChild(x);
  });
  if(!root.children.length)root.innerHTML='<div class="historyItem"><b>이번 달 작전 기록이 없어요.</b></div>';
}

function renderProfile(){
  const img=$('#profileImage'),ph=$('#profilePlaceholder');
  $('#profileName').value=state.profile.name;
  $('#shareAvatarOptIn').checked=!!state.profile.shareAvatar;
  if(state.profile.photo){
    img.src=state.profile.photo;img.hidden=false;ph.hidden=true;img.style.filter=styleFilter(state.profile.style);
  }else{
    img.hidden=true;ph.hidden=false;ph.textContent=initials();
  }
  $$('[data-style]').forEach(b=>b.classList.toggle('on',b.dataset.style===state.profile.style));
  document.documentElement.style.setProperty('--avatar-bg',state.profile.photo?`url(${state.profile.photo})`:'linear-gradient(145deg,#ffe7d6,#eaa789)');
}
function photoLoad(file){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{state.profile.photo=r.result;save();renderProfile()};
  r.readAsDataURL(file);
}
$('#cameraInput').onchange=e=>photoLoad(e.target.files[0]);
$('#galleryInput').onchange=e=>photoLoad(e.target.files[0]);
$$('[data-style]').forEach(b=>b.onclick=()=>{
  state.profile.style=b.dataset.style;save();renderProfile();
});
$('#saveProfileBtn').onclick=()=>{
  state.profile.name=$('#profileName').value.trim();
  state.profile.shareAvatar=$('#shareAvatarOptIn').checked;
  save();toast('프로필을 저장했어요.');renderHome();
};

function renderSettings(){
  $('#guideNameInput').value=state.guide.name;
  $('#guideNameLabel').textContent=state.guide.name;
  $('#guidePersonalityLabel').textContent=guideData().personality;
  applyGuide($('#settingsGuidePortrait'));
  $$('[data-guide-type]').forEach(b=>b.classList.toggle('on',b.dataset.guideType===state.guide.type));
  $$('[data-guide-voice]').forEach(b=>b.classList.toggle('on',b.dataset.guideVoice===state.guide.voice));
  renderNameSuggestions(false);
  $$('[data-sound]').forEach(b=>b.classList.toggle('on',b.dataset.sound===state.sound));
}
$('#guideNameInput').onchange=e=>{
  state.guide.name=e.target.value.trim()||guideData().defaultName;
  save();renderSettings();renderHome();
};
$$('[data-guide-type]').forEach(b=>b.onclick=()=>{
  const prevDefault=guideData().defaultName;
  const type=b.dataset.guideType;
  state.guide.type=type;
  if(!state.guide.name||state.guide.name===prevDefault)state.guide.name=guideData(type).defaultName;
  save();renderSettings();renderHome();toast(`${state.guide.name}와 함께할게요.`);
});
const GUIDE_NAME_POOL=['루미','피코','모리','토리','모모','아루','리프','피즈','코코','라온','누리','보리'];
function renderNameSuggestions(reroll=true){
  const root=$('#nameSuggestions');if(!root)return;if(!reroll&&root.children.length)return;
  const names=[guideData().defaultName,...GUIDE_NAME_POOL.filter(n=>n!==guideData().defaultName)].sort(()=>Math.random()-.5).slice(0,5);
  root.innerHTML='';names.forEach(n=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>{state.guide.name=n;save();renderSettings();renderHome()};root.appendChild(b)});
}
$('#recommendNameBtn').onclick=()=>renderNameSuggestions(true);
$$('[data-guide-voice]').forEach(b=>b.onclick=()=>{state.guide.voice=b.dataset.guideVoice;save();renderSettings();toast('길잡이 목소리를 바꿨어요.')});
function speakGuide(text){
  if(!('speechSynthesis'in window)){toast('이 브라우저에서는 음성 안내를 지원하지 않아요.');return false}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';
  const cfg={warm:{rate:.92,pitch:1.02},bright:{rate:1.04,pitch:1.12},calm:{rate:.86,pitch:.94},playful:{rate:1.08,pitch:1.18}}[state.guide.voice]||{rate:.95,pitch:1};u.rate=cfg.rate;u.pitch=cfg.pitch;u.volume=.92;speechSynthesis.speak(u);return true;
}
$('#voicePreviewBtn').onclick=()=>speakGuide(`${state.guide.name}야. 오늘 작전도 네 옆에서 같이 갈게.`);
$('#coachVoiceBtn').onclick=()=>speakGuide($('#duoText').textContent||'오늘 녹음을 끝까지 잘 마쳤어.');

$$('[data-sound]').forEach(b=>b.onclick=async()=>{
  state.sound=b.dataset.sound;
  if(state.activeSession)state.activeSession.sound=state.sound;
  save();renderSettings();renderMission();
  if(state.sound==='OFF')pauseBgm();
  else{
    clearTimeout(previewTimer);
    await playBgm(state.sound,{preview:!state.activeSession});
    if(!state.activeSession)previewTimer=setTimeout(()=>pauseBgm(),4000);
  }
});

function guidePalette(type){
  return {
    lumi:{a:'#6e927c',b:'#315d49',accent:'#f8d57a'},
    pico:{a:'#e59a73',b:'#9c5943',accent:'#f7e38d'},
    mori:{a:'#6e8791',b:'#355761',accent:'#cfe7df'}
  }[type]||{a:'#6e927c',b:'#315d49',accent:'#f8d57a'};
}
function drawGuide(ctx,cx,cy,r,type,expression='smile'){
  const p=guidePalette(type);
  const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);g.addColorStop(0,p.a);g.addColorStop(1,p.b);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.86)';
  ctx.beginPath();ctx.ellipse(cx,cy+r*.2,r*.56,r*.42,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#25211e';
  ctx.beginPath();ctx.arc(cx-r*.24,cy-r*.12,r*.07,0,Math.PI*2);ctx.arc(cx+r*.24,cy-r*.12,r*.07,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#2a241f';ctx.lineWidth=Math.max(3,r*.05);ctx.lineCap='round';ctx.beginPath();
  if(expression==='wow'){ctx.arc(cx,cy+r*.19,r*.12,0,Math.PI*2)}
  else{ctx.arc(cx,cy+r*.14,r*.24,.18*Math.PI,.82*Math.PI)}
  ctx.stroke();
  ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(cx+r*.63,cy-r*.55,r*.16,0,Math.PI*2);ctx.fill();
}
async function drawAvatar(ctx,cx,cy,r){
  if(state.profile.shareAvatar&&state.profile.photo){
    try{
      const img=await loadImage(state.profile.photo);
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
      const scale=Math.max(r*2/img.width,r*2/img.height);
      const w=img.width*scale,h=img.height*scale;
      ctx.filter=styleFilter(state.profile.style);
      ctx.drawImage(img,cx-w/2,cy-h/2,w,h);
      ctx.restore();ctx.filter='none';return;
    }catch{}
  }
  const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);g.addColorStop(0,'#f4c0a7');g.addColorStop(1,'#d98162');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff8f1';ctx.font=`900 ${Math.floor(r*.75)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(initials(),cx,cy+3);
}
function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
async function shareCard(kind='result'){
  const r=kind==='result'?resultSource():null;
  const c=document.createElement('canvas');c.width=1080;c.height=1350;
  const x=c.getContext('2d');
  const grad=x.createLinearGradient(0,0,0,1350);grad.addColorStop(0,'#f7b297');grad.addColorStop(1,'#ffe0cf');
  x.fillStyle=grad;x.fillRect(0,0,c.width,c.height);
  x.fillStyle='#fff9f2';roundRect(x,70,70,940,1210,54);x.fill();
  x.fillStyle='#2a231f';x.textAlign='left';x.textBaseline='alphabetic';
  x.font='900 54px sans-serif';x.fillText('Ready & Set',120,160);
  const sc=r?resultSceneFor(r):null;
  x.font='900 68px sans-serif';
  wrapText(x,kind==='result'?sc.headline:'작전 개시 전, 응원 요청!',120,260,820,82);

  await drawAvatar(x,300,620,150);
  const expression=r&&r.deltaMs<=-120000?'wow':'smile';
  drawGuide(x,770,660,92,state.guide.type,expression);
  if(kind==='result'&&r?.recordingDone&&r?.guestType)drawGuide(x,665,745,62,r.guestType,'smile');

  x.fillStyle='#fff';roundRect(x,555,405,350,125,28);x.fill();
  x.fillStyle='#2b2521';x.font='700 29px sans-serif';
  wrapText(x,kind==='result'?sc.line:`${state.guide.name}: 응원 한 스푼만 부탁해요!`,585,455,290,38);

  const text=kind==='result'?[...(r?.selected||[]),...(r?.tasks||[])].join(' · '):[...state.selected,...state.tasks].join(' · ');
  x.fillStyle='#2a231f';x.font='700 32px sans-serif';wrapText(x,text||'오늘의 작전',120,925,820,46);
  x.font='900 48px sans-serif';
  if(kind==='result'&&r)x.fillText(`목표 ${fmt(r.targetMs)}   집중 ${fmt(r.focusMs)}`,120,1110);
  else x.fillText(`목표 ${state.targetMin}:00`,120,1110);
  x.font='700 29px sans-serif';x.fillStyle='#7c665c';
  x.fillText(kind==='result'?'오늘 우리에게 이런 일이 있었다.':'곧 작전 들어갑니다.',120,1180);

  const blob=await new Promise(res=>c.toBlob(res,'image/png'));
  const file=new File([blob],`Ready_Set_${kind}_${Date.now()}.png`,{type:'image/png'});
  try{
    if(navigator.canShare?.({files:[file]})){
      await navigator.share({files:[file],text:kind==='result'?'Ready & Set 작전 완료!':'Ready & Set 작전 시작!'});return;
    }
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);toast('공유 카드를 이미지로 저장했어요.');
  }catch(e){if(e.name!=='AbortError')toast('공유를 완료하지 못했어요.')}
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);
  else{ctx.rect(x,y,w,h)}
}
function wrapText(ctx,text,x,y,maxW,lineH){
  let line='';
  for(const ch of String(text)){
    const t=line+ch;
    if(ctx.measureText(t).width>maxW){ctx.fillText(line,x,y);line=ch;y+=lineH}else line=t;
  }
  if(line)ctx.fillText(line,x,y);
}
$('#preShareBtn').onclick=()=>shareCard('pre');
$('#missionShareBtn').onclick=()=>shareCard('pre');
$('#shareResultBtn').onclick=()=>shareCard('result');

$('#exportDataBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`Ready_Set_Data_${new Date().toISOString().slice(0,10)}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$('#resetDataBtn').onclick=()=>{
  if(confirm('모든 로컬 Ready & Set 기록을 초기화할까요?')){
    localStorage.removeItem('readyset_state');location.reload();
  }
};
function escapeHtml(s){
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

window.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&state.activeSession)renderFocus();
});
window.addEventListener('load',()=>{
  renderHome();renderSettings();
  if(state.activeSession&&$('#focusView')?.classList.contains('active'))renderFocus();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
});
