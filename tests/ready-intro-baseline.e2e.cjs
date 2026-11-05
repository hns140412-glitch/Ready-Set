'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=48902;
(async()=>{
const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 await new Promise((ok,err)=>{let done=false;srv.stdout.on('data',x=>{if(!done&&String(x).includes('READY')){done=true;ok()}});srv.once('exit',()=>err(Error('server exited')));setTimeout(()=>err(Error('timeout')),8000)});
 browser=await chromium.launch({headless:true,channel:'chrome',timeout:20000});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin==='http://127.0.0.1:'+port&&!u.pathname.startsWith('/api/'))return route.continue();return route.abort()});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load',timeout:20000});
 await page.waitForTimeout(1700);
 const before=await page.evaluate(()=>({intro:!!document.querySelector('#rofIntroStart'),firstRun:!!document.querySelector('#readyFirstRun'),steps:ReadyIdentityV1?.get?.().onboardingStep,bodyText:document.body.innerText.slice(0,480),visibility:getComputedStyle(document.getElementById('readyFirstRun')||document.body).visibility,viewportOverflow:document.documentElement.scrollWidth>innerWidth}));
 const file=path.join(os.tmpdir(),'READY_INTRO_BEFORE_20261017.png');await page.screenshot({path:file,fullPage:false});
 if(before.intro) await page.locator('#rofIntroStart').click();await page.waitForTimeout(500);
 const after=await page.evaluate(()=>({step:ReadyIdentityV1?.get?.().onboardingStep,mode:!!document.querySelector('#guardianMode'),bodyText:document.body.innerText.slice(0,340)}));
 console.log(JSON.stringify({before,after,errors,screenshot:file}));
 await context.close();
}finally{await browser?.close().catch(()=>{});srv.kill();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
