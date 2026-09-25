const {test,expect}=require('@playwright/test');

test('consolidated recurring learning journey closes the full Ready -> Hide -> evidence -> adaptive replan seam',async({page})=>{
  await page.addInitScript(()=>{
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
    const dateKey=d=>d.toLocaleDateString('sv-SE');
    const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);x.setHours(12,0,0,0);return x;};
    const today=new Date();today.setHours(12,0,0,0);
    const recurringDays=[0,2,4].map(n=>addDays(today,n).getDay());
    const candidateDates=Array.from({length:9},(_,i)=>dateKey(addDays(today,i)));

    const ref=window.ReadyAssignments.upsertWorkbookRef({
      workbook_ref_id:'journey_vocab_book',
      name:'Journey Vocabulary',
      subject:'영어',
      provenance:{kind:'TEST'}
    });
    const fact=window.ReadyAssignments.upsertEnglishAssignment({
      actor:'PARENT',
      assignment_id:'journey_vocab_assignment',
      workbook_ref_id:ref.workbook_ref_id,
      source_date:dateKey(today),
      source_range:'Unit 7',
      recurring_days:recurringDays,
      components:{vocabulary:'Unit 7'},
      next_academy:dateKey(addDays(today,9)),
      provenance:{kind:'TEST'}
    });
    window.ReadyAssignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
    const processed=window.ReadyIntegrationV1.processAssignment(fact.assignment_id,{candidate_dates:candidateDates});
    const domain=window.ReadyAssignments.load();
    const confirmed=domain.assignmentFacts[fact.assignment_id];
    const todos=window.ReadySetPlanner.snapshot().dated_todos.filter(x=>
      x.assignment_id===fact.assignment_id&&
      x.concept_skill_target==='VOCABULARY'&&
      x.state!=='SUPERSEDED'
    );
    const todayTodo=todos.find(x=>x.date===dateKey(today));
    return {
      processed,
      assignment_id:fact.assignment_id,
      initial_analysis_id:confirmed.current_analysis_id,
      today:dateKey(today),
      today_todo:todayTodo||null,
      recurring_days:recurringDays,
      candidate_dates:candidateDates
    };
  });

  expect(seeded.processed.ok).toBe(true);
  expect(seeded.today_todo).toBeTruthy();
  expect(seeded.today_todo.execution_app).toBe('hide-seek');
  expect(seeded.today_todo.execution_plan?.authority).toBe('READY_EXECUTION_ROUTING');

  await page.locator('#homeView [data-nav="mission"]').first().click();
  const row=page.locator('#plannerTodayList [data-todo-id="'+seeded.today_todo.todo_id+'"]');
  await expect(row).toBeVisible();
  await row.click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();

  const prepared=await page.evaluate(()=>window.ReadySetRev07.prepareSpecialistLaunch('hide-seek'));
  expect(prepared.ok).toBe(true);
  expect(prepared.url).toContain('route_authority=READY_EXECUTION_ROUTING');

  await page.evaluate(()=>{
    const c=window.ReadySetRev07.contract();
    const t=c.tasks[0];
    window.dispatchEvent(new MessageEvent('message',{
      origin:'https://dainty-froyo-a6e427.netlify.app',
      data:{type:'TAKY_LEARNING_EVENT',event:{
        event_id:'journey_hide_return_1',
        source:'hide-seek',
        event_type:'TASK_COMPLETED',
        session_id:c.session_id,
        task_id:t.task_id,
        lap_id:c.active_lap_id,
        payload:{
          sourceApp:'hide-seek',
          taskState:'COMPLETED',
          taskContext:{session_id:c.session_id,task_id:t.task_id,lap_id:c.active_lap_id},
          memorySummary:{
            averageMemoryStrength:42,
            prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
            reviewPolicyOwner:'READY_LEARNING_ENGINE',
            scheduleOwner:'READY_SET_PLANNER',
            reviewAdvisories:[{lexicalId:'journey_word_1',nextReviewPriority:91}]
          }
        }
      }}
    }));
  });

  await page.waitForFunction(()=>window.ReadySetRev07.contract()?.tasks?.[0]?.state==='COMPLETED');
  await page.locator('#completeBtn').click();
  await expect(page.locator('#readyRev07Wrap')).toBeVisible();
  await expect(page.locator('#rev07ConfirmEnd')).toBeEnabled();
  await page.locator('#rev07ConfirmEnd').click();
  await expect(page.locator('#resultView')).toHaveClass(/active/);

  const coreReview=await page.evaluate(seed=>{
    const decision={
      ok:true,
      decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',
      authority:'LEARNING_DECISION_INTENT_ONLY',
      scope:{
        member_id:'TEST_PARENT',
        subject:'영어',
        concept_skill_target:'VOCABULARY'
      },
      blockers:[],
      advisories:[],
      pedagogical_actions:[
        {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['SPECIALIST_MEMORY_CONCERN']},
        {intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',bases:['RETENTION_AT_RISK']}
      ],
      adaptive_plan:{
        ok:true,
        adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',
        authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
        scope:{
          member_id:'TEST_PARENT',
          subject:'영어',
          concept_skill_target:'VOCABULARY'
        },
        unit_span_policy:'UNCHANGED',
        add_checkpoint:true,
        add_retrieval_checkpoint:true,
        recovery_floor:'HIGH',
        assistance_policy:'UNCHANGED',
        target_learning_ids:[],
        rationale:[
          {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',bases:['SPECIALIST_MEMORY_CONCERN']}
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
    return window.ReadyIntegrationV1.reviewLearningEvidence(seed.assignment_id,{
      learning_decision:decision,
      learning_decision_ref:'decision:consolidated-learning-journey',
      candidate_dates:seed.candidate_dates,
      start_date:seed.today
    });
  },seeded);
  expect(coreReview.ok).toBe(true);
  expect(coreReview.legacy_learning_logic_used).toBe(false);

  const finalState=await expect.poll(async()=>page.evaluate(({assignment_id,initial_analysis_id,today,recurring_days})=>{
    const domain=window.ReadyAssignments.load();
    const fact=domain.assignmentFacts[assignment_id];
    const analysis=fact?.current_analysis_id?domain.analyses[fact.current_analysis_id]:null;
    const units=(analysis?.learning_unit_ids||[]).map(id=>domain.learningUnits[id]);
    const vocab=units.find(x=>x.concept_skill_target==='VOCABULARY')||null;
    const planner=window.ReadySetPlanner.snapshot();
    const observation=planner.execution_observations.find(x=>
      x.assignment_id===assignment_id||
      planner.dated_todos.some(t=>t.assignment_id===assignment_id&&t.todo_id===x.todo_id)
    )||null;
    const future=planner.dated_todos.filter(x=>
      x.assignment_id===assignment_id&&
      x.analysis_id===fact?.current_analysis_id&&
      x.concept_skill_target==='VOCABULARY'&&
      x.state!=='SUPERSEDED'&&
      x.date>today
    );
    return {
      analysis_changed:!!fact?.current_analysis_id&&fact.current_analysis_id!==initial_analysis_id,
      checkpoint:!!vocab?.activity_sequence?.includes('RETRIEVAL_CHECKPOINT'),
      recovery_need:vocab?.activity_load?.recovery_need||null,
      evidence_types:observation?.learning_evidence?.map(x=>x.evidence_type)||[],
      specialists:observation?.completed_specialists||[],
      future_days:future.map(x=>new Date(x.date+'T12:00:00').getDay()),
      future_count:future.length,
      recurring_days
    };
  },seeded),{timeout:5000}).toMatchObject({
    analysis_changed:true,
    checkpoint:true,
    recovery_need:'HIGH',
    evidence_types:['MEMORY_RETRIEVAL_EVIDENCE'],
    specialists:['hide-seek']
  });

  const snapshot=await page.evaluate(({assignment_id,today,recurring_days})=>{
    const domain=window.ReadyAssignments.load();
    const fact=domain.assignmentFacts[assignment_id];
    const planner=window.ReadySetPlanner.snapshot();
    const future=planner.dated_todos.filter(x=>
      x.assignment_id===assignment_id&&
      x.analysis_id===fact.current_analysis_id&&
      x.concept_skill_target==='VOCABULARY'&&
      x.state!=='SUPERSEDED'&&
      x.date>today
    );
    return {future_days:future.map(x=>new Date(x.date+'T12:00:00').getDay()),future_count:future.length,recurring_days};
  },seeded);

  expect(snapshot.future_count).toBeGreaterThan(0);
  expect(snapshot.future_days.every(day=>snapshot.recurring_days.includes(day))).toBe(true);
});
