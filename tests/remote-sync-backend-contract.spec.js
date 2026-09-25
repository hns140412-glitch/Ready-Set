const { test, expect } = require('@playwright/test');
const fs=require('fs');
const { createSyncService } = require('../netlify/functions/ready-sync-core.js');
const familyCore=require('../netlify/functions/ready-family-auth-core.js');

function memoryStore(){
  const m=new Map();
  return {
    get:async key=>m.has(key)?m.get(key):null,
    set:async (key,value)=>{m.set(key,value);},
    snapshot:()=>new Map(m)
  };
}

test('remote sync core: health identifies persistent remote contract', async ()=>{
  const service=createSyncService(memoryStore(),{namespace:'family_a'});
  await expect(service.health()).resolves.toMatchObject({
    ok:true,
    service:'ready-set-sync',
    contract:'HTTP_JSON_V1',
    persistence:'REMOTE_STORE'
  });
});

test('remote sync core: same family + idempotency key + digest is accepted once', async ()=>{
  const store=memoryStore();
  const service=createSyncService(store,{namespace:'family_a'});
  const event={event_id:'evt_1',idempotency_key:'idem_1',scope:'planner',digest:'digest-a',payload:'{"x":1}'};
  const first=await service.putEvent(event);
  const second=await service.putEvent(event);
  expect(first.status).toBe(200);
  expect(first.body.idempotent).toBe(false);
  expect(second.status).toBe(200);
  expect(second.body.idempotent).toBe(true);
  expect(store.snapshot().size).toBe(1);
  expect([...store.snapshot().keys()][0]).toContain('families/family_a/events/');
});

test('remote sync core: same idempotency key is isolated across families', async ()=>{
  const store=memoryStore();
  const a=createSyncService(store,{namespace:'family_a'});
  const b=createSyncService(store,{namespace:'family_b'});
  const first=await a.putEvent({event_id:'evt_a',idempotency_key:'shared',scope:'planner',digest:'a',payload:'{"family":"a"}'});
  const second=await b.putEvent({event_id:'evt_b',idempotency_key:'shared',scope:'planner',digest:'b',payload:'{"family":"b"}'});
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect(store.snapshot().size).toBe(2);
});



test('remote sync core: authenticated member scope is server-bound and spoofing is rejected', async ()=>{
  const store=memoryStore();
  const service=createSyncService(store,{namespace:'family_a',member_id:'child_a'});
  const ok=await service.putEvent({
    event_id:'evt_member_a',
    idempotency_key:'idem_member_a',
    scope:'planner',
    logical_scope:'planner',
    scope_key:'family/family_a/member/child_a/scope/planner',
    scope_identity:{family_id:'family_a',member_id:'child_a'},
    digest:'digest-member-a',
    payload:'{"x":1}'
  });
  expect(ok.status).toBe(200);
  const record=JSON.parse([...store.snapshot().values()][0]);
  expect(record.family_namespace).toBe('family_a');
  expect(record.member_id).toBe('child_a');
  expect(record.scope_identity).toEqual({family_id:'family_a',member_id:'child_a'});
  expect(record.logical_scope).toBe('planner');

  const spoof=await service.putEvent({
    event_id:'evt_spoof',
    idempotency_key:'idem_spoof',
    scope:'planner',
    scope_identity:{family_id:'family_a',member_id:'child_b'},
    digest:'digest-spoof',
    payload:'{"x":2}'
  });
  expect(spoof.status).toBe(403);
  expect(spoof.body.reason).toBe('MEMBER_SCOPE_MISMATCH');
});

test('remote sync core: conflicting payload returns explicit 409 inside one family', async ()=>{
  const service=createSyncService(memoryStore(),{namespace:'family_a'});
  await service.putEvent({event_id:'evt_2',idempotency_key:'idem_2',scope:'assignments',digest:'digest-a',payload:'{"version":"remote"}'});
  const conflict=await service.putEvent({event_id:'evt_2',idempotency_key:'idem_2',scope:'assignments',digest:'digest-b',payload:'{"version":"local"}'});
  expect(conflict.status).toBe(409);
  expect(conflict.body.reason).toBe('REMOTE_CONFLICT');
  expect(conflict.body.remote_payload).toBe('{"version":"remote"}');
});



