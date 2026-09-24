const {test,expect}=require('@playwright/test');

test('child can enter an event task and start Timer without a Planner TODO',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('#homeView [data-nav="mission"]').first().click();
  await expect(page.locator('#missionView')).toBeVisible();

  await page.locator('#eventTaskInput').fill('피아노 한 곡 연습');
  await page.locator('#addEventTaskBtn').click();
  await expect(page.locator('#eventTaskList')).toContainText('피아노 한 곡 연습');
  await expect(page.locator('#missionPreviewText')).toContainText('피아노 한 곡 연습');

  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();
  await expect(page.locator('#focusMission')).toContainText('피아노 한 곡 연습');

  const session=await page.evaluate(()=>window.__READY_TEST_STATE__?.activeSession||null).catch(()=>null);
  await expect(page.locator('#focusMission')).not.toContainText('오늘의 작전');
});

test('new homework fact remains parent-review flow and does not become direct event task',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('#homeView [data-nav="mission"]').first().click();

  const details=page.locator('#missionView .missionFactInbox');
  await details.locator('summary').click();
  await page.locator('#taskInput').fill('새로 받은 수학 숙제');
  await page.locator('#addTaskBtn').click();

  await expect(page.locator('#eventTaskList')).not.toContainText('새로 받은 수학 숙제');
  await expect(page.locator('#missionPreviewText')).not.toContainText('새로 받은 수학 숙제');
});
