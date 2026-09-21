
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
const rebuildParentIntakeView=globalThis.ReadyRebuildParentIntakeView||null;
const rebuildCaptureService=globalThis.ReadyRebuildCaptureService||null;
const rebuildCaptureOrchestrator=globalThis.ReadyRebuildCaptureOrchestrator||null;
const rebuildCaptureDraft=globalThis.ReadyRebuildCaptureDraft||null;
const rebuildCaptureView=globalThis.ReadyRebuildCaptureView||null;
const rebuildAssignmentService=globalThis.ReadyRebuildAssignmentService||null;
const rebuildRecordingService=globalThis.ReadyRebuildRecordingService||null;
const rebuildRecordingOrchestrator=globalThis.ReadyRebuildRecordingOrchestrator||null;
const rebuildRecordingView=globalThis.ReadyRebuildRecordingView||null;
const rebuildResultHistoryView=globalThis.ReadyRebuildResultHistoryView||null;
const rebuildResultHistoryController=globalThis.ReadyRebuildResultHistoryController||null;
const rebuildProfileSettingsView=globalThis.ReadyRebuildProfileSettingsView||null;
const rebuildProfileController=globalThis.ReadyRebuildProfileController||null;
const rebuildSettingsController=globalThis.ReadyRebuildSettingsController||null;
const rebuildAuthSyncView=globalThis.ReadyRebuildAuthSyncView||null;
const rebuildHomeView=globalThis.ReadyRebuildHomeView||null;
const rebuildPlannerScreenView=globalThis.ReadyRebuildPlannerScreenView||null;
const rebuildAudioService=globalThis.ReadyRebuildAudioService||null;
const rebuildAccessibility=globalThis.ReadyRebuildAccessibility||null;
const rebuildShareCard=globalThis.ReadyRebuildShareCard||null;
if(!rebuildSession||!rebuildSessionService||!rebuildPlannerProjection||!rebuildPlannerView||!rebuildNavigation||!rebuildPersistence||!rebuildMissionView||!rebuildFocusView||!rebuildPlannerAdminView||!rebuildParentIntakeView||!rebuildCaptureService||!rebuildCaptureOrchestrator||!rebuildCaptureDraft||!rebuildCaptureView||!rebuildAssignmentService||!rebuildRecordingService||!rebuildRecordingOrchestrator||!rebuildRecordingView||!rebuildResultHistoryView||!rebuildResultHistoryController||!rebuildProfileSettingsView||!rebuildProfileController||!rebuildSettingsController||!rebuildAuthSyncView||!rebuildHomeView||!rebuildPlannerScreenView||!rebuildAudioService||!rebuildAccessibility||!rebuildShareCard){
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
    history:()=>resultHistoryRuntime.renderHistory(),
    calendar:()=>resultHistoryRuntime.renderCalendar(),
    planner:()=>renderPlanner(),
    'planner-admin':()=>renderPlannerAdmin(),
    profile:()=>profileRuntime.renderProfile(),
    settings:()=>settingsRuntime.renderSettings(),
    result:()=>resultHistoryRuntime.renderResult()
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
const homeViewRuntime=rebuildHomeView.create({
  query:$,
  formatTime:fmt,
  applyAvatar,
  applyGuide,
  guideData
});
function renderHome(){
  homeViewRuntime.render({state,missionLabels:currentMissionLabels()});
}
function renderChips(root){
  homeViewRuntime.renderChips(root,currentMissionLabels());
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
const audioService=rebuildAudioService.create({
  player:bgm(),
  soundMap:SOUND_MAP,
  onStatus:message=>updateBgmStatus(message||'')
});
function setBgmSource(sound){return audioService.setSource(sound)}
async function playBgm(sound=state.activeSession?.sound||state.sound,{preview=false}={}){
  return audioService.play(sound,{preview});
}
async function fadeAudio(target=0,duration=260){
  return audioService.fade(target,duration);
}
async function pauseBgm({fade=true}={}){
  return audioService.pause({fadeOut:fade});
}
async function resumeBgm(sound=state.activeSession?.sound||state.sound){
  return audioService.resume(sound);
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
  settingsRuntime.renderSettings();
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
  if(recordingRuntime.isRecording()){toast('녹음을 먼저 끝내주세요.');return}
  nav('focus');
  if(state.activeSession?.sound!=='OFF')await resumeBgm(state.activeSession.sound);
};

const recordingView=rebuildRecordingView.create({
  query:$,
  formatTime:fmt,
  applyAvatar,
  applyGuide
});
const recordingRuntime=rebuildRecordingOrchestrator.create({
  recordingService:rebuildRecordingService
});
function renderRecordingContext(){
  recordingView.renderContext({
    sessionTimes,
    state,
    guideData:guideData()
  });
}
$('#recordAction').onclick=async()=>{
  if(recordingRuntime.isRecording()){recordingRuntime.stop();return}
  await startRecording();
};
async function startRecording(){
  await pauseBgm();
  const started=await recordingRuntime.start({
    onTick:ms=>{
      recordingView.renderClock(ms);
      renderRecordingContext();
    },
    onStop:finishRecording
  });
  if(!started.ok){
    const message=started.reason==='UNSUPPORTED'
      ?'이 브라우저는 마이크 녹음을 지원하지 않습니다.'
      :started.reason==='MIC_PERMISSION_DENIED'
        ?'마이크 권한이 필요합니다.'
        :'녹음을 시작할 수 없습니다.';
    toast(message);
    return;
  }
  recordingView.setRecordingActive(true);
}
function chooseGuest(){
  const all=Object.keys(GUIDE_TYPES).filter(x=>x!==state.guide.type);
  const recent=new Set((state.guestHistory||[]).slice(-1));
  let pool=all.filter(x=>!recent.has(x));if(!pool.length)pool=all;
  currentGuestType=pool[Math.floor(Math.random()*pool.length)]||all[0]||'pico';
  state.guestHistory=[...(state.guestHistory||[]),currentGuestType].slice(-4);save();
}
function finishRecording({blob,type,durationMs}={}){
  if(!blob)return;
  chooseGuest();
  recordingView.renderReview({
    audioUrl:URL.createObjectURL(blob),
    mainGuideType:state.guide.type,
    guestGuideType:currentGuestType,
    mainGuideName:state.guide.name,
    guestGuideName:GUIDE_TYPES[currentGuestType].defaultName,
    formatNote:rebuildRecordingService.formatNote(type)
  });
  state.recordingMeta={mime:type,durationMs,guestType:currentGuestType};
  save();
}
$('#rerecordBtn').onclick=()=>{
  recordingRuntime.clearAudio();
  recordingView.resetReview({guideName:state.guide.name});
};
$('#saveRecordingBtn').onclick=async()=>{
  const currentAudio=recordingRuntime.currentAudio();
  if(!currentAudio)return;
  const type=currentAudio.type||'audio/webm';
  const filename=rebuildRecordingService.filenameFor({profileName:state.profile.name||'Judy',date:new Date(),type});
  await rebuildRecordingService.storeAudio(currentAudio,filename,type);
  if(state.activeSession){state.activeSession.recordingDone=true;state.activeSession.guestType=currentGuestType;state.activeSession.recordingMime=type}
  save();toast(`저장 완료 · ${filename}`);
  setTimeout(async()=>{
    nav('focus');
    if(state.activeSession?.sound!=='OFF')await resumeBgm(state.activeSession.sound);
  },450);
};


$$('[data-outcome-state]').forEach(b=>b.onclick=()=>{
  const stateValue=b.dataset.outcomeState;
  $('#outcomeModal').hidden=true;
  completeSession(stateValue);
});
$$('[data-close-outcome]').forEach(b=>b.onclick=()=>{$('#outcomeModal').hidden=true});

const resultHistoryView=rebuildResultHistoryView.create({
  query:$,
  escapeHtml,
  formatTime:fmt,
  applyAvatar,
  applyGuide
});
const resultHistoryRuntime=rebuildResultHistoryController.create({
  view:resultHistoryView,
  getState:()=>state,
  navigate:nav
});
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
const plannerScreenView=rebuildPlannerScreenView.create({
  query:$,
  queryAll:$$,
  escapeHtml,
  localDateKey,
  addDays,
  weekStart,
  itemsForDate:plannerItemsForDate,
  stateLabel:plannerStateLabel
});
function renderPlanner(){
  plannerSelectedDate=plannerSelectedDate||localDateKey();
  window.ReadySetPlanner?.replanReadyCarryOvers?.({date:localDateKey()});
  plannerScreenView.render({
    selectedDate:plannerSelectedDate,
    tab:plannerTab,
    snapshot:plannerSnapshot(),
    isParent:!!window.ReadyFamilySession?.isParent?.()
  });
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
function editSchedule(id){
  const x=plannerSnapshot().schedule_commitments.find(v=>v.commitment_id===id); if(!x)return;
  $('#scheduleId').value=x.commitment_id;
  $('#scheduleTitle').value=x.title||'';
  $('#scheduleCategory').value=x.category||'';
  $('#scheduleDate').value=String(x.start_at||'').slice(0,10);
  $('#scheduleStart').value=String(x.start_at||'').slice(11,16);
  $('#scheduleEnd').value=String(x.end_at||'').slice(11,16);
  $('#scheduleMovable').checked=!!x.planner_movable;
}
function editAvailability(id){
  const x=plannerSnapshot().daily_availability_windows.find(v=>v.availability_id===id); if(!x)return;
  $('#availabilityId').value=x.availability_id;
  $('#availabilityWeekly').checked=x.recurrence==='WEEKLY';
  $('#availabilityDate').value=x.date||localDateKey();
  $('#availabilityWeekday').value=String(x.weekday??1);
  $('#availabilityStart').value=x.start||'';
  $('#availabilityEnd').value=x.end||'';
}
document.getElementById('scheduleClearBtn')?.addEventListener('click',clearScheduleForm);
document.getElementById('availabilityClearBtn')?.addEventListener('click',clearAvailabilityForm);
document.addEventListener('click',e=>{
  const childConfirm=e.target.closest('[data-child-fact-confirm]');
  if(childConfirm){
    if(!requireParentUi())return;
    try{
      const reviewed=window.ReadyAssignments?.reviewChildFact?.(childConfirm.dataset.childFactConfirm,{actor:'PARENT',decision:'CONFIRM'});
      const processed=reviewed?.ok?window.ReadyIntegrationV1?.processAssignment?.(childConfirm.dataset.childFactConfirm,{start_date:localDateKey()}):null;
      toast(processed?.ok?'숙제를 확인했고 Planner가 TODAY 후보를 만들었어요.':reviewed?.ok?'숙제를 확인했어요. Planner 배정 조건을 더 확인해야 합니다.':'숙제 확인을 완료하지 못했어요.');
    }catch(error){toast(error?.message||'숙제 확인을 완료하지 못했어요.')}
    renderPlannerAdmin();renderPlanner();renderMission();return;
  }
  const childReject=e.target.closest('[data-child-fact-reject]');
  if(childReject){
    if(!requireParentUi())return;
    try{
      window.ReadyAssignments?.reviewChildFact?.(childReject.dataset.childFactReject,{actor:'PARENT',decision:'REJECT',reason:'PARENT_REJECTED_CHILD_INPUT'});
      toast('이 CHILD 숙제 제안은 Planner에 보내지 않았어요.');
    }catch(error){toast(error?.message||'숙제 제외를 완료하지 못했어요.')}
    renderPlannerAdmin();renderPlanner();renderMission();return;
  }
  const s=e.target.closest('[data-edit-schedule]'); if(s){editSchedule(s.dataset.editSchedule);return;}
  const a=e.target.closest('[data-edit-availability]'); if(a){editAvailability(a.dataset.editAvailability);return;}
  const ad=e.target.closest('[data-delete-availability]');
  if(ad){
    if(!requireParentUi())return;
    const removed=window.ReadySetPlanner?.removeDailyAvailabilityWindow?.(ad.dataset.deleteAvailability);
    toast(removed?.ok?'학습 가능 시간을 삭제했어요. Planner가 다음 배정부터 사용하지 않습니다.':'학습 가능 시간을 삭제하지 못했어요.');
    clearAvailabilityForm();renderPlannerAdmin();renderPlanner();return;
  }
  const review=e.target.closest('[data-carry-review]');
  if(review){
    if(!requireParentUi())return;
    const result=window.ReadyIntegrationV1?.reviewEscalatedCarryOver?.(review.dataset.carryReview,{start_date:localDateKey()});
    toast(result?.ok?'학습 패턴을 다시 분석하고 Planner를 갱신했어요.':'학습 재검토를 완료하지 못했어요.');
    renderPlannerAdmin();renderPlanner();return;
  }
  const ready=e.target.closest('[data-carry-ready]');
  if(ready){
    if(!requireParentUi())return;
    const id=ready.dataset.carryReady;
    const resolved=window.ReadySetPlanner?.resolveCarryOver?.(id,{resolution:'READY_FOR_REPLAN',actor:'PARENT'});
    if(resolved?.ok){
      const tomorrow=localDateKey(addDays(new Date(),1));
      const replanned=window.ReadySetPlanner?.replanCarryOver?.({carry_over_id:id,date:tomorrow});
      toast(replanned?.ok?'남은 탐험을 다음 일정으로 옮겼어요.':'다시 계획 가능한 상태로 바꿨어요.');
    }else toast('남은 탐험 상태를 변경하지 못했어요.');
    renderPlannerAdmin();renderPlanner();return;
  }
  const cancel=e.target.closest('[data-carry-cancel]');
  if(cancel){
    if(!requireParentUi())return;
    const resolved=window.ReadySetPlanner?.resolveCarryOver?.(cancel.dataset.carryCancel,{resolution:'CANCEL',actor:'PARENT'});
    toast(resolved?.ok?'이 남은 탐험은 종료했어요.':'종료 처리하지 못했어요.');
    renderPlannerAdmin();renderPlanner();return;
  }
});
document.getElementById('saveScheduleBtn')?.addEventListener('click',()=>{
  if(!requireParentUi())return;
  const title=$('#scheduleTitle').value.trim(), date=$('#scheduleDate').value, start=$('#scheduleStart').value, end=$('#scheduleEnd').value;
  if(!title||!date||!start||!end){toast('일정명·날짜·시작·종료 시간을 확인해 주세요.');return;}
  if(end<=start){toast('종료 시간은 시작 시간보다 늦어야 해요.');return;}
  window.ReadySetPlanner.upsertScheduleCommitment({
    commitment_id:$('#scheduleId').value||undefined,
    title,
    category:$('#scheduleCategory').value.trim()||'OTHER',
    start_at:`${date}T${start}:00`,
    end_at:`${date}T${end}:00`,
    confirmed:true,
    planner_movable:$('#scheduleMovable').checked,
    parent_editable:true,
    source:'PARENT_ADMIN_UI'
  });
  toast('고정 일정을 저장했어요.');
  renderPlannerAdmin(); renderPlanner();
});
document.getElementById('saveAvailabilityBtn')?.addEventListener('click',()=>{
  if(!requireParentUi())return;
  const weekly=$('#availabilityWeekly').checked;
  const date=$('#availabilityDate').value,start=$('#availabilityStart').value,end=$('#availabilityEnd').value;
  if((!weekly&&!date)||!start||!end){toast('날짜·시작·종료 시간을 확인해 주세요.');return;}
  if(end<=start){toast('종료 시간은 시작 시간보다 늦어야 해요.');return;}
  window.ReadySetPlanner.upsertDailyAvailabilityWindow({
    availability_id:$('#availabilityId').value||undefined,
    date,start,end,
    recurrence:weekly?'WEEKLY':null,
    weekday:weekly?Number($('#availabilityWeekday').value):null,
    confirmed:true,parent_editable:true,source:'PARENT_ADMIN_UI'
  });
  toast('학습 가능 시간을 확인했어요. Planner가 배정 근거로 사용합니다.');
  renderPlannerAdmin(); renderPlanner();
});
const captureApi=window.ReadyCaptureV01;
const captureService=rebuildCaptureService.create({captureApi});
const captureRuntime=rebuildCaptureOrchestrator.create({captureApi});
function parsePrints(value=''){return captureService.parsePrints(value)}
function stableFactSignature(value){return captureService.stableFactSignature(value)}


let capturePreviewUrls=[];
function clearCapturePreviewUrls(){
  for(const url of capturePreviewUrls){try{URL.revokeObjectURL(url)}catch{}}
  capturePreviewUrls=[];
}
function captureDraftLabel(groupKey=''){
  return String(groupKey).replace('TALENT:','').replace('ENGLISH:','영어 · ');
}
function captureDraftWarnings(draft){
  return Array.isArray(draft?.warnings)?draft.warnings.filter(Boolean):[];
}
function captureDraftConfidence(draft){
  const n=Number(draft?.confidence);
  return Number.isFinite(n)?Math.round(Math.max(0,Math.min(1,n))*100):0;
}
const captureDraftController=rebuildCaptureDraft.create({
  query:$,
  queryAll:$$,
  parsePrints,
  recordCaptureReview,
  toast
});
async function applyCaptureDraft(draft){
  return captureDraftController.apply(draft);
}
async function recordCaptureReview(groupKey,reviewedValue,event='PARENT_REVIEWED'){
  return captureService.recordCaptureReview(groupKey,reviewedValue,event);
}
const captureView=rebuildCaptureView.create({
  query:$,
  escapeHtml,
  captureDraftLabel,
  captureDraftWarnings,
  captureDraftConfidence
});

async function renderCaptureIntake(){
  const summaryRoot=$('#captureGroupSummary'),previewRoot=$('#capturePreviewList');
  if(!summaryRoot||!previewRoot)return;

  clearCapturePreviewUrls();
  const {session,groups,items}=await captureRuntime.loadReview();
  captureView.renderStatus(session);

  if(!session){
    summaryRoot.innerHTML='<div class="plannerEmpty"><b>촬영한 자료가 없어요.</b><small>자료 그룹을 고르고 촬영을 시작하세요.</small></div>';
    previewRoot.innerHTML='';
    captureView.renderReview(null);
    return;
  }

  captureView.renderGroups(groups);

  previewRoot.innerHTML='';
  for(const item of items){
    const card=document.createElement('article');
    card.className='capturePreviewItem';
    const url=item.preview_url;
    if(url)capturePreviewUrls.push(url);
    const label=String(item.group_key||'').replace('TALENT:','').replace('ENGLISH:','영어 · ');
    card.innerHTML=`
      ${url?`<img src="${url}" alt="${escapeHtml(label)} 촬영 미리보기">`:'<div class="capturePreviewPlaceholder">IMAGE</div>'}
      <div><b>${escapeHtml(label)}</b><small>${escapeHtml(item.kind)} · ${Math.max(1,Math.round((item.size||0)/1024))}KB</small></div>
      ${session.status==='TEMP_CAPTURE'?`<button type="button" data-remove-capture="${item.capture_item_id}" aria-label="촬영 삭제">×</button>`:''}
    `;
    previewRoot.appendChild(card);
  }
  captureView.renderReview(session);
}




async function captureFiles(files){
  if(!files?.length)return;
  if(!requireParentUi())return;
  const group=$('#captureGroupSelect')?.value||'TALENT:연산';
  const kind=$('#captureKindSelect')?.value||'RANGE';
  const created=await captureRuntime.addFiles(files,{group_key:group,kind});
  toast(created.length===1?'촬영 자료를 임시저장했어요.':`${created.length}장 임시저장했어요.`);
  await renderCaptureIntake();
}

document.getElementById('homeworkCameraInput')?.addEventListener('change',async e=>{
  const files=e.target.files;
  await captureFiles(files);
  e.target.value='';
});
document.getElementById('homeworkGalleryInput')?.addEventListener('change',async e=>{
  const files=e.target.files;
  await captureFiles(files);
  e.target.value='';
});
document.getElementById('captureGroupSelect')?.addEventListener('change',async()=>{
  await captureRuntime.setTarget($('#captureGroupSelect').value,$('#captureKindSelect').value);
});
document.getElementById('captureKindSelect')?.addEventListener('change',async()=>{
  await captureRuntime.setTarget($('#captureGroupSelect').value,$('#captureKindSelect').value);
});
document.addEventListener('click',async e=>{
  const linkItem=e.target.closest('[data-link-capture-item]');
  if(linkItem){
    const result=await captureRuntime.resolveDisposition(linkItem.dataset.linkCaptureItem,{
      disposition:'LINKED_TO_REVIEW_DRAFT',
      review_draft_id:linkItem.dataset.reviewDraftId
    });
    toast(result?.ok?'촬영 원본을 현재 검토 초안에 연결했어요.':'촬영 원본 연결을 완료하지 못했습니다.');
    await renderCaptureIntake();
    return;
  }
  const ignoreItem=e.target.closest('[data-ignore-capture-item]');
  if(ignoreItem){
    const result=await captureRuntime.resolveDisposition(ignoreItem.dataset.ignoreCaptureItem,{
      disposition:'IGNORED_WITH_REASON',
      reason:'PARENT_MARKED_NOT_ASSIGNMENT_SOURCE'
    });
    toast(result?.ok?'숙제 FACT에 사용하지 않는 원본으로 기록했어요.':'분석 제외 처리를 완료하지 못했습니다.');
    await renderCaptureIntake();
    return;
  }
  const apply=e.target.closest('[data-apply-capture-draft]');
  if(apply){
    const drafts=$('#captureReviewDrafts')?._drafts||[];
    await applyCaptureDraft(drafts[Number(apply.dataset.applyCaptureDraft)]);
    return;
  }
  const btn=e.target.closest('[data-remove-capture]');
  if(!btn)return;
  await captureRuntime.removeItem(btn.dataset.removeCapture);
  toast('촬영 자료를 삭제했어요.');
  await renderCaptureIntake();
});
document.getElementById('captureReanalyzeBtn')?.addEventListener('click',async()=>{
  if(!requireParentUi())return;
  const result=await captureRuntime.requestAnalysis();
  if(!result?.ok){
    toast('재분석에 실패했습니다. 기존 초안과 원본은 그대로 보존돼요.');
    await renderCaptureIntake();
    return;
  }
  toast('새 분석 초안을 만들었어요. 이전 초안은 이력으로 보존됩니다.');
  await renderCaptureIntake();
});

document.getElementById('captureAnalyzeBtn')?.addEventListener('click',async()=>{
  if(!requireParentUi())return;
  const result=await captureRuntime.requestAnalysis();
  if(!result?.ok){
    const reason=result?.result?.reason||result?.reason;
    const message=reason==='ANALYSIS_PROVIDER_NOT_CONFIGURED'
      ? '분석 서버 키가 아직 설정되지 않았습니다. 원본은 그대로 보존했어요.'
      : reason==='PARENT_AUTH_REQUIRED'
        ? 'Parent 로그인 후 분석할 수 있습니다.'
        : reason==='NO_CAPTURE_ITEMS'
          ? '먼저 자료를 촬영해 주세요.'
          : '분석에 실패했습니다. 원본은 보존되어 다시 시도할 수 있어요.';
    toast(message);
    await renderCaptureIntake();
    return;
  }
  toast(result.analysis_state==='ANALYSIS_COMPLETE'?'분석 초안이 준비됐어요. Parent 검토가 필요합니다.':'저장하고 분석을 시작했어요.');
  await renderCaptureIntake();
});

async function capturedRefs(groupKey){
  return captureService.capturedRefs(groupKey);
}

const assignmentService=rebuildAssignmentService.create({
  assignments:window.ReadyAssignments,
  capture:captureApi,
  integration:window.ReadyIntegrationV1,
  captureService,
  localDateKey,
  talentBooks:TALENT_BOOKS
});
const parentIntakeView=rebuildParentIntakeView.create({
  query:$,
  escapeHtml,
  talentBooks:TALENT_BOOKS,
  localDateKey
});
function renderParentIntake(){
  parentIntakeView.render({
    assignments:window.ReadyAssignments,
    learningMasterVersion:window.ReadyLearningMasterV01?.version||'0.5.1'
  });
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
      provenance:reviewProvenance
        ?{kind:'PARENT_REVIEWED_CAPTURE',surface:'PARENT_INTAKE',capture_review:reviewProvenance}
        :{kind:'PARENT_INPUT',surface:'PARENT_INTAKE'}
    });
  }
  const result=await assignmentService.saveTalent({source,deadline,books});
  if(!result.ok){
    if(result.reason==='TALENT_RANGE_MISSING'){toast('재능 6권의 숙제 범위를 모두 입력해 주세요.');return}
    if(result.reason==='CAPTURE_REVIEW_UNRESOLVED'){toast(`${result.subject||'재능'} 촬영 원본 ${result.unresolved_count||0}건을 먼저 연결하거나 분석 제외로 처리해 주세요.`);return}
    if(result.reason==='DUPLICATE_TALENT_FACT'){toast('같은 재능 FACT가 이미 저장·확정되어 있어 중복 생성하지 않았어요.');return}
    toast('재능 FACT 저장 조건을 확인해 주세요.');return;
  }
  toast(`재능 6권 분석 완료 · Planner가 ${result.todoCount}개 탐험을 배정했어요${result.held?` · 보류 ${result.held}건`:''}.`);
  renderParentIntake();renderPlanner();renderMission();
});
document.getElementById('saveEnglishFactBtn')?.addEventListener('click',async()=>{
  if(!requireParentUi())return;
  const name=$('#englishWorkbook').value.trim();
  const range=$('#englishRange').value.trim();
  if(!name||!range){toast('문제집과 숙제 범위를 확인해 주세요.');return}
  const result=await assignmentService.saveEnglish({
    name,
    range,
    nextAcademy:$('#englishNextAcademy').value,
    weekdayPrints:parsePrints($('#englishPrints').value),
    components:{
      vocabulary:$('#englishVocabulary').value.trim(),
      listening:$('#englishListening').value.trim(),
      recording:$('#englishRecording').value.trim(),
      writing:$('#englishWriting').value.trim()
    },
    teacherInstruction:$('#englishInstruction').value.trim(),
    sourceDate:localDateKey()
  });
  if(!result.ok){
    if(result.reason==='DUPLICATE_ENGLISH_FACT'){toast('같은 영어 FACT가 이미 저장·확정되어 있어 중복 생성하지 않았어요.');return}
    if(result.reason==='CAPTURE_REVIEW_UNRESOLVED'){toast(`영어 촬영 원본 ${result.unresolved_count||0}건을 먼저 연결하거나 분석 제외로 처리해 주세요.`);return}
    toast('영어 FACT 저장 조건을 확인해 주세요.');return;
  }
  const fact=result.fact,processed=result.processed;
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

const authSyncView=rebuildAuthSyncView.create({query:$});
const profileSettingsView=rebuildProfileSettingsView.create({
  query:$,
  queryAll:$$,
  initials,
  styleFilter,
  guideData,
  applyGuide,
  renderNameSuggestions:reroll=>settingsRuntime.renderNameSuggestions(reroll),
  renderAuthStatus,
  renderSyncStatus
});
const profileRuntime=rebuildProfileController.create({
  view:profileSettingsView,
  getState:()=>state,
  save,
  toast,
  renderHome
});
$('#cameraInput').onchange=e=>profileRuntime.loadPhoto(e.target.files[0]);
$('#galleryInput').onchange=e=>profileRuntime.loadPhoto(e.target.files[0]);
$$('[data-style]').forEach(b=>b.onclick=()=>profileRuntime.setStyle(b.dataset.style));
$('#saveProfileBtn').onclick=()=>profileRuntime.saveProfile({
  name:$('#profileName').value,
  shareAvatar:$('#shareAvatarOptIn').checked
});



function renderAuthStatus(){
  authSyncView.renderAuth(familySession());
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
  const status=adapter.status();
  const [outbox,conflicts]=await Promise.all([local.outbox(),local.conflicts()]);
  const pending=outbox.filter(x=>!['SENT','SUPERSEDED'].includes(x.status)).length;
  const openConflicts=conflicts.filter(x=>x.status==='OPEN').length;
  authSyncView.renderSync({status,pending,conflicts:openConflicts});
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

const settingsRuntime=rebuildSettingsController.create({
  view:profileSettingsView,
  getState:()=>state,
  save,
  toast,
  renderHome,
  renderMission,
  guideData,
  guideNamePool:GUIDE_NAME_POOL,
  query:$,
  playBgm,
  pauseBgm
});
$('#guideNameInput').onchange=e=>settingsRuntime.setGuideName(e.target.value);
$$('[data-guide-type]').forEach(b=>b.onclick=()=>settingsRuntime.setGuideType(b.dataset.guideType));
$('#recommendNameBtn').onclick=()=>settingsRuntime.renderNameSuggestions(true);
$$('[data-guide-voice]').forEach(b=>b.onclick=()=>settingsRuntime.setGuideVoice(b.dataset.guideVoice));
$('#voicePreviewBtn').onclick=()=>settingsRuntime.speakGuide(`${state.guide.name}야. 오늘 작전도 네 옆에서 같이 갈게.`);
$('#coachVoiceBtn').onclick=()=>settingsRuntime.speakGuide($('#duoText').textContent||'오늘 녹음을 끝까지 잘 마쳤어.');
$$('[data-sound]').forEach(b=>b.onclick=()=>settingsRuntime.setSound(b.dataset.sound));

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
  renderHome();settingsRuntime.renderSettings();
  const versionInfo=document.getElementById('readyVersionInfo');
  if(versionInfo) versionInfo.textContent=`APP ${VERSION.app} · MASTER ${VERSION.master} · SCHEMA ${VERSION.schema} · RELEASE ${VERSION.cache}`;
  const recovery=reconcileReadyRuntimeState();
  if(recovery.resumed)nav('focus');
  if(readyPwaSafePoint()) window.dispatchEvent(new CustomEvent('readyset-safe-point'));
});


/* REV_07 compact themed share overlay — runtime-owned after rebuild migration. */
function readyShareTheme(){return state.share?.theme==='sail'?'sail':'drop'}
const shareCardRuntime=rebuildShareCard.create({
  drawAvatar,
  currentMissionLabels,
  resultSource:()=>resultHistoryRuntime.resultSource(),
  resultOutcomeProfile:record=>resultHistoryRuntime.outcomeProfile(record),
  shareTheme:readyShareTheme,
  formatTime:fmt,
  roundRect,
  toast
});
function buildKakaoFeed({imageUrl,webUrl,kind='result'}={}){
  const r=kind==='result'?resultHistoryRuntime.resultSource():null,theme=readyShareTheme(),copy=shareCardRuntime.themeCopy(theme,kind,r);
  const description=kind==='result'?copy.sub+' · 집중 '+fmt(r?.focusMs||0):copy.sub;
  return {objectType:'feed',content:{title:copy.title,description,imageUrl,link:{mobileWebUrl:webUrl,webUrl}},buttons:[{title:kind==='result'?'탐험 기록 보기':'탐험 응원하기',link:{mobileWebUrl:webUrl,webUrl}}]};
}
window.ReadySetShare={
  renderShareCard:kind=>shareCardRuntime.render(kind),
  shareCard:kind=>shareCardRuntime.share(kind),
  buildKakaoFeed,
  setTheme(theme){state.share={...(state.share||{}),theme:theme==='sail'?'sail':'drop'};save();}
};
$('#preShareBtn').onclick=()=>shareCardRuntime.share('pre');
$('#missionShareBtn').onclick=()=>shareCardRuntime.share('pre');
$('#shareResultBtn').onclick=()=>shareCardRuntime.share('result');

rebuildAccessibility.install();