test('remote sync core: parent actor and learner member remain distinct', async ()=>{
  const store=memoryStore();
  const service=createSyncService(store,{
    namespace:'family_a',
    member_id:'child_a',
    actor_member_id:'parent_a',
    actor_role:'PARENT'
  });
  const result=await service.putEvent({
    event_id:'evt_parent_child',
    idempotency_key:'idem_parent_child',
    scope:'planner',
    logical_scope:'planner',
    scope_identity:{family_id:'family_a',member_id:'child_a'},
    actor_member_id:'parent_a',
    digest:'digest-parent-child',
    payload:'{"x":1}'
  });
  expect(result.status).toBe(200);
  const record=JSON.parse([...store.snapshot().values()][0]);
  expect(record.member_id).toBe('child_a');
  expect(record.actor_member_id).toBe('parent_a');
  expect(record.actor_role).toBe('PARENT');

  const spoof=await service.putEvent({
    event_id:'evt_actor_spoof',
    idempotency_key:'idem_actor_spoof',
    scope:'planner',
    scope_identity:{family_id:'family_a',member_id:'child_a'},
    actor_member_id:'other_parent',
    digest:'digest-spoof',
    payload:'{"x":2}'
  });
  expect(spoof.status).toBe(403);
  expect(spoof.body.reason).toBe('ACTOR_SCOPE_MISMATCH');
});

test('Identity family mapping: Parent gets stable family namespace and Child requires membership', async ()=>{
  const parent=familyCore.familySessionFromIdentityUser({id:'parent_1',email:'p@example.test',roles:['PARENT'],appMetadata:{roles:['PARENT']}});
  expect(parent.ok).toBeTruthy();
  expect(parent.session.role).toBe('PARENT');
  expect(parent.session.family_id).toBe('family_parent_1');

  const childMissing=familyCore.familySessionFromIdentityUser({id:'child_1',roles:['CHILD'],appMetadata:{roles:['CHILD']}});
  expect(childMissing.ok).toBeFalsy();
  expect(childMissing.reason).toBe('FAMILY_MEMBERSHIP_REQUIRED');

  const child=familyCore.familySessionFromIdentityUser({id:'child_1',roles:['CHILD'],appMetadata:{roles:['CHILD'],family_id:'family_parent_1'}});
  expect(child.ok).toBeTruthy();
  expect(child.session.family_id).toBe('family_parent_1');
});

test('Identity family mapping: ambiguous roles and cross-family linking are rejected', async ()=>{
  expect(familyCore.familySessionFromIdentityUser({id:'x',roles:['PARENT','CHILD'],appMetadata:{roles:['PARENT','CHILD']}}).reason).toBe('IDENTITY_ROLE_INVALID');
  const parent={id:'parent_1',roles:['PARENT'],appMetadata:{roles:['PARENT']}};
  const otherChild={id:'child_2',roles:['CHILD'],appMetadata:{roles:['CHILD'],family_id:'family_other'}};
  expect(familyCore.canLinkChild(parent,otherChild).reason).toBe('TARGET_ALREADY_IN_OTHER_FAMILY');
});

test('Netlify Identity server functions use modern Identity verification patterns', async ()=>{
  const sync=fs.readFileSync('netlify/functions/ready-sync.mjs','utf8');
  const login=fs.readFileSync('netlify/functions/auth-login.mjs','utf8');
  const logout=fs.readFileSync('netlify/functions/auth-logout.mjs','utf8');
  const session=fs.readFileSync('netlify/functions/auth-session.mjs','utf8');
  expect(sync).toContain("getUser");
  expect(sync).toContain("namespace:mapped.session.family_id");
  expect(login).toContain("verifyRequestOrigin");
  expect(logout).toContain("verifyRequestOrigin");
  expect(session).toContain("getUser");
  expect(sync).not.toContain("READY_SYNC_AUTH_TOKEN");
});


test('Identity signup event assigns CHILD by default and never self-elects PARENT', async ()=>{
  const identity=await import('../netlify/functions/identity.mjs');
  const result=identity.default.userSignup({
    user:{id:'new_user',email:'new@example.test',appMetadata:{}}
  });
  expect(result.user.appMetadata.roles).toEqual(['CHILD']);

  const existingParent=identity.default.userSignup({
    user:{id:'parent_user',email:'parent@example.test',appMetadata:{roles:['PARENT']}}
  });
  expect(existingParent.user.appMetadata.roles).toEqual(['PARENT']);
});
