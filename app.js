
const RELEASE=globalThis.ReadySetReleaseDescriptor;
if(!globalThis.TakyReleaseContract?.validateDescriptor?.(RELEASE)?.ok){
  throw new Error('INVALID_READY_RELEASE_DESCRIPTOR');
}
const VERSION={
  app:RELEASE.app_version,
  master:RELEASE.master_revision||'C2S_REWRITE_01',
  schema:RELEASE.data_schema_version,
  cache:RELEASE.release_id
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rebuildSession=globalThis.ReadyRebuildSessionDomain||null;
const rebuildSessionService=globalThis.ReadyRebuildSessionService||null;
const rebuildPlannerProjection=globalThis.ReadyRebuildPlannerProjection||null;
const rebuildPlannerView=globalThis.ReadyRebuildPlannerView||null;
const rebuildNavigation=globalThis.ReadyRebuildNavigation||null;
const rebuildPersistence=globalThis.ReadyRebuildAppPersistence||null;
const rebuildMissionView=globalThis.ReadyRebuildMissionView||null;
const rebuildFocusView=globalThis.ReadyRebuildFocusView||null;
const rebuildPlannerAdminView=globalThis.ReadyRebuildPlannerAdminView||null;
if(!rebuildSession||!rebuildSessionService||!rebuildPlannerProjection||!rebuildPlannerView||!rebuildNavigation||!rebuildPersistence||!rebuildMissionView||!rebuildFocusView||!rebuildPlannerAdminView){
  throw new Error('READY_REBUILD_RUNTIME_DEPENDENCY_MISSING');
}

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
  selectedTodoIds:[],
  targetMin:25,
  sound:'집중 피아노',
  records:[],
  activeSession:null,
  recordingMeta:null
};

const appPersistence=rebuildPersistence.create({
  initial,
  storageKey:'readyset_state',
  localFirst:window.ReadySetLocalFirst,
  safePoint:appState=>!appState?.activeSession
});
let state=appPersistence.load();
let mediaRecorder=null,mediaStream=null,chunks=[],recordStartedAt=0,recordTicker=null,currentAudio=null;
let previewTimer=null,currentGuestType='pico';
let plannerSelectedDate=null;
let plannerTab='week';
const TALENT_BOOKS=['연산','한자','국어','사회','수학','생각하는 피자'];
const GUIDE_NAME_POOL=['루미','피코','모리','토리','모모','아루','리프','피즈','코코','라온','누리','보리'];

function readyPwaSafePoint(){
  return !state.activeSession;
}
globalThis.ReadySetPwaSafePoint=readyPwaSafePoint;
function save(){
  return appPersistence.save(state);
}
function toast(msg){
  const t=$('#toast'); if(!t)return;
  t.textContent=msg;t.hidden=false;
  clearTimeout(t._tm);t._tm=setTimeout(()=>t.hidden=true,2400);
}
function familySession(){return window.ReadyFamilySession?.current?.()||{authenticated:false,role:'CHILD'}}
function requireParentUi(){
  const gate=window.ReadyFamilySession?.requireRole?.('PARENT');
  if(gate?.ok)return true;
  toast('부모 인증이 필요한 화면입니다.');
  return false;
}
const appNavigation=rebuildNavigation.create({
  guard(name){
    if(name==='planner-admin'&&!requireParentUi())return {ok:true,name:'planner'};
    return {ok:true,name};
  },
  before(name){
    if(name!=='result'&&$('#resultView')?.classList.contains('active')&&state.lastResult){
      state.lastResult=null;
      save();
    }
  },
  views:{
    home:()=>renderHome(),
    mission:()=>renderMission(),
    focus:()=>renderFocus(),
    recording:()=>renderRecordingContext(),
    history:()=>renderHistory(),
    calendar:()=>renderCalendar(),
    planner:()=>renderPlanner(),
    'planner-admin':()=>renderPlannerAdmin(),
    profile:()=>renderProfile(),
    settings:()=>renderSettings(),
    result:()=>renderResult()
  }
});
function nav(name){
  return appNavigation.show(name);
}
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));
document.addEventListener('click',e=>{const tab=e.target.closest('[data-planner-tab]');if(tab){plannerTab=tab.dataset.plannerTab;renderPlanner();return}const day=e.target.closest('[data-planner-date]');if(day){plannerSelectedDate=day.dataset.plannerDate;renderPlanner();}});
document.getElementById('plannerTodayJump')?.addEventListener('click',()=>{plannerSelectedDate=localDateKey();plannerTab='day';renderPlanner();});

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

