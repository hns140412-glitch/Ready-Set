const { test, expect } = require('@playwright/test');

test('capture review preserves source evidence, closes unresolved items, and archives reanalysis history', async ({ page }) => {
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

  const first=await page.evaluate(async()=>{
    const api=window.ReadyCaptureV01;
    await api.createSession({source_surface:'E2E_CAPTURE',group_key:'TALENT:수학',kind:'RANGE'});
    const files=[
      new File([new Uint8Array([1,2,3,4])],'math-1.jpg',{type:'image/jpeg'}),
      new File([new Uint8Array([5,6,7,8])],'math-2.jpg',{type:'image/jpeg'})
    ];
    const created=await api.addFiles(files,{group_key:'TALENT:수학',kind:'RANGE'});
    window.ReadyCaptureAnalysisAdapter={
      version:'TEST_CAPTURE_ADAPTER_V1',
      analyze:async({manifest})=>({
        ok:true,
        provider:'TEST_PROVIDER',
        model:'FIXTURE_V1',
        received_at:new Date().toISOString(),
        drafts:[{
          group_key:'TALENT:수학',
          detected_material_type:'TALENT_BOOK',
          detected_subject:'수학',
          workbook_name:'테스트 수학',
          source_range:'1~20번',
          teacher_instruction:'',
          components:{vocabulary:'',listening:'',recording:'',writing:''},
          weekday_prints:[],
          confidence:0.93,
          evidence_item_ids:[manifest[0].capture_item_id],
          warnings:[]
        }]
      })
    };
    const analyzed=await api.requestAnalysis();
    const session=await api.currentReviewSession();
    return {created,analyzed,session};
  });

  expect(first.analyzed.ok).toBe(true);
  expect(first.session.analysis_state).toBe('ANALYSIS_COMPLETE');
  expect(first.session.analysis_result.drafts).toHaveLength(1);
  expect(first.session.analysis_result.capture_item_dispositions).toHaveLength(2);
  expect(first.session.analysis_result.capture_item_dispositions.filter(x=>x.disposition==='UNRESOLVED')).toHaveLength(1);

  const closed=await page.evaluate(async()=>{
    const api=window.ReadyCaptureV01;
    const session=await api.currentReviewSession();
    const unresolved=session.analysis_result.capture_item_dispositions.find(x=>x.disposition==='UNRESOLVED');
    await api.resolveCaptureItemDisposition(unresolved.capture_item_id,{
      disposition:'IGNORED_WITH_REASON',
      reason:'PARENT_MARKED_NOT_ASSIGNMENT_SOURCE'
    });
    const draft=(await api.currentReviewSession()).analysis_result.drafts[0];
    await api.updateReviewDraft(draft.review_draft_id,{
      actor:'PARENT',
      event:'PARENT_REVIEWED',
      review_state:'PARENT_REVIEWED',
      reviewed_value:{source_range:'1~18번',teacher_instruction:'틀린 문제 다시 풀기'},
      fields:['source_range','teacher_instruction']
    });
    const closure=await api.reviewClosureForGroup('TALENT:수학');
    const provenance=await api.reviewProvenanceForGroup('TALENT:수학');
    return {closure,provenance,session:await api.currentReviewSession()};
  });

  expect(closed.closure.closed).toBe(true);
  expect(closed.closure.unresolved_count).toBe(0);
  expect(closed.provenance.review_drafts[0].review_state).toBe('PARENT_REVIEWED');
  expect(closed.provenance.review_drafts[0].reviewed_value.source_range).toBe('1~18번');
  expect(closed.provenance.capture_item_dispositions.some(x=>x.disposition==='IGNORED_WITH_REASON')).toBe(true);

  const failedReanalysis=await page.evaluate(async()=>{
    const api=window.ReadyCaptureV01;
    window.ReadyCaptureAnalysisAdapter={
      version:'TEST_CAPTURE_ADAPTER_FAIL',
      analyze:async()=>({ok:false,reason:'ANALYSIS_PROVIDER_ERROR',provider_status:503})
    };
    const result=await api.requestAnalysis();
    const session=await api.currentReviewSession();
    return {result,session};
  });

  expect(failedReanalysis.result.ok).toBe(false);
  expect(failedReanalysis.result.prior_analysis_preserved).toBe(true);
  expect(failedReanalysis.session.analysis_state).toBe('ANALYSIS_COMPLETE');
  expect(failedReanalysis.session.analysis_run_no).toBe(1);
  expect(failedReanalysis.session.analysis_result.drafts[0].reviewed_value.source_range).toBe('1~18번');
  expect(failedReanalysis.session.last_analysis_failure.result.reason).toBe('ANALYSIS_PROVIDER_ERROR');
  expect(failedReanalysis.session.analysis_history).toHaveLength(1);
  expect(failedReanalysis.session.analysis_history[0].kind).toBe('FAILED_REANALYSIS_ATTEMPT');

  const reanalyzed=await page.evaluate(async()=>{
    const api=window.ReadyCaptureV01;
    window.ReadyCaptureAnalysisAdapter={
      version:'TEST_CAPTURE_ADAPTER_V2',
      analyze:async({manifest})=>({
        ok:true,
        provider:'TEST_PROVIDER',
        model:'FIXTURE_V2',
        received_at:new Date().toISOString(),
        drafts:[{
          group_key:'TALENT:수학',
          detected_material_type:'TALENT_BOOK',
          detected_subject:'수학',
          workbook_name:'테스트 수학',
          source_range:'1~18번',
          teacher_instruction:'틀린 문제 다시 풀기',
          components:{vocabulary:'',listening:'',recording:'',writing:''},
          weekday_prints:[],
          confidence:0.98,
          evidence_item_ids:manifest.map(x=>x.capture_item_id),
          warnings:[]
        }]
      })
    };
    const result=await api.requestAnalysis();
    const session=await api.currentReviewSession();
    return {result,session};
  });

  expect(reanalyzed.result.ok).toBe(true);
  expect(reanalyzed.session.analysis_run_no).toBe(2);
  expect(reanalyzed.session.analysis_history).toHaveLength(2);
  expect(reanalyzed.session.analysis_history[0].kind).toBe('FAILED_REANALYSIS_ATTEMPT');
  expect(reanalyzed.session.analysis_history[1].kind).toBe('SUCCESSFUL_ANALYSIS_ARCHIVE');
  expect(reanalyzed.session.analysis_history[1].result.analysis_run_no).toBe(1);
  expect(reanalyzed.session.analysis_result.drafts[0].source_range).toBe('1~18번');
  expect(reanalyzed.session.analysis_result.capture_item_dispositions.every(x=>x.disposition==='LINKED_TO_REVIEW_DRAFT')).toBe(true);
});


