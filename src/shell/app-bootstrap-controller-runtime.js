(function(root){
  'use strict';

  function create(options={}){
    const queryAll=options.queryAll||((s)=>[...root.document.querySelectorAll(s)]);
    const query=options.query||((s)=>root.document.querySelector(s));
    const eventTarget=options.eventTarget||root;
    const documentTarget=options.documentTarget||root.document;
    const nav=options.nav||(()=>{});
    const renderPlanner=options.renderPlanner||(()=>{});
    const renderFocus=options.renderFocus||(()=>{});
    const getActiveSession=options.getActiveSession||(()=>null);
    const localDateKey=options.localDateKey;
    const getPlannerTab=options.getPlannerTab||(()=> 'week');
    const setPlannerTab=options.setPlannerTab||(()=>{});
    const getPlannerSelectedDate=options.getPlannerSelectedDate||(()=>null);
    const setPlannerSelectedDate=options.setPlannerSelectedDate||(()=>{});
    const renderHome=options.renderHome||(()=>{});
    const renderSettings=options.renderSettings||(()=>Promise.resolve());
    const versionText=options.versionText||(()=> '');
    const recovery=options.recovery||(()=>({resumed:false}));
    const readyPwaSafePoint=options.readyPwaSafePoint||(()=>false);
    let bound=false;
    if(!localDateKey)throw new Error('APP_BOOTSTRAP_CONTROLLER_DEPENDENCY_MISSING');

    function onDocumentClick(event){
      const tab=event.target.closest?.('[data-planner-tab]');
      if(tab){
        setPlannerTab(tab.dataset.plannerTab);
        renderPlanner();
        return;
      }
      const day=event.target.closest?.('[data-planner-date]');
      if(day){
        setPlannerSelectedDate(day.dataset.plannerDate);
        renderPlanner();
      }
    }

    function onPlannerToday(){
      setPlannerSelectedDate(localDateKey());
      setPlannerTab('day');
      renderPlanner();
    }

    function onVisibilityChange(){
      if(!documentTarget.hidden&&getActiveSession())renderFocus();
    }

    function onLoad(){
      renderHome();
      Promise.resolve(renderSettings()).catch(()=>{});
      const versionInfo=query('#readyVersionInfo');
      if(versionInfo)versionInfo.textContent=versionText();
      const restored=recovery()||{resumed:false};
      if(restored.resumed)nav('focus');
      if(readyPwaSafePoint())eventTarget.dispatchEvent?.(new CustomEvent('readyset-safe-point'));
      return restored;
    }

    function bind(){
      if(bound)return false;
      bound=true;
      queryAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>nav(button.dataset.nav)));
      documentTarget.addEventListener?.('click',onDocumentClick);
      query('#plannerTodayJump')?.addEventListener('click',onPlannerToday);
      eventTarget.addEventListener?.('visibilitychange',onVisibilityChange);
      eventTarget.addEventListener?.('load',onLoad);
      return true;
    }

    return Object.freeze({
      bind,onDocumentClick,onPlannerToday,onVisibilityChange,onLoad,
      plannerState:()=>({tab:getPlannerTab(),selectedDate:getPlannerSelectedDate()})
    });
  }

  root.ReadyRebuildAppBootstrapController=Object.freeze({
    version:'READY_REBUILD_APP_BOOTSTRAP_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
