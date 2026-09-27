const assert=require('node:assert/strict');
const Intake=require('../ready-central-learning-decision-intake-v01.js');
const scope={family_id:'F',member_id:'A',subject:'english',concept_skill_target:'vocabulary'};
const receipt_scope={family_id:'F',member_id:'A'};
const context={...scope,receipt_scope};
const result={ok:true,authority:'TAKY_LEARNING_ENGINE_CORE',
 engine_runtime:'TAKY_LEARNING_ENGINE_RUNTIME_V1',scope:{member_id:'A',subject:'english',concept_skill_target:'vocabulary'},
 decision:{ok:true,authority:'LEARNING_DECISION_INTENT_ONLY',
  decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',scope:{member_id:'A',subject:'english',concept_skill_target:'vocabulary'},
  consumer_contract:{planner:'OWNS_DATED_ALLOCATION'},
  execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
  pedagogical_actions:[{intent:'RECOVERY',priority:'HIGH'}],adaptive_plan:{ok:true}},
 trace:{evidence_ids:['e1']}};
assert.equal(Intake.accept(result,context).ok,true);
assert.equal(Intake.accept(result,scope).reason,'CENTRAL_DECISION_SCOPE_MISMATCH');
assert.equal(Intake.accept(result,{...context,receipt_scope:{...receipt_scope,family_id:'other'}}).reason,'CENTRAL_DECISION_SCOPE_MISMATCH');
assert.equal(Intake.accept({...result,authority:'OBSERVATION_INGEST_RECEIPT'},context).reason,
 'CENTRAL_RUNTIME_DECISION_REQUIRED');
assert.equal(Intake.accept(result,{...context,member_id:'B'}).reason,'CENTRAL_DECISION_SCOPE_MISMATCH');
assert.equal(Intake.accept({...result,decision:{...result.decision,execution_status:'HOLD_FOR_MORE_RELIABLE_INTERPRETATION'}},context).reason,'CENTRAL_DECISION_HOLD');
assert.equal(Intake.accept({...result,decision:{...result.decision,planner_date:'2026-09-27'}},context).reason,'CENTRAL_DECISION_AUTHORITY_LEAK');
assert.equal(Intake.accept({...result,decision:{...result.decision,authority:'READY_LEARNING_ENGINE_REVIEW_POLICY'}},context).reason,'CENTRAL_RUNTIME_DECISION_REQUIRED');
console.log('READY_CENTRAL_LEARNING_DECISION_INTAKE_PASS');
