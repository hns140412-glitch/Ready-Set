'use strict';
// REVIEW ONLY. Synthetic test fixture is not child FACT, Planner allocation or production data.
const {test,expect}=require('@playwright/test');
test.describe('Ready Base Camp glass Planner: actual browser rendering',()=>{
  for(const width of [375,390,430,768]){
    test(`Week -> Daily visually safe at ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:844});
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
      await expect(page.locator('#homeView')).toHaveClass(/active/);
      await page.locator('.homePlannerPrimary').click();
      await expect(page.locator('#plannerView')).toHaveClass(/active/);
      await expect(page.locator('.plannerGlassSheet')).toBeVisible();
      const todayButtonMetrics=await page.locator('#plannerTodayJump').evaluate(node=>({
        text:node.textContent.trim(),height:node.getBoundingClientRect().height,
        lines:Math.round(node.getBoundingClientRect().height/parseFloat(getComputedStyle(node).lineHeight))
      }));
      expect(todayButtonMetrics.text).toBe('오늘');
      expect(todayButtonMetrics.height).toBeLessThanOrEqual(53);
      const strayBodyNodes=await page.evaluate(()=>Array.from(document.body.childNodes)
        .filter(node=>node.nodeType===3&&node.textContent.trim())
        .map(node=>node.textContent.trim()));
      console.log('OUTSIDE_APP_TEXT_NODES',JSON.stringify(strayBodyNodes));
      expect(strayBodyNodes).toEqual([]);
      await page.evaluate(()=>{
        const local=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
        const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
        const weekStart=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(12,0,0,0);return x;};
        const today=local();
        const start=weekStart(new Date());
        const monday=local(start);
        const wednesday=local(addDays(start,2));
        const demoByDate={
          [monday]:[
            {kind:'SCHEDULE',label:'학교',state:'FIXED',time:'08:20',meta:'고정 일정',schedule_scope:'CHILD'},
            {kind:'TODO',label:'등교 전 영어 복습',state:'PLANNED',daypart:'MORNING',minutes:15,meta:'Planner',todo_id:'demo-mon'}
          ],
          [wednesday]:[
            {kind:'SCHEDULE',label:'과학 학원',state:'FIXED',time:'16:00',meta:'고정 일정',schedule_scope:'CHILD'},
            {kind:'TODO',label:'읽기 연습',state:'PLANNED',daypart:'AFTER_SCHOOL',minutes:20,meta:'Planner',todo_id:'demo-wed'}
          ],
          [today]:[
            {kind:'SCHEDULE',label:'학교',state:'FIXED',time:'08:20',meta:'고정 일정',schedule_scope:'CHILD'},
            {kind:'SCHEDULE',label:'음악 활동',state:'FIXED',time:'17:00',meta:'고정 일정',schedule_scope:'CHILD'},
            {kind:'TODO',label:'등교 전 단어 복습',state:'PLANNED',daypart:'MORNING',minutes:15,meta:'Planner',todo_id:'demo-t1'},
            {kind:'TODO',label:'읽기 연습',state:'PARTIAL',daypart:'AFTER_SCHOOL',minutes:20,meta:'Planner',todo_id:'demo-t2'}
          ]
        };
        const safe=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
        const review=window.ReadyRebuildPlannerScreenView.create({
          query:s=>document.querySelector(s),queryAll:s=>Array.from(document.querySelectorAll(s)),
          escapeHtml:safe,localDateKey:local,addDays,weekStart,
          itemsForDate:key=>demoByDate[key]||[],
          freeWindowsForDate:key=>key===today?[{start:'15:30',end:'16:00',minutes:30}]:[],
          stateLabel:s=>({FIXED:'고정',PLANNED:'예정',PARTIAL:'일부 남음'}[s]||s)
        });
        window.__takyUiReview={today,review,render:tab=>review.render({selectedDate:today,tab,snapshot:{},isParent:false})};
        window.__takyUiReview.render('week');
      });
      await expect(page.locator('#plannerWeekOverview .plannerWeekOverviewRow')).toHaveCount(7);
      await expect(page.locator('#plannerWeekOverview')).toContainText('학교');
      await expect(page.locator('#plannerWeekOverview')).toContainText('등교 전');
      await expect(page.locator('#plannerWeekOverview')).toContainText('여유 30분');
      const glass=await page.locator('.plannerGlassSheet').evaluate(node=>{
        const style=getComputedStyle(node);
        return {background:style.backgroundImage,blur:style.backdropFilter||style.webkitBackdropFilter};
      });
      expect(glass.background).toContain('gradient');
      expect(glass.blur).not.toBe('none');
      await page.waitForTimeout(400);
      await page.screenshot({path:`ui-audit/ready-review-week-${width}.png`,fullPage:true});
      await page.locator('#plannerWeekOverview .plannerWeekOverviewRow.today').click();
      await expect(page.locator('#plannerDayPanel')).toBeVisible();
      await page.evaluate(()=>window.__takyUiReview.render('day'));
      await expect(page.locator('#plannerDayTimeline')).toContainText('등교 전 단어 복습');
      await expect(page.locator('#plannerDayTimeline')).toContainText('음악 활동');
      await expect(page.locator('#plannerDayTimeline')).toContainText('15:30');
      const surfaces=await page.evaluate(()=>{
        const fixed=document.querySelector('.plannerRouteItem.childSchedule');
        const todo=document.querySelector('.plannerRouteItem.missionItem');
        const free=document.querySelector('.plannerFreeWindows');
        return [fixed,todo,free].map(node=>node?getComputedStyle(node).backgroundColor:null);
      });
      expect(surfaces.every(Boolean)).toBe(true);
      expect(new Set(surfaces).size).toBe(3);
      const routeText=await page.locator('#plannerDayTimeline').innerText();
      expect(routeText.indexOf('학교')).toBeLessThan(routeText.indexOf('음악 활동'));
      const widths=await page.evaluate(()=>({inner:window.innerWidth,document:document.documentElement.scrollWidth,view:document.querySelector('#plannerView').scrollWidth}));
      expect(widths.document).toBeLessThanOrEqual(width+2);
      expect(widths.view).toBeLessThanOrEqual(Math.min(width,430)+2);
      await page.waitForTimeout(400);
      await page.screenshot({path:`ui-audit/ready-review-day-${width}.png`,fullPage:true});
      await page.emulateMedia({reducedMotion:'reduce'});
      const reduced=await page.locator('#plannerDayPanel').evaluate(node=>getComputedStyle(node).animationName);
      expect(reduced).toBe('none');
      // The screenshots and synthetic tasks are review fixtures, not real user schedule or an approved asset.
    });
  }
});