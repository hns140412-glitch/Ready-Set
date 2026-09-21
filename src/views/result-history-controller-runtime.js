(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const getState=options.getState||(()=>({}));
    const navigate=options.navigate||(()=>null);
    if(!view)throw new Error('RESULT_HISTORY_CONTROLLER_DEPENDENCY_MISSING');

    function resultSource(){
      return getState()?.lastResult||null;
    }

    function outcomeProfile(record={}){
      return view.outcomeProfile(record);
    }

    function renderResult(){
      const record=resultSource();
      if(!record){
        navigate('history');
        return {ok:false,reason:'NO_RESULT'};
      }
      return view.renderResult(record);
    }

    function renderHistory(){
      return view.renderHistory(getState()?.records||[]);
    }

    function renderCalendar(){
      return view.renderCalendar(getState()?.records||[]);
    }

    return Object.freeze({resultSource,outcomeProfile,renderResult,renderHistory,renderCalendar});
  }

  root.ReadyRebuildResultHistoryController=Object.freeze({
    version:'READY_REBUILD_RESULT_HISTORY_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
