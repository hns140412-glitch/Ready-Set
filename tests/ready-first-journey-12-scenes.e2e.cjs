'use strict';
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');
const {spawn}=require('node:child_process'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const host='D:/Git PWA/TAKY/ENFORCEMENT/family_qa_local_static_host.cjs';
const port=48871;
(async()=>{
 const srv=spawn(process.execPath,[host,root,String(port)],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 let browser;
 try{
  await new Promise((resolve,reject)=>{srv.stdout.on('data',d=>{if(String(d).includes('READY'))resolve()});srv.once('exit',()=>reject(Error('host terminated')));setTimeout(()=>reject(Error('host startup timeout')),10000)});
  browser=await chromium.launch({headless:true,channel:'chrome',timeout:20000});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  let externalRequests=0;await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin==='http://127.0.0.1:'+port&&!u.pathname.startsWith('/api/'))return route.continue();externalRequests++;return route.abort()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  const shot=(s)=>page.screenshot({path:path.join(os.tmpdir(),'READY_JOURNEY_'+s+'.png'),fullPage:false});
  const wait=(step)=>page.waitForFunction(s=>window.ReadyIdentityV1?.get?.().onboardingStep===s,step,{timeout:12000});
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'load',timeout:20000});
  await page.waitForSelector('#rofIntroStart',{timeout:10000});await shot('01_INTRO');
  await page.locator('#rofIntroStart').click();
  await page.waitForSelector('#guardianMode',{timeout:10000});await page.locator('#guardianMode').click();
  // 2026-10-17 first-journey owner adds TEAM_NAME before first Core6 encounter.
  await wait('TEAM_NAME');
  await page.waitForSelector('#rfjTeamName',{timeout:12000});
  if(!(await page.locator('#rfjNext').isDisabled()))throw Error('EMPTY_TEAM_NAME_CAN_ADVANCE');
  await page.locator('#rfjTeamName').fill('테스트탐험대');
  await page.locator('#rfjNext').click();
  await wait('EXPLORER');await page.waitForSelector('#rcConfirmEncounter',{timeout:12000});await shot('02_CORE6');
  if(!(await page.locator('#rcConfirmEncounter').isDisabled()))throw Error('FIRST_MEET_PREMATURE_COMPLETE');
  for(const id of ['dubi','lori','ink','nova','take','zero'])await page.locator('[data-rc-crew="'+id+'"]').click();
  await page.locator('[data-rc-crew="dubi"]').click();
  await page.waitForFunction(()=>!document.querySelector('#rcConfirmEncounter')?.disabled,{timeout:10000});
  await page.locator('#rcConfirmEncounter').click();await wait('MAIN_INTRO_CHOICE');
  await page.waitForSelector('[data-rfj-primary="nova"]');await shot('03_CREW');
  if(!(await page.locator('#rfjNext').isDisabled()))throw Error('FIRST_MAIN_NOT_EXPLICITLY_SELECTED');
  for(const width of [320,390,430]){
    await page.setViewportSize({width,height:844});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('INTRO_HORIZONTAL_OVERFLOW_'+width);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-rfj-primary="nova"]').click();
  const selection=await page.evaluate(()=>({
    selected:Array.from(document.querySelectorAll('[data-rfj-primary][aria-pressed="true"]')).map(x=>x.dataset.rfjPrimary),
    enabled:!document.querySelector('#rfjNext')?.disabled,
    obsoleteFiveSixVisible:!!document.querySelector('[data-rfj-crew]')
  }));
  if(!selection.enabled||selection.selected.join(',')!=='nova'||selection.obsoleteFiveSixVisible)
    throw Error('ONE_MAIN_PREFERENCE_CONTRACT_BROKEN '+JSON.stringify(selection));
  await page.locator('#rfjNext').click();await wait('PROFILE');
  await page.locator('#n').fill('브라우저테스트');
  await page.locator('#nn').fill('별');
  await page.locator('#bd').fill('2016-05-12');
  await page.locator('#sg').selectOption('E4');
  await page.locator('#f button').click();
  await wait('PHOTO');
  await page.locator('#gal').setInputFiles({name:'qa.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>!document.querySelector('#readyFirstRun #next')?.disabled,{timeout:12000});
  await page.locator('#readyFirstRun #next').click();
  await wait('CHARACTER');
  await page.waitForSelector('#rcDeferCharacter',{timeout:12000});await page.locator('#rcDeferCharacter').click();
  await wait('PACK_BAG');
  await page.waitForSelector('[data-rfj-step="PACK_BAG"]');await shot('05_PACK');
  await page.locator('[data-rfj-gear="map"]').click();await page.locator('[data-rfj-gear="compass"]').click();await page.locator('#rfjNext').click();
  await wait('DEPARTURE');await shot('06_DEPARTURE');
  await page.locator('[data-rfj-route="SAIL"]').click();await page.locator('#rfjNext').click();
  await wait('ISLAND_FIRST_SIGHT');await page.locator('#rfjNext').click();
  await wait('ISLAND_NAME');await shot('08_NAME_ISLAND');
  if(!(await page.locator('#rfjNext').isDisabled()))throw Error('ISLAND_NAME_EMPTY_CAN_ADVANCE');
  await page.reload({waitUntil:'load',timeout:20000});
  await wait('ISLAND_NAME');await page.waitForSelector('[data-rfj-step="ISLAND_NAME"]',{timeout:12000});
  await page.locator('#rfjIslandName').fill('테스트별빛섬');await page.locator('#rfjNext').click();
  await wait('BASECAMP_DISCOVERY');await page.locator('#rfjNext').click();
  await wait('BASECAMP_NAME');
  if(!(await page.locator('#rfjNext').isDisabled()))throw Error('BASECAMP_NAME_EMPTY_CAN_ADVANCE');
  await page.locator('#rfjBasecampName').fill('테스트캠프');await page.locator('#rfjNext').click();
  await wait('BASECAMP_ARRIVAL');await shot('11_ARRIVAL');
  const before=await page.evaluate(()=>ReadyIdentityV1.get());
  const integrity={crew:before.explorerId==='nova',
   abandonedLegacyGroup:!Array.isArray(before.selectedCrewIds)||before.selectedCrewIds.length===0,
   preferredIsSingle:before.introPreferredCrewId==='nova' && typeof before.introPreferredCrewId==='string',
   notOfficialMain:!before.main_character_id && !before.mainCharacterId,
   packed:(before.packedItems||[]).length===2,
   departure:before.departureMode==='SAIL',island:before.islandName==='테스트별빛섬',
   basecamp:before.basecampName==='테스트캠프',identityIsNotReady:before.status!=='READY'};
  await page.locator('#rfjNext').click();
  await page.waitForFunction(()=>ReadyIdentityV1?.get?.().status==='READY',{timeout:17000});
  await page.waitForSelector('#readyParentSetupHub',{timeout:17000});
  const after=await page.evaluate(()=>({record:ReadyIdentityV1.get(),parentHub:!!document.querySelector('#readyParentSetupHub'),
   schedule:!!document.querySelector('#readyParentSetupHub [data-rps-schedule]'),
   homework:!!document.querySelector('#readyParentSetupHub [data-rps-homework]'),
   overflow:document.documentElement.scrollWidth>innerWidth}));
  const passed=Object.values(integrity).every(Boolean)&&after.record.islandName==='테스트별빛섬'
    &&after.record.basecampName==='테스트캠프'&&after.record.departureMode==='SAIL'
    &&after.parentHub&&after.schedule&&after.homework&&!after.overflow&&errors.length===0;
  console.log(JSON.stringify({passed,integrity,after:{role:after.record.setupMode,status:after.record.status,
    stage:after.record.onboardingStep,basecamp:after.record.basecampName,island:after.record.islandName,
    schedule:after.schedule,homework:after.homework,overflow:after.overflow},
    errors,externalRequests},null,2));
  await context.close();if(!passed)process.exitCode=3;
 }finally{await browser?.close().catch(()=>{});srv.kill()}
})().catch(e=>{console.error(e.stack);process.exitCode=2});
