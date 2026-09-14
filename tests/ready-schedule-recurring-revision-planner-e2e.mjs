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
  documentElement:{dataset:{readyRole:'PARENT'}},body:{},
  querySelector:()=>null,getElementById:()=>null,
  createElement:()=>({innerHTML:'',querySelector:()=>null,append:noop,prepend:noop,remove:noop,showModal:noop,close:noop})
};
class MutationObserver{constructor(cb){this.cb=cb} observe(){} disconnect(){}}
class Event{constructor(type){this.type=type}}
class CustomEvent extends Event{constructor(type,init={}){super(type);this.detail=init.detail}}
const context={console,structuredClone,URL,URLSearchParams,Date,Math,JSON,setTimeout:(fn)=>{fn();return 1},clearTimeout:noop,localStorage,document,location:{search:'?role=parent',href:'https://ready.test/?role=parent'},history:{replaceState:noop},MutationObserver,Event,CustomEvent,dispatchEvent:noop,addEventListener:noop};
context.window=context;context.globalThis=context;context.ReadyRoleContextV1={current:()=> 'parent'};
vm.createContext(context);
vm.runInContext(foundationSrc,context,{filename:'ready-foundation-v1.js'});
vm.runInContext(controlSrc,context,{filename:'ready-foundation-control-v1.js'});
const C=context.ReadyFoundationControlV1;
assert.ok(C,'foundation control must initialize');

const today=new Date().toLocaleDateString('sv-SE');
const plus=n=>{const d=new Date(`${today}T12:00:00`);d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')};
const wd=d=>new Date(`${d}T12:00:00`).getDay();
const yesterday=plus(-1), tomorrow=plus(1), deadline=plus(2);

C.saveProfile({
  id:'confirmed-study-opportunities',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,provenance:{source:'PARENT_CONFIRMED_CAPACITY'},
  events:[
    {id:'study-tomorrow',key:'study-tomorrow',title:'내일 학습 가능',weekday:wd(tomorrow),start:'13:00',end:'14:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'},
    {id:'study-deadline',key:'study-deadline',title:'마감일 학습 가능',weekday:wd(deadline),start:'13:00',end:'14:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'}
  ]
});
C.saveProfile({
  id:'academy-recurring',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,provenance:{source:'PARENT_INPUT'},
  events:[{id:'academy',key:'academy',title:'기존 정기 학원',weekday:wd(today),start:'16:00',end:'18:00',kind:'FIXED',parent_editable:true,planner_movable:false,source:'LOCAL'}]
});

localStorage.setItem('readyset_planner_v1',JSON.stringify({days:{[yesterday]:{localDate:yesterday,tasks:[{id:'past-completed',localDate:yesterday,title:'어제 완료',status:'COMPLETED',selected:true,learningReports:[{done:true}]}]}},assignmentFacts:{},assignmentPackages:{},progressEvents:[]}));
const pastBefore=JSON.parse(localStorage.getItem('readyset_planner_v1')).days[yesterday].tasks[0];

for(const [action,payload] of [
  ['ADD',{id:'fact-revision',path:'MANUAL',fact:{id:'fact-revision',title:'과학 숙제',subject:'과학',volume:'워크북',deadline,required:true,teacherInstruction:'',source:'MANUAL'}}],
  ['ANALYZE',{}],['RESULT',{retakeIds:[]}],
  ['COMMIT',{reviewed:true,facts:[{id:'fact-revision',title:'과학 숙제',subject:'과학',volume:'워크북',deadline,required:true,teacherInstruction:'',source:'MANUAL'}]}]
]) C.capture(action,payload);

let planner=JSON.parse(localStorage.getItem('readyset_planner_v1'));
let projected=Object.values(planner.days).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.sourceAssignmentId==='fact-revision');
assert.equal(projected.length,1,'confirmed homework must enter planner');
assert.equal(projected[0].localDate,tomorrow,'before recurring revision, earliest confirmed opportunity should win');

C.saveProfile({
  id:'academy-recurring',revision:1,state:'ACTIVE',effective_from:tomorrow,effective_to:null,provenance:{source:'PARENT_INPUT'},
  events:[{id:'academy',key:'academy',title:'변경된 정기 학원',weekday:wd(tomorrow),start:'12:30',end:'14:30',kind:'FIXED',parent_editable:true,planner_movable:false,source:'LOCAL'}]
});

const state=C.load();
const revisions=state.profiles.filter(p=>p.id==='academy-recurring').sort((a,b)=>a.revision-b.revision);
assert.equal(revisions.length,2,'recurring change must create a new profile revision');
assert.equal(revisions[0].revision,1);
assert.equal(revisions[0].effective_from,today);
assert.equal(revisions[0].effective_to,tomorrow,'previous revision must close at new effective date');
assert.equal(revisions[1].revision,2);
assert.equal(revisions[1].effective_from,tomorrow);
assert.equal(revisions[1].events[0].title,'변경된 정기 학원');

planner=JSON.parse(localStorage.getItem('readyset_planner_v1'));
projected=Object.values(planner.days).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.sourceAssignmentId==='fact-revision');
assert.equal(projected.length,1,'planner must keep one future projection after recurring revision');
assert.equal(projected[0].localDate,deadline,'new recurring fixed event must reproject future work');
assert.deepEqual(planner.days[yesterday].tasks[0],pastBefore,'past completed actual must remain unchanged');

const todayEffective=context.ReadyFoundationV1.effective(state,today);
const tomorrowEffective=context.ReadyFoundationV1.effective(state,tomorrow);
assert.ok(todayEffective.events.some(e=>e.title==='기존 정기 학원'),'historical effective date must retain old recurring revision');
assert.ok(tomorrowEffective.events.some(e=>e.title==='변경된 정기 학원'),'new effective date must use revised recurring schedule');

console.log(JSON.stringify({pass:true,contract:'ready-schedule-recurring-revision-planner-e2e-v1',revisioned:true,oldHistoryPreserved:true,reprojectedFrom:tomorrow,reprojectedTo:deadline}));
