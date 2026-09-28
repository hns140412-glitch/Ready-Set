(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const fmt=options.formatTime||((v)=>String(v??''));
    const applyAvatar=options.applyAvatar||(()=>{});
    const applyGuide=options.applyGuide||(()=>{});
    const guideData=options.guideData||(()=>({home:''}));

    function renderChips(rootEl,labels=[]){
      if(!rootEl)return;
      rootEl.replaceChildren();
      labels.slice(0,6).forEach(label=>{
        const span=document.createElement('span');
        span.textContent=String(label);
        rootEl.appendChild(span);
      });
    }

    function render({state={},missionLabels=[],todayTodos=[]}={}){
      applyAvatar(q('#homeAvatar'));
      const hero=q('#heroTime');if(hero)hero.textContent=fmt((state.targetMin||25)*60000);
      const rows=Array.isArray(todayTodos)?todayTodos.filter(x=>x&&x.state!=='SUPERSEDED'):[];
      const remaining=rows.filter(x=>x.state!=='COMPLETED');
      const completed=rows.length-remaining.length;
      const next=remaining.find(x=>['IN_PROGRESS','PLANNED','PARTIAL'].includes(x.state))||remaining[0]||null;
      const rootEl=q('#homeChips');
      renderChips(rootEl,remaining.map(x=>x.label).filter(Boolean));
      const empty=q('#homeTodayEmpty');if(empty)empty.hidden=remaining.length>0;
      const primary=q('#homeNextTaskBtn');
      const headline=q('#homeNextTitle'),meta=q('#homeNextMeta');
      if(state.activeSession){
        if(primary)primary.dataset.nav='focus';
        if(headline)headline.textContent='진행 중인 탐험 이어가기';
        if(meta)meta.textContent='기존 세션을 그대로 이어갑니다.';
      }else if(next){
        if(primary)primary.dataset.nav='mission';
        if(headline)headline.textContent=next.label||'오늘 할 일 확인';
        if(meta)meta.textContent='오늘 남은 할 일 '+remaining.length+'개'+(completed?' · 완료 '+completed+'개':'')+
          (Number.isFinite(next.estimated_minutes)?' · 예상 '+next.estimated_minutes+'분':'');
      }else{
        if(primary)primary.dataset.nav='planner';
        if(headline)headline.textContent='오늘 배정된 할 일 확인';
        if(meta)meta.textContent=rows.length?'오늘 할 일을 모두 완료했어요.':'Planner에서 확정된 오늘 할 일을 확인해요.';
      }
      applyGuide(q('#homeGuidePortrait'));
      const name=q('#homeGuideName');if(name)name.textContent=state.guide?.name||'';
      const line=q('#homeGuideLine');
      if(line){
        line.textContent=state.activeSession
          ?'진행 중인 탐험이 있어요. 이어서 가볼까요?'
          :remaining.length
            ?'오늘 Planner의 남은 탐험 '+remaining.length+'개를 확인해요.'
            :guideData().home;
      }
      return {remaining:remaining.length,completed,nextTodoId:next?.todo_id||null};
    }
    return Object.freeze({render,renderChips});
  }
  root.ReadyRebuildHomeView=Object.freeze({version:'READY_REBUILD_HOME_VIEW_V01',create});
})(typeof globalThis!=='undefined'?globalThis:this);
