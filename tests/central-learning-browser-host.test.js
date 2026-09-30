'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const Planner=require('../ready-planner-v01.js');
const src=fs.readFileSync(path.join(__dirname,'../ready-central-learning-roundtrip-v01.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
assert(app.includes('central_scope:centralPlannerScope()'));
assert(app.includes('function plannerSnapshot()'));
const window={};
const scope={authenticated:true,family_id:'F1',selected_member_id:'A'};
const events=new Map();
class CustomEvent{constructor(type,{detail}={}){this.type=type;this.detail=detail}}
const target={addEventListener:(key,cb)=>events.set(key,cb),
 removeEventListener:(key,cb)=>{if(events.get(key)===cb)events.delete(key)},
 dispatchEvent:event=>{events.get(event.type)?.(event);return true}};
const sandbox={window,module:{exports:{}},CustomEvent,
 require:p=>require(path.join(__dirname,'..',p))};
sandbox.globalThis=sandbox;
vm.runInNewContext(src,sandbox,{timeout:2000});
const api=sandbox.module.exports;
(async()=>{
 const done=new Promise(resolve=>{
  target.addEventListener('readyset-central-roundtrip-result',e=>resolve(e.detail));
 });
 const host=api.installBrowserHost({eventTarget:target,
  roundtrip:{run:async args=>{
   assert.equal(args.outcomes[0].task_id,'task-A');
   return {ok:true,scheduled:true,stage:'READY_EXECUTION_READY'};
  }},
  resolveRecordOptions:rec=>({session_id:rec.session_id}),
  activeScopeProvider:()=>scope
 });
 assert.equal(window.ReadyCentralLearningHost,host);
 assert.deepEqual({...host.activeScope()},scope);
 const storage=new Map();
 const planner=Planner.createPlanner({getItem:k=>storage.get(k)||null,
  setItem:(k,v)=>storage.set(k,v)});
 planner.upsertDatedTodo({date:'2026-09-30',label:'Central A',
  source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
  provenance:{family_id:'F1',member_id:'A'},state:'PLANNED'});
 const b=planner.upsertDatedTodo({date:'2026-09-30',label:'Central B',
  source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
  provenance:{family_id:'F1',member_id:'B'},state:'PLANNED'});
 assert.equal(planner.todayProjection('2026-09-30',{central_scope:host.activeScope()}).length,1);
 scope.selected_member_id='B';
 assert.equal(planner.todayProjection('2026-09-30',{central_scope:host.activeScope()})[0].todo_id,b.todo_id);
 scope.authenticated=false;
 assert.equal(host.activeScope(),null);
 assert.equal(planner.todayProjection('2026-09-30',{central_scope:host.activeScope()}).length,0);
 scope.authenticated=true;scope.selected_member_id='A';
 events.get('readyset-learning-outcomes-ready')({detail:{
  session_id:'session-A',task_outcomes:[{task_id:'task-A'}]}});
 const delivered=await done;
 assert.equal(delivered.session_id,'session-A');
 assert.equal(delivered.result.ok,true);
 host.detach();
 assert.equal(window.ReadyCentralLearningHost,undefined);
 assert.equal(events.has('readyset-learning-outcomes-ready'),false);
 console.log('READY_CENTRAL_BROWSER_HOST_PASS: opt-in host, scoped child switching, real completion dispatch and detachable listener');
})().catch(e=>{console.error(e);process.exitCode=1});
