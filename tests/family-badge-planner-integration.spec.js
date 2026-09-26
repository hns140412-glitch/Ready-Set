const {test,expect}=require('@playwright/test');

test('family adult permission and child badge planner overlays remain separate on combined branch',async({page})=>{
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({ok:true,session:{
        authenticated:true,family_id:'FAMILY_A',member_id:'GRANDMA_A',
        role:'FAMILY_ADULT',family_relation:'GRANDPARENT',
        source:'NETLIFY_IDENTITY',session_id:'identity-grandma-test'
      }})});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>ReadyFamilySession.current().role)).toBe('FAMILY_ADULT');
  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('[data-nav="planner-admin"]').first()).toBeHidden();
  await expect(page.locator('#plannerWeekBadgeRail')).toContainText('아이의 인증된 배지 기록');
  await expect(page.locator('.plannerBadgeMark')).toHaveCount(0);
  expect(await page.evaluate(()=>ReadySetSyncAdapter.status().enabled)).toBe(false);
  expect(await page.evaluate(()=>ReadyBadgePlannerHighlights.connectReadAdapter({
    contract:'INVALID',getMonth:async()=>({ok:true})
  }))).toEqual({ok:false,reason:'AUTHENTICATED_READ_ADAPTER_REQUIRED'});
});

test('authenticated child sibling keeps own badge scope, not sibling planner records',async({page})=>{
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({ok:true,session:{
        authenticated:true,family_id:'FAMILY_A',member_id:'CHILD_A',
        role:'CHILD',family_relation:'SIBLING',
        source:'NETLIFY_IDENTITY',session_id:'identity-child-a-test'
      }})});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>ReadyFamilySession.current().authenticated)).toBe(true);
  await page.locator('[data-nav="planner"]').first().click();
  await page.evaluate(()=>{
    plannerSelectedDate='2026-09-26';plannerTab='week';renderPlanner();
  });
  await page.evaluate(()=>ReadyBadgePlannerHighlights.connectReadAdapter({
    contract:'TAKY_AUTHENTICATED_BADGE_READ_ADAPTER_V1',
    getMonth:async({month})=>{
      const [year,mon]=month.split('-').map(Number);
      return {ok:true,contract:'TAKY_CHILD_BADGE_CALENDAR_V1',
        family_id:'FAMILY_A',child_id:'CHILD_B',time_zone:'Asia/Seoul',month,
        days:Array.from({length:new Date(Date.UTC(year,mon,0)).getUTCDate()},(_,i)=>({
          date:month+'-'+String(i+1).padStart(2,'0'),award_count:0,events:[]
        }))
      };
    }
  }));
  await expect(page.locator('#plannerWeekBadgeRail')).toContainText('확인되지 않은 기록');
  await expect(page.locator('.plannerBadgeMark')).toHaveCount(0);
  expect(await page.evaluate(()=>ReadyFamilySession.current().family_relation)).toBe('SIBLING');
});
