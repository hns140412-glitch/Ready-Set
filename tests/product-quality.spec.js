const { test, expect } = require('@playwright/test');

const VIEWS=[
  ['home','#homeView'],
  ['mission','#missionView'],
  ['planner','#plannerView'],
  ['planner-admin','#plannerAdminView'],
  ['history','#historyView'],
  ['calendar','#calendarView'],
  ['profile','#profileView'],
  ['settings','#settingsView']
];

async function assertNoHorizontalOverflow(page,selector){
  const r=await page.locator(selector).evaluate(el=>({
    scrollWidth:el.scrollWidth,
    clientWidth:el.clientWidth,
    rect:el.getBoundingClientRect().toJSON()
  }));
  expect(r.scrollWidth,'horizontal overflow').toBeLessThanOrEqual(r.clientWidth+2);
}

test.use({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });

test('mobile product quality gate: critical views fit viewport and navigation is live', async ({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  for(const [name,selector] of VIEWS){
    await page.evaluate(n=>{
      const views=[...document.querySelectorAll('.view')];
      views.forEach(v=>v.classList.toggle('active',v.dataset.view===n));
      const fn={
        home:'renderHome',mission:'renderMission',planner:'renderPlanner',
        'planner-admin':'renderPlannerAdmin',history:'renderHistory',
        calendar:'renderCalendar',profile:'renderProfile',settings:'renderSettings'
      }[n];
      if(fn && typeof window[fn]==='function') window[fn]();
    },name);
    await expect(page.locator(selector)).toHaveClass(/active/);
    await assertNoHorizontalOverflow(page,selector);
  }

  expect(errors,'runtime page errors').toEqual([]);
});

test('mobile product quality gate: core touch targets are usable and primary controls are wired', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const critical=[
    ['home','[data-nav="mission"]'],
    ['home','[data-nav="planner"]'],
    ['home','#preShareBtn'],
    ['mission','#startBtn'],
    ['focus','#pauseBtn'],
    ['focus','#completeBtn'],
    ['planner','#plannerTodayJump'],
    ['planner','[data-nav="planner-admin"]'],
    ['planner-admin','#saveScheduleBtn'],
    ['planner-admin','#saveTemplateBtn'],
    ['profile','#saveProfileBtn'],
    ['settings','#exportDataBtn']
  ];
  for(const [view,sel] of critical){
    await page.evaluate(v=>document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.dataset.view===v)),view);
    const loc=page.locator(sel).filter({visible:true}).first();
    await expect(page.locator(sel),sel+' missing').toHaveCount(1);
    const box=await page.locator(sel).first().boundingBox();
    expect(box,sel+' has no visible box in '+view).toBeTruthy();
    expect(Math.min(box.width,box.height),sel+' touch target too small').toBeGreaterThanOrEqual(36);
  }
});

test('mobile product quality gate: planner/admin data survives reload and remains connected', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const today=await page.evaluate(()=>{
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  });
  await page.evaluate(today=>{
    window.ReadySetPlanner.upsertScheduleCommitment({
      commitment_id:'quality_schedule',title:'피아노',category:'피아노',
      start_at:today+'T15:00:00',end_at:today+'T16:00:00',
      confirmed:true,source:'QUALITY_GATE'
    });
    window.ReadySetPlanner.upsertHomeworkTemplate({
      template_id:'quality_template',title:'영어 단어 복습',subject:'영어',
      estimated_minutes:20,required_today:true,preferred_days:[],confirmation_state:'CONFIRMED'
    });
  },today);
  await page.reload({waitUntil:'load'});
  const snap=await page.evaluate(()=>window.ReadySetPlanner.snapshot());
  expect(snap.schedule_commitments.some(x=>x.commitment_id==='quality_schedule')).toBeTruthy();
  expect(snap.homework_templates.some(x=>x.template_id==='quality_template')).toBeTruthy();
});