(function(root){
  'use strict';

  function create(options={}){
    const query=options.query||((s)=>root.document.querySelector(s));
    const queryAll=options.queryAll||((s)=>[...root.document.querySelectorAll(s)]);
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>{});
    const categories=options.categories||{};
    const assignments=options.assignments||(()=>root.ReadyAssignments);
    const plannerQuery=options.plannerQuery;
    const view=options.view;
    const renderHome=options.renderHome||(()=>{});
    const renderChips=options.renderChips||(()=>{});
    const toast=options.toast||(()=>{});
    let voiceRecognition=null;
    let bound=false;
    if(!plannerQuery||!view)throw new Error('MISSION_CONTROLLER_DEPENDENCY_MISSING');

    function missionItems(){
      return plannerQuery.todayProjection();
    }

    function currentMissionItems(){
      const state=getState();
      const today=missionItems();
      const selected=today.filter(x=>x.state==='PLANNED'&&(state.selectedTodoIds||[]).includes(x.todo_id));
      return selected.length?selected:today.filter(x=>x.state==='PLANNED');
    }

    function currentMissionLabels(){
      return currentMissionItems().map(x=>x.label).filter(Boolean);
    }

    function toggleTodo(todoId,wasSelected){
      const state=getState();
      state.selectedTodoIds=wasSelected
        ?(state.selectedTodoIds||[]).filter(x=>x!==todoId)
        :[...(state.selectedTodoIds||[]),todoId];
      save();
      render();
    }

    function render(){
      const state=getState();
      view.render({
        state,
        todayItems:missionItems(),
        renderChips,
        onToggleTodo:toggleTodo,
        onRemoveEventTask:removeEventTask
      });
    }

    function renderPlannerToday(){
      const state=getState();
      view.renderPlannerToday({
        items:missionItems(),
        selectedTodoIds:state.selectedTodoIds||[],
        onToggle:toggleTodo
      });
    }

    function openCategory(cat){
      const state=getState();
      const title=query('#sheetTitle');if(title)title.textContent=`${cat} · 세부 과제 선택`;
      const target=query('#sheetOptions');if(!target)return;
      target.innerHTML='';
      (categories[cat]||[]).forEach(item=>{
        const key=`${cat} · ${item}`;
        const button=root.document.createElement('button');
        button.textContent=item;
        button.classList.toggle('on',(state.selected||[]).includes(key));
        button.addEventListener('click',()=>{
          state.selected=(state.selected||[]).includes(key)
            ?state.selected.filter(v=>v!==key)
            :[...(state.selected||[]),key];
          button.classList.toggle('on');
          save();
          render();
          renderHome();
        });
        target.appendChild(button);
      });
      const sheet=query('#categorySheet');if(sheet)sheet.hidden=false;
    }

    function closeCategory(){
      const sheet=query('#categorySheet');if(sheet)sheet.hidden=true;
    }

    function addChildTask(){
      const input=query('#taskInput');
      const value=input?.value.trim();
      if(!value)return;
      assignments()?.addEventFact?.({actor:'CHILD',title:value,provenance:{kind:'CHILD_INPUT',surface:'MISSION'}});
      input.value='';
      toast('새 숙제를 부모님 확인 목록에 보냈어요. 확인 후 Planner가 TODAY에 배정합니다.');
    }

    function addEventTask(){
      const state=getState();
      const input=query('#eventTaskInput');
      const value=input?.value.trim();
      if(!value)return false;
      state.eventTasks=Array.isArray(state.eventTasks)?state.eventTasks:[];
      state.eventTasks.push({
        event_task_id:`event_${Date.now()}_${state.eventTasks.length}`,
        label:value,
        source:'CHILD_EVENT_INPUT'
      });
      input.value='';
      save();
      render();
      toast('이벤트 과제를 이번 타임어택에 바로 넣었어요.');
      return true;
    }

    function removeEventTask(eventTaskId){
      const state=getState();
      state.eventTasks=(state.eventTasks||[]).filter(x=>x?.event_task_id!==eventTaskId);
      save();
      render();
      return true;
    }

    function voiceTask(){
      const SR=root.SpeechRecognition||root.webkitSpeechRecognition;
      const hint=query('#voiceHint'),button=query('#voiceTaskBtn'),input=query('#taskInput');
      if(!SR){if(hint)hint.textContent='이 브라우저에서는 음성 입력을 지원하지 않아요. 텍스트로 입력해 주세요.';return;}
      if(voiceRecognition){try{voiceRecognition.stop()}catch{};return;}
      voiceRecognition=new SR();
      voiceRecognition.lang='ko-KR';
      voiceRecognition.interimResults=false;
      voiceRecognition.maxAlternatives=1;
      button?.classList.add('listening');
      if(hint)hint.textContent='듣고 있어요… 과제를 말해 주세요.';
      voiceRecognition.onresult=event=>{
        const text=event.results?.[0]?.[0]?.transcript?.trim();
        if(text&&input){
          input.value=text;
          if(hint)hint.textContent='음성 입력 완료. 확인 후 추가를 눌러주세요.';
        }
      };
      voiceRecognition.onerror=()=>{if(hint)hint.textContent='음성 입력이 잘 되지 않았어요. 다시 누르거나 텍스트로 입력해 주세요.';};
      voiceRecognition.onend=()=>{
        button?.classList.remove('listening');
        voiceRecognition=null;
        if(hint?.textContent.startsWith('듣고'))hint.textContent='텍스트로 입력하거나 마이크를 눌러 말할 수 있어요.';
      };
      try{voiceRecognition.start()}catch{button?.classList.remove('listening');voiceRecognition=null;}
    }

    function selectMinutes(button){
      const state=getState();
      if(button.dataset.minutes==='custom'){
        const custom=query('#customTimeWrap');if(custom)custom.hidden=false;
        return;
      }
      const custom=query('#customTimeWrap');if(custom)custom.hidden=true;
      state.targetMin=Number(button.dataset.minutes);
      queryAll('[data-minutes]').forEach(item=>{
        const active=String(state.targetMin)===item.dataset.minutes;
        item.classList.toggle('on',active);
        item.setAttribute('aria-pressed',active?'true':'false');
      });
      save();
      render();
    }

    function setCustomMinutes(event){
      const state=getState();
      state.targetMin=Math.max(1,Math.min(180,Number(event.target.value)||25));
      save();
      render();
    }

    function bind(){
      if(bound)return false;
      bound=true;
      queryAll('[data-category]').forEach(button=>button.addEventListener('click',()=>openCategory(button.dataset.category)));
      queryAll('[data-close-sheet]').forEach(button=>button.addEventListener('click',closeCategory));
      query('#addTaskBtn')?.addEventListener('click',addChildTask);
      query('#addEventTaskBtn')?.addEventListener('click',addEventTask);
      query('#voiceTaskBtn')?.addEventListener('click',voiceTask);
      queryAll('[data-minutes]').forEach(button=>button.addEventListener('click',()=>selectMinutes(button)));
      query('#customMinutes')?.addEventListener('change',setCustomMinutes);
      return true;
    }

    return Object.freeze({
      bind,render,renderPlannerToday,currentMissionItems,currentMissionLabels,toggleTodo,openCategory,addChildTask,addEventTask,removeEventTask,voiceTask,selectMinutes,setCustomMinutes
    });
  }

  root.ReadyRebuildMissionController=Object.freeze({
    version:'READY_REBUILD_MISSION_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
