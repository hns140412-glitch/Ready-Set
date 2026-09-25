const {test,expect}=require('@playwright/test');

const HIDE_URL=process.env.READY_HIDE_V2_URL||'';
const SNAP_URL=process.env.READY_SNAP_V2_URL||'';
const LIVE=Boolean(HIDE_URL&&SNAP_URL);

test('LIVE hosted Ready -> Hide -> Ready -> Snap -> Ready exact contract roundtrip',async({page})=>{
  test.skip(!LIVE,'READY_HIDE_V2_URL and READY_SNAP_V2_URL are required after deployment gate opens');

  await page.addInitScript(({hideUrl,snapUrl})=>{
    window.__READY_SPECIALIST_TARGETS__={hideSeekV2:hideUrl,snapPopV2:snapUrl};
    const now=Date.now();
    const d=new Date(now);
    const today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const todoId='todo_live_hosted_roundtrip';
    const sessionId='live_hosted_roundtrip_session';
    localStorage.setItem('readyset_planner_v1',JSON.stringify({
      schema_version:1,
      dated_todos:[{
        todo_id:todoId,date:today,label:'영어 · hosted roundtrip',subject:'영어',
        matched_domain:'표현',
        assignment_id:'assignment_live_hosted',analysis_id:'analysis_live_hosted',learning_unit_id:'unit_live_hosted',
        source_range:'Unit LIVE',workbook_ref_id:'book_live_hosted',
        activity_types:['RECALL','WRITING'],
        activity_sequence:['BIDIRECTIONAL_RECALL','PRODUCE'],
        concept_skill_target:'HOSTED_ROUNDTRIP_CONTRACT',
        cognitive_load_profile:['RETRIEVAL_LOAD','LANGUAGE_PRODUCTION'],
        divisible_boundary:'LEARNING_ACTIVITY_BOUNDARY',
        confidence:1,unresolved_flags:[],
        state:'IN_PROGRESS',source:'PLANNER_V2_ALLOCATION',
        active_session_id:sessionId,active_task_id:'unit_live_hosted'
      }]
    }));
    localStorage.setItem('readyset_state',JSON.stringify({
      schemaVersion:5,
      profile:{name:'',photo:'',style:'editorial',shareAvatar:false},
      guide:{type:'lumi',name:'루미',voice:'warm'},
      guestHistory:[],records:[],selected:[],tasks:['영어 · hosted roundtrip'],selectedTodoIds:[],
      targetMin:25,sound:'OFF',
      activeSession:{
        id:sessionId,startAt:now,targetMs:1500000,pausedAt:null,issueMs:0,completed:false,
        selected:[],tasks:['영어 · hosted roundtrip'],
        plannerLinks:[{
          todo_id:todoId,label:'영어 · hosted roundtrip',subject:'영어',matched_domain:'표현',
          assignment_id:'assignment_live_hosted',analysis_id:'analysis_live_hosted',learning_unit_id:'unit_live_hosted',
          source_range:'Unit LIVE',workbook_ref_id:'book_live_hosted',
          activity_types:['RECALL','WRITING'],activity_sequence:['BIDIRECTIONAL_RECALL','PRODUCE'],
          concept_skill_target:'HOSTED_ROUNDTRIP_CONTRACT',
          cognitive_load_profile:['RETRIEVAL_LOAD','LANGUAGE_PRODUCTION'],
          divisible_boundary:'LEARNING_ACTIVITY_BOUNDARY',confidence:1,unresolved_flags:[]
        }],
        sound:'OFF',recordingDone:false
      }
    }));
  },{hideUrl:HIDE_URL,snapUrl:SNAP_URL});

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ReadySetRev07&&!!window.ReadySetSpecialistTargets);

  const targets=await page.evaluate(()=>({
    hide:window.ReadySetSpecialistTargets.resolve('hide-seek'),
    snap:window.ReadySetSpecialistTargets.resolve('snap-pop')
  }));
  expect(targets.hide.target_kind).toBe('EXPLICIT_V2');
  expect(targets.snap.target_kind).toBe('EXPLICIT_V2');
  expect(targets.hide.learning_context_contract).toBe('READY_LEARNING_CONTEXT_V1');
  expect(targets.snap.learning_context_contract).toBe('READY_LEARNING_CONTEXT_V1');

  const hidePrepared=await page.evaluate(()=>window.ReadySetRev07.prepareSpecialistLaunch('hide-seek'));
  expect(hidePrepared.ok).toBe(true);
  expect(new URL(hidePrepared.url).origin).toBe(new URL(HIDE_URL).origin);

  await page.goto(hidePrepared.url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.HideV2ReadyBridge);
  const hideInbound=await page.evaluate(()=>({
    context:window.HideV2ReadyBridge.readyLearningContext(),
    raw:window.HideV2ReadyBridge.context()
  }));
  expect(hideInbound.context?.contract_version).toBe('READY_LEARNING_CONTEXT_V1');
  expect(hideInbound.context?.assignment_id).toBe('assignment_live_hosted');
  expect(hideInbound.context?.source_range).toBe('Unit LIVE');
  expect(hideInbound.context?.workbook_ref_id).toBe('book_live_hosted');
  expect(hideInbound.raw?.return_target).toContain('127.0.0.1:4173');

  await Promise.all([
    page.waitForURL(url=>url.origin==='http://127.0.0.1:4173'),
    page.evaluate(()=>window.HideV2ReadyBridge.returnToReady())
  ]);
  await page.waitForFunction(()=>!!window.ReadySetRev07);
  await page.waitForFunction(()=>{
    const t=window.ReadySetRev07.contract()?.tasks?.[0];
    return t?.completed_specialists?.includes('hide-seek')&&t?.state==='PARTIAL';
  });

  const snapPrepared=await page.evaluate(()=>window.ReadySetRev07.prepareSpecialistLaunch('snap-pop'));
  expect(snapPrepared.ok).toBe(true);
  expect(new URL(snapPrepared.url).origin).toBe(new URL(SNAP_URL).origin);

  await page.goto(snapPrepared.url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.SnapPopBridge);
  const snapInbound=await page.evaluate(()=>({
    validation:window.SnapPopBridge.validate(),
    learning:window.SnapPopBridge.learningContext(),
    context:window.SnapPopBridge.context()
  }));
  expect(snapInbound.validation.ok).toBe(true);
  expect(snapInbound.learning?.contract_version).toBe('READY_LEARNING_CONTEXT_V1');
  expect(snapInbound.learning?.assignment_id).toBe('assignment_live_hosted');
  expect(snapInbound.learning?.source_range).toBe('Unit LIVE');
  expect(snapInbound.learning?.workbook_ref_id).toBe('book_live_hosted');

  await Promise.all([
    page.waitForURL(url=>url.origin==='http://127.0.0.1:4173'),
    page.evaluate(()=>window.SnapPopBridge.returnToBase('COMPLETED',{child_authored:true,hosted_roundtrip:true}))
  ]);
  await page.waitForFunction(()=>!!window.ReadySetRev07);
  await page.waitForFunction(()=>{
    const t=window.ReadySetRev07.contract()?.tasks?.[0];
    return t?.state==='COMPLETED'&&
      t?.completed_specialists?.includes('hide-seek')&&
      t?.completed_specialists?.includes('snap-pop');
  });

  const finalState=await page.evaluate(()=>{
    const t=window.ReadySetRev07.contract().tasks[0];
    return {
      state:t.state,
      completed_specialists:t.completed_specialists,
      evidence_types:(t.learning_evidence||[]).map(x=>x.evidence_type),
      validation:window.ReadySetRev07.validate()
    };
  });
  expect(finalState.state).toBe('COMPLETED');
  expect(finalState.completed_specialists).toEqual(['hide-seek','snap-pop']);
  expect(finalState.evidence_types).toEqual(['MEMORY_RETRIEVAL_EVIDENCE','LEARNER_PRODUCTION_EVIDENCE']);
  expect(finalState.validation.ok).toBe(true);
});
