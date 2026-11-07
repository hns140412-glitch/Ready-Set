const { test, expect } = require('@playwright/test');

function crewToken(event){
  return Buffer.from(JSON.stringify({v:1,at:'2026-10-01T00:00:00.000Z',event}),'utf8').toString('base64url');
}

test('Ready consumes canonical main companion handoff without making local guide presentation authoritative', async ({ page }) => {
  const token=crewToken({
    event_id:'evt-ready-main-dubi',
    relation_event:{
      type:'MAIN_SELECTED',
      character_id:'dubi',
      at:'2026-10-01T00:00:00.000Z'
    }
  });
  await page.goto('http://127.0.0.1:4173/?crew_event='+token,{waitUntil:'load'});

  await expect.poll(()=>page.url()).not.toContain('crew_event=');

  const initial=await page.evaluate(()=>({
    projection:window.ReadySetSharedCrewProjection?.(),
    canonicalStore:localStorage.getItem('taky_explorer_crew_canonical_v1'),
    home:{
      character:document.querySelector('#homeGuidePortrait')?.dataset.explorerCrewCharacter,
      presentation:document.querySelector('#homeGuidePortrait')?.dataset.guidePresentation,
      relationWrite:document.querySelector('#homeGuidePortrait')?.dataset.explorerCrewRelationWrite,
      behaviorOwner:document.querySelector('#homeGuidePortrait')?.dataset.explorerCrewBehaviorOwner
    }
  }));
  expect(initial.projection.status).toBe('BOUND');
  expect(initial.projection.character_id).toBe('dubi');
  expect(initial.projection.relation_write).toBe(false);
  expect(initial.projection.affinity_write).toBe(false);
  expect(initial.projection.behavior_owner).toBe(false);
  expect(initial.projection.asset_resolver).toBe(false);
  expect(initial.canonicalStore).toBeNull();
  expect(initial.home.character).toBe('dubi');
  expect(initial.home.presentation).toBe('lumi');
  expect(initial.home.relationWrite).toBe('false');
  expect(initial.home.behaviorOwner).toBe('false');

  await page.locator('[data-nav="settings"]').first().click();
  await page.locator('[data-guide-type="pico"]').click();

  const after=await page.evaluate(()=>({
    projection:window.ReadySetSharedCrewProjection?.(),
    localGuide:JSON.parse(localStorage.getItem('readyset_state')).guide,
    settings:{
      character:document.querySelector('#settingsGuidePortrait')?.dataset.explorerCrewCharacter,
      presentation:document.querySelector('#settingsGuidePortrait')?.dataset.guidePresentation
    },
    canonicalStore:localStorage.getItem('taky_explorer_crew_canonical_v1')
  }));
  expect(after.projection.character_id).toBe('dubi');
  expect(after.localGuide.type).toBe('pico');
  expect(after.settings.character).toBe('dubi');
  expect(after.settings.presentation).toBe('pico');
  expect(after.canonicalStore).toBeNull();
});

test('Ready fails closed on unsupported Crew relation events', async ({ page }) => {
  const token=crewToken({
    relation_event:{
      type:'SHARED_ACTIVITY',
      character_id:'ink',
      at:'2026-10-01T00:00:00.000Z'
    }
  });
  await page.goto('http://127.0.0.1:4173/?crew_event='+token,{waitUntil:'load'});
  const out=await page.evaluate(()=>({
    projection:window.ReadySetSharedCrewProjection?.(),
    canonicalStore:localStorage.getItem('taky_explorer_crew_canonical_v1')
  }));
  expect(out.projection.status).toBe('UNBOUND');
  expect(out.projection.character_id).toBeNull();
  expect(out.canonicalStore).toBeNull();
  expect(page.url()).toContain('crew_event=');
});
