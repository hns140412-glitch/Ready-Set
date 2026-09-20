const { test, expect } = require('@playwright/test');
const { createSyncService } = require('../netlify/functions/ready-sync-core.js');
const { handler } = require('../netlify/functions/ready-sync.js');

function memoryStore(){
  const m=new Map();
  return {
    get:async key=>m.has(key)?m.get(key):null,
    set:async (key,value)=>{m.set(key,value);},
    snapshot:()=>new Map(m)
  };
}

test('remote sync core: health identifies persistent remote contract', async ()=>{
  const service=createSyncService(memoryStore());
  await expect(service.health()).resolves.toMatchObject({
    ok:true,
    service:'ready-set-sync',
    contract:'HTTP_JSON_V1',
    persistence:'REMOTE_STORE'
  });
});

test('remote sync core: same idempotency key + digest is accepted once', async ()=>{
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

test('remote sync core: conflicting payload returns explicit 409', async ()=>{
  const service=createSyncService(memoryStore());
  await service.putEvent({
    event_id:'evt_2',
    idempotency_key:'idem_2',
    scope:'assignments',
    digest:'digest-a',
    payload:'{"version":"remote"}'
  });
  const conflict=await service.putEvent({
    event_id:'evt_2',
    idempotency_key:'idem_2',
    scope:'assignments',
    digest:'digest-b',
    payload:'{"version":"local"}'
  });
  expect(conflict.status).toBe(409);
  expect(conflict.body.reason).toBe('REMOTE_CONFLICT');
  expect(conflict.body.remote_payload).toBe('{"version":"remote"}');
});

test('remote sync endpoint: writes are fail-closed when auth is not configured', async ()=>{
  const before=process.env.READY_SYNC_AUTH_TOKEN;
  delete process.env.READY_SYNC_AUTH_TOKEN;
  const res=await handler({
    httpMethod:'POST',
    path:'/api/ready-sync/events',
    headers:{},
    body:JSON.stringify({event_id:'evt_3',digest:'d3'})
  });
  expect(res.statusCode).toBe(503);
  expect(JSON.parse(res.body).reason).toBe('AUTH_NOT_CONFIGURED');
  if(before===undefined) delete process.env.READY_SYNC_AUTH_TOKEN;
  else process.env.READY_SYNC_AUTH_TOKEN=before;
});

test('remote sync endpoint: wrong bearer token is rejected before remote store access', async ()=>{
  const before=process.env.READY_SYNC_AUTH_TOKEN;
  process.env.READY_SYNC_AUTH_TOKEN='server-secret';
  const res=await handler({
    httpMethod:'POST',
    path:'/api/ready-sync/events',
    headers:{authorization:'Bearer wrong-secret'},
    body:JSON.stringify({event_id:'evt_4',digest:'d4'})
  });
  expect(res.statusCode).toBe(401);
  expect(JSON.parse(res.body).reason).toBe('UNAUTHORIZED');
  if(before===undefined) delete process.env.READY_SYNC_AUTH_TOKEN;
  else process.env.READY_SYNC_AUTH_TOKEN=before;
});

test('remote sync endpoint: health is readable but reports auth readiness truthfully', async ()=>{
  const before=process.env.READY_SYNC_AUTH_TOKEN;
  delete process.env.READY_SYNC_AUTH_TOKEN;
  const res=await handler({
    httpMethod:'GET',
    path:'/api/ready-sync/health',
    headers:{}
  });
  const body=JSON.parse(res.body);
  expect(res.statusCode).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.write_auth).toBe('NOT_CONFIGURED');
  if(before===undefined) delete process.env.READY_SYNC_AUTH_TOKEN;
  else process.env.READY_SYNC_AUTH_TOKEN=before;
});