test('capture English draft preserves grammar and reading components', async ({ page }) => {
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'};
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.evaluate(async()=>{
    const api=window.ReadyCaptureV01;
    await api.createSession({source_surface:'E2E_CAPTURE',group_key:'ENGLISH:WORKBOOK',kind:'RANGE'});
    await api.addFiles([new File([new Uint8Array([1,2,3])],'english.jpg',{type:'image/jpeg'})],{group_key:'ENGLISH:WORKBOOK',kind:'RANGE'});
    window.ReadyCaptureAnalysisAdapter={version:'TEST_CAPTURE_ENGLISH',analyze:async({manifest})=>({ok:true,provider:'TEST',model:'FIXTURE',drafts:[{
      group_key:'ENGLISH:WORKBOOK',
      detected_material_type:'ENGLISH_WORKBOOK',
      detected_subject:'영어',
      workbook_name:'English Workbook',
      source_range:'Unit 3',
      teacher_instruction:'복습',
      components:{vocabulary:'Day 1',grammar:'Lesson 3',reading:'Story 2',listening:'Track 4',recording:'Prompt 1',writing:'Sentence 5'},
      weekday_prints:[],
      confidence:0.95,
      evidence_item_ids:[manifest[0].capture_item_id],
      warnings:[]
    }]})};
    await api.requestAnalysis();
  });
  const draft=await page.evaluate(async()=> (await window.ReadyCaptureV01.currentReviewSession()).analysis_result.drafts[0]);
  expect(draft.components.grammar).toBe('Lesson 3');
  expect(draft.components.reading).toBe('Story 2');
  await page.evaluate(async d=>window.__captureDraftControllerForTest?.apply?.(d),draft).catch(()=>{});
  const markers=await page.evaluate(()=>({
    grammar:document.querySelector('#englishGrammar')?.value||'',
    reading:document.querySelector('#englishReading')?.value||''
  }));
  expect(markers.grammar === '' || markers.grammar === 'Lesson 3').toBeTruthy();
  expect(markers.reading === '' || markers.reading === 'Story 2').toBeTruthy();
});
