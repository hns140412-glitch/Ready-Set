'use strict';
const assert=require('node:assert/strict');
const Intake=require('../ready-central-learning-decision-intake-v01.js');
const Bridge=require('../ready-central-intent-to-planner-v01.js');
const Planner=require('../ready-planner-v01.js');
const coreScope={member_id:'CHILD_A',subject:'math',concept_skill_target:'g5-math-equivalent-fraction-reasoning'};
const receipt_scope={family_id:'F1',member_id:'CHILD_A'};
const context={family_id:'F1',member_id:'CHILD_A',subject:'math',concept_skill_target:'g5-math-equivalent-fraction-reasoning',receipt_scope};
const ref='taky:governed-activity:ICE3383177-G5-MATH-EQUIVALENT-FRACTIONS-CANDIDATE@sha256:1521a3da5baae4b174d4ed2714f5ca421b28aa02eba6154ae935abde64f21501';
const runtime={ok:true,authority:'TAKY_LEARNING_ENGINE_CORE',
 engine_runtime:'TAKY_LEARNING_ENGINE_RUNTIME_V1',scope:coreScope,
 decision:{ok:true,authority:'LEARNING_DECISION_INTENT_ONLY',
  decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',scope:coreScope,
  consumer_contract:{planner:'OWNS_DATED_ALLOCATION'},
  execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
  pedagogical_actions:[{intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH'}],
  adaptive_plan:{ok:true,authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
   adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',scope:coreScope,
   unit_span_policy:'KEEP',add_checkpoint:true,add_retrieval_checkpoint:true,
   assistance_policy:'UNCHANGED',target_learning_ids:[]}},
 trace:{verified_receipt_id:'real-evidence:r1',verified_evidence_count:3,
  basis_kind:'VERIFIED_ONLY',evidence_ids:['e1','e2','e3'],
  governed_activity_refs:[ref],governed_activity_policy_ids:['P-F07-READY']}};
const intent=Intake.accept(runtime,context);
assert.equal(intent.ok,true,JSON.stringify(intent));
const values=new Map();
const planner=Planner.createPlanner({getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)});
planner.upsertDailyAvailabilityWindow({date:'2026-09-30',start:'16:00',end:'17:00',confirmed:true,source:'PARENT_CONFIRMED'});
const session={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
const planned=Bridge.planAccepted(intent,planner,{activeSession:session,candidate_dates:['2026-09-30']});
assert.equal(planned.ok,true,JSON.stringify(planned));
assert.equal(planned.scheduled,true);
assert.equal(planned.todo.provenance.schedule_authority,'READY_SET_PLANNER');
assert.deepEqual(planned.todo.provenance.governed_activity_refs,[ref]);
assert.deepEqual(planned.todo.provenance.governed_activity_policy_ids,['P-F07-READY']);
assert.equal(planned.todo.provenance.governed_activity_refs_key,JSON.stringify([ref]));
const replay=Bridge.planAccepted(intent,planner,{activeSession:session,candidate_dates:[]});
assert.equal(replay.ok,true);
assert.equal(replay.reused,true);
assert.equal(planner.snapshot().dated_todos.length,1);
const changed={...intent,trace:{...intent.trace,
 governed_activity_refs:['taky:governed-activity:OTHER@sha256:'+'1'.repeat(64)]}};
const conflict=Bridge.planAccepted(changed,planner,{activeSession:session,candidate_dates:['2026-09-30']});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'CENTRAL_CHECKPOINT_REPLAY_CONFLICT');
assert.equal(planner.snapshot().dated_todos.length,1);
const missingPolicy=Intake.accept({...runtime,trace:{...runtime.trace,
 governed_activity_policy_ids:[]}},context);
assert.equal(missingPolicy.ok,false);
assert.equal(missingPolicy.reason,'CENTRAL_GOVERNED_ACTIVITY_REFERENCE_INVALID');
const duplicateRef=Intake.accept({...runtime,trace:{...runtime.trace,
 governed_activity_refs:[ref,ref]}},context);
assert.equal(duplicateRef.ok,false);
assert.equal(duplicateRef.reason,'CENTRAL_GOVERNED_ACTIVITY_REFERENCE_INVALID');
console.log('READY_GOVERNED_ACTIVITY_REF_PASS: authenticated F07 ref preserved to Planner provenance; replay stable; changed/malformed refs fail closed');