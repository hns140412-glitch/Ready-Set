const { test, expect } = require('@playwright/test');

test('Ready enforces Hide -> Snap ordered specialist roundtrip without external deploy', async ({ page }) => {
  await page.route('https://dainty-froyo-a6e427.netlify.app/**', route => route.abort());
  await page.route('https://cheerful-pothos-d1c3ee.netlify.app/**', route => route.abort());

  await page.addInitScript(() => {
    const now=Date.now();
    localStorage.setItem('readyset_state', JSON.stringify({
      schemaVersion:5,
      profile:{name:'',photo:'',style:'editorial',shareAvatar:false},
      guide:{type:'lumi',name:'루미',voice:'warm'},
      guestHistory:[],
      records:[],
      selected:[],
      tasks:['영어 · 단어와 문장'],
      selectedTodoIds:[],
      targetMin:25,
      sound:'OFF',
      activeSession:{
        id:'e2e_session_1',
        startAt:now,
        targetMs:25*60*1000,
        pausedAt:null,
        issueMs:0,
        completed:false,
        selected:[],
        tasks:['영어 · 단어와 문장'],
        plannerLinks:[{
          todo_id:null,
          label:'영어 · 단어와 문장',
          subject:'영어',
          matched_domain:'표현',
          learning_unit_id:'unit_eng_e2e',
          analysis_id:'analysis_eng_e2e',
          assignment_id:'assignment_eng_e2e',
          activity_types:['RECALL','WRITING'],
          activity_sequence:['INPUT','BIDIRECTIONAL_RECALL','COMPREHEND','PRODUCE','SELF_REVIEW'],
          concept_skill_target:'단어 회상 후 자기 문장 표현',
          cognitive_load_profile:['RETRIEVAL_LOAD','LANGUAGE_PRODUCTION'],
          divisible_boundary:'LEARNING_ACTIVITY_BOUNDARY',
          confidence:0.8,
          unresolved_flags:[]
        }],
        sound:'OFF',
        recordingDone:false
      }
    }));
  });

  await page.goto('http://127.0.0.1:4173/');
  await page.waitForFunction(() => !!window.ReadySetRev07 && !!window.ReadySpecialistRouter && !!window.ReadyEvidenceOntology);

  const initial = await page.evaluate(() => window.ReadySetRev07.contract());
  expect(initial.tasks).toHaveLength(1);
  expect(initial.tasks[0].route_plan.handoff_queue).toEqual(['hide-seek','snap-pop']);
  expect(initial.tasks[0].completed_specialists).toEqual([]);
  expect(initial.tasks[0].active_specialist).toBeNull();

  expect(await page.locator('[data-rev07-app]').count()).toBe(1);
  await expect(page.locator('[data-rev07-app]')).toHaveAttribute('data-rev07-app','hide-seek');

  const snapBefore = await page.evaluate(() => window.ReadySetRev07.launchSpecialist('snap-pop'));
  expect(snapBefore).toBe(false);

  await page.evaluate(() => window.ReadySetRev07.launchSpecialist('hide-seek'));
  await page.waitForTimeout(50);
  let afterHideLaunch = await page.evaluate(() => window.ReadySetRev07.contract());
  expect(afterHideLaunch.tasks[0].active_specialist).toBe('hide-seek');

  await page.evaluate(() => {
    const c=window.ReadySetRev07.contract();
    const t=c.tasks[0];
    window.dispatchEvent(new MessageEvent('message',{
      origin:'https://dainty-froyo-a6e427.netlify.app',
      data:{
        type:'TAKY_LEARNING_EVENT',
        event:{
          event_id:'hide_e2e_1',
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
              authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
              averageMemoryStrength:58,
              prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
              reviewPolicyOwner:'READY_LEARNING_ENGINE',
              scheduleOwner:'READY_SET_PLANNER',
              reviewAdvisories:[{lexicalId:'word_1',nextReviewPriority:88}]
            }
          }
        }
      }
    }));
  });

  await page.waitForFunction(() => window.ReadySetRev07.contract().tasks[0].completed_specialists.includes('hide-seek'));
  const afterHideReturn = await page.evaluate(() => window.ReadySetRev07.contract());
  expect(afterHideReturn.tasks[0].state).toBe('PARTIAL');
  expect(afterHideReturn.tasks[0].active_specialist).toBeNull();
  expect(afterHideReturn.tasks[0].completed_specialists).toEqual(['hide-seek']);
  expect(afterHideReturn.tasks[0].learning_evidence.map(x=>x.evidence_type)).toEqual(['MEMORY_RETRIEVAL_EVIDENCE']);

  expect(await page.locator('[data-rev07-app]').count()).toBe(1);
  await expect(page.locator('[data-rev07-app]')).toHaveAttribute('data-rev07-app','snap-pop');

  await page.evaluate(() => window.ReadySetRev07.launchSpecialist('snap-pop'));
  await page.waitForTimeout(50);
  const afterSnapLaunch = await page.evaluate(() => window.ReadySetRev07.contract());
  expect(afterSnapLaunch.tasks[0].active_specialist).toBe('snap-pop');

  await page.evaluate(() => {
    const c=window.ReadySetRev07.contract();
    const t=c.tasks[0];
    window.dispatchEvent(new MessageEvent('message',{
      origin:'https://cheerful-pothos-d1c3ee.netlify.app',
      data:{
        type:'TAKY_LEARNING_EVENT',
        event:{
          event_id:'snap_e2e_1',
          type:'TASK_COMPLETED',
          app:'snap-pop',
          session_id:c.session_id,
          task_id:t.task_id,
          lap_id:c.active_lap_id,
          payload:{child_authored:true,landmark:'forest',step:3}
        }
      }
    }));
  });

  await page.waitForFunction(() => window.ReadySetRev07.contract().tasks[0].state === 'COMPLETED');
  const finalState = await page.evaluate(() => window.ReadySetRev07.contract());
  expect(finalState.tasks[0].completed_specialists).toEqual(['hide-seek','snap-pop']);
  expect(finalState.tasks[0].learning_evidence.map(x=>x.evidence_type)).toEqual([
    'MEMORY_RETRIEVAL_EVIDENCE',
    'LEARNER_PRODUCTION_EVIDENCE'
  ]);
  expect(finalState.tasks[0].state).toBe('COMPLETED');
  expect(finalState.tasks[0].active_specialist).toBeNull();
  expect(await page.locator('[data-rev07-app]').count()).toBe(0);

  const validation = await page.evaluate(() => window.ReadySetRev07.validate());
  expect(validation.ok).toBe(true);
});

