import fs from 'node:fs';
import vm from 'node:vm';

function loadSource(path){
  return fs.readFileSync(path,'utf8');
}
async function importSource(path){
  const source=loadSource(path);
  const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
  return import(url);
}
function assert(name,cond){
  if(!cond) throw new Error('FAIL '+name);
  console.log('PASS '+name);
}

const storeMod=await importSource('src/core/state-store.js');
const shellMod=await importSource('src/shell/app-shell.js');
const gateMod=await importSource('src/integrations/contract-gate.js');

const store=storeMod.createStateStore({count:0},{app:'ready-set'});
let observed=null;
const off=store.subscribe((next,event,prev)=>{observed={next,event,prev};});
store.update(draft=>{draft.count+=1;},{reason:'REBUILD_TEST'});
assert('store-update',store.snapshot().count===1);
assert('store-revision',store.revision()===1);
assert('store-observer',observed?.event?.type==='STATE_REPLACED'&&observed.prev.count===0&&observed.next.count===1);
off();

const shell=shellMod.createAppShell({app:'ready-set'});
const trace=[];
shell.registerView('home',{render:()=>trace.push('render-home'),enter:()=>trace.push('enter-home'),leave:()=>trace.push('leave-home')});
shell.registerView('work',{render:()=>trace.push('render-work'),enter:()=>trace.push('enter-work')});
await shell.show('home');
await shell.show('work');
assert('shell-active-view',shell.activeView()==='work');
assert('shell-lifecycle',trace.join('|')==='render-home|enter-home|leave-home|render-work|enter-work');

const gate=gateMod.createIntegrationGate({app:'ready-set',allowedContractVersions:['READY_LEARNING_CONTEXT_V1']});
assert('contract-allow',gate.validateContract({contract_version:'READY_LEARNING_CONTEXT_V1'}).ok===true);
assert('contract-fail-closed',gate.validateContract({contract_version:'UNKNOWN'}).ok===false);
assert('contract-no-object',gate.validateContract(null).ok===false);


const legacyPlanner=loadSource('ready-planner-v01.js');
const plannerMod=await importSource('src/planner/planner-domain.js');
assert('planner-map-help',plannerMod.mapReadyState('WAITING_FOR_PARENT')==='WAITING_FOR_PARENT');
assert('planner-map-blocked',plannerMod.mapReadyState('BLOCKED')==='BLOCKED');
assert('planner-invalid-state',plannerMod.mapReadyState('NOPE')===null);
assert('planner-session-conflict',plannerMod.validateSessionOwnership({active_session_id:'A'},'B').reason==='SESSION_OWNERSHIP_CONFLICT');
assert('planner-finishability',plannerMod.canFinishTodo({state:'IN_PROGRESS'})===true&&plannerMod.canFinishTodo({state:'PLANNED'})===false);
assert('planner-parity-ready-map',legacyPlanner.includes("WAITING_FOR_PARENT:'WAITING_FOR_PARENT'")&&legacyPlanner.includes("BLOCKED:'BLOCKED'"));
assert('planner-parity-ownership',legacyPlanner.includes("'SESSION_OWNERSHIP_CONFLICT'"));


const outcomeMod=await importSource('src/planner/outcome-policy.js');
assert('carry-partial',outcomeMod.carryPolicyForState('PARTIAL').carryEligible===true);
assert('carry-help-resolution',outcomeMod.carryPolicyForState('WAITING_FOR_PARENT').resolutionRequired===true);
assert('carry-completed-resolves',outcomeMod.carryPolicyForState('COMPLETED').resolvesOpenCarry===true);
assert('carry-escalate-deadline',outcomeMod.carryEscalation({nextDepth:1,deadline:'2026-09-20',targetDate:'2026-09-21'}).reason==='DEADLINE_EXCEEDED');
const runtimeContext={};vm.createContext(runtimeContext);vm.runInContext(loadSource('src/planner/planner-policy-runtime.js'),runtimeContext);
const livePolicy=runtimeContext.ReadyRebuildPlannerPolicy;
assert('carry-runtime-policy-live',livePolicy?.carryPolicyForState('PARTIAL').carryEligible===true&&livePolicy?.carryPolicyForState('WAITING_FOR_PARENT').resolutionRequired===true);
assert('carry-runtime-escalation-live',livePolicy?.carryEscalation({nextDepth:1,deadline:'2026-09-20',targetDate:'2026-09-21'}).reason==='DEADLINE_EXCEEDED');
assert('carry-inline-duplicate-removed',!legacyPlanner.includes("const carryEligible=['PARTIAL','DEFERRED'].includes(mapped)")&&!legacyPlanner.includes("const carryNeedsResolution=['BLOCKED','WAITING_FOR_PARENT'].includes(mapped)"));


const plannerRuntime=loadSource('src/planner/planner-policy-runtime.js');
const plannerSource=loadSource('ready-planner-v01.js');
const indexSource=loadSource('index.html');
assert('planner-runtime-global',plannerRuntime.includes('ReadyRebuildPlannerPolicy'));
assert('planner-runtime-loaded-before-planner',indexSource.indexOf('src/planner/planner-policy-runtime.js')>0&&indexSource.indexOf('src/planner/planner-policy-runtime.js')<indexSource.indexOf('ready-planner-v01.js'));
assert('planner-wired-map-state',plannerSource.includes('rebuildPolicy?.mapReadyState'));
assert('planner-wired-session-ownership',plannerSource.includes('rebuildPolicy?.validateSessionOwnership'));
assert('planner-wired-finishability',plannerSource.includes('rebuildPolicy?.canFinishTodo'));
assert('planner-wired-carry-policy',plannerSource.includes('rebuildPolicy?.carryPolicyForState'));
assert('planner-wired-carry-escalation',plannerSource.includes('rebuildPolicy?.carryEscalation'));


