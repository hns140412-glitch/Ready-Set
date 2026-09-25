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

    const aSnapshots=await window.ReadySetLocalFirst.snapshots();
    setMember('CHILD_B');
    const bSnapshots=await window.ReadySetLocalFirst.snapshots();
    window.ReadyFamilySession=originalFamily;
    return {aKeys,bKeys,bBefore,aAfter,aSnapshotScopes:aSnapshots.map(x=>x.scope),bSnapshotScopes:bSnapshots.map(x=>x.scope)};
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

  expect(result.aSnapshotScopes.every(scope=>scope.startsWith('member:CHILD_A:'))).toBe(true);
  expect(result.aSnapshotScopes).toContain('member:CHILD_A:planner');
  expect(result.bSnapshotScopes.every(scope=>scope.startsWith('member:CHILD_B:'))).toBe(true);
  expect(result.bSnapshotScopes).toContain('member:CHILD_B:planner');
});


test('active member gates local-first recovery, flush and conflict handling', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});

  const result=await page.evaluate(async()=>{
    const originalFamily=window.ReadyFamilySession;
    const originalAdapter=window.ReadySetSyncAdapter;
    const makeSession=id=>({
      current:()=>({authenticated:true,family_id:'FAMILY_TEST',member_id:id,role:'CHILD'}),
      requireRole:()=>({ok:true})
    });
    const setMember=id=>{ window.ReadyFamilySession=makeSession(id); };

    setMember('CHILD_A');
    await window.ReadySetLocalFirst.capture('planner',JSON.stringify({owner:'A'}));
    setMember('CHILD_B');
    await window.ReadySetLocalFirst.capture('planner',JSON.stringify({owner:'B'}));

    const sent=[];
    window.ReadySetSyncAdapter={
      status:()=>({configured:true,enabled:true,state:'CONNECTED'}),
      send:async row=>{ sent.push(row.scope); return {ok:true,remote_version:1}; }
    };
    const flushB=await window.ReadySetLocalFirst.flush();

    const aPlannerKey='readyset_planner_v1::member::CHILD_A';
    const bPlannerKey='readyset_planner_v1::member::CHILD_B';
    localStorage.removeItem(aPlannerKey);
    localStorage.removeItem(bPlannerKey);

    setMember('CHILD_B');
    const recoverB=await window.ReadySetLocalFirst.recoverMissingScopes();
    const afterRecoverB={
      a:localStorage.getItem(aPlannerKey),
      b:localStorage.getItem(bPlannerKey)
    };

    setMember('CHILD_A');
    const recoverA=await window.ReadySetLocalFirst.recoverMissingScopes();
    const afterRecoverA={
      a:localStorage.getItem(aPlannerKey),
      b:localStorage.getItem(bPlannerKey)
    };

    window.ReadySetSyncAdapter={
      status:()=>({configured:true,enabled:true,state:'CONNECTED'}),
      send:async row=>({conflict:true,remote_payload:JSON.stringify({remote_for:row.scope})})
    };

    setMember('CHILD_A');
    await window.ReadySetLocalFirst.capture('assignments',JSON.stringify({owner:'A-conflict'}));
    await window.ReadySetLocalFirst.flush();
    const aConflict=(await window.ReadySetLocalFirst.conflicts()).find(x=>x.status==='OPEN');

    setMember('CHILD_B');
    await window.ReadySetLocalFirst.capture('assignments',JSON.stringify({owner:'B-conflict'}));
    await window.ReadySetLocalFirst.flush();

    async function visibleConflictScopes(memberId){
      setMember(memberId);
      const controller=window.ReadyRebuildAuthSyncController.create({
        view:{renderAuth:()=>{},renderSync:()=>{}},
        familySession:()=>window.ReadyFamilySession.current(),
        syncAdapter:()=>window.ReadySetSyncAdapter,
        localFirst:()=>window.ReadySetLocalFirst,
        requireParentUi:()=>false,
        renderPlanner:()=>{},
        toast:()=>{},
        eventTarget:{addEventListener:()=>{}}
      });
      const status=await controller.renderSyncStatus();
      return status.conflictRows.map(x=>x.scope);
    }

    const aVisible=await visibleConflictScopes('CHILD_A');
    const bVisible=await visibleConflictScopes('CHILD_B');

    setMember('CHILD_B');
    const crossResolve=aConflict
      ?await window.ReadySetLocalFirst.resolveConflict(aConflict.id,'KEEP_LOCAL')
      :{ok:false,reason:'A_CONFLICT_MISSING'};

    window.ReadyFamilySession=originalFamily;
    window.ReadySetSyncAdapter=originalAdapter;
    return {sent,flushB,recoverB,afterRecoverB,recoverA,afterRecoverA,aVisible,bVisible,crossResolve};
  });

  expect(result.sent.length).toBeGreaterThan(0);
  expect(result.sent.every(scope=>scope.startsWith('member:CHILD_B:'))).toBe(true);
  expect(result.flushB.sent).toBe(result.sent.length);

  expect(result.recoverB.recovered).toBeGreaterThanOrEqual(1);
  expect(result.afterRecoverB.a).toBeNull();
  expect(result.afterRecoverB.b).toContain('"owner":"B"');

  expect(result.recoverA.recovered).toBeGreaterThanOrEqual(1);
  expect(result.afterRecoverA.a).toContain('"owner":"A"');
  expect(result.afterRecoverA.b).toContain('"owner":"B"');

  expect(result.aVisible.length).toBeGreaterThan(0);
  expect(result.aVisible.every(scope=>scope.startsWith('member:CHILD_A:'))).toBe(true);
  expect(result.bVisible.length).toBeGreaterThan(0);
  expect(result.bVisible.every(scope=>scope.startsWith('member:CHILD_B:'))).toBe(true);
  expect(result.crossResolve).toEqual({ok:false,reason:'MEMBER_SCOPE_FORBIDDEN'});
});


test('idle recovery does not overwrite scoped app state while switching member context', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  const result=await page.evaluate(()=>{
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
    const recovery=window.ReadyRebuildSessionRecoveryController.create({
      getState:()=>({schemaVersion:5,profile:{name:'',birthdate:'',photo:'',style:'editorial',shareAvatar:false},selectedTodoIds:[],activeSession:null}),
      save:()=>persistence.save({schemaVersion:5,profile:{name:'',birthdate:'',photo:'',style:'editorial',shareAvatar:false},guide:{}}),
      planner:()=>window.ReadySetPlanner,
      plannerQuery:{snapshot:()=>({dated_todos:[]})},
      localDateKey:()=>new Date().toLocaleDateString('sv-SE')
    });

    setMember('CHILD_A');
    persistence.save({schemaVersion:5,profile:{name:'A',birthdate:'2015-01-01',photo:'',style:'editorial',shareAvatar:false},guide:{}});
    const before=persistence.load().profile.name;
    const rec=recovery.reconcile();
    const after=persistence.load().profile.name;
    window.ReadyFamilySession=originalFamily;
    return {before,after,changed:rec.changed};
  });

  expect(result.before).toBe('A');
  expect(result.changed).toBe(false);
  expect(result.after).toBe('A');
});
