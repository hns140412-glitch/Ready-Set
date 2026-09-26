const { test, expect } = require('@playwright/test');

test('Ready loads TAKY shared release and PWA contracts', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

  const runtime = await page.evaluate(() => ({
    release: globalThis.ReadySetReleaseDescriptor,
    releaseValid: globalThis.TakyReleaseContract?.validateDescriptor?.(globalThis.ReadySetReleaseDescriptor)?.ok === true,
    updateStates: globalThis.TakyPwaUpdateState?.states || [],
    updateAdapter: !!globalThis.ReadySetPwaUpdate,
    safePoint: globalThis.ReadySetPwaSafePoint?.()
  }));

  expect(runtime.releaseValid).toBe(true);
  expect(runtime.release.app_id).toBe('ready-set');
  expect(runtime.release.release_id).toBe('ready-set-1.0.0-alpha.1-r1');
  expect(runtime.updateStates).toContain('DOWNLOADED_WAITING');
  expect(runtime.updateStates).toContain('SAFE_TO_ACTIVATE');
  expect(runtime.updateAdapter).toBe(true);
  expect(runtime.safePoint).toBe(true);

  const versionText = await page.locator('#readyVersionInfo').textContent();
  expect(versionText).toContain('1.0.0-alpha.1');
  expect(versionText).toContain('ready-set-1.0.0-alpha.1-r1');
});

test('service worker uses controlled APPLY_UPDATE instead of install-time skipWaiting', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:4173/sw.js');
  expect(response.ok()).toBe(true);
  const text = await response.text();

  expect(text).toContain("event.data?.type==='APPLY_UPDATE'");
  expect(text).toContain('self.skipWaiting()');
  expect(text).not.toContain(".then(()=>self.skipWaiting())");
  expect(text).not.toContain('.md');

  const installStart = text.indexOf("self.addEventListener('install'");
  const messageStart = text.indexOf("self.addEventListener('message'");
  expect(installStart).toBeGreaterThanOrEqual(0);
  expect(messageStart).toBeGreaterThan(installStart);
  expect(text.slice(installStart, messageStart)).not.toContain('skipWaiting');
});


test('Ready local-first creates immutable event identity distinct from state digest', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

  const runtime = await page.evaluate(() => ({
    eventApi: !!globalThis.TakyEventEnvelope,
    queueApi: !!globalThis.TakyLocalQueue,
    localFirst: !!globalThis.ReadySetLocalFirst,
    caps: globalThis.ReadySetLocalFirst?.capabilities || []
  }));
  expect(runtime.eventApi).toBe(true);
  expect(runtime.queueApi).toBe(true);
  expect(runtime.localFirst).toBe(true);
  expect(runtime.caps).toContain('CAP-EVENT-ENVELOPE-001');
  expect(runtime.caps).toContain('CAP-LOCAL-QUEUE-001');

  const captures = await page.evaluate(async () => {
    const a = await globalThis.ReadySetLocalFirst.capture('planner', {same:'payload'});
    const b = await globalThis.ReadySetLocalFirst.capture('planner', {same:'payload'});
    const rows = await globalThis.ReadySetLocalFirst.outbox();
    const ra = rows.find(x => x.event_id === a.event_id);
    const rb = rows.find(x => x.event_id === b.event_id);
    return {
      a,b,
      ra: ra && {id:ra.id,event_id:ra.event_id,idempotency_key:ra.idempotency_key,status:ra.status,queue_version:ra.queue_version,domain_conflict:ra.domain_conflict,envelope_event_id:ra.envelope?.event_id},
      rb: rb && {id:rb.id,event_id:rb.event_id,idempotency_key:rb.idempotency_key,status:rb.status,queue_version:rb.queue_version,domain_conflict:rb.domain_conflict,envelope_event_id:rb.envelope?.event_id}
    };
  });

  expect(captures.a.digest).toBe(captures.b.digest);
  expect(captures.a.event_id).not.toBe(captures.b.event_id);
  expect(captures.ra.event_id).toBe(captures.a.event_id);
  expect(captures.rb.event_id).toBe(captures.b.event_id);
  expect(captures.ra.idempotency_key).toBe(captures.ra.event_id);
  expect(captures.rb.idempotency_key).toBe(captures.rb.event_id);
  expect(captures.ra.status).toBe('PENDING');
  expect(captures.rb.status).toBe('PENDING');
  expect(captures.ra.queue_version).toBe(1);
  expect(captures.rb.queue_version).toBe(1);
  expect(captures.ra.envelope_event_id).toBe(captures.ra.event_id);
  expect(captures.rb.envelope_event_id).toBe(captures.rb.event_id);
  expect(captures.ra.domain_conflict).toBe(null);
  expect(captures.rb.domain_conflict).toBe(null);
});


test('Ready loads shared vision ingest and rejects unknown OCR evidence ids', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  const loaded=await page.evaluate(()=>({
    vision:!!globalThis.TakyVisionIngest,
    adapter:!!globalThis.ReadyCaptureAnalysisAdapter
  }));
  expect(loaded.vision).toBe(true);
  expect(loaded.adapter).toBe(true);

  const result=await page.evaluate(async()=>{
    const originalFetch=window.fetch;
    window.fetch=async()=>({
      ok:true,
      json:async()=>({
        provider:'TEST',
        model:'fixture',
        result:{
          analysis_version:'TEST_V1',
          drafts:[{group_key:'TALENT:연산',evidence_item_ids:['unknown-source'],confidence:'high'}]
        }
      })
    });
    try{
      return await globalThis.ReadyCaptureAnalysisAdapter.analyze({
        session:{capture_session_id:'capture-test'},
        manifest:[{
          capture_item_id:'known-source',
          group_key:'TALENT:연산',
          kind:'RANGE',
          visibility:'FAMILY',
          mime_type:'image/jpeg',
          file_name:'known.jpg',
          size:4
        }],
        getBlob:async()=>new Blob(['test'],{type:'image/jpeg'})
      });
    }finally{window.fetch=originalFetch}
  });
  expect(result.ok).toBe(false);
  expect(result.reason).toBe('ANALYSIS_EVIDENCE_INVALID');
  expect(result.unknown_evidence[0].source_id).toBe('unknown-source');
});


test('Ready loads shared HTTP transport without moving auth authority',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  const out=await page.evaluate(()=>({
    http:!!globalThis.TakyHttpJson,
    rate:globalThis.TakyHttpJson?.normalizeStatus?.(429,{retry_after:'2',now_ms:0}),
    sync:!!globalThis.ReadySetSyncAdapter,
    family:!!globalThis.ReadyFamilySession
  }));
  expect(out.http).toBe(true);
  expect(out.rate.category).toBe('RATE_LIMITED');
  expect(out.rate.retry_after_ms).toBe(2000);
  expect(out.sync).toBe(true);
  expect(out.family).toBe(true);
});
