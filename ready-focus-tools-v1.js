(() => {
  'use strict';
  const VERSION='2026.09.10-focus-tools-v1';
  const $=s=>document.querySelector(s);
  function taskExplicitlyNeedsRecording(){
    const task=window.ReadyBaseRuntimeV1?.selectedPlannerTask?.();
    if(!task)return false;
    const flags=[task.activityType,task.activity,task.mode,task.tool,task.requiredTool,task.requiredTools,task.activities].flat().filter(Boolean).map(String).join(' ');
    return /녹음|recording|record\b/i.test(flags);
  }
  function ensure(){
    const focus=$('#focusView .focusHeaderTools');
    const rec=$('#recBtn');
    if(!focus||!rec)return;
    rec.hidden=true;
    rec.setAttribute('aria-hidden','true');
    let tools=$('#focusToolsBtn');
    if(!tools){tools=document.createElement('button');tools.id='focusToolsBtn';tools.className='iconButton';tools.type='button';tools.textContent='도구';tools.setAttribute('aria-label','집중 도구 열기');focus.prepend(tools)}
    let sheet=$('#focusToolsSheet');
    if(!sheet){sheet=document.createElement('div');sheet.id='focusToolsSheet';sheet.hidden=true;sheet.innerHTML='<div class="focusToolsCard"><b>집중 도구</b><button type="button" id="focusRecordTool">● 녹음</button><button type="button" id="focusToolsClose">닫기</button></div>';document.body.appendChild(sheet)}
    tools.onclick=()=>{sheet.hidden=!sheet.hidden};
    $('#focusToolsClose').onclick=()=>{sheet.hidden=true};
    $('#focusRecordTool').onclick=()=>{sheet.hidden=true;window.ReadyBaseRuntimeV1?.nav?.('recording')};
    if(taskExplicitlyNeedsRecording()){tools.dataset.suggested='recording';tools.setAttribute('aria-label','집중 도구 열기 · 녹음 필요')}
    let style=$('#focusToolsStyle');if(!style){style=document.createElement('style');style.id='focusToolsStyle';style.textContent='#focusToolsSheet{position:fixed;inset:0;z-index:9998;background:rgba(20,16,14,.38);display:flex;align-items:flex-end}#focusToolsSheet[hidden]{display:none}.focusToolsCard{width:100%;padding:18px 18px calc(18px + env(safe-area-inset-bottom));background:#fffaf5;border-radius:28px 28px 0 0;display:grid;gap:10px}.focusToolsCard b{font-size:18px}.focusToolsCard button{border:0;border-radius:16px;padding:14px;font-weight:800;background:#fff}.focusToolsCard #focusRecordTool{background:#2a231f;color:#fff}#focusToolsBtn[data-suggested="recording"]::after{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-left:4px;vertical-align:top}';document.head.appendChild(style)}
    document.documentElement.dataset.readyFocusTools=VERSION;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.ReadyFocusToolsV1={version:VERSION,render:ensure,validate:()=>({version:VERSION,recordingDefaultHidden:$('#recBtn')?.hidden===true,onDemandTool:!!$('#focusRecordTool'),explicitRecordingSuggestion:true})};
})();