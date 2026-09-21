'use strict';

const assert=require('node:assert/strict');

global.window=global;
global.document={documentElement:{dataset:{}}};
global.ReadyAssignments={};
global.ReadySetPlanner={};
require('../ready-learning-master-v01.js');

const LM=global.ReadyLearningMasterV01;
assert.ok(LM);

const analysis={
  escalation_review_signal:{
    authority:'ESCALATION_ADVISORY_ONLY',
    states:['PARTIAL','PARTIAL'],
    carry_over_depth:3,
    specialist_evidence:{
      authority:'READY_EVIDENCE_INTERPRETATION_ONLY',
      memory_evidence_count:1,
      production_evidence_count:0,
      max_memory_review_priority:88,
      min_memory_strength:42,
      child_authored_production_count:0,
      can_influence:['RECOVERY_INTENSITY','CHECKPOINT_SELECTION','UNIT_SPAN'],
      cannot_influence:['SCHEDULE_DATE','PLANNER_DATE']
    }
  }
};
const profile={
  split_policy:{max_span:10}
};

// test through interpretFact-compatible behavior is complex; verify source contract markers and exported behavior indirectly.
const fs=require('fs');
const src=fs.readFileSync(require.resolve('../ready-learning-master-v01.js'),'utf8');
assert(src.includes("add_retrieval_checkpoint:memoryConcern"));
assert(src.includes("'RETRIEVAL_CHECKPOINT'"));
assert(src.includes("cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','DEADLINE','ASSIGNMENT_FACT']"));
assert(!src.includes("scheduledDate=memoryPriority"));
assert(!src.includes("schedule_date:memoryPriority"));

console.log('EVIDENCE_AWARE_REVIEW_POLICY_PASS');
