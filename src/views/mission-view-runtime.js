(function(root){
  'use strict';

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const qa=options.queryAll||((s)=>[...document.querySelectorAll(s)]);
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));
    const learningSequenceText=options.learningSequenceText||(()=>'');

    function renderPlannerToday({items=[],selectedTodoIds=[],onToggle}={}){
      const list=q('#plannerTodayList');
      const section=q('#plannerTodaySection');
      if(!list||!section)return;
      section.hidden=!items.length;
      list.innerHTML='';
      for(const item of items){
        const startable=item.state==='PLANNED';
        const selected=startable&&selectedTodoIds.includes(item.todo_id);
        const button=document.createElement('button');
        button.type='button';
        button.className='plannerTodayItem'+(selected?' on':'');
        button.dataset.todoId=item.todo_id;
        button.disabled=!startable;
        const steps=learningSequenceText(item);
        const stateNote=startable?(selected?'선택됨':'담기'):(item.state==='IN_PROGRESS'?'진행 중':'선택 불가');
        button.innerHTML=`<span><b>${escapeHtml(item.label)}</b><small>${item.planner_owned?'플래너 제안':'오늘 할 일'}${steps?` · ${escapeHtml(steps)}`:''}</small></span><strong>${stateNote}</strong>`;
        if(startable)button.onclick=()=>onToggle?.(item.todo_id,selected);
        list.appendChild(button);
      }
    }

    function render({state,todayItems=[],renderChips,onToggleTodo}={}){
      renderChips?.(q('#missionChips'));
      renderPlannerToday({items:todayItems,selectedTodoIds:state.selectedTodoIds||[],onToggle:onToggleTodo});

      const taskList=q('#taskList');
      if(taskList){
        taskList.innerHTML='';
        const chosen=todayItems.filter(x=>x.state==='PLANNED'&&(state.selectedTodoIds||[]).includes(x.todo_id));
        for(const item of chosen){
          const row=document.createElement('div');
          row.className='taskRow';
          const steps=learningSequenceText(item);
          row.innerHTML=`<span><b>${escapeHtml(item.label)}</b>${steps?`<small>${escapeHtml(steps)}</small>`:''}</span><button aria-label="삭제">×</button>`;
          row.querySelector('button').onclick=()=>onToggleTodo?.(item.todo_id,true);
          taskList.appendChild(row);
        }

        qa('[data-minutes]').forEach(button=>{
          const active=String(state.targetMin)===button.dataset.minutes;
          button.classList.toggle('on',active);
          button.setAttribute('aria-pressed',active?'true':'false');
        });

        const custom=q('#customMinutes');
        if(custom)custom.value=state.targetMin;
        const sound=q('#soundName');
        if(sound)sound.textContent=state.sound;
        const preview=q('#missionPreviewText');
        if(preview){
          const labels=chosen.map(x=>x.label);
          preview.textContent=`${labels.length?labels.join(' · '):'과제를 선택해 주세요'} · ${state.targetMin}분`;
        }
      }
    }

    return Object.freeze({render,renderPlannerToday});
  }

  root.ReadyRebuildMissionView=Object.freeze({
    version:'READY_REBUILD_MISSION_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
