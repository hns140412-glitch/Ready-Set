const {test,expect}=require('@playwright/test');
test('planner keeps island Base Camp atmosphere while planner remains primary',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('#plannerView .plannerWorldScene')).toBeVisible();
  await expect(page.locator('#plannerView .plannerWorldCamp')).toBeVisible();
  await expect(page.locator('#plannerView .plannerHero')).toBeVisible();
  const scene=await page.locator('#plannerView .plannerWorldScene').boundingBox();
  const hero=await page.locator('#plannerView .plannerHero').boundingBox();
  expect(scene.height).toBeLessThan(430);
  expect(hero.y).toBeLessThan(430);
  expect(await page.locator('#plannerView').evaluate(el=>getComputedStyle(el).backgroundImage)).not.toBe('none');
  await page.locator('[data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayPanel')).toBeVisible();
  await expect(page.locator('#plannerView .plannerWorldScene')).toBeVisible();
});