function plannerTodayProjection(){
  return (window.ReadySetPlanner?.todayProjection?.()||[]).map(x=>rebuildPlannerProjection.todayItem(x));
}
function currentPlannerMissionItems(){
  const today=plannerTodayProjection();
  const selected=today.filter(x=>x.state==='PLANNED'&&state.selectedTodoIds.includes(x.todo_id));
  return selected.length?selected:today.filter(x=>x.state==='PLANNED');
}
function currentMissionLabels(){
  return currentPlannerMissionItems().map(x=>x.label).filter(Boolean);
}
function renderHome(){
  applyAvatar($('#homeAvatar'));
  $('#heroTime').textContent=fmt(state.targetMin*60000);
  renderChips($('#homeChips'));
  applyGuide($('#homeGuidePortrait'));
  $('#homeGuideName').textContent=state.guide.name;
  const labels=currentMissionLabels();
  $('#homeGuideLine').textContent=state.activeSession
    ? '진행 중인 탐험이 있어요. 이어서 가볼까요?'
    : labels.length
      ? `오늘 Planner가 준비한 탐험 ${labels.length}개가 있어요.`
      : guideData().home;
}
function renderChips(root){
  if(!root)return;
  root.innerHTML='';
  const labels=currentMissionLabels().slice(0,6);
  labels.forEach(x=>{const s=document.createElement('span');s.textContent=x;root.appendChild(s)});
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

function learningStepLabel(step){
  return ({
    SOLVE:'풀기',CHECK:'확인',MARK_ERROR:'틀린 것 표시',
    ENCODE:'익히기',RECALL:'떠올리기',READ:'읽기',UNDERSTAND:'이해하기',RESPOND:'답하기',
    CONNECT_CONCEPTS:'개념 연결',UNDERSTAND_CONCEPT:'개념 이해',APPLY:'적용',CHECK_ERROR:'오류 확인',
    EXPLORE:'탐색',REASON:'생각하기',EXPLAIN:'설명하기',PRACTICE:'연습',COMPLETE:'완료',
    LISTEN:'듣기',PREPARE:'준비',SPEAK:'말하기',REVIEW:'돌아보기',PLAN:'계획',WRITE:'쓰기',REVISE:'고쳐쓰기'
  })[step]||String(step||'').replaceAll('_',' ');
}
function learningSequenceText(item){
  const seq=Array.isArray(item?.activity_sequence)?item.activity_sequence.filter(Boolean):[];
  return seq.length?seq.map(learningStepLabel).join(' → '):'';
}

const missionView=rebuildMissionView.create({
  query:$,
  queryAll:$$,
  escapeHtml,
  learningSequenceText
});

function toggleMissionTodo(todoId,wasSelected){
  state.selectedTodoIds=wasSelected
    ? state.selectedTodoIds.filter(x=>x!==todoId)
    : [...state.selectedTodoIds,todoId];
  save();
  renderMission();
}

function renderPlannerToday(){
  missionView.renderPlannerToday({
    items:plannerTodayProjection(),
    selectedTodoIds:state.selectedTodoIds,
    onToggle:toggleMissionTodo
  });
}

function renderMission(){
  missionView.render({
    state,
    todayItems:plannerTodayProjection(),
    renderChips,
    onToggleTodo:toggleMissionTodo
  });
}
$('#addTaskBtn').onclick=()=>{
  const v=$('#taskInput').value.trim();
  if(!v)return;
  window.ReadyAssignments?.addEventFact?.({actor:'CHILD',title:v,provenance:{kind:'CHILD_INPUT',surface:'MISSION'}});
  $('#taskInput').value='';
  toast('새 숙제를 부모님 확인 목록에 보냈어요. 확인 후 Planner가 TODAY에 배정합니다.');
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
  const sh=$('#soundSheet');
  $$('[data-sheet-sound]').forEach(b=>{
    const active=b.dataset.sheetSound===state.sound;
    b.classList.toggle('on',active);
    b.setAttribute('aria-pressed',active?'true':'false');
  });
  sh.hidden=false;
  queueMicrotask(()=>{(sh.querySelector('[data-sheet-sound].on')||sh.querySelector('[data-close-sound],[data-sheet-sound]'))?.focus({preventScroll:true})});
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
  const now=Date.now(),sessionId=`s_${now}`;
  const started=rebuildSessionService.start({
    sessionDomain:rebuildSession,
    planner:window.ReadySetPlanner,
    activeSession:state.activeSession,
    selectedTodoIds:state.selectedTodoIds,
    sessionId,
    now,
    targetMin:state.targetMin,
    sound:state.sound
  });
  if(!started.ok){
    if(started.reason==='SESSION_ALREADY_ACTIVE'){toast('이미 진행 중인 작전이 있어요. 먼저 진행 중인 작전으로 돌아가 주세요.');nav('focus');return}
    if(started.reason==='NO_SELECTED_TODO'){toast('먼저 Planner가 준비한 오늘의 탐험을 선택해 주세요.');return}
    if(started.reason==='NO_STARTABLE_PLANNER_TODO'){toast('지금 시작할 수 있는 Planner TODO가 없어요. TODAY를 다시 확인해 주세요.');return}
    toast('다른 세션에서 이미 진행 중인 할 일이 있어 시작하지 않았어요.');
    renderMission();
    return;
  }
  state.activeSession=started.session;
  save();
  nav('focus');
  if(state.sound!=='OFF')await resumeBgm(state.sound);
};

function sessionTimes(){
  if(rebuildSession?.times)return rebuildSession.times(state.activeSession,{now:Date.now(),fallbackTargetMin:state.targetMin});
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
const focusView=rebuildFocusView.create({
  query:$,
  learningStepLabel,
  formatTime:fmt,
  applyGuide,
  updateBgmStatus
});
function renderFocus(){
  const s=state.activeSession;
  if(!s){if($('#focusView')?.classList.contains('active'))nav('mission');return}
  focusView.render(s);
  tickFocus();
}
function tickFocus(){
  const s=state.activeSession;if(!s)return;
  focusView.renderTick(s,sessionTimes(),new Date());
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
$('#completeBtn').onclick=()=>{$('#outcomeModal').hidden=false};
function finishSessionRecord({outcomeState='COMPLETED',plannerOutcomes=[],taskOutcomes=[]}={}){
  const s=state.activeSession;if(!s)return null;
  pauseBgm();
  if(s.pausedAt){s.issueMs+=Date.now()-s.pausedAt;s.pausedAt=null}
  s.endAt=Date.now();s.completed=true;
  const t=sessionTimes();
  const endedTodoIds=new Set((plannerOutcomes||[]).filter(x=>x?.ok).map(x=>x.todo_id));
  if(endedTodoIds.size)state.selectedTodoIds=state.selectedTodoIds.filter(id=>!endedTodoIds.has(id));
  const rec={...s,focusMs:t.focus,issueMs:t.issue,deltaMs:t.focus-s.targetMs,outcomeState,plannerOutcomes,taskOutcomes};
  state.records.unshift(rec);state.records=state.records.slice(0,200);
  state.activeSession=null;state.lastResult=rec;save();nav('result');
  return rec;
}
function completeSessionFromTaskOutcomes(taskOutcomes=[]){
  const rows=Array.isArray(taskOutcomes)?taskOutcomes.filter(x=>x&&x.state):[];
  if(!rows.length)return null;
  const unique=[...new Set(rows.map(x=>x.state))];
  const outcomeState=unique.length===1?unique[0]:'MIXED';
  const plannerOutcomes=rows.map(x=>x.plannerOutcome).filter(Boolean);
  return finishSessionRecord({outcomeState,plannerOutcomes,taskOutcomes:rows});
}

function completeSession(outcomeState='COMPLETED'){
  const s=state.activeSession;if(!s)return;
  pauseBgm();
  if(s.pausedAt){s.issueMs+=Date.now()-s.pausedAt;s.pausedAt=null}
  s.endAt=Date.now();s.completed=true;
  const t=sessionTimes();
  const outcome=rebuildSessionService.outcome({
    sessionDomain:rebuildSession,
    planner:window.ReadySetPlanner,
    session:s,
    focusMs:t.focus,
    outcomeState,
    endAt:s.endAt
  });
  if(!outcome.ok){
    toast('작전 결과를 Planner에 반영하지 못했어요.');
    return null;
  }
  return finishSessionRecord({outcomeState,plannerOutcomes:outcome.plannerOutcomes,taskOutcomes:[]});
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

$$('[data-outcome-state]').forEach(b=>b.onclick=()=>{
  const stateValue=b.dataset.outcomeState;
  $('#outcomeModal').hidden=true;
  completeSession(stateValue);
});
$$('[data-close-outcome]').forEach(b=>b.onclick=()=>{$('#outcomeModal').hidden=true});

function resultSource(){return state.lastResult||null}
function resultOutcomeProfile(r={}){
  const state=r.outcomeState||'COMPLETED';
  return ({
    COMPLETED:{state,label:'완료',historyLabel:'작전 완료',shareTitle:'오늘의 탐험 완료',shareText:'Ready & Set · 오늘의 탐험 완료!',done:true},
    PARTIAL:{state,label:'일부 남음',historyLabel:'일부 남음',shareTitle:'오늘은 여기까지',shareText:'Ready & Set · 오늘은 여기까지 했어요.',headline:'여기까지 했어요.',line:'남은 건 Planner가 이어서 정리해둘게.',done:false},
    DEFERRED:{state,label:'다음에',historyLabel:'다음에 이어서',shareTitle:'다음 탐험으로 이어가요',shareText:'Ready & Set · 다음 탐험으로 이어가요.',headline:'오늘은 여기까지.',line:'다음 탐험으로 넘겨둘게.',done:false},
    WAITING_FOR_PARENT:{state,label:'부모 도움',historyLabel:'부모 도움 필요',shareTitle:'도움이 필요한 탐험',shareText:'Ready & Set · 도움이 필요한 지점을 남겼어요.',headline:'도움이 필요해요.',line:'부모님 확인이 필요한 일로 표시했어요.',done:false},
    BLOCKED:{state,label:'막힘',historyLabel:'막힘',shareTitle:'막힌 지점을 찾았어요',shareText:'Ready & Set · 해결이 필요한 지점을 찾았어요.',headline:'막힌 지점 발견.',line:'그냥 넘기지 않고 해결이 필요한 일로 남겼어요.',done:false},
    MIXED:{state,label:'과제별 결과',historyLabel:'과제별 결과',shareTitle:'오늘 탐험을 정리했어요',shareText:'Ready & Set · 오늘 탐험 결과를 과제별로 정리했어요.',headline:'오늘 탐험을 정리했어요.',line:'과제마다 끝난 상태를 그대로 기록했어요.',done:false}
  })[state]||{state:'COMPLETED',label:'완료',historyLabel:'작전 완료',shareTitle:'오늘의 탐험 완료',shareText:'Ready & Set · 오늘의 탐험 완료!',done:true};
}
function resultSceneFor(r){
  const profile=resultOutcomeProfile(r);
  if(!profile.done)return{headline:profile.headline,line:profile.line,label:'결과'};
  const delta=r.deltaMs;
  if(delta<=-120000)return{headline:'엣헴~! 오늘 좀 했습니다.',line:'잠깐… 시계보다 먼저 왔는데?',label:'TIME SAVE'};
  if(Math.abs(delta)<=60000)return{headline:'오? 계산대로인데?',line:'시계랑 거의 동시에 들어왔어요.',label:'차이'};
  if(delta>0)return{headline:'무사 귀환!',line:'헤헤… 조금 늦었습니다. 그래도 작전 완료!',label:'차이'};
  if(r.issueMs>120000)return{headline:'오늘은 사건이 좀 많았습니다.',line:'그래도 다시 돌아와서 끝냈네.',label:'차이'};
  return{headline:'작전 완료!',line:'오늘도 끝까지 잘 돌아왔어요.',label:'차이'};
}
function renderResult(){
  const r=resultSource();
  if(!r){nav('history');return}
  applyAvatar($('#resultAvatar'));
  applyGuide($('#resultGuidePortrait'));
  const guest=$('#resultGuestPortrait');
  if(r.recordingDone&&r.guestType){guest.hidden=false;applyGuide(guest,r.guestType);guest.classList.add('guest')}else guest.hidden=true;
  const sc=resultSceneFor(r);
  const outcomeCopy=sc;
  $('#resultHeadline').textContent=outcomeCopy.headline;
  $('#resultLine').textContent=outcomeCopy.line;
  $('#resultTasks').textContent=[...r.selected,...r.tasks].join(' · ');
  $('#resultTarget').textContent=fmt(r.targetMs);
  $('#resultFocus').textContent=fmt(r.focusMs);
  $('#deltaLabel').textContent=sc.label;
  $('#resultDelta').textContent=fmt(Math.abs(r.deltaMs));
}
function renderHistory(){
  const root=$('#historyList');root.innerHTML='';
  if(!state.records.length){root.innerHTML='<div class="historyItem"><b>아직 기록이 없어요.</b><p>첫 탐험을 마치면 여기에 쌓입니다.</p></div>';return}
  state.records.forEach(r=>{
    const x=document.createElement('article');x.className='historyItem';
    const profile=resultOutcomeProfile(r);
    x.innerHTML=`<header><b>${new Date(r.endAt).toLocaleDateString('ko-KR')}</b><small>${escapeHtml(profile.historyLabel)} · ${fmt(r.focusMs)} / ${fmt(r.targetMs)}</small></header><p>${escapeHtml([...r.selected,...r.tasks].join(' · '))}</p>`;
    root.appendChild(x);
  });
}
function renderCalendar(){
  const root=$('#calendarList');root.innerHTML='';
  state.records.slice(0,31).forEach(r=>{
    const x=document.createElement('article');x.className='historyItem';
    const profile=resultOutcomeProfile(r);
    x.innerHTML=`<header><b>${new Date(r.endAt).toLocaleDateString('ko-KR')}</b><small>${escapeHtml(profile.historyLabel)}</small></header><p>${escapeHtml([...r.selected,...r.tasks].join(' · '))}</p>`;
    root.appendChild(x);
  });
  if(!root.children.length)root.innerHTML='<div class="historyItem"><b>이번 달 작전 기록이 없어요.</b></div>';
}


function localDateKey(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function addDays(base,n){const d=new Date(base);d.setDate(d.getDate()+n);return d}
function weekStart(base=new Date()){
  const d=new Date(base); const dow=d.getDay(); const delta=dow===0?-6:1-dow; d.setDate(d.getDate()+delta); d.setHours(12,0,0,0); return d;
}
function plannerSnapshot(){return window.ReadySetPlanner?.snapshot?.()||{dated_todos:[],schedule_commitments:[],daily_availability_windows:[],carry_over_queue:[]}}
plannerSelectedDate=plannerSelectedDate||localDateKey();
function plannerItemsForDate(date,snap=plannerSnapshot()){
  return rebuildPlannerView.itemsForDate(date,snap);
}
function plannerStateLabel(v){
  return rebuildPlannerView.stateLabel(v);
}
function renderPlanner(){
  plannerSelectedDate=plannerSelectedDate||localDateKey();
  window.ReadySetPlanner?.replanReadyCarryOvers?.({date:localDateKey()});
  const adminJump=document.querySelector('.plannerAdminJump');
  if(adminJump)adminJump.hidden=!window.ReadyFamilySession?.isParent?.();
  const snap=plannerSnapshot(), start=weekStart(new Date(plannerSelectedDate+'T12:00:00'));
  const strip=$('#plannerWeekStrip'), detail=$('#plannerWeekDetail');
  if(!strip||!detail)return;
  document.querySelectorAll('[data-planner-tab]').forEach(b=>{
    const active=b.dataset.plannerTab===plannerTab;
    b.classList.toggle('on',active);
    b.setAttribute('aria-selected',active?'true':'false');
    b.setAttribute('tabindex',active?'0':'-1');
  });
  $('#plannerWeekPanel').hidden=plannerTab!=='week';
  $('#plannerDayPanel').hidden=plannerTab!=='day';
  const weekDates=Array.from({length:7},(_,i)=>addDays(start,i));
  strip.innerHTML='';
  const names=['월','화','수','목','금','토','일'];
  weekDates.forEach((d,i)=>{
    const key=localDateKey(d),items=plannerItemsForDate(key,snap);
    const btn=document.createElement('button');
    btn.type='button';btn.className='plannerDayChip'+(key===plannerSelectedDate?' on':'');
    btn.dataset.plannerDate=key;
    btn.innerHTML=`<small>${names[i]}</small><b>${d.getDate()}</b><span>${items.length?items.length+'개':'·'}</span>`;
    strip.appendChild(btn);
  });
  const selectedItems=plannerItemsForDate(plannerSelectedDate,snap);
  detail.innerHTML=selectedItems.length?selectedItems.map(x=>`
    <article class="plannerWeekItem ${x.kind==='SCHEDULE'?'fixed':''}">
      <span class="plannerDot"></span><div><b>${escapeHtml(x.label)}</b><small>${x.time?x.time+' · ':''}${x.meta}${x.minutes?' · '+x.minutes+'분':''}</small></div><em>${plannerStateLabel(x.state)}</em>
    </article>`).join(''):`<div class="plannerEmpty"><b>비어 있는 날이에요.</b><small>필요한 탐험만 가볍게 추가해요.</small></div>`;
  const day=$('#plannerDayTimeline'); day.innerHTML=selectedItems.length?selectedItems.map((x,i)=>`
    <article class="plannerRouteItem"><i>${String(i+1).padStart(2,'0')}</i><div><small>${x.kind==='SCHEDULE'?'FIXED ROUTE':'MISSION'}</small><b>${escapeHtml(x.label)}</b><span>${x.time?x.time+' · ':''}${x.minutes?x.minutes+'분 · ':''}${plannerStateLabel(x.state)}</span></div></article>`).join(''):`<div class="plannerEmpty tall"><b>오늘 예정된 탐험이 없어요.</b><small>Mission에서 오늘 할 일을 골라 시작할 수 있어요.</small></div>`;
  const dd=new Date(plannerSelectedDate+'T12:00:00');
  $('#plannerDayTitle').textContent=`${dd.getMonth()+1}월 ${dd.getDate()}일 탐험`;
  $('#plannerDayCount').textContent=`${selectedItems.length}개`;
  $('#plannerHeroTitle').textContent=plannerTab==='week'?'이번 주 탐험 지도':'오늘의 탐험 루트';
}


function clearScheduleForm(){
  $('#scheduleId').value='';
  $('#scheduleTitle').value='';
  $('#scheduleCategory').value='';
  $('#scheduleDate').value=localDateKey();
  $('#scheduleStart').value='';
  $('#scheduleEnd').value='';
  $('#scheduleMovable').checked=false;
}
function clearAvailabilityForm(){
  $('#availabilityId').value='';
  $('#availabilityDate').value=localDateKey();
  $('#availabilityWeekly').checked=false;
  $('#availabilityWeekday').value='1';
  $('#availabilityStart').value='';
  $('#availabilityEnd').value='';
}
const plannerAdminView=rebuildPlannerAdminView.create({
  query:$,
  escapeHtml
});
function renderPlannerAdmin(){
  if(!requireParentUi()){nav('planner');return}
  const snap=plannerSnapshot();
  const scheduleRoot=$('#scheduleAdminList');
  if(!scheduleRoot)return;
  plannerAdminView.render(snap);
  if(!$('#scheduleDate').value) $('#scheduleDate').value=localDateKey();
  if(!$('#availabilityDate').value) $('#availabilityDate').value=localDateKey();
  renderParentIntake();
}
function renderParentIntake(){
  const root=$('#talentBookFacts');if(root&&!root.children.length)root.innerHTML=TALENT_BOOKS.map(subject=>`
    <div class="adminGrid two" data-talent-book="${subject}">
      <label class="inputBlock">${subject} 범위<input data-range placeholder="숙제 범위"></label>
      <label class="inputBlock">${subject} 교사 지시<input data-instruction placeholder="지시사항"></label>
      <input data-answer type="hidden" value="">
    </div>`).join('');
  const status=$('#assignmentFactStatus'),projection=window.ReadyAssignments?.project?.('PARENT');
  if(status&&projection){
    const pending=window.ReadyAssignments?.pendingChildFacts?.()||[];
    const pendingIds=new Set(pending.map(x=>x.assignment_id));
    status.innerHTML=projection.facts.slice(-20).reverse().map(f=>{
      const childPending=pendingIds.has(f.assignment_id);
      const actions=childPending?`<div class="adminInlineActions"><button class="miniAction" data-child-fact-confirm="${f.assignment_id}">확인</button><button class="miniAction" data-child-fact-reject="${f.assignment_id}">제외</button></div>`:'';
      const label=f.title||f.book_subject||f.subject||'숙제 제안';
      return `<div class="adminListItem"><span><b>${escapeHtml(label)}</b><small>${childPending?'CHILD 제안 · Parent 확인 대기':escapeHtml(f.confirmation_state)} · ${escapeHtml(f.analysis_state)}</small></span>${actions}</div>`;
    }).join('');
  }

  const lmRoot=$('#learningMasterSummary');
  const domain=window.ReadyAssignments?.load?.();
  if(lmRoot&&domain){
    const rows=Object.values(domain.assignmentFacts||{}).filter(f=>f.current_analysis_id).slice(-12).reverse();
    lmRoot.innerHTML=rows.length?rows.map(f=>{
      const analysis=domain.analyses?.[f.current_analysis_id];
      const units=(analysis?.learning_unit_ids||[]).map(id=>domain.learningUnits?.[id]).filter(Boolean);
      const maxDifficulty=units.reduce((m,u)=>Math.max(m,u.activity_load?.difficulty||0),0);
      const maxLoad=units.reduce((m,u)=>Math.max(m,u.activity_load?.score||0),0);
      const recovery=units.some(u=>u.activity_load?.recovery_need==='HIGH')?'회복 필요 높음':units.some(u=>u.activity_load?.recovery_need==='MEDIUM')?'회복 필요 보통':'회복 부담 낮음';
      const unresolved=[...new Set(units.flatMap(u=>u.unresolved_flags||[]))];
      return `<div class="adminListItem"><span><b>${escapeHtml(f.book_subject||f.subject)} · ${units.length}개 학습단위</b><small>난이도 ${maxDifficulty||'-'} · 부하 ${maxLoad||'-'} · ${recovery}${unresolved.length?` · 확인 ${unresolved.length}건`:''}</small></span></div>`;
    }).join(''):'<div class="plannerEmpty"><b>아직 해석된 숙제가 없어요.</b><small>FACT 확인 후 Learning Master가 학습단위를 만듭니다.</small></div>';
  }
  if($('#learningMasterVersion'))$('#learningMasterVersion').textContent='v'+(window.ReadyLearningMasterV01?.version||'0.5.1');
  if($('#talentSourceDate')&&!$('#talentSourceDate').value)$('#talentSourceDate').value=localDateKey();
  renderCaptureIntake().catch(()=>{});
}
document.getElementById('saveTalentFactsBtn')?.addEventListener('click',async()=>{
  if(!requireParentUi())return;
  const source=$('#talentSourceDate').value,deadline=$('#talentDeadline').value;
  if(!source||!deadline){toast('받은 날과 다음 화요일 경계를 확인해 주세요.');return}
  const books=[];
  for(const row of [...document.querySelectorAll('[data-talent-book]')]){
    const subject=row.dataset.talentBook;
    const captured=await capturedRefs('TALENT:'+subject);
    const reviewedValue={
      source_range:row.querySelector('[data-range]').value.trim(),
      teacher_instruction:row.querySelector('[data-instruction]').value.trim()
    };
    const reviewProvenance=await recordCaptureReview('TALENT:'+subject,reviewedValue,'PARENT_REVIEWED');
    books.push({
      subject,
      ...reviewedValue,
      artifact_refs:captured.source,
      answer_reference_ids:captured.answers,
      provenance:reviewProvenance?{kind:'PARENT_REVIEWED_CAPTURE',surface:'PARENT_INTAKE',capture_review:reviewProvenance}:{kind:'PARENT_INPUT',surface:'PARENT_INTAKE'}
    });
  }
  if(books.some(x=>!x.source_range)){toast('재능 6권의 숙제 범위를 모두 입력해 주세요.');return}
  for(const subject of TALENT_BOOKS){
    const closure=await window.ReadyCaptureV01?.reviewClosureForGroup?.('TALENT:'+subject);
    if(closure&&closure.unresolved_count>0){
      toast(`${subject} 촬영 원본 ${closure.unresolved_count}건을 먼저 연결하거나 분석 제외로 처리해 주세요.`);
      return;
    }
  }
  const talentLinks={};
  const talentSignatures={};
  for(const book of books){
    talentLinks[book.subject]=await window.ReadyCaptureV01?.factLinkForGroup?.('TALENT:'+book.subject);
    talentSignatures[book.subject]=stableFactSignature({
      source_date:source,
      deadline_boundary:deadline,
      source_range:book.source_range,
      teacher_instruction:book.teacher_instruction
    });
  }
  const activeLinkedSubjects=TALENT_BOOKS.filter(subject=>talentLinks[subject]?.assignment_id);
  const closedTalentLinks={};
  if(activeLinkedSubjects.length===0){
    for(const subject of TALENT_BOOKS){
      closedTalentLinks[subject]=await window.ReadyCaptureV01?.lastClosedFactLinkForGroup?.('TALENT:'+subject);
    }
    const closedSubjects=TALENT_BOOKS.filter(subject=>closedTalentLinks[subject]?.assignment_id);
    if(closedSubjects.length===TALENT_BOOKS.length&&closedSubjects.every(subject=>closedTalentLinks[subject]?.payload_signature===talentSignatures[subject])){
      toast('같은 재능 FACT가 이미 저장·확정되어 있어 중복 생성하지 않았어요.');
      return;
    }
  }
  const existingPackageId=Object.values(talentLinks).map(x=>x?.package_id).find(Boolean)||undefined;
  const pkg=window.ReadyAssignments.upsertTalentPackage({
    actor:'PARENT',
    package_id:existingPackageId,
    source_date:source,
    deadline_boundary:deadline,
    books:books.map(b=>({...b,assignment_id:talentLinks[b.subject]?.assignment_id||undefined})),
    provenance:{kind:'PARENT_INPUT',surface:'PARENT_INTAKE'}
  });
  let todoCount=0,held=0;
  for(let i=0;i<pkg.fact_ids.length;i++){
    const assignmentId=pkg.fact_ids[i];
    const subject=TALENT_BOOKS[i];
    window.ReadyAssignments.confirmFact(assignmentId,{actor:'PARENT'});
    await window.ReadyCaptureV01?.recordFactLink?.('TALENT:'+subject,{
      assignment_id:assignmentId,
      package_id:pkg.package_id,
      fact_confirmation_state:'FACT_CONFIRMED',
      payload_signature:talentSignatures[subject]
    });
    const processed=window.ReadyIntegrationV1?.processAssignment?.(assignmentId,{start_date:localDateKey()});
    if(processed?.ok)todoCount+=(processed.todos||[]).length;
    else if(processed?.reason==='FACT_REVISION_IN_PROGRESS_HOLD')held++;
    else held++;
  }
  await window.ReadyCaptureV01?.finalizeFactLinkage?.();
  toast(`재능 6권 분석 완료 · Planner가 ${todoCount}개 탐험을 배정했어요${held?` · 보류 ${held}건`:''}.`);
  renderParentIntake();renderPlanner();renderMission();
});
document.getElementById('saveEnglishFactBtn')?.addEventListener('click',async()=>{
  if(!requireParentUi())return;
  const name=$('#englishWorkbook').value.trim(),range=$('#englishRange').value.trim();if(!name||!range){toast('문제집과 숙제 범위를 확인해 주세요.');return}
  const englishGroupKeys=['ENGLISH:WORKBOOK','ENGLISH:PRINT','ENGLISH:OTHER'];
  const existingEnglishLinks=await Promise.all(
    englishGroupKeys.map(groupKey=>window.ReadyCaptureV01?.factLinkForGroup?.(groupKey))
  );
  const existingEnglishLink=existingEnglishLinks.find(x=>x?.assignment_id||x?.workbook_ref_id)||null;
  const englishSignature=stableFactSignature({
    source_date:localDateKey(),
    workbook_name:name,
    source_range:range,
    next_academy:$('#englishNextAcademy').value,
    weekday_prints:parsePrints($('#englishPrints').value),
    components:{
      vocabulary:$('#englishVocabulary').value.trim(),
      listening:$('#englishListening').value.trim(),
      recording:$('#englishRecording').value.trim(),
      writing:$('#englishWriting').value.trim()
    },
    teacher_instruction:$('#englishInstruction').value.trim()
  });
  const activeEnglishLinks=existingEnglishLinks.filter(x=>x?.assignment_id||x?.workbook_ref_id);
  if(!activeEnglishLinks.length){
    const closedEnglishLinks=await Promise.all(
      englishGroupKeys.map(groupKey=>window.ReadyCaptureV01?.lastClosedFactLinkForGroup?.(groupKey))
    );
    const linkedClosed=closedEnglishLinks.filter(x=>x?.assignment_id);
    if(linkedClosed.length&&linkedClosed.every(x=>x.assignment_id===linkedClosed[0].assignment_id&&x.payload_signature===englishSignature)){
      toast('같은 영어 FACT가 이미 저장·확정되어 있어 중복 생성하지 않았어요.');
      return;
    }
  }
  const ref=window.ReadyAssignments.upsertWorkbookRef({
    workbook_ref_id:existingEnglishLink?.workbook_ref_id||undefined,
    name,
    subject:'영어',
    provenance:{kind:'PARENT_INPUT'}
  });
  const englishGroups=await Promise.all(['ENGLISH:WORKBOOK','ENGLISH:PRINT','ENGLISH:OTHER'].map(capturedRefs));
  const englishSource=englishGroups.flatMap(x=>x.source);
  const englishAnswers=englishGroups.flatMap(x=>x.answers);
  const englishReviewedValue={
    workbook_name:name,
    source_range:range,
    weekday_prints:parsePrints($('#englishPrints').value),
    components:{vocabulary:$('#englishVocabulary').value.trim(),listening:$('#englishListening').value.trim(),recording:$('#englishRecording').value.trim(),writing:$('#englishWriting').value.trim()},
    teacher_instruction:$('#englishInstruction').value.trim()
  };
  const englishReviewRows=[];
  for(const groupKey of ['ENGLISH:WORKBOOK','ENGLISH:PRINT','ENGLISH:OTHER']){
    const p=await recordCaptureReview(groupKey,englishReviewedValue,'PARENT_REVIEWED');
    if(p)englishReviewRows.push(p);
  }
  for(const groupKey of ['ENGLISH:WORKBOOK','ENGLISH:PRINT','ENGLISH:OTHER']){
    const closure=await window.ReadyCaptureV01?.reviewClosureForGroup?.(groupKey);
    if(closure&&closure.unresolved_count>0){
      toast(`영어 촬영 원본 ${closure.unresolved_count}건을 먼저 연결하거나 분석 제외로 처리해 주세요.`);
      return;
    }
  }
  const fact=window.ReadyAssignments.upsertEnglishAssignment({
    actor:'PARENT',assignment_id:existingEnglishLink?.assignment_id||undefined,workbook_ref_id:ref.workbook_ref_id,source_date:localDateKey(),source_range:range,
    weekday_prints:parsePrints($('#englishPrints').value),
    components:{vocabulary:$('#englishVocabulary').value.trim(),listening:$('#englishListening').value.trim(),recording:$('#englishRecording').value.trim(),writing:$('#englishWriting').value.trim()},
    teacher_instruction:$('#englishInstruction').value.trim(),
    next_academy:$('#englishNextAcademy').value,
    artifact_refs:englishSource,
    answer_reference_ids:englishAnswers,
    provenance:englishReviewRows.length
      ?{kind:'PARENT_REVIEWED_CAPTURE',surface:'PARENT_INTAKE',capture_linked:true,capture_reviews:englishReviewRows}
      :{kind:'PARENT_INPUT',surface:'PARENT_INTAKE',capture_linked:englishSource.length+englishAnswers.length>0}
  });
  window.ReadyAssignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
  for(const groupKey of ['ENGLISH:WORKBOOK','ENGLISH:PRINT','ENGLISH:OTHER']){
    const refs=await capturedRefs(groupKey);
    if(refs.source.length||refs.answers.length){
      await window.ReadyCaptureV01?.recordFactLink?.(groupKey,{
        assignment_id:fact.assignment_id,
        workbook_ref_id:ref.workbook_ref_id,
        fact_confirmation_state:'FACT_CONFIRMED',
        payload_signature:englishSignature
      });
    }
  }
  await window.ReadyCaptureV01?.finalizeFactLinkage?.();
  const processed=window.ReadyIntegrationV1?.processAssignment?.(fact.assignment_id,{start_date:localDateKey()});
  if(fact.deadline_state==='NEXT_ACADEMY_UNVERIFIED'||processed?.reason==='NEXT_ACADEMY_UNVERIFIED'){
    toast('영어 FACT 저장 · 다음 학원 일정 확인 전 분석/배정 보류');
  }else if(processed?.ok){
    toast(`영어 숙제 분석 완료 · Planner가 ${(processed.todos||[]).length}개 탐험을 배정했어요.`);
  }else if(processed?.reason==='FACT_REVISION_IN_PROGRESS_HOLD'){
    toast('영어 FACT 수정은 저장했어요. 진행 중인 기존 탐험이 끝난 뒤 새 기준으로 재배정됩니다.');
  }else{
    toast('영어 FACT는 저장했지만 배정 조건을 더 확인해야 해요.');
  }
  renderParentIntake();renderPlanner();renderMission();
});

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



function renderAuthStatus(){
  const session=familySession();
  const badge=$('#authStateBadge'),text=$('#authStatusText');
  const loginControls=$('#authLoginControls'),loggedInControls=$('#authLoggedInControls'),link=$('#familyLinkChildSection');
  if(badge)badge.textContent=session.authenticated?(session.role==='PARENT'?'보호자':'학생'):'로컬 모드';
  if(text){
    text.textContent=session.authenticated
      ? `${session.role==='PARENT'?'PARENT':'CHILD'} 계정으로 로그인됨 · 가족 ${session.family_id||'-'}`
      : '로그인하지 않아도 이 기기에서 CHILD 로컬 모드로 사용할 수 있습니다.';
  }
  if(loginControls)loginControls.hidden=!!session.authenticated;
  if(loggedInControls)loggedInControls.hidden=!session.authenticated;
  if(link)link.hidden=!(session.authenticated&&session.role==='PARENT');
}
window.addEventListener('readyset-family-session',()=>{
  renderAuthStatus();
  renderPlanner();
  renderSyncStatus().catch(()=>{});
});

document.getElementById('authLoginBtn')?.addEventListener('click',async()=>{
  const email=$('#authEmailInput')?.value.trim(),password=$('#authPasswordInput')?.value||'';
  if(!email||!password){toast('이메일과 비밀번호를 확인해 주세요.');return;}
  const result=await window.ReadyFamilySession?.login?.({email,password});
  if(result?.ok){
    toast('가족 계정으로 로그인했어요.');
    renderAuthStatus();renderPlanner();await renderSyncStatus();
  }else{
    const msg=result?.reason==='FAMILY_MEMBERSHIP_REQUIRED'
      ? '아직 가족 연결이 완료되지 않은 계정입니다.'
      : result?.reason==='IDENTITY_ROLE_INVALID'
        ? '계정 역할 설정을 확인해 주세요.'
        : '로그인 정보를 확인해 주세요.';
    toast(msg);
  }
});

document.getElementById('authSignupBtn')?.addEventListener('click',async()=>{
  const name=$('#authNameInput')?.value.trim(),email=$('#authEmailInput')?.value.trim(),password=$('#authPasswordInput')?.value||'';
  if(!email||password.length<8){toast('이메일과 8자 이상 비밀번호를 확인해 주세요.');return;}
  const result=await window.ReadyFamilySession?.signup?.({name,email,password});
  toast(result?.ok?'가입 확인 메일을 확인해 주세요. 가입 후 기본 역할은 CHILD입니다.':'계정 생성에 실패했습니다.');
});

document.getElementById('authLogoutBtn')?.addEventListener('click',async()=>{
  await window.ReadyFamilySession?.logout?.();
  toast('로그아웃했습니다. 로컬 CHILD 모드로 전환합니다.');
  renderAuthStatus();renderPlanner();await renderSyncStatus();
});

document.getElementById('familyLinkChildBtn')?.addEventListener('click',async()=>{
  if(!requireParentUi())return;
  const email=$('#familyChildEmailInput')?.value.trim();
  if(!email){toast('연결할 CHILD 이메일을 입력해 주세요.');return;}
  const result=await window.ReadyFamilySession?.linkChild?.(email);
  if(result?.ok){
    toast('CHILD 계정을 가족에 연결했습니다.');
    if($('#familyChildEmailInput'))$('#familyChildEmailInput').value='';
  }else{
    const message=result?.reason==='CHILD_ACCOUNT_NOT_FOUND'
      ? '먼저 CHILD 계정을 가입·확인한 뒤 연결해 주세요.'
      : result?.reason==='TARGET_ALREADY_IN_OTHER_FAMILY'
        ? '이미 다른 가족에 연결된 계정입니다.'
        : 'CHILD 계정을 연결하지 못했습니다.';
    toast(message);
  }
});

async function renderSyncStatus(){
  const adapter=window.ReadySetSyncAdapter;
  const local=window.ReadySetLocalFirst;
  if(!adapter||!local)return;
  const s=adapter.status();
  const [outbox,conflicts]=await Promise.all([local.outbox(),local.conflicts()]);
  const pending=outbox.filter(x=>!['SENT','SUPERSEDED'].includes(x.status)).length;
  const openConflicts=conflicts.filter(x=>x.status==='OPEN').length;
  const badge=$('#syncStateBadge'),text=$('#syncStatusText');
  if(badge){
    badge.textContent=s.state==='CONNECTED'?'클라우드 연결':s.state==='ERROR'?'연결 오류':'로컬 저장';
    badge.dataset.state=s.state;
  }
  if(text){
    text.textContent=s.state==='CONNECTED'
      ? '클라우드 동기화 서버와 연결되어 Outbox를 전송할 수 있습니다.'
      : s.state==='ERROR'
        ? '클라우드 연결에 문제가 있어 로컬 저장을 유지하고 있습니다. 데이터는 지워지지 않습니다.'
        : '현재 이 기기에 안전하게 저장 중이에요. 클라우드 동기화는 아직 연결되지 않았습니다.';
  }
  if($('#syncPendingCount'))$('#syncPendingCount').textContent=String(pending);
  if($('#syncConflictCount'))$('#syncConflictCount').textContent=String(openConflicts);
}
window.addEventListener('readyset-sync-status',()=>renderSyncStatus().catch(()=>{}));
document.getElementById('checkSyncBtn')?.addEventListener('click',async()=>{
  const s=window.ReadySetSyncAdapter?.status();
  if(!s?.configured||!s?.enabled){
    toast('클라우드 동기화는 아직 연결되지 않았어요. 로컬 저장은 정상입니다.');
    await renderSyncStatus(); return;
  }
  const h=await window.ReadySetSyncAdapter.health();
  if(h.ok){
    const f=await window.ReadySetLocalFirst.flush();
    toast(`동기화 연결 확인 · 전송 ${f.sent||0}건`);
  }else toast('클라우드 연결을 확인하지 못했어요. 로컬 저장을 유지합니다.');
  await renderSyncStatus();
});

function renderSettings(){
  $('#guideNameInput').value=state.guide.name;
  $('#guideNameLabel').textContent=state.guide.name;
  $('#guidePersonalityLabel').textContent=guideData().personality;
  applyGuide($('#settingsGuidePortrait'));
  $$('[data-guide-type]').forEach(b=>b.classList.toggle('on',b.dataset.guideType===state.guide.type));
  $$('[data-guide-voice]').forEach(b=>b.classList.toggle('on',b.dataset.guideVoice===state.guide.voice));
  renderNameSuggestions(false);
  document.querySelectorAll('[data-sound]').forEach(b=>b.classList.toggle('on',b.dataset.sound===state.sound));
  renderAuthStatus();
  renderSyncStatus().catch(()=>{});
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

  const text=kind==='result'?[...(r?.selected||[]),...(r?.tasks||[])].join(' · '):currentMissionLabels().join(' · ');
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
      const shareProfile=kind==='result'?resultOutcomeProfile(r||{}):null;
      await navigator.share({files:[file],text:kind==='result'?shareProfile.shareText:'Ready & Set 작전 시작!'});return;
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
function reconcileReadyRuntimeState(){
  const snap=plannerSnapshot();
  const todayKey=localDateKey();
  const openToday=new Set((snap.dated_todos||[])
    .filter(x=>x.date===todayKey&&x.state==='PLANNED')
    .map(x=>x.todo_id));
  const beforeSelected=state.selectedTodoIds.length;
  state.selectedTodoIds=state.selectedTodoIds.filter(id=>openToday.has(id));

  let resumed=false;
  if(state.activeSession?.id){
    let status=window.ReadySetPlanner?.sessionRuntimeStatus?.(state.activeSession.id)||null;
    const sessionIds=new Set((state.activeSession.plannerLinks||[]).map(x=>x.todo_id).filter(Boolean));
    let inProgress=(status?.in_progress||[]).filter(x=>sessionIds.has(x.todo_id));
    if(!inProgress.length&&sessionIds.size){
      const legacyInProgress=(snap.dated_todos||[]).filter(x=>sessionIds.has(x.todo_id)&&x.state==='IN_PROGRESS');
      for(const todo of legacyInProgress){
        window.ReadySetPlanner?.recordTaskState?.({
          todo_id:todo.todo_id,
          ready_state:'IN_PROGRESS',
          session_id:state.activeSession.id,
          task_id:todo.learning_unit_id||todo.todo_id,
          at:todo.started_at||new Date(state.activeSession.startAt||Date.now()).toISOString()
        });
      }
      status=window.ReadySetPlanner?.sessionRuntimeStatus?.(state.activeSession.id)||null;
      inProgress=(status?.in_progress||[]).filter(x=>sessionIds.has(x.todo_id));
    }
    if(inProgress.length){
      resumed=true;
      const liveById=new Map(inProgress.map(x=>[x.todo_id,x]));
      state.activeSession.plannerLinks=(state.activeSession.plannerLinks||[])
        .filter(x=>liveById.has(x.todo_id))
        .map(x=>({...x,state:'IN_PROGRESS'}));
    }else{
      state.activeSession=null;
    }
  }

  if(beforeSelected!==state.selectedTodoIds.length||!state.activeSession||resumed)save();
  return {resumed};
}

window.addEventListener('load',()=>{
  renderHome();renderSettings();
  const versionInfo=document.getElementById('readyVersionInfo');
  if(versionInfo) versionInfo.textContent=`APP ${VERSION.app} · MASTER ${VERSION.master} · SCHEMA ${VERSION.schema} · RELEASE ${VERSION.cache}`;
  const recovery=reconcileReadyRuntimeState();
  if(recovery.resumed)nav('focus');
  if(readyPwaSafePoint()) window.dispatchEvent(new CustomEvent('readyset-safe-point'));
});


/* REV_07 compact themed share overlay — preserves the full Ready runtime above. */
function readyShareTheme(){return state.share?.theme==='sail'?'sail':'drop'}
function readyThemeCopy(theme,kind,r=null){
  if(kind==='result'){
    const profile=resultOutcomeProfile(r||{});
    if(!profile.done)return {title:profile.shareTitle,sub:profile.historyLabel};
    return theme==='sail'
      ?{title:'멋진 항해였어요!',sub:'오늘의 섬 탐험 완료'}
      :{title:'오늘의 할 일이 도착했어요!',sub:'오늘의 섬 탐험 완료'};
  }
  return theme==='sail'
    ?{title:'오늘의 할 일을 찾아 항해해볼까?',sub:'바다를 따라 오늘의 섬으로'}
    :{title:'오늘의 할 일을 발견하러 가볼까?',sub:'아래로 내려가 오늘의 섬으로'};
}
function readyDrawIslandScene(x,theme){
  const sky=x.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#64c9ff');sky.addColorStop(1,'#dff7ff');
  x.fillStyle=sky;x.fillRect(0,0,900,430);x.fillStyle='#25aee8';x.fillRect(0,300,900,130);
  x.fillStyle='#55b96a';x.beginPath();x.ellipse(560,300,245,100,0,0,Math.PI*2);x.fill();
  x.fillStyle='#87735e';x.beginPath();x.moveTo(370,305);x.lineTo(750,305);x.lineTo(670,410);x.lineTo(430,410);x.closePath();x.fill();
  x.fillStyle='#fff';x.fillRect(545,220,28,105);x.fillStyle='#ff6a45';x.beginPath();x.moveTo(570,225);x.lineTo(630,245);x.lineTo(570,258);x.fill();
  if(theme==='sail'){
    x.fillStyle='#8a5b35';x.fillRect(145,320,210,18);x.fillStyle='#fff7dc';x.beginPath();x.moveTo(245,150);x.lineTo(245,318);x.lineTo(110,295);x.closePath();x.fill();x.strokeStyle='#7a5a3c';x.lineWidth=7;x.stroke();
  }else{
    x.fillStyle='rgba(255,255,255,.88)';
    for(let i=0;i<5;i++){x.beginPath();x.ellipse(100+i*165,75+(i%2)*45,105,38,0,0,Math.PI*2);x.fill()}
  }
}
async function renderCompactShareCard(kind='result'){
  const r=kind==='result'?resultSource():null,theme=readyShareTheme(),copy=readyThemeCopy(theme,kind,r);
  const c=document.createElement('canvas');c.width=900;c.height=600;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,900,600);readyDrawIslandScene(x,theme);
  x.fillStyle='rgba(255,255,255,.92)';roundRect(x,28,24,238,54,27);x.fill();x.fillStyle='#102d55';x.font='900 27px sans-serif';x.textAlign='left';x.fillText('Ready & Set',55,60);
  x.fillStyle='#0a3265';x.font='900 46px sans-serif';x.fillText(copy.title,40,145);x.font='700 23px sans-serif';x.fillText(copy.sub,42,182);
  await drawAvatar(x,theme==='sail'?300:245,theme==='sail'?325:285,58);
  const tasks=kind==='result'?[...(r?.selected||[]),...(r?.tasks||[])]:currentMissionLabels();
  const profile=kind==='result'?resultOutcomeProfile(r||{}):null;
  const total=Math.max(1,tasks.length),done=kind==='result'&&profile?.done?total:0,focus=kind==='result'&&r?fmt(r.focusMs||0):'00:00',stars=kind==='result'&&profile?.done?Math.max(1,Math.min(30,done*5)):0;
  x.fillStyle='#fff';roundRect(x,0,430,900,170,0);x.fill();x.strokeStyle='#e5edf5';x.lineWidth=2;x.beginPath();x.moveTo(0,430);x.lineTo(900,430);x.stroke();
  const stats=[[kind==='result'?(profile?.done?done+'/'+total:profile.label):total+'개',kind==='result'?(profile?.done?'완료 미션':'결과 상태'):'오늘의 미션'],[focus,'집중 시간'],['+'+stars,'획득 별']];
  stats.forEach((v,i)=>{const cx=150+i*300;x.textAlign='center';x.fillStyle='#0d3569';x.font='900 35px sans-serif';x.fillText(v[0],cx,495);x.fillStyle='#718098';x.font='700 18px sans-serif';x.fillText(v[1],cx,528);if(i<2){x.strokeStyle='#e2e8ef';x.beginPath();x.moveTo(cx+150,458);x.lineTo(cx+150,540);x.stroke()}});
  x.textAlign='left';x.fillStyle='#223d62';x.font='700 18px sans-serif';x.fillText(tasks.slice(0,3).join(' · ')||'오늘의 탐험',35,574);
  return c;
}
async function compactShareCard(kind='result'){
  const c=await renderCompactShareCard(kind);
  const blob=await new Promise(res=>c.toBlob(res,'image/png',.94));
  const file=new File([blob],`Ready_Set_${readyShareTheme()}_${kind}_${Date.now()}.png`,{type:'image/png'});
  const text=kind==='result'?resultOutcomeProfile(resultSource()||{}).shareText:'Ready & Set · 오늘의 탐험을 시작해요!';
  try{
    if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Ready & Set',text});return}
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);toast('공유 카드를 이미지로 저장했어요.');
  }catch(e){if(e.name!=='AbortError')toast('공유를 완료하지 못했어요.')}
}
function buildKakaoFeed({imageUrl,webUrl,kind='result'}={}){
  const r=kind==='result'?resultSource():null,theme=readyShareTheme(),copy=readyThemeCopy(theme,kind,r);
  return {objectType:'feed',content:{title:copy.title,description:kind==='result'?`${copy.sub} · 집중 ${fmt(r?.focusMs||0)}`:copy.sub,imageUrl,link:{mobileWebUrl:webUrl,webUrl}},buttons:[{title:kind==='result'?'탐험 기록 보기':'탐험 응원하기',link:{mobileWebUrl:webUrl,webUrl}}]};
}
window.ReadySetShare={
  renderShareCard:renderCompactShareCard,
  shareCard:compactShareCard,
  buildKakaoFeed,
  setTheme(theme){state.share={...(state.share||{}),theme:theme==='sail'?'sail':'drop'};save();}
};
$('#preShareBtn').onclick=()=>compactShareCard('pre');
$('#missionShareBtn').onclick=()=>compactShareCard('pre');
$('#shareResultBtn').onclick=()=>compactShareCard('result');

/* Accessibility runtime v0.1 — semantics/focus only; no product-flow authority. */
(() => {
  const dialogs = ['categorySheet','soundSheet','pauseSheet','recIntro'];
  let lastFocus = null;

  const focusables = root => [...root.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => !el.hidden && el.getAttribute('aria-hidden') !== 'true');

  function syncPressed(){
    document.querySelectorAll('[data-category],[data-minutes],[data-style],[data-guide-type],[data-guide-voice],[data-sound],[data-weekday]').forEach(el=>{
      el.setAttribute('aria-pressed', el.classList.contains('on') ? 'true' : 'false');
    });
  }

  function syncTabs(){
    document.querySelectorAll('[data-planner-tab]').forEach(tab=>{
      const active=tab.classList.contains('on');
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });
  }

  function openDialog(el){
    if(!el || el.hidden)return;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first=focusables(el)[0];
    first?.focus({preventScroll:true});
  }

  function closeDialog(el){
    if(!el)return;
    requestAnimationFrame(()=>{
      if(lastFocus && document.contains(lastFocus)) lastFocus.focus({preventScroll:true});
      lastFocus=null;
    });
  }

  const observer=new MutationObserver(records=>{
    let stateDirty=false;
    for(const r of records){
      if(r.type==='attributes' && r.attributeName==='hidden' && dialogs.includes(r.target.id)){
        if(r.target.hidden) closeDialog(r.target); else openDialog(r.target);
      }
      if(r.type==='attributes' && r.attributeName==='class') stateDirty=true;
    }
    if(stateDirty){syncPressed();syncTabs();}
  });

  dialogs.forEach(id=>{
    const el=document.getElementById(id);
    if(el)observer.observe(el,{attributes:true,attributeFilter:['hidden']});
  });
  document.querySelectorAll('[data-category],[data-minutes],[data-style],[data-guide-type],[data-guide-voice],[data-sound],[data-weekday],[data-planner-tab]')
    .forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));

  document.addEventListener('keydown',e=>{
    const dialog=dialogs.map(id=>document.getElementById(id)).find(el=>el && !el.hidden);
    if(!dialog)return;
    if(e.key==='Escape'){
      e.preventDefault();
      const closer=dialog.querySelector('[data-close-sheet],[data-close-sound],[data-close-pause],#cancelRecordBtn');
      closer?.click();
      return;
    }
    if(e.key!=='Tab')return;
    const items=focusables(dialog);
    if(items.length===0)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  });

  document.addEventListener('keydown',e=>{
    const tabs=[...document.querySelectorAll('[data-planner-tab]')];
    if(!tabs.includes(document.activeElement))return;
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();
    let i=tabs.indexOf(document.activeElement);
    if(e.key==='Home')i=0;
    else if(e.key==='End')i=tabs.length-1;
    else if(e.key==='ArrowRight')i=(i+1)%tabs.length;
    else i=(i-1+tabs.length)%tabs.length;
    tabs[i].focus();
    tabs[i].click();
  });

  syncPressed();
  syncTabs();
})();
