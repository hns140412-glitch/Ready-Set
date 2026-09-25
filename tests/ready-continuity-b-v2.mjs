import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

let now=1800000000000;
class Clock extends Date { constructor(...args){super(...(args.length?args:[now]))} static now(){return now} }
const store=new Map();
function boot(search=""){
 const listeners={},elements=new Map(),ticks=new Map();let serial=0;
 const on=(name,fn)=>(listeners[name]??=[]).push(fn);
 const element=id=>{if(!elements.has(id))elements.set(id,{dataset:{},classList:{toggle(){},contains(){return false}},addEventListener:on,before(){},appendChild(){},textContent:'',hidden:false});return elements.get(id)};
 const document={readyState:'loading',visibilityState:'visible',documentElement:{dataset:{}},head:{appendChild(){}},body:{appendChild(){}},addEventListener:on,querySelector:s=>s.includes('.controlPanel')?null:element(s),querySelectorAll:()=>[],getElementById:element,createElement:()=>element(`el${++serial}`)};
 const c={console,structuredClone,URL,URLSearchParams,Date:Clock,Math,JSON,Event:class{constructor(type){this.type=type}},document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},sessionStorage:{getItem:()=>null,removeItem(){}},location:{origin:'https://ready.test',pathname:'/',href:'https://ready.test/',search,hash:'',assign(url){c.assigned=url},reload(){throw Error('active session reloaded')}},history:{replaceState(_state,_title,url){c.cleanedUrl=url}},addEventListener:on,dispatchEvent(){},scrollTo(){},setTimeout:()=>1,clearTimeout(){},setInterval:fn=>{ticks.set(++serial,fn);return serial},clearInterval:id=>ticks.delete(id)};
 c.window=c;c.globalThis=c;vm.createContext(c);
 for(const file of ['ready-base-runtime-v1.js','ready-runtime-v07.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
 const fire=(name,event={persisted:true})=>{for(const fn of [...(listeners[name]||[])])fn(event)};
 fire('DOMContentLoaded');return{c,fire,ticks,run:code=>vm.runInContext(code,c)};
}
const today=new Clock().toLocaleDateString('sv-SE');
store.set('readyset_planner_v1',JSON.stringify({days:{[today]:{tasks:[{id:'p1',title:'English',selected:true,status:'PLANNED'}]}}}));
let h=boot(),R=h.c.ReadyBaseRuntimeV1;
R.start();const original=JSON.parse(JSON.stringify(h.c.state.activeSession));
assert.ok(original.rev07.active_lap_id,'Start establishes the canonical contract immediately');
const ids=()=>JSON.stringify([h.c.state.activeSession.id,h.c.state.activeSession.rev07.session_id,h.c.state.activeSession.rev07.goal_id,h.c.state.activeSession.rev07.active_task_id,h.c.state.activeSession.rev07.active_lap_id,h.c.state.activeSession.startAt]);
const identity=ids(),events=original.rev07.events.length;
h.c.document.visibilityState='hidden';h.fire('visibilitychange');now+=90000;
h.c.document.visibilityState='visible';h.fire('visibilitychange');assert.equal(R.times().focus,90000);assert.equal(ids(),identity);
R.start();assert.equal(ids(),identity);assert.equal(h.c.state.activeSession.rev07.events.length,events);
R.setInterruption('PAUSE',true);now+=30000;h.fire('pageshow');assert.equal(R.times().focus,90000);assert.ok(h.c.state.activeSession.pausedAt);
R.setInterruption('PAUSE',false);assert.equal(R.times().paused,30000);assert.equal(R.times().issue,0);
R.setInterruption('ISSUE',true,'help');now+=10000;R.setInterruption('SYSTEM_WAIT',true,'conversion');now+=10000;R.setInterruption('ISSUE',false);now+=10000;R.setInterruption('SYSTEM_WAIT',false);
assert.equal(R.times().focus,90000,'overlapping exclusions counted once');assert.equal(R.times().issue,20000);assert.equal(R.times().systemWait,20000);
R.nav('recording');now+=10000;R.nav('focus');assert.equal(R.times().focus,100000,'recording remains focus');
for(const app of ['hide-seek','snap-pop']){
 const before=ids();R.setInterruption('PAUSE',true);
 h.c.ReadySetRev07.launchSpecialist(app);const url=new URL(h.c.assigned),s=h.c.state.activeSession;
 assert.equal(url.searchParams.get('lap_id'),s.rev07.active_lap_id);assert.equal(url.searchParams.get('session_start_at'),String(s.startAt));assert.equal(url.searchParams.get('paused_at'),String(s.pausedAt));assert.equal(url.searchParams.get('state_owner'),'ready-set');assert.ok(url.searchParams.get('pause_intervals'));
 now+=5000;h.fire('pageshow');assert.equal(ids(),before);R.setInterruption('PAUSE',false);
}
const beforeOffline=R.times().focus;h.fire('offline');now+=20000;h.fire('online');h.fire('pageshow');assert.equal(R.times().focus,beforeOffline+20000);assert.equal(ids(),identity);
R.setInterruption('PAUSE',true);const pausedFocus=R.times().focus;
const eventCount=h.c.state.activeSession.rev07.events.length;h.fire('pagehide');now+=5000;
h=boot();R=h.c.ReadyBaseRuntimeV1;assert.equal(ids(),identity);assert.equal(h.ticks.size,1);assert.equal(h.c.state.activeSession.rev07.events.length,eventCount);
assert.equal(R.times().focus,pausedFocus);R.setInterruption('PAUSE',false);
for(let i=0;i<3;i++)h.fire('pageshow');assert.equal(h.ticks.size,1);assert.equal(h.c.state.activeSession.rev07.events.length,eventCount);
const contract=h.c.ReadySetRev07.contract(),message={origin:new URL(h.c.ReadySetRev07.routing().hide_url).origin,data:{type:'TAKY_LEARNING_EVENT',event:{type:'TASK_PARTIAL',app:'hide-seek',session_id:contract.session_id,goal_id:contract.goal_id,task_id:contract.active_task_id,lap_id:contract.active_lap_id,event_id:'return-once'}}};
h.fire('message',message);const afterReturn=h.c.state.activeSession.rev07.events.length;
h.fire('message',message);assert.equal(h.c.state.activeSession.rev07.events.length,afterReturn);assert.equal(ids(),identity);
// Malformed, stale and wrong-origin returns cannot mutate the local owner.
const validEvent=message.data.event;
for(const change of [{session_id:'stale'}, {goal_id:'stale'}, {lap_id:'stale'}, {task_id:'missing'}, {app:'unknown'}]){
 const before=JSON.stringify(h.c.state.activeSession);
 h.fire('message',{...message,data:{type:'TAKY_LEARNING_EVENT',event:{...validEvent,...change,event_id:'invalid',type:'TASK_COMPLETED'}}});
 assert.equal(JSON.stringify(h.c.state.activeSession),before);
}
const beforeSpoof=JSON.stringify(h.c.state.activeSession);
h.fire('message',{...message,data:{type:'TAKY_LEARNING_EVENT',event:{...validEvent,app:'snap-pop',type:'TASK_COMPLETED'}}});
assert.equal(JSON.stringify(h.c.state.activeSession),beforeSpoof);
// A return without a result restores the same lap and consumes its query.
for(const app of ['hide-seek','snap-pop']){
 h.c.state.activeSession.return_target='https://untrusted.invalid/';
 h.c.ReadySetRev07.launchSpecialist(app);
 const outbound=new URL(h.c.assigned);
 assert.equal(new URL(outbound.searchParams.get('return_target')).origin,'https://ready.test');
 const query=new URLSearchParams({session_id:contract.session_id,goal_id:contract.goal_id,task_id:contract.active_task_id,lap_id:contract.active_lap_id,from_app:app});
 now+=7000;h=boot('?'+query);R=h.c.ReadyBaseRuntimeV1;
 assert.equal(ids(),identity);assert.equal(h.c.cleanedUrl,'/');
 assert.equal(h.c.state.activeSession.rev07.active_app,'ready-set');
}
const local=JSON.stringify(h.c.state.activeSession);
h=boot('?session_id=stale&goal_id=stale&task_id=stale&lap_id=stale&task_state=COMPLETED&from_app=hide-seek');R=h.c.ReadyBaseRuntimeV1;
assert.equal(JSON.stringify(h.c.state.activeSession),local);
const s=h.c.state.activeSession,oldLap=s.rev07.active_lap_id;s.rev07.tasks.push({task_id:'second',label:'Math',state:'PENDING',laps:[]});h.c.ReadySetRev07.switchTask('second');
assert.notEqual(s.rev07.active_lap_id,oldLap);assert.equal(s.rev07.tasks[0].laps[0].end_reason,'TASK_CHANGE');assert.equal(s.rev07.tasks.flatMap(t=>t.laps).filter(l=>!l.ended_at).length,1);
const count=s.rev07.events.length;h.c.ReadySetRev07.switchTask('second');assert.equal(s.rev07.events.length,count);
for(const file of ['ready-planner-selection-bridge-v1.js','ready-stage-g13-authority-recovery.js','ready-base-native-v2.js'])vm.runInContext(fs.readFileSync(file,'utf8'),h.c);
assert.equal(h.c.ReadyPlannerSelectionBridgeV1.bindPlannerTask('p1',true),false);assert.equal(h.c.ReadyStageG13.syncCoreMission({id:'p1'}),false);h.c.ReadyBaseNativeV2.chooseTask('p1');assert.equal(h.c.state.activeSession,s);
// Legacy interruption aggregates survive migration without treating every pause as Issue.
h.run("state.activeSession={id:'legacy',startAt:Date.now()-100000,pausedMs:20000,issueMs:5000,pausedAt:Date.now()-10000}");
assert.equal(R.times().focus,70000);assert.equal(R.times().issue,5000);R.setInterruption('PAUSE',false);assert.equal(R.times().focus,70000);
// Execute the actual recording-save function with deterministic storage completion/failure.
const recording=fs.readFileSync('ready-focus-tools-v1.js','utf8');
vm.runInContext(recording.slice(recording.indexOf('  async function saveRecording(){'),recording.indexOf('  function bindRecordingRoundTrip(){')),h.c);
Object.assign(h.c,{currentAudio:{type:'audio/webm'},toast(){},markRecordingCompleted(){},resetRecordingUI(){},ensure(){}});
let finishSave;h.c.storeAudio=()=>new Promise(resolve=>{finishSave=resolve});
const beforeSave=R.times().focus,pendingSave=h.c.saveRecording();now+=3000;
assert.equal(R.times().focus,beforeSave);assert.equal(R.times().issue,5000);finishSave();await pendingSave;
assert.equal(h.c.state.activeSession.systemWaitState,null);
h.c.storeAudio=async()=>{throw Error('fixture failure')};await h.c.saveRecording();assert.equal(h.c.state.activeSession.systemWaitState,null);
R.setInterruption('SYSTEM_WAIT',true,'RECORDING_SAVE');now+=3000;h=boot();R=h.c.ReadyBaseRuntimeV1;
assert.equal(h.c.state.activeSession.systemWaitState,null);assert.equal(h.c.state.activeSession.recordingSaveRecovery,'INTERRUPTED_UNVERIFIED');
const recoveredFocus=R.times().focus;now+=1000;assert.equal(R.times().focus,recoveredFocus+1000,'interrupted save cannot leave Focus frozen');
console.log('PASS continuity-b-v2: background, pause/issue/system-wait, recording, Hide/Snap transport+return, task lap, offline/reconnect, BFCache event, safe restore, duplicate guards, Planner protection, legacy migration. DEVICE_UNVERIFIED: actual Safari/iOS lifecycle and external specialist consumption.');

// Execute service-worker install: an update must remain waiting for active clients.
const workerListeners={};let installed;
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
 self:{addEventListener:(name,fn)=>workerListeners[name]=fn,skipWaiting(){throw Error('forced update activation')}},
 caches:{open:async()=>({addAll:async()=>{}})}
});
workerListeners.install({waitUntil:p=>installed=p});await installed;
console.log('PASS continuity return validation and safe service-worker update');
