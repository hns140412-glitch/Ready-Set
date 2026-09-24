const {test,expect}=require('@playwright/test');
test('home and planner share one Base Camp world while timer remains separate focus mode',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect(page.locator('#homeView .homeWorldScene')).toBeVisible();
  await expect(page.locator('#homeView .homeWorldCamp')).toBeVisible();
  await expect(page.locator('#homeView .homePlannerPrimary')).toBeVisible();
  await expect(page.locator('#homeView')).toContainText('오늘의');
  await expect(page.locator('#homeView')).toContainText('베이스캠프');

  await page.locator('#homeView .homePlannerPrimary').click();
  await expect(page.locator('#plannerView')).toBeVisible();
  await expect(page.locator('#plannerView .plannerWorldScene')).toBeVisible();
  await expect(page.locator('#plannerView .plannerWorldCamp')).toBeVisible();

  await page.locator('[data-nav="home"]').first().click();
  await page.locator('[data-nav="mission"]').first().click();
  await expect(page.locator('#missionView')).toBeVisible();

  await expect(page.locator('#focusView .clockHero')).toHaveCount(1);
  await expect(page.locator('#focusView .homeWorldScene')).toHaveCount(0);
});
