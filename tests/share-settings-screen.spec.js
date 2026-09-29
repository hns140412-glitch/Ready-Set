const {test,expect}=require('@playwright/test');
const url='http://127.0.0.1:4173/';
async function mountIsolated(page){
 await page.goto(url);
 await page.evaluate(()=>{
   const profile={theme:'sail'};
   const owner=(kind,opts={})=>{
     const theme=opts.theme==='drop'?'drop':'sail';
     const crew=[{id:'dubi',name:'이미 선택된 대원 A',asset:'./assets/character-formation/crew/dubi-locked-visual-id.webp'},
       {id:'lori',name:'이미 선택된 대원 B',asset:'./assets/character-formation/crew/lori-locked-visual-id.webp'}];
     const filtered=Array.isArray(opts.crewIds)?crew.filter(x=>opts.crewIds.includes(x.id)):crew;
     return {ok:true,kind,theme,avatar:opts.includeProfile===false?{shared:false}:{shared:true,asset:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2258%22 height=%2258%22%3E%3Crect width=%2258%22 height=%2258%22 fill=%22%23c0eed0%22/%3E%3C/svg%3E'},crew:filtered,
       tasks:[{task_id:'t1',label:'실제 과제 슬롯'}],total:1,doneCount:kind==='result'?1:null,stars:null,
       targetMs:1500000,focusMs:kind==='result'?1400000:null,copy:{title:theme==='sail'?'오늘의 항해':'오늘의 낙하',reaction:'실제 반응 자리'}};
   };
   window.__shareCalls=[];
   const card={
     render:async(kind,opts)=>{window.__shareCalls.push({kind,opts,type:'render'});const c=document.createElement('canvas');c.width=720;c.height=1280;const ctx=c.getContext('2d');ctx.fillStyle='#93dbfc';ctx.fillRect(0,0,720,1280);return c;},
     showPreview:async(kind,opts)=>{window.__shareCalls.push({kind,opts,type:'preview'});return {ok:true};}
   };
   window.__shareTest=window.ReadyShareSettings.create({projectShare:owner,card,assets:{scenes:{
       drop:{pre:{path:'./assets/share-card/scenes/drop-pre.webp'},result:{path:'./assets/share-card/scenes/drop-result.webp'}},
       sail:{pre:{path:'./assets/share-card/scenes/sail-pre.webp'},result:{path:'./assets/share-card/scenes/sail-result.webp'}}
     }},getProfileTheme:()=>profile.theme,toast:()=>{},openProfile:()=>{}});
   window.__shareTest.open('pre');
 });
}
test('four variants, actual DOM preview and transient profile-theme default at 390×844',async({page})=>{
 await page.setViewportSize({width:390,height:844});await mountIsolated(page);
 const view=page.locator('#readyShareSettings');
 await expect(view).toBeVisible();await expect(view.locator('[data-share-mode]')).toHaveCount(4);
 await expect(view.locator('[data-share-mode="2"]')).toHaveAttribute('aria-pressed','true');
 await expect(view.locator('[data-share-card-image]')).toBeVisible();
 await expect(view.locator('[data-share-card-image]')).toHaveJSProperty('naturalWidth',720);
 await expect(view.locator('[data-share-crew] input')).toHaveCount(2);
 const footer=await view.locator('.rss-footer [data-share-submit]').boundingBox();
 expect(footer.y+footer.height).toBeLessThanOrEqual(844);
 await view.locator('[data-share-mode="3"]').click();
 await expect(view.locator('[data-share-title]')).toHaveText('탐험 완료 공유');
 await expect(view.locator('[data-share-field="target"]').locator('..')).toBeHidden();
 await expect(view.locator('[data-share-field="focus"]').locator('..')).toBeVisible();
 await view.locator('[data-share-crew="dubi"]').uncheck();
 await view.locator('[data-share-field="stars"]').uncheck();
 await view.locator('[data-share-message]').fill('함께 떠난 탐험을 기록했어요.');
 await view.locator('[data-share-submit]').click();
 const result=await page.evaluate(()=>window.__shareCalls.findLast(x=>x.type==='preview'));
 expect(result.kind).toBe('result');expect(result.opts.theme).toBe('sail');
 expect(result.opts.crewIds).toEqual(['lori']);expect(result.opts.fields.stars).toBe(false);
 expect(result.opts.messageText).toBe('함께 떠난 탐험을 기록했어요.');
});
test('switching modes never mutates Profile and can restore previous selected crew',async({page})=>{
 await mountIsolated(page);
 const box=page.locator('#readyShareSettings');
 await box.locator('[data-share-crew="dubi"]').uncheck();
 await box.locator('[data-share-mode="0"]').click();
 await expect(box.locator('[data-share-crew="dubi"]')).toHaveCount(1);
 await box.locator('[data-share-crew="dubi"]').check();
 await box.locator('[data-share-mode="2"]').click();
 await expect(box.locator('[data-share-crew="dubi"]')).toBeChecked();
 await expect(box.locator('[data-share-mode="2"]')).toHaveAttribute('aria-pressed','true');
});
test('real registry blocks missing share binaries; UI cannot fabricate art',async({page})=>{
 await page.goto(url);
 const result=await page.evaluate(async()=>await window.ReadyShareVisualAssets.bootstrap());
 expect(result.ok).toBe(false);
 expect(await page.evaluate(()=>window.ReadyShareVisualAssets.scene('drop','pre'))).toBeNull();
});
