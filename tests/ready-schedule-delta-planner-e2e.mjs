import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const foundationSrc=fs.readFileSync('ready-foundation-v1.js','utf8');
const controlSrc=fs.readFileSync('ready-foundation-control-v1.js','utf8');

const store=new Map();
const localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
const noop=()=>{};
const document={
  documentElement:{dataset:{readyRole:'PARENT'}},
  body:{},
  querySelector:()=>null,
  getElementById:()=>null,
  createElement:()=>({innerHTML:'',querySelector:()=>null,append:noop,prepend:noop,remove:noop,showModal:noop,close:noop})
};
class MutationObserver{constructor(cb){this.cb=cb} observe(){} disconnect(){}}
class Event{constructor(type){this.type=type}}
class CustomEvent extends Event{constructor(type,init={}){super(type);this.detail=init.detail}}

const context={
  console, structuredClone, URL, URLSearchParams, Date, Math, JSON,
  setTimeout:(fn)=>{fn();return 1}, clearTimeout:noop,
  localStorage, document, location:{search:'?role=parent',href:'https://ready.test/?role=parent'},
  history:{replaceState:noop}, MutationObserver, Event, CustomEvent,
  dispatchEvent:noop, addEventListener:noop
};
context.window=context; context.globalThis=context;
context.ReadyRoleContextV1={current:()=> 'parent'};

vm.createContext(context);
vm.runInContext(foundationSrc,context,{filename:'ready-foundation-v1.js'});
vm.runInContext(controlSrc,context,{filename:'ready-foundation-control-v1.js'});
const C=context.ReadyFoundationControlV1;
assert.ok(C,'foundation control must initialize');

const today=new Date().toLocaleDateString('sv-SE');
const plus=n=>{const d=new Date(`${today}T12:00:00`);d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')};
const wd=d=>new Date(`${d}T12:00:00`).getDay();
const yesterday=plus(-1), tomorrow=plus(1), deadline=plus(2);

const baseline={
  capturedAt:`${today}T00:00:00+09:00`,
  rows:[{weekday:['일','월','화','수','목','금','토'][wd(today)],activity:'기본 학원',start:'16:00',end:'18:00'}]
};
C.importBaseline(baseline);
const afterBaseline=C.load();
const baselineSnapshot=JSON.stringify(afterBaseline.profiles);
assert.equal(afterBaseline.profiles.length,1,'baseline must import once');
assert.equal(afterBaseline.profiles[0].provenance.source,'NOTION_SNAPSHOT');

C.saveProfile({
  id:'confirmed-study-opportunities',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,
  provenance:{source:'PARENT_CONFIRMED_CAPACITY'},
  events:[
    {id:'study-today',key:'study-today',title:'오늘 학습 가능',weekday:wd(today),start:'13:00',end:'14:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'},
    {id:'study-tomorrow',key:'study-tomorrow',title:'내일 학습 가능',weekday:wd(tomorrow),start:'13:00',end:'14:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'}
  ]
});

localStorage.setItem('readyset_planner_v1',JSON.stringify({
  days:{[yesterday]:{localDate:yesterday,tasks:[{id:'past-completed',localDate:yesterday,title:'어제 완료',status:'COMPLETED',selected:true,learningReports:[{done:true}]}]}},
  assignmentFacts:{},assignmentPackages:{},progressEvents:[]
}));
const pastBefore=JSON.parse(localStorage.getItem('readyset_planner_v1')).days[yesterday].tasks[0];

for(const [action,payload] of [
  ['ADD',{id:'fact-delta',path:'MANUAL',fact:{id:'fact-delta',title:'수학 숙제',subject:'수학',volume:'10~12쪽',deadline,required:true,teacherInstruction:'',source:'MANUAL'}}],
  ['ANALYZE',{}],
  ['RESULT',{retakeIds:[]}],
  ['COMMIT',{reviewed:true,facts:[{id:'fact-delta',title:'수학 숙제',subject:'수학',volume:'10~12쪽',deadline,required:true,teacherInstruction:'',source:'MANUAL'}]}]
]) C.capture(action,payload);

let planner=JSON.parse(localStorage.getItem('readyset_planner_v1'));
let projected=Object.values(planner.days).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.sourceAssignmentId==='fact-delta');
assert.equal(projected.length,1,'confirmed homework must enter planner');
assert.equal(projected[0].localDate,today,'before schedule change, today opportunity should win');

C.saveOverride({
  id:'delta-block-today',key:'delta-block-today',date:today,
  event:{id:'delta-block-today',key:'delta-block-today',title:'오늘만 변동 일정',start:'12:30',end:'14:30',kind:'FIXED',parent_editable:true,planner_movable:false,source:'LOCAL'}
});

const afterDelta=C.load();
assert.equal(JSON.stringify(afterDelta.profiles),baselineSnapshot.replace(/\]$/,','+JSON.stringify(afterBaseline.profiles[0]).slice(1,-1)+']').replace(',,',','), '');

planner=JSON.parse(localStorage.getItem('readyset_planner_v1'));
projected=Object.values(planner.days).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.sourceAssignmentId==='fact-delta');
assert.equal(projected.length,1,'planner must keep one projection after delta');
assert.equal(projected[0].localDate,tomorrow,'one-day blocking delta must move only future planner candidate');
assert.deepEqual(planner.days[yesterday].tasks[0],pastBefore,'past completed actual must remain unchanged');

const baselineProfiles=afterDelta.profiles.filter(p=>p.provenance?.source==='NOTION_SNAPSHOT');
assert.equal(baselineProfiles.length,1,'baseline authority must not be overwritten');
assert.equal(baselineProfiles[0].events[0].title,'기본 학원');
assert.ok(afterDelta.overrides.some(o=>o.id==='delta-block-today'),'schedule change must be stored as delta override');

console.log(JSON.stringify({pass:true,contract:'ready-schedule-delta-planner-e2e-v1',before:today,after:tomorrow,pastPreserved:true,baselinePreserved:true,deltaStored:true}));
