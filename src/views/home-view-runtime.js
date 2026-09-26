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
      rootEl.innerHTML='';
      labels.slice(0,6).forEach(label=>{
        const span=document.createElement('span');
        span.textContent=label;
        rootEl.appendChild(span);
      });
    }

    function render({state,missionLabels=[],missionItems=[]}={}){
      applyAvatar(q('#homeAvatar'));
      const hero=q('#heroTime');if(hero)hero.textContent=fmt((state.targetMin||25)*60000);
      const primary=missionItems.find(x=>x?.state==='PLANNED')||missionItems[0]||null;
      const primaryTitle=q('#homePrimaryTitle');
      const primaryMeta=q('#homePrimaryMeta');
      if(primaryTitle)primaryTitle.textContent=state.activeSession?'진행 중인 탐험 이어가기':(primary?.label||'오늘의 탐험을 준비해요');
      if(primaryMeta){
        primaryMeta.textContent=state.activeSession
          ?'진행 중인 세션이 있어요. 준비되면 바로 이어갈 수 있어요.'
          :primary
            ?`${primary.daypart==='MORNING'?'등교 전 · ':''}${primary.minutes?primary.minutes+'분 · ':''}Planner가 오늘 일정에 배정했어요.`
            :'Planner에 오늘 할 일이 생기면 여기 가장 먼저 보여요.';
      }
      const count=q('#homeTodayCount');if(count)count.textContent=missionItems.length?`${missionItems.length}개`:'비어 있음';
      renderChips(q('#homeChips'),missionLabels);
      applyGuide(q('#homeGuidePortrait'));
      const guideName=q('#homeGuideName');if(guideName)guideName.textContent=state.guide.name;
      const line=q('#homeGuideLine');
      if(line){
        line.textContent=state.activeSession
          ?'진행 중인 탐험이 있어요. 이어서 가볼까요?'
          :missionLabels.length
            ?`오늘 Planner가 준비한 탐험 ${missionLabels.length}개가 있어요.`
            :guideData().home;
      }
    }
    return Object.freeze({render,renderChips});
  }
  root.ReadyRebuildHomeView=Object.freeze({version:'READY_REBUILD_HOME_VIEW_V01',create});
})(typeof globalThis!=='undefined'?globalThis:this);
