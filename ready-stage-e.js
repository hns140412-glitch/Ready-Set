(() => {
  'use strict';
  const VERSION='2026.09.08-stage-e1';
  const STORE_KEY='readyset_planner_v1';
  const RELOAD_KEY='ready_stage_e_seed_reload';
  const TALENT_BASELINES={
    '연산':{min:8,max:12,load:'낮음~보통'},'한자':{min:8,max:12,load:'낮음~보통'},
    '국어':{min:10,max:15,load:'보통'},'사회':{min:10,max:15,load:'보통'},
    '수학':{min:15,max:20,load:'보통~높음'},'생각하는 피자':{min:15,max:20,load:'보통~높음'}
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

  function slots(base){return[
    {date:datePlus(base,1),label:'수',capacity:10,remaining:10,subjects:new Set()},
    {date:datePlus(base,2),label:'목',capacity:15,remaining:15,subjects:new Set()},
    {date:datePlus(base,3),label:'금',capacity:15,remaining:15,subjects:new Set()},
    {date:datePlus(base,4),label:'토',capacity:20,remaining:20,subjects:new Set()},
    {date:datePlus(base,7),label:'다음 화',capacity:10,remaining:10,subjects:new Set(),carry:true}
  ]}
  function pickSlot(all,subject,need){
    const heavy=subject==='수학'||subject==='생각하는 피자';
    const candidates=all.filter(s=>s.remaining>0 && !(heavy&&[...s.subjects].some(x=>(x==='수학'||x==='생각하는 피자')&&x!==subject)));
    if(!candidates.length)return null;
    const fitting=candidates.filter(s=>s.remaining>=need).sort((a,b)=>a.remaining-b.remaining);
    return fitting[0]||candidates.sort((a,b)=>b.remaining-a.remaining)[0];
  }
  function distribute(p,base,items,batchId){
    Object.values(p.days||{}).forEach(day=>day.tasks=(day.tasks||[]).filter(t=>t.talentBatchId!==batchId));
    const all=slots(base),created=[],overflow=[];
    [...items].sort((a,b)=>b.totalMin-a.totalMin).forEach(item=>{
      let remain=item.totalMin,part=1;
      while(remain>0){
        const slot=pickSlot(all,item.subject,remain);
        if(!slot){overflow.push({item,minutes:remain});break}
        const chunk=Math.min(remain,slot.remaining);
        const task={id:id('todo'),localDate:slot.date,subject:'재능',talentSubject:item.subject,sourceDay:'화요일 배포',
          title:`재능 · ${item.subject}${remain>chunk||part>1?` · 이어하기 ${part}`:''}`,volume:item.volume,difficulty:item.difficulty,
          estimatedMin:chunk,estimateKind:item.estimateKind,deadline:'다음 화요일 방문 전',selected:false,status:'PLANNED',required:true,talentBatchId:batchId,
          note:`선생님 지정 분량 유지 · 총 예상 ${item.totalMin}분 중 ${chunk}분 배치${slot.carry?' · 방문 전 최종 버퍼':''}`};
        ensureDay(p,slot.date).tasks.push(task);created.push(task);slot.subjects.add(item.subject);slot.remaining-=chunk;remain-=chunk;part++;
      }
    });
    overflow.forEach(({item,minutes})=>{
      const date=datePlus(base,7);
      const task={id:id('todo'),localDate:date,subject:'재능',talentSubject:item.subject,sourceDay:'화요일 배포',
        title:`재능 · ${item.subject} · 배치 조정 필요`,volume:item.volume,difficulty:item.difficulty,estimatedMin:minutes,estimateKind:item.estimateKind,
        deadline:'다음 화요일 방문 전',selected:false,status:'PLANNED',required:true,talentBatchId:batchId,allocationWarning:'CAPACITY_OVERFLOW',
        note:`현재 보호 시간창을 ${minutes}분 초과합니다. 필수량은 삭제하지 않고 부모/아이 실제 소요시간을 보고 재배치하세요.`};
      ensureDay(p,date).tasks.push(task);created.push(task);
    });
    p.talentWeek=p.talentWeek||{};
    p.talentWeek[batchId]={batchId,sourceDate:base,createdAt:new Date().toISOString(),items,
      allocation:created.map(t=>({date:t.localDate,subject:t.talentSubject,minutes:t.estimatedMin,warning:t.allocationWarning||null})),
      overflowMinutes:overflow.reduce((sum,x)=>sum+x.minutes,0)};
    return {created,overflowMinutes:p.talentWeek[batchId].overflowMinutes};
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
      ? `주간 배포 완료 · 보호 시간창을 ${result.overflowMinutes}분 초과해 다음 화요일에 조정 필요로 남겼어요.`
      : `재능 ${items.length}과목을 수·목·금·토에 나눠 배포했어요. 필요 시 다음 화요일 방문 전 버퍼를 써요.`);
  }
  function addSummary(){
    const p=load(),batch=p.talentWeek?.[`talent_${localDate()}`];
    const panel=document.querySelector('#todayPlannerCard .talent-panel');
    if(!panel||!batch)return;
    let div=document.getElementById('talentWeekSummary');
    if(!div){div=document.createElement('div');div.id='talentWeekSummary';div.className='planner-schedule';panel.before(div)}
    div.textContent=batch.overflowMinutes>0
      ? `재능 주간 배포 · 수/목/금/토 + 다음 화요일 · ${batch.overflowMinutes}분은 보호 시간창 초과로 조정 필요 · 월/일 OFF`
      : '재능 주간 배포 완료 · 수/목/금/토 + 필요 시 다음 화요일 방문 전 버퍼 · 월/일 OFF';
  }
  function patchPlannerRender(){
    const target=document.getElementById('missionView');if(!target)return;
    const observer=new MutationObserver(()=>addSummary());observer.observe(target,{childList:true,subtree:true});addSummary();
  }
  function validate(){
    const p=load(),batch=p.talentWeek?.[`talent_${localDate()}`];
    return{version:VERSION,scienceDefaultSelected:!!p.days?.[localDate()]?.tasks?.find(t=>t.title==='월요일 과학 숙제')?.selected,
      talentWeeklyDistribution:!!batch,mondayOff:true,sundayOff:true,overflowMinutes:batch?.overflowMinutes||0};
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