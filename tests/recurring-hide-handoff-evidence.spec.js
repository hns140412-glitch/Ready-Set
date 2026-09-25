const {test,expect}=require('@playwright/test');

test('recurring vocabulary TODO launches Hide with Learning Engine context and returns evidence to Planner',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const todoId=await page.evaluate(()=>{
    const today=new Date().toLocaleDateString('sv-SE');
    const todo=window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'hide_route_todo',
      date:today,
      label:'영어 · Unit 3',
      subject:'영어',
      assignment_id:'a_hide',
      analysis_id:'an_hide',
      learning_unit_id:'u_hide',
      source:'PLANNER_V2_ALLOCATION',
      state:'PLANNED',
      activity_types:['MEMORY','RECALL'],
      activity_sequence:['ENCODE','RECALL','CHECK'],
      concept_skill_target:'VOCABULARY',
      execution_plan:{
        authority:'READY_LEARNING_ENGINE_ROUTING',
        mode:'HIDE_SPECIALIST',
        primary_app:'hide-seek',
        allowed_specialists:['hide-seek'],
        handoff_queue:['hide-seek']
      },
      execution_app:'hide-seek'
    });
    return todo.todo_id;
  });

  await page.locator('#homeView [data-nav="mission"]').first().click();
  await page.locator('#plannerTodayList [data-todo-id="'+todoId+'"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();

  const prepared=await page.evaluate(()=>window.ReadySetRev07.prepareSpecialistLaunch('hide-seek'));
  expect(prepared.ok).toBe(true);
  expect(prepared.url).toContain('learning_context=');
  expect(prepared.url).toContain('route_authority=READY_LEARNING_ENGINE_ROUTING');

  await page.evaluate(()=>{
    const c=window.ReadySetRev07.contract();
    const t=c.tasks[0];
    window.dispatchEvent(new MessageEvent('message',{
      origin:'https://dainty-froyo-a6e427.netlify.app',
      data:{type:'TAKY_LEARNING_EVENT',event:{
        event_id:'hide_return_recurring_1',
        source:'hide-seek',
        event_type:'TASK_COMPLETED',
        session_id:c.session_id,
        task_id:t.task_id,
        lap_id:c.active_lap_id,
        payload:{
          sourceApp:'hide-seek',
          instrumentVersion:'hide-contract-v1',
          interactionMode:'RECALL',
          assisted:false,
          attemptCount:2,
          responseLatencyMs:900,
          taskState:'COMPLETED',
          taskContext:{session_id:c.session_id,task_id:t.task_id,lap_id:c.active_lap_id},
          memorySummary:{
            averageMemoryStrength:61,
            prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
            reviewPolicyOwner:'READY_LEARNING_ENGINE',
            scheduleOwner:'READY_SET_PLANNER',
            reviewAdvisories:[{lexicalId:'word_1',nextReviewPriority:91}]
          }
        }
      }}
    }));
  });

  await page.waitForFunction(()=>window.ReadySetRev07.contract().tasks[0].state==='COMPLETED');
  await page.locator('#completeBtn').click();
  await expect(page.locator('#readyRev07Wrap')).toBeVisible();
  await expect(page.locator('#rev07ConfirmEnd')).toBeEnabled();
  await page.locator('#rev07ConfirmEnd').click();

  await expect.poll(async()=>page.evaluate(()=>{
    const s=window.ReadySetPlanner.snapshot();
    const o=s.execution_observations.find(x=>x.todo_id==='hide_route_todo');
    const ev=o?.learning_evidence?.[0]||null;
    return o?{
      evidence:o.learning_evidence?.map(x=>x.evidence_type)||[],
      specialists:o.completed_specialists||[],
      concept_skill_target:ev?.concept_skill_target||null,
      instrument_version:ev?.instrument_version||null,
      interaction_mode:ev?.interaction_mode||null,
      assistance:ev?.assistance||null,
      attempt_count:ev?.attempt_count??null,
      response_latency_ms:ev?.response_latency_ms??null
    }:null;
  })).toEqual({
    evidence:['MEMORY_RETRIEVAL_EVIDENCE'],
    specialists:['hide-seek'],
    concept_skill_target:'VOCABULARY',
    instrument_version:'hide-contract-v1',
    interaction_mode:'RECALL',
    assistance:'UNASSISTED',
    attempt_count:2,
    response_latency_ms:900
  });
});
