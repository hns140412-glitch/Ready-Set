const { test, expect } = require('@playwright/test');

test('representative family timetable produces non-overlapping free windows across a school week', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'CAL_FAMILY',member_id:'CAL_CHILD',role:'CHILD',
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
    const windows=p.candidateWindowsByDate(dates);
    const commitments=Object.fromEntries(dates.map(date=>[date,p.scheduleCommitmentsForDate(date)]));
    return {windows,commitments};
  });

  expect(out.commitments['2026-09-21'][0].title).toBe('영어학원');
  expect(out.windows['2026-09-21']).toEqual([
    expect.objectContaining({start:'15:30',end:'17:00'}),
    expect.objectContaining({start:'19:00',end:'20:30'})
  ]);

  expect(out.commitments['2026-09-22'][0].title).toBe('피아노');
  expect(out.windows['2026-09-22']).toEqual([
    expect.objectContaining({start:'15:30',end:'16:00'}),
    expect.objectContaining({start:'17:00',end:'20:30'})
  ]);

  expect(out.commitments['2026-09-23'][0].title).toBe('태권도');
  expect(out.windows['2026-09-23']).toEqual([
    expect.objectContaining({start:'15:30',end:'17:00'}),
    expect.objectContaining({start:'18:00',end:'20:30'})
  ]);

  expect(out.commitments['2026-09-24'][0].title).toBe('과학학원');
  expect(out.windows['2026-09-24']).toEqual([
    expect.objectContaining({start:'15:30',end:'18:00'}),
    expect.objectContaining({start:'20:00',end:'20:30'})
  ]);

  expect(out.commitments['2026-09-25']).toHaveLength(0);
  expect(out.windows['2026-09-25']).toEqual([
    expect.objectContaining({start:'15:30',end:'20:30'})
  ]);
});

test('date exception recalibrates one day without mutating the weekly family timetable source', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'CAL_FAMILY',member_id:'CAL_CHILD',role:'CHILD',
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

    return {
      replaced:p.scheduleCommitmentsForDate('2026-09-28'),
      windows:p.candidateWindowsByDate(['2026-09-28'])['2026-09-28'],
      base:p.snapshot().schedule_commitments.find(x=>x.commitment_id==='cal_english_exception')
    };
  });

  expect(out.replaced[0].start_at).toBe('2026-09-28T18:30:00');
  expect(out.windows).toEqual([
    expect.objectContaining({start:'15:30',end:'18:30'}),
    expect.objectContaining({start:'20:00',end:'20:30'})
  ]);
  expect(out.base.start).toBe('17:00');
  expect(out.base.end).toBe('19:00');
});
