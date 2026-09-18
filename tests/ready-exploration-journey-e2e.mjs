import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-proxy-server','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({permissions:['microphone'],acceptDownloads:true});
const page=await context.newPage();
const hardStop=setTimeout(()=>{console.error('E2E HARD TIMEOUT');process.exit(124)},120000);
const step=name=>console.log('E2E STEP',name);
const bounded=(name,fn,ms=12000)=>Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>setTimeout(()=>reject(new Error(`E2E_TIMEOUT:${name}`)),ms))]);
page.setDefaultTimeout(8000);
page.setDefaultNavigationTimeout(10000);
try {
page.on('console',msg=>{if(msg.type()==='error')console.error('BROWSER',msg.text())});
page.on('pageerror',err=>console.error('PAGEERROR',err.message));

const today=new Date().toLocaleDateString('sv-SE');
const seedState={
  role:'child',
  identity:{
    status:'READY',legalName:'테스트',nickname:'탐험가',familyRole:'CHILD',birthDate:'2015-01-01',
    schoolStage:'ELEMENTARY_5',characterVisualId:'e2e',characterSetupState:'COMPLETE',explorerId:'lumi',
    journeyTheme:'default',setupMode:'SELF'
  },
  core:{
    schemaVersion:5,profile:{name:'테스트',photo:'',style:'editorial',shareAvatar:false},
    guide:{type:'lumi',name:'루미',voice:'warm'},selected:[],tasks:[],targetMin:null,sound:'끄기',records:[],activeSession:null
  },
  planner:{
    version:1,days:{[today]:{localDate:today,tasks:[{
      id:'e2e-recording-task',localDate:today,subject:'영어',title:'영어 · 문장 녹음',volume:'문장 1개',
      status:'PLANNED',selected:false,required:true,confirmationState:'FACT_CONFIRMED'
    }]}}
  }
};

step('seed origin');
await bounded('seed-origin',()=>page.goto('http://127.0.0.1:4173/VERSION.json',{waitUntil:'domcontentloaded',timeout:10000}));
await page.evaluate(seed=>{
  localStorage.setItem('readyset_active_role_v1',seed.role);
  localStorage.setItem('readyset_identity_v1',JSON.stringify(seed.identity));
  localStorage.setItem('readyset_state',JSON.stringify(seed.core));
  localStorage.setItem('readyset_planner_v1',JSON.stringify(seed.planner));
},seedState);


step('open');
const appHtml=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/<script src="\.\/ready-stage-c\.js\?v=[^"]+"><\/script>/,'');
await bounded('set-content',()=>page.setContent(appHtml,{waitUntil:'domcontentloaded',timeout:15000}),18000);
await page.evaluate(()=>{try{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'canShare',{value:undefined,configurable:true})}catch{}});
const manualChain=[
  'ready-role-context-v1.js',
  'ready-foundation-v1.js',
  'ready-foundation-control-v1.js',
  'ready-stage-d.js',
  'ready-recording-v1.js',
  'ready-stage-e.js',
  'ready-stage-f.js',
  'ready-parent-capture-intake-v1.js',
  'ready-homework-analysis-bridge-v1.js',
  'ready-stage-g1-fix.js',
  'ready-stage-g13-authority-recovery.js',
  'ready-stage-g14-planner-authority.js',
  'ready-base-native-v2.js',
  'ready-planner-selection-bridge-v1.js',
  'ready-schedule-base-v1.js',
  'ready-parent-setup-hub-v1.js',
  'ready-base-selftest-v1.js'
];
for(const file of manualChain){
  step('load '+file);
  await bounded('load:'+file,()=>page.addScriptTag({url:'http://127.0.0.1:4173/'+file}),8000);
  step('loaded '+file);
}
await page.waitForFunction(()=>window.ReadyBaseNativeV2&&window.ReadyBaseRuntimeV1&&window.ReadyScheduleBaseV1&&window.ReadyRecordingV1,{timeout:15000});

