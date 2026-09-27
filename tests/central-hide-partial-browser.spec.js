const {test,expect}=require('@playwright/test');

test('Hide V2 partial return retains exact central task and does not certify completed recall',async({page})=>{
 // A real navigation recreates the browser host. Model its explicitly
 // configured authenticated session on every document rather than faking a
 // token or assuming the previous page's JS objects survive reload.
 await page.addInitScript(()=>{
  document.addEventListener('DOMContentLoaded',()=>{
   const scope={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
   window.__testCentralScope=scope;
   window.ReadyCentralLearningRoundtripV01.installBrowserHost({
    eventTarget:window,activeScopeProvider:()=>scope,
    roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
    resolveRecordOptions:()=>({})
   });
  },{once:true});
 });
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const setup=await page.evaluate(async()=>{
  window.ReadySetSpecialistTargets={hideSeekV2:'https://hide.example.test/v2.html'};
  const scope=window.__testCentralScope;
  const today=new Date(),date=today.getFullYear()+'-'+
   String(today.getMonth()+1).padStart(2,'0')+'-'+
   String(today.getDate()).padStart(2,'0');
  window.ReadySetPlanner.upsertDailyAvailabilityWindow({date,start:'16:00',
   end:'17:00',source:'PARENT_CONFIRMED',confirmed:true});
  const core={member_id:'CHILD_A',subject:'english',concept_skill_target:'vocabulary'};
  const intent={ok:true,authority:'CENTRAL_PEDAGOGICAL_INTENT_ONLY',
   scope:core,receipt_scope:{family_id:'F1',member_id:'CHILD_A'},
   actions:[{intent:'RETRIEVAL_CHECKPOINT',basis:['HIDE_MEMORY_ADVISORY_ONLY']}],
   adaptive_plan:{ok:true,authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
    adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',scope:core,
    add_checkpoint:true,add_retrieval_checkpoint:true,unit_span_policy:'REDUCE',
    assistance_policy:'FADE_GRADUALLY',target_learning_ids:['a::뜻','b::뜻']},
   trace:{verified_receipt_id:null,verified_evidence_count:0,basis_kind:'OBSERVATION_ADVISORY_ONLY',
    observation_review_evidence_count:1,observation_review_evidence_ids:['obs1'],
    observation_review_digest_sha256:'a'.repeat(64)}};
  const planned=window.ReadyCentralIntentToPlannerV01.planAccepted(intent,
   window.ReadySetPlanner,{activeSession:scope,candidate_dates:[date]});
  if(!planned.ok)return {ok:false,reason:planned.reason};
  state.selectedTodoIds=[planned.todo.todo_id];state.targetMin=1;save();
  document.getElementById('startBtn').click();
  return {ok:true};
 });
 expect(setup.ok).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.ReadySetRev07.contract()?.tasks?.length)).toBe(1);
 const bound=await page.evaluate(()=>{
  const c=window.ReadySetRev07.contract(),t=c.tasks[0];
  return {session_id:c.session_id,task_id:t.task_id,lap_id:c.active_lap_id,
   directive:t.review_directive,central:t.central_checkpoint,
   memberId:state.activeSession?.centralLearningScope?.member_id};
 });
 expect(bound.central).toBe(true);
 expect(bound.memberId).toBe('CHILD_A');
 // Inspect the actual Ready outbound navigation, without installing a Hide
 // server or treating the URL parameter as authenticated authorization.
 await page.route('https://hide.example.test/v2.html**',route=>route.abort());
 const outboundRequest=page.waitForRequest(r=>r.url().startsWith('https://hide.example.test/v2.html?'));
 await page.evaluate(()=>window.ReadySetRev07.launchSpecialist('hide-seek'));
 const outbound=new URL((await outboundRequest).url());
 expect(outbound.searchParams.get('child_id')).toBe('CHILD_A');
 expect(outbound.searchParams.get('session_id')).toBe(bound.session_id);
 expect(outbound.searchParams.get('task_id')).toBe(bound.task_id);
 expect(outbound.searchParams.get('lap_id')).toBe(bound.lap_id);
 const outgoingDirective=JSON.parse(outbound.searchParams.get('review_directive'));
 expect(outgoingDirective.lexicalIds).toEqual(['a::뜻','b::뜻']);
 expect(outgoingDirective.authority).toBe('EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE');
 const buildEvent=(id,reviewed)=>({
  event_id:id,event_type:'TASK_PARTIAL',source:'hide-seek',
  payload:{resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',
   taskState:'PARTIAL',learningPhase:'FIRST_FIND',
   taskContext:{session_id:bound.session_id,task_id:bound.task_id,
    lap_id:bound.lap_id,child_id:bound.memberId},
   reviewDirective:bound.directive,reviewedLexicalIds:reviewed,
   memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',scheduleOwner:'READY_SET_PLANNER',
    prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',scopedItemIds:['item-a','item-b'],
    reviewAdvisories:[]},
   trailSummary:{scopeItemIds:['item-a','item-b'],totalWordCount:2},
   activeMissionId:'mission-scoped',missionStatus:'PARTIAL',trailMastery:0}
 });
 const navigate=(event,{fragment=false}={})=>page.goto(
  'http://127.0.0.1:4173/'+(fragment?'#learning_event=':'?learning_event=')+
  encodeURIComponent(JSON.stringify(event)),{waitUntil:'load'});
 await navigate(buildEvent('partial-forged-1',['a::뜻','c::뜻']));
 let invalid=await page.evaluate(()=>({
  task:window.ReadySetRev07.contract()?.tasks?.[0],
  pending:location.search.includes('learning_event')
 }));
 expect(invalid.task.state).toBe('PENDING');
 expect(invalid.task.specialist_result).toBeNull();
 expect(invalid.pending).toBe(true);
 // Correct lexical IDs on a stale lap still cannot alter the current task,
 // attach a memory result or consume the return fragment.
 const staleLap=buildEvent('stale-lap-2',['a::뜻','b::뜻']);
 staleLap.payload.taskContext.lap_id='previous-lap';
 await navigate(staleLap,{fragment:true});
 const rejectedLap=await page.evaluate(()=>({
  task:window.ReadySetRev07.contract()?.tasks?.[0],
  fragmentPending:location.hash.includes('learning_event')
 }));
 expect(rejectedLap.task.state).toBe('PENDING');
 expect(rejectedLap.task.specialist_result).toBeNull();
 expect(rejectedLap.fragmentPending).toBe(true);
 const wrongMember=buildEvent('wrong-member-2',['a::뜻','b::뜻']);
 wrongMember.payload.taskContext.child_id='CHILD_B';
 await navigate(wrongMember,{fragment:true});
 await page.reload({waitUntil:'load'});
 const refusedMember=await page.evaluate(()=>({
  task:window.ReadySetRev07.contract()?.tasks?.[0],
  fragmentPending:location.hash.includes('learning_event')
 }));
 expect(refusedMember.task.state).toBe('PENDING');
 expect(refusedMember.task.specialist_result).toBeNull();
 expect(refusedMember.fragmentPending).toBe(true);
 await navigate(buildEvent('partial-correct-2',['b::뜻','a::뜻']),{fragment:true});
 // The fixture serves Ready on one origin; hash-to-hash navigation does not
 // reload it. A real Hide-to-Ready cross-origin return loads Ready anew.
 await page.reload({waitUntil:'load'});
 const valid=await page.evaluate(()=>{
  const c=window.ReadySetRev07.contract(),t=c.tasks[0];
  const p=window.ReadySetPlanner.snapshot().dated_todos
   .find(x=>x.todo_id===t.planner_todo_id);
  return {taskState:t.state,source:t.specialist_result?.sourceApp,
   returnRecorded:c.applied_event_ids?.includes('partial-correct-2'),
   plannerState:p?.state,queryConsumed:!location.search.includes('learning_event'),
   fragmentConsumed:!location.hash.includes('learning_event'),
   centralCheckpoint:t.central_checkpoint}
 });
 expect(valid.taskState).toBe('PARTIAL');
 expect(valid.source).toBe('hide-seek');
 expect(valid.returnRecorded).toBe(true);
 expect(valid.plannerState).toBe('PARTIAL');
 expect(valid.queryConsumed).toBe(true);
 expect(valid.fragmentConsumed).toBe(true);
 expect(valid.centralCheckpoint).toBe(true);
});
