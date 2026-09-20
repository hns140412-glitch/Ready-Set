const {test,expect}=require('@playwright/test');

test('family capture analysis transport preserves explicit analysis domain',async({page})=>{
  const seen=[];
  await page.route('**/api/capture/analyze',async route=>{
    const req=route.request();
    const body=req.postDataBuffer();
    seen.push({contentType:req.headers()['content-type']||'',body:body?.toString('utf8')||''});
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({
        analysis_domain:'HIDE_VOCABULARY',
        provider:'fixture',
        result:{
          analysis_domain:'HIDE_VOCABULARY',
          analysis_version:'HIDE_VOCABULARY_OCR_V1',
          drafts:[]
        }
      })
    });
  });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const explicit=await page.evaluate(async()=>{
    const adapter=window.ReadyCaptureAnalysisAdapter;
    const blob=new Blob(['fixture'],{type:'image/jpeg'});
    return adapter.analyze({
      analysis_domain:'HIDE_VOCABULARY',
      session:{capture_session_id:'capture-domain-test'},
      manifest:[{
        capture_item_id:'item-1',
        group_key:'HIDE:VOCABULARY',
        kind:'VOCABULARY_PRINT',
        visibility:'FAMILY',
        mime_type:'image/jpeg',
        file_name:'fixture.jpg',
        size:7
      }],
      getBlob:async()=>blob
    });
  });

  expect(explicit.ok).toBe(true);
  expect(explicit.analysis_domain).toBe('HIDE_VOCABULARY');
  expect(seen).toHaveLength(1);
  expect(seen[0].body).toContain('HIDE_VOCABULARY');
  expect(seen[0].body).toContain('analysis_domain');
});

test('Ready capture analysis transport defaults to assignment fact domain',async({page})=>{
  const seen=[];
  await page.route('**/api/capture/analyze',async route=>{
    const body=route.request().postDataBuffer();
    seen.push(body?.toString('utf8')||'');
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({
        analysis_domain:'READY_ASSIGNMENT_FACT',
        provider:'fixture',
        result:{analysis_version:'CAPTURE_OCR_V1',drafts:[]}
      })
    });
  });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(async()=>{
    const adapter=window.ReadyCaptureAnalysisAdapter;
    const blob=new Blob(['fixture'],{type:'image/jpeg'});
    return adapter.analyze({
      session:{capture_session_id:'capture-default-domain'},
      manifest:[{
        capture_item_id:'item-ready-1',
        group_key:'ENGLISH:HOMEWORK',
        kind:'RANGE',
        visibility:'FAMILY',
        mime_type:'image/jpeg',
        file_name:'fixture.jpg',
        size:7
      }],
      getBlob:async()=>blob
    });
  });

  expect(result.ok).toBe(true);
  expect(result.analysis_domain).toBe('READY_ASSIGNMENT_FACT');
  expect(seen[0]).toContain('READY_ASSIGNMENT_FACT');
});
