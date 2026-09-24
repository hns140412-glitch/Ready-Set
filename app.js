
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
const rebuildSessionRecoveryController=globalThis.ReadyRebuildSessionRecoveryController||null;
const rebuildSessionCompletionController=globalThis.ReadyRebuildSessionCompletionController||null;
const rebuildPlannerProjection=globalThis.ReadyRebuildPlannerProjection||null;
const rebuildPlannerView=globalThis.ReadyRebuildPlannerView||null;
const rebuildNavigation=globalThis.ReadyRebuildNavigation||null;
const rebuildPersistence=globalThis.ReadyRebuildAppPersistence||null;
const rebuildMissionView=globalThis.ReadyRebuildMissionView||null;
const rebuildMissionController=globalThis.ReadyRebuildMissionController||null;
const rebuildFocusView=globalThis.ReadyRebuildFocusView||null;
const rebuildMissionFocusController=globalThis.ReadyRebuildMissionFocusController||null;
const rebuildPlannerAdminView=globalThis.ReadyRebuildPlannerAdminView||null;
const rebuildPlannerAdminController=globalThis.ReadyRebuildPlannerAdminController||null;
const rebuildPlannerQueryController=globalThis.ReadyRebuildPlannerQueryController||null;
const rebuildParentIntakeView=globalThis.ReadyRebuildParentIntakeView||null;
const rebuildCaptureService=globalThis.ReadyRebuildCaptureService||null;
const rebuildCaptureOrchestrator=globalThis.ReadyRebuildCaptureOrchestrator||null;
const rebuildCaptureIntakeController=globalThis.ReadyRebuildCaptureIntakeController||null;
const rebuildCaptureDraft=globalThis.ReadyRebuildCaptureDraft||null;
const rebuildCaptureView=globalThis.ReadyRebuildCaptureView||null;
const rebuildAssignmentService=globalThis.ReadyRebuildAssignmentService||null;
const rebuildAssignmentIntakeController=globalThis.ReadyRebuildAssignmentIntakeController||null;
const rebuildRecordingService=globalThis.ReadyRebuildRecordingService||null;
const rebuildRecordingOrchestrator=globalThis.ReadyRebuildRecordingOrchestrator||null;
const rebuildRecordingController=globalThis.ReadyRebuildRecordingController||null;
const rebuildRecordingView=globalThis.ReadyRebuildRecordingView||null;
const rebuildResultHistoryView=globalThis.ReadyRebuildResultHistoryView||null;
const rebuildResultHistoryController=globalThis.ReadyRebuildResultHistoryController||null;
const rebuildProfileSettingsView=globalThis.ReadyRebuildProfileSettingsView||null;
const rebuildProfileController=globalThis.ReadyRebuildProfileController||null;
const rebuildLearnerContext=globalThis.ReadyRebuildLearnerContext||null;
const rebuildSettingsController=globalThis.ReadyRebuildSettingsController||null;
const rebuildAuthSyncView=globalThis.ReadyRebuildAuthSyncView||null;
const rebuildAuthSyncController=globalThis.ReadyRebuildAuthSyncController||null;
const rebuildHomeView=globalThis.ReadyRebuildHomeView||null;
const rebuildPlannerScreenView=globalThis.ReadyRebuildPlannerScreenView||null;
const rebuildPlannerScreenController=globalThis.ReadyRebuildPlannerScreenController||null;
const rebuildAudioService=globalThis.ReadyRebuildAudioService||null;
const rebuildAccessibility=globalThis.ReadyRebuildAccessibility||null;
const rebuildAppBootstrapController=globalThis.ReadyRebuildAppBootstrapController||null;
const rebuildShareCard=globalThis.ReadyRebuildShareCard||null;
if(!rebuildSession||!rebuildSessionService||!rebuildSessionCompletionController||!rebuildPlannerProjection||!rebuildPlannerView||!rebuildNavigation||!rebuildPersistence||!rebuildMissionView||!rebuildMissionController||!rebuildFocusView||!rebuildMissionFocusController||!rebuildPlannerAdminView||!rebuildPlannerAdminController||!rebuildPlannerQueryController||!rebuildParentIntakeView||!rebuildCaptureService||!rebuildCaptureOrchestrator||!rebuildCaptureIntakeController||!rebuildCaptureDraft||!rebuildCaptureView||!rebuildAssignmentService||!rebuildAssignmentIntakeController||!rebuildRecordingService||!rebuildRecordingOrchestrator||!rebuildRecordingController||!rebuildRecordingView||!rebuildResultHistoryView||!rebuildResultHistoryController||!rebuildProfileSettingsView||!rebuildProfileController||!rebuildLearnerContext||!rebuildSettingsController||!rebuildAuthSyncView||!rebuildAuthSyncController||!rebuildHomeView||!rebuildPlannerScreenView||!rebuildPlannerScreenController||!rebuildAudioService||!rebuildAccessibility||!rebuildAppBootstrapController||!rebuildShareCard){
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
  profile:{name:'',birthdate:'',photo:'',style:'editorial',shareAvatar:false,characterVisualId:null},
  guide:{type:'lumi',name:'루미',voice:'warm'},
  guestHistory:[],
  selected:[],
  tasks:[],
  eventTasks:[],
  selectedTodoIds:[],
  targetMin:25,
  sound:'집중 피아노',
  records:[],
  activeSession:null,
  recordingMeta:null
};

