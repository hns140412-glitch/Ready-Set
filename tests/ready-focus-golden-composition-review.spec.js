'use strict';
const {test,expect}=require('@playwright/test');
// Golden visual audit ONLY: user-approved Phone+Tablet original is not rendered as a cropped screen.
test.describe('Ready Focus Golden: preserve original yellow live UI',()=>{
  for(const viewport of [{width:390,height:844,kind:'phone'},{width:1024,height:768,kind:'tablet'}]){
    test(viewport.kind+' live Clock/Stage layout evidence',async({page})=>{
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
      await page.evaluate(()=>{
        document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
        document.querySelector('#focusView').classList.add('active');
        const view=window.ReadyRebuildFocusView.create({
          query:s=>document.querySelector(s),
          learningStepLabel:x=>x,formatTime:ms=>{
            const m=Math.floor(ms/60000),sec=Math.floor(ms/1000)%60;
            return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
          },applyGuide(){},updateBgmStatus(){document.querySelector('#bgmStatus').textContent='집중 피아노 · 재생 중';}
        });
        const now=new Date();
        const session={selected:['영어 · 단어 외우기'],tasks:[],targetMs:1500000,startAt:now.getTime()-8000,plannerLinks:[]};
        view.render(session);
        view.renderTick(session,{remaining:1492000,focus:8000,issue:0},now);
      });
      await expect(page.locator('#focusTitle')).toHaveCount(0); // headline belongs to original .focusTitle section, not duplicated.
      await expect(page.locator('#focusView .clockHero')).toBeVisible();
      await expect(page.locator('#remainingTime')).toHaveText('24:52');
      await expect(page.locator('#targetTime')).toHaveText('25:00');
      await expect(page.locator('#pauseBtn')).toBeVisible();
      await expect(page.locator('#completeBtn')).toBeVisible();
      await expect(page.locator('#completeBtn')).toHaveText('완료했어요');
      await expect(page.locator('#recBtn')).toBeHidden();
      await expect(page.locator('#focusSoundBtn')).toBeVisible();
      const layout=await page.evaluate(()=>{
        const stage=document.querySelector('#focusView .focusMain').getBoundingClientRect();
        const clock=document.querySelector('#focusView .clockHero').getBoundingClientRect();
        const panel=document.querySelector('#focusView .controlPanel').getBoundingClientRect();
        const d=document.documentElement;
        return {stage:{left:stage.left,right:stage.right,width:stage.width},clock:{width:clock.width,height:clock.height},panel:{top:panel.top,bottom:panel.bottom},width:d.scrollWidth,viewport:innerWidth,bg:getComputedStyle(document.querySelector('#focusView')).backgroundColor};
      });
      expect(layout.width).toBeLessThanOrEqual(viewport.width+2);
      expect(Math.abs(layout.clock.width-layout.clock.height)).toBeLessThan(2);
      if(viewport.kind==='phone'){
        expect(Math.abs(layout.stage.left-(viewport.width-layout.stage.width)/2)).toBeLessThan(4);
      }else{
        expect(layout.stage.left).toBeGreaterThan(viewport.width/2-20);
        expect(layout.stage.right).toBeGreaterThan(viewport.width-90);
      }
      await page.screenshot({path:'ui-audit/focus-golden-review-'+viewport.kind+'.png',fullPage:true});
    });
  }
});