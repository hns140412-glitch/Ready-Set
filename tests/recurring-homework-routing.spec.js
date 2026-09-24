const {test,expect}=require('@playwright/test');

test('Learning Engine interprets recurring English work and Planner materializes weekday TODOs with specialist execution routes',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const result=await page.evaluate(()=>{
    const ref=window.ReadyAssignments.upsertWorkbookRef({
      workbook_ref_id:'recurring_book',
      name:'Recurring English',
      subject:'영어',
      provenance:{kind:'TEST'}
    });
    const fact=window.ReadyAssignments.upsertEnglishAssignment({
      actor:'PARENT',
      assignment_id:'recurring_english_assignment',
      workbook_ref_id:ref.workbook_ref_id,
      source_date:'2026-09-21',
      source_range:'p.10~12',
      weekday_prints:{MON:'월 프린트',WED:'수 프린트',FRI:'금 프린트'},
      recurring_days:[1,3,5],
      components:{vocabulary:'Unit 3'},
      teacher_instruction:'',
      next_academy:'2026-09-28',
      provenance:{kind:'TEST'}
    });
    window.ReadyAssignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
    return window.ReadyIntegrationV1.processAssignment(fact.assignment_id,{start_date:'2026-09-21'});
  });
  expect(result.ok).toBeTruthy();

  const data=await page.evaluate(()=>{
    const a=window.ReadyAssignments.load();
    const fact=a.assignmentFacts.recurring_english_assignment;
    const analysis=a.analyses[fact.current_analysis_id];
    const units=(analysis.learning_unit_ids||[]).map(id=>a.learningUnits[id]);
    const todos=window.ReadySetPlanner.snapshot().dated_todos.filter(x=>x.assignment_id==='recurring_english_assignment');
    return {units,todos};
  });

  const vocabUnit=data.units.find(x=>x.concept_skill_target==='VOCABULARY');
  expect(vocabUnit).toBeTruthy();
  expect(vocabUnit.preferred_days).toEqual([1,3,5]);

  const vocabTodos=data.todos.filter(x=>x.concept_skill_target==='VOCABULARY');
  expect(vocabTodos.map(x=>x.date).sort()).toEqual(['2026-09-21','2026-09-23','2026-09-25']);
  expect(new Set(vocabTodos.map(x=>x.execution_app))).toEqual(new Set(['hide-seek']));
  expect(vocabTodos.every(x=>x.execution_plan?.authority==='READY_LEARNING_ENGINE_ROUTING')).toBeTruthy();

  const printTodos=data.todos.filter(x=>String(x.concept_skill_target||'').endsWith('_PRINT'));
  expect(printTodos.map(x=>x.date).sort()).toEqual(['2026-09-21','2026-09-23','2026-09-25']);
  expect(new Set(printTodos.map(x=>x.execution_app))).toEqual(new Set(['ready-set']));
});

test('direct event task remains independent of recurring homework rules',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('#homeView [data-nav="mission"]').first().click();
  await page.locator('#eventTaskInput').fill('오늘만 피아노 한 곡');
  await page.locator('#addEventTaskBtn').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusMission')).toContainText('오늘만 피아노 한 곡');
});
