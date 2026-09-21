const {test,expect}=require('@playwright/test');

test('P3 Hide Memory Summary returns into Ready Planner, TODAY, and Learning Master advisory',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const setup=await page.evaluate(()=>{
    const planner=window.ReadySetPlanner;
    const todo=planner.upsertDatedTodo({
      todo_id:'todo_p3_memory',
      label:'영어 단어 기억 탐험',
      assignment_id:'assignment_p3_memory',
      analysis_id:'analysis_p3_memory',
      learning_unit_id:'unit_p3_memory',
      allocation_run_id:'run_p3_memory',
      source:'PLANNER_P3_TEST'
    });
    state.activeSession={
      id:'session_p3_memory',
      startAt:Date.now(),
      plannerLinks:[{
        todo_id:todo.todo_id,
        label:todo.label,
        assignment_id:todo.assignment_id,
        analysis_id:todo.analysis_id,
        learning_unit_id:todo.learning_unit_id,
        allocation_run_id:todo.allocation_run_id
      }]
    };
    save();
    const handoff=window.ReadySetRev07.buildSpecialistHandoff('hide-seek');
    const contract=window.ReadySetRev07.contract();
    return {handoff,task:contract.tasks[0]};
  });

  expect(setup.handoff).toBeTruthy();
  expect(setup.task.planner_todo_id).toBe('todo_p3_memory');

  const summary={
    averageMemoryStrength:58,
    reasonCounts:{recovery:1,confusion:1,orthographic:2,latency:0,hint:1,decay:0,stable:3},
    needsUnassistedRecallCount:1,
    missionComposition:{newCount:12,reviewCount:24},
    morningMockTest:{
      recordedCount:36,
      resultCounts:{CORRECT:30,CONFUSED:2,WRONG:2,ASSISTED_CORRECT:1,RECOVERED_CORRECT:1}
    },
    thinkingSceneAssistanceCount:4,
    topReviewPriorities:[
      {lexicalId:'essential::필수적인',priority:94,reason:'orthographic'},
      {lexicalId:'benefit::혜택',priority:81,reason:'confusion'}
    ]
  };

  const specialistReport={
    explorationMissionId:'mission-hide-001',
    explorationMissionTitle:'9월 21일 단어 탐험',
    inputActorRole:'CHILD',
    validWordCount:12,
    trailMastery:64,
    learningPhase:'weak',
    finalSeekAttemptCount:7,
    seekAgainRemainingCount:2,
    missionComposition:{expectedNew:12,expectedReview:24,layoutIndependent:true},
    morningMockTestSummary:{recordedCount:36},
    specialistAuthority:'SPECIALIST_MEMORY_ADVISORY_ONLY'
  };

  const returned=await page.evaluate(({handoff,summary,specialistReport})=>{
    const p=new URLSearchParams();
    p.set('session_id',handoff.session_id);
    p.set('goal_id',handoff.goal_id);
    p.set('task_id',handoff.task_id);
    p.set('lap_id',handoff.lap_id);
    p.set('task_state','PARTIAL');
    p.set('from_app','hide-seek');
    p.set('event_id','hide-memory-event-1');
    p.set('memory_summary',JSON.stringify(summary));
    p.set('specialist_report',JSON.stringify(specialistReport));
    history.replaceState(null,'',location.pathname+'?'+p.toString());
    window.ReadySetRev07.consumeReturnQuery();

    const planner=window.ReadySetPlanner;
    const snap=planner.snapshot();
    const today=planner.todayProjection().find(x=>x.todo_id==='todo_p3_memory');
    const signal=planner.specialistMemorySignal('assignment_p3_memory',{current_revision:1});
    const contract=window.ReadySetRev07.contract();
    const task=contract.tasks.find(x=>x.task_id===handoff.task_id);
    return {
      url:location.href,
      observations:snap.specialist_memory_observations,
      todo:snap.dated_todos.find(x=>x.todo_id==='todo_p3_memory'),
      today,
      signal,
      task
    };
  },{handoff:setup.handoff,summary,specialistReport});

  expect(returned.url).not.toContain('memory_summary=');
  expect(returned.observations).toHaveLength(1);
  expect(returned.observations[0].authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
  expect(returned.observations[0].exploration_mission_id).toBe('mission-hide-001');
  expect(returned.observations[0].input_actor_role).toBe('CHILD');
  expect(returned.observations[0].specialist_progress.valid_word_count).toBe(12);
  expect(returned.observations[0].specialist_progress.trail_mastery).toBe(64);
  expect(returned.todo.exploration_mission_id).toBe('mission-hide-001');
  expect(returned.todo.specialist_input_actor_role).toBe('CHILD');
  expect(returned.task.exploration_mission_id).toBe('mission-hide-001');
  expect(returned.task.input_actor_role).toBe('CHILD');
  expect(returned.todo.memory_followup_advisory).toBeTruthy();
  expect(returned.today.memory_followup_advisory).toBeTruthy();
  expect(returned.today.specialist_memory_summary.needsUnassistedRecallCount).toBe(1);
  expect(returned.signal.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
  expect(returned.signal.risk_band).toBe('HIGH');
  expect(returned.signal.cannot_influence).toContain('ASSIGNMENT_FACT');
  expect(returned.signal.cannot_influence).toContain('STUDY_VOLUME');
  expect(returned.task.specialist_memory_summary.averageMemoryStrength).toBe(58);
  expect(returned.task.specialist_memory_summary.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
  expect(returned.task.specialist_memory_summary.missionComposition).toEqual({newCount:12,reviewCount:24});
  expect(returned.task.specialist_memory_summary.morningMockTest.recordedCount).toBe(36);
  expect(returned.task.specialist_memory_summary.morningMockTest.resultCounts.WRONG).toBe(2);
  expect(returned.task.specialist_memory_summary.thinkingSceneAssistanceCount).toBe(4);
  expect(returned.task.specialist_report.missionComposition).toEqual({expectedNew:12,expectedReview:24,layoutIndependent:true});
  expect(returned.task.specialist_report.specialistAuthority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');

  const learning=await page.evaluate(signal=>{
    const fact={
      assignment_id:'assignment_future_memory',
      confirmation_state:'FACT_CONFIRMED',
      deadline_state:'CONFIRMED',
      source_type:'GENERIC_CHILD_ASSIGNMENT',
      subject:'vocabulary',
      source_range:'1~10단어',
      teacher_instruction:'',
      claims:[],
      updated_at:new Date().toISOString()
    };
    return window.ReadyLearningMasterV01.interpretFact(fact,{specialist_memory_signal:signal});
  },returned.signal);

  expect(learning.analysis.specialist_memory_signal.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
  expect(learning.learning_units[0].analysis_provenance.specialist_memory_signal.authority).toBe('SPECIALIST_MEMORY_ADVISORY_ONLY');
  expect(learning.learning_units[0].activity_sequence).toContain('SHORT_CHECKPOINT');
  expect(learning.learning_units[0].activity_load.recovery_need).toBe('HIGH');

  const duplicate=await page.evaluate(({handoff,summary,specialistReport})=>window.ReadySetRev07.applyInboundResult({
    session_id:handoff.session_id,
    goal_id:handoff.goal_id,
    task_id:handoff.task_id,
    lap_id:handoff.lap_id,
    task_state:'PARTIAL',
    from_app:'hide-seek',
    event_id:'hide-memory-event-1',
    memory_summary:summary,
    specialist_report:specialistReport
  }),{handoff:setup.handoff,summary,specialistReport});
  expect(duplicate).toBeFalsy();

  const count=await page.evaluate(()=>window.ReadySetPlanner.snapshot().specialist_memory_observations.length);
  expect(count).toBe(1);
});
