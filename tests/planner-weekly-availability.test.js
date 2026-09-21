const assert=require('assert');
const {createPlanner}=require('../ready-planner-v01.js');

function storage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
const planner=createPlanner(storage());

planner.upsertDailyAvailabilityWindow({
  availability_id:'weekly-mon',
  recurrence:'WEEKLY',
  weekday:1,
  start:'16:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
planner.upsertDailyAvailabilityWindow({
  availability_id:'oneoff-tue',
  date:'2026-09-22',
  start:'17:00',
  end:'19:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});

const windows=planner.candidateWindowsByDate(['2026-09-21','2026-09-22','2026-09-28']);
assert.equal(windows['2026-09-21'].length,1);
assert.equal(windows['2026-09-21'][0].availability_id,'weekly-mon');
assert.equal(windows['2026-09-22'].length,1);
assert.equal(windows['2026-09-22'][0].availability_id,'oneoff-tue');
assert.equal(windows['2026-09-28'].length,1);
assert.equal(windows['2026-09-28'][0].availability_id,'weekly-mon');

planner.upsertScheduleCommitment({
  commitment_id:'academy-mon',
  title:'영어학원',
  start_at:'2026-09-21T17:00:00',
  end_at:'2026-09-21T19:00:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});

const domain={
  assignmentFacts:{a1:{assignment_id:'a1',confirmation_state:'FACT_CONFIRMED',deadline_state:'VERIFIED',deadline_boundary:'2026-09-29',analysis_state:'INTERPRETED',current_analysis_id:'an1',fact_revision:1}},
  analyses:{an1:{analysis_id:'an1',learning_unit_ids:['u1']}},
  learningUnits:{u1:{learning_unit_id:'u1',analysis_id:'an1',assignment_id:'a1',subject:'수학',source_range:'개념',concept_skill_target:'개념',activity_types:['CONCEPT'],activity_sequence:['UNDERSTAND'],cognitive_load_profile:['REASONING'],activity_load:{score:4,difficulty:4,recovery_need:'MEDIUM'},review_policy:'RESULT_DEPENDENT',parent_help_dependency:'UNRESOLVED',state:'INTERPRETED'}}
};

const allocation=planner.allocateLearningUnits({
  assignment_id:'a1',
  domain_state:domain,
  candidate_dates:['2026-09-21','2026-09-22','2026-09-28']
});
assert.equal(allocation.ok,true);
assert.equal(allocation.free_window_by_date['2026-09-21'].total_free_minutes,120);
assert.equal(allocation.free_window_by_date['2026-09-22'].total_free_minutes,120);
assert.equal(allocation.free_window_by_date['2026-09-28'].total_free_minutes,240);
assert.equal(allocation.proposals[0].date,'2026-09-28');

console.log('PASS: weekly availability expands by weekday, coexists with one-off availability, and Planner subtracts fixed commitments');
