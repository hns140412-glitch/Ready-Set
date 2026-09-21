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
assert('planner-projection-live-owner',
  appSource.includes("window.ReadySetPlanner?.todayProjection?.()")
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
