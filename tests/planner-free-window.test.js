const assert=require('assert');
const {createPlanner}=require('../ready-planner-v01.js');

function memoryStorage(){
  const map=new Map();
  return {
    getItem:k=>map.has(k)?map.get(k):null,
    setItem:(k,v)=>map.set(k,String(v)),
    removeItem:k=>map.delete(k)
  };
}

const planner=createPlanner(memoryStorage());
planner.upsertScheduleCommitment({
  commitment_id:'academy-day-1',
  title:'영어학원',
  category:'ACADEMY',
  start_at:'2026-09-22T15:00:00',
  end_at:'2026-09-22T19:00:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});

const domain={
  assignmentFacts:{
    a1:{
      assignment_id:'a1',
      confirmation_state:'FACT_CONFIRMED',
      deadline_state:'VERIFIED',
      deadline_boundary:'2026-09-24',
      analysis_state:'INTERPRETED',
      current_analysis_id:'an1',
      fact_revision:1
    }
  },
  analyses:{
    an1:{analysis_id:'an1',learning_unit_ids:['u1']}
  },
  learningUnits:{
    u1:{
      learning_unit_id:'u1',
      analysis_id:'an1',
      assignment_id:'a1',
      subject:'수학',
      source_range:'개념 묶음',
      concept_skill_target:'개념 이해',
      activity_types:['CONCEPT','APPLICATION'],
      activity_sequence:['UNDERSTAND_CONCEPT','APPLY'],
      cognitive_load_profile:['REASONING'],
      activity_load:{score:5,difficulty:4,recovery_need:'HIGH'},
      review_policy:'RESULT_DEPENDENT',
      parent_help_dependency:'UNRESOLVED',
      state:'INTERPRETED'
    }
  }
};

const allocation=planner.allocateLearningUnits({
  assignment_id:'a1',
  domain_state:domain,
  candidate_dates:['2026-09-22','2026-09-23'],
  candidate_windows_by_date:{
    '2026-09-22':[{start:'15:00',end:'20:00'}],
    '2026-09-23':[{start:'15:00',end:'20:00'}]
  }
});

assert.equal(allocation.ok,true);
assert.equal(allocation.free_window_role,'SECONDARY_CAPACITY_SAFETY');
assert.deepEqual(allocation.free_window_coverage,{known_dates:2,total_dates:2});
assert.equal(allocation.free_window_by_date['2026-09-22'].total_free_minutes,60);
assert.equal(allocation.free_window_by_date['2026-09-23'].total_free_minutes,300);
assert.equal(allocation.proposals.length,1);
assert.equal(allocation.proposals[0].date,'2026-09-23');
assert.equal(allocation.proposals[0].free_window_evidence.total_free_minutes,300);
assert.equal(allocation.primary_basis,'LEARNING_UNIT_ACTIVITY_LOAD');
assert.equal(allocation.minutes_role,'SECONDARY_SAFETY_ONLY');

const committed=planner.commitLearningAllocation(allocation.allocation_run_id);
assert.equal(committed.ok,true);
const todo=planner.snapshot().dated_todos.find(x=>x.learning_unit_id==='u1');
assert(todo);
assert.equal(todo.date,'2026-09-23');
assert.equal(todo.free_window_evidence.total_free_minutes,300);

const fallback=planner.allocateLearningUnits({
  assignment_id:'a1',
  domain_state:domain,
  candidate_dates:['2026-09-22','2026-09-23']
});
assert.equal(fallback.ok,true);
assert.deepEqual(fallback.free_window_coverage,{known_dates:0,total_dates:2});
assert.equal(fallback.free_window_by_date['2026-09-22'].known,false);

console.log('PASS: Planner V2 uses actual free-window evidence as secondary capacity safety without making minutes primary learning semantics');


const recurringPlanner=createPlanner(memoryStorage());
recurringPlanner.upsertScheduleCommitment({
  commitment_id:'weekly-english',
  title:'영어학원',
  category:'영어',
  recurrence:'WEEKLY',
  weekday:1,
  start:'17:00',
  end:'19:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
recurringPlanner.upsertDailyAvailabilityWindow({
  availability_id:'weekly-mon',
  recurrence:'WEEKLY',
  weekday:1,
  start:'15:30',
  end:'20:30',
  confirmed:true,
  source:'TEST_FIXTURE'
});
const recurringDomain=JSON.parse(JSON.stringify(domain));
const recurringAllocation=recurringPlanner.allocateLearningUnits({
  assignment_id:'a1',
  domain_state:recurringDomain,
  candidate_dates:['2026-09-21']
});
assert.equal(recurringAllocation.ok,true);
assert.equal(recurringAllocation.free_window_by_date['2026-09-21'].total_free_minutes,180);
assert.equal(recurringAllocation.free_window_by_date['2026-09-21'].largest_contiguous_minutes,90);

recurringPlanner.upsertScheduleException({
  commitment_id:'weekly-english',
  date:'2026-09-28',
  type:'REPLACE',
  start:'18:30',
  end:'20:00',
  source:'TEST_FIXTURE'
});
const exceptionAllocation=recurringPlanner.allocateLearningUnits({
  assignment_id:'a1',
  domain_state:JSON.parse(JSON.stringify(domain)),
  candidate_dates:['2026-09-28']
});
assert.equal(exceptionAllocation.ok,true);
assert.equal(exceptionAllocation.free_window_by_date['2026-09-28'].total_free_minutes,210);
assert.equal(exceptionAllocation.free_window_by_date['2026-09-28'].largest_contiguous_minutes,180);

console.log('PASS: recurring schedule and date exceptions are subtracted from Planner free-window capacity');
