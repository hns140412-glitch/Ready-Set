const {test,expect}=require('@playwright/test');

test('weak Hide memory evidence automatically adapts future recurring vocabulary without changing weekday authority',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const seeded=await page.evaluate(()=>{
    const ref=window.ReadyAssignments.upsertWorkbookRef({
      workbook_ref_id:'adaptive_vocab_book',name:'Adaptive Vocabulary',subject:'영어',provenance:{kind:'TEST'}
    });
    const fact=window.ReadyAssignments.upsertEnglishAssignment({
      actor:'PARENT',
      assignment_id:'adaptive_vocab_assignment',
      workbook_ref_id:ref.workbook_ref_id,
      source_date:'2026-09-21',
      source_range:'p.10',
      recurring_days:[1,3,5],
      components:{vocabulary:'Unit 3'},
      next_academy:'2026-09-28',
      provenance:{kind:'TEST'}
    });
    window.ReadyAssignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
    const first=window.ReadyIntegrationV1.processAssignment(fact.assignment_id,{
      candidate_dates:['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25']
    });
    const state=window.ReadyAssignments.load();
    const confirmed=state.assignmentFacts[fact.assignment_id];
    const todos=window.ReadySetPlanner.snapshot().dated_todos.filter(x=>
      x.assignment_id===fact.assignment_id&&x.concept_skill_target==='VOCABULARY'
    );
    return {
      assignment_id:fact.assignment_id,
      initial_analysis_id:confirmed.current_analysis_id,
      monday_todo:todos.find(x=>x.date==='2026-09-21'),
      dates:todos.map(x=>x.date).sort()
    };
  });
  expect(seeded.dates).toEqual(['2026-09-21','2026-09-23','2026-09-25']);
  expect(seeded.monday_todo).toBeTruthy();

  const adapted=await page.evaluate(seeded=>{
    const p=window.ReadySetPlanner;
    const todo=seeded.monday_todo;
    p.recordTaskState({
      todo_id:todo.todo_id,ready_state:'IN_PROGRESS',
      session_id:'adaptive_hide_session',task_id:'adaptive_hide_task',
      at:'2026-09-21T07:00:00.000Z'
    });
    p.recordSessionOutcome({
      todo_id:todo.todo_id,ready_state:'COMPLETED',actual_ms:12*60000,
      session_id:'adaptive_hide_session',task_id:'adaptive_hide_task',
      learning_evidence:[{
        evidence_contract:'READY_EVIDENCE_ONTOLOGY_V01',
        event_id:'adaptive_memory_evidence_1',
        evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
        authority:'READY_EVIDENCE_RECORD',
        interpretation_owner:'READY_LEARNING_ENGINE',
        memory:{
          average_strength:42,
          review_advisories:[{lexicalId:'word_1',nextReviewPriority:91}],
          next_review_semantics:'ADVISORY_SIGNAL_NOT_DATE',
          review_policy_owner:'READY_LEARNING_ENGINE',
          schedule_owner:'READY_SET_PLANNER'
        }
      }],
      completed_specialists:['hide-seek'],
      at:'2026-09-21T07:12:00.000Z'
    });

    const beforeDomain=window.ReadyAssignments.load();
    const beforeFact=beforeDomain.assignmentFacts[seeded.assignment_id];
    const beforeAnalysis=beforeDomain.analyses[beforeFact.current_analysis_id];
    const beforeUnits=beforeAnalysis.learning_unit_ids.map(id=>beforeDomain.learningUnits[id]);
    const vocabBefore=beforeUnits.find(x=>x.concept_skill_target==='VOCABULARY');
    const decision={
      ok:true,
      decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',
      authority:'LEARNING_DECISION_INTENT_ONLY',
      scope:{
        member_id:window.ReadyFamilySession?.current?.()?.member_id||'TEST_PARENT',
        subject:vocabBefore.subject,
        concept_skill_target:'VOCABULARY'
      },
      blockers:[],
      advisories:[],
      pedagogical_actions:[
        {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY'],targets:['word_1']},
        {intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',bases:['RETENTION_AT_RISK'],targets:['word_1']}
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
        target_learning_ids:['word_1'],
        rationale:[{intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY']}],
        cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DUE_AT','DEADLINE','ASSIGNMENT_FACT']
      },
      execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
      consumer_contract:{
        ready:'MAY_TRANSLATE_INTENT_TO_EXECUTION_PLAN',
        planner:'OWNS_DATED_ALLOCATION',
        specialist:'OWNS_INTERACTION_EXECUTION_AND_EVIDENCE'
      }
    };
    const review=window.ReadyIntegrationV1.reviewLearningEvidence(seeded.assignment_id,{
      start_date:'2026-09-22',
      learning_decision:decision,
      learning_decision_ref:'decision:recurring-memory-loop'
    });
    const domain=window.ReadyAssignments.load();
    const fact=domain.assignmentFacts[seeded.assignment_id];
    const analysis=domain.analyses[fact.current_analysis_id];
    const units=(analysis.learning_unit_ids||[]).map(id=>domain.learningUnits[id]);
    const vocab=units.find(x=>x.concept_skill_target==='VOCABULARY');
    const todos=p.snapshot().dated_todos.filter(x=>
      x.assignment_id===seeded.assignment_id&&
      x.analysis_id===fact.current_analysis_id&&
      x.concept_skill_target==='VOCABULARY'&&
      x.state!=='SUPERSEDED'
    );
    return {review,fact,analysis,vocab,todos};
  },seeded);

  expect(adapted.review.ok).toBe(true);
  expect(adapted.review.legacy_learning_logic_used).toBe(false);
  expect(adapted.fact.current_analysis_id).not.toBe(seeded.initial_analysis_id);
  expect(adapted.analysis.adaptive_review_policy.authority).toBe('CORE_ADAPTIVE_PLAN_APPLIED');
  expect(adapted.analysis.adaptive_review_policy.add_retrieval_checkpoint).toBe(true);
  expect(adapted.analysis.adaptive_review_policy.recovery_floor).toBe('HIGH');
  expect(adapted.analysis.adaptive_review_policy.target_lexical_ids).toEqual(['word_1']);
  expect(adapted.vocab.review_lexical_ids).toEqual(['word_1']);
  expect(adapted.vocab.preferred_days).toEqual([1,3,5]);
  expect(adapted.vocab.activity_sequence).toContain('RETRIEVAL_CHECKPOINT');
  expect(adapted.vocab.activity_load.recovery_need).toBe('HIGH');

  const futureDates=adapted.todos.map(x=>x.date).sort();
  expect(futureDates).toEqual(['2026-09-23','2026-09-25']);
  expect(adapted.todos.every(x=>[1,3,5].includes(new Date(x.date+'T12:00:00').getDay()))).toBe(true);
  expect(adapted.todos.every(x=>Array.isArray(x.review_lexical_ids)&&x.review_lexical_ids.includes('word_1'))).toBe(true);
  expect(adapted.review.ok).toBe(true);
  expect(adapted.analysis.core_adaptive_plan.authority).toBe('LEARNING_ADAPTIVE_PLAN_INTENT_ONLY');
  expect(adapted.analysis.adaptive_review_policy.target_lexical_ids).toEqual(['word_1']);
  expect(adapted.todos.every(x=>x.learning_decision_projection?.adaptive_plan?.authority==='LEARNING_ADAPTIVE_PLAN_INTENT_ONLY')).toBe(true);
});
