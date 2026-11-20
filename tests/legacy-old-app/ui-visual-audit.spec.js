const { test, expect } = require('@playwright/test');
const fs=require('fs');

test.use({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });

test('capture iPhone-like primary UI surfaces for visual audit', async ({page})=>{
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  fs.mkdirSync('ui-audit',{recursive:true});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.evaluate(()=>{
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    const today=`${y}-${m}-${dd}`;
    window.ReadySetPlanner.upsertScheduleCommitment({
      commitment_id:'visual_fixed',title:'영어학원',category:'영어',
      start_at:today+'T17:00:00',end_at:today+'T18:30:00',confirmed:true,source:'VISUAL_AUDIT'
    });
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'visual_todo_1',date:today,label:'수학 연산 20문제',source:'PLANNER_ALLOCATION',estimated_minutes:25,state:'PLANNED',order:1
    });
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'visual_todo_2',date:today,label:'영어 단어 복습',source:'PLANNER_ALLOCATION',estimated_minutes:20,state:'PARTIAL',order:2
    });
  });

  const shots=[
    ['home','#homeView','01-home.png'],
    ['mission','#missionView','02-mission.png'],
    ['planner','#plannerView','03-planner-week.png'],
    ['planner-admin','#plannerAdminView','04-planner-admin.png'],
    ['profile','#profileView','05-profile.png'],
    ['settings','#settingsView','06-settings.png']
  ];
  for(const [view,selector,file] of shots){
    await page.evaluate(v=>{
      document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
      const fn={home:'renderHome',mission:'renderMission',planner:'renderPlanner','planner-admin':'renderPlannerAdmin',profile:'renderProfile',settings:'renderSettings'}[v];
      if(fn&&typeof window[fn]==='function')window[fn]();
    },view);
    await expect(page.locator(selector)).toHaveClass(/active/);
    await page.locator(selector).screenshot({path:'ui-audit/'+file});
  }

  await page.evaluate(()=>{
    document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.dataset.view==='planner'));
    const b=document.querySelector('[data-planner-tab="day"]'); if(b)b.click();
  });
  await page.locator('#plannerView').screenshot({path:'ui-audit/07-planner-day.png'});

  const start=page.locator('#startBtn');
  await page.evaluate(()=>document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.dataset.view==='mission')));
  await page.locator('#plannerTodayList [data-todo-id="visual_todo_1"]').click();
  await start.click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);
  await page.locator('#focusView').screenshot({path:'ui-audit/08-focus.png'});
});