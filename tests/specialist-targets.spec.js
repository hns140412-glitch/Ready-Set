const {test,expect}=require('@playwright/test');

test('specialist targets preserve current fallback and never guess a V2 target',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(()=>{
    const targets=window.ReadySetSpecialistTargets;
    return {
      version:targets?.version||null,
      config:targets?.config?.()||null,
      hide:targets?.resolve?.('hide-seek')||null,
      snap:targets?.resolve?.('snap-pop')||null,
      origins:targets?.trustedOrigins?.()||[]
    };
  });
  expect(result.version).toBe('READY_SPECIALIST_TARGETS_V01');
  expect(result.config.hideSeekV2).toBeNull();
  expect(result.config.snapPopV2).toBeNull();
  expect(result.hide.target_kind).toBe('LEGACY_FALLBACK');
  expect(result.snap.target_kind).toBe('LEGACY_FALLBACK');
  expect(result.hide.learning_context_contract).toBe('UNVERIFIED_CONSUMER');
  expect(result.origins).toHaveLength(2);
});
