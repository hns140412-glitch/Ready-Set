import {pathToFileURL} from 'node:url';
import {createServer} from './visual-qa/server.mjs';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const server=createServer();
await new Promise(r=>server.listen(4177,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.argv[3],timeout:15000});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!=='http://127.0.0.1:4177'||u.pathname.startsWith('/api/'))return route.abort();return route.continue();});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  page.on('dialog',d=>d.dismiss());
  await page.goto('http://127.0.0.1:4177/__visual/?state=onboarding-photo',{waitUntil:'load',timeout:15000});
  await page.waitForFunction(()=>window.ReadyIdentityV1&&document.documentElement.dataset.readyStageLoader);
  await page.locator('#gal').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>!document.querySelector('#readyFirstRun #next')?.disabled);
  await page.locator('#readyFirstRun #next').tap();
  await page.waitForTimeout(1200);
  const snap=await page.evaluate(()=>{const m=document.querySelector('#readyCharacterCandidateMount'),i=window.ReadyIdentityV1?.get?.()||{};return{
    step:i.onboardingStep||null,
    sourcePhoto:!!i.sourcePhoto,
    moodUi:!!window.ReadyMoodDirectionV2UI,
    moodApi:!!window.ReadyMoodDirectionV2,
    candidate:!!window.ReadyCharacterCandidateV1,
    onboardingCompletion:!!window.ReadyOnboardingFlowCompletionV1,
    stageLoader:document.documentElement.dataset.readyStageLoader||null,
    bootState:document.documentElement.dataset.readyBootState||null,
    root:!!document.querySelector('#readyFirstRun'),
    mount:!!m,
    candidateUi:m?.dataset?.candidateUi||null,
    hasTaky:!!m?.querySelector('.takyConsult'),
    hasCc:!!m?.querySelector('.ccConsult'),
    html:m?.innerHTML?.slice(0,1600)||null
  }});
  console.log('CHARACTER_DIAG='+JSON.stringify({snap,errors}));
  if(snap.step!=='CHARACTER')process.exitCode=2;
  await context.close();
}finally{
  await browser?.close();
  await new Promise(r=>server.close(r));
}
