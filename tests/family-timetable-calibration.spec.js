const fs=require('fs');
const familyTimetable=JSON.parse(fs.readFileSync('tests/fixtures/ready-family-timetable-notion-2026-09-22.json','utf8'));
const { test, expect } = require('@playwright/test');

test('representative family timetable produces non-overlapping free windows across a school week', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'CAL_FAMILY',member_id:'CAL_PARENT',role:'PARENT',
      session_id:'CAL_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const out=await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    const source='PREDEPLOY_CALIBRATION_FIXTURE';

    [
      {id:'cal_english',title:'영어학원',category:'영어',weekday:1,start:'17:00',end:'19:00'},
      {id:'cal_piano',title:'피아노',category:'피아노',weekday:2,start:'16:00',end:'17:00'},
      {id:'cal_taekwondo',title:'태권도',category:'태권도',weekday:3,start:'17:00',end:'18:00'},
      {id:'cal_science',title:'과학학원',category:'과학',weekday:4,start:'18:00',end:'20:00'}
    ].forEach(x=>p.upsertScheduleCommitment({
      commitment_id:x.id,title:x.title,category:x.category,
      recurrence:'WEEKLY',weekday:x.weekday,start:x.start,end:x.end,
      valid_from:'2026-09-01',valid_until:'2026-12-31',
      confirmed:true,source
    }));

    [1,2,3,4,5].forEach(weekday=>p.upsertDailyAvailabilityWindow({
      availability_id:'cal_available_'+weekday,
      recurrence:'WEEKLY',weekday,start:'15:30',end:'20:30',
      valid_from:'2026-09-01',valid_until:'2026-12-31',
      confirmed:true,source
    }));

    const dates=['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25'];
    const availability=p.candidateWindowsByDate(dates);
    const commitments=Object.fromEntries(dates.map(date=>[date,p.scheduleCommitmentsForDate(date)]));
    const domain={
      assignmentFacts:{cal_fact:{assignment_id:'cal_fact',confirmation_state:'FACT_CONFIRMED',deadline_state:'VERIFIED',deadline_boundary:'2026-09-28',analysis_state:'INTERPRETED',current_analysis_id:'cal_analysis',fact_revision:1}},
      analyses:{cal_analysis:{analysis_id:'cal_analysis',learning_unit_ids:['cal_unit']}},
      learningUnits:{cal_unit:{learning_unit_id:'cal_unit',analysis_id:'cal_analysis',assignment_id:'cal_fact',subject:'수학',source_range:'개념 묶음',concept_skill_target:'개념 이해',activity_types:['CONCEPT'],activity_sequence:['UNDERSTAND_CONCEPT'],cognitive_load_profile:['REASONING'],activity_load:{score:4,difficulty:4,recovery_need:'HIGH'},review_policy:'RESULT_DEPENDENT',parent_help_dependency:'UNRESOLVED',state:'INTERPRETED'}}
    };
    const allocation=p.allocateLearningUnits({assignment_id:'cal_fact',domain_state:domain,candidate_dates:dates});
    return {availability,commitments,allocation};
  });

  expect(out.commitments['2026-09-21'][0].title).toBe('영어학원');
  expect(out.commitments['2026-09-22'][0].title).toBe('피아노');
  expect(out.commitments['2026-09-23'][0].title).toBe('태권도');
  expect(out.commitments['2026-09-24'][0].title).toBe('과학학원');
  expect(out.commitments['2026-09-25']).toHaveLength(0);
  expect(out.availability['2026-09-21'][0]).toEqual(expect.objectContaining({start:'15:30',end:'20:30'}));
  expect(out.allocation.free_window_by_date['2026-09-21'].total_free_minutes).toBe(180);
  expect(out.allocation.free_window_by_date['2026-09-22'].total_free_minutes).toBe(240);
  expect(out.allocation.free_window_by_date['2026-09-23'].total_free_minutes).toBe(240);
  expect(out.allocation.free_window_by_date['2026-09-24'].total_free_minutes).toBe(180);
  expect(out.allocation.free_window_by_date['2026-09-25'].total_free_minutes).toBe(300);
  expect(out.allocation.proposals[0].date).toBe('2026-09-25');
});

