// READY-VS-003 browser flow: blank first run -> guardian -> profile -> photo (synthetic fixture) -> character no-cost defer
// -> explorer -> theme -> READY -> parent Home (VS-002) -> reload (mobile 390x844, local only).
import {launch, sleep} from '../ready-vs-001/cdp.mjs';
const base = process.argv[2] || 'http://localhost:8103/';
const out = new URL('./', import.meta.url);
const shot = (b, n) => b.shot(new URL(`first-run-${n}.png`, out));
const b = await launch({port:9343});
const log = async (label, fn) => console.log(label, JSON.stringify(await fn()));
const identity = () => b.evaluate(`(()=>{const i=JSON.parse(localStorage.getItem('readyset_identity_v1')||'null')||{};return {status:i.status,onboardingStep:i.onboardingStep,setupMode:i.setupMode,operatorRole:i.operator?.role,characterSetupState:i.characterSetupState,characterVisualId:i.characterVisualId??null,hasSourcePhoto:!!i.sourcePhoto,explorerId:i.explorerId,journeyTheme:i.journeyTheme,activeRole:localStorage.getItem('readyset_active_role_v1')}})()`);
const screen = () => b.evaluate(`(()=>{const h=document.documentElement,fr=document.getElementById('readyFirstRun'),v=e=>!!e&&e.getBoundingClientRect().height>0;return {url:location.search,boot:h.dataset.readyBootState,role:h.dataset.readyRole,classes:h.className,firstRunVisible:v(fr),firstRunHead:fr?.querySelector('.firstRunCopy span, .rof-intro .brand')?.innerText||null,firstRunTitle:fr?.querySelector('h1')?.innerText.split(String.fromCharCode(10)).join(' ')||null,coreLoaded:!!window.ReadyFoundationV1,paidCalls:(window.__vs003Paid||[]).concat(performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/character-candidates|\\/api\\/|netlify\\/functions/.test(n)))}})()`);
const parentHome = () => b.evaluate(`(()=>{const v=e=>!!e&&e.getBoundingClientRect().height>0;const hub=document.getElementById('readyParentSetupHub');return {view:document.querySelector('.view.active')?.dataset.view,firstRunPresent:!!document.getElementById('readyFirstRun'),title:document.getElementById('baseHomeTitle')?.innerText,hubVisible:v(hub),scheduleAction:v(hub?.querySelector('[data-rps-schedule]')),homeworkAction:v(hub?.querySelector('[data-rps-homework]')),childPrimary:!!document.getElementById('readyHomeworkPrimary')}})()`);
// Record any generation/API request attempt from inside the page (resource timing also checked in screen()).
const watchPaid = () => b.evaluate(`(()=>{window.__vs003Paid=[];const f=window.fetch;window.fetch=function(u,...a){const s=String(u?.url||u);if(/character-candidates|\\/api\\/|netlify\\/functions/.test(s))window.__vs003Paid.push(s);return f.call(this,u,...a)};return true})()`);
const click = sel => b.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw new Error('MISSING '+${JSON.stringify(sel)});e.click();return true})()`);
try {
  await b.goto(base);
  await b.evaluate(`localStorage.clear();sessionStorage.clear();true`);
  await b.goto(base); await sleep(2500); await watchPaid();
  await log('01_INTRO', screen); await log('01_IDENTITY', identity); await shot(b, '01-intro');

  await click('#rofIntroStart'); await sleep(700);
  await log('02_MODE', screen); await shot(b, '02-mode');
  await click('#guardianMode'); await sleep(500);
  await log('02_PROFILE', screen); await log('02_IDENTITY', identity); await shot(b, '02-guardian-profile');

  await b.evaluate(`(()=>{const r=document.getElementById('readyFirstRun'),$=s=>r.querySelector(s),set=(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))};set($('#n'),'김테스트');set($('#nn'),'별이');set($('#bd'),'2016-05-01');const sg=$('#sg');set(sg,[...sg.options].find(o=>o.value)?.value);$('#f').requestSubmit();return true})()`);
  await sleep(700);
  await log('03_PHOTO_STEP', screen); await shot(b, '03-photo-step');
  // Synthetic local photo fixture (NOT real camera evidence): canvas -> File -> real #gal change handler.
  await b.evaluate(`(async()=>{const c=document.createElement('canvas');c.width=320;c.height=400;const x=c.getContext('2d');x.fillStyle='#9bd';x.fillRect(0,0,320,400);x.fillStyle='#f2c9a0';x.beginPath();x.arc(160,170,90,0,7);x.fill();const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));const dt=new DataTransfer();dt.items.add(new File([blob],'synthetic-fixture.jpg',{type:'image/jpeg'}));const g=document.querySelector('#readyFirstRun #gal');g.files=dt.files;g.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await sleep(1500);
  await log('03_PHOTO_APPLIED', identity); await shot(b, '03-photo-applied');
  await click('#readyFirstRun #next'); await sleep(2000);
  await log('04_CHARACTER', screen); await log('04_IDENTITY', identity);
  await log('04_DEFER', () => b.evaluate(`(()=>{const d=document.getElementById('rofCharacterDefer');d?.scrollIntoView({block:'center'});return {visible:!!d&&d.getBoundingClientRect().height>0,text:d?.innerText.split(String.fromCharCode(10)).join(' / ')}})()`));
  await sleep(300); await shot(b, '04-character-defer');

  await click('#rofCharacterDefer'); await sleep(800);
  await log('05_EXPLORER', screen); await log('05_IDENTITY', identity); await shot(b, '05-explorer');
  await click('[data-guide="pico"]'); await sleep(200);
  await click('#rofExplorerNext'); await sleep(800);
  await log('06_THEME', screen); await log('06_IDENTITY', identity); await shot(b, '06-theme');
  await click('[data-theme="FOREST_TRAIL"]'); await sleep(200);
  const paidBeforeFinish = await screen();
  console.log('PAID_CALLS_BEFORE_FINISH', JSON.stringify(paidBeforeFinish.paidCalls));
  await click('#rofFinish');
  await sleep(4000);
  await log('07_PARENT_HOME_SCREEN', screen); await log('07_PARENT_HOME', parentHome); await log('07_IDENTITY', identity);
  await shot(b, '07-parent-home');

  await b.goto(b ? await b.evaluate('location.href') : base); await sleep(3500);
  await log('08_RELOAD_SCREEN', screen); await log('08_RELOAD_PARENT_HOME', parentHome); await log('08_IDENTITY', identity);
  await shot(b, '08-parent-home-reload');
  console.log('errors', JSON.stringify(b.errors));
} finally { b.close(); }
