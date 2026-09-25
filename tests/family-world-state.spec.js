const {test,expect}=require('@playwright/test');

test('World state mutates only from explicit child-owned signals',async({page})=>{
  const patches=[];
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'F1',member_id:'C1',role:'CHILD',session_id:'S1',
      expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.route('**/api/family/members',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,registry:{family_id:'F1',revision:1,members:[{family_id:'F1',member_id:'C1',role:'CHILD',profile:{display_name:'Child'}}]}})}));
  await page.route('**/api/family/crew?**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,crew:{member_id:'C1',primary_companion_id:'crew.core.dubi',roster:[{character_id:'crew.core.dubi',display_name:'두비'}],revision:1}})}));
  await page.route('**/api/family/world-state?**',async r=>{
    if(r.request().method()==='GET'){
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,state:{member_id:'C1',primary_companion_id:'crew.core.dubi',crew_presence:[],relationships:[],special_encounters:[],world_memories:[],revision:0}})});
    }
    patches.push(JSON.parse(r.request().postData()||'{}'));
    const op=patches.at(-1)?.operation||{};
    return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,state:{member_id:'C1',primary_companion_id:'crew.core.dubi',crew_presence:op.type==='SET_PRESENCE'?[{character_id:'crew.core.dubi',state:'WITH_EXPLORER'}]:[],relationships:op.type==='RECORD_MEANINGFUL_EPISODE'?[{character_id:'crew.core.dubi',meaningful_episode_count:1,memory_refs:[op.memory_ref]}]:[],special_encounters:[],world_memories:[],revision:1}})});
  });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>window.ReadyWorldState?.current?.().member_id)).toBe('C1');

  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('taky-exploration-event',{detail:{member_id:'C1',source_event_type:'APP_SWITCH',exploration_event_id:'E1',occurred_at:new Date().toISOString(),payload:{}}})));
  await expect.poll(()=>patches.some(x=>x.operation?.type==='SET_PRESENCE')).toBeTruthy();

  const before=patches.length;
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('taky-exploration-event',{detail:{member_id:'C1',source_event_type:'TASK_COMPLETED',exploration_event_id:'E2',occurred_at:new Date().toISOString(),payload:{}}})));
  await page.waitForTimeout(50);
  expect(patches.length).toBe(before);

  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('taky-exploration-event',{detail:{member_id:'C1',source_event_type:'TASK_COMPLETED',exploration_event_id:'E3',occurred_at:new Date().toISOString(),payload:{meaningful_episode:true,memory_ref:'memory:explicit'}}})));
  await expect.poll(()=>patches.some(x=>x.operation?.type==='RECORD_MEANINGFUL_EPISODE'&&x.operation?.memory_ref==='memory:explicit')).toBeTruthy();
});
