const { test, expect } = require('@playwright/test');

test('repeated PARTIAL carry feeds specialist evidence back into Learning Master and replans finer units', async ({ page }) => {
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,
      family_id:'TEST_FAMILY',
      member_id:'TEST_PARENT',
      role:'PARENT',
      session_id:'TEST_SESSION',
      expires_at:'2099-01-01T00:00:00.000Z',
      source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const seeded=await page.evaluate(()=>{
    const fmt=d=>d.toLocaleDateString('sv-SE');
    const today=new Date();
    const deadline=new Date(today);deadline.setDate(deadline.getDate()+14);
    const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map(subject=>({
      subject,
      source_range:subject==='수학'?'1~20번':'1번'
    }));
    const pkg=window.ReadyAssignments.upsertTalentPackage({
      actor:'PARENT',
      source_date:fmt(today),
      deadline_boundary:fmt(deadline),
      books
    });
    let domain=window.ReadyAssignments.load();
    const mathFact=Object.values(domain.assignmentFacts).find(x=>x.book_subject==='수학'&&pkg.fact_ids.includes(x.assignment_id));
    window.ReadyAssignments.confirmFact(mathFact.assignment_id,{actor:'PARENT'});
    const run=window.ReadyIntegrationV1.processAssignment(mathFact.assignment_id,{candidate_dates:[fmt(today)]});
    domain=window.ReadyAssignments.load();
    const fact=domain.assignmentFacts[mathFact.assignment_id];
    const analysis=domain.analyses[fact.current_analysis_id];
    return {
      assignment_id:mathFact.assignment_id,
      initial_analysis_id:fact.current_analysis_id,
      initial_unit_count:analysis.learning_unit_ids.length,
      first_todo:run.todos[0],
      today:fmt(today)
    };
  });
  expect(seeded.first_todo).toBeTruthy();

  const reviewed=await page.evaluate(async seeded=>{
    const p=window.ReadySetPlanner;
    const addDays=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE');};
    const memoryEvidence=[{
      evidence_contract:'READY_EVIDENCE_ONTOLOGY_V01',
      event_id:'memory_feedback_1',
      evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
      authority:'READY_EVIDENCE_RECORD',
      interpretation_owner:'READY_LEARNING_ENGINE',
      memory:{
        average_strength:42,
        review_advisories:[{lexicalId:'math_memory_proxy',nextReviewPriority:88}],
        next_review_semantics:'ADVISORY_SIGNAL_NOT_DATE',
        review_policy_owner:'READY_LEARNING_ENGINE',
        schedule_owner:'READY_SET_PLANNER'
      }
    }];

    const partial=(todoId,sessionId,evidence=[])=>{
      p.recordTaskState({todo_id:todoId,ready_state:'IN_PROGRESS',session_id:sessionId,task_id:todoId,at:new Date().toISOString()});
      return p.recordSessionOutcome({
        todo_id:todoId,ready_state:'PARTIAL',actual_ms:20*60000,
        session_id:sessionId,task_id:todoId,learning_evidence:evidence,
        completed_specialists:evidence.length?['hide-seek']:[],
        at:new Date().toISOString()
      });
    };

    let todo=seeded.first_todo;
    partial(todo.todo_id,'loop_s1');
    let carry=p.carryOverCandidates().find(x=>x.source_todo_id===todo.todo_id);
    let replanned=p.replanCarryOver({carry_over_id:carry.carry_over_id,date:addDays(seeded.today,1),max_auto_depth:2});
    todo=replanned.todo;

    partial(todo.todo_id,'loop_s2');
    carry=p.carryOverCandidates().find(x=>x.source_todo_id===todo.todo_id);
    replanned=p.replanCarryOver({carry_over_id:carry.carry_over_id,date:addDays(seeded.today,2),max_auto_depth:2});
    todo=replanned.todo;

    partial(todo.todo_id,'loop_s3',memoryEvidence);
    carry=p.carryOverCandidates().find(x=>x.source_todo_id===todo.todo_id);
    const escalation=p.replanCarryOver({carry_over_id:carry.carry_over_id,date:addDays(seeded.today,3),max_auto_depth:2});

    const beforeDomain=window.ReadyAssignments.load();
    const beforeFact=beforeDomain.assignmentFacts[seeded.assignment_id];
    const beforeAnalysis=beforeDomain.analyses[beforeFact.current_analysis_id];
    const beforeUnit=beforeDomain.learningUnits[beforeAnalysis.learning_unit_ids[0]];
    const decision={
      ok:true,
      decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',
      authority:'LEARNING_DECISION_INTENT_ONLY',
      scope:{
        member_id:window.ReadyFamilySession?.current?.()?.member_id||'TEST_PARENT',
        subject:beforeUnit.subject,
        concept_skill_target:beforeUnit.concept_skill_target
      },
      blockers:[],
      advisories:[],
      pedagogical_actions:[
        {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY'],targets:['math_memory_proxy']},
        {intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',bases:['RETENTION_AT_RISK'],targets:['math_memory_proxy']}
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
        target_learning_ids:['math_memory_proxy'],
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
    const review=window.ReadyIntegrationV1.reviewEscalatedCarryOver(carry.carry_over_id,{
      start_date:addDays(seeded.today,3),
      learning_decision:decision,
      learning_decision_ref:'decision:adaptive-learning-loop'
    });
    const domain=window.ReadyAssignments.load();
    const fact=domain.assignmentFacts[seeded.assignment_id];
    const analysis=domain.analyses[fact.current_analysis_id];
    const units=analysis.learning_unit_ids.map(id=>domain.learningUnits[id]);
    const planner=p.snapshot();
    return {
      escalation,
      review,
      fact,
      analysis,
      units,
      replanned_todos:planner.dated_todos.filter(x=>x.assignment_id===seeded.assignment_id&&x.analysis_id===fact.current_analysis_id)
    };
  },seeded);

  expect(reviewed.escalation.ok).toBe(false);
  expect(reviewed.escalation.reason).toBe('CARRY_OVER_ESCALATION_REQUIRED');
  expect(reviewed.escalation.escalation_level).toBe('PARENT_LEARNING_MASTER_REVIEW');
  expect(reviewed.review.ok).toBe(true);
  expect(reviewed.review.legacy_learning_logic_used).toBe(false);

  expect(reviewed.fact.current_analysis_id).not.toBe(seeded.initial_analysis_id);
  expect(reviewed.fact.previous_analysis_ids).toContain(seeded.initial_analysis_id);
  expect(reviewed.analysis.adaptive_review_policy.authority).toBe('CORE_ADAPTIVE_PLAN_APPLIED');
  expect(reviewed.analysis.adaptive_review_policy.reduce_unit_span).toBe(true);
  expect(reviewed.analysis.adaptive_review_policy.add_retrieval_checkpoint).toBe(true);
  expect(reviewed.analysis.adaptive_review_policy.recovery_floor).toBe('HIGH');

  expect(reviewed.units.length).toBeGreaterThan(seeded.initial_unit_count);
  expect(reviewed.units.every(x=>x.range_descriptor.count<=3)).toBe(true);
  expect(reviewed.units.every(x=>x.activity_sequence.includes('RETRIEVAL_CHECKPOINT'))).toBe(true);
  expect(reviewed.units.every(x=>x.activity_load.recovery_need==='HIGH')).toBe(true);
  expect(reviewed.units.every(x=>!('planner_date' in x)&&!('schedule_date' in x))).toBe(true);

  expect(reviewed.replanned_todos.length).toBeGreaterThan(0);
  expect(reviewed.replanned_todos.every(x=>x.analysis_id===reviewed.fact.current_analysis_id)).toBe(true);
});
