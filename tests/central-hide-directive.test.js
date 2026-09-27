'use strict';
const assert=require('node:assert/strict');
const Planner=require('../ready-planner-v01.js');
const ToPlanner=require('../ready-central-intent-to-planner-v01.js');
const Directive=require('../ready-central-hide-directive-v01.js');
const values=new Map();
const planner=Planner.createPlanner({getItem:k=>values.get(k)||null,
 setItem:(k,v)=>values.set(k,v)});
const scope={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
const core={member_id:'CHILD_A',subject:'english',concept_skill_target:'vocabulary'};
const digest='a'.repeat(64);
const intent={ok:true,authority:'CENTRAL_PEDAGOGICAL_INTENT_ONLY',scope:core,
 receipt_scope:{family_id:'F1',member_id:'CHILD_A'},
 actions:[{intent:'RETRIEVAL_CHECKPOINT',basis:['HIDE_MEMORY_ADVISORY_ONLY']}],
 adaptive_plan:{ok:true,authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
 adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',scope:core,add_checkpoint:true,
 add_retrieval_checkpoint:true,unit_span_policy:'REDUCE',assistance_policy:'FADE_GRADUALLY',
 target_learning_ids:['word-a','word-b','word-a']},
 trace:{verified_receipt_id:null,verified_evidence_count:0,basis_kind:'OBSERVATION_ADVISORY_ONLY',
 observation_review_evidence_count:1,observation_review_evidence_ids:['obs1'],
 observation_review_digest_sha256:digest}};
planner.upsertDailyAvailabilityWindow({date:'2026-09-30',start:'16:00',
 end:'17:00',source:'PARENT_CONFIRMED',confirmed:true});
const scheduled=ToPlanner.planAccepted(intent,planner,{activeSession:scope,candidate_dates:['2026-09-30']});
assert.equal(scheduled.ok,true,JSON.stringify(scheduled));
const directive=Directive.forPlannerTodo(scheduled.todo,'task-1',
 {boundScope:{family_id:'F1',member_id:'CHILD_A'}});
assert.deepEqual(directive.lexicalIds,['word-a','word-b']);
assert.equal(directive.authority,'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE');
assert.equal(directive.reviewPolicyOwner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(directive.scheduleOwner,'READY_SET_PLANNER');
assert.equal(directive.observationIsVerifiedProof,false);
assert.equal(directive.directiveId,'central-hide:'+scheduled.todo.todo_id);
assert.equal(directive.taskId,'task-1');
assert.equal(Directive.forPlannerTodo(scheduled.todo,'task-1',
 {boundScope:{family_id:'F1',member_id:'CHILD_B'}}),null);
assert.equal(Directive.forPlannerTodo(scheduled.todo,'task-1',{}),null);
assert.equal(Directive.forPlannerTodo({...scheduled.todo,
 review_policy:{...scheduled.todo.review_policy,authority:'READY_LEARNING_ENGINE'}},'task-1',
 {boundScope:{family_id:'F1',member_id:'CHILD_A'}}),null);
assert.equal(Directive.forPlannerTodo({...scheduled.todo,provenance:{
 ...scheduled.todo.provenance,target_learning_ids:[]}},'task-1',
 {boundScope:{family_id:'F1',member_id:'CHILD_A'}}),null);
const result={
 resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',taskState:'COMPLETED',
 learningPhase:'COMPLETE',taskContext:{task_id:'task-1'},
 reviewDirective:directive,reviewedLexicalIds:['word-b','word-a'],
 memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
  prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',scopedItemIds:['w-b','w-a']},
 trailSummary:{scopeItemIds:['w-a','w-b'],totalWordCount:2}
};
assert.equal(Directive.validateResult(directive,result),true);
assert.equal(Directive.validateResult(directive,{...result,reviewedLexicalIds:['word-b']}),false);
assert.equal(Directive.validateResult(directive,{...result,taskState:'PARTIAL'}),false);
const partial={...result,taskState:'PARTIAL',learningPhase:'FIRST_FIND'};
assert.equal(Directive.validateProgress(directive,partial),true);
assert.equal(Directive.validateProgress(directive,{...partial,reviewedLexicalIds:['word-b']}),false);
assert.equal(Directive.validateProgress(directive,{...partial,taskContext:{task_id:'wrong-task'}}),false);
assert.equal(Directive.validateProgress(directive,{...partial,learningPhase:'COMPLETE'}),false);
assert.equal(Directive.validateProgress(directive,result),false);

assert.equal(Directive.validateResult(directive,{...result,taskContext:{task_id:'other-task'}}),false);
assert.equal(Directive.validateResult(directive,{...result,reviewDirective:{
 ...directive,directiveId:'old-different-task'}}),false);
assert.equal(Directive.validateResult(directive,{...result,memorySummary:{
 ...result.memorySummary,scopedItemIds:['w-a','w-c']}}),false);
assert.equal(Directive.validateResult(directive,{...result,trailSummary:{
 ...result.trailSummary,totalWordCount:3}}),false);
const runtime=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(runtime.includes('window.ReadyCentralHideDirectiveV01?.forPlannerTodo?.('));
assert(runtime.includes("if(task?.central_checkpoint&&"));
assert(runtime.includes('validateProgress?.('));
console.log('READY_CENTRAL_HIDE_DIRECTIVE_PASS: actual Planner lexical targets become child-scoped V2 directive, missing targets do not fall back');
