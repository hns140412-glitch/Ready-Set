'use strict';
const {test,expect}=require('@playwright/test');

// Identity proof only. This is NOT approval of the old abstract/CSS scenery
// nor a claim that synthetic fixture data is the actual child's choice.
for(const viewport of [{width:390,height:844,kind:'phone'},{width:1024,height:768,kind:'tablet'}]){
  test('selected approved companion persists on Weekly/Daily — '+viewport.kind,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
    const info=await page.evaluate(async()=>{
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      document.querySelector('#plannerView').classList.add('active');
      const registry=window.CharacterFormationAssetRuntime.create();
      const manifest=await registry.load();
      if(!manifest)throw new Error('CREW_HARD_LOCK_MANIFEST_UNAVAILABLE');
      let chosen={expedition:{}};
      const presenter=window.ReadyExpeditionCompanionPresentation.create({
        getState:()=>chosen,roster:window.CharacterFormationJourneyRuntime.CREW,
        assetRegistry:registry
      });
      const blank=await presenter.renderPlanner();
      const hiddenBeforeChoice=document.querySelector('#plannerCompanionPresence').hidden;
      chosen={expedition:{primaryCompanionId:'ink',primaryCompanionAlias:'선택한 잉크'}};
      const week=await presenter.renderPlanner();
      return {blank,hiddenBeforeChoice,week,asset:manifest.asset_files.crew.ink,
        image:getComputedStyle(document.querySelector('#plannerCompanionPortrait')).backgroundImage,
        name:document.querySelector('#plannerCompanionName').textContent,
        sourceHash:document.querySelector('#plannerCompanionPortrait').dataset.assetSha256,
        manifestHash:manifest.asset_sources.core6_runtime_derivatives.sha256.ink};
    });
    expect(info.blank.reason).toBe('PRIMARY_COMPANION_NOT_SELECTED');
    expect(info.hiddenBeforeChoice).toBe(true);
    expect(info.week.ok).toBe(true);
    expect(info.week.character_id).toBe('ink');
    expect(info.name).toBe('선택한 잉크');
    expect(info.image).toContain(info.asset.split('/').at(-1));
    expect(info.sourceHash).toBe(info.manifestHash);
    await expect(page.locator('#plannerCompanionPresence')).toBeVisible();
    await expect(page.locator('#plannerWeekPanel')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+2);
    await page.screenshot({path:'ui-audit/ready-week-chosen-crew-'+viewport.kind+'.png',fullPage:true});

    const daily=await page.evaluate(async()=>{
      const panel=document.querySelector('#plannerWeekPanel'),daily=document.querySelector('#plannerDayPanel');
      panel.hidden=true;daily.hidden=false;
      // Rebuild a projection with the SAME chosen ID and approved manifest; changing
      // Week/Day presentation must not invent a different speaker/character.
      const registry=window.CharacterFormationAssetRuntime.create();await registry.load();
      let current={expedition:{primaryCompanionId:'ink',primaryCompanionAlias:'선택한 잉크'}};
      const presenter=window.ReadyExpeditionCompanionPresentation.create({
        getState:()=>current,roster:window.CharacterFormationJourneyRuntime.CREW,
        assetRegistry:registry
      });
      const day=await presenter.renderPlanner();
      const name=document.querySelector('#plannerCompanionName').textContent;
      current.expedition={primaryCompanionId:'zero',primaryCompanionAlias:'선택한 제로'};
      const switched=await presenter.renderPlanner();
      const switchedId=document.querySelector('#plannerCompanionPortrait').dataset.characterId;
      current.expedition={};
      const removed=await presenter.renderPlanner();
      const emptyHidden=document.querySelector('#plannerCompanionPresence').hidden;
      current.expedition={primaryCompanionId:'ink',primaryCompanionAlias:'선택한 잉크'};
      const restored=await presenter.renderPlanner();
      return {day,dayName:name,switched,switchedId,removed,emptyHidden,restored};
    });
    expect(daily.day.ok).toBe(true);
    expect(daily.dayName).toBe('선택한 잉크');
    expect(daily.switchedId).toBe('zero');
    expect(daily.emptyHidden).toBe(true);
    expect(daily.restored.character_id).toBe('ink');
    await expect(page.locator('#plannerDayPanel')).toBeVisible();
    await expect(page.locator('#plannerCompanionName')).toHaveText('선택한 잉크');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width+2);
    await page.screenshot({path:'ui-audit/ready-day-chosen-crew-'+viewport.kind+'.png',fullPage:true});
  });
}
