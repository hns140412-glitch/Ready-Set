(function(root){
  'use strict';

  const EMPTY_SNAPSHOT=Object.freeze({
    dated_todos:[],
    schedule_commitments:[],
    daily_availability_windows:[],
    carry_over_queue:[]
  });

  function create(options={}){
    const planner=options.planner||(()=>root.ReadySetPlanner);
    const projection=options.projection;
    const plannerView=options.plannerView;
    if(!projection||!plannerView)throw new Error('PLANNER_QUERY_CONTROLLER_DEPENDENCY_MISSING');

    function snapshot(){
      const value=planner()?.snapshot?.();
      return value||{
        dated_todos:[],
        schedule_commitments:[],
        daily_availability_windows:[],
        carry_over_queue:[]
      };
    }

    function todayProjection(){
      return (planner()?.todayProjection?.()||[]).map(item=>projection.todayItem(item));
    }

    function itemsForDate(date,snap=snapshot()){
      const commitments=planner()?.scheduleCommitmentsForDate?.(date)||null;
      return plannerView.itemsForDate(date,snap,{commitments});
    }

    function freeWindowsForDate(date){
      const api=planner();
      const candidates=api?.candidateWindowsByDate?.([date])?.[date]||[];
      const commitments=api?.scheduleCommitmentsForDate?.(date)||[];
      const toMinute=value=>{
        const match=String(value||'').match(/(?:T)?(\d{2}):(\d{2})/);
        return match?Number(match[1])*60+Number(match[2]):null;
      };
      const hhmm=minute=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
      const busy=commitments.map(x=>({
        start:toMinute(x.start_at||x.start),
        end:toMinute(x.end_at||x.end)
      })).filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.end>x.start);
      const out=[];
      for(const w of candidates){
        const start=toMinute(w.start),end=toMinute(w.end);
        if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;
        let spans=[[start,end]];
        for(const b of busy){
          spans=spans.flatMap(([a,z])=>{
            if(b.end<=a||b.start>=z)return [[a,z]];
            const next=[];
            if(b.start>a)next.push([a,Math.min(b.start,z)]);
            if(b.end<z)next.push([Math.max(b.end,a),z]);
            return next;
          });
        }
        for(const [a,z] of spans)if(z>a)out.push({start:hhmm(a),end:hhmm(z),minutes:z-a});
      }
      return out.sort((a,b)=>a.start.localeCompare(b.start));
    }

    function stateLabel(value){
      return plannerView.stateLabel(value);
    }

    return Object.freeze({snapshot,todayProjection,itemsForDate,freeWindowsForDate,stateLabel});
  }

  root.ReadyRebuildPlannerQueryController=Object.freeze({
    version:'READY_REBUILD_PLANNER_QUERY_CONTROLLER_V01',
    EMPTY_SNAPSHOT,
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