const projectionSource=loadSource('src/planner/planner-projection-runtime.js');
const projectionContext={};vm.createContext(projectionContext);vm.runInContext(projectionSource,projectionContext);
const projection=projectionContext.ReadyRebuildPlannerProjection;
const projected=projection.todayItem({todo_id:'t1',label:'숙제',state:'PLANNED',source:'PLANNER_V2_ALLOCATION',estimated_minutes:null,activity_types:['RECALL']});
assert('planner-projection-runtime-live',projected.todo_id==='t1'&&projected.planner_owned===true&&projected.activity_types[0]==='RECALL');
const weekly=projection.availabilityWindow({availability_id:'a1',recurrence:'WEEKLY',weekday:2,start:'15:00',end:'17:00'},{id:'a1',now:'2026-09-21T00:00:00.000Z'});
assert('planner-availability-runtime-live',weekly.date===null&&weekly.weekday===2&&weekly.recurrence==='WEEKLY');
assert('planner-projection-loaded-before-planner',indexSource.indexOf('src/planner/planner-projection-runtime.js')>0&&indexSource.indexOf('src/planner/planner-projection-runtime.js')<indexSource.indexOf('ready-planner-v01.js'));
assert('planner-wired-projection',plannerSource.includes('rebuildProjection?.todayItem'));
assert('planner-wired-schedule',plannerSource.includes('rebuildProjection?.scheduleCommitment')&&plannerSource.includes('rebuildProjection?.availabilityWindow'));


const sessionSource=loadSource('src/session/session-domain-runtime.js');
const sessionContext={};vm.createContext(sessionContext);vm.runInContext(sessionSource,sessionContext);
const sessionDomain=sessionContext.ReadyRebuildSessionDomain;
assert('session-start-guard-active',sessionDomain.startGuard({activeSession:{id:'x'},selectedTodoIds:['t'],plannerLinks:[{todo_id:'t'}]}).reason==='SESSION_ALREADY_ACTIVE');
assert('session-start-guard-selection',sessionDomain.startGuard({activeSession:null,selectedTodoIds:[],plannerLinks:[]}).reason==='NO_SELECTED_TODO');
const shadowSession=sessionDomain.createSession({sessionId:'s1',now:1000,targetMin:25,plannerLinks:[{todo_id:'t1',label:'숙제'}],sound:'OFF'});
assert('session-create-shape',shadowSession.id==='s1'&&shadowSession.targetMs===1500000&&shadowSession.tasks[0]==='숙제'&&shadowSession.plannerLinks[0].todo_id==='t1');
const shadowTimes=sessionDomain.times({...shadowSession,startAt:1000,targetMs:60000,issueMs:5000},{now:31000,fallbackTargetMin:25});
assert('session-times',shadowTimes.focus===25000&&shadowTimes.issue===5000&&shadowTimes.remaining===35000);
const attribution=sessionDomain.attribution({plannerLinks:[{todo_id:'a'},{todo_id:'b'}]},10001);
assert('session-attribution',attribution.taskCount===2&&attribution.attributedMs===5000&&attribution.timeAttribution==='EQUAL_SHARE_SESSION_OBSERVATION');
assert('session-loaded-before-app',indexSource.indexOf('src/session/session-domain-runtime.js')>0&&indexSource.indexOf('src/session/session-domain-runtime.js')<indexSource.indexOf('app.js'));

console.log('REBUILD_DOMAIN_PARITY_PASS');

console.log('REBUILD_V01_FOUNDATION_PASS ready-set');

