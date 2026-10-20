'use strict';
// Real Ready Base runtime in isolated memory: activity completion != learning mastery.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../ready-base-runtime-v1.js'),'utf8');
const day=new Date().toLocaleDateString('sv-SE');
const initial={days:{[day]:{tasks:[{id:'PLANNER-X1',title:'Vocabulary practice',status:'IN_PROGRESS',selected:true}]}}};
const store=new Map([['readyset_planner_v1',JSON.stringify(initial)]]);
const localStorage={
 getItem:k=>store.has(k)?store.get(k):null,
 setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k)
};
const noop=()=>{};
class Event{constructor(type){this.type=type}}
const document={
 readyState:'loading',documentElement:{dataset:{}},
 addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[]
};
const context={console,structuredClone,localStorage,document,location:{search:'',href:'https://ready.test/'},
 Date,JSON,Math,URL,URLSearchParams,Event,
 setTimeout:noop,clearTimeout:noop,setInterval:noop,clearInterval:noop,
 addEventListener:noop,dispatchEvent:noop};
context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'ready-base-runtime-v1.js'});
const published=context.ReadyBaseRuntimeV1.publishPlannerResult(
 'PLANNER-X1','COMPLETED',
 {sessionId:'SCOPE-1',source:'snap-pop',focusMs:60000,
  verified_outcome:1,promotion_authorized:true});
assert(published?.task);
const saved=JSON.parse(localStorage.getItem('readyset_planner_v1'));
const task=saved.days[day].tasks[0];
assert.equal(task.status,'COMPLETED','task activity completion stays compatible');
assert.equal(task.learningReports.length,1);
const report=task.learningReports[0];
assert.equal(report.resultState,'COMPLETED');
assert.equal(report.source,'snap-pop');
assert.equal(report.learningVerification,'NOT_VERIFIED_BY_LEARNING_ENGINE');
assert.equal(report.evidenceScope,'SESSION_ACTIVITY_ONLY');
assert.equal(report.verified_outcome,undefined);
assert.equal(report.promotion_authorized,undefined);
assert.equal(task.learningProgress.unit,'SESSION_RESULT');
assert.equal(task.learningProgress.evidenceScope,'ACTIVITY_QUANTITY_NOT_MASTERY');
assert.equal(task.learningProgress.masteryVerified,undefined);
context.ReadyBaseRuntimeV1.publishPlannerResult('PLANNER-X1','COMPLETED',
 {sessionId:'SCOPE-1',source:'snap-pop'});
assert.equal(JSON.parse(localStorage.getItem('readyset_planner_v1')).days[day].tasks[0].learningReports.length,1,
 'duplicate activity receipt must not become a second learning evidence event');
// Exercise the real private taskLabel function without exporting test hooks in production.
const homeworkSource=fs.readFileSync(path.join(__dirname,'../ready-home-homework-mvp-v1.js'),'utf8');
const instrumented=homeworkSource.replace(/\}\)\(\);\s*$/,'window.__qaTaskLabel=taskLabel;\n})();');
assert.notEqual(instrumented,homeworkSource);
vm.runInContext(instrumented,context,{filename:'ready-home-homework-mvp-v1.js'});
const display=context.__qaTaskLabel;
assert.equal(display({title:'Homework',learningProgress:task.learningProgress}),'Homework',
 'session activity completion must not appear as measured 0% remaining');
assert.equal(display({title:'Homework',learningProgress:{unit:'PERCENT_OF_PLAN',remainingQuantity:40}}),
 'Homework · 40% 남음','real manually measured plan quantity stays visible');
assert.equal(display({title:'Homework',learningProgress:{unit:'PERCENT_OF_PLAN',remainingQuantity:'0'}}),
 'Homework','malformed quantity does not become a proven number');
console.log(JSON.stringify({contract:'READY_ACTIVITY_NOT_MASTERY_LOCAL_RUNTIME_V1',
 activityCompleted:true,masteryVerified:false,forgedVerificationIgnored:true,
 progressScope:'ACTIVITY_QUANTITY_NOT_MASTERY',duplicateReportBlocked:true}));
