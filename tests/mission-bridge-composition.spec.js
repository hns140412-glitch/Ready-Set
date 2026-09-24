const {test,expect}=require('@playwright/test');

test('Mission Briefing preserves Planner TODO provenance and stays a lightweight Timer launch bridge',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const today=await page.evaluate(()=>new Date().toLocaleDateString('sv-SE'));
  await page.evaluate(today=>{
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'mission_bridge_todo',date:today,label:'영어 단어 복습',
      source:'PLANNER_ALLOCATION',state:'PLANNED',estimated_minutes:20
    });
  },today);
  await page.locator('#homeView [data-nav="mission"]').first().click();
  await expect(page.locator('#missionView')).toBeVisible();
  await expect(page.locator('#missionView .missionBridgeScene')).toBeVisible();
  await expect(page.locator('#plannerTodayList [data-todo-id="mission_bridge_todo"]')).toBeVisible();
  await page.locator('#plannerTodayList [data-todo-id="mission_bridge_todo"]').click();
  await expect(page.locator('#missionPreviewText')).toContainText('영어 단어 복습');
  await expect(page.locator('#missionView #missionChips')).toHaveCount(0);
  await expect(page.locator('#missionView .missionFactInbox')).not.toHaveAttribute('open','');
  await expect(page.locator('#missionView .missionFactInbox')).toContainText('부모 확인으로 보내기');
  await expect(page.locator('#startBtn')).toBeVisible();
  const dims=await page.locator('#missionView').evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.clientWidth+2);
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();
  await expect(page.locator('#focusMission')).toContainText('영어 단어 복습');
});
