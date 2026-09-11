// Uses an already installed Playwright (or pass its module entry path as argv[2]).
// Only the disposable QA origin is reachable; paid endpoints are always blocked.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createServer} from './visual-qa/server.mjs';
const {chromium} = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : 'playwright');
const server = createServer();
await new Promise(resolve => server.listen(4177, '127.0.0.1', resolve));
let browser;
try {
 browser = await chromium.launch({headless:true,timeout:15000,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
 for (const scenario of ['normal','quota','candidate-unavailable']) {
  const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  let apiCalls=0;
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/api/'))apiCalls++;
   if(url.origin!=='http://127.0.0.1:4177'||url.pathname.startsWith('/api/')||
      (scenario==='candidate-unavailable'&&url.pathname==='/ready-character-candidate-v1.js'))return route.abort();
   return route.continue();
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',dialog=>dialog.dismiss());
  await page.goto('http://127.0.0.1:4177/__visual/?state=onboarding-photo',{waitUntil:'load',timeout:15000});
  await page.waitForFunction(()=>window.ReadyIdentityV1&&document.documentElement.dataset.readyStageLoader);
  // Exercise the real FileReader -> Image -> canvas -> identity -> preview path.
  await page.locator('#gal').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>!document.querySelector('#readyFirstRun #next')?.disabled);
  const photo=await page.evaluate(()=>ReadyIdentityV1.get().sourcePhoto);
  assert.match(photo,/^data:image\/jpeg/);
  assert.ok((await page.locator('.photoPreview').getAttribute('style')).includes(photo));
  // Recovery between touch start and click must preserve the actual event target.
  await page.evaluate(()=>{
   window.originalNext=document.querySelector('#readyFirstRun #next');
   window.dispatchEvent(new Event('focus'));
   window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await page.evaluate(()=>originalNext===document.querySelector('#readyFirstRun #next')),true);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).position),'static');
  // Simulate a storage failure AFTER the successful upload; no re-upload needed.
  if(scenario==='quota')await page.evaluate(()=>{
   window.originalSetItem=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k==='readyset_identity_v1')throw new DOMException('full','QuotaExceededError');return originalSetItem.call(this,k,v)};
  });
  await page.evaluate(()=>{
   window.transitionEvents=0;
   window.addEventListener('ready-character-consultation',()=>transitionEvents++);
   document.documentElement.classList.add('worldFirstPaint','identityFirstPaint');
   const overlay=document.querySelector('#worldJourneyOverlay');if(overlay)overlay.hidden=false;
  });
  await page.locator('#readyFirstRun #next').tap();
  await page.waitForSelector('#readyCharacterCandidateMount .ccConsult',{timeout:12000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'CHARACTER');
  assert.equal(await page.evaluate(()=>transitionEvents),1);
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().sourcePhoto),photo);
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('worldFirstPaint')),false);
  assert.equal(await page.locator('#readyFirstRun #next').count(),0);
  // Re-running boot scripts must not add observers/listeners or replace the DOM.
  await page.addScriptTag({url:'/ready-onboarding-identity-v1.js'});
  await page.addScriptTag({url:'/ready-stage-c.js'});
  if(scenario!=='candidate-unavailable')await page.addScriptTag({url:'/ready-character-candidate-v1.js'});
  await page.evaluate(()=>{
   window.originalMount=document.querySelector('#readyCharacterCandidateMount');
   window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   window.dispatchEvent(new Event('focus'));
  });
  assert.equal(await page.evaluate(()=>originalMount===document.querySelector('#readyCharacterCandidateMount')),true);
  if(scenario!=='candidate-unavailable'){
   for(const key of ['EXCITED','COZY','IMAGINING'])await page.locator('[data-mood-tile="'+key+'"]').tap();
   assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().characterMoodDirections.selections.length),3);
   await page.locator('[data-candidate-action="generate"]').tap();
   for(const width of [320,390,430]){await page.setViewportSize({width,height:844});const measurements=await page.locator('#readyCharacterCandidateMount').evaluate(el=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...el.querySelectorAll('button')].some(b=>{const r=b.getBoundingClientRect();return r.width<44||r.height<44})}));assert.equal(measurements.overflow,false);assert.equal(measurements.small,false);}
  }else assert.equal(await page.locator('[data-fallback-handoff]').count(),1);
  assert.equal(apiCalls,0);
  if(scenario==='quota')await page.evaluate(()=>{Storage.prototype.setItem=originalSetItem;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('readyset_identity_v1')).onboardingStep),'CHARACTER');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('readyset_identity_v1')).sourcePhoto),photo);
  // A fresh document, unlike BFCache, restores persisted consultation and identity.
  await page.addInitScript(()=>{ /* Keep fixture setup from reseeding on reload. */
   const saved=localStorage.getItem('readyset_identity_v1');
   if(saved){const clear=Storage.prototype.clear,set=Storage.prototype.setItem;Storage.prototype.clear=function(){};
    Storage.prototype.setItem=function(k,v){if(k!=='readyset_identity_v1')set.call(this,k,v)};
    document.addEventListener('DOMContentLoaded',()=>{Storage.prototype.clear=clear;Storage.prototype.setItem=set},{once:true});}
  });
  await page.reload({waitUntil:'load'});
  await page.waitForSelector('#readyCharacterCandidateMount .ccConsult',{timeout:12000});
  await page.locator('#readyFirstRun #back').tap();
  assert.ok((await page.locator('.photoPreview').getAttribute('style')).includes(photo));
  await page.locator('#readyFirstRun #next').click();
  await page.waitForSelector('#readyCharacterCandidateMount .ccConsult');
  assert.equal(apiCalls,0);
  assert.deepEqual(errors,[]);
  console.log(`PASS ${scenario}: upload, tap ownership, recovery target, CHARACTER render, consultation, approval lock, reload, PHOTO preview`);
  await context.close();
 }
} finally {
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
