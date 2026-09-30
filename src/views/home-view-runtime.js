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
      const next=remaining.find(x=>['IN_PROGRESS','PLANNED','PARTIAL'].includes(x.state))||null;
      const rootEl=q('#homeChips');
      renderChips(rootEl,remaining.map(x=>x.label).filter(Boolean));
      const empty=q('#homeTodayEmpty');if(empty){empty.hidden=remaining.length>0;empty.textContent=rows.length?'오늘 배정된 일을 모두 완료했어요.':'오늘 배정된 Planner 할 일이 아직 없어요.';}
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
        if(headline)headline.textContent=remaining.length?'확인이 필요한 할 일이 있어요.':'오늘 배정된 할 일 확인';
        if(meta)meta.textContent=remaining.length?'대기·도움·막힘 상태를 Planner에서 확인해요.':rows.length?'오늘 할 일을 모두 완료했어요.':'Planner에서 확정된 오늘 할 일을 확인해요.';
      }
      // Companion portrait/name/dialogue belongs exclusively to the selected
      // expedition ID presenter. Never paint the legacy Guide before manifest
      // verification or overwrite a real selected companion's sourced line.
      return {remaining:remaining.length,completed,nextTodoId:next?.todo_id||null};
    }
    return Object.freeze({render,renderChips});
  }
  root.ReadyRebuildHomeView=Object.freeze({version:'READY_REBUILD_HOME_VIEW_V01',create});
})(typeof globalThis!=='undefined'?globalThis:this);