test('Ready rejects specialist return that does not match active ordered handoff', async ({ page }) => {
  await page.addInitScript(() => {
    const now=Date.now();
    localStorage.setItem('readyset_state', JSON.stringify({
      schemaVersion:5,
      profile:{name:'',photo:'',style:'editorial',shareAvatar:false},
      guide:{type:'lumi',name:'루미',voice:'warm'},
      guestHistory:[],records:[],selected:[],tasks:['한자 기억'],selectedTodoIds:[],targetMin:25,sound:'OFF',
      activeSession:{
        id:'e2e_session_spoof',
        startAt:now,targetMs:1500000,pausedAt:null,issueMs:0,completed:false,selected:[],tasks:['한자 기억'],
        plannerLinks:[{
          label:'한자 기억',subject:'한자',learning_unit_id:'unit_hanja',
          activity_types:['MEMORY','RECALL'],
          activity_sequence:['FORM','SOUND','CORE_MEANING','RECALL']
        }],
        sound:'OFF',recordingDone:false
      }
    }));
  });

  await page.goto('http://127.0.0.1:4173/');
  await page.waitForFunction(() => !!window.ReadySetRev07);
  await page.route('https://dainty-froyo-a6e427.netlify.app/**', route => route.abort());
  await page.evaluate(() => window.ReadySetRev07.launchSpecialist('hide-seek'));
  await page.waitForTimeout(30);

  const before = await page.evaluate(() => window.ReadySetRev07.contract());
  await page.evaluate(() => {
    const c=window.ReadySetRev07.contract();
    const t=c.tasks[0];
    window.dispatchEvent(new MessageEvent('message',{
      origin:'https://cheerful-pothos-d1c3ee.netlify.app',
      data:{type:'TAKY_LEARNING_EVENT',event:{
        event_id:'spoof_snap_1',type:'TASK_COMPLETED',app:'snap-pop',
        session_id:c.session_id,task_id:t.task_id,lap_id:c.active_lap_id,
        payload:{child_authored:true}
      }}
    }));
  });
  await page.waitForTimeout(30);
  const after = await page.evaluate(() => window.ReadySetRev07.contract());
  expect(after.tasks[0].active_specialist).toBe('hide-seek');
  expect(after.tasks[0].completed_specialists).toEqual([]);
  expect(after.tasks[0].learning_evidence).toEqual([]);
  expect(after.tasks[0].state).toBe(before.tasks[0].state);
  expect(after.events.some(e=>e.type==='SPECIALIST_RETURN_DENIED')).toBe(true);
});
