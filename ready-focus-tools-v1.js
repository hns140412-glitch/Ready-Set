(() => {
  'use strict';
  const VERSION='2026.09.15-focus-golden-v2';
  const $=s=>document.querySelector(s);

  function activeMissionLabel(){
    const mission=$('#focusMission')?.textContent?.trim();
    if(mission)return mission;
    const c=window.ReadySetRev07?.contract?.();
    const task=c?.tasks?.find(t=>t.task_id===c.active_task_id);
    if(task?.label)return String(task.label);
    const plannerTask=window.ReadyBaseRuntimeV1?.selectedPlannerTask?.();
    return String(plannerTask?.title||plannerTask?.label||'');
  }

  function taskExplicitlyNeedsRecording(){
    const label=activeMissionLabel();
    if(/영어\s*·\s*문장\s*녹음/.test(label))return true;
    const task=window.ReadyBaseRuntimeV1?.selectedPlannerTask?.();
    if(!task)return false;
    const flags=[task.activityType,task.activity,task.mode,task.tool,task.requiredTool,task.requiredTools,task.activities].flat().filter(Boolean).map(String).join(' ');
    return /영어\s*·\s*문장\s*녹음/.test(flags);
  }

  function sessionKey(){
    const session=window.ReadyBaseRuntimeV1?.state?.()?.activeSession||window.state?.activeSession;
    const id=session?.id||window.ReadySetRev07?.contract?.()?.session_id||'active';
    return `ready_focus_recording_done:${id}:${activeMissionLabel()}`;
  }

  function recordingCompleted(){
    try{return sessionStorage.getItem(sessionKey())==='1'}catch{return false}
  }

  function markRecordingCompleted(){
    try{sessionStorage.setItem(sessionKey(),'1')}catch{}
    renderRecState();
  }

  function ensureClockDetails(){
    const clock=$('#focusView .clockHero');
    if(!clock)return;
    for(let n=1;n<=12;n++){
      if(clock.querySelector(`.clockNumber.n${n}`))continue;
      const number=document.createElement('span');
      number.className=`clockNumber n${n}`;
      number.textContent=String(n);
      number.setAttribute('aria-hidden','true');
      clock.appendChild(number);
    }
    let brand=clock.querySelector('.clockBrand');
    if(!brand){
      brand=document.createElement('span');
      brand.className='clockBrand';
      brand.textContent='Ready & Set';
      brand.setAttribute('aria-hidden','true');
      clock.appendChild(brand);
    }
  }

  function applyGoldenCopy(){
    const focus=$('#focusView');
    if(!focus)return;
    const headline=focus.querySelector('.focusTitle h1');
    if(headline)headline.textContent='그냥! 지금 하면 돼!';
    const targetLabel=focus.querySelector('.timeStrip>div:last-child small');
    if(targetLabel)targetLabel.textContent='목표 시간';
    ensureClockDetails();
  }

  function renderRecState(){
    const rec=$('#recBtn');
    if(!rec)return;
    const required=taskExplicitlyNeedsRecording();
    rec.hidden=!required;
    rec.setAttribute('aria-hidden',required?'false':'true');
    rec.setAttribute('aria-label','문장 녹음');
    rec.type='button';
    rec.closest('.timeStrip')?.classList.toggle('recording-required',required);
    const label=rec.querySelector('span');
    const done=required&&recordingCompleted();
    if(label)label.textContent=done?'REC ✓':'REC';
    rec.classList.toggle('completed',done);
    rec.dataset.completed=done?'true':'false';
  }

  function bindRecordingRoundTrip(){
    const rec=$('#recBtn');
    if(rec&&!rec.dataset.goldenBound){
      rec.dataset.goldenBound='1';
      rec.addEventListener('click',()=>{
        if(!taskExplicitlyNeedsRecording())return;
        window.ReadyBaseRuntimeV1?.nav?.('recording');
      });
    }
    const save=$('#saveRecordingBtn');
    if(save&&!save.dataset.goldenBound){
      save.dataset.goldenBound='1';
      save.addEventListener('click',()=>setTimeout(markRecordingCompleted,0));
    }
  }

  function ensure(){
    const focus=$('#focusView .focusHeaderTools');
    const rec=$('#recBtn');
    if(!focus||!rec)return;
    applyGoldenCopy();
    renderRecState();
    bindRecordingRoundTrip();

    let tools=$('#focusToolsBtn');
    if(!tools){tools=document.createElement('button');tools.id='focusToolsBtn';tools.className='iconButton';tools.type='button';tools.textContent='도구';tools.setAttribute('aria-label','집중 도구 열기');focus.prepend(tools)}
    let sheet=$('#focusToolsSheet');
    if(!sheet){sheet=document.createElement('div');sheet.id='focusToolsSheet';sheet.hidden=true;sheet.innerHTML='<div class="focusToolsCard"><b>집중 도구</b><button type="button" id="focusRecordTool">● 녹음</button><button type="button" id="focusToolsClose">닫기</button></div>';document.body.appendChild(sheet)}
    tools.onclick=()=>{sheet.hidden=!sheet.hidden};
    $('#focusToolsClose').onclick=()=>{sheet.hidden=true};
    $('#focusRecordTool').onclick=()=>{sheet.hidden=true;window.ReadyBaseRuntimeV1?.nav?.('recording')};
    if(taskExplicitlyNeedsRecording()){tools.dataset.suggested='recording';tools.setAttribute('aria-label','집중 도구 열기 · 녹음 필요')}else{delete tools.dataset.suggested;tools.setAttribute('aria-label','집중 도구 열기')}

    let style=$('#focusToolsStyle');
    if(!style){
      style=document.createElement('style');
      style.id='focusToolsStyle';
      style.textContent=`
        #focusToolsSheet{position:fixed;inset:0;z-index:9998;background:rgba(20,16,14,.38);display:flex;align-items:flex-end}
        #focusToolsSheet[hidden]{display:none}
        .focusToolsCard{width:100%;padding:18px 18px calc(18px + env(safe-area-inset-bottom));background:#fffaf5;border-radius:28px 28px 0 0;display:grid;gap:10px}
        .focusToolsCard b{font-size:18px}.focusToolsCard button{border:0;border-radius:16px;padding:14px;font-weight:800;background:#fff}.focusToolsCard #focusRecordTool{background:#2a231f;color:#fff}
        #focusToolsBtn[data-suggested="recording"]::after{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-left:4px;vertical-align:top}
        #focusView{isolation:isolate}
        #focusView::before,#focusView::after{content:"";position:absolute;pointer-events:none;z-index:0}
        #focusView::before{width:76vmin;height:76vmin;left:-26vmin;top:18%;opacity:.18;background:repeating-conic-gradient(from -8deg,rgba(20,20,18,.55) 0 2deg,transparent 2deg 14deg);border-radius:50%}
        #focusView::after{right:5%;top:17%;width:86px;height:86px;opacity:.28;background:linear-gradient(45deg,transparent 44%,#1f1e1c 45% 55%,transparent 56%),linear-gradient(-45deg,transparent 44%,#1f1e1c 45% 55%,transparent 56%);transform:rotate(12deg) scale(.42)}
        #focusView .focusHeader,#focusView .focusMain{position:relative;z-index:1}
        #focusView .clockHero::after{content:none!important}
        #focusView .clockBrand{position:absolute;left:50%;top:31%;transform:translateX(-50%);z-index:2;font-size:clamp(11px,3vw,15px);font-weight:950;letter-spacing:-.03em;white-space:nowrap;color:#25231f}
        #focusView .timeStrip{grid-template-columns:1fr 1fr}
        #focusView .timeStrip.recording-required{grid-template-columns:1fr auto 1fr}
        #focusView .recButton{min-width:52px;min-height:52px;width:52px;height:52px;touch-action:manipulation}
        #focusView .recButton.completed span{font-size:9px;letter-spacing:0}
        #focusView .recButton.completed i{box-shadow:0 0 0 3px rgba(255,255,255,.12)}
        @media(max-width:390px){#focusView .clockHero{max-width:68vw;max-height:68vw}#focusView::after{opacity:.18}}
        @media(min-width:760px){#focusView{width:100%;max-width:none}#focusView .focusMain{width:min(430px,calc(100% - 48px));margin-left:auto;margin-right:clamp(28px,8vw,128px)}#focusView .focusHeader{width:min(430px,calc(100% - 48px));margin-left:auto;margin-right:clamp(28px,8vw,128px)}#focusView::before{width:62vmin;height:62vmin;left:4vw;top:14%;opacity:.2}#focusView::after{right:auto;left:22vw;top:56%;transform:rotate(18deg) scale(.7)}}
      `;
      document.head.appendChild(style)
    }
    document.documentElement.dataset.readyFocusTools=VERSION;
  }

  const rerender=()=>setTimeout(ensure,0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.addEventListener('pageshow',rerender);
  document.addEventListener('click',event=>{if(event.target.closest('[data-rev07-task],#focusMission,#recordBackBtn,#saveRecordingBtn'))rerender()});
  window.ReadyFocusToolsV1={version:VERSION,render:ensure,validate:()=>({version:VERSION,recordingRequired:taskExplicitlyNeedsRecording(),recordingVisible:$('#recBtn')?.hidden===false,recordingCompleted:recordingCompleted(),accessibleName:$('#recBtn')?.getAttribute('aria-label')||null,clockNumerals:$('#focusView .clockHero')?.querySelectorAll('.clockNumber').length||0,clockBrand:$('#focusView .clockBrand')?.textContent||null,targetLabel:$('#focusView .timeStrip>div:last-child small')?.textContent||null})};
})();