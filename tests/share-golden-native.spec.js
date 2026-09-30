const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4173/';

test('production interim assets, Profile theme, pre-share and native image+caption on second gesture',async({page})=>{
  await page.addInitScript(()=>{
    window.__shareCalls=[];
    Object.defineProperty(navigator,'canShare',{configurable:true,value:input=>!!input?.files?.length});
    Object.defineProperty(navigator,'share',{configurable:true,value:input=>{
      window.__shareCalls.push({title:input.title,text:input.text||null,files:input.files?.map(x=>({name:x.name,type:x.type,size:x.size})),
        userActivated:navigator.userActivation?.isActive});
      return Promise.resolve();
    }});
  });
  await page.goto(base);
  await page.evaluate(()=>{
    state.profile.theme='sail';state.profile.shareAvatar=false;state.profile.photo='private source photo';
    state.share={theme:'drop'};state.targetMin=25;
    const date=new Date().toLocaleDateString('sv-SE');
    const added=window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'synthetic_share_task',date,label:'영어 · 단어 외우기',
      source:'PLANNER_ALLOCATION',state:'PLANNED',estimated_minutes:25
    });
    if(added?.todo_id!=='synthetic_share_task')throw new Error('SYNTHETIC_TODO_SETUP_FAILED:'+JSON.stringify(added));
    state.selectedTodoIds=['synthetic_share_task'];
  });
  expect(await page.evaluate(()=>window.ReadySetShare.getTheme())).toBe('sail');
  expect(await page.evaluate(()=>window.ReadySetShare.delivery)).toBe('NATIVE_OS_SHARE_ONLY');
  expect(await page.evaluate(()=>Object.hasOwn(window.ReadySetShare,'setTheme'))).toBe(false);

  const assets=await page.evaluate(async()=>{
    const out=[];
    for(const theme of ['drop','sail'])for(const kind of ['pre','result']){
      const scene=window.ReadyShareVisualAssets.scene(theme,kind);
      const layers=window.ReadyShareVisualAssets.layers(theme,kind);
      const urls=[scene,layers?.sky,layers?.world,layers?.foreground];
      const status=await Promise.all(urls.map(async u=>({u,ok:!!u&&(await fetch(u)).ok})));
      out.push({theme,kind,status});
    }
    return out;
  });
  expect(assets).toHaveLength(4);
  for(const variant of assets){
    expect(variant.status).toHaveLength(4);
    expect(variant.status.every(x=>x.ok)).toBe(true);
  }

  const opened=await page.evaluate(()=>window.ReadySetShare.showPreview('pre'));
  expect(opened).toMatchObject({ok:true,method:'PREVIEW_READY'});
  const preview=page.locator('#readySharePreview');
  await expect(preview).toBeVisible();
  await expect(preview.locator('img')).toHaveAttribute('src',/^blob:/);
  await expect(preview.locator('textarea')).toHaveValue(/오늘의 할 일 1개/);
  await expect(preview.locator('textarea')).toHaveValue(/목표 25:00/);
  const image=await preview.locator('img').evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight}));
  expect(image).toEqual({w:720,h:1280});
  await preview.locator('textarea').fill('동행탐험 공유 문구 테스트');
  await preview.getByRole('button',{name:'모바일 공유 메뉴 열기'}).click();
  const calls=await page.evaluate(()=>window.__shareCalls);
  expect(calls).toHaveLength(1);
  expect(calls[0].files[0].type).toBe('image/png');
  expect(calls[0].files[0].size).toBeGreaterThan(10000);
  expect(calls[0].text).toContain('동행탐험 공유 문구 테스트');
  expect(calls[0].userActivated).toBe(true);
  await preview.getByRole('button',{name:'이미지만 공유'}).click();
  const last=await page.evaluate(()=>window.__shareCalls.at(-1));
  expect(last.files).toHaveLength(1);expect(last.text).toBeNull();
  await preview.getByRole('button',{name:'닫기'}).click();
  await expect(preview).toHaveCount(0);
});

test('Verified mixed result uses production art and cannot manufacture completion count or stars',async({page})=>{
  await page.goto(base);
  await page.evaluate(()=>{
    state.profile.theme='drop';state.profile.shareAvatar=false;
    state.lastResult={endAt:Date.now(),targetMs:900000,focusMs:600000,deltaMs:-300000,
      outcomeState:'MIXED',taskOutcomes:[
        {task_id:'one',label:'영어 문장 녹음',state:'COMPLETED'},
        {task_id:'two',label:'오늘의 연산',state:'PARTIAL'}
      ]};
  });
  const outcome=await page.evaluate(()=>window.ReadySetShare.projectShare('result'));
  expect(outcome.ok).toBe(true);expect(outcome.doneCount).toBe(1);
  expect(outcome.total).toBe(2);expect(outcome.stars).toBe(null);
  const opened=await page.evaluate(()=>window.ReadySetShare.showPreview('result'));
  expect(opened.ok).toBe(true);
  await expect(page.locator('#readySharePreview textarea')).toHaveValue(/완료 1\/2/);
  await expect(page.locator('#readySharePreview img')).toBeVisible();
  await page.locator('#readySharePreview').getByRole('button',{name:'닫기'}).click();
});

test('No record or tasks fails closed instead of sharing made-up data',async({page})=>{
  await page.goto(base);
  const result=await page.evaluate(()=>window.ReadySetShare.showPreview('result'));
  expect(result.ok).toBe(false);
  await expect(page.locator('#readySharePreview')).toHaveCount(0);
});
