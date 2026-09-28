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
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const items=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {
      source_id:items[0]?.capture_item_id,bytes:items[0]?.blob?.size,
      facts:Object.keys(window.ReadyAssignments.load().assignmentFacts).length,
      todos:window.ReadySetPlanner.snapshot().dated_todos.length
    };
  });
  expect(before).toEqual({source_id:source.item_id,bytes:png.length,facts:0,todos:0});
  // iPhone-like reload must not lose the captured Blob after provider failure.
  await page.reload({waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('#plannerView [data-nav="planner-admin"]').click();
  const recovered=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const items=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {id:items[0]?.capture_item_id,bytes:items[0]?.blob?.size,state:session.analysis_state};
  });
  expect(recovered).toEqual({id:source.item_id,bytes:png.length,state:'ANALYSIS_FAILED'});

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
    const capture=await window.ReadyCaptureV01.latestSession();
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

  // User-visible result and carry-over must retain the same Planner TODO.
  await page.locator('#completeBtn').click();
  await expect(page.locator('#readyRev07Wrap')).toBeVisible();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="PARTIAL"][data-task-id="${taskId}"]`).click();
  await page.locator('#rev07ConfirmEnd').click();
  await expect(page.locator('#resultView')).toHaveClass(/active/);
  const outcome=await page.evaluate(todoId=>{
    const p=window.ReadySetPlanner.snapshot();
    const todo=p.dated_todos.find(t=>t.todo_id===todoId);
    const carry=p.carry_over_queue.find(c=>c.source_todo_id===todoId);
    const evidence=p.execution_observations.find(e=>e.todo_id===todoId);
    return {state:todo?.state,carry_status:carry?.status,carry_source:carry?.source_todo_id,evidence:evidence?.source};
  },todayTodo.todo_id);
  expect(outcome).toEqual({
    state:'PARTIAL',carry_status:'OPEN',
    carry_source:todayTodo.todo_id,evidence:'READY_SESSION'
  });
});


test('OCR review draft auto-fills Parent homework and excludes answer-reference image (fixture only)',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',
      role:'PARENT',session_id:'OCR_REVIEW_TEST_ONLY',
      expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('#plannerView [data-nav="planner-admin"]').click();
  await page.locator('#captureGroupSelect').selectOption('ENGLISH:WORKBOOK');
  const fixture=Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlMK6sAAAAASUVORK5CYII=',
    'base64'
  );
  await page.locator('#homeworkGalleryInput').setInputFiles({
    name:'homework-page.png',mimeType:'image/png',buffer:fixture
  });
  await expect(page.locator('#capturePreviewList .capturePreviewItem')).toHaveCount(1);
  await page.locator('#captureKindSelect').selectOption('ANSWER_REFERENCE');
  await page.locator('#homeworkGalleryInput').setInputFiles({
    name:'answer-sheet.png',mimeType:'image/png',buffer:fixture
  });
  await expect(page.locator('#capturePreviewList .capturePreviewItem')).toHaveCount(2);

  // The mocked response proves UI wiring, not provider OCR quality. Request
  // source identity is read from the outgoing form and echoed independently.
  await page.evaluate(()=>{
    const normalFetch=window.fetch;
    window.__OCR_TEST_UPLOAD__=null;
    window.fetch=async(input,options)=>{
      if(input!=='/api/capture/analyze')return normalFetch(input,options);
      const form=options.body;
      const manifest=JSON.parse(form.get('manifest'));
      const source=manifest.find(x=>x.kind!=='ANSWER_REFERENCE');
      const answer=manifest.find(x=>x.kind==='ANSWER_REFERENCE');
      const files=[...form.keys()].filter(x=>x.startsWith('image__'));
      window.__OCR_TEST_UPLOAD__={
        source:source.capture_item_id,answer:answer.capture_item_id,
        keys:files,mime:form.get('image__'+source.capture_item_id)?.type,
        correlation:form.get('vision_ingest_request_id')
      };
      return {
        ok:true,status:200,
        json:async()=>({
          ok:true,analysis_domain:'READY_ASSIGNMENT_FACT',
          vision_ingest_request_id:form.get('vision_ingest_request_id'),
          provider:'TEST_FIXTURE_NOT_REAL_OCR',model:'fixture',
          family_id:'TEST_FAMILY',
          result:{analysis_version:'FIXTURE_V1',drafts:[{
            group_key:'ENGLISH:WORKBOOK',detected_material_type:'ENGLISH_WORKBOOK',
            detected_subject:'영어',workbook_name:'테스트 영어 교재',
            source_range:'Unit 3 p.12~13',teacher_instruction:'단어 암기 후 문제 풀기',
            components:{vocabulary:'Unit 3 단어 12개',listening:'',recording:'',writing:''},
            weekday_prints:[],confidence:0.96,
            evidence_item_ids:[source.capture_item_id],warnings:[]
          }]}
        })
      };
    };
  });
  await page.locator('#captureAnalyzeBtn').click();
  await expect.poll(()=>page.evaluate(async()=>{
    return (await window.ReadyCaptureV01.currentReviewSession())?.analysis_state;
  })).toBe('ANALYSIS_COMPLETE');
  const upload=await page.evaluate(()=>window.__OCR_TEST_UPLOAD__);
  expect(upload.keys).toEqual(['image__'+upload.source]);
  expect(upload.keys).not.toContain('image__'+upload.answer);
  expect(upload.mime).toBe('image/png');
  expect(upload.correlation).toBeTruthy();
  await expect(page.locator('#captureReviewSection')).toBeVisible();
  await page.locator('[data-apply-capture-draft="0"]').click();
  await expect(page.locator('#englishWorkbook')).toHaveValue('테스트 영어 교재');
  await expect(page.locator('#englishRange')).toHaveValue('Unit 3 p.12~13');
  await expect(page.locator('#englishInstruction')).toHaveValue('단어 암기 후 문제 풀기');
  await expect(page.locator('#englishVocabulary')).toHaveValue('Unit 3 단어 12개');

  // Only parent confirmation and a deadline remain; never auto-promote OCR.
  const deadline=await page.evaluate(()=>{
    const d=new Date();d.setDate(d.getDate()+7);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  });
  await page.locator('#englishNextAcademy').fill(deadline);
  await page.locator('#saveEnglishFactBtn').click();
  const saved=await page.evaluate(async()=>{
    const state=window.ReadyAssignments.load();
    const fact=Object.values(state.assignmentFacts).find(f=>
      f.source_type==='ENGLISH_ACADEMY_PACKAGE'&&f.confirmation_state==='FACT_CONFIRMED');
    const session=await window.ReadyCaptureV01.latestSession();
    return {confirmed:!!fact,interpretation:fact?.analysis_state,
      todos:window.ReadySetPlanner.snapshot().dated_todos.filter(t=>t.assignment_id===fact?.assignment_id).length,
      sourceCount:fact?.artifact_refs?.length,answerCount:fact?.answer_reference_ids?.length,
      sessionStatus:session?.status,
      draftReviewed:session?.analysis_result?.drafts?.[0]?.review_events?.some(e=>e.event==='PARENT_APPLIED_DRAFT')};
  });
  if(!saved.confirmed){
    const debug=await page.evaluate(async()=>{
      const session=await window.ReadyCaptureV01.currentReviewSession();
      const state=window.ReadyAssignments.load();
      return {captureStatus:session?.status,analysisState:session?.analysis_state,
        groupClosure:await window.ReadyCaptureV01.reviewClosureForGroup('ENGLISH:WORKBOOK'),
        facts:Object.values(state.assignmentFacts||{}).map(f=>({id:f.assignment_id,type:f.source_type,state:f.confirmation_state})),
        englishFields:{name:document.querySelector('#englishWorkbook')?.value,
          range:document.querySelector('#englishRange')?.value,
          academy:document.querySelector('#englishNextAcademy')?.value},
        alerts:[...document.querySelectorAll('[role="status"], .toast')].map(x=>x.textContent).slice(-3)};
    });
    console.log('OCR_FIRST_USE_DIAGNOSTIC',JSON.stringify(debug));
  }
  expect(saved.confirmed).toBe(true);
  expect(saved.interpretation).toBe('INTERPRETED');
  expect(saved.todos).toBeGreaterThan(0);
  expect(saved.sourceCount).toBe(1);
  expect(saved.answerCount).toBe(1);
  expect(saved.sessionStatus).toBe('FACT_LINKED');
  expect(saved.draftReviewed).toBe(true);
});
