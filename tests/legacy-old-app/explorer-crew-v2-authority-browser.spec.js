const {test,expect}=require('@playwright/test');
const BASE=process.env.READY_TEST_BASE_URL||'http://127.0.0.1:4173';

test('Ready binds latest read-only authority consumer to Explorer Crew System V2',async({page})=>{
  await page.goto(BASE+'/',{waitUntil:'load'});
  const result=await page.evaluate(()=>{
    const system=globalThis.TakyExplorerCrewSystemV2;
    const consumer=globalThis.ReadyExplorerCrewAuthorityConsumer;
    const canonical={
      version:'EXPLORER_CREW_STATE_STORE_V1',
      updated_at:'2026-10-01T00:01:30.000Z',
      revision:4,
      source_app:'snap-pop',
      state:{
        relation:{
          main_character_id:'lori',
          members:{lori:{character_id:'lori',relation_state:'MAIN_COMPANION'}}
        },
        memory:{}
      }
    };
    localStorage.setItem(consumer.CANONICAL_STATE_KEY,JSON.stringify(canonical));
    const before=localStorage.getItem(consumer.CANONICAL_STATE_KEY);
    const consumed=consumer.consumeCanonicalStore(localStorage);
    const after=localStorage.getItem(consumer.CANONICAL_STATE_KEY);
    consumer.syncHost(document.documentElement,consumer.snapshot(localStorage));
    return {
      system:system?.VERSION,
      consumer:consumer?.VERSION,
      bound:consumer?.SYSTEM_BOUND,
      main:consumer?.snapshot(localStorage)?.character_id,
      before,
      after,
      runtime:document.documentElement.dataset.explorerCrewRuntime,
      runtimeOwner:document.documentElement.dataset.explorerCrewRuntimeOwner,
      relationWrite:document.documentElement.dataset.explorerCrewRelationWrite,
      behaviorOwner:document.documentElement.dataset.explorerCrewBehaviorOwner,
      consumed:consumed?.consumed
    };
  });
  expect(result.system).toBe('EXPLORER_CREW_SYSTEM_V2');
  expect(result.consumer).toBe('READY_EXPLORER_CREW_AUTHORITY_CONSUMER_V2');
  expect(result.bound).toBe(true);
  expect(result.main).toBe('lori');
  expect(result.runtime).toBe('CANONICAL_ONLY');
  expect(result.runtimeOwner).toBe('false');
  expect(result.relationWrite).toBe('false');
  expect(result.behaviorOwner).toBe('false');
  expect(result.consumed).toBe(true);
  expect(result.after).toBe(result.before);
});
