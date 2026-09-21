const {test,expect}=require('@playwright/test');
test('Planner V2 accepts interpreted units and preserves full identity chain',async({page})=>{
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
  const out=await page.evaluate(()=>{
    const today=new Date().toLocaleDateString('sv-SE'),end=new Date();end.setDate(end.getDate()+7);const deadline=end.toLocaleDateString('sv-SE');
    const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`unit ${i}`}));
    const pkg=window.ReadyAssignments.upsertTalentPackage({actor:'PARENT',source_date:today,deadline_boundary:deadline,books});
    for(const id of pkg.fact_ids)window.ReadyAssignments.confirmFact(id,{actor:'PARENT'});
    const result=window.ReadyIntegrationV1.processAssignment(pkg.fact_ids[0],{candidate_dates:[today,deadline]});
    return {result,todo:window.ReadySetPlanner.snapshot().dated_todos[0],deadline};
  });
  expect(out.result.ok).toBeTruthy();
  for(const key of ['assignment_id','analysis_id','learning_unit_id','todo_id','template_id','allocation_run_id'])expect(out.todo[key]).toBeTruthy();
  expect(out.todo.date).not.toBe(out.deadline);
  expect(out.todo.estimated_minutes).toBeNull();
});


test('English academy day prioritizes vocabulary as morning review without inventing a clock time', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const out=await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    const dates=['2026-09-23','2026-09-24'];
    p.upsertScheduleCommitment({
      commitment_id:'english_academy_rule',
      title:'영어학원',
      category:'영어',
      start_at:'2026-09-24T17:00:00',
      end_at:'2026-09-24T19:00:00',
      confirmed:true,
      source:'TEST'
    });
    const domain={
      assignmentFacts:{
        a1:{assignment_id:'a1',confirmation_state:'FACT_CONFIRMED',deadline_state:'VERIFIED',deadline_boundary:'2026-09-25',analysis_state:'INTERPRETED',current_analysis_id:'an1',fact_revision:1,assignment_cycle:'ACADEMY'}
      },
      analyses:{an1:{analysis_id:'an1',learning_unit_ids:['u_vocab']}},
      learningUnits:{
        u_vocab:{
          learning_unit_id:'u_vocab',analysis_id:'an1',assignment_id:'a1',subject:'영어',
          source_range:'단어 20개',concept_skill_target:'VOCABULARY',
          activity_types:['MEMORY','RECALL','SELF_CHECK'],activity_sequence:['ENCODE','RECALL','CHECK'],
          cognitive_load_profile:['RETRIEVAL_LOAD'],
          activity_load:{score:3,difficulty:2,recovery_need:'LOW'},
          review_policy:'SELF_CHECK_AFTER_EXECUTION',parent_help_dependency:'LOW',state:'INTERPRETED'
        }
      }
    };
    const allocation=p.allocateLearningUnits({assignment_id:'a1',domain_state:domain,candidate_dates:dates});
    const committed=p.commitLearningAllocation(allocation.allocation_run_id);
    const todo=p.snapshot().dated_todos.find(x=>x.learning_unit_id==='u_vocab');
    return {allocation,committed,todo};
  });
  expect(out.allocation.ok).toBeTruthy();
  expect(out.todo.date).toBe('2026-09-24');
  expect(out.todo.operating_rule).toBe('ENGLISH_ACADEMY_MORNING_VOCAB_REVIEW');
  expect(out.todo.preferred_daypart).toBe('MORNING');
  expect(out.todo.operating_rule_evidence.commitment_id).toBe('english_academy_rule');
  expect(out.todo.time).toBeUndefined();
});