const appPersistence=rebuildPersistence.create({
  initial,
  storageKey:()=>globalThis.ReadyMemberScope?.storageKey?.('readyset_state')||'readyset_state',
  localFirst:window.ReadySetLocalFirst,
  safePoint:appState=>!appState?.activeSession
});
let state=appPersistence.load();
const learnerContextRuntime=rebuildLearnerContext.create({
  getBirthdate:()=>state.profile?.birthdate||'',
  dateKey:()=>new Date().toLocaleDateString('sv-SE')
});
globalThis.ReadySetLearnerContext=learnerContextRuntime;
let previewTimer=null;
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
    'planner-admin':()=>plannerAdminRuntime.render(),
    profile:()=>profileRuntime.renderProfile(),
    settings:()=>settingsRuntime.renderSettings(),
    result:()=>resultHistoryRuntime.renderResult()
  }
});
function nav(name){
  return appNavigation.show(name);
}

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

const plannerQueryRuntime=rebuildPlannerQueryController.create({
  planner:()=>window.ReadySetPlanner,
  projection:rebuildPlannerProjection,
  plannerView:rebuildPlannerView
});
function currentPlannerMissionItems(){
  const today=plannerQueryRuntime.todayProjection();
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

const missionControllerRuntime=rebuildMissionController.create({
  query:$,
  queryAll:$$,
  getState:()=>state,
  save,
  categories,
  assignments:()=>window.ReadyAssignments,
  plannerQuery:plannerQueryRuntime,
  view:missionView,
  renderHome,
  renderChips,
  toast
});
missionControllerRuntime.bind();
function currentPlannerMissionItems(){return missionControllerRuntime.currentMissionItems();}
function currentMissionLabels(){return missionControllerRuntime.currentMissionLabels();}
function renderPlannerToday(){return missionControllerRuntime.renderPlannerToday();}
function removeEventTask(eventTaskId){return missionControllerRuntime.removeEventTask(eventTaskId);}
function renderMission(){return missionControllerRuntime.render();}

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
const missionFocusRuntime=rebuildMissionFocusController.create({
  query:$,
  queryAll:$$,
  getState:()=>state,
  save,
  sessionService:rebuildSessionService,
  sessionDomain:rebuildSession,
  planner:()=>window.ReadySetPlanner,
  nav,
  toast,
  renderMission,
  renderFocus:()=>renderFocus(),
  renderSettings:()=>settingsRuntime.renderSettings(),
  playBgm,
  pauseBgm,
  resumeBgm,
  completeSession:stateValue=>completeSession(stateValue)
});
missionFocusRuntime.bind();

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

const sessionCompletionRuntime=rebuildSessionCompletionController.create({
  getState:()=>state,
  save,
  pauseBgm,
  sessionTimes,
  sessionService:rebuildSessionService,
  sessionDomain:rebuildSession,
  planner:()=>window.ReadySetPlanner,
  nav,
  toast
});
function finishSessionRecord(options={}){
  return sessionCompletionRuntime.finishRecord(options);
}
function completeSessionFromTaskOutcomes(taskOutcomes=[]){
  return sessionCompletionRuntime.completeFromTaskOutcomes(taskOutcomes);
}
function completeSession(outcomeState='COMPLETED'){
  return sessionCompletionRuntime.complete(outcomeState);
}

const recordingView=rebuildRecordingView.create({
  query:$,
  formatTime:fmt,
  applyAvatar,
  applyGuide
});
const recordingRuntime=rebuildRecordingOrchestrator.create({
  recordingService:rebuildRecordingService
});
const recordingControllerRuntime=rebuildRecordingController.create({
  query:$,
  getState:()=>state,
  save,
  view:recordingView,
  runtime:recordingRuntime,
  service:rebuildRecordingService,
  guideTypes:GUIDE_TYPES,
  guideData:()=>guideData(),
  sessionTimes,
  applyGuide,
  pauseBgm,
  resumeBgm,
  nav,
  toast
});
recordingControllerRuntime.bind();
function renderRecordingContext(){
  return recordingControllerRuntime.renderContext();
}



const resultHistoryView=rebuildResultHistoryView.create({
  query:$,
  escapeHtml,
  formatTime:fmt,
  applyAvatar,
  applyGuide,
  loadRecording:id=>rebuildRecordingService.loadAudio(id)
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
plannerSelectedDate=plannerSelectedDate||localDateKey();
const plannerScreenView=rebuildPlannerScreenView.create({
  query:$,
  queryAll:$$,
  escapeHtml,
  localDateKey,
  addDays,
  weekStart,
  itemsForDate:(date,snap)=>plannerQueryRuntime.itemsForDate(date,snap),
  freeWindowsForDate:date=>plannerQueryRuntime.freeWindowsForDate(date),
  stateLabel:value=>plannerQueryRuntime.stateLabel(value)
});
const plannerScreenRuntime=rebuildPlannerScreenController.create({
  view:plannerScreenView,
  planner:()=>window.ReadySetPlanner,
  plannerQuery:plannerQueryRuntime,
  familySession:()=>window.ReadyFamilySession,
  localDateKey,
  getSelectedDate:()=>plannerSelectedDate,
  setSelectedDate:value=>{plannerSelectedDate=value;},
  getTab:()=>plannerTab
});
function renderPlanner(){
  return plannerScreenRuntime.render();
}
const plannerAdminView=rebuildPlannerAdminView.create({
  query:$,
  escapeHtml
});
const plannerAdminRuntime=rebuildPlannerAdminController.create({
  view:plannerAdminView,
  planner:()=>window.ReadySetPlanner,
  integration:()=>window.ReadyIntegrationV1,
  query:$,
  eventTarget:document,
  requireParentUi,
  localDateKey,
  addDays,
  nav,
  toast,
  renderParentIntake,
  renderPlanner
});
plannerAdminRuntime.bind();


const captureApi=window.ReadyCaptureV01;
const captureService=rebuildCaptureService.create({captureApi});
const captureRuntime=rebuildCaptureOrchestrator.create({captureApi});
function parsePrints(value=''){return captureService.parsePrints(value)}
function stableFactSignature(value){return captureService.stableFactSignature(value)}


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

const captureIntakeRuntime=rebuildCaptureIntakeController.create({
  query:$,
  eventTarget:document,
  runtime:captureRuntime,
  view:captureView,
  applyDraft:applyCaptureDraft,
  requireParentUi,
  toast,
  escapeHtml
});
captureIntakeRuntime.bind();
async function renderCaptureIntake(){
  return captureIntakeRuntime.render();
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

let assignmentIntakeRuntime=null;
function renderParentIntake(){
  return assignmentIntakeRuntime?.render();
}
assignmentIntakeRuntime=rebuildAssignmentIntakeController.create({
  query:$,
  queryAll:$$,
  eventTarget:document,
  assignments:()=>window.ReadyAssignments,
  integration:()=>window.ReadyIntegrationV1,
  learningMaster:()=>window.ReadyLearningMasterV01,
  assignmentService,
  parentView:parentIntakeView,
  captureService,
  renderCapture:()=>renderCaptureIntake(),
  requireParentUi,
  localDateKey,
  parsePrints,
  toast,
  renderPlanner,
  renderMission,
  talentBooks:TALENT_BOOKS
});
assignmentIntakeRuntime.bind();

const authSyncView=rebuildAuthSyncView.create({query:$});
const profileSettingsView=rebuildProfileSettingsView.create({
  query:$,
  queryAll:$$,
  initials,
  styleFilter,
  guideData,
  applyGuide,
  renderNameSuggestions:reroll=>settingsRuntime.renderNameSuggestions(reroll),
  renderAuthStatus:()=>authSyncRuntime?.renderAuthStatus(),
  renderSyncStatus:()=>authSyncRuntime?.renderSyncStatus()
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
  birthdate:$('#profileBirthdate').value,
  shareAvatar:$('#shareAvatarOptIn').checked
});



const authSyncRuntime=rebuildAuthSyncController.create({
  view:authSyncView,
  query:$,
  familySession,
  familyApi:()=>window.ReadyFamilySession,
  syncAdapter:()=>window.ReadySetSyncAdapter,
  localFirst:()=>window.ReadySetLocalFirst,
  requireParentUi,
  renderPlanner,
  toast,
  eventTarget:window
});
authSyncRuntime.bind();

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
    const scoped=globalThis.ReadyMemberScope?.storageKey?.bind(globalThis.ReadyMemberScope)||((x)=>x);
    ['readyset_state','readyset_planner_v1','readyset_assignments_v2'].forEach(k=>localStorage.removeItem(scoped(k)));
    location.reload();
  }
};
function escapeHtml(s){
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

const sessionRecoveryRuntime=rebuildSessionRecoveryController.create({
  getState:()=>state,
  save,
  planner:()=>window.ReadySetPlanner,
  plannerQuery:plannerQueryRuntime,
  localDateKey
});

const appBootstrapRuntime=rebuildAppBootstrapController.create({
  query:$,
  queryAll:$$,
  eventTarget:window,
  documentTarget:document,
  nav,
  renderPlanner,
  renderFocus,
  getActiveSession:()=>state.activeSession,
  localDateKey,
  getPlannerTab:()=>plannerTab,
  setPlannerTab:value=>{plannerTab=value;},
  getPlannerSelectedDate:()=>plannerSelectedDate,
  setPlannerSelectedDate:value=>{plannerSelectedDate=value;},
  renderHome,
  renderSettings:()=>settingsRuntime.renderSettings(),
  versionText:()=>`APP ${VERSION.app} · MASTER ${VERSION.master} · SCHEMA ${VERSION.schema} · RELEASE ${VERSION.cache}`,
  recovery:()=>sessionRecoveryRuntime.reconcile(),
  readyPwaSafePoint
});
appBootstrapRuntime.bind();

let activeAppStateKey=appPersistence.currentKey();
window.addEventListener('readyset-family-session',()=>{
  const nextKey=appPersistence.currentKey();
  if(nextKey===activeAppStateKey)return;
  activeAppStateKey=nextKey;
  state=appPersistence.load();
  plannerSelectedDate=null;
  sessionRecoveryRuntime.reconcile();
  renderHome();
  if(document.querySelector('#plannerView')?.classList.contains('active'))renderPlanner();
  if(document.querySelector('#profileView')?.classList.contains('active'))profileRuntime.renderProfile();
  if(document.querySelector('#settingsView')?.classList.contains('active'))settingsRuntime.renderSettings();
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
