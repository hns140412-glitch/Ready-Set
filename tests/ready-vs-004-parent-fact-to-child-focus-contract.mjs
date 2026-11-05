// READY-VS-004 contract: parent English FACT -> FACT_CONFIRMED -> Foundation/Planner dated TODAY_TASK -> child-startable task.
// Real Stage-E assignment model + Foundation bridge in a VM; browser evidence lives in artifacts/ready-vs-004/.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
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
let role='parent';
const context={console,structuredClone,URL,URLSearchParams,Date,Math,JSON,localStorage,document,location:{search:'?role=parent',href:'https://ready.test/?role=parent'},history:{replaceState:noop},MutationObserver,Event,CustomEvent,dispatchEvent:noop,addEventListener:noop,setTimeout:(fn)=>{fn();return 1},clearTimeout:noop};
context.window=context;context.globalThis=context;context.ReadyRoleContextV1={current:()=>role};
vm.createContext(context);
vm.runInContext(read('ready-foundation-v1.js'),context,{filename:'ready-foundation-v1.js'});
vm.runInContext(read('ready-stage-e.js'),context,{filename:'ready-stage-e.js'});
vm.runInContext(read('ready-foundation-control-v1.js'),context,{filename:'ready-foundation-control-v1.js'});
const C=context.ReadyFoundationControlV1,A=context.ReadyAssignmentModel;
assert.ok(C&&A&&A.__foundationPlannerBridge,'English FACT save must go through the Foundation/Planner bridge');

const today=new Date().toLocaleDateString('sv-SE');
const plus=n=>{const d=new Date(`${today}T12:00:00`);d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')};
const weekday=new Date(`${today}T12:00:00`).getDay();
const planner=()=>JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');
const allTasks=()=>Object.entries(planner().days||{}).flatMap(([d,x])=>(x.tasks||[]).map(t=>({...t,_day:d})));
const todayTasks=()=>planner().days?.[today]?.tasks||[];
const englishFact=()=>Object.values(planner().assignmentFacts||{}).find(f=>f.sourceType==='ENGLISH_ACADEMY_PACKAGE');
const englishInput={actor:'PARENT',workbookName:'Fixture Reader',range:'p.32~35',nextAcademy:plus(2),prints:{},components:{},teacherInstruction:''};

// 1. Child-entered range is a candidate only: no FACT_CONFIRMED, no Planner projection.
role='child';
A.upsertEnglishPackage({actor:'CHILD',range:'p.32~35'});
assert.notEqual(englishFact().confirmationState,'FACT_CONFIRMED','child input must not self-confirm the English FACT');
assert.equal(allTasks().length,0,'unconfirmed English input must not produce any dated task');
assert.throws(()=>C.saveProfile({id:'child-attempt',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,provenance:{source:'CHILD'},events:[]}),/PARENT_ROLE_REQUIRED/,'child role must not edit schedule authority');

// 2. Parent confirms the FACT, but no explicit STUDY_OPPORTUNITY exists: missing timetable rows are not free time.
role='parent';
const first=A.upsertEnglishPackage(englishInput);
const fact=englishFact();
assert.equal(fact.confirmationState,'FACT_CONFIRMED','explicit parent save must produce FACT_CONFIRMED');
assert.equal(fact.deadlineBoundary,plus(2),'next academy date is the cycle boundary');
assert.equal(first.allocation.authority,'FOUNDATION_PLANNER');
assert.equal(first.allocation.ok,false,'no explicit study opportunity must not allocate');
assert.equal(first.foundationPlan.reason,'NO_CONFIRMED_OPPORTUNITY');
assert.equal(allTasks().length,0,'no dated task without explicit STUDY_OPPORTUNITY evidence');

// 3. Parent adds an explicit STUDY_OPPORTUNITY through the same control API the schedule editor uses -> Planner projects today.
C.saveProfile({id:'local_vs004',revision:1,state:'ACTIVE',effective_from:today,effective_to:null,provenance:{source:'PARENT_INPUT'},events:[{id:'event_vs004',key:`집 공부:${weekday}`,title:'집 공부 시간',subject:'영어',weekday,start:'16:00',end:'17:00',kind:'STUDY_OPPORTUNITY',parent_editable:true,planner_movable:false,source:'LOCAL'}]});
// The bridge re-plans on FACT save; re-save the same FACT exactly as the Stage-F button does.
const second=A.upsertEnglishPackage(englishInput);
assert.equal(second.allocation.ok,true,'confirmed FACT + explicit opportunity must allocate');
let tasks=todayTasks();
assert.equal(tasks.length,1,'one workbook unit -> exactly one TODAY_TASK today');
const task=tasks[0];
assert.equal(task.projection,'TODAY_TASK');
assert.equal(task.authority,'PLANNER/MAIN');
assert.equal(task.localDate,today);
assert.equal(task.sourceAssignmentId,fact.assignmentId);
assert.equal(task.sourceUnitId,`foundation-unit:${fact.assignmentId}:workbook`);
assert.equal(task.id,`foundation:${task.sourceUnitId}`,'stable projection id derived from source unit');
assert.equal(task.deadline,plus(1),'cycle boundary day is excluded from normal allocation');
assert.equal(task.sessionWriter,'READY','Ready owns session/lap execution');

// 4. FACT and dated task are different entities.
assert.notEqual(task.id,fact.assignmentId);
assert.equal(task.confirmationState,undefined,'dated task must not carry FACT confirmation state');
assert.ok(!('estimatedMin' in task),'parent does not assign today\'s study amount');
assert.equal(englishFact().assignmentId,fact.assignmentId,'re-save keeps the same FACT');
assert.equal(Object.values(planner().assignmentFacts).filter(f=>f.sourceType==='ENGLISH_ACADEMY_PACKAGE'&&f.lifecycle==='ACTIVE').length,1,'no duplicate English FACT');

// 5. Child-startable shape (VS-001 Home reads PLANNED, unselected tasks for today).
assert.equal(task.status,'PLANNED');
assert.equal(task.selected,false);

// 6. Reconcile/render/reload re-plans must not duplicate.
for(let i=0;i<3;i++)C.prepareConfirmedFacts();
A.upsertEnglishPackage(englishInput);
tasks=allTasks();
assert.equal(tasks.length,1,'repeated reconcile must not duplicate the Planner task');
assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);

