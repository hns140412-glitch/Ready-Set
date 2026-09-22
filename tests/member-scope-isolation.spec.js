const { test, expect } = require('@playwright/test');

test('member scope isolates planner, assignments, app state and local-first snapshots', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});

  const result=await page.evaluate(async()=>{
    const originalFamily=window.ReadyFamilySession;
    const makeSession=id=>({
      current:()=>({authenticated:true,family_id:'FAMILY_TEST',member_id:id,role:'CHILD'}),
      requireRole:()=>({ok:true})
    });
    const setMember=id=>{ window.ReadyFamilySession=makeSession(id); };

    const persistence=window.ReadyRebuildAppPersistence.create({
      initial:{schemaVersion:5,profile:{name:'',birthdate:'',photo:'',style:'editorial',shareAvatar:false},guide:{}},
      storageKey:()=>window.ReadyMemberScope.storageKey('readyset_state'),
      storage:localStorage,
      localFirst:null
    });

    setMember('CHILD_A');
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'todo_A',
      date:'2026-09-22',
      label:'A 전용 탐험',
      state:'PLANNED',
      source:'PLANNER_V2_ALLOCATION'
    });
    const aAssignments=window.ReadyAssignments.load();
    aAssignments.assignmentFacts.fact_A={
      assignment_id:'fact_A',
      source_type:'TEST',
      subject:'수학',
      confirmation_state:'FACT_CONFIRMED',
      claims:[],
      created_at:new Date().toISOString()
    };
    window.ReadyAssignments.save(aAssignments);
    persistence.save({schemaVersion:5,profile:{name:'A',birthdate:'2015-01-01',photo:'',style:'editorial',shareAvatar:false},guide:{}});
    await window.ReadySetLocalFirst.capture('planner',JSON.stringify({member:'A'}));

    const aKeys={
      planner:window.ReadyMemberScope.storageKey('readyset_planner_v1'),
      assignments:window.ReadyMemberScope.storageKey('readyset_assignments_v2'),
      app:window.ReadyMemberScope.storageKey('readyset_state'),
      scope:window.ReadyMemberScope.syncScope('planner')
    };

    setMember('CHILD_B');
    const bBefore={
      planner:window.ReadySetPlanner.snapshot(),
      assignments:window.ReadyAssignments.load(),
      app:persistence.load()
    };
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'todo_B',
      date:'2026-09-22',
      label:'B 전용 탐험',
      state:'PLANNED',
      source:'PLANNER_V2_ALLOCATION'
    });
    const bAssignments=window.ReadyAssignments.load();
    bAssignments.assignmentFacts.fact_B={
      assignment_id:'fact_B',
      source_type:'TEST',
      subject:'영어',
      confirmation_state:'FACT_CONFIRMED',
      claims:[],
      created_at:new Date().toISOString()
    };
    window.ReadyAssignments.save(bAssignments);
    persistence.save({schemaVersion:5,profile:{name:'B',birthdate:'2020-01-01',photo:'',style:'editorial',shareAvatar:false},guide:{}});
    await window.ReadySetLocalFirst.capture('planner',JSON.stringify({member:'B'}));

    const bKeys={
      planner:window.ReadyMemberScope.storageKey('readyset_planner_v1'),
      assignments:window.ReadyMemberScope.storageKey('readyset_assignments_v2'),
      app:window.ReadyMemberScope.storageKey('readyset_state'),
      scope:window.ReadyMemberScope.syncScope('planner')
    };

    setMember('CHILD_A');
    const aAfter={
      planner:window.ReadySetPlanner.snapshot(),
      assignments:window.ReadyAssignments.load(),
      app:persistence.load()
    };

    const snapshots=await window.ReadySetLocalFirst.snapshots();
    window.ReadyFamilySession=originalFamily;
    return {aKeys,bKeys,bBefore,aAfter,snapshotScopes:snapshots.map(x=>x.scope)};
  });

  expect(result.aKeys.planner).toContain('CHILD_A');
  expect(result.bKeys.planner).toContain('CHILD_B');
  expect(result.aKeys.planner).not.toBe(result.bKeys.planner);
  expect(result.aKeys.assignments).not.toBe(result.bKeys.assignments);
  expect(result.aKeys.app).not.toBe(result.bKeys.app);
  expect(result.aKeys.scope).toBe('member:CHILD_A:planner');
  expect(result.bKeys.scope).toBe('member:CHILD_B:planner');

  expect(result.bBefore.planner.dated_todos.some(x=>x.todo_id==='todo_A')).toBe(false);
  expect(result.bBefore.assignments.assignmentFacts.fact_A).toBeUndefined();
  expect(result.bBefore.app.profile.name).not.toBe('A');

  expect(result.aAfter.planner.dated_todos.some(x=>x.todo_id==='todo_A')).toBe(true);
  expect(result.aAfter.planner.dated_todos.some(x=>x.todo_id==='todo_B')).toBe(false);
  expect(result.aAfter.assignments.assignmentFacts.fact_A).toBeTruthy();
  expect(result.aAfter.assignments.assignmentFacts.fact_B).toBeUndefined();
  expect(result.aAfter.app.profile.name).toBe('A');

  expect(result.snapshotScopes).toContain('member:CHILD_A:planner');
  expect(result.snapshotScopes).toContain('member:CHILD_B:planner');
});
