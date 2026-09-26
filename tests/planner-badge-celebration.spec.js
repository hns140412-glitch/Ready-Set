const {test,expect}=require('@playwright/test');

// Presentation fixtures only. Real Award Ledger history must be served by a
// separately authenticated and server-scoped TAKY badge reader, never by JS.
async function authenticateChild(page){
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({ok:true,session:{
        authenticated:true,family_id:'FAMILY_A',member_id:'CHILD_A',role:'CHILD',
        session_id:'identity-child-a-test',source:'NETLIFY_IDENTITY'
      }})});
  });
}
async function enterWeek(page){
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.evaluate(()=>{
    plannerSelectedDate='2026-09-26';plannerTab='week';renderPlanner();
  });
}
function fixtureMonth({month,child='CHILD_A',foreign=false,empty=false}={}){
  const [y,m]=month.split('-').map(Number),last=new Date(Date.UTC(y,m,0)).getUTCDate();
  const records=(month==='2026-09'&&!empty)?[
    {day:'2026-09-26',id:'award-1',time:'2026-09-26T14:00:00.000Z',
      title:'실수 청소부',type:'FIRST_ACQUISITION'},
    {day:'2026-09-27',id:'award-2',time:'2026-09-26T15:00:00.000Z',
      title:'실수 청소부',type:'REACQUISITION'}
  ]:[];
  return {
    ok:true,contract:'TAKY_CHILD_BADGE_CALENDAR_V1',time_zone:'Asia/Seoul',
    family_id:foreign?'FAMILY_B':'FAMILY_A',child_id:child,month,
    days:Array.from({length:last},(_,i)=>{
      const day=month+'-'+String(i+1).padStart(2,'0');
      const events=records.filter(x=>x.day===day).map(x=>({
        award_id:x.id,badge_id:'BDG-APPROVED-EXAMPLE',badge_title:x.title,
        calendar_date:day,event_type:x.type,awarded_at:x.time,
        date_status:'VERIFIED_AWARD_TIME'
      }));
      return {date:day,award_count:events.length,events};
    })
  };
}
test('Week and day show only test-adapter verified acquisitions without making badges into task goals',async({page})=>{
  await authenticateChild(page);
  await enterWeek(page);
  await expect(page.locator('#plannerWeekBadgeRail')).toContainText('서버 연결 전');
  await expect(page.locator('#plannerWeekBadgeRail .plannerBadgeChip')).toHaveCount(0);
  const bound=await page.evaluate(()=>{
    return ReadyBadgePlannerHighlights.connectReadAdapter({
      contract:'TAKY_AUTHENTICATED_BADGE_READ_ADAPTER_V1',
      getMonth:async ({month})=>{
        const [y,m]=month.split('-').map(Number);
        const last=new Date(Date.UTC(y,m,0)).getUTCDate();
        const items=month==='2026-09'?[
          ['2026-09-26','test-award-1','2026-09-26T14:00:00.000Z','FIRST_ACQUISITION'],
          ['2026-09-27','test-award-2','2026-09-26T15:00:00.000Z','REACQUISITION']
        ]:[];
        return {ok:true,contract:'TAKY_CHILD_BADGE_CALENDAR_V1',time_zone:'Asia/Seoul',
          family_id:'FAMILY_A',child_id:'CHILD_A',month,
          days:Array.from({length:last},(_,i)=>{
            const date=month+'-'+String(i+1).padStart(2,'0');
            const events=items.filter(x=>x[0]===date).map(x=>({
              calendar_date:date,award_id:x[1],badge_id:'APPROVED_BADGE',
              badge_title:'실수 청소부',awarded_at:x[2],
              event_type:x[3],date_status:'VERIFIED_AWARD_TIME'
            }));
            return {date,award_count:events.length,events};
          })};
      }
    });
  });
  expect(bound.ok).toBe(true);
  await expect(page.locator('#plannerWeekBadgeRail [data-badge-state="verified"]')).toHaveCount(0);
  await expect(page.locator('#plannerWeekBadgeRail .plannerBadgeChip')).toHaveCount(2);
  await expect(page.locator('[data-planner-date="2026-09-26"] .plannerBadgeMark')).toHaveText('훈장 1');
  await expect(page.locator('[data-planner-date="2026-09-27"] .plannerBadgeMark')).toHaveText('훈장 1');
  await page.locator('[data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayBadgeRail .plannerBadgeChip')).toHaveCount(1);
  await expect(page.locator('#plannerDayBadgeRail')).toContainText('첫 발견');
  await page.locator('[data-planner-tab="week"]').click();
  await page.locator('[data-planner-date="2026-09-27"]').click();
  await page.locator('[data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayBadgeRail')).toContainText('다시 만난 훈장');
  await expect(page.locator('#plannerWeekDetail')).not.toContainText('획득 목표');
  expect(await page.evaluate(()=>localStorage.getItem('badge-awards'))).toBeNull();
});
test('Changes of family session and forged cross-child calendar fail closed',async({page})=>{
  await authenticateChild(page);
  await enterWeek(page);
  await page.evaluate(()=>{
    ReadyBadgePlannerHighlights.connectReadAdapter({
      contract:'TAKY_AUTHENTICATED_BADGE_READ_ADAPTER_V1',
      getMonth:async({month})=>{
        const [y,m]=month.split('-').map(Number);
        return {ok:true,contract:'TAKY_CHILD_BADGE_CALENDAR_V1',time_zone:'Asia/Seoul',
          family_id:'FAMILY_A',child_id:'CHILD_B',month,
          days:Array.from({length:new Date(Date.UTC(y,m,0)).getUTCDate()},(_,i)=>({
            date:month+'-'+String(i+1).padStart(2,'0'),award_count:0,events:[]
          }))};
      }
    });
  });
  await expect(page.locator('#plannerWeekBadgeRail')).toContainText('확인되지 않은 기록');
  await expect(page.locator('.plannerBadgeMark')).toHaveCount(0);
  await page.evaluate(()=>ReadyFamilySession.clear());
  await expect(page.locator('#plannerWeekBadgeRail')).toContainText('아이의 인증된 배지 기록');
  await expect(page.locator('.plannerBadgeMark')).toHaveCount(0);
});
test('Parent does not receive a personal locked or acquired child-badge planner atlas',async({page})=>{
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      ok:true,session:{
        authenticated:true,family_id:'FAMILY_A',member_id:'PARENT_A',
        role:'PARENT',session_id:'identity-parent-test',source:'NETLIFY_IDENTITY'
      }
    })});
  });
  await enterWeek(page);
  await expect(page.locator('#plannerWeekBadgeRail')).toContainText('아이의 인증된 배지 기록');
  await expect(page.locator('.plannerBadgeMark')).toHaveCount(0);
  await expect(page.locator('#plannerWeekBadgeRail')).not.toContainText('미획득');
});
