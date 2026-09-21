const { test, expect } = require('@playwright/test');

test('Parent capture draft becomes confirmed English FACT, Learning Units, and Planner TODOs', async ({ page }) => {
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
  await page.locator('[data-nav="planner"]:visible').first().click();
  await page.locator('[data-nav="planner-admin"]:visible').click();

  await page.locator('#captureGroupSelect').selectOption('ENGLISH:WORKBOOK');
  await page.locator('#captureKindSelect').selectOption('RANGE');

  await page.evaluate(()=>{
    window.ReadyCaptureAnalysisAdapter={
      version:'TEST_CAPTURE_TO_FACT',
      analyze:async({manifest})=>({
        ok:true,
        provider:'TEST_PROVIDER',
        model:'FIXTURE_ENGLISH',
        received_at:new Date().toISOString(),
        drafts:[{
          group_key:'ENGLISH:WORKBOOK',
          detected_material_type:'ENGLISH_WORKBOOK',
          detected_subject:'영어',
          workbook_name:'English Workbook A',
          source_range:'Unit 3',
          teacher_instruction:'틀린 문제 복습',
          components:{
            vocabulary:'Day 1',
            grammar:'Grammar Check 3',
            reading:'Story 3 / Comprehension',
            listening:'Track 4',
            recording:'Sentence 2',
            writing:'Paragraph 1'
          },
          weekday_prints:[{weekday:'MON',value:'1장'}],
          confidence:0.97,
          evidence_item_ids:[manifest[0].capture_item_id],
          warnings:[]
        }]
      })
    };
  });

  await page.locator('#homeworkGalleryInput').setInputFiles({
    name:'english-workbook.jpg',
    mimeType:'image/jpeg',
    buffer:Buffer.from([1,2,3,4,5,6])
  });

  await expect(page.locator('#captureGroupSummary')).toContainText('영어');
  await page.locator('#captureAnalyzeBtn').click();
  await expect(page.locator('#captureReviewSection')).toBeVisible();
  await expect(page.locator('#captureReviewDrafts')).toContainText('Unit 3');

  await page.locator('[data-apply-capture-draft="0"]').click();
  await expect(page.locator('#englishWorkbook')).toHaveValue('English Workbook A');
  await expect(page.locator('#englishRange')).toHaveValue('Unit 3');
  await expect(page.locator('#englishGrammar')).toHaveValue('Grammar Check 3');
  await expect(page.locator('#englishReading')).toHaveValue('Story 3 / Comprehension');
  await expect(page.locator('#englishVocabulary')).toHaveValue('Day 1');
  await expect(page.locator('#englishListening')).toHaveValue('Track 4');
  await expect(page.locator('#englishRecording')).toHaveValue('Sentence 2');
  await expect(page.locator('#englishWriting')).toHaveValue('Paragraph 1');

  const nextAcademy=await page.evaluate(()=>{
    const d=new Date();
    d.setDate(d.getDate()+5);
    return d.toLocaleDateString('sv-SE');
  });
  await page.locator('#englishNextAcademy').fill(nextAcademy);
  await page.locator('#saveEnglishFactBtn').click();

  await page.waitForFunction(()=>{
    const d=window.ReadyAssignments?.load?.();
    return Object.values(d?.assignmentFacts||{}).some(x=>
      x.source_type==='ENGLISH_ACADEMY_PACKAGE' &&
      x.confirmation_state==='FACT_CONFIRMED' &&
      x.analysis_state==='INTERPRETED'
    );
  });

  const result=await page.evaluate(async()=>{
    const domain=window.ReadyAssignments.load();
    const fact=Object.values(domain.assignmentFacts).find(x=>x.source_type==='ENGLISH_ACADEMY_PACKAGE');
    const analysis=domain.analyses[fact.current_analysis_id];
    const units=analysis.learning_unit_ids.map(id=>domain.learningUnits[id]);
    const planner=window.ReadySetPlanner.snapshot();
    const todos=planner.dated_todos.filter(x=>x.assignment_id===fact.assignment_id);
    const capture=await window.ReadyCaptureV01.latestSession();
    const captureClaim=[...(fact.claims||[])].reverse().find(x=>x.provenance?.kind==='PARENT_REVIEWED_CAPTURE')||null;
    return {fact,analysis,units,todos,capture,captureClaim};
  });

  expect(result.fact.confirmation_state).toBe('FACT_CONFIRMED');
  expect(result.captureClaim).toBeTruthy();
  expect(result.captureClaim.provenance.kind).toBe('PARENT_REVIEWED_CAPTURE');
  expect(result.captureClaim.provenance.capture_linked).toBe(true);
  expect(result.fact.components.grammar).toBe('Grammar Check 3');
  expect(result.fact.components.reading).toBe('Story 3 / Comprehension');

  const grammarUnit=result.units.find(x=>x.concept_skill_target==='GRAMMAR');
  const readingUnit=result.units.find(x=>x.concept_skill_target==='READING');
  expect(grammarUnit).toBeTruthy();
  expect(readingUnit).toBeTruthy();
  expect(grammarUnit.activity_types).toContain('GRAMMAR_CHECK');
  expect(readingUnit.activity_types).toContain('READING');

  expect(result.todos.length).toBeGreaterThan(0);
  expect(result.todos.every(x=>x.analysis_id===result.fact.current_analysis_id)).toBe(true);
  expect(result.todos.some(x=>x.learning_unit_id===grammarUnit.learning_unit_id)).toBe(true);
  expect(result.todos.some(x=>x.learning_unit_id===readingUnit.learning_unit_id)).toBe(true);

  expect(result.capture.status).toBe('FACT_LINKED');
  expect(result.capture.fact_links['ENGLISH:WORKBOOK'].assignment_id).toBe(result.fact.assignment_id);
  expect(result.capture.fact_links['ENGLISH:WORKBOOK'].fact_confirmation_state).toBe('FACT_CONFIRMED');
});
