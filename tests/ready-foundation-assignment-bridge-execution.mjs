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
assert.ok(context.ReadyFoundationV1,'foundation API must initialize');

const today=new Date().toLocaleDateString('sv-SE');
const plus=(n)=>{const d=new Date(`${today}T12:00:00`);d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')};
const boundary=plus(3);

context.ReadyAssignmentModel={
  upsertTalentPackage(args={}){
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{},"assignmentFacts":{}}');
    p.days=p.days||{};p.assignmentFacts=p.assignmentFacts||{};
    p.assignmentFacts['talent_math']={assignmentId:'talent_math',sourceType:'TALENT_BOOK_ASSIGNMENT',subject:'재능',talentSubject:'수학',range:args.books?.find?.(b=>b.subject==='수학')?.range||'10~15쪽',deadlineBoundary:boundary,confirmationState:'FACT_CONFIRMED',lifecycle:'ACTIVE'};
    localStorage.setItem('readyset_planner_v1',JSON.stringify(p));
    return {packageId:'pkg',allocation:{ok:false,reason:'FOUNDATION_INTERPRETATION_REQUIRED'}};
  },
  upsertEnglishPackage(){return {allocation:{ok:false,reason:'FOUNDATION_INTERPRETATION_REQUIRED'}}},
  confirmFact(){return {confirmationState:'FACT_CONFIRMED'}}
};

vm.runInContext(controlSrc,context,{filename:'ready-foundation-control-v1.js'});
const C=context.ReadyFoundationControlV1;
assert.ok(C,'foundation control must initialize');
assert.equal(context.ReadyAssignmentModel.__foundationPlannerBridge,true,'assignment model must be wrapped by Foundation bridge');

const first=context.ReadyAssignmentModel.upsertTalentPackage({actor:'PARENT',books:[{subject:'수학',range:'10~15쪽'}]});
assert.equal(first.allocation.authority,'FOUNDATION_PLANNER');
assert.equal(first.allocation.ok,false,'no explicit study opportunity must not allocate');
assert.equal(first.foundationPlan.reason,'NO_CONFIRMED_OPPORTUNITY');
assert.equal(C.assignmentFacts()[0].deadline,plus(2),'cycle boundary day must be excluded from normal allocation');

C.saveProfile({
  id:'confirmed-study-window',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,
  provenance:{source:'TEST'},
  events:[{id:'study',key:'study:'+new Date(`${today}T12:00:00`).getDay(),title:'확인된 학습 가능 구간',weekday:new Date(`${today}T12:00:00`).getDay(),start:'13:00',end:'14:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'}]
});

const state=C.load();
const latest=state.plans.at(-1);
assert.ok(latest?.candidates?.length>0,'adding explicit study opportunity must re-run Planner and create candidate');
const planner=JSON.parse(localStorage.getItem('readyset_planner_v1'));
const tasks=Object.values(planner.days||{}).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.projection==='TODAY_TASK');
assert.ok(tasks.length>0,'Foundation candidate must publish as governed TODAY_TASK projection');
assert.equal(tasks[0].sourceAssignmentId,'talent_math');
assert.ok(tasks[0].localDate<=plus(2),'task must stay before cycle boundary');

console.log(JSON.stringify({pass:true,contract:'ready-foundation-assignment-bridge-execution-v1',firstReason:first.foundationPlan.reason,replannedCandidates:latest.candidates.length,publishedTasks:tasks.length,boundary,planningDeadline:plus(2)}));
