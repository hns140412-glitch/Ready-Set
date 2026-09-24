const {test,expect}=require('@playwright/test');

test('multiple families keep account relationships and member data isolated',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const result=await page.evaluate(()=>{
    const original=window.ReadyFamilySession;
    const make=(familyId,memberId,role)=>({
      current:()=>({authenticated:true,family_id:familyId,member_id:memberId,role}),
      requireRole:required=>({ok:required===role||required==='CHILD'&&role==='CHILD'})
    });
    const set=(familyId,memberId,role)=>{window.ReadyFamilySession=make(familyId,memberId,role);};

    set('FAMILY_A','PARENT_A','PARENT');
    const aParentKey=window.ReadyMemberScope.storageKey('readyset_state');
    set('FAMILY_A','CHILD_A','CHILD');
    const aChildKey=window.ReadyMemberScope.storageKey('readyset_state');
    const aChildScope=window.ReadyMemberScope.syncScope('planner');

    set('FAMILY_B','PARENT_B','PARENT');
    const bParentKey=window.ReadyMemberScope.storageKey('readyset_state');
    set('FAMILY_B','CHILD_B','CHILD');
    const bChildKey=window.ReadyMemberScope.storageKey('readyset_state');
    const bChildScope=window.ReadyMemberScope.syncScope('planner');

    window.ReadyFamilySession=original;
    return {aParentKey,aChildKey,aChildScope,bParentKey,bChildKey,bChildScope};
  });

  expect(result.aParentKey).not.toBe(result.aChildKey);
  expect(result.bParentKey).not.toBe(result.bChildKey);
  expect(result.aParentKey).not.toBe(result.bParentKey);
  expect(result.aChildKey).not.toBe(result.bChildKey);
  expect(result.aChildScope).toBe('member:CHILD_A:planner');
  expect(result.bChildScope).toBe('member:CHILD_B:planner');
});

test('server family core prevents cross-family child relinking while allowing same-family idempotence',async({page})=>{
  const core=await import('../netlify/functions/ready-family-auth-core.js');
  const api=core.default||core;

  const parentA={id:'PARENT_A',appMetadata:{roles:['PARENT'],family_id:'FAMILY_A'}};
  const parentB={id:'PARENT_B',appMetadata:{roles:['PARENT'],family_id:'FAMILY_B'}};
  const childA={id:'CHILD_A',appMetadata:{roles:['CHILD'],family_id:'FAMILY_A'}};
  const unlinked={id:'CHILD_NEW',appMetadata:{roles:['CHILD']}};

  expect(api.canLinkChild(parentA,childA)).toEqual({ok:true,family_id:'FAMILY_A'});
  expect(api.canLinkChild(parentB,childA)).toEqual({ok:false,status:409,reason:'TARGET_ALREADY_IN_OTHER_FAMILY'});
  expect(api.canLinkChild(parentB,unlinked)).toEqual({ok:true,family_id:'FAMILY_B'});
});
