import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createServer} from './visual-qa/server.mjs';

const {chromium}=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:'playwright');
const server=createServer();
await new Promise(resolve=>server.listen(4177,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,timeout:15000,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  let apiCalls=0;
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith('/api/'))apiCalls++;
    if(url.origin!=='http://127.0.0.1:4177'||url.pathname.startsWith('/api/'))return route.abort();
    return route.continue();
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',dialog=>dialog.dismiss());

  await page.goto('http://127.0.0.1:4177/__visual/?state=onboarding-photo',{waitUntil:'load',timeout:15000});
  await page.waitForFunction(()=>window.ReadyIdentityV1&&document.documentElement.dataset.readyStageLoader);
  await page.locator('#gal').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>!document.querySelector('#readyFirstRun #next')?.disabled);
  await page.locator('#readyFirstRun #next').tap();
  await page.waitForSelector('#readyCharacterCandidateMount .takyConsult',{timeout:12000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'CHARACTER');

  await page.locator('[data-taky-choice="FEEL_BRIGHT"]').tap();
  await page.locator('[data-taky-confirm]').tap();
  await page.locator('[data-taky-choice="LOOK_ACTIVE"]').tap();
  await page.locator('[data-taky-confirm]').tap();
  await page.waitForSelector('[data-taky-generate]',{timeout:8000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().characterMoodDirections.selections.length),3);
  assert.match(await page.evaluate(()=>ReadyIdentityV1.get().characterMoodDirections.selections[2].tileKey),/^AUTO_/);

  await page.waitForSelector('#rofCharacterDefer',{timeout:8000});
  await page.locator('#rofCharacterDefer').tap();
  await page.waitForSelector('#rofExplorerNext',{timeout:8000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'EXPLORER');
  await page.locator('button[data-guide="lumi"]').tap();
  await page.locator('#rofExplorerNext').tap();
  await page.waitForSelector('#rofFinish',{timeout:8000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'THEME');
  await page.locator('button[data-theme="TODAYS_ISLAND"]').tap();

  // The finish action intentionally reloads to the derived parent role. Keep the completed
  // identity instead of letting the disposable PHOTO fixture reseed on that reload.
  await page.addInitScript(()=>{
    const clear=Storage.prototype.clear,set=Storage.prototype.setItem;
    Storage.prototype.clear=function(){};
    Storage.prototype.setItem=function(k,v){if(k!=='readyset_identity_v1')return set.call(this,k,v)};
    document.addEventListener('DOMContentLoaded',()=>{Storage.prototype.clear=clear;Storage.prototype.setItem=set},{once:true});
  });
  await page.locator('#rofFinish').tap();
  await page.waitForLoadState('load',{timeout:12000});
  await page.waitForFunction(()=>window.ReadyIdentityV1?.isReady?.()===true,{timeout:12000});
  await page.waitForSelector('#readyParentSetupHub',{timeout:12000});

  const outcome=await page.evaluate(()=>({
    identity:ReadyIdentityV1.get(),
    role:window.ReadyRoleContextV1?.current?.(),
    hub:!!document.querySelector('#readyParentSetupHub'),
    schedule:!!document.querySelector('#readyParentSetupHub [data-rps-schedule]'),
    homework:!!document.querySelector('#readyParentSetupHub [data-rps-homework]')
  }));
  assert.equal(outcome.identity.status,'READY');
  assert.equal(outcome.identity.characterSetupState,'DEFERRED_NO_COST');
  assert.equal(outcome.identity.explorerId,'lumi');
  assert.equal(outcome.identity.journeyTheme,'TODAYS_ISLAND');
  assert.equal(outcome.role,'parent');
  assert.equal(outcome.hub,true);
  assert.equal(outcome.schedule,true);
  assert.equal(outcome.homework,true);
  assert.equal(apiCalls,0);
  assert.deepEqual(errors,[]);
  console.log('PASS: PHOTO → mood directions → no-cost character defer → Explorer → world → parent setup hub; API calls 0');
  await context.close();
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
