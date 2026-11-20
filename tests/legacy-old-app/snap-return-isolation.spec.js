const {test,expect}=require('@playwright/test');
const READY='http://127.0.0.1:4173/';
const SNAP='https://cheerful-pothos-d1c3ee.netlify.app/';

async function seededRun(page){
 await page.addInitScript(()=>{
  document.addEventListener('DOMContentLoaded',()=>{
   const selected=sessionStorage.getItem('audit_selected_member')||'A';
   const scope={authenticated:true,family_id:'F1',selected_member_id:selected};
   window.__auditScope=scope;
   window.ReadyCentralLearningRoundtripV01.installBrowserHost({
    eventTarget:window,activeScopeProvider:()=>scope,
    roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
    resolveRecordOptions:()=>({})
   });
  },{once:true});
 });
 await page.goto(READY,{waitUntil:'load'});
 const started=await page.evaluate(()=>{
  const d=new Date(),date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),
   String(d.getDate()).padStart(2,'0')].join('-');
  const todo=ReadySetPlanner.upsertDatedTodo({
   todo_id:'snap-return-identity',date,label:'E2E 문장 쓰기',
   source:'PLANNER_ALLOCATION',state:'PLANNED'
  });
  state.selectedTodoIds=[todo.todo_id];state.targetMin=1;save();
  document.getElementById('startBtn').click();
  return !!todo;
 });
 expect(started).toBe(true);
 await expect.poll(()=>page.evaluate(()=>!!ReadySetRev07.contract()?.active_lap_id)).toBe(true);
 const ids=await page.evaluate(()=>{
  const c=ReadySetRev07.contract();
  return {session_id:c.session_id,task_id:c.active_task_id,lap_id:c.active_lap_id};
 });
 await page.route(SNAP+'**',route=>route.abort());
 const outbound=page.waitForRequest(r=>r.url().startsWith(SNAP+'?'));
 const launched=await page.evaluate(()=>ReadySetRev07.launchSpecialist('snap-pop'));
 expect(launched).toBe(true);
 await outbound;
 return ids;
}

test('Snap return for a different child does not mutate original scoped Ready or Planner',async({page})=>{
 const ids=await seededRun(page);
 // The currently opened A run stays A; only the next Ready document has B
 // as the independently selected member. URL child labels cannot override it.
 await page.goto(READY,{waitUntil:'load'});
 await page.evaluate(()=>sessionStorage.setItem('audit_selected_member','B'));
 // The old tab has just been loaded from a real Snap handoff; emulate an
 // in-flight same-run return through navigation, not a new Ready launch.
 const url=new URL(READY);
 for(const [k,v] of Object.entries({...ids,task_state:'HELP_NEEDED',from_app:'snap-pop'}))
  url.searchParams.set(k,v);
 await page.goto(url.href,{waitUntil:'load'});
 const result=await page.evaluate(()=>{
  const c=ReadySetRev07.contract();
  const todo=ReadySetPlanner.snapshot().dated_todos.find(t=>t.todo_id===c.tasks[0].planner_todo_id);
  return {live:window.__auditScope.selected_member_id,
   original:state.activeSession.centralLearningScope.member_id,
   state:c.tasks[0].state,planner:todo?.state,
   app:c.active_app,unconsumed:location.search.includes('task_state')};
 });
 expect(result).toEqual({live:'B',original:'A',state:'PENDING',
  planner:'IN_PROGRESS',app:'snap-pop',unconsumed:true});
});

test('Snap prior lap ID cannot close the current task even for the original child',async({page})=>{
 const ids=await seededRun(page);
 const url=new URL(READY);
 for(const [k,v] of Object.entries({...ids,lap_id:'STALE_LAP',
    task_state:'COMPLETED',from_app:'snap-pop'}))
  url.searchParams.set(k,v);
 await page.goto(url.href,{waitUntil:'load'});
 const result=await page.evaluate(()=>({
  state:ReadySetRev07.contract()?.tasks?.[0]?.state,
  unconsumed:location.search.includes('task_state')
 }));
 expect(result).toEqual({state:'PENDING',unconsumed:true});
});
