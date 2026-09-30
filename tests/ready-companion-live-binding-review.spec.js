'use strict';
const {test,expect}=require('@playwright/test');
test('selected expedition companion binds real manifest source and its own words, not legacy fallback',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(async()=>{
    const assetRegistry=window.CharacterFormationAssetRuntime.create();
    const manifest=await assetRegistry.load();
    if(!manifest)throw new Error('LOCKED_MANIFEST_UNAVAILABLE');
    let synthetic={expedition:{}};
    const presenter=window.ReadyExpeditionCompanionPresentation.create({
      getState:()=>synthetic,
      roster:window.CharacterFormationJourneyRuntime.CREW,
      assetRegistry,
      preparation:id=>window.CharacterFormationSceneRuntime.preparationLineFor(id)
    });
    const blank=await presenter.renderHome();
    const blankHidden=document.querySelector('#homeGuideCard').hidden;
    synthetic={expedition:{primaryCompanionId:'ink',primaryCompanionAlias:'나의 잉크'}};
    const home=await presenter.renderHome();
    const mission=await presenter.renderMission();
    const result=await presenter.renderResult();
    return {blank,blankHidden,home,mission,result,
      homeLine:document.querySelector('#homeGuideLine').textContent,
      missionLine:document.querySelector('#missionCompanionLine').textContent,
      missionSource:document.querySelector('#missionCompanionLine').dataset.dialogueSource,
      homeImage:getComputedStyle(document.querySelector('#homeGuidePortrait')).backgroundImage,
      resultName:document.querySelector('#resultCompanionName').textContent,
      manifestPath:manifest.asset_files.crew.ink,
      resultSummaryLabel:document.querySelector('#resultLine').getAttribute('aria-label')};
  });
  expect(result.blank.reason).toBe('PRIMARY_COMPANION_NOT_SELECTED');
  expect(result.blankHidden).toBe(true);
  expect(result.home.ok).toBe(true);
  expect(result.home.character_id).toBe('ink');
  expect(result.mission.character_id).toBe('ink');
  expect(result.result.character_id).toBe('ink');
  expect(result.homeLine).toBe(windowInkIntro());
  expect(result.missionLine).toBe('“음… 다른 방법도 있지.”');
  expect(result.missionSource).toBe('CHARACTER_FORMATION_SCENE_PREPARATION');
  expect(result.homeImage).toContain(result.manifestPath.split('/').at(-1));
  expect(result.resultName).toBe('나의 잉크');
  expect(result.resultSummaryLabel).toBe('결과 요약');
  await expect(page.locator('#homeGuideCard')).toBeVisible();
  await page.screenshot({path:'ui-audit/ready-chosen-crew-home-source-bound.png',fullPage:true});
  await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelector('#missionView').classList.add('active');});
  await expect(page.locator('#missionCompanionCard')).toBeVisible();
  await page.screenshot({path:'ui-audit/ready-chosen-crew-goal-source-bound.png',fullPage:true});
  await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelector('#resultView').classList.add('active');});
  await expect(page.locator('#resultCompanionSlot')).toBeVisible();
  await page.screenshot({path:'ui-audit/ready-chosen-crew-result-source-bound.png',fullPage:true});
});
function windowInkIntro(){return '기록하면 발견이 보여!';}
