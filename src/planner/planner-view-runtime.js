(function(root){
  'use strict';
  const clean=v=>String(v??'');
  const STATE_LABELS=Object.freeze({
    PLANNED:'예정',IN_PROGRESS:'진행',COMPLETED:'완료',PARTIAL:'일부 남음',
    DEFERRED:'다음에',WAITING_FOR_PARENT:'부모 도움',BLOCKED:'막힘',
    SUPERSEDED:'대체됨',FIXED:'고정'
  });
  function stateLabel(value){return STATE_LABELS[value]||clean(value)}
  function allocationReason(todo={},snapshot={}){
    if(todo.operating_rule==='ENGLISH_ACADEMY_MORNING_VOCAB_REVIEW')return '영어학원 날 아침 단어 복습';
    if(todo.source==='PLANNER_V2_CARRY_OVER'||todo.provenance?.carry_over_id)return '남은 탐험 다시 배정';
    const template=(snapshot.homework_templates||[]).find(x=>x.template_id===todo.template_id);
    const parts=[];
    if(todo.free_window_evidence?.known)parts.push('확인된 학습 가능 시간');
    if(template?.deadline_date)parts.push('마감 '+template.deadline_date);
    if(Number.isFinite(template?.planner_estimated_minutes))parts.push('실제 수행시간 반영');
    return parts.join(' · ')||(/^PLANNER/.test(todo.source||'')?'Planner 배정':'직접 추가');
  }
  function itemsForDate(date,snapshot={}){
    const todos=(snapshot.dated_todos||[]).filter(x=>x.date===date).map(x=>({
      kind:'TODO',
      todo_id:x.todo_id,
      label:x.label,
      state:x.state||'PLANNED',
      minutes:Number.isFinite(x.estimated_minutes)?x.estimated_minutes:null,
      order:Number.isFinite(x.order)?x.order:999,
      meta:/^PLANNER/.test(x.source||'')?'플래너':'직접 추가',
      reason:allocationReason(x,snapshot)
    }));
    const dow=new Date(date+'T12:00:00').getDay();
    const commitments=(snapshot.schedule_commitments||[])
      .filter(x=>{
        if(x.recurrence==='WEEKLY'){
          if(Number(x.weekday)!==dow)return false;
          if(x.valid_from&&date<x.valid_from)return false;
          if(x.valid_until&&date>x.valid_until)return false;
          return true;
        }
        return String(x.start_at||'').slice(0,10)===date;
      })
      .map(x=>({
        kind:'SCHEDULE',
        commitment_id:x.commitment_id,
        label:x.title,
        state:'FIXED',
        minutes:null,
        order:-1,
        time:x.recurrence==='WEEKLY'?String(x.start||''):String(x.start_at||'').slice(11,16),
        meta:'고정 일정'
      }));
    return [...commitments,...todos].sort((a,b)=>(a.order??999)-(b.order??999)||String(a.label||'').localeCompare(String(b.label||''),'ko'));
  }
  function dayModel(date,snapshot={}){
    const items=itemsForDate(date,snapshot);
    return Object.freeze({date,count:items.length,items});
  }
  root.ReadyRebuildPlannerView=Object.freeze({
    version:'READY_REBUILD_PLANNER_VIEW_V01',
    STATE_LABELS,
    stateLabel,
    allocationReason,
    itemsForDate,
    dayModel
  });
})(typeof globalThis!=='undefined'?globalThis:this);
