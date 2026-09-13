import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const foundationSrc=fs.readFileSync('ready-foundation-v1.js','utf8');
const assignmentSrc=fs.readFileSync('ready-stage-e.js','utf8');
const controlSrc=fs.readFileSync('ready-foundation-control-v1.js','utf8');

const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const noop=()=>{};
const document={
  documentElement:{dataset:{readyRole:'PARENT'}},body:{},querySelector:()=>null,getElementById:()=>null,
  createElement:()=>({innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[],append:noop,prepend:noop,remove:noop,showModal:noop,close:noop})
};
class MutationObserver{observe(){} disconnect(){}}
class Event{constructor(type){this.type=type}}
class CustomEvent extends Event{constructor(type,init={}){super(type);this.detail=init.detail}}
const context={console,structuredClone,URL,URLSearchParams,Date,Math,JSON,localStorage,document,location:{search:'?role=parent',href:'https://ready.test/?role=parent'},history:{replaceState:noop},MutationObserver,Event,CustomEvent,dispatchEvent:noop,addEventListener:noop,setTimeout:(fn)=>{fn();return 1},clearTimeout:noop};
context.window=context;context.globalThis=context;context.ReadyRoleContextV1={current:()=> 'parent'};
vm.createContext(context);
vm.runInContext(foundationSrc,context,{filename:'ready-foundation-v1.js'});
vm.runInContext(assignmentSrc,context,{filename:'ready-stage-e.js'});
vm.runInContext(controlSrc,context,{filename:'ready-foundation-control-v1.js'});

const C=context.ReadyFoundationControlV1,A=context.ReadyAssignmentModel;
assert.ok(C&&A&&A.__foundationPlannerBridge,'assignment model must be bridged to Foundation Planner');
const today=new Date().toLocaleDateString('sv-SE');
const weekdays=[0,1,2,3,4,5,6];
C.saveProfile({id:'confirmed-study-capacity',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,provenance:{source:'PARENT_CONFIRMED_CAPACITY'},events:weekdays.map(w=>({id:`study-${w}`,key:`study-${w}`,title:'확인된 학습 가능',weekday:w,start:'13:00',end:'14:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'}))});

const books=[{subject:'수학',range:'10~12쪽',teacherInstruction:'틀린 문제 표시'}];
const candidate=A.upsertTalentPackage({actor:'CHILD',books});
let planner=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');
let fact=planner.assignmentFacts?.[candidate.package.factIds.find(id=>id.includes('수학'))];
assert.ok(fact,'captured candidate fact must exist');
assert.notEqual(fact.confirmationState,'FACT_CONFIRMED','child/analysis candidate must not self-confirm');
let projections=Object.values(planner.days||{}).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.sourceAssignmentId===fact.assignmentId);
assert.equal(projections.length,0,'unconfirmed candidate must not enter Foundation Planner');

const confirmed=A.upsertTalentPackage({actor:'PARENT',books});
planner=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');
fact=planner.assignmentFacts?.[confirmed.package.factIds.find(id=>id.includes('수학'))];
assert.equal(fact.confirmationState,'FACT_CONFIRMED','explicit parent action must confirm the fact');
projections=Object.values(planner.days||{}).flatMap(d=>d.tasks||[]).filter(t=>t.authority==='PLANNER/MAIN'&&t.sourceAssignmentId===fact.assignmentId);
assert.ok(projections.length>0,'parent-confirmed fact must enter Foundation Planner');
assert.ok(projections.every(t=>t.localDate>=today),'confirmed homework must only publish prospectively');

console.log(JSON.stringify({pass:true,contract:'ready-homework-parent-confirm-planner-e2e-v1',candidateBlocked:true,parentConfirmed:true,plannerPublished:projections.length}));
