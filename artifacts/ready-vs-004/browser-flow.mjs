// READY-VS-004 browser evidence: parent FACT -> Planner TODAY_TASK -> child Focus -> completed Actual History -> replan preservation.
import fs from 'node:fs';
import {launch, sleep} from '../ready-vs-001/cdp.mjs';

const base = process.argv[2] || 'http://localhost:8104/?role=parent';
const out = new URL('./', import.meta.url);
const b = await launch({port:9348, width:390, height:844});
const shot = name => b.shot(new URL(name + '.png', out));
const run = fn => b.evaluate('(' + fn.toString() + ')()');
const ensure = (ok, message) => { if (!ok) throw new Error(message); };
const log = (label, value) => console.log(label, JSON.stringify(value));

try {
  await b.goto(base);
  await run(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('readyset_active_role_v1', 'parent');
    localStorage.setItem('readyset_identity_v1', JSON.stringify({
      schemaVersion:5,
      status:'READY',
      onboardingStep:'DONE',
      setupMode:'GUARDIAN_FOR_CHILD',
      operator:{role:'GUARDIAN'},
      legalName:'VS004 보호자',
      nickname:'별이',
      familyRole:'CHILD',
      schoolStage:'E4',
      birthDate:'2016-05-01',
      explorerId:'lumi',
      explorerName:'루미',
      journeyTheme:'TODAYS_ISLAND',
      characterSetupState:'DEFERRED_NO_COST',
      characterVisualId:null
    }));
    return true;
  });
  await b.goto(base);
  await sleep(3000);

  const parentHome = await run(() => ({
    role:ReadyRoleContextV1.current(),
    hub:!!document.getElementById('readyParentSetupHub'),
    schedule:!!document.querySelector('#readyParentSetupHub [data-rps-schedule]'),
    homework:!!document.querySelector('#readyParentSetupHub [data-rps-homework]'),
    firstRun:!!document.getElementById('readyFirstRun')
  }));
  log('01_PARENT_HOME', parentHome);
  ensure(parentHome.role === 'parent' && parentHome.hub && parentHome.schedule && parentHome.homework && !parentHome.firstRun, 'PARENT_HOME_NOT_READY');
  await shot('01-parent-home');

  await run(() => { document.querySelector('#readyParentSetupHub [data-rps-schedule]').click(); return true; });
  await sleep(700);
  await run(() => { document.querySelector('#rpsScheduleActions [data-edit-schedule]').click(); return true; });
  await sleep(400);
  const scheduleEntered = await run(() => {
    const d = document.getElementById('rpsScheduleDialog');
    const e = d.querySelector('form').elements;
    const today = new Date().toLocaleDateString('sv-SE');
    e.title.value = 'VS004 확인된 학습 가능';
    e.subject.value = '영어';
    e.date.value = today;
    e.weekday.value = String(new Date(today + 'T12:00:00').getDay());
    e.start.value = '13:00';
    e.end.value = '14:00';
    e.kind.value = 'STUDY_OPPORTUNITY';
    return {open:d.open, title:e.title.value, kind:e.kind.value, date:e.date.value, start:e.start.value, end:e.end.value};
  });
  log('02_SCHEDULE_ENTERED', scheduleEntered);
  ensure(scheduleEntered.open && scheduleEntered.kind === 'STUDY_OPPORTUNITY', 'STUDY_OPPORTUNITY_NOT_ENTERED');
  await shot('02-study-opportunity-entered');
  await run(() => { document.querySelector('#rpsScheduleDialog .save').click(); return true; });
  await sleep(900);
  const capacity = await run(() => {
    const s = ReadyFoundationControlV1.load();
    return (s.profiles || []).flatMap(p => p.events || []).filter(e => e.kind === 'STUDY_OPPORTUNITY').length;
  });
  ensure(capacity === 1, 'STUDY_OPPORTUNITY_NOT_SAVED');

  await run(() => {
    const home = document.querySelector('#scheduleView [data-nav="home"]');
    if (home) home.click(); else ReadyBaseRuntimeV1.nav('home');
    return true;
  });
  await sleep(700);
  await run(() => { document.querySelector('#readyParentSetupHub [data-rps-homework]').click(); return true; });
  await sleep(1000);

  const beforeSave = await run(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() + 2);
    const next = d.toLocaleDateString('sv-SE');
    const set = (sel, value) => {
      const el = document.querySelector(sel);
      el.value = value;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    };
    set('#rsfEnglishWorkbook', 'READY English');
    set('#rsfEnglishRange', 'p.32~41');
    set('#rsfEnglishNext', next);
    set('#rsfEnglishInstruction', '다음 학원 전 완료');
    document.getElementById('rsfParent').scrollIntoView({block:'start'});
    return {
      surface:!!document.getElementById('rsfParent'),
      workbook:document.getElementById('rsfEnglishWorkbook').value,
      range:document.getElementById('rsfEnglishRange').value,
      nextAcademy:document.getElementById('rsfEnglishNext').value,
      confirmedBefore:(ReadyAssignmentModel.assignmentView() || []).filter(x => x.sourceType === 'ENGLISH_ACADEMY_PACKAGE' && x.confirmationState === 'FACT_CONFIRMED').length
    };
  });
  log('03_ENGLISH_BEFORE_SAVE', beforeSave);
  ensure(beforeSave.surface && beforeSave.range && beforeSave.nextAcademy && beforeSave.confirmedBefore === 0, 'ENGLISH_PRE_SAVE_STATE_INVALID');
  await shot('03-english-before-save');

  await run(() => { document.getElementById('rsfEnglishFactSave').click(); return true; });
  await sleep(1400);
  const factPlanner = await run(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    const fact = (ReadyAssignmentModel.assignmentView() || []).find(x => x.sourceType === 'ENGLISH_ACADEMY_PACKAGE');
    const planner = JSON.parse(localStorage.getItem('readyset_planner_v1') || '{"days":{}}');
    const tasks = planner.days?.[today]?.tasks || [];
    const hits = tasks.filter(t => t.sourceAssignmentId === fact?.assignmentId && t.authority === 'PLANNER/MAIN' && t.projection === 'TODAY_TASK');
    return {
      today,
      factId:fact?.assignmentId || null,
      confirmationState:fact?.confirmationState || null,
      deadlineBoundary:fact?.deadlineBoundary || null,
      taskCount:hits.length,
      task:hits[0] ? {
        id:hits[0].id,
        sourceAssignmentId:hits[0].sourceAssignmentId,
        sourceUnitId:hits[0].sourceUnitId,
        authority:hits[0].authority,
        projection:hits[0].projection,
        status:hits[0].status,
        title:hits[0].title,
        volume:hits[0].volume
      } : null
    };
  });
  log('04_FACT_PLANNER', factPlanner);
  ensure(factPlanner.confirmationState === 'FACT_CONFIRMED', 'PARENT_FACT_NOT_CONFIRMED');
  ensure(factPlanner.taskCount === 1 && factPlanner.task?.sourceUnitId, 'PLANNER_TODAY_TASK_NOT_CREATED');
  await shot('04-fact-confirmed-planner-task');

  await run(() => {
    const home = document.querySelector('#missionView [data-nav="home"]');
    if (home) home.click(); else ReadyBaseRuntimeV1.nav('home');
    return true;
  });
  await sleep(900);
  const parentAllocation = await run(() => ({
    role:ReadyRoleContextV1.current(),
    hubText:document.getElementById('readyParentSetupHub')?.innerText || '',
    todayTasks:ReadyHomeHomeworkMVPV1.tasks(true).map(t => ({title:t.title,status:t.status,planner_id:t.planner_id}))
  }));
  log('05_PARENT_ALLOCATION', parentAllocation);
  ensure(parentAllocation.role === 'parent' && parentAllocation.hubText.includes('배정 1개'), 'PARENT_ALLOCATION_STATUS_MISSING');
  await shot('05-parent-allocation');

  await run(() => { document.getElementById('rpsRoleSwitch').click(); return true; });
  await sleep(3500);
  const childHome = await run(() => ({
    role:ReadyRoleContextV1.current(),
    parentHub:!!document.getElementById('readyParentSetupHub'),
    primary:document.getElementById('readyHomeworkPrimary')?.innerText || '',
    tasks:ReadyHomeHomeworkMVPV1.tasks().map(t => ({title:t.title,volume:t.volume,status:t.status,planner_id:t.planner_id}))
  }));
  log('06_CHILD_HOME', childHome);
  ensure(childHome.role === 'child' && !childHome.parentHub && childHome.tasks.length === 1 && childHome.primary.includes('숙제 시작'), 'CHILD_HOME_TASK_NOT_VISIBLE');
  await shot('06-child-home');

  await run(() => { document.getElementById('readyHomeworkPrimary').click(); return true; });
  await sleep(500);
  const pickerOpen = await run(() => !!document.getElementById('readyHomeworkPicker') && !document.getElementById('readyHomeworkPicker').hidden);
  if (pickerOpen) {
    await run(() => { document.querySelector('#readyHomeworkPicker [data-homework-task]').click(); return true; });
  }
  await sleep(1600);
  const focus = await run(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    const planner = JSON.parse(localStorage.getItem('readyset_planner_v1') || '{"days":{}}');
    const task = (planner.days?.[today]?.tasks || []).find(t => t.sourceAssignmentId);
    const c = ReadySetRev07?.contract?.();
    return {
      view:document.querySelector('.view.active')?.dataset.view || null,
      focusMission:document.getElementById('focusMission')?.innerText || null,
      plannerStatus:task?.status || null,
      session:c ? {id:c.session_id,state:c.session_state,active:c.active_task_id} : null
    };
  });
  log('07_CHILD_FOCUS', focus);
  ensure(focus.view === 'focus' && focus.plannerStatus === 'IN_PROGRESS' && focus.session?.state === 'ACTIVE', 'CHILD_FOCUS_NOT_STARTED');
  await shot('07-child-focus');

  await run(() => { document.getElementById('completeBtn').click(); return true; });
  await sleep(350);
  await run(() => { document.querySelector('#readyTaskFinish [data-finish-state="COMPLETED"]').click(); return true; });
  await sleep(1500);
  const completedBefore = await run(() => {
    const planner = JSON.parse(localStorage.getItem('readyset_planner_v1') || '{"days":{}}');
    const tasks = Object.values(planner.days || {}).flatMap(d => d.tasks || []);
    const hit = tasks.filter(t => t.sourceAssignmentId && t.status === 'COMPLETED');
    return {count:hit.length, task:hit[0] || null, view:document.querySelector('.view.active')?.dataset.view || null};
  });
  log('08_COMPLETED', {count:completedBefore.count, id:completedBefore.task?.id, status:completedBefore.task?.status, view:completedBefore.view});
  ensure(completedBefore.count === 1, 'COMPLETED_ACTUAL_HISTORY_MISSING');

  await run(() => {
    if (document.querySelector('#resultView [data-nav="home"]')) document.querySelector('#resultView [data-nav="home"]').click();
    else ReadyBaseRuntimeV1.nav('home');
    return true;
  });
  await sleep(900);
  await shot('08-child-home-after-complete');

  await run(() => { document.getElementById('rpsRoleSwitch').click(); return true; });
  await sleep(3200);
  await run(() => { document.querySelector('#readyParentSetupHub [data-rps-schedule]').click(); return true; });
  await sleep(700);
  await run(() => { document.querySelector('#rpsScheduleActions [data-edit-schedule]').click(); return true; });
  await sleep(400);
  await run(() => {
    const d = document.getElementById('rpsScheduleDialog');
    const e = d.querySelector('form').elements;
    const today = new Date().toLocaleDateString('sv-SE');
    e.title.value = 'VS004 완료 후 일정 변경';
    e.subject.value = '영어';
    e.date.value = today;
    e.weekday.value = String(new Date(today + 'T12:00:00').getDay());
    e.start.value = '12:30';
    e.end.value = '14:30';
    e.kind.value = 'FIXED';
    e.once.checked = true;
    d.querySelector('.save').click();
    return true;
  });
  await sleep(1400);

  const replan = await run(() => {
    const planner = JSON.parse(localStorage.getItem('readyset_planner_v1') || '{"days":{}}');
    const tasks = Object.values(planner.days || {}).flatMap(d => d.tasks || []);
    const fact = (ReadyAssignmentModel.assignmentView() || []).find(x => x.sourceType === 'ENGLISH_ACADEMY_PACKAGE');
    const same = tasks.filter(t => t.sourceAssignmentId === fact?.assignmentId);
    const history = ReadyFoundationControlV1.actualHistory(ReadyFoundationControlV1.load().lastPlannerInput?.units || []);
    return {
      sourceTasks:same.map(t => ({id:t.id,status:t.status,sourceUnitId:t.sourceUnitId,learningReports:t.learningReports || []})),
      completed:same.filter(t => t.status === 'COMPLETED').length,
      replanned:same.filter(t => t.status === 'PLANNED' && t.authority === 'PLANNER/MAIN').length,
      completedHistory:history.filter(x => x.status === 'COMPLETED').length,
      overrideCount:(ReadyFoundationControlV1.load().overrides || []).length
    };
  });
  log('09_REPLAN', replan);
  ensure(replan.completed === 1 && replan.replanned === 0 && replan.completedHistory === 1 && replan.overrideCount === 1, 'REPLAN_REWROTE_COMPLETED_HISTORY');
  await shot('09-parent-replan-preserved');

  await b.goto(new URL('/?role=parent', base).href);
  await sleep(3000);
  const finalState = await run(() => {
    const planner = JSON.parse(localStorage.getItem('readyset_planner_v1') || '{"days":{}}');
    const tasks = Object.values(planner.days || {}).flatMap(d => d.tasks || []);
    const fact = (ReadyAssignmentModel.assignmentView() || []).find(x => x.sourceType === 'ENGLISH_ACADEMY_PACKAGE');
    const same = tasks.filter(t => t.sourceAssignmentId === fact?.assignmentId);
    const apiCalls = performance.getEntriesByType('resource').map(x => x.name).filter(x => /\/api\/|netlify\/functions|character-candidates/.test(x));
    return {
      role:ReadyRoleContextV1.current(),
      fact:{id:fact?.assignmentId,confirmationState:fact?.confirmationState,deadlineBoundary:fact?.deadlineBoundary},
      sourceTaskCount:same.length,
      completed:same.filter(t => t.status === 'COMPLETED').length,
      planned:same.filter(t => t.status === 'PLANNED').length,
      sourceUnitIds:same.map(t => t.sourceUnitId),
      apiCalls
    };
  });
  log('10_RELOAD_FINAL', finalState);
  ensure(finalState.role === 'parent' && finalState.fact.confirmationState === 'FACT_CONFIRMED', 'FACT_NOT_PERSISTED');
  ensure(finalState.sourceTaskCount === 1 && finalState.completed === 1 && finalState.planned === 0, 'RELOAD_DUPLICATED_OR_LOST_TASK');
  ensure(finalState.apiCalls.length === 0, 'PAID_OR_API_CALL_DETECTED');
  ensure(b.errors.length === 0, 'BROWSER_ERRORS:' + JSON.stringify(b.errors));
  await shot('10-parent-reload-final');

  const evidence = {
    pass:true,
    contract:'READY-VS-004',
    viewport:'390x844',
    parentHome,
    scheduleEntered,
    beforeSave,
    factPlanner,
    parentAllocation,
    childHome,
    focus,
    completed:{count:completedBefore.count,id:completedBefore.task?.id,status:completedBefore.task?.status},
    replan,
    finalState,
    browserErrors:b.errors
  };
  fs.writeFileSync(new URL('state-evidence.json', out), JSON.stringify(evidence, null, 2));
  console.log('PASS READY-VS-004 browser: parent FACT -> Planner -> child Focus -> completed history -> replan preserved; API calls 0; browser errors []');
} finally {
  b.close();
}
