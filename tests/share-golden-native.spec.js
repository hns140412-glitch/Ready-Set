const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4173/';
test('Profile theme, actual pre-share, preview and native image+caption on second gesture',async({page})=>{
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
  await page.evaluate(()=>window.ReadySetShare.showPreview('pre'));
  const preview=page.locator('#readySharePreview');
  await expect(preview).toBeVisible();
  await expect(preview.locator('img')).toHaveAttribute('src',/^blob:/);
  await expect(preview.locator('pre')).toContainText('오늘의 할 일 1개');
  await expect(preview.locator('pre')).toContainText('목표 25:00');
  const image=await preview.locator('img').evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight}));
  expect(image).toEqual({w:900,h:600});
  await preview.getByRole('button',{name:'모바일 공유 메뉴 열기'}).click();
  const calls=await page.evaluate(()=>window.__shareCalls);
  expect(calls).toHaveLength(1);
  expect(calls[0].files[0].type).toBe('image/png');
  expect(calls[0].files[0].size).toBeGreaterThan(10000);
  expect(calls[0].text).toContain('오늘의 할 일 1개');
  expect(calls[0].userActivated).toBe(true);
  await preview.getByRole('button',{name:'이미지만 공유'}).click();
  const last=await page.evaluate(()=>window.__shareCalls.at(-1));
  expect(last.files).toHaveLength(1);expect(last.text).toBeNull();
  await preview.getByRole('button',{name:'닫기'}).click();
  await expect(preview).toHaveCount(0);
});
test('Verified mixed result cannot manufacture completion count or stars',async({page})=>{
  await page.goto(base);
  await page.evaluate(()=>{
    state.profile.theme='drop';state.profile.shareAvatar=false;
    state.lastResult={endAt:Date.now(),targetMs:900000,focusMs:600000,deltaMs:-300000,
      outcomeState:'MIXED',taskOutcomes:[
        {task_id:'one',label:'영어 문장 녹음',state:'COMPLETED'},
        {task_id:'two',label:'오늘의 연산',state:'PARTIAL'}
      ]};
  });
  let outcome=await page.evaluate(()=>window.ReadySetShare.projectShare('result'));
  expect(outcome.ok).toBe(true);expect(outcome.doneCount).toBe(1);
  expect(outcome.total).toBe(2);expect(outcome.stars).toBe(null);
  await page.evaluate(()=>window.ReadySetShare.showPreview('result'));
  await expect(page.locator('#readySharePreview pre')).toContainText('완료 1/2');
  await expect(page.locator('#readySharePreview img')).toBeVisible();
  await page.locator('#readySharePreview').getByRole('button',{name:'닫기'}).click();
});
test('No record or tasks fails closed instead of sharing made-up data',async({page})=>{
  await page.goto(base);
  const result=await page.evaluate(()=>window.ReadySetShare.showPreview('result'));
  expect(result.ok).toBe(false);
  await expect(page.locator('#readySharePreview')).toHaveCount(0);
});

test('Generate all four real PNG outputs using synthetic non-personal data',async({page})=>{
  const fs=require('node:fs'),path=require('node:path');
  await page.goto(base);
  await page.evaluate(()=>{
    const date=new Date().toLocaleDateString('sv-SE');
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'synthetic_share_visual',date,label:'과학 탐험',source:'PLANNER_ALLOCATION',
      state:'PLANNED',estimated_minutes:15
    });
    state.selectedTodoIds=['synthetic_share_visual'];state.profile.shareAvatar=false;
    state.targetMin=15;
    state.lastResult={
      endAt:Date.now(),targetMs:900000,focusMs:810000,deltaMs:-90000,outcomeState:'COMPLETED',
      taskOutcomes:[{task_id:'synthetic_task_one',label:'과학 탐험',state:'COMPLETED'}],
      awardReceipt:{verified:true,awarded_stars:3}
    };
  });
  fs.mkdirSync('share-artifacts',{recursive:true});
  for(const theme of ['drop','sail']){
    await page.evaluate(theme=>state.profile.theme=theme,theme);
    for(const kind of ['pre','result']){
      const image=await page.evaluate(async kind=>{
        const canvas=await window.ReadySetShare.renderShareCard(kind);
        if(!canvas?.toDataURL)throw new Error('GOLDEN_CANVAS_NOT_READY:'+JSON.stringify(canvas));
        return {width:canvas.width,height:canvas.height,data:canvas.toDataURL('image/png')};
      },kind);
      expect(image.width).toBe(900);expect(image.height).toBe(600);
      const name='ready-share-'+theme+'-'+kind+'.png';
      const bytes=Buffer.from(image.data.split(',')[1],'base64');
      expect(bytes.length).toBeGreaterThan(10000);
      fs.writeFileSync(path.join('share-artifacts',name),bytes);
    }
  }
});
