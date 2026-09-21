(function(root){
  'use strict';

  const PROFILES=Object.freeze({
    COMPLETED:{state:'COMPLETED',label:'완료',historyLabel:'작전 완료',shareTitle:'오늘의 탐험 완료',shareText:'Ready & Set · 오늘의 탐험 완료!',done:true},
    PARTIAL:{state:'PARTIAL',label:'일부 남음',historyLabel:'일부 남음',shareTitle:'오늘은 여기까지',shareText:'Ready & Set · 오늘은 여기까지 했어요.',headline:'여기까지 했어요.',line:'남은 건 Planner가 이어서 정리해둘게.',done:false},
    DEFERRED:{state:'DEFERRED',label:'다음에',historyLabel:'다음에 이어서',shareTitle:'다음 탐험으로 이어가요',shareText:'Ready & Set · 다음 탐험으로 이어가요.',headline:'오늘은 여기까지.',line:'다음 탐험으로 넘겨둘게.',done:false},
    WAITING_FOR_PARENT:{state:'WAITING_FOR_PARENT',label:'부모 도움',historyLabel:'부모 도움 필요',shareTitle:'도움이 필요한 탐험',shareText:'Ready & Set · 도움이 필요한 지점을 남겼어요.',headline:'도움이 필요해요.',line:'부모님 확인이 필요한 일로 표시했어요.',done:false},
    BLOCKED:{state:'BLOCKED',label:'막힘',historyLabel:'막힘',shareTitle:'막힌 지점을 찾았어요',shareText:'Ready & Set · 해결이 필요한 지점을 찾았어요.',headline:'막힌 지점 발견.',line:'그냥 넘기지 않고 해결이 필요한 일로 남겼어요.',done:false},
    MIXED:{state:'MIXED',label:'과제별 결과',historyLabel:'과제별 결과',shareTitle:'오늘 탐험을 정리했어요',shareText:'Ready & Set · 오늘 탐험 결과를 과제별로 정리했어요.',headline:'오늘 탐험을 정리했어요.',line:'과제마다 끝난 상태를 그대로 기록했어요.',done:false}
  });

  function outcomeProfile(record={}){
    const state=record.outcomeState||'COMPLETED';
    return PROFILES[state]||PROFILES.COMPLETED;
  }

  function resultSceneFor(record={}){
    const profile=outcomeProfile(record);
    if(!profile.done)return {headline:profile.headline,line:profile.line,label:'결과'};
    const delta=record.deltaMs||0;
    if(delta<=-120000)return {headline:'엣헴~! 오늘 좀 했습니다.',line:'잠깐… 시계보다 먼저 왔는데?',label:'TIME SAVE'};
    if(Math.abs(delta)<=60000)return {headline:'오? 계산대로인데?',line:'시계랑 거의 동시에 들어왔어요.',label:'차이'};
    if(delta>0)return {headline:'무사 귀환!',line:'헤헤… 조금 늦었습니다. 그래도 작전 완료!',label:'차이'};
    if((record.issueMs||0)>120000)return {headline:'오늘은 사건이 좀 많았습니다.',line:'그래도 다시 돌아와서 끝냈네.',label:'차이'};
    return {headline:'작전 완료!',line:'오늘도 끝까지 잘 돌아왔어요.',label:'차이'};
  }

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));
    const fmt=options.formatTime||((v)=>String(v??''));
    const applyAvatar=options.applyAvatar||(()=>{});
    const applyGuide=options.applyGuide||(()=>{});
    const sceneFor=options.resultSceneFor||resultSceneFor;

    function renderResult(record){
      if(!record)return {ok:false,reason:'NO_RESULT'};
      applyAvatar(q('#resultAvatar'));
      applyGuide(q('#resultGuidePortrait'));
      const guest=q('#resultGuestPortrait');
      if(guest){
        if(record.recordingDone&&record.guestType){guest.hidden=false;applyGuide(guest,record.guestType);guest.classList.add('guest')}
        else guest.hidden=true;
      }
      const scene=sceneFor(record);
      const headline=q('#resultHeadline');if(headline)headline.textContent=scene.headline;
      const line=q('#resultLine');if(line)line.textContent=scene.line;
      const tasks=q('#resultTasks');if(tasks)tasks.textContent=[...(record.selected||[]),...(record.tasks||[])].join(' · ');
      const target=q('#resultTarget');if(target)target.textContent=fmt(record.targetMs);
      const focus=q('#resultFocus');if(focus)focus.textContent=fmt(record.focusMs);
      const dl=q('#deltaLabel');if(dl)dl.textContent=scene.label;
      const delta=q('#resultDelta');if(delta)delta.textContent=fmt(Math.abs(record.deltaMs||0));
      return {ok:true};
    }

    function renderHistory(records=[]){
      const el=q('#historyList');if(!el)return;
      el.innerHTML='';
      if(!records.length){
        el.innerHTML='<div class="historyItem"><b>아직 기록이 없어요.</b><p>첫 탐험을 마치면 여기에 쌓입니다.</p></div>';
        return;
      }
      for(const record of records){
        const x=document.createElement('article');x.className='historyItem';
        const profile=outcomeProfile(record);
        x.innerHTML=`<header><b>${new Date(record.endAt).toLocaleDateString('ko-KR')}</b><small>${escapeHtml(profile.historyLabel)} · ${fmt(record.focusMs)} / ${fmt(record.targetMs)}</small></header><p>${escapeHtml([...(record.selected||[]),...(record.tasks||[])].join(' · '))}</p>`;
        el.appendChild(x);
      }
    }

    function renderCalendar(records=[]){
      const el=q('#calendarList');if(!el)return;
      el.innerHTML='';
      for(const record of records.slice(0,31)){
        const x=document.createElement('article');x.className='historyItem';
        const profile=outcomeProfile(record);
        x.innerHTML=`<header><b>${new Date(record.endAt).toLocaleDateString('ko-KR')}</b><small>${escapeHtml(profile.historyLabel)}</small></header><p>${escapeHtml([...(record.selected||[]),...(record.tasks||[])].join(' · '))}</p>`;
        el.appendChild(x);
      }
      if(!el.children.length)el.innerHTML='<div class="historyItem"><b>이번 달 작전 기록이 없어요.</b></div>';
    }

    return Object.freeze({outcomeProfile,resultSceneFor,renderResult,renderHistory,renderCalendar});
  }

  root.ReadyRebuildResultHistoryView=Object.freeze({
    version:'READY_REBUILD_RESULT_HISTORY_VIEW_V01',
    PROFILES,
    outcomeProfile,
    resultSceneFor,
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
