(() => {
  'use strict';
  const VERSION='2026.09.08-stage-e2';
  const STORE_KEY='readyset_planner_v1';
  const RELOAD_KEY='ready_stage_e_seed_reload';
  const TALENT_BASELINES={
    '연산':{min:8,max:12,load:'낮음~보통'},'한자':{min:8,max:12,load:'낮음~보통'},
    '국어':{min:10,max:15,load:'보통'},'사회':{min:10,max:15,load:'보통'},
    '수학':{min:15,max:20,load:'보통~높음'},'생각하는 피자':{min:15,max:20,load:'보통~높음'}
  };
  const DAY_RULES={
    WED:{offset:1,label:'수',capacity:10,maxSubjects:1},
    THU:{offset:2,label:'목',capacity:15,maxSubjects:2},
    FRI:{offset:3,label:'금',capacity:10,maxSubjects:1},
    SAT:{offset:4,label:'토',capacity:20,maxSubjects:2},
    NEXT_TUE:{offset:7,label:'다음 화',capacity:20,maxSubjects:2,carry:true}
  };
  const PREF={
    '사회':['WED','SAT','NEXT_TUE'],'한자':['WED','SAT','NEXT_TUE'],
    '생각하는 피자':['THU','SAT','NEXT_TUE'],'국어':['THU','SAT','NEXT_TUE'],
    '수학':['FRI','SAT','NEXT_TUE'],'연산':['THU','SAT','NEXT_TUE']
  };
  const id=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const localDate=()=>new Date().toLocaleDateString('sv-SE');
  const datePlus=(base,days)=>{const d=new Date(`${base}T12:00:00`);d.setDate(d.getDate()+days);return d.toLocaleDateString('sv-SE')};
  const load=()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||'null')||{version:1,days:{},talentWeek:{}}}catch{return{version:1,days:{},talentWeek:{}}}};
  const save=p=>localStorage.setItem(STORE_KEY,JSON.stringify(p));
  const ensureDay=(p,date)=>p.days[date]||(p.days[date]={localDate:date,createdAt:new Date().toISOString(),scheduleNote:'',tasks:[]});

  function normalizeToday(){
    const p=load(),day=p.days?.[localDate()]; if(!day)return false;
    const science=day.tasks?.find(t=>t.title==='월요일 과학 숙제');
    if(science && science.selected===false){science.selected=true;save(p);return true}
    return false;
  }
  function buildSlots(base){
    return Object.fromEntries(Object.entries(DAY_RULES).map(([key,r])=>[key,{...r,key,date:datePlus(base,r.offset),used:0,subjects:[]} ]));
  }
  function conflict(slot,subject){
    if(slot.subjects.length>=slot.maxSubjects)return true;
    const heavy=subject==='수학'||subject==='생각하는 피자';
    return heavy && slot.subjects.some(x=>(x==='수학'||x==='생각하는 피자')&&x!==subject);
  }
  function chooseSlot(slots,item){
    const preferred=(PREF[item.subject]||['SAT','NEXT_TUE']).map(k=>slots[k]);
    const fits=preferred.find(s=>!conflict(s,item.subject) && s.used+item.totalMin<=s.capacity);
    if(fits)return {slot:fits,warning:null};
    const available=preferred.filter(s=>!conflict(s,item.subject));
    if(available.length){
      const slot=available.sort((a,b)=>(a.used+a.capacity)-(b.used+b.capacity))[0];
      return {slot,warning:'CAPACITY_OVERFLOW'};
    }
    return {slot:slots.NEXT_TUE,warning:'CAPACITY_OVERFLOW'};
  }
  function distribute(p,base,items,batchId){
    Object.values(p.days||{}).forEach(day=>day.tasks=(day.tasks||[]).filter(t=>t.talentBatchId!==batchId));
    const slots=buildSlots(base),created=[];
    items.forEach(item=>{
      const {slot,warning}=chooseSlot(slots,item);
      slot.used+=item.totalMin;slot.subjects.push(item.subject);
      const task={id:id('todo'),localDate:slot.date,subject:'재능',talentSubject:item.subject,sourceDay:'화요일 배포',
        title:`재능 · ${item.subject}`,volume:item.volume,difficulty:item.difficulty,estimatedMin:item.totalMin,estimateKind:item.estimateKind,
        deadline:'다음 화요일 방문 전',selected:false,status:'PLANNED',required:true,talentBatchId:batchId,allocationWarning:warning,
        gradingFlow:'CHILD_SOLVE → DAYTIME_PARENT_GRADING → NEXT_STUDY_FIRST_CORRECTION',
        note:`선생님 지정 분량 유지 · 과목/교재 단위 보존${warning?' · 보호 시간창 초과: 실제 소요시간 확인 후 재배치 필요':''}`};
      ensureDay(p,slot.date).tasks.push(task);created.push(task);
    });
    const overflowMinutes=Object.values(slots).reduce((sum,s)=>sum+Math.max(0,s.used-s.capacity),0);
    p.talentWeek=p.talentWeek||{};
    p.talentWeek[batchId]={batchId,sourceDate:base,createdAt:new Date().toISOString(),items,
      allocation:created.map(t=>({date:t.localDate,subject:t.talentSubject,minutes:t.estimatedMin,warning:t.allocationWarning||null})),overflowMinutes};
    return {created,overflowMinutes,slots};
  }
  function talentItems(){
    return [...document.querySelectorAll('[data-talent]')].flatMap(row=>{
      const subject=row.dataset.talent,volume=row.querySelector('.talent-volume')?.value.trim()||''; if(!volume)return[];
      const manual=Number(row.querySelector('.talent-min')?.value),base=TALENT_BASELINES[subject];
      return[{subject,volume,difficulty:base.load,totalMin:manual>0?manual:Math.round((base.min+base.max)/2),estimateKind:manual>0?'MANUAL':'BASELINE'}];
    });
  }
  function interceptTalent(e){
    const btn=e.target.closest?.('[data-plan-action="talent-create"]'); if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const items=talentItems(); if(!items.length){toast('먼저 선생님이 준 재능 분량을 입력해 주세요.');return;}
    const p=load(),base=localDate(),batchId=`talent_${base}`,result=distribute(p,base,items,batchId);save(p);
    window.ReadyStageD?.renderPlanner?.();
    toast(result.overflowMinutes>0
      ? `주간 배포 완료 · ${result.overflowMinutes}분은 보호 시간창 초과라 조정 필요로 표시했어요.`
      : `재능 ${items.length}과목을 과목 단위로 주간 배포했어요.`);
  }
  function fmtDate(date){
    try{return new Intl.DateTimeFormat('ko-KR',{weekday:'short',month:'numeric',day:'numeric'}).format(new Date(`${date}T12:00:00`))}catch{return date}
  }
  function addSummary(){
    const p=load(),batch=p.talentWeek?.[`talent_${localDate()}`];
    const panel=document.querySelector('#todayPlannerCard .talent-panel');if(!panel)return;
    const action=panel.querySelector('[data-plan-action="talent-create"]');if(action)action.textContent='주간 재능 숙제 배포';
    if(!batch)return;
    let div=document.getElementById('talentWeekSummary');
    if(!div){div=document.createElement('div');div.id='talentWeekSummary';div.className='planner-schedule';panel.before(div)}
    const rows=batch.allocation.map(a=>`${fmtDate(a.date)} · ${a.subject} · ${a.minutes}분${a.warning?' · 조정 필요':''}`);
    div.innerHTML=`<b>재능 주간 배포</b><br>${rows.join('<br>')}<br><small>월요일·일요일 OFF · 재능은 먼저 풀고, 부모 낮 채점 후 다음 학습 시작 때 오답 우선</small>`;
  }
  function patchPlannerRender(){
    const target=document.getElementById('missionView');if(!target)return;
    const observer=new MutationObserver(()=>addSummary());observer.observe(target,{childList:true,subtree:true});addSummary();
  }
  function validate(){
    const p=load(),batch=p.talentWeek?.[`talent_${localDate()}`];
    const splitFragments=batch?.allocation?.some((a,i,arr)=>arr.some((b,j)=>i!==j&&a.subject===b.subject))||false;
    return{version:VERSION,scienceDefaultSelected:!!p.days?.[localDate()]?.tasks?.find(t=>t.title==='월요일 과학 숙제')?.selected,
      talentWeeklyDistribution:!!batch,wholeSubjectUnit:!splitFragments,mondayOff:true,sundayOff:true,overflowMinutes:batch?.overflowMinutes||0};
  }
  function boot(){
    document.documentElement.dataset.readyStageE=VERSION;
    const changed=normalizeToday();
    if(changed && sessionStorage.getItem(RELOAD_KEY)!==VERSION){sessionStorage.setItem(RELOAD_KEY,VERSION);location.reload();return}
    document.addEventListener('click',interceptTalent,true);patchPlannerRender();
    setTimeout(()=>window.ReadyStageD?.renderPlanner?.(),0);
    window.ReadyStageE=Object.freeze({version:VERSION,validate});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();