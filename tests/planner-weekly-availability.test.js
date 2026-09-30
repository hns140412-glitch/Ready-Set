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

const periodPlanner=createPlanner(storage());
periodPlanner.upsertSchedulePeriod({
  period_id:'semester',
  name:'학기중',
  valid_from:'2026-07-01',
  valid_until:'2026-08-31',
  priority:100,
  source:'TEST_FIXTURE'
});
periodPlanner.upsertScheduleCommitment({
  commitment_id:'semester-mon',
  title:'피아노',
  recurrence:'WEEKLY',
  weekday:1,
  start:'15:00',
  end:'16:00',
  period_id:'semester',
  confirmed:true,
  source:'TEST_FIXTURE'
});
periodPlanner.upsertSchedulePeriod({
  period_id:'summer',
  name:'여름방학',
  valid_from:'2026-07-20',
  valid_until:'2026-08-18',
  priority:200,
  source:'TEST_FIXTURE'
});
periodPlanner.upsertScheduleCommitment({
  commitment_id:'summer-mon',
  title:'영어학원',
  recurrence:'WEEKLY',
  weekday:1,
  start:'10:00',
  end:'12:00',
  period_id:'summer',
  confirmed:true,
  source:'TEST_FIXTURE'
});
const periodReview=periodPlanner.previewSchedulePeriod({
  period_id:'summer-review',
  name:'여름방학 추가',
  valid_from:'2026-07-25',
  valid_until:'2026-08-10'
});
assert.equal(periodReview.requires_acknowledgement,true);
assert.equal(periodReview.conflicts.some(x=>x.period_id==='summer'),true);
assert.equal(periodReview.conflicts.some(x=>x.period_id==='semester'),true);

const blockedPeriod=periodPlanner.upsertSchedulePeriod({
  period_id:'summer-parent',
  name:'부모 방학',
  valid_from:'2026-07-22',
  valid_until:'2026-08-05',
  source:'PARENT_ADMIN_UI'
});
assert.equal(blockedPeriod.ok,false);
assert.equal(blockedPeriod.reason,'PERIOD_CONFLICT_REVIEW_REQUIRED');
assert.equal(periodPlanner.snapshot().schedule_periods.some(x=>x.period_id==='summer-parent'),false);

const confirmedPeriod=periodPlanner.upsertSchedulePeriod({
  period_id:'summer-parent',
  name:'부모 방학',
  valid_from:'2026-07-22',
  valid_until:'2026-08-05',
  source:'PARENT_ADMIN_UI',
  conflict_acknowledged:true
});
assert.equal(confirmedPeriod.period_id,'summer-parent');

const overlapPreview=periodPlanner.previewScheduleCommitment({
  title:'태권도',
  recurrence:'WEEKLY',
  weekday:1,
  start:'10:30',
  end:'11:30',
  period_id:'summer',
  source:'PARENT_ADMIN_UI'
});
assert.equal(overlapPreview.requires_acknowledgement,true);
assert.equal(overlapPreview.conflicts.some(x=>x.commitment_id==='summer-mon'),true);

const blockedCommitment=periodPlanner.upsertScheduleCommitment({
  commitment_id:'summer-taekwondo',
  title:'태권도',
  recurrence:'WEEKLY',
  weekday:1,
  start:'10:30',
  end:'11:30',
  period_id:'summer',
  confirmed:true,
  source:'PARENT_ADMIN_UI'
});
assert.equal(blockedCommitment.ok,false);
assert.equal(blockedCommitment.reason,'SCHEDULE_CONFLICT_REVIEW_REQUIRED');
assert.equal(periodPlanner.snapshot().schedule_commitments.some(x=>x.commitment_id==='summer-taekwondo'),false);

const confirmedCommitment=periodPlanner.upsertScheduleCommitment({
  commitment_id:'summer-taekwondo',
  title:'태권도',
  recurrence:'WEEKLY',
  weekday:1,
  start:'10:30',
  end:'11:30',
  period_id:'summer',
  confirmed:true,
  source:'PARENT_ADMIN_UI',
  conflict_acknowledged:true
});
assert.equal(confirmedCommitment.commitment_id,'summer-taekwondo');

assert.equal(periodPlanner.activeSchedulePeriod('2026-07-20').period_id,'summer');
assert.equal(periodPlanner.activeSchedulePeriod('2026-08-24').period_id,'semester');
assert.deepEqual(periodPlanner.scheduleCommitmentsByDate('2026-07-20').map(x=>x.commitment_id),['summer-mon','summer-taekwondo']);
assert.deepEqual(periodPlanner.scheduleCommitmentsByDate('2026-08-24').map(x=>x.commitment_id),['semester-mon']);
const vacationCapacity=periodPlanner.allocateToday({
  date:'2026-07-20',
  candidate_windows:[{start:'09:00',end:'13:00'}]
});
assert.equal(vacationCapacity.ok,true);
assert.equal(vacationCapacity.available_minutes,120);
const removedPeriod=periodPlanner.removeSchedulePeriod('summer');
assert.equal(removedPeriod.ok,true);
assert.equal(removedPeriod.removed_commitments,2);
assert.deepEqual(periodPlanner.scheduleCommitmentsByDate('2026-07-20').map(x=>x.commitment_id),['semester-mon']);

console.log('PASS: weekly availability and period-scoped fixed timetables expand by weekday, override by active period, and subtract from Planner capacity');
