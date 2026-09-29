const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4173/';
async function task(page){
 await page.evaluate(()=>{
  const date=new Date().toLocaleDateString('sv-SE');
  window.ReadySetPlanner.upsertDatedTodo({todo_id:'share_ui_fixture',date,label:'영어 단어 외우기',
    source:'PLANNER_ALLOCATION',state:'PLANNED',estimated_minutes:25});
  state.selectedTodoIds=['share_ui_fixture'];state.targetMin=25;
  state.profile.theme='drop';state.profile.shareAvatar=false;state.profile.photo='LOCAL_CHILD_SOURCE_PHOTO_MUST_NOT_SHARE';
  state.expedition={selectedCompanionIds:['dubi','lori'],primaryCompanionId:'dubi',primaryCompanionAlias:'두비'};
 });
}
async function fixture(page){
 await page.evaluate(()=>{
  window.ReadyShareVisualAssets={scene:(theme,kind)=>{
   const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1280"><rect width="1800" height="1280" fill="#83cfed"/><text x="500" y="350" font-size="90">FUNCTION TEST ONLY</text></svg>';
   return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }};
 });
}
test('share setting screen is real UI, four selectable variants and profile-owned crew',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(base);await task(page);
 await page.evaluate(()=>window.ReadySetShare.configure('pre'));
 const ui=page.locator('#readyShareConfigurator');
 await expect(ui).toBeVisible();await expect(ui.locator('[data-share-variant]')).toHaveCount(4);
 await expect(ui.locator('[data-share-avatar]')).toBeDisabled();
 await expect(ui.locator('.rs-share-crew-item')).toHaveCount(2);
 await expect(ui.locator('.rs-share-crew-item')).toContainText(['두비','lori']);
 await expect(ui).not.toContainText('LOCAL_CHILD_SOURCE_PHOTO_MUST_NOT_SHARE');
 await expect(ui.locator('[data-share-variant="drop:pre"]')).toHaveAttribute('aria-pressed','true');
 await expect(ui.locator('[data-share-variant="drop:result"]')).toBeDisabled();
 await ui.locator('[data-share-variant="sail:pre"]').click();
 await expect(ui.locator('[data-share-variant="sail:pre"]')).toHaveAttribute('aria-pressed','true');
 await ui.locator('[data-share-style="warm"]').click();
 await expect(ui.locator('[data-share-style="warm"]')).toHaveClass(/selected/);
 await ui.locator('[data-share-field="target"]').uncheck();
 await fixture(page);
 await ui.locator('[data-share-preview]').click();
 await expect(page.locator('#readyShareConfigurator')).toHaveCount(0);
 const preview=page.locator('#readySharePreview');
 await expect(preview).toBeVisible();
 const caption=await preview.locator('textarea').inputValue();
 expect(caption).not.toContain('목표 25:00');
 expect(caption).toContain('오늘도 함께 천천히 출발하자');
 await preview.getByRole('button',{name:'닫기'}).click();
});
test('missing four asset scenes cannot be promoted to a fake share image',async({page})=>{
 await page.goto(base);await task(page);
 await page.evaluate(()=>window.ReadySetShare.configure('pre'));
 await page.locator('[data-share-preview]').click();
 await expect(page.locator('#readySharePreview')).toHaveCount(0);
 await expect(page.locator('#readyShareConfigurator')).toBeVisible();
});
