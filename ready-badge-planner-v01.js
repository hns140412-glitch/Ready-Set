(() => {
  'use strict';

  // Read-only presentation. The authenticated server (not this module) owns
  // family/child authorization, approved badge catalogue and signed Award Ledger.
  // No localStorage, IndexedDB, fake badge award or gem grant is created here.
  const CONTRACT='TAKY_CHILD_BADGE_CALENDAR_V1';
  const ADAPTER='TAKY_AUTHENTICATED_BADGE_READ_ADAPTER_V1';
  const TZ='Asia/Seoul';
  const TYPES=Object.freeze({
    FIRST_ACQUISITION:'첫 발견',
    REACQUISITION:'다시 만난 훈장',
    TIER_PROMOTION:'훈장이 자란 날'
  });
  let adapter=null,revision=0,lastInput=null;
  const $=s=>document.querySelector(s);
  const clean=v=>typeof v==='string'?v.trim():'';
  const dateKey=v=>typeof v==='string'&&/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v);
  const monthKey=v=>typeof v==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(v);

  function currentChild(){
    const s=globalThis.ReadyFamilySession?.current?.();
    if(!s||s.authenticated!==true||s.role!=='CHILD'||
       !/^NETLIFY_IDENTITY(?:_|$)/.test(s.source||'')||
       !clean(s.family_id)||!clean(s.member_id)||!clean(s.session_id))return null;
    return {family_id:s.family_id,child_id:s.member_id,session_id:s.session_id};
  }
  const sameSession=(a,b)=>!!a&&!!b&&a.family_id===b.family_id&&
    a.child_id===b.child_id&&a.session_id===b.session_id;

  // A read adapter is a presentation boundary, never an authorization token.
  // Its server implementation must obtain the child from the trusted session,
  // not accept a child_id from browser request arguments.
  function connectReadAdapter(input){
    if(!input||input.contract!==ADAPTER||typeof input.getMonth!=='function')return {ok:false,reason:'AUTHENTICATED_READ_ADAPTER_REQUIRED'};
    adapter=input;revision++;
    if(lastInput)void render(lastInput);
    return {ok:true,contract:ADAPTER};
  }
  function disconnect(){
    adapter=null;revision++;clearMarks();
    if(lastInput)message('배지 기록 서버 연결 전이에요. 계획은 그대로 사용할 수 있어요.');
  }
  function clearMarks(){
    document.querySelectorAll('.plannerBadgeMark').forEach(el=>el.remove());
    for(const host of ['#plannerWeekBadgeRail','#plannerDayBadgeRail']){
      const el=$(host);if(el){el.replaceChildren();el.dataset.badgeState='unavailable';}
    }
  }
  function message(t){
    for(const host of ['#plannerWeekBadgeRail','#plannerDayBadgeRail']){
      const el=$(host);if(!el)continue;
      el.replaceChildren();
      el.dataset.badgeState='unavailable';
      const p=document.createElement('p');p.className='plannerBadgeNote';p.textContent=t;el.append(p);
    }
  }
  function validatedMonth(result,month,session){
    if(!result||result.ok!==true||result.contract!==CONTRACT||result.time_zone!==TZ||
       result.family_id!==session.family_id||result.child_id!==session.child_id||
       result.month!==month||!Array.isArray(result.days))return null;
    const days=new Map(),ids=new Set;
    for(const day of result.days){
      if(!day||!dateKey(day.date)||day.date.slice(0,7)!==month||
         days.has(day.date)||!Array.isArray(day.events))return null;
      const entries=[];
      for(const event of day.events){
        if(!event||!clean(event.award_id)||ids.has(event.award_id)||
           !clean(event.badge_id)||!Object.hasOwn(TYPES,event.event_type)||
           event.calendar_date!==day.date||
           event.date_status!=='VERIFIED_AWARD_TIME'||!clean(event.awarded_at)||
           !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(event.awarded_at))
          return null;
        ids.add(event.award_id);
        entries.push({
          award_id:event.award_id,calendar_date:day.date,badge_id:event.badge_id,
          badge_title:clean(event.badge_title)||'획득한 훈장',
          event_type:event.event_type,awarded_at:event.awarded_at
        });
      }
      if(day.award_count!==entries.length)return null;
      days.set(day.date,entries);
    }
    return days;
  }
  function eventLabel(event){
    return event.badge_title+' · '+TYPES[event.event_type];
  }
  function addChip(host,event){
    const el=document.createElement('span');el.className='plannerBadgeChip';
    const pin=document.createElement('span');pin.className='plannerBadgePin';pin.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent=eventLabel(event);
    el.append(pin,label);host.append(el);
  }
  function draw(hostId,heading,events,emptyCopy){
    const el=$(hostId);if(!el)return;
    el.replaceChildren();el.dataset.badgeState='verified';
    const head=document.createElement('div');head.className='plannerBadgeHeader';
    const name=document.createElement('b');name.textContent=heading;
    const count=document.createElement('small');
    count.textContent=events.length?events.length+'개의 획득 기록':'성취의 흔적';
    head.append(name,count);el.append(head);
    if(!events.length){
      const p=document.createElement('p');p.className='plannerBadgeNote';p.textContent=emptyCopy;el.append(p);
      return;
    }
    const chips=document.createElement('div');chips.className='plannerBadgeChips';
    // Show a compact celebration, never a leaderboard or pressure to collect.
    events.slice(-3).reverse().forEach(event=>addChip(chips,event));
    if(events.length>3){
      const more=document.createElement('span');more.className='plannerBadgeMore';more.textContent='기록 '+(events.length-3)+'건 더';chips.append(more);
    }
    el.append(chips);
  }
  async function render(input={}){
    const date=input.selectedDate,week=input.weekDates;
    if(!dateKey(date)||!Array.isArray(week)||week.length!==7||
       week.some(d=>!dateKey(d))||new Set(week).size!==7)return {ok:false,reason:'PLANNER_DATE_SCOPE_REQUIRED'};
    lastInput={selectedDate:date,weekDates:[...week]};
    const seq=++revision;
    clearMarks();
    const session=currentChild();
    if(!session){
      message('아이의 인증된 배지 기록이 연결되면 여기에 나타나요.');
      return {ok:false,reason:'VERIFIED_CHILD_SESSION_REQUIRED'};
    }
    if(!adapter){
      message('배지 기록 서버 연결 전이에요. 계획은 그대로 사용할 수 있어요.');
      return {ok:false,reason:'BADGE_READ_ADAPTER_NOT_CONNECTED'};
    }
    const months=[...new Set(week.map(x=>x.slice(0,7)).concat(date.slice(0,7)))];
    if(months.some(x=>!monthKey(x)))return {ok:false,reason:'INVALID_CALENDAR_MONTH'};
    let raw;
    try{raw=await Promise.all(months.map(month=>adapter.getMonth({month})))}
    catch{
      if(seq===revision){clearMarks();message('획득 기록을 확인할 수 없어요. 계획은 그대로 사용할 수 있어요.');}
      return {ok:false,reason:'AUTHENTICATED_HISTORY_READ_FAILED'};
    }
    if(seq!==revision||!sameSession(currentChild(),session))return {ok:false,reason:'STALE_OR_CHANGED_FAMILY_SESSION'};
    const monthMaps=months.map((month,i)=>validatedMonth(raw[i],month,session));
    if(monthMaps.some(x=>!x)){
      clearMarks();message('확인되지 않은 기록은 표시하지 않아요.');
      return {ok:false,reason:'VERIFIED_BADGE_MONTH_CONTRACT_REQUIRED'};
    }
    const dates=new Map;
    for(const map of monthMaps)for(const [key,value] of map)dates.set(key,value);
    const dayEvents=dates.get(date)||[];
    const weekEvents=week.flatMap(key=>dates.get(key)||[])
      .sort((a,b)=>a.awarded_at.localeCompare(b.awarded_at)||a.award_id.localeCompare(b.award_id));
    const daySorted=[...dayEvents].sort((a,b)=>a.awarded_at.localeCompare(b.awarded_at));
    draw('#plannerWeekBadgeRail','이번 주 탐험의 흔적',weekEvents,
      '아직 기록된 새 훈장은 없어요. 오늘의 탐험은 그 자체로 충분해요.');
    draw('#plannerDayBadgeRail','이날 발견한 훈장',daySorted,
      '이날의 새 훈장은 없어요. 작은 탐험도 기록으로 남아요.');
    for(const chip of document.querySelectorAll('[data-planner-date]')){
      const events=dates.get(chip.dataset.plannerDate)||[];
      if(!events.length)continue;
      const pin=document.createElement('span');
      pin.className='plannerBadgeMark';pin.textContent='훈장 '+events.length;
      chip.append(pin);
      chip.setAttribute('aria-label',(chip.getAttribute('aria-label')||chip.textContent)+' · 획득 훈장 '+events.length);
    }
    return {ok:true,week_records:weekEvents.length,day_records:dayEvents.length};
  }
  window.addEventListener('readyset-family-session',()=>{
    revision++;clearMarks();
    if(lastInput)void render(lastInput);
  });
  window.ReadyBadgePlannerHighlights=Object.freeze({
    version:'0.1.0',contract:ADAPTER,connectReadAdapter,disconnect,render
  });
})();
