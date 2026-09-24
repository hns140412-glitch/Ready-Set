(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const qa=options.queryAll||((s)=>[...document.querySelectorAll(s)]);
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));
    const localDateKey=options.localDateKey;
    const addDays=options.addDays;
    const weekStart=options.weekStart;
    const itemsForDate=options.itemsForDate;
    const freeWindowsForDate=options.freeWindowsForDate||(()=>[]);
    const stateLabel=options.stateLabel;
    const daypartLabel=value=>value==='MORNING'?'등교 전':value==='AFTER_SCHOOL'?'방과 후':value==='EVENING'?'저녁':'';

    function render({selectedDate,tab,snapshot,isParent=false}={}){
      const chosen=selectedDate||localDateKey();
      const start=weekStart(new Date(chosen+'T12:00:00'));
      const adminJump=q('.plannerAdminJump');if(adminJump)adminJump.hidden=!isParent;
      qa('[data-planner-tab]').forEach(button=>{
        const active=button.dataset.plannerTab===tab;
        button.classList.toggle('on',active);
        button.setAttribute('aria-selected',active?'true':'false');
        button.setAttribute('tabindex',active?'0':'-1');
      });
      const weekPanel=q('#plannerWeekPanel'),dayPanel=q('#plannerDayPanel');
      if(weekPanel)weekPanel.hidden=tab!=='week';
      if(dayPanel)dayPanel.hidden=tab!=='day';
      const strip=q('#plannerWeekStrip'),detail=q('#plannerWeekDetail');
      if(!strip||!detail)return {ok:false,reason:'PLANNER_VIEW_MISSING'};
      const dates=Array.from({length:7},(_,i)=>addDays(start,i));
      const names=['월','화','수','목','금','토','일'];
      const todayKey=localDateKey();
      strip.innerHTML='';
      dates.forEach((d,i)=>{
        const key=localDateKey(d),items=itemsForDate(key,snapshot);
        const button=document.createElement('button');
        button.type='button';
        button.className='plannerDayChip'+(key===chosen?' on':'')+(key===todayKey?' today':'');
        button.dataset.plannerDate=key;
        button.innerHTML=`<small>${names[i]}</small><b>${d.getDate()}</b><span>${items.length?items.length+'개':'·'}</span>${key===todayKey?'<i>오늘</i>':''}`;
        strip.appendChild(button);
      });

      const selectedItems=itemsForDate(chosen,snapshot);
      const freeWindows=freeWindowsForDate(chosen);
      const itemHtml=selectedItems.map(x=>`
        <article class="plannerWeekItem ${x.kind==='SCHEDULE'?'fixed':''} ${x.schedule_scope==='FAMILY'?'familySchedule':''} ${x.schedule_scope==='CHILD'?'childSchedule':''} ${x.daypart==='MORNING'&&x.kind==='TODO'?'beforeSchool':''}">
          <span class="plannerDot"></span><div><b>${escapeHtml(x.label)}</b><small>${x.daypart?daypartLabel(x.daypart)+' · ':''}${x.time?x.time+' · ':''}${x.meta}${x.minutes?' · '+x.minutes+'분':''}${x.reason&&x.kind==='TODO'?' · '+escapeHtml(x.reason):''}</small></div><em>${stateLabel(x.state)}</em>
        </article>`).join('');
      const freeHtml=freeWindows.length?`<section class="plannerFreeWindows" aria-label="학습 가능 자유 시간"><div class="plannerFreeHead"><b>가능한 자유 시간</b><small>고정 일정을 제외한 실제 여유 구간</small></div><div class="plannerFreeList">${freeWindows.map(w=>`<span><b>${w.start}–${w.end}</b><small>${w.minutes}분</small></span>`).join('')}</div></section>`:'';
      detail.innerHTML=itemHtml+freeHtml||'<div class="plannerEmpty"><b>비어 있는 날이에요.</b><small>필요한 탐험만 가볍게 추가해요.</small></div>';

      const timeline=q('#plannerDayTimeline');
      if(timeline)timeline.innerHTML=selectedItems.length?selectedItems.map((x,i)=>`
        <article class="plannerRouteItem ${x.schedule_scope==='FAMILY'?'familySchedule':''} ${x.schedule_scope==='CHILD'?'childSchedule':''} ${x.kind==='TODO'?'missionItem':''}"><i>${String(i+1).padStart(2,'0')}</i><div><small>${x.kind==='SCHEDULE'?(x.schedule_scope==='CHILD'?'MY SCHEDULE':'FAMILY SCHEDULE'):(x.daypart?daypartLabel(x.daypart)+' · MISSION':'MISSION')}</small><b>${escapeHtml(x.label)}</b><span>${x.time?x.time+' · ':''}${x.minutes?x.minutes+'분 · ':''}${stateLabel(x.state)}${x.reason&&x.kind==='TODO'?' · '+escapeHtml(x.reason):''}</span></div></article>`).join(''):'<div class="plannerEmpty tall"><b>오늘 예정된 탐험이 없어요.</b><small>Mission에서 오늘 할 일을 골라 시작할 수 있어요.</small></div>';

      const dd=new Date(chosen+'T12:00:00');
      const title=q('#plannerDayTitle');if(title)title.textContent=`${dd.getMonth()+1}월 ${dd.getDate()}일 탐험`;
      const missionCount=selectedItems.filter(x=>x.kind==='TODO').length;
      const scheduleCount=selectedItems.filter(x=>x.kind==='SCHEDULE').length;
      const count=q('#plannerDayCount');if(count)count.textContent=missionCount?`탐험 ${missionCount} · 일정 ${scheduleCount}`:`일정 ${scheduleCount}`;
      const hero=q('#plannerHeroTitle');if(hero)hero.textContent=tab==='week'?'이번 주 탐험 지도':'오늘의 탐험 루트';
      return {ok:true,selectedItems};
    }

    return Object.freeze({render});
  }
  root.ReadyRebuildPlannerScreenView=Object.freeze({version:'READY_REBUILD_PLANNER_SCREEN_VIEW_V01',create});
})(typeof globalThis!=='undefined'?globalThis:this);