test('date exception recalibrates one day without mutating the weekly family timetable source', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'CAL_FAMILY',member_id:'CAL_PARENT',role:'PARENT',
      session_id:'CAL_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const out=await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    p.upsertScheduleCommitment({
      commitment_id:'cal_english_exception',title:'영어학원',category:'영어',
      recurrence:'WEEKLY',weekday:1,start:'17:00',end:'19:00',
      confirmed:true,source:'PREDEPLOY_CALIBRATION_FIXTURE'
    });
    p.upsertDailyAvailabilityWindow({
      availability_id:'cal_mon_av',recurrence:'WEEKLY',weekday:1,
      start:'15:30',end:'20:30',confirmed:true,source:'PREDEPLOY_CALIBRATION_FIXTURE'
    });
    p.upsertScheduleException({
      commitment_id:'cal_english_exception',date:'2026-09-28',type:'REPLACE',
      start:'18:30',end:'20:00',note:'보강 시간 변경',source:'PREDEPLOY_CALIBRATION_FIXTURE'
    });

    const domain={
      assignmentFacts:{cal_fact2:{assignment_id:'cal_fact2',confirmation_state:'FACT_CONFIRMED',deadline_state:'VERIFIED',deadline_boundary:'2026-09-29',analysis_state:'INTERPRETED',current_analysis_id:'cal_analysis2',fact_revision:1}},
      analyses:{cal_analysis2:{analysis_id:'cal_analysis2',learning_unit_ids:['cal_unit2']}},
      learningUnits:{cal_unit2:{learning_unit_id:'cal_unit2',analysis_id:'cal_analysis2',assignment_id:'cal_fact2',subject:'수학',source_range:'개념 묶음',concept_skill_target:'개념 이해',activity_types:['CONCEPT'],activity_sequence:['UNDERSTAND_CONCEPT'],cognitive_load_profile:['REASONING'],activity_load:{score:4,difficulty:4,recovery_need:'HIGH'},review_policy:'RESULT_DEPENDENT',parent_help_dependency:'UNRESOLVED',state:'INTERPRETED'}}
    };
    const allocation=p.allocateLearningUnits({assignment_id:'cal_fact2',domain_state:domain,candidate_dates:['2026-09-28']});
    return {
      replaced:p.scheduleCommitmentsForDate('2026-09-28'),
      availability:p.candidateWindowsByDate(['2026-09-28'])['2026-09-28'],
      free:allocation.free_window_by_date['2026-09-28'],
      base:p.snapshot().schedule_commitments.find(x=>x.commitment_id==='cal_english_exception')
    };
  });

  expect(out.replaced[0].start_at).toBe('2026-09-28T18:30:00');
  expect(out.availability[0]).toEqual(expect.objectContaining({start:'15:30',end:'20:30'}));
  expect(out.free.total_free_minutes).toBe(210);
  expect(out.base.start).toBe('17:00');
  expect(out.base.end).toBe('19:00');
});


test('actual Notion family timetable binds confirmed rows only and keeps uncertain rows out of Planner', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'CAL_FAMILY',member_id:'CAL_PARENT',role:'PARENT',
      session_id:'CAL_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  const out=await page.evaluate((dataset)=>{
    const p=window.ReadySetPlanner;
    dataset.confirmed.forEach(x=>p.upsertScheduleCommitment({
      commitment_id:x.id,
      title:x.title,
      category:x.category,
      recurrence:'WEEKLY',
      weekday:x.weekday,
      start:x.start,
      end:x.end,
      confirmed:true,
      source:'NOTION_READY_SET_TIMETABLE_CONFIRMED'
    }));
    const dates=['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25'];
    return {
      dates:Object.fromEntries(dates.map(date=>[date,p.scheduleCommitmentsForDate(date).map(x=>({
        title:x.title,start:x.start,end:x.end,source:x.source
      }))])),
      snapshot:p.snapshot()
    };
  },familyTimetable);

  expect(familyTimetable.source.authority_rule).toBe('ONLY_ROWS_WITH_CONFIRMATION_STATUS_CONFIRMED_ARE_EXECUTION_ELIGIBLE');
  expect(familyTimetable.confirmed).toHaveLength(6);
  expect(familyTimetable.pending).toHaveLength(6);

  expect(out.dates['2026-09-21']).toEqual([
    expect.objectContaining({title:'영어학원',start:'16:00',end:'18:00'}),
    expect.objectContaining({title:'과학학원',start:'19:00',end:'20:00'})
  ]);
  expect(out.dates['2026-09-22']).toEqual([
    expect.objectContaining({title:'피아노',start:'14:00',end:'16:00'})
  ]);
  expect(out.dates['2026-09-23']).toEqual([
    expect.objectContaining({title:'영어학원',start:'16:00',end:'18:00'})
  ]);
  expect(out.dates['2026-09-24']).toEqual([
    expect.objectContaining({title:'태권도',start:'16:30',end:'18:00'})
  ]);
  expect(out.dates['2026-09-25']).toEqual([
    expect.objectContaining({title:'영어학원',start:'16:00',end:'18:00'})
  ]);

  for(const pending of familyTimetable.pending){
    expect(out.snapshot.schedule_commitments.some(x=>
      x.title===pending.title && x.start===pending.start && (pending.end==null || x.end===pending.end)
    )).toBe(false);
  }
});
