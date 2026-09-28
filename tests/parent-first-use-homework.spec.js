const {test,expect}=require('@playwright/test');

// First-use acceptance: no live provider, secrets, or synthetic OCR success.
// The parent must be able to preserve a photographed source, correct the
// homework manually after OCR is unavailable, then use a Planner-owned TODO.
test('captured homework survives unavailable OCR and reaches Today/Timer through Parent FACT',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',
      role:'PARENT',session_id:'FIRST_USE_TEST_ONLY',
      expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.route('**/api/capture/analyze',route=>route.fulfill({
    status:503,contentType:'application/json',
    body:JSON.stringify({ok:false,reason:'ANALYSIS_PROVIDER_NOT_CONFIGURED'})
  }));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('#plannerView [data-nav="planner-admin"]').click();
  await page.locator('#captureGroupSelect').selectOption('ENGLISH:WORKBOOK');
  const png=Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlMK6sAAAAASUVORK5CYII=',
    'base64'
  );
  await page.locator('#homeworkGalleryInput').setInputFiles({
    name:'fixture-homework.png',mimeType:'image/png',buffer:png
  });
  await expect(page.locator('#capturePreviewList .capturePreviewItem')).toHaveCount(1);
  const source=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const items=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {session_id:session.capture_session_id,item_id:items[0]?.capture_item_id,bytes:items[0]?.blob?.size};
  });
  expect(source.bytes).toBe(png.length);
  await page.locator('#captureAnalyzeBtn').click();
  await expect.poll(()=>page.evaluate(async()=>{
    return (await window.ReadyCaptureV01.currentReviewSession())?.analysis_state;
  })).toBe('ANALYSIS_FAILED');
  const before=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.resolveSession();
    const items=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {
      source_id:items[0]?.capture_item_id,bytes:items[0]?.blob?.size,
      facts:Object.keys(window.ReadyAssignments.load().assignmentFacts).length,
      todos:window.ReadySetPlanner.snapshot().dated_todos.length
    };
  });
  expect(before).toEqual({source_id:source.item_id,bytes:png.length,facts:0,todos:0});

  // Parent-reviewed manual correction is the fallback, never an OCR FACT.
  const dates=await page.evaluate(()=>{
    const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const now=new Date(),later=new Date(now);later.setDate(later.getDate()+7);
    return {today:fmt(now),deadline:fmt(later)};
  });
  await page.locator('#englishWorkbook').fill('검증용 영어 교재');
  await page.locator('#englishRange').fill('Unit 3 p.12~13');
  await page.locator('#englishVocabulary').fill('Unit 3 단어 12개');
  await page.locator('#englishNextAcademy').fill(dates.deadline);
  await page.locator('#saveEnglishFactBtn').click();
  await expect.poll(()=>page.evaluate(()=>{
    const s=window.ReadyAssignments.load();
    return Object.values(s.assignmentFacts).some(f=>f.source_type==='ENGLISH_ACADEMY_PACKAGE'&&
      f.confirmation_state==='FACT_CONFIRMED'&&f.analysis_state==='INTERPRETED');
  })).toBe(true);
  const ready=await page.evaluate(async()=>{
    const s=window.ReadyAssignments.load();
    const fact=Object.values(s.assignmentFacts).find(f=>f.source_type==='ENGLISH_ACADEMY_PACKAGE');
    const planner=window.ReadySetPlanner.snapshot();
    const capture=await window.ReadyCaptureV01.resolveSession();
    return {
      fact,artifacts:s.artifacts,
      todos:planner.dated_todos.filter(t=>t.assignment_id===fact.assignment_id),
      capture_status:capture?.status,
      linked_fact:capture?.fact_links?.['ENGLISH:WORKBOOK']?.assignment_id
    };
  });
  expect(ready.fact.artifact_refs).toHaveLength(1);
  expect(ready.artifacts[ready.fact.artifact_refs[0]]?.source).toBeTruthy();
  expect(ready.capture_status).toBe('FACT_LINKED');
  expect(ready.linked_fact).toBe(ready.fact.assignment_id);
  expect(ready.todos.length).toBeGreaterThan(0);
  expect(ready.todos.every(t=>t.source_actor==='PLANNER_MAIN'&&t.learning_unit_id&&t.analysis_id)).toBe(true);
  const todayTodo=ready.todos.find(t=>t.date===dates.today&&t.state==='PLANNED');
  expect(todayTodo).toBeTruthy();

  await page.locator('#plannerAdminView [data-nav="planner"]').click();
  await page.locator('#plannerView [data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayTimeline')).toContainText(todayTodo.label);
  await page.locator('#plannerDayPanel [data-nav="mission"]').click();
  await page.locator(`#plannerTodayList [data-todo-id="${todayTodo.todo_id}"]`).click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);
  const started=await page.evaluate(()=>({
    todo_id:window.ReadySetRev07.contract()?.tasks?.[0]?.planner_todo_id,
    active:window.ReadySetPlanner.snapshot().dated_todos.find(t=>t.todo_id===
      window.ReadySetRev07.contract()?.tasks?.[0]?.planner_todo_id)?.state
  }));
  expect(started.todo_id).toBe(todayTodo.todo_id);
  expect(started.active).toBe('IN_PROGRESS');
});
