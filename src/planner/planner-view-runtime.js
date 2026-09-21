(function(root){
  'use strict';
  const clean=v=>String(v??'');
  const STATE_LABELS=Object.freeze({
    PLANNED:'예정',IN_PROGRESS:'진행',COMPLETED:'완료',PARTIAL:'일부 남음',
    DEFERRED:'다음에',WAITING_FOR_PARENT:'부모 도움',BLOCKED:'막힘',
    SUPERSEDED:'대체됨',FIXED:'고정'
  });
  function stateLabel(value){return STATE_LABELS[value]||clean(value)}
  function itemsForDate(date,snapshot={}){
    const todos=(snapshot.dated_todos||[]).filter(x=>x.date===date).map(x=>({
      kind:'TODO',
      todo_id:x.todo_id,
      label:x.label,
      state:x.state||'PLANNED',
      minutes:Number.isFinite(x.estimated_minutes)?x.estimated_minutes:null,
      order:Number.isFinite(x.order)?x.order:999,
      meta:/^PLANNER/.test(x.source||'')?'플래너':'직접 추가'
    }));
    const commitments=(snapshot.schedule_commitments||[])
      .filter(x=>String(x.start_at||'').slice(0,10)===date)
      .map(x=>({
        kind:'SCHEDULE',
        commitment_id:x.commitment_id,
        label:x.title,
        state:'FIXED',
        minutes:null,
        order:-1,
        time:String(x.start_at||'').slice(11,16),
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
    itemsForDate,
    dayModel
  });
})(typeof globalThis!=='undefined'?globalThis:this);
