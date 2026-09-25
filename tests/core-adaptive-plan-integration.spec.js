const { test, expect } = require('@playwright/test');

test('Core adaptive plan replaces Ready-local learning judgment and Planner still owns dates', async ({page})=>{
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
    const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
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
    const fact=Object.values(domain.assignmentFacts).find(x=>x.book_subject==='수학'&&pkg.fact_ids.includes(x.assignment_id));
    window.ReadyAssignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
    const initial=window.ReadyIntegrationV1.processAssignment(fact.assignment_id,{candidate_dates:[fmt(today)]});
    domain=window.ReadyAssignments.load();
    const liveFact=domain.assignmentFacts[fact.assignment_id];
    const analysis=domain.analyses[liveFact.current_analysis_id];
    const units=analysis.learning_unit_ids.map(id=>domain.learningUnits[id]);
    return {
      assignment_id:fact.assignment_id,
      initial_analysis_id:liveFact.current_analysis_id,
      initial_unit_count:units.length,
      initial_max_count:Math.max(...units.map(x=>Number(x.range_descriptor?.count)||0)),
      concept_skill_target:units[0].concept_skill_target,
      today:fmt(today),
      tomorrow:fmt(tomorrow),
      initial_todo_ids:initial.todos.map(x=>x.todo_id)
    };
  });

  const reviewed=await page.evaluate(seed=>{
    const decision={
      ok:true,
      decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',
      authority:'LEARNING_DECISION_INTENT_ONLY',
      scope:{
        member_id:'TEST_PARENT',
        subject:'수학',
        concept_skill_target:seed.concept_skill_target
      },
      blockers:[],
      advisories:[],
      pedagogical_actions:[
        {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY']},
        {intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',bases:['RETENTION_AT_RISK']}
      ],
      adaptive_plan:{
        ok:true,
        adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',
        authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
        scope:{
          member_id:'TEST_PARENT',
          subject:'수학',
          concept_skill_target:seed.concept_skill_target
        },
        unit_span_policy:'REDUCE',
        add_checkpoint:true,
        add_retrieval_checkpoint:true,
        recovery_floor:'HIGH',
        assistance_policy:'UNCHANGED',
        target_learning_ids:[],
        rationale:[
          {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['UNRESOLVED_RECOVERY']}
        ],
        can_influence:['LEARNING_UNIT_SPAN_POLICY','ACTIVITY_SEQUENCE','RECOVERY_INTENSITY','CHECKPOINT_SELECTION'],
        cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DUE_AT','DEADLINE','ASSIGNMENT_FACT','SUBJECT_SOURCE_FACT']
      },
      execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
      consumer_contract:{
        ready:'MAY_TRANSLATE_INTENT_TO_EXECUTION_PLAN',
        planner:'OWNS_DATED_ALLOCATION',
        specialist:'OWNS_INTERACTION_EXECUTION_AND_EVIDENCE'
      }
    };
    const review=window.ReadyIntegrationV1.reviewLearningEvidence(seed.assignment_id,{
      learning_decision:decision,
      learning_decision_ref:'decision:core-adaptive-plan-test',
      candidate_dates:[seed.tomorrow],
      start_date:seed.tomorrow
    });
    const domain=window.ReadyAssignments.load();
    const fact=domain.assignmentFacts[seed.assignment_id];
    const analysis=domain.analyses[fact.current_analysis_id];
    const units=analysis.learning_unit_ids.map(id=>domain.learningUnits[id]);
    const todos=window.ReadySetPlanner.snapshot().dated_todos.filter(x=>x.assignment_id===seed.assignment_id);
    return {review,fact,analysis,units,todos};
  },seeded);

  expect(reviewed.review.ok).toBe(true);
  expect(reviewed.review.legacy_learning_logic_used).toBe(false);
  expect(reviewed.review.invalidation.superseded_todos).toBeGreaterThan(0);
  expect(reviewed.fact.current_analysis_id).not.toBe(seeded.initial_analysis_id);
  expect(reviewed.analysis.core_adaptive_plan.authority).toBe('LEARNING_ADAPTIVE_PLAN_INTENT_ONLY');
  expect(reviewed.analysis.adaptive_review_policy.authority).toBe('CORE_ADAPTIVE_PLAN_APPLIED');
  expect(reviewed.analysis.adaptive_review_policy.reduce_unit_span).toBe(true);
  expect(reviewed.analysis.adaptive_review_policy.add_retrieval_checkpoint).toBe(true);
  expect(reviewed.analysis.adaptive_review_policy.recovery_floor).toBe('HIGH');

  expect(reviewed.units.length).toBeGreaterThan(seeded.initial_unit_count);
  expect(Math.max(...reviewed.units.map(x=>Number(x.range_descriptor?.count)||0))).toBeLessThan(seeded.initial_max_count);
  expect(reviewed.units.every(x=>x.activity_sequence.includes('RETRIEVAL_CHECKPOINT'))).toBe(true);
  expect(reviewed.units.every(x=>x.activity_load.recovery_need==='HIGH')).toBe(true);
  expect(reviewed.units.every(x=>!('schedule_date' in x)&&!('planner_date' in x))).toBe(true);

  const active=reviewed.todos.filter(x=>x.state!=='SUPERSEDED');
  expect(active.length).toBeGreaterThan(0);
  expect(active.every(x=>x.date===seeded.tomorrow)).toBe(true);
  expect(active.every(x=>x.learning_decision_projection?.adaptive_plan?.authority==='LEARNING_ADAPTIVE_PLAN_INTENT_ONLY')).toBe(true);
  expect(active.every(x=>!('schedule_date' in (x.learning_decision_projection?.adaptive_plan||{})))).toBe(true);
  expect(active.every(x=>!('planner_date' in (x.learning_decision_projection?.adaptive_plan||{})))).toBe(true);
});
