const {test,expect}=require('@playwright/test');

test('a real Ready session binds central Planner lexical IDs into Hide V2 directive, not local review authority',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const setup=await page.evaluate(()=>{
  window.ReadySetSpecialistTargets={hideSeekV2:'https://hide.example.test/v2.html'};
  window.__centralReviewFixture={authenticated:true,family_id:'F1',selected_member_id:'A'};
  window.__centralReviewHost=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,activeScopeProvider:()=>window.__centralReviewFixture,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
   resolveRecordOptions:()=>({})
  });
  const date=new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+
    '-'+String(new Date().getDate()).padStart(2,'0');
  window.ReadySetPlanner.upsertDailyAvailabilityWindow({date,start:'16:00',
   end:'17:00',source:'PARENT_CONFIRMED',confirmed:true});
  const core={member_id:'A',subject:'english',concept_skill_target:'vocabulary'};
  const intent={
   ok:true,authority:'CENTRAL_PEDAGOGICAL_INTENT_ONLY',
   scope:core,receipt_scope:{family_id:'F1',member_id:'A'},
   actions:[{intent:'RETRIEVAL_CHECKPOINT',basis:['HIDE_MEMORY_ADVISORY_ONLY']}],
   adaptive_plan:{ok:true,authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
    adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',scope:core,
    add_checkpoint:true,add_retrieval_checkpoint:true,
    unit_span_policy:'REDUCE',assistance_policy:'FADE_GRADUALLY',
    target_learning_ids:['a::뜻','b::뜻']},
   trace:{verified_receipt_id:null,verified_evidence_count:0,
    basis_kind:'OBSERVATION_ADVISORY_ONLY',
    observation_review_evidence_count:1,observation_review_evidence_ids:['obs1'],
    observation_review_digest_sha256:'a'.repeat(64)}
  };
  const planned=window.ReadyCentralIntentToPlannerV01.planAccepted(intent,window.ReadySetPlanner,{
   activeSession:window.__centralReviewFixture,candidate_dates:[date]});
  if(planned.ok){state.selectedTodoIds=[planned.todo.todo_id];state.targetMin=1;save();}
  return {planned:planned.ok,date,todoId:planned.todo?.todo_id};
 });
 expect(setup.planned).toBe(true);
 await page.evaluate(()=>document.getElementById('startBtn').click());
 await expect.poll(()=>page.evaluate(()=>state.activeSession?.rev07?.tasks?.length||0)).toBe(1);
 const result=await page.evaluate(()=>{
  const task=state.activeSession.rev07.tasks[0];
  const target=task.review_directive;
  const todo=window.ReadySetPlanner.snapshot().dated_todos.find(x=>x.todo_id===task.planner_todo_id);
  window.__centralReviewHost.detach();
  return {source:todo.source,central:task.central_checkpoint,
   suggested:task.suggested_app,target,sessionScope:state.activeSession.centralLearningScope};
 });
 expect(result.source).toBe('PLANNER_CENTRAL_LEARNING_CHECKPOINT');
 expect(result.central).toBe(true);
 expect(result.suggested).toBe('hide-seek');
 expect(result.sessionScope).toEqual({family_id:'F1',member_id:'A'});
 expect(result.target).toMatchObject({
  authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',
  reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',scheduleOwner:'READY_SET_PLANNER',
  lexicalIds:['a::뜻','b::뜻'],observationIsVerifiedProof:false
 });
 await page.locator('#completeBtn').click();
 await expect(page.locator('#rev07WrapTasks [data-wrap-state="COMPLETED"]')).toBeDisabled();
 await expect(page.locator('#rev07WrapTasks [data-wrap-state="PARTIAL"]')).toBeEnabled();
 const before=await page.evaluate(()=>state.activeSession.rev07.tasks[0].state);
 expect(before).toBe('PENDING');
});

test('missing central Hide route or lexical directive does not start any Planner task',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const result=await page.evaluate(async()=>{
  const scope={authenticated:true,family_id:'F1',selected_member_id:'A'};
  const host=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,activeScopeProvider:()=>scope,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
   resolveRecordOptions:()=>({})
  });
  const t=new Date(),date=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+
   '-'+String(t.getDate()).padStart(2,'0');
  const p=window.ReadySetPlanner;
  const ordinary=p.upsertDatedTodo({todo_id:'preflight-ordinary',date,
   label:'일반 과제',source:'PLANNER_ALLOCATION',state:'PLANNED'});
  const central=p.upsertDatedTodo({todo_id:'preflight-central',date,
   label:'중앙 단어 복습',source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',state:'PLANNED',
   review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE',
    decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',intent_only:true,
    observation_is_verified_proof:false,evidence_basis_kind:'OBSERVATION_ADVISORY_ONLY'},
   provenance:{kind:'CENTRAL_PEDAGOGICAL_CHECKPOINT',family_id:'F1',member_id:'A',
    schedule_authority:'READY_SET_PLANNER',basis_kind:'OBSERVATION_ADVISORY_ONLY',
    subject:'english',concept_skill_target:'vocabulary',target_learning_ids:['a::뜻']}});
  state.selectedTodoIds=[ordinary.todo_id,central.todo_id];save();
  document.getElementById('startBtn').click();
  const missingRoute={active:state.activeSession,
   states:p.snapshot().dated_todos.filter(x=>['preflight-ordinary','preflight-central']
    .includes(x.todo_id)).map(x=>x.state)};
  window.ReadySetSpecialistTargets={hideSeekV2:'https://hide.example.test/v2.html'};
  p.upsertDatedTodo({...central,provenance:{...central.provenance,target_learning_ids:[]}});
  document.getElementById('startBtn').click();
  const missingIds={active:state.activeSession,
   states:p.snapshot().dated_todos.filter(x=>['preflight-ordinary','preflight-central']
    .includes(x.todo_id)).map(x=>x.state)};
  host.detach();
  return {missingRoute,missingIds};
 });
 expect(result.missingRoute.active).toBeNull();
 expect(result.missingRoute.states).toEqual(['PLANNED','PLANNED']);
 expect(result.missingIds.active).toBeNull();
 expect(result.missingIds.states).toEqual(['PLANNED','PLANNED']);
});
