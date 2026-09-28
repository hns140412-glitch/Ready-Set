const {test,expect}=require('@playwright/test');

function fakeMicrophone({empty=false,denied=false}={}){
  return ({empty,denied})=>{
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{
      getUserMedia:async()=>{
        if(denied){const e=new Error('denied');e.name='NotAllowedError';throw e;}
        return {getTracks:()=>[{stop(){}}]};
      }
    }});
    window.MediaRecorder=class {
      constructor(stream,opts){this.stream=stream;this.mimeType=opts?.mimeType||'audio/webm';this.state='inactive';}
      static isTypeSupported(type){return type==='audio/webm'||type==='audio/webm;codecs=opus';}
      start(){this.state='recording';}
      stop(){this.state='inactive';const blob=new Blob(empty?[]:['test microphone evidence'],{type:'audio/webm'});this.ondataavailable?.({data:blob});this.onstop?.();}
    };
  };
}
async function startTypedRecording(page){
  const today=await page.evaluate(()=>new Date().toLocaleDateString('sv-SE'));
  await page.evaluate(today=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'typed_recording_e2e',date:today,label:'영어 문장 녹음',
    source:'PLANNER_ALLOCATION',state:'PLANNED',estimated_minutes:10,
    activity_types:['RECORDING']
  }),today);
  await page.locator('#homeView [data-nav="mission"]').first().click();
  await page.locator('#plannerTodayList [data-todo-id="typed_recording_e2e"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();
  await expect(page.locator('#recBtn')).toBeVisible();
}
test('approved mobile/tablet Focus DOM preserves real controls, tablet right anchor',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  const ids=['focusView','focusSoundBtn','clockHero','hourHand','minuteHand','secondHand','remainingTime','targetTime','focusMission','pauseBtn','completeBtn','focusElapsed','issueElapsed','startClock','recBtn'];
  for(const id of ids)await expect(page.locator('#'+id)).toHaveCount(1);
  await page.setViewportSize({width:1200,height:850});
  const r=await page.locator('#focusView .focusMain').evaluate(el=>el.getBoundingClientRect().toJSON());
  expect(r.width).toBeLessThanOrEqual(430);
  expect(r.right).toBeGreaterThan(1000);
  await expect(page.locator('#focusView .focusTitle h1')).toHaveCount(1);
});
test('REC is bound to typed task, continues same timer, saves real blob, returns to Focus and result',async({page})=>{
  await page.addInitScript(fakeMicrophone(),{empty:false,denied:false});
  await page.goto('http://127.0.0.1:4173/');
  await startTypedRecording(page);
  const sid=await page.evaluate(()=>window.ReadySetRev07.contract().session_id);
  await page.locator('#recBtn').click();
  await expect(page.locator('#recIntro')).toBeVisible();
  await page.locator('#goRecordBtn').click();
  await expect(page.locator('#recordingView')).toBeVisible();
  const before=await page.locator('#recordTimerContext').innerText();
  await page.locator('#recordAction').click();
  await expect(page.locator('#recordState')).toHaveText('RECORDING');
  await page.waitForTimeout(1300);
  const after=await page.locator('#recordTimerContext').innerText();
  expect(after).not.toBe(before);
  await page.locator('#recordAction').click();
  await expect(page.locator('#reviewPanel')).toBeVisible();
  await expect(page.locator('#audioPreview')).toHaveAttribute('src',/^blob:/);
  await expect(page.locator('.coachCards')).toContainText('녹음 파일이 생성됐어요.');
  await page.locator('#saveRecordingBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();
  expect(await page.evaluate(()=>window.ReadySetRev07.contract().session_id)).toBe(sid);
  const ref=await page.evaluate(()=>state.activeSession.recordingRef);
  expect(ref.audio_id).toBeTruthy();
  expect(ref.task_id).toBe(await page.evaluate(()=>window.ReadySetRev07.contract().active_task_id));
  expect(ref.type).toContain('audio/webm');
  await page.locator('#completeBtn').click();
  await expect(page.locator('#readyRev07Wrap')).toBeVisible();
  await expect(page.locator('#outcomeModal')).toBeHidden();
  const id=await page.evaluate(()=>window.ReadySetRev07.contract().active_task_id);
  await page.locator('[data-wrap-state="COMPLETED"][data-task-id="'+id+'"]').click();
  await page.locator('#rev07ConfirmEnd').click();
  await expect(page.locator('#resultView')).toBeVisible();
  await expect(page.locator('#resultRecordingCard')).toBeVisible();
  await expect(page.locator('#resultRecordingAudio')).toHaveAttribute('src',/^blob:/);
});
test('empty capture is not offered as a saved recording',async({page})=>{
  await page.addInitScript(fakeMicrophone(),{empty:true,denied:false});
  await page.goto('http://127.0.0.1:4173/');
  await startTypedRecording(page);
  await page.locator('#recBtn').click();await page.locator('#goRecordBtn').click();
  await page.locator('#recordAction').click();await page.locator('#recordAction').click();
  await expect(page.locator('#reviewPanel')).toBeHidden();
  await expect(page.locator('#toast')).toContainText('녹음된 소리가 없어');
});
test('mic denial is visible, fails closed and leaves same session recoverable',async({page})=>{
  await page.addInitScript(fakeMicrophone(),{empty:false,denied:true});
  await page.goto('http://127.0.0.1:4173/');
  await startTypedRecording(page);
  const sid=await page.evaluate(()=>window.ReadySetRev07.contract().session_id);
  await page.locator('#recBtn').click();await page.locator('#goRecordBtn').click();
  await page.locator('#recordAction').click();
  await expect(page.locator('#toast')).toContainText('마이크 권한');
  await page.locator('#recordBackBtn').click();
  await expect(page.locator('#focusView')).toBeVisible();
  expect(await page.evaluate(()=>window.ReadySetRev07.contract().session_id)).toBe(sid);
});
