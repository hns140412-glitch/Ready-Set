const { test, expect } = require('@playwright/test');
const { createSyncService } = require('../netlify/functions/ready-sync-core.js');

function memoryStore(){
  const m=new Map();
  return {
    get:async key=>m.has(key)?m.get(key):null,
    set:async (key,value)=>{m.set(key,value);},
    snapshot:()=>new Map(m)
  };
}

test('remote sync backend contract: health identifies persistent remote contract', async ()=>{
  const service=createSyncService(memoryStore());
  await expect(service.health()).resolves.toMatchObject({
    ok:true,
    service:'ready-set-sync',
    contract:'HTTP_JSON_V1',
    persistence:'REMOTE_STORE'
  });
});

test('remote sync backend contract: same idempotency key + digest is accepted once', async ()=>{
  const store=memoryStore();
  const service=createSyncService(store);
  const event={
    event_id:'evt_1',
    idempotency_key:'idem_1',
    scope:'planner',
    digest:'digest-a',
    payload:'{"x":1}'
  };
  const first=await service.putEvent(event);
  const second=await service.putEvent(event);
  expect(first.status).toBe(200);
  expect(first.body.idempotent).toBe(false);
  expect(second.status).toBe(200);
  expect(second.body.idempotent).toBe(true);
  expect(store.snapshot().size).toBe(1);
});

test('remote sync backend contract: conflicting payload returns 409 with remote payload', async ()=>{
  const service=createSyncService(memoryStore());
  await service.putEvent({
    event_id:'evt_2',
    idempotency_key:'idem_2',
    scope:'app_state',
    digest:'digest-a',
    payload:'{"version":"remote"}'
  });
  const conflict=await service.putEvent({
    event_id:'evt_2',
    idempotency_key:'idem_2',
    scope:'app_state',
    digest:'digest-b',
    payload:'{"version":"local"}'
  });
  expect(conflict.status).toBe(409);
  expect(conflict.body.reason).toBe('REMOTE_CONFLICT');
  expect(conflict.body.remote_payload).toBe('{"version":"remote"}');
});

test('remote sync backend contract: malformed events are rejected', async ()=>{
  const service=createSyncService(memoryStore());
  const bad=await service.putEvent({event_id:'evt_3'});
  expect(bad.status).toBe(400);
  expect(bad.body.reason).toBe('INVALID_EVENT');
});
