const {test,expect}=require('@playwright/test');

async function startExpressionTask(page){
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const seeded=await page.evaluate(()=>{
  const now=new Date();
  const date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),
   String(now.getDate()).padStart(2,'0')].join('-');
  const todo=window.ReadySetPlanner.upsertDatedTodo({
   todo_id:'help-needed-fixture-task',date,label:'E2E 문장 표현',
   source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',
   estimated_minutes:15,state:'PLANNED'
  });
  state.selectedTodoIds=[todo.todo_id];state.targetMin=1;save();
  document.getElementById('startBtn').click();
  return !!todo;
 });
 expect(seeded).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.ReadySetRev07.contract()?.tasks?.length)).toBe(1);
 return page.evaluate(()=>{
  const c=window.ReadySetRev07.contract();
  return {session_id:c.session_id,task_id:c.tasks[0].task_id,lap_id:c.active_lap_id};
 });
}

test('Snap HELP_NEEDED URL return requests parent support rather than marking blocked',async({page})=>{
 const ids=await startExpressionTask(page);
 const url=new URL('http://127.0.0.1:4173/');
 for(const [k,v] of Object.entries({...ids,task_state:'HELP_NEEDED',from_app:'snap-pop'}))
  if(v)url.searchParams.set(k,v);
 await page.goto(url.href,{waitUntil:'load'});
 const result=await page.evaluate(()=>({
  task:window.ReadySetRev07.contract()?.tasks?.[0],
  queryPending:location.search.includes('task_state')
 }));
 expect(result.task.state).toBe('WAITING_FOR_PARENT');
 expect(result.task.state).not.toBe('BLOCKED');
 expect(result.queryPending).toBe(false);
});

test('Snap HELP_NEEDED event maps to parent wait, while explicit TASK_BLOCKED remains blocked',async({page})=>{
 const ids=await startExpressionTask(page);
 const result=await page.evaluate(ids=>{
  const send=(type,event_id)=>window.dispatchEvent(new MessageEvent('message',{
   origin:'https://cheerful-pothos-d1c3ee.netlify.app',
   data:{type:'TAKY_LEARNING_EVENT',event:{
    app:'snap-pop',event_id,type,session_id:ids.session_id,
    task_id:ids.task_id,lap_id:ids.lap_id,payload:{child_authored:true}
   }}
  }));
  send('HELP_NEEDED','help-request-one');
  const afterHelp=window.ReadySetRev07.contract();
  send('TASK_BLOCKED','explicit-block-one');
  const afterBlocked=window.ReadySetRev07.contract();
  return {afterHelp:afterHelp.tasks[0].state,
   helpDedup:afterHelp.applied_event_ids?.includes('help-request-one'),
   afterBlocked:afterBlocked.tasks[0].state,
   blockDedup:afterBlocked.applied_event_ids?.includes('explicit-block-one')};
 },ids);
 expect(result.afterHelp).toBe('WAITING_FOR_PARENT');
 expect(result.helpDedup).toBe(true);
 expect(result.afterBlocked).toBe('BLOCKED');
 expect(result.blockDedup).toBe(true);
});