step('select timetable task');
await page.evaluate(()=>{const original=window.ReadyBaseNativeV2.chooseTask;const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}'),d=p.days?.[new Date().toLocaleDateString('sv-SE')],t=d?.tasks?.find(x=>String(x.id)==='e2e-recording-task');if(!t)return false;d.tasks=d.tasks.map(x=>({...x,selected:String(x.id)==='e2e-recording-task'}));localStorage.setItem('readyset_planner_v1',JSON.stringify(p));const core=JSON.parse(localStorage.getItem('readyset_state')||'{}');core.g13PlannerTask={id:t.id,date:new Date().toLocaleDateString('sv-SE'),status:t.status||'PLANNED',confirmationState:t.confirmationState||null};core.tasks=[[t.title,t.volume].filter(Boolean).join(' · ')];core.selected=[];localStorage.setItem('readyset_state',JSON.stringify(core));window.ReadyBaseRuntimeV1.nav('mission');return typeof original==='function'});
await page.waitForFunction(()=>window.ReadyBaseRuntimeV1&&document.querySelector('#missionView.active'),{timeout:15000});

step('start timer');
await page.click('button[data-minutes="10"]');
await page.click('#startBtn');
await page.waitForSelector('#focusView.active',{timeout:10000});

assert.equal((await page.locator('#focusView .focusTitle h1').innerText()).replace(/\s+/g,' ').trim(),'그냥! 지금 하면 돼!');
assert.equal(await page.locator('#focusView .clockHero .clockNumber').count(),12);
assert.equal(await page.locator('#focusView .clockBrand').innerText(),'Ready & Set');
assert.equal(await page.locator('#focusView .timeStrip>div:last-child small').innerText(),'목표 시간');
assert.notEqual(await page.locator('#remainingTime').innerText(),'--:--');

const sec=t=>{const m=String(t).match(/(\d+):(\d+)/);return m?Number(m[1])*60+Number(m[2]):0};
await page.waitForTimeout(1200);
const beforePause=sec(await page.locator('#focusElapsed').innerText());
await page.click('#pauseBtn');
await page.waitForTimeout(1400);
const duringPause=sec(await page.locator('#focusElapsed').innerText());
assert.ok(Math.abs(duringPause-beforePause)<=1,'focus time must freeze while explicitly paused');
assert.ok(sec(await page.locator('#issueElapsed').innerText())>=1,'issue time must grow during explicit pause');
await page.click('#pauseBtn');
await page.waitForTimeout(1200);
assert.ok(sec(await page.locator('#focusElapsed').innerText())>=beforePause+1,'focus time must resume');

step('recording');
await page.waitForSelector('#recBtn:not([hidden])',{timeout:5000});
const focusBeforeRecording=sec(await page.locator('#focusElapsed').innerText());
await page.click('#recBtn');
await page.waitForSelector('#recordingView.active',{timeout:5000});
await page.click('#recordAction');
await page.waitForFunction(()=>document.querySelector('#recordState')?.textContent==='RECORDING',{timeout:5000});
await page.waitForTimeout(1300);
await page.click('#recordAction');
await page.waitForFunction(()=>!document.querySelector('#reviewPanel')?.hidden,{timeout:8000});
assert.match(await page.locator('#formatNote').innerText(),/원본/);
assert.ok((await page.locator('#audioPreview').getAttribute('src'))?.startsWith('blob:'),'recording preview must be a real blob');

const stored=await page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('readyset_audio',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const rows=await new Promise((resolve,reject)=>{const tx=db.transaction('audio','readonly'),r=tx.objectStore('audio').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  db.close();return rows;
});
assert.ok(stored.some(x=>x.kind==='ORIGINAL'&&x.blob?.size>0),'original recording must be persisted before confirmation');

await page.click('#saveRecordingBtn');
await page.click('#recordBackBtn');
await page.waitForSelector('#focusView.active',{timeout:5000});
await page.waitForTimeout(500);
const focusAfterRecording=sec(await page.locator('#focusElapsed').innerText());
assert.ok(focusAfterRecording>=focusBeforeRecording+1,'timer must continue through recording round trip');

step('wrap up');
await page.click('#completeBtn');
await page.waitForFunction(()=>document.querySelector('#readyRev07Wrap')&&!document.querySelector('#readyRev07Wrap').hidden,{timeout:5000});
await page.click('[data-wrap-state="COMPLETED"]');
await page.click('#rev07ConfirmEnd');
await page.waitForSelector('#resultView.active',{timeout:5000});
assert.match(await page.locator('#resultTasks').innerText(),/완료/);

step('share fallback');
const downloadPromise=page.waitForEvent('download',{timeout:10000});
await page.click('#shareResultBtn');
const download=await downloadPromise;
assert.match(download.suggestedFilename(),/^ready-set-report-.*\.png$/);

const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('readyset_state')||'{}'));
assert.equal(state.activeSession,null);
assert.equal(state.records?.[0]?.status,'COMPLETED');

step('done');
console.log(JSON.stringify({
  pass:true,
  contract:'ready-exploration-journey-browser-e2e',
  checks:{
    confirmedTimer:true,pauseResume:true,recordingRoundTrip:true,originalAudioPersisted:true,
    completionTruth:true,imageShareFallback:true
  }
}));
} finally {
  clearTimeout(hardStop);
  await Promise.race([browser.close().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,5000))]);
}
