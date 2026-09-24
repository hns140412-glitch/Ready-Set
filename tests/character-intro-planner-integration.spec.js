const { test, expect } = require('@playwright/test');

test('first journey -> character identity -> island/base camp -> live Planner', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'load' });

  // Prove the destination is the real Planner runtime, not a static intro ending.
  const seededPlanner = await page.evaluate(() => {
    const p=window.ReadySetPlanner;
    if(!p)return {ok:false};
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    const today=y+'-'+m+'-'+dd;
    p.upsertDatedTodo({
      todo_id:'intro_planner_e2e',
      date:today,
      label:'첫 탐험 플래너 연결 확인',
      source:'PLANNER_ALLOCATION',
      source_actor:'PLANNER_MAIN',
      estimated_minutes:15,
      state:'PLANNED'
    });
    return {ok:true,today};
  });
  expect(seededPlanner.ok).toBeTruthy();

  await page.locator('[data-nav="profile"]').first().click();
  await expect(page.locator('#profileView')).toHaveClass(/active/);
  await page.locator('#openCharacterSetupBtn').click();
  await expect(page.locator('#formationJourneyView')).toHaveClass(/active/);
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','CREW_MEET');

  await page.locator('[data-formation-action="MEET_DONE"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','COMPANION_SELECT');

  await page.locator('[data-formation-crew="dubi"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','COMPANION_NAME');

  await page.locator('#formationCompanionAlias').fill('두비');
  await page.locator('[data-formation-action="SAVE_ALIAS"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','PHOTO_REQUIRED');

  // External image generation remains gated. Seed only the already-locked identity receipt
  // so this test verifies product integration rather than spending an external provider call.
  const seededIdentity = await page.evaluate(() => {
    const key=Object.keys(localStorage).find(k=>k.endsWith('readyset_state'));
    if(!key)return {ok:false,reason:'STATE_KEY_MISSING'};
    const s=JSON.parse(localStorage.getItem(key));
    s.profile=s.profile||{};
    s.profile.photo='data:image/png;base64,iVBORw0KGgo=';
    s.profile.sourcePhoto={identityAuthority:'SOURCE_PHOTO',source_hash:'E2E_LOCKED_SOURCE'};
    s.profile.characterRemoteJob={status:'VISUAL_ID_LOCKED'};
    localStorage.setItem(key,JSON.stringify(s));
    return {ok:true,key};
  });
  expect(seededIdentity.ok).toBeTruthy();

  await page.reload({waitUntil:'load'});
  await page.locator('[data-nav="profile"]').first().click();
  await page.locator('#openCharacterSetupBtn').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','SHARED_ACCENT');

  await page.locator('[data-formation-accent="GREEN"]').click();
  await page.locator('[data-formation-action="SAVE_ACCENT"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','WORLD_ENTRY');

  await page.locator('[data-formation-entry="VOYAGE"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','ISLAND_DISCOVERY');

  await page.locator('[data-formation-action="DISCOVER_ISLAND"]').click();
  await page.locator('#formationIslandName').fill('첫여정섬');
  await page.locator('[data-formation-action="SAVE_ISLAND_NAME"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','BASE_CAMP_MOVE');

  await page.locator('[data-formation-action="ARRIVE_BASE_CAMP"]').click();
  await page.locator('#formationBaseCampName').fill('우리베이스캠프');
  await page.locator('[data-formation-action="SAVE_BASE_CAMP_NAME"]').click();
  await expect(page.locator('#formationJourneyView')).toHaveAttribute('data-formation-stage','READY');

  await page.locator('[data-formation-action="GO_READY"]').click();
  await expect(page.locator('#plannerView')).toHaveClass(/active/);
  await expect(page.locator('#plannerWeekStrip')).toBeVisible();
  await expect(page.locator('#plannerWeekDetail')).toContainText('첫 탐험 플래너 연결 확인');

  const persisted = await page.evaluate(() => {
    const key=Object.keys(localStorage).find(k=>k.endsWith('readyset_state'));
    const s=JSON.parse(localStorage.getItem(key));
    return {
      companion:s.expedition?.primaryCompanionId,
      alias:s.expedition?.primaryCompanionAlias,
      accent:s.expedition?.sharedAccent,
      entry:s.expedition?.formation?.worldEntry?.variant,
      island:s.expedition?.formation?.island?.name,
      baseCamp:s.expedition?.formation?.baseCamp?.name
    };
  });
  expect(persisted).toEqual({
    companion:'dubi',
    alias:'두비',
    accent:'GREEN',
    entry:'VOYAGE',
    island:'첫여정섬',
    baseCamp:'우리베이스캠프'
  });
});
