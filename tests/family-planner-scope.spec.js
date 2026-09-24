const {test,expect}=require('@playwright/test');

test('family planner shares family schedule while keeping child schedule and TODO isolated',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const out=await page.evaluate(()=>{
    const original=window.ReadyFamilySession;
    const make=(memberId,role='CHILD')=>({
      current:()=>({authenticated:true,state:'AUTHENTICATED',family_id:'FAMILY_SCOPE_E2E',member_id:memberId,account_id:memberId,role}),
      requireRole:required=>({ok:required==='PARENT'?role==='PARENT':true})
    });
    const set=(memberId,role='CHILD')=>{window.ReadyFamilySession=make(memberId,role);};

    set('PARENT_1','PARENT');
    window.ReadySetPlanner.upsertScheduleCommitment({
      commitment_id:'family_trip',
      title:'가족 일정',
      start_at:'2026-09-28T10:00:00',
      end_at:'2026-09-28T12:00:00',
      confirmed:true,
      audience_scope:'FAMILY_ALL',
      source:'PARENT_ADMIN_UI'
    });
    window.ReadySetPlanner.upsertScheduleCommitment({
      commitment_id:'child_a_english',
      title:'A 영어학원',
      start_at:'2026-09-28T16:00:00',
      end_at:'2026-09-28T18:00:00',
      confirmed:true,
      audience_scope:'MEMBER',
      target_member_id:'CHILD_A',
      source:'PARENT_ADMIN_UI'
    });

    const familyKey=window.ReadyMemberScope.familyStorageKey('readyset_planner_family_v1');
    const familyRaw=JSON.parse(localStorage.getItem(familyKey));

    set('CHILD_A');
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'child_a_todo',date:'2026-09-28',label:'A 숙제',source:'PLANNER_ALLOCATION',state:'PLANNED'
    });
    const a=window.ReadySetPlanner.snapshot();

    set('CHILD_B');
    const bBefore=window.ReadySetPlanner.snapshot();
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'child_b_todo',date:'2026-09-28',label:'B 숙제',source:'PLANNER_ALLOCATION',state:'PLANNED'
    });
    const b=window.ReadySetPlanner.snapshot();

    set('CHILD_A');
    const aAfter=window.ReadySetPlanner.snapshot();
    window.ReadyFamilySession=original;
    return {familyKey,familyRaw,a,bBefore,b,aAfter};
  });

  expect(out.familyKey).toContain('::family::FAMILY_SCOPE_E2E');
  expect(out.familyRaw.schedule_commitments).toHaveLength(2);

  expect(out.a.schedule_commitments.map(x=>x.commitment_id).sort()).toEqual(['child_a_english','family_trip']);
  expect(out.bBefore.schedule_commitments.map(x=>x.commitment_id)).toEqual(['family_trip']);
  expect(out.b.schedule_commitments.map(x=>x.commitment_id)).toEqual(['family_trip']);

  expect(out.aAfter.dated_todos.some(x=>x.todo_id==='child_a_todo')).toBe(true);
  expect(out.aAfter.dated_todos.some(x=>x.todo_id==='child_b_todo')).toBe(false);
  expect(out.b.dated_todos.some(x=>x.todo_id==='child_b_todo')).toBe(true);
  expect(out.b.dated_todos.some(x=>x.todo_id==='child_a_todo')).toBe(false);
});

test('parent planner admin exposes family-wide and connected-child targets',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,account_id:'PARENT_TARGET',family_id:'FAMILY_TARGET',membership_id:'M_PARENT',
      member_id:'PARENT_TARGET',role:'PARENT',session_id:'SESSION_TARGET',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.route('**/api/family/members',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,family_id:'FAMILY_TARGET',
      members:[
        {member_id:'PARENT_TARGET',role:'GUARDIAN',name:'엄마'},
        {member_id:'CHILD_A',role:'CHILD',name:'아이 A'},
        {member_id:'CHILD_B',role:'CHILD',name:'아이 B'}
      ]
    })});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').first().click();

  await expect(page.locator('#scheduleAudienceTarget')).toContainText('가족 전체');
  await expect(page.locator('#scheduleAudienceTarget')).toContainText('아이 A');
  await expect(page.locator('#scheduleAudienceTarget')).toContainText('아이 B');

  await page.locator('#scheduleAudienceTarget').selectOption('MEMBER:CHILD_A');
  await page.locator('#scheduleTitle').fill('A 영어학원');
  await page.locator('#scheduleDate').fill('2026-09-28');
  await page.locator('#scheduleStart').fill('16:00');
  await page.locator('#scheduleEnd').fill('18:00');
  await page.locator('#saveScheduleBtn').click();

  const saved=await page.evaluate(()=>{
    const key=window.ReadyMemberScope.familyStorageKey('readyset_planner_family_v1');
    return JSON.parse(localStorage.getItem(key)).schedule_commitments.find(x=>x.title==='A 영어학원');
  });
  expect(saved.audience_scope).toBe('MEMBER');
  expect(saved.target_member_id).toBe('CHILD_A');
});
