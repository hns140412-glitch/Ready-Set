const {test,expect}=require('@playwright/test');

test('Planner reality engine derives executable windows with life buffers',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const out=await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    const now=new Date();
    const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');
    const today=`${y}-${m}-${d}`;
    const dow=String(new Date(today+'T12:00:00').getDay());

    p.upsertAvailabilityProfile({
      profile_id:'qa-profile',
      label:'QA 생활 가용시간',
      weekday_windows:{[dow]:[{start:'15:00',end:'21:00'}]},
      confirmed:true,
      source:'E2E_PARENT_PROFILE'
    });

    p.upsertScheduleCommitment({
      commitment_id:'school-return',
      title:'하교 후 이동·준비',
      category:'TRAVEL_PREP',
      start_at:today+'T15:00:00',
      end_at:today+'T16:00:00',
      buffer_after_minutes:15,
      confirmed:true,
      source:'E2E'
    });
    p.upsertScheduleCommitment({
      commitment_id:'academy',
      title:'영어학원',
      category:'ACADEMY',
      start_at:today+'T17:00:00',
      end_at:today+'T18:30:00',
      buffer_before_minutes:20,
      buffer_after_minutes:30,
      confirmed:true,
      source:'E2E'
    });
    p.upsertScheduleCommitment({
      commitment_id:'dinner',
      title:'저녁식사·휴식',
      category:'MEAL_REST',
      start_at:today+'T19:00:00',
      end_at:today+'T20:00:00',
      buffer_after_minutes:15,
      confirmed:true,
      source:'E2E'
    });

    const availability=p.deriveAvailability(today,{profile_id:'qa-profile'});

    p.upsertHomeworkTemplate({
      template_id:'t-short',
      title:'짧은 복습',
      subject:'영어',
      estimated_minutes:30,
      confirmation_state:'CONFIRMED',
      source:'E2E'
    });
    p.upsertHomeworkTemplate({
      template_id:'t-long',
      title:'긴 추가 과제',
      subject:'수학',
      estimated_minutes:120,
      confirmation_state:'CONFIRMED',
      source:'E2E'
    });

    const allocation=p.allocateToday({
      date:today,
      availability_profile_id:'qa-profile',
      max_minutes:30
    });

    return {
      availability:{
        source:availability.source,
        minutes:availability.available_minutes,
        windows:availability.open_windows.map(w=>({
          start:w.start.getHours()*60+w.start.getMinutes(),
          end:w.end.getHours()*60+w.end.getMinutes()
        }))
      },
      allocation
    };
  });

  expect(out.availability.source).toBe('AVAILABILITY_PROFILE');
  // 16:15-16:40 = 25m, 20:15-21:00 = 45m. Academy buffer blocks 16:40-19:00;
  // dinner + buffer blocks 19:00-20:15. Total executable = 70m.
  expect(out.availability.minutes).toBe(70);
  expect(out.availability.windows).toEqual([
    {start:16*60+15,end:16*60+40},
    {start:20*60+15,end:21*60}
  ]);
  expect(out.allocation.ok).toBeTruthy();
  expect(out.allocation.available_minutes).toBe(70);
  expect(out.allocation.max_minutes).toBe(30);
  const proposed=out.allocation.proposals.filter(x=>x.decision==='PROPOSE');
  expect(proposed.map(x=>x.template_id)).toEqual(['t-short']);
  expect(proposed.some(x=>x.template_id==='t-long')).toBeFalsy();
});

test('Planner reality engine refuses configured day with no executable window',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const out=await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    const now=new Date();
    const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');
    const today=`${y}-${m}-${d}`;
    const dow=String(new Date(today+'T12:00:00').getDay());

    p.upsertAvailabilityProfile({
      profile_id:'blocked-profile',
      weekday_windows:{[dow]:[{start:'17:00',end:'19:00'}]},
      confirmed:true
    });
    p.upsertScheduleCommitment({
      commitment_id:'blocked-all',
      title:'학원+이동',
      start_at:today+'T16:30:00',
      end_at:today+'T19:30:00',
      confirmed:true
    });

    return {
      availability:p.deriveAvailability(today,{profile_id:'blocked-profile'}),
      allocation:p.allocateToday({date:today,availability_profile_id:'blocked-profile'})
    };
  });

  expect(out.availability.available_minutes).toBe(0);
  expect(out.allocation.ok).toBeTruthy();
  expect(out.allocation.available_minutes).toBe(0);
  expect(out.allocation.proposals).toEqual([]);
});