const appSource=loadSource('app.js');
assert('planner-projection-no-self-recursion',
  !appSource.includes("function plannerTodayProjection(){\n  return (plannerTodayProjection())")
);
const plannerQueryControllerSource=loadSource('src/planner/planner-query-controller-runtime.js');
assert('planner-query-controller-owner',plannerQueryControllerSource.includes('ReadyRebuildPlannerQueryController'));
assert('planner-query-controller-loaded-before-app',
  indexSource.indexOf('src/planner/planner-query-controller-runtime.js')>0 &&
  indexSource.indexOf('src/planner/planner-query-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('planner-query-controller-wired',
  appSource.includes('rebuildPlannerQueryController.create') &&
  loadSource('src/views/mission-controller-runtime.js').includes('plannerQuery.todayProjection()') &&
  loadSource('src/views/planner-screen-controller-runtime.js').includes('plannerQuery.snapshot()')
);
assert('planner-query-direct-read-reduced',
  !appSource.includes('window.ReadySetPlanner?.todayProjection?.()') &&
  !appSource.includes('window.ReadySetPlanner?.snapshot?.()') &&
  !appSource.includes('function plannerTodayProjection()') &&
  !appSource.includes('function plannerSnapshot()')
);

const persistenceSource=loadSource('src/persistence/app-state-runtime.js');
assert('app-persistence-owner-exists',persistenceSource.includes('ReadyRebuildAppPersistence'));
assert('app-persistence-migrate',persistenceSource.includes("x.schemaVersion<5")&&persistenceSource.includes("x.schemaVersion=5"));
assert('app-persistence-localfirst',persistenceSource.includes("capture?.('app_state',payload)"));
assert('app-persistence-safe-event',persistenceSource.includes("'readyset-safe-point'"));
assert('app-persistence-no-legacy-load-in-app',!appSource.includes("function load(){"));
assert('app-persistence-no-legacy-migrate-in-app',!appSource.includes("function migrate(x){"));

const captureServiceSource=loadSource('src/assignment/capture-service-runtime.js');
assert('capture-service-owner',captureServiceSource.includes('ReadyRebuildCaptureService'));
assert('capture-service-print-parser',captureServiceSource.includes("day.trim().toUpperCase()"));
assert('capture-service-stable-signature',captureServiceSource.includes("Object.keys(v).sort()"));
assert('capture-service-answer-split',captureServiceSource.includes("x.kind==='ANSWER_REFERENCE'"));
assert('capture-service-review-provenance',captureServiceSource.includes("reviewProvenanceForGroup"));

const assignmentServiceSource=loadSource('src/assignment/assignment-service-runtime.js');
assert('assignment-service-owner',assignmentServiceSource.includes('ReadyRebuildAssignmentService'));
assert('assignment-service-duplicate-guards',assignmentServiceSource.includes('DUPLICATE_TALENT_FACT')&&assignmentServiceSource.includes('DUPLICATE_ENGLISH_FACT'));
assert('assignment-service-no-silent-loss',assignmentServiceSource.includes('CAPTURE_REVIEW_UNRESOLVED'));
assert('assignment-service-parent-confirm',assignmentServiceSource.includes("confirmFact(assignmentId,{actor:'PARENT'})")&&assignmentServiceSource.includes("confirmFact(fact.assignment_id,{actor:'PARENT'})"));
assert('assignment-service-planner-routing',assignmentServiceSource.includes('processAssignment?.'));

assert('assignment-service-review-provenance',
  assignmentServiceSource.includes("PARENT_REVIEWED_CAPTURE") &&
  assignmentServiceSource.includes("capture_reviews:captureReviews")
);

const recordingServiceSource=loadSource('src/recording/recording-service-runtime.js');
assert('recording-service-owner',recordingServiceSource.includes('ReadyRebuildRecordingService'));
assert('recording-service-mime-priority',
  recordingServiceSource.includes("'audio/mp4;codecs=mp4a.40.2'") &&
  recordingServiceSource.indexOf("'audio/mp4;codecs=mp4a.40.2'") < recordingServiceSource.indexOf("'audio/webm;codecs=opus'")
);
assert('recording-service-no-fake-m4a',recordingServiceSource.includes("extensionFor")&&recordingServiceSource.includes("'webm'"));
assert('recording-service-indexeddb',recordingServiceSource.includes("indexedDBImpl.open('readyset_audio',1)"));

const resultHistorySource=loadSource('src/views/result-history-view-runtime.js');
assert('result-history-owner',resultHistorySource.includes('ReadyRebuildResultHistoryView'));
assert('result-history-state-coverage',
  ['COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED','MIXED'].every(x=>resultHistorySource.includes(x))
);
const profileSettingsSource=loadSource('src/views/profile-settings-view-runtime.js');
assert('profile-settings-owner',profileSettingsSource.includes('ReadyRebuildProfileSettingsView'));
const authSyncSource=loadSource('src/views/auth-sync-view-runtime.js');
assert('auth-sync-owner',authSyncSource.includes('ReadyRebuildAuthSyncView'));
assert('auth-sync-no-authority-transfer',!authSyncSource.includes('requireRole')&&!authSyncSource.includes('linkChild'));

const homeViewSource=loadSource('src/views/home-view-runtime.js');
assert('home-view-owner',homeViewSource.includes('ReadyRebuildHomeView'));
const plannerScreenSource=loadSource('src/views/planner-screen-view-runtime.js');
assert('planner-screen-owner',plannerScreenSource.includes('ReadyRebuildPlannerScreenView'));
assert('planner-screen-display-only',
  !plannerScreenSource.includes('upsertDatedTodo') &&
  !plannerScreenSource.includes('allocate') &&
  !plannerScreenSource.includes('recordTaskState')
);

const recordingViewSource=loadSource('src/views/recording-view-runtime.js');
assert('recording-view-owner',recordingViewSource.includes('ReadyRebuildRecordingView'));
assert('recording-view-loaded-before-app',
  indexSource.indexOf('src/views/recording-view-runtime.js')>0 &&
  indexSource.indexOf('src/views/recording-view-runtime.js')<indexSource.indexOf('app.js')
);
const recordingControllerSourceForView=loadSource('src/recording/recording-controller-runtime.js');
assert('recording-view-wired',
  appSource.includes('rebuildRecordingView.create') &&
  recordingControllerSourceForView.includes('view.renderContext') &&
  recordingControllerSourceForView.includes('view.renderReview')
);
assert('recording-inline-review-ui-removed',
  !appSource.includes("$('#duoText').textContent=") &&
  !appSource.includes("$('#formatNote').textContent=rebuildRecordingService.formatNote")
);

const captureDraftSource=loadSource('src/assignment/capture-draft-runtime.js');
assert('capture-draft-owner',captureDraftSource.includes('ReadyRebuildCaptureDraft'));
assert('capture-draft-stable-review-event',captureDraftSource.includes('PARENT_APPLIED_DRAFT'));
assert('capture-draft-wired',appSource.includes('captureDraftController.apply(draft)'));

const shareCardSource=loadSource('src/views/share-card-runtime.js');
assert('share-card-runtime-owner',shareCardSource.includes('ReadyRebuildShareCard'));
assert('share-card-runtime-loaded-before-app',
  indexSource.indexOf('src/views/share-card-runtime.js')>0 &&
  indexSource.indexOf('src/views/share-card-runtime.js')<indexSource.indexOf('app.js')
);
assert('share-card-runtime-wired',
  appSource.includes('rebuildShareCard.create') &&
  appSource.includes('shareCardRuntime.render') &&
  appSource.includes('shareCardRuntime.share')
);
assert('share-card-inline-duplicate-removed',
  !appSource.includes('function readyThemeCopy(') &&
  !appSource.includes('function readyDrawIslandScene(') &&
  !appSource.includes('async function renderCompactShareCard(') &&
  !appSource.includes('async function compactShareCard(')
);

const captureOrchestratorSource=loadSource('src/assignment/capture-orchestrator-runtime.js');
assert('capture-orchestrator-owner',captureOrchestratorSource.includes('ReadyRebuildCaptureOrchestrator'));
assert('capture-orchestrator-loaded-before-app',
  indexSource.indexOf('src/assignment/capture-orchestrator-runtime.js')>0 &&
  indexSource.indexOf('src/assignment/capture-orchestrator-runtime.js')<indexSource.indexOf('app.js')
);
assert('capture-orchestrator-wired',
  appSource.includes('rebuildCaptureOrchestrator.create') &&
  loadSource('src/assignment/capture-intake-controller-runtime.js').includes('runtime.loadReview()') &&
  loadSource('src/assignment/capture-intake-controller-runtime.js').includes('runtime.requestAnalysis()')
);
assert('capture-orchestrator-direct-api-reduced',
  (appSource.match(/window\.ReadyCaptureV01/g)||[]).length===1
);

const recordingOrchestratorSource=loadSource('src/recording/recording-orchestrator-runtime.js');
assert('recording-orchestrator-owner',recordingOrchestratorSource.includes('ReadyRebuildRecordingOrchestrator'));
assert('recording-orchestrator-loaded-before-app',
  indexSource.indexOf('src/recording/recording-orchestrator-runtime.js')>0 &&
  indexSource.indexOf('src/recording/recording-orchestrator-runtime.js')<indexSource.indexOf('app.js')
);
assert('recording-orchestrator-wired',
  appSource.includes('rebuildRecordingOrchestrator.create') &&
  recordingControllerSourceForView.includes('runtime.start') &&
  recordingControllerSourceForView.includes('runtime.currentAudio')
);
assert('recording-inline-media-lifecycle-removed',
  !appSource.includes('navigator.mediaDevices?.getUserMedia') &&
  !appSource.includes('new MediaRecorder(') &&
  !appSource.includes('mediaStream?.getTracks()') &&
  !appSource.includes('let mediaRecorder=')
);

const resultHistoryControllerSource=loadSource('src/views/result-history-controller-runtime.js');
assert('result-history-controller-owner',resultHistoryControllerSource.includes('ReadyRebuildResultHistoryController'));
assert('result-history-controller-loaded-before-app',
  indexSource.indexOf('src/views/result-history-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/result-history-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('result-history-scene-owned-by-view',
  resultHistorySource.includes('function resultSceneFor(record={})') &&
  !appSource.includes('function resultSceneFor(')
);
assert('result-history-controller-wired',
  appSource.includes('rebuildResultHistoryController.create') &&
  appSource.includes('resultHistoryRuntime.renderResult()') &&
  appSource.includes('resultHistoryRuntime.renderHistory()') &&
  appSource.includes('resultHistoryRuntime.renderCalendar()')
);
assert('result-history-inline-handlers-removed',
  !appSource.includes('function resultSource()') &&
  !appSource.includes('function renderResult()') &&
  !appSource.includes('function renderHistory()') &&
  !appSource.includes('function renderCalendar()')
);

const profileControllerSource=loadSource('src/views/profile-controller-runtime.js');
assert('profile-controller-owner',profileControllerSource.includes('ReadyRebuildProfileController'));
assert('profile-controller-loaded-before-app',
  indexSource.indexOf('src/views/profile-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/profile-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('profile-controller-wired',
  appSource.includes('rebuildProfileController.create') &&
  appSource.includes('profileRuntime.loadPhoto') &&
  appSource.includes('profileRuntime.setStyle') &&
  appSource.includes('profileRuntime.saveProfile')
);
assert('profile-inline-handlers-removed',
  !appSource.includes('function renderProfile()') &&
  !appSource.includes('function photoLoad(') &&
  !appSource.includes('new FileReader()')
);

assert('profile-style-handler-uses-query-all',
  appSource.split('\n').some(line=>line.includes("$('[data-style]').forEach"))
);

const settingsControllerSource=loadSource('src/views/settings-controller-runtime.js');
assert('settings-controller-owner',settingsControllerSource.includes('ReadyRebuildSettingsController'));
assert('settings-controller-loaded-before-app',
  indexSource.indexOf('src/views/settings-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/settings-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('settings-controller-wired',
  appSource.includes('rebuildSettingsController.create') &&
  appSource.includes('settingsRuntime.setGuideName') &&
  appSource.includes('settingsRuntime.setGuideType') &&
  appSource.includes('settingsRuntime.setGuideVoice') &&
  appSource.includes('settingsRuntime.setSound')
);
assert('settings-inline-handlers-removed',
  !appSource.includes('function renderSettings()') &&
  !appSource.includes('function renderNameSuggestions(') &&
  !appSource.includes('function speakGuide(')
);

const authSyncControllerSource=loadSource('src/views/auth-sync-controller-runtime.js');
assert('auth-sync-controller-owner',authSyncControllerSource.includes('ReadyRebuildAuthSyncController'));
assert('auth-sync-controller-loaded-before-app',
  indexSource.indexOf('src/views/auth-sync-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/auth-sync-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('auth-sync-controller-wired',
  appSource.includes('rebuildAuthSyncController.create') &&
  appSource.includes('authSyncRuntime.bind()')
);
assert('auth-sync-authority-stays-external',
  authSyncControllerSource.includes('familyApi()?.login') &&
  authSyncControllerSource.includes('familyApi()?.linkChild') &&
  authSyncControllerSource.includes('requireParentUi()') &&
  !authSyncSource.includes('linkChild')
);
assert('auth-sync-inline-handlers-removed',
  !appSource.includes("document.getElementById('authLoginBtn')") &&
  !appSource.includes("document.getElementById('familyLinkChildBtn')") &&
  !appSource.includes("document.getElementById('checkSyncBtn')") &&
  !appSource.includes('async function renderSyncStatus()') &&
  !appSource.includes('function renderAuthStatus()')
);

const plannerAdminControllerSource=loadSource('src/views/planner-admin-controller-runtime.js');
assert('planner-admin-controller-owner',plannerAdminControllerSource.includes('ReadyRebuildPlannerAdminController'));
assert('planner-admin-controller-loaded-before-app',
  indexSource.indexOf('src/views/planner-admin-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/planner-admin-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('planner-admin-controller-wired',
  appSource.includes('rebuildPlannerAdminController.create') &&
  appSource.includes('plannerAdminRuntime.bind()') &&
  appSource.includes("'planner-admin':()=>plannerAdminRuntime.render()")
);
assert('planner-admin-authority-stays-external',
  plannerAdminControllerSource.includes('requireParentUi()') &&
  plannerAdminControllerSource.includes("planner()?.upsertScheduleCommitment") &&
  plannerAdminControllerSource.includes("planner()?.resolveCarryOver")
);
assert('planner-admin-inline-crud-removed',
  !appSource.includes('function clearScheduleForm()') &&
  !appSource.includes('function clearAvailabilityForm()') &&
  !appSource.includes('function editSchedule(') &&
  !appSource.includes('function editAvailability(') &&
  !appSource.includes("getElementById('saveScheduleBtn')") &&
  !appSource.includes("getElementById('saveAvailabilityBtn')")
);

const sessionRecoveryControllerSource=loadSource('src/session/session-recovery-controller-runtime.js');
assert('session-recovery-controller-owner',sessionRecoveryControllerSource.includes('ReadyRebuildSessionRecoveryController'));
assert('session-recovery-controller-loaded-before-app',
  indexSource.indexOf('src/session/session-recovery-controller-runtime.js')>0 &&
  indexSource.indexOf('src/session/session-recovery-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('session-recovery-controller-wired',
  appSource.includes('rebuildSessionRecoveryController.create') &&
  appSource.includes('sessionRecoveryRuntime.reconcile()')
);
assert('session-recovery-planner-ownership',
  sessionRecoveryControllerSource.includes('sessionRuntimeStatus') &&
  sessionRecoveryControllerSource.includes('recordTaskState') &&
  sessionRecoveryControllerSource.includes('plannerQuery.snapshot()')
);
assert('session-recovery-inline-removed',
  !appSource.includes('function reconcileReadyRuntimeState()') &&
  !appSource.includes('sessionRuntimeStatus?.(state.activeSession.id)') &&
  !appSource.includes("ready_state:'IN_PROGRESS',\n          session_id:state.activeSession.id")
);

const appBootstrapControllerSource=loadSource('src/shell/app-bootstrap-controller-runtime.js');
assert('app-bootstrap-controller-owner',appBootstrapControllerSource.includes('ReadyRebuildAppBootstrapController'));
assert('app-bootstrap-controller-loaded-before-app',
  indexSource.indexOf('src/shell/app-bootstrap-controller-runtime.js')>0 &&
  indexSource.indexOf('src/shell/app-bootstrap-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('app-bootstrap-controller-wired',
  appSource.includes('rebuildAppBootstrapController.create') &&
  appSource.includes('appBootstrapRuntime.bind()')
);
assert('app-bootstrap-inline-shell-wiring-removed',
  !appSource.includes("document.querySelectorAll('[data-nav]').forEach") &&
  !appSource.includes("document.getElementById('plannerTodayJump')") &&
  !appSource.includes("window.addEventListener('visibilitychange'") &&
  !appSource.includes("window.addEventListener('load'")
);

const missionFocusControllerSource=loadSource('src/session/mission-focus-controller-runtime.js');
assert('mission-focus-controller-owner',missionFocusControllerSource.includes('ReadyRebuildMissionFocusController'));
assert('mission-focus-controller-loaded-before-app',
  indexSource.indexOf('src/session/mission-focus-controller-runtime.js')>0 &&
  indexSource.indexOf('src/session/mission-focus-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('mission-focus-controller-wired',
  appSource.includes('rebuildMissionFocusController.create') &&
  appSource.includes('missionFocusRuntime.bind()')
);
assert('mission-focus-authority-stays-external',
  missionFocusControllerSource.includes('sessionService.start') &&
  missionFocusControllerSource.includes('planner:planner()') &&
  missionFocusControllerSource.includes('completeSession(stateValue)')
);
assert('mission-focus-inline-handlers-removed',
  !appSource.includes("$('#startBtn').onclick") &&
  !appSource.includes("$('#pauseBtn').onclick") &&
  !appSource.includes("$('#soundBtn').onclick") &&
  !appSource.includes("$$('[data-outcome-state]').forEach")
);

const rev07Source=loadSource('ready-runtime-v07.js');
assert('rev07-session-start-event',
  missionFocusControllerSource.includes("readyset-session-started") &&
  rev07Source.includes("window.addEventListener('readyset-session-started'") &&
  !rev07Source.includes("const originalStart = document.getElementById('startBtn')?.onclick")
);

const captureIntakeControllerSource=loadSource('src/assignment/capture-intake-controller-runtime.js');
assert('capture-intake-controller-owner',captureIntakeControllerSource.includes('ReadyRebuildCaptureIntakeController'));
assert('capture-intake-controller-loaded-before-app',
  indexSource.indexOf('src/assignment/capture-intake-controller-runtime.js')>0 &&
  indexSource.indexOf('src/assignment/capture-intake-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('capture-intake-controller-wired',
  appSource.includes('rebuildCaptureIntakeController.create') &&
  appSource.includes('captureIntakeRuntime.bind()') &&
  appSource.includes('captureIntakeRuntime.render()')
);
assert('capture-intake-authority-stays-external',
  captureIntakeControllerSource.includes('runtime.addFiles') &&
  captureIntakeControllerSource.includes('runtime.requestAnalysis') &&
  captureIntakeControllerSource.includes('runtime.resolveDisposition') &&
  captureIntakeControllerSource.includes('applyDraft(')
);
assert('capture-intake-inline-handlers-removed',
  !appSource.includes("getElementById('homeworkCameraInput')") &&
  !appSource.includes("getElementById('captureAnalyzeBtn')") &&
  !appSource.includes("function captureFiles(") &&
  !appSource.includes("data-link-capture-item")
);

const assignmentIntakeControllerSource=loadSource('src/assignment/assignment-intake-controller-runtime.js');
assert('assignment-intake-controller-owner',assignmentIntakeControllerSource.includes('ReadyRebuildAssignmentIntakeController'));
assert('assignment-intake-controller-loaded-before-app',
  indexSource.indexOf('src/assignment/assignment-intake-controller-runtime.js')>0 &&
  indexSource.indexOf('src/assignment/assignment-intake-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('assignment-intake-controller-wired',
  appSource.includes('rebuildAssignmentIntakeController.create') &&
  appSource.includes('assignmentIntakeRuntime.bind()') &&
  appSource.includes('assignmentIntakeRuntime?.render()')
);
assert('assignment-intake-authority-stays-external',
  assignmentIntakeControllerSource.includes('assignmentService.saveTalent') &&
  assignmentIntakeControllerSource.includes('assignmentService.saveEnglish') &&
  assignmentIntakeControllerSource.includes('reviewChildFact') &&
  assignmentIntakeControllerSource.includes('processAssignment')
);
assert('assignment-intake-inline-handlers-removed',
  !appSource.includes("getElementById('saveTalentFactsBtn')") &&
  !appSource.includes("getElementById('saveEnglishFactBtn')") &&
  !appSource.includes("data-child-fact-confirm") &&
  !appSource.includes("data-child-fact-reject")
);

const recordingControllerSource=loadSource('src/recording/recording-controller-runtime.js');
assert('recording-controller-owner',recordingControllerSource.includes('ReadyRebuildRecordingController'));
assert('recording-controller-loaded-before-app',
  indexSource.indexOf('src/recording/recording-controller-runtime.js')>0 &&
  indexSource.indexOf('src/recording/recording-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('recording-controller-wired',
  appSource.includes('rebuildRecordingController.create') &&
  appSource.includes('recordingControllerRuntime.bind()') &&
  appSource.includes('recordingControllerRuntime.renderContext()')
);
assert('recording-authority-stays-external',
  recordingControllerSource.includes('runtime.start') &&
  recordingControllerSource.includes('runtime.currentAudio') &&
  recordingControllerSource.includes('service.storeAudio') &&
  recordingControllerSource.includes('service.filenameFor')
);
assert('recording-inline-handlers-removed',
  !appSource.includes("$('#recBtn').onclick") &&
  !appSource.includes("$('#recordAction').onclick") &&
  !appSource.includes("function startRecording()") &&
  !appSource.includes("function finishRecording(") &&
  !appSource.includes("function chooseGuest()") &&
  !appSource.includes("$('#saveRecordingBtn').onclick")
);

const sessionCompletionControllerSource=loadSource('src/session/session-completion-controller-runtime.js');
assert('session-completion-controller-owner',sessionCompletionControllerSource.includes('ReadyRebuildSessionCompletionController'));
assert('session-completion-controller-loaded-before-app',
  indexSource.indexOf('src/session/session-completion-controller-runtime.js')>0 &&
  indexSource.indexOf('src/session/session-completion-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('session-completion-controller-wired',
  appSource.includes('rebuildSessionCompletionController.create') &&
  appSource.includes('sessionCompletionRuntime.finishRecord') &&
  appSource.includes('sessionCompletionRuntime.completeFromTaskOutcomes') &&
  appSource.includes('sessionCompletionRuntime.complete(outcomeState)')
);
assert('session-completion-authority-stays-external',
  sessionCompletionControllerSource.includes('sessionService.outcome') &&
  sessionCompletionControllerSource.includes('planner:planner()')
);
assert('session-completion-state-mutation-removed-from-app',
  !appSource.includes('state.records.unshift(rec)') &&
  !appSource.includes('state.activeSession=null;state.lastResult=rec') &&
  !appSource.includes('const outcome=rebuildSessionService.outcome')
);

const missionControllerSource=loadSource('src/views/mission-controller-runtime.js');
assert('mission-controller-owner',missionControllerSource.includes('ReadyRebuildMissionController'));
assert('mission-controller-loaded-before-app',
  indexSource.indexOf('src/views/mission-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/mission-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('mission-controller-wired',
  appSource.includes('rebuildMissionController.create') &&
  appSource.includes('missionControllerRuntime.bind()') &&
  appSource.includes('missionControllerRuntime.render()')
);
assert('mission-controller-authority-stays-external',
  missionControllerSource.includes('assignments()?.addEventFact') &&
  missionControllerSource.includes('plannerQuery.todayProjection()')
);
assert('mission-inline-input-wiring-removed',
  !appSource.includes("$('#addTaskBtn').onclick") &&
  !appSource.includes("$('#voiceTaskBtn').onclick") &&
  !appSource.includes("$$('[data-minutes]').forEach") &&
  !appSource.includes('let voiceRecognition=') &&
  !appSource.includes('function openCategory(')
);

const plannerScreenControllerSource=loadSource('src/views/planner-screen-controller-runtime.js');
assert('planner-screen-controller-owner',plannerScreenControllerSource.includes('ReadyRebuildPlannerScreenController'));
assert('planner-screen-controller-loaded-before-app',
  indexSource.indexOf('src/views/planner-screen-controller-runtime.js')>0 &&
  indexSource.indexOf('src/views/planner-screen-controller-runtime.js')<indexSource.indexOf('app.js')
);
assert('planner-screen-controller-wired',
  appSource.includes('rebuildPlannerScreenController.create') &&
  appSource.includes('plannerScreenRuntime.render()')
);
assert('planner-screen-mutation-owned-by-controller',
  plannerScreenControllerSource.includes('replanReadyCarryOvers') &&
  !appSource.includes('window.ReadySetPlanner?.replanReadyCarryOvers')
);

const plannerAdminAdaptiveViewSource=loadSource('src/views/planner-admin-view-runtime.js');
assert('planner-adaptive-ui-wired',
  indexSource.includes('adaptiveEstimateRefreshBtn') &&
  indexSource.includes('adaptiveEstimateAdminList') &&
  plannerAdminControllerSource.includes('proposeEstimateAdjustment') &&
  plannerAdminControllerSource.includes('decideEstimateAdjustment') &&
  plannerAdminAdaptiveViewSource.includes('data-estimate-confirm') &&
  plannerAdminAdaptiveViewSource.includes('data-estimate-reject')
);
assert('planner-adaptive-human-approval',
  plannerAdminControllerSource.includes("decision,'CONFIRM'") ||
  plannerAdminControllerSource.includes("'CONFIRM'")
);

const plannerViewReasonSource=loadSource('src/planner/planner-view-runtime.js');
assert('planner-assignment-reason-evidence',
  plannerViewReasonSource.includes('allocationReason') &&
  plannerViewReasonSource.includes('free_window_evidence') &&
  plannerViewReasonSource.includes('planner_estimated_minutes') &&
  plannerViewReasonSource.includes('carry_over_id')
);

const plannerAdminViewSourceForReflow=loadSource('src/views/planner-admin-view-runtime.js');
const plannerCoreReflowSource=loadSource('ready-planner-v01.js');
assert('planner-weekly-reflow-human-approval',
  plannerCoreReflowSource.includes('planWeeklyReflow') &&
  plannerCoreReflowSource.includes('decideWeeklyReflow') &&
  plannerCoreReflowSource.includes("authority:'PLANNER_PROPOSAL_HUMAN_APPROVAL_REQUIRED'") &&
  indexSource.includes('weeklyReflowPlanBtn') &&
  plannerAdminControllerSource.includes('planWeeklyReflow') &&
  plannerAdminViewSourceForReflow.includes('data-reflow-confirm')
);

const plannerOperatingRuleSource=loadSource('ready-planner-v01.js');
assert('english-academy-morning-vocab-rule',
  plannerOperatingRuleSource.includes('ENGLISH_ACADEMY_MORNING_VOCAB_REVIEW') &&
  plannerOperatingRuleSource.includes("preferred_daypart:'MORNING'") &&
  plannerOperatingRuleSource.includes('operatingRuleForUnit') &&
  plannerOperatingRuleSource.includes('isEnglishAcademyCommitment')
);

const plannerProjectionWeeklySchedule=loadSource('src/planner/planner-projection-runtime.js');
const plannerAdminWeeklySchedule=loadSource('src/views/planner-admin-controller-runtime.js');
assert('weekly-schedule-commitment-supported',
  plannerProjectionWeeklySchedule.includes("recurrence==='WEEKLY'") &&
  loadSource('ready-planner-v01.js').includes('scheduleCommitmentsForDate') &&
  indexSource.includes('scheduleWeekly') &&
  indexSource.includes('scheduleWeekday') &&
  plannerAdminWeeklySchedule.includes("recurrence:weekly?'WEEKLY':null")
);

const plannerScheduleExceptionSource=loadSource('ready-planner-v01.js');
assert('weekly-schedule-exception-overlay',
  plannerScheduleExceptionSource.includes('schedule_exceptions') &&
  plannerScheduleExceptionSource.includes('upsertScheduleException') &&
  plannerScheduleExceptionSource.includes("exception?.type==='SKIP'") &&
  plannerScheduleExceptionSource.includes("exception?.type==='REPLACE'") &&
  indexSource.includes('scheduleExceptionCard')
);

const plannerAdminValiditySource=loadSource('src/views/planner-admin-controller-runtime.js');
assert('weekly-validity-range-ui',
  indexSource.includes('scheduleValidFrom') &&
  indexSource.includes('scheduleValidUntil') &&
  indexSource.includes('availabilityValidFrom') &&
  indexSource.includes('availabilityValidUntil') &&
  plannerAdminValiditySource.includes('valid_from:weekly?') &&
  plannerAdminValiditySource.includes('valid_until:weekly?')
);

const plannerReflowReviewSource=loadSource('ready-planner-v01.js');
assert('planner-reflow-review-dirty-flag',
  plannerReflowReviewSource.includes('markReflowReview') &&
  plannerReflowReviewSource.includes("reflow_review:{needed:false") &&
  plannerReflowReviewSource.includes("'SCHEDULE_CHANGED'") &&
  plannerReflowReviewSource.includes("'AVAILABILITY_CHANGED'")
);

const plannerQueryScheduleSource=loadSource('src/planner/planner-query-controller-runtime.js');
const plannerViewScheduleSource=loadSource('src/planner/planner-view-runtime.js');
assert('planner-view-uses-expanded-schedule-contract',
  plannerQueryScheduleSource.includes('scheduleCommitmentsForDate') &&
  plannerViewScheduleSource.includes('options.commitments') &&
  plannerViewScheduleSource.includes('schedule_exception')
);

const plannerDaypartViewSource=loadSource('src/planner/planner-view-runtime.js');
const plannerDaypartScreenSource=loadSource('src/views/planner-screen-view-runtime.js');
assert('planner-daypart-evidence-ui',
  plannerDaypartViewSource.includes('preferred_daypart') &&
  plannerDaypartScreenSource.includes("value==='MORNING'?'아침'") &&
  plannerDaypartScreenSource.includes('daypartLabel')
);

const plannerAvailabilityExceptionSource=loadSource('ready-planner-v01.js');
assert('weekly-availability-exception-overlay',
  plannerAvailabilityExceptionSource.includes('availability_exceptions') &&
  plannerAvailabilityExceptionSource.includes('upsertAvailabilityException') &&
  plannerAvailabilityExceptionSource.includes("exception?.type==='SKIP'") &&
  plannerAvailabilityExceptionSource.includes("exception?.type==='REPLACE'") &&
  indexSource.includes('availabilityExceptionCard')
);

const captureRuntimeSource=loadSource('ready-capture-v01.js');
assert('capture-failed-reanalysis-preserves-current',
  captureRuntimeSource.includes('FAILED_REANALYSIS_ATTEMPT') &&
  captureRuntimeSource.includes('prior_analysis_preserved:true') &&
  captureRuntimeSource.includes("analysis_state:'ANALYSIS_COMPLETE'") &&
  captureRuntimeSource.includes('last_analysis_failure')
);


const learningMasterSource=loadSource('ready-learning-master-v01.js');
const assignmentIntakeSource=loadSource('src/assignment/assignment-intake-controller-runtime.js');
assert('english-component-specific-grammar-reading',
  learningMasterSource.includes("'grammar':{") &&
  learningMasterSource.includes("['GRAMMAR_CHECK','QUIZ','REVIEW']") &&
  learningMasterSource.includes("'reading':{") &&
  learningMasterSource.includes("['READ_STORY','COMPREHENSION_CHECK','SENTENCE_BUILDING','REVIEW']") &&
  learningMasterSource.includes('componentSpecificProfile') &&
  learningMasterSource.includes('preferredActivitySequence') &&
  assignmentIntakeSource.includes("grammar:query('#englishGrammar')") &&
  assignmentIntakeSource.includes("reading:query('#englishReading')") &&
  indexSource.includes('id="englishGrammar"') &&
  indexSource.includes('id="englishReading"')
);

const captureDraftEnglishSource=loadSource('src/assignment/capture-draft-runtime.js');
const captureAnalyzeEnglishSource=loadSource('netlify/functions/capture-analyze.mjs');
assert('capture-english-grammar-reading-contract',
  captureDraftEnglishSource.includes("grammar:'#englishGrammar'") &&
  captureDraftEnglishSource.includes("reading:'#englishReading'") &&
  captureAnalyzeEnglishSource.includes("'grammar','reading'") &&
  captureAnalyzeEnglishSource.includes('grammar:{type:\'string\'}') &&
  captureAnalyzeEnglishSource.includes('reading:{type:\'string\'}')
);

const authSyncConflictController=loadSource('src/views/auth-sync-controller-runtime.js');
const authSyncConflictView=loadSource('src/views/auth-sync-view-runtime.js');
assert('sync-conflict-resolution-ui',
  indexSource.includes('syncConflictList') &&
  authSyncConflictController.includes('resolveSyncConflict') &&
  authSyncConflictController.includes("'KEEP_LOCAL','ACCEPT_REMOTE'") &&
  authSyncConflictView.includes('data-sync-conflict-resolution="KEEP_LOCAL"') &&
  authSyncConflictView.includes('data-sync-conflict-resolution="ACCEPT_REMOTE"')
);
