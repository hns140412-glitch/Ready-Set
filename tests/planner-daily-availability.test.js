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

planner.upsertDailyAvailabilityWindow({
  availability_id:'avail-1',
  date:'2026-09-22',
  start:'15:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
planner.upsertDailyAvailabilityWindow({
  availability_id:'avail-2',
  date:'2026-09-23',
  start:'15:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
planner.upsertDailyAvailabilityWindow({
  availability_id:'avail-3',
  date:'2026-09-23',
  start:'17:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
planner.upsertScheduleCommitment({
  commitment_id:'academy-day-1',
  title:'영어학원',
  category:'ACADEMY',
  start_at:'2026-09-22T15:00:00',
  end_at:'2026-09-22T19:00:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});

assert.deepEqual(planner.candidateWindowsByDate(['2026-09-22','2026-09-23']),{
  '2026-09-22':[{start:'15:00',end:'20:00',availability_id:'avail-1',source:'TEST_FIXTURE'}],
  '2026-09-23':[
    {start:'15:00',end:'20:00',availability_id:'avail-2',source:'TEST_FIXTURE'},
    {start:'17:00',end:'20:00',availability_id:'avail-3',source:'TEST_FIXTURE'}
  ]
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
  analyses:{an1:{analysis_id:'an1',learning_unit_ids:['u1']}},
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
  candidate_dates:['2026-09-22','2026-09-23']
});

assert.equal(allocation.ok,true);
assert.deepEqual(allocation.free_window_coverage,{known_dates:2,total_dates:2});
assert.equal(allocation.free_window_by_date['2026-09-22'].total_free_minutes,60);
assert.equal(allocation.free_window_by_date['2026-09-23'].total_free_minutes,300);
assert.equal(allocation.proposals[0].date,'2026-09-23');

const snap=planner.snapshot();
assert.equal(snap.daily_availability_windows.length,3);
assert.equal(snap.schedule_commitments.length,1);

console.log('PASS: Planner automatically derives candidate_windows_by_date from Parent-confirmed daily availability and subtracts fixed commitments');
