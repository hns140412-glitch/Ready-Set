'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process'),path=require('node:path');
const host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const root=path.resolve(__dirname,'..'),port=48962;
(async()=>{
const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 await new Promise((r,j)=>{srv.stdout.on('data',x=>String(x).includes('READY')&&r());srv.on('exit',()=>j(Error('host exited')));setTimeout(()=>j(Error('host timeout')),9000)});
 browser=await chromium.launch({headless:true,channel:'chrome',timeout:15000});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'allow'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load'});
 await page.waitForFunction(()=>!!window.ReadyIdentityV1,{timeout:15000});
 await page.evaluate(()=>ReadyIdentityV1.patch({onboardingStep:'ISLAND_NAME',setupMode:'GUARDIAN_FOR_CHILD',
   operator:{role:'GUARDIAN',name:'QA'},familyRole:'CHILD',legalName:'QA',nickname:'QA',
   birthDate:'2015-03-03',schoolStage:'E4',characterSetupState:'DEFERRED_NO_COST',
   introSeenCrewIds:['dubi','lori','ink','nova','take','zero'],explorerId:'dubi',
   introPreferredCrewId:'dubi',selectedCrewIds:['dubi','lori','ink','nova','take'],
   journeyTheme:'TODAYS_ISLAND',packedItems:['map'],departureMode:'SAIL',
   status:'FIRST_JOURNEY_IN_PROGRESS'}));
 await page.reload({waitUntil:'load'});
 await page.waitForSelector('[data-rfj-step="ISLAND_NAME"]',{timeout:15000});
 let before;
 for(let i=0;i<45;i++){
   before=await page.evaluate(async()=>({
     registered:!!(await navigator.serviceWorker.getRegistration()),
     installing:(await navigator.serviceWorker.getRegistration())?.installing?.state,
     active:(await navigator.serviceWorker.getRegistration())?.active?.state,
     waiting:(await navigator.serviceWorker.getRegistration())?.waiting?.state,
     controlled:!!navigator.serviceWorker.controller,
     introCached:!!(await caches.match('./ready-first-journey-scenes-v1.js')),
     htmlCached:!!(await caches.match('./index.html')),
     crewCached:!!(await caches.match('./characters/ui_cutouts/dubi.png')),
     keys:await caches.keys()
   }));
   if(before.controlled&&before.introCached&&before.htmlCached&&before.crewCached)break;
   await page.waitForTimeout(500);
 }
 if(!before.controlled||!before.introCached||!before.htmlCached||!before.crewCached)
   throw Error('SW_PRECACHE_NOT_ACTIVATED '+JSON.stringify(before));
 const readyAt=await page.evaluate(async()=>({registered:!!(await navigator.serviceWorker.getRegistration()),
   controlled:!!navigator.serviceWorker.controller,
   introCached:!!(await caches.match('./ready-first-journey-scenes-v1.js')),
   htmlCached:!!(await caches.match('./index.html')),
   keys:await caches.keys(),
   scope:(await navigator.serviceWorker.getRegistration())?.scope,
   controllerUrl:navigator.serviceWorker.controller?.scriptURL,
   crewCached:!!(await caches.match('./characters/ui_cutouts/dubi.png'))}));
 await ctx.setOffline(true);
 const networkProbe=await page.evaluate(async()=>{
   try{const r=await fetch('./index.html');return {ok:r.ok,status:r.status}}
   catch(e){return {ok:false,error:String(e)}}
 });
 console.log('OFFLINE_DEBUG',JSON.stringify({before,networkProbe}));
 await page.reload({waitUntil:'load',timeout:16000});
 await page.waitForSelector('[data-rfj-step="ISLAND_NAME"]',{timeout:12000});
 await page.locator('#rfjIslandName').fill('오프라인테스트섬');await page.locator('#rfjNext').click();
 await page.waitForSelector('[data-rfj-step="BASECAMP_DISCOVERY"]',{timeout:12000});
 const after=await page.evaluate(()=>({step:ReadyIdentityV1.get().onboardingStep,
   name:ReadyIdentityV1.get().islandName,overflow:document.documentElement.scrollWidth>innerWidth}));
 const passed=before.registered&&before.controlled&&before.introCached&&before.crewCached
     &&after.step==='BASECAMP_DISCOVERY'&&after.name==='오프라인테스트섬'
     &&!after.overflow&&errors.length===0;
 console.log(JSON.stringify({passed,before,after,errors},null,2));
 await ctx.close();if(!passed)process.exitCode=3;
}finally{await browser?.close().catch(()=>{});srv.kill()}
})().catch(e=>{console.error(e.stack);process.exitCode=2});
