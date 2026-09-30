const {test,expect}=require('@playwright/test');

// Browser automation exercises native file-input integration, not a physical
// iPhone camera, on-device HEIC decoder or live paid OCR provider.
async function enterParentCapture(page){
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'IOS_CAPTURE_TEST_ONLY',
      member_id:'TEST_PARENT',role:'PARENT',
      session_id:'IOS_CAPTURE_TEST_SESSION',
      expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('#plannerView [data-nav="planner-admin"]').click();
}

const png=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlMK6sAAAAASUVORK5CYII=',
  'base64'
);

test('iPhone-like in-app rear camera and photo library use distinct native inputs; sources survive reload',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await enterParentCapture(page);
  const inputs=await page.evaluate(()=>({
    camera:{accept:document.querySelector('#homeworkCameraInput').accept,
      capture:document.querySelector('#homeworkCameraInput').getAttribute('capture'),
      multiple:document.querySelector('#homeworkCameraInput').multiple},
    gallery:{accept:document.querySelector('#homeworkGalleryInput').accept,
      capture:document.querySelector('#homeworkGalleryInput').getAttribute('capture'),
      multiple:document.querySelector('#homeworkGalleryInput').multiple}
  }));
  expect(inputs.camera.capture).toBe('environment');
  expect(inputs.camera.accept).toContain('image/jpeg');
  expect(inputs.camera.accept).not.toContain('image/heic');
  expect(inputs.camera.multiple).toBe(false);
  expect(inputs.gallery.accept).toContain('image/*');
  expect(inputs.gallery.multiple).toBe(true);

  await page.locator('#captureGroupSelect').selectOption('ENGLISH:PRINT');
  await page.locator('#homeworkCameraInput').setInputFiles({
    name:'native-camera.png',mimeType:'image/png',buffer:png
  });
  await expect(page.locator('#capturePreviewList .capturePreviewItem')).toHaveCount(1);
  await page.locator('#homeworkGalleryInput').setInputFiles([
    {name:'library-a.png',mimeType:'image/png',buffer:png},
    {name:'library-b.png',mimeType:'image/png',buffer:png}
  ]);
  await expect(page.locator('#capturePreviewList .capturePreviewItem')).toHaveCount(3);
  const original=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const rows=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return Promise.all(rows.map(async x=>({id:x.capture_item_id,group:x.group_key,
      mime:x.mime_type,bytes:x.blob?.size,name:x.file_name,
      original_hex:x.blob?Array.from(new Uint8Array(await x.blob.arrayBuffer()),b=>b.toString(16).padStart(2,'0')).join(''):null})));
  });
  expect(original).toHaveLength(3);
  expect(original.every(x=>x.group==='ENGLISH:PRINT'&&x.mime==='image/png'&&x.bytes===png.length)).toBe(true);
  expect(original.every(x=>x.original_hex===png.toString('hex'))).toBe(true);
  await page.reload({waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('#plannerView [data-nav="planner-admin"]').click();
  const restored=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const rows=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return Promise.all(rows.map(async x=>({id:x.capture_item_id,group:x.group_key,
      mime:x.mime_type,bytes:x.blob?.size,name:x.file_name,
      original_hex:x.blob?Array.from(new Uint8Array(await x.blob.arrayBuffer()),b=>b.toString(16).padStart(2,'0')).join(''):null})));
  });
  expect(restored).toEqual(original);
});

test('HEIC from Files with generic MIME is preserved; undecodable photo fails closed without network request',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  let providerCalls=0;
  await page.route('**/api/capture/analyze',async route=>{
    providerCalls++;
    await route.fulfill({status:500,contentType:'application/json',
      body:JSON.stringify({ok:false,reason:'TEST_MUST_NOT_REACH_PROVIDER'})});
  });
  await enterParentCapture(page);
  await page.locator('#captureGroupSelect').selectOption('ENGLISH:PRINT');
  const bytes=Buffer.from('not-a-decodable-heic-fixture');
  await page.locator('#homeworkGalleryInput').setInputFiles({
    name:'iPhone-photo.HEIC',mimeType:'application/octet-stream',buffer:bytes
  });
  await expect(page.locator('#capturePreviewList .capturePreviewItem')).toHaveCount(1);
  const captured=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const rows=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {id:rows[0]?.capture_item_id,mime:rows[0]?.mime_type,size:rows[0]?.blob?.size,
      original_hex:rows[0]?.blob?Array.from(new Uint8Array(await rows[0].blob.arrayBuffer()),b=>b.toString(16).padStart(2,'0')).join(''):null};
  });
  expect(captured.mime).toBe('image/heic');
  expect(captured.size).toBe(bytes.length);
  expect(captured.original_hex).toBe(bytes.toString('hex'));
  await page.locator('#captureAnalyzeBtn').click();
  await expect.poll(()=>page.evaluate(async()=>{
    return (await window.ReadyCaptureV01.currentReviewSession())?.analysis_state;
  })).toBe('ANALYSIS_FAILED');
  await expect(page.locator('#captureAnalysisStatus')).toContainText('원본은 보관 중');
  const after=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const rows=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {reason:session.analysis_result?.reason,id:rows[0]?.capture_item_id,size:rows[0]?.blob?.size,
      original_hex:rows[0]?.blob?Array.from(new Uint8Array(await rows[0].blob.arrayBuffer()),b=>b.toString(16).padStart(2,'0')).join(''):null,
      facts:Object.keys(window.ReadyAssignments.load().assignmentFacts).length};
  });
  expect(after).toEqual({reason:'HEIC_CONVERSION_UNAVAILABLE',id:captured.id,size:bytes.length,
    original_hex:bytes.toString('hex'),facts:0});
  await page.reload({waitUntil:'load'});
  const recovered=await page.evaluate(async()=>{
    const session=await window.ReadyCaptureV01.currentReviewSession();
    const rows=await window.ReadyCaptureV01.listItems(session.capture_session_id);
    return {id:rows[0]?.capture_item_id,original_hex:rows[0]?.blob?
      Array.from(new Uint8Array(await rows[0].blob.arrayBuffer()),b=>b.toString(16).padStart(2,'0')).join(''):null};
  });
  expect(recovered).toEqual({id:captured.id,original_hex:bytes.toString('hex')});
  expect(providerCalls).toBe(0);
});