// 7. After the child starts (session runtime marks IN_PROGRESS), re-planning keeps the actual row and adds nothing.
const p=planner();p.days[today].tasks[0].status='IN_PROGRESS';localStorage.setItem('readyset_planner_v1',JSON.stringify(p));
C.prepareConfirmedFacts();A.upsertEnglishPackage(englishInput);
tasks=allTasks();
assert.equal(tasks.length,1,'started task must not be duplicated by re-plan');
assert.equal(tasks[0].status,'IN_PROGRESS','started task status is preserved');

// 8. Static role/feedback boundaries on the production UI path.
const hub=read('ready-parent-setup-hub-v1.js'),stageF=read('ready-stage-f.js');
assert.match(hub,/switchRole\?\.\(currentRole==='parent'\?'child':'parent',\{reload:true\}\)/,'existing role switch flips parent/child with reload');
assert.doesNotMatch(hub,/data-quick-start/,'parent hub has no child execution shortcut');
for(const [name,src] of [['ready-parent-setup-hub-v1.js',hub],['ready-stage-f.js',stageF]]){
  assert.match(src,/typeof window\.toast==='function'/,`${name}: #toast element via named access must not be called as a function`);
}
assert.match(stageF,/model\(\)\.upsertEnglishPackage\(\{actor:'PARENT'/,'Stage-F English save uses the bridged assignment model');

console.log(JSON.stringify({pass:true,contract:'ready-vs-004-parent-fact-to-child-focus-v1',factConfirmed:true,noOpportunityBlocked:true,todayTasks:1,noDuplicate:true,startedPreserved:true}));
