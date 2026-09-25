const {test,expect}=require('@playwright/test');

test('same terminal learning evidence is reviewed once only',async({page})=>{
  await page.addInitScript(()=>{window.__READY_AUTH_BOOTSTRAP__={authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'};});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const r=await page.evaluate(()=>{
    const ref=window.ReadyAssignments.upsertWorkbookRef({workbook_ref_id:'idem_book',name:'Idem Vocabulary',subject:'영어'});
    const fact=window.ReadyAssignments.upsertEnglishAssignment({actor:'PARENT',assignment_id:'idem_assignment',workbook_ref_id:ref.workbook_ref_id,source_date:'2026-09-21',source_range:'p.1',recurring_days:[1,3,5],components:{vocabulary:'Unit 1'},next_academy:'2026-09-28'});
    window.ReadyAssignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
    let state=window.ReadyAssignments.load();
    const first=window.ReadyIntegrationV1.processAssignment(fact.assignment_id,{candidate_dates:['2026-09-21','2026-09-23','2026-09-25']});
    const todo=first.todos.find(x=>x.concept_skill_target==='VOCABULARY')||first.todos[0];
    const p=window.ReadySetPlanner;
    p.recordTaskState({todo_id:todo.todo_id,ready_state:'IN_PROGRESS',session_id:'idem_session',task_id:'idem_task',at:'2026-09-21T07:00:00.000Z'});
    const terminalOne=p.recordSessionOutcome({todo_id:todo.todo_id,ready_state:'COMPLETED',actual_ms:600000,session_id:'idem_session',task_id:'idem_task',learning_evidence:[{event_id:'idem_evidence_1',evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',memory:{average_strength:42,review_advisories:[{nextReviewPriority:91}]}}],completed_specialists:['hide-seek'],at:'2026-09-21T07:10:00.000Z'});
    const terminalTwo=p.recordSessionOutcome({todo_id:todo.todo_id,ready_state:'COMPLETED',actual_ms:600000,session_id:'idem_session',task_id:'idem_task',learning_evidence:[{event_id:'idem_evidence_1',evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',memory:{average_strength:42,review_advisories:[{nextReviewPriority:91}]}}],completed_specialists:['hide-seek'],at:'2026-09-21T07:10:00.000Z'});
    const observationCountBeforeReview=p.learningHistory(fact.assignment_id,{current_revision:1}).length;
    state=window.ReadyAssignments.load();
    const liveFact=state.assignmentFacts[fact.assignment_id];
    const liveAnalysis=state.analyses[liveFact.current_analysis_id];
    const vocabUnit=liveAnalysis.learning_unit_ids.map(id=>state.learningUnits[id]).find(x=>x.concept_skill_target==='VOCABULARY')||
      state.learningUnits[liveAnalysis.learning_unit_ids[0]];
    const decision={
      ok:true,
      decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',
      authority:'LEARNING_DECISION_INTENT_ONLY',
      scope:{member_id:'TEST_PARENT',subject:vocabUnit.subject,concept_skill_target:vocabUnit.concept_skill_target},
      blockers:[],
      advisories:[],
      pedagogical_actions:[
        {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY'],targets:['idem_evidence_1']},
        {intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',bases:['RETENTION_AT_RISK'],targets:['idem_evidence_1']}
      ],
      adaptive_plan:{
        ok:true,
        adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',
        authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
        unit_span_policy:'REDUCE',
        add_checkpoint:true,
        add_retrieval_checkpoint:true,
        recovery_floor:'HIGH',
        assistance_policy:'UNCHANGED',
        target_learning_ids:['idem_evidence_1'],
        rationale:[{intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY']}],
        cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DUE_AT','DEADLINE','ASSIGNMENT_FACT']
      },
      execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
      consumer_contract:{ready:'MAY_TRANSLATE_INTENT_TO_EXECUTION_PLAN',planner:'OWNS_DATED_ALLOCATION',specialist:'OWNS_INTERACTION_EXECUTION_AND_EVIDENCE'}
    };
    const reviewInput={
      start_date:'2026-09-22',
      learning_decision:decision,
      learning_decision_ref:'decision:idem-001'
    };
    const one=window.ReadyIntegrationV1.reviewLearningEvidence(fact.assignment_id,reviewInput);
    state=window.ReadyAssignments.load();
    const analysisAfterOne=state.assignmentFacts[fact.assignment_id].current_analysis_id;
    const todoCountAfterOne=p.snapshot().dated_todos.filter(x=>x.assignment_id===fact.assignment_id&&x.state!=='SUPERSEDED').length;
    const two=window.ReadyIntegrationV1.reviewLearningEvidence(fact.assignment_id,reviewInput);
    state=window.ReadyAssignments.load();
    return {terminalOne,terminalTwo,observationCountBeforeReview,one,two,analysisAfterOne,analysisAfterTwo:state.assignmentFacts[fact.assignment_id].current_analysis_id,todoCountAfterOne,todoCountAfterTwo:p.snapshot().dated_todos.filter(x=>x.assignment_id===fact.assignment_id&&x.state!=='SUPERSEDED').length,receipt:state.assignmentFacts[fact.assignment_id].learning_evidence_review};
  });
  expect(r.terminalOne.ok).toBe(true);
  expect(r.terminalTwo.ok).toBe(false);
  expect(r.terminalTwo.reason).toBe('TODO_NOT_FINISHABLE');
  expect(r.observationCountBeforeReview).toBe(1);
  expect(r.one.ok).toBe(true);
  expect(r.two.ok).toBe(false);
  expect(r.two.reason).toBe('LEARNING_EVIDENCE_ALREADY_REVIEWED');
  expect(r.analysisAfterTwo).toBe(r.analysisAfterOne);
  expect(r.todoCountAfterTwo).toBe(r.todoCountAfterOne);
  expect(r.one.legacy_learning_logic_used).toBe(false);
  expect(r.receipt.review_key).toBe('CORE_DECISION:decision:idem-001');
  expect(r.receipt.evidence_count).toBe(0);
});
