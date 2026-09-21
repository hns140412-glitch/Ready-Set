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

// 2026-09-21 Monday, 09-22 Tuesday, 09-23 Wednesday.
planner.upsertWeeklyAvailabilityTemplate({
  template_id:'weekly-mon',
  day_of_week:1,
  start:'16:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
planner.upsertWeeklyAvailabilityTemplate({
  template_id:'weekly-tue',
  day_of_week:2,
  start:'16:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});
planner.upsertWeeklyAvailabilityTemplate({
  template_id:'weekly-wed',
  day_of_week:3,
  start:'16:00',
  end:'20:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});

let windows=planner.candidateWindowsByDate(['2026-09-21','2026-09-22','2026-09-23']);
assert.deepEqual(windows['2026-09-21'],[
  {start:'16:00',end:'20:00',template_id:'weekly-mon',source:'TEST_FIXTURE',scope:'WEEKLY_BASE'}
]);
assert.deepEqual(windows['2026-09-22'],[
  {start:'16:00',end:'20:00',template_id:'weekly-tue',source:'TEST_FIXTURE',scope:'WEEKLY_BASE'}
]);

// Exact-date confirmation overrides weekly baseline rather than adding to it.
planner.upsertDailyAvailabilityWindow({
  availability_id:'tue-override',
  date:'2026-09-22',
  start:'18:00',
  end:'19:30',
  confirmed:true,
  source:'TEST_FIXTURE'
});
windows=planner.candidateWindowsByDate(['2026-09-22']);
assert.deepEqual(windows['2026-09-22'],[
  {start:'18:00',end:'19:30',availability_id:'tue-override',source:'TEST_FIXTURE',scope:'DATE_OVERRIDE'}
]);

// A closed date suppresses both weekly baseline and exact-date windows.
planner.setAvailabilityClosedDate('2026-09-23',true);
windows=planner.candidateWindowsByDate(['2026-09-23']);
assert.deepEqual(windows['2026-09-23'],[]);
planner.setAvailabilityClosedDate('2026-09-23',false);
windows=planner.candidateWindowsByDate(['2026-09-23']);
assert.equal(windows['2026-09-23'][0].scope,'WEEKLY_BASE');

// Fixed commitments are still subtracted after weekly/date selection.
planner.upsertScheduleCommitment({
  commitment_id:'monday-academy',
  title:'과학학원',
  category:'ACADEMY',
  start_at:'2026-09-21T16:00:00',
  end_at:'2026-09-21T19:00:00',
  confirmed:true,
  source:'TEST_FIXTURE'
});

const domain={
  assignmentFacts:{
    a1:{
      assignment_id:'a1',
      confirmation_state:'FACT_CONFIRMED',
      deadline_state:'VERIFIED',
      deadline_boundary:'2026-09-23',
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
  candidate_dates:['2026-09-21','2026-09-22']
});
assert.equal(allocation.ok,true);
assert.equal(allocation.free_window_by_date['2026-09-21'].total_free_minutes,60);
assert.equal(allocation.free_window_by_date['2026-09-22'].total_free_minutes,90);
assert.equal(allocation.proposals[0].date,'2026-09-22');

const snap=planner.snapshot();
assert.equal(snap.weekly_availability_templates.length,3);
assert.deepEqual(snap.availability_closed_dates,[]);

console.log('PASS: weekly availability supplies Planner, exact dates override weekly baseline, closed dates suppress both, and commitments remain blocking intervals');
