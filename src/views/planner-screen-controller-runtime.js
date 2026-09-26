(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const planner=options.planner||(()=>root.ReadySetPlanner);
    const plannerQuery=options.plannerQuery;
    const familySession=options.familySession||(()=>root.ReadyFamilySession);
    const localDateKey=options.localDateKey;
    const getSelectedDate=options.getSelectedDate||(()=>null);
    const setSelectedDate=options.setSelectedDate||(()=>{});
    const getTab=options.getTab||(()=> 'week');
    if(!view||!plannerQuery||!localDateKey)throw new Error('PLANNER_SCREEN_CONTROLLER_DEPENDENCY_MISSING');

    function render(){
      const selectedDate=getSelectedDate()||localDateKey();
      if(!getSelectedDate())setSelectedDate(selectedDate);
      planner()?.replanReadyCarryOvers?.({date:localDateKey()});
      view.render({
        selectedDate,
        tab:getTab(),
        snapshot:plannerQuery.snapshot(),
        isParent:!!familySession()?.isParent?.()
      });
      return {selectedDate,tab:getTab()};
    }

    return Object.freeze({render});
  }

  root.ReadyRebuildPlannerScreenController=Object.freeze({
    version:'READY_REBUILD_PLANNER_SCREEN_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
