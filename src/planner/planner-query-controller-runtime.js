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
      return plannerView.itemsForDate(date,snap);
    }

    function stateLabel(value){
      return plannerView.stateLabel(value);
    }

    return Object.freeze({snapshot,todayProjection,itemsForDate,stateLabel});
  }

  root.ReadyRebuildPlannerQueryController=Object.freeze({
    version:'READY_REBUILD_PLANNER_QUERY_CONTROLLER_V01',
    EMPTY_SNAPSHOT,
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
