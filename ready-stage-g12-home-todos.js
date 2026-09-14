(() => {
  'use strict';
  const VERSION='2026.09.08-stage-g1.2-home-todos';
  const ROLE=new URLSearchParams(location.search).get('role')==='parent'?'PARENT':'CHILD';
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const statusRank=s=>s==='IN_PROGRESS'?0:(s==='COMPLETED'?2:1);
  const statusLabel=s=>s==='IN_PROGRESS'?'진행 중':s==='COMPLETED'?'완료':'아직 시작 전';

  function model(){return window.ReadyAssignmentModel}
  function getTodayTasks(){
    const p=model()?.load?.()||{};
    const tasks=[...(p.days?.[today()]?.tasks||[])];
    return tasks
      .map((task,index)=>({task,index}))
      .sort((a,b)=>statusRank(a.task.status)-statusRank(b.task.status)||a.index-b.index)
      .map(x=>x.task);
  }
  function styles(){
    if(document.getElementById('readyStageG12Style'))return;
    const s=document.createElement('style');s.id='readyStageG12Style';s.textContent=`
      #homeTodayTodoList{display:grid;gap:10px;margin-top:12px}.g12-home-task{width:100%;text-align:left;border:1px solid rgba(28,27,24,.10);background:#fffdf8;border-radius:18px;padding:13px 14px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;box-shadow:0 6px 18px rgba(52,39,10,.04)}.g12-home-task b{display:block;font-size:15px;line-height:1.3}.g12-home-task small{display:block;margin-top:4px;color:#756c5e;font-size:12px;line-height:1.35}.g12-home-state{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;background:#f1eee6;color:#4e493f;font-size:10px;font-weight:900;white-space:nowrap}.g12-home-task.inprogress .g12-home-state{background:#fff1aa;color:#6d5600}.g12-home-task.completed{opacity:.72}.g12-home-task.completed .g12-home-state{background:#e6f3e5;color:#315f31}.g12-home-more{font-size:12px;font-weight:800;color:#756c5e;text-align:center;padding:2px 0}.g12-empty{padding:15px;border:1px dashed rgba(28,27,24,.16);border-radius:16px;background:rgba(255,255,255,.42);font-size:13px;color:#6f685e;line-height:1.45}.g12-parent-note{font-size:11px;color:#756c5e;margin-top:8px}
    `;document.head.appendChild(s);
  }
  function ensureStructure(){
    const panel=document.querySelector('#homeView .challengePanel');if(!panel)return null;
    const title=panel.querySelector('.sectionTitle');
    if(title){
      const kicker=title.querySelector('span'),h2=title.querySelector('h2'),detail=title.querySelector('.linkBtn');
      if(kicker)kicker.textContent=ROLE==='PARENT'?'오늘 배정 현황':'오늘의 할 일';
      if(h2)h2.textContent=ROLE==='PARENT'?'Planner가 오늘 배정한 할 일이에요':'오늘 뭐부터 탐험할까?';
      if(detail){detail.style.display='';detail.textContent='자세히';detail.dataset.nav='mission'}
    }
    const legacy=panel.querySelector('.categoryGrid');if(legacy)legacy.style.display='none';
    const chips=panel.querySelector('#homeChips');if(chips)chips.style.display='none';
    let root=panel.querySelector('#homeTodayTodoList');
    if(!root){root=document.createElement('div');root.id='homeTodayTodoList';panel.appendChild(root)}
    return root;
  }
  function applyTask(task){
    if(ROLE==='PARENT')return;
    const p=model()?.load?.();if(!p)return;
    const day=p.days?.[today()];if(!day)return;
    day.tasks=(day.tasks||[]).map(t=>({...t,selected:t.id===task.id}));
    model().save(p);
    window.ReadyStageD?.renderPlanner?.();
    document.querySelector('#todayPlannerCard [data-plan-action="apply"]')?.click();
    document.querySelector('#homeView [data-nav="mission"]')?.click();
  }
  function render(){
    styles();const root=ensureStructure();if(!root)return;
    const tasks=getTodayTasks();root.innerHTML='';
    if(!tasks.length){
      root.innerHTML=`<div class="g12-empty">오늘 배정된 탐험은 없어요.${ROLE==='PARENT'?'<div class="g12-parent-note">숙제 원본 FACT가 있다면 Planner 배정 상태를 확인해 주세요.</div>':''}</div>`;
      return;
    }
    const shown=tasks.slice(0,3);
    shown.forEach(task=>{
      const btn=document.createElement(ROLE==='PARENT'?'div':'button');
      if(ROLE!=='PARENT')btn.type='button';
      btn.className=`g12-home-task ${task.status==='IN_PROGRESS'?'inprogress':''} ${task.status==='COMPLETED'?'completed':''}`;
      const title=task.title||task.subject||'할 일';
      const volume=task.volume||task.unitLabel||task.note||'분량/단위 확인 필요';
      btn.innerHTML=`<span><b>${esc(title)}</b><small>${esc(volume)}</small></span><span class="g12-home-state">${esc(statusLabel(task.status))}</span>`;
      if(ROLE!=='PARENT')btn.addEventListener('click',()=>applyTask(task));
      root.appendChild(btn);
    });
    if(tasks.length>3){const more=document.createElement('div');more.className='g12-home-more';more.textContent=`외 ${tasks.length-3}개`;root.appendChild(more)}
  }
  function validate(){
    const panel=document.querySelector('#homeView .challengePanel');
    const legacyHidden=!!panel?.querySelector('.categoryGrid')&&getComputedStyle(panel.querySelector('.categoryGrid')).display==='none';
    const tasks=getTodayTasks();
    return {version:VERSION,role:ROLE,legacyCategoryHidden:legacyHidden,todayTaskCount:tasks.length,renderedCount:document.querySelectorAll('#homeTodayTodoList .g12-home-task').length};
  }
  window.ReadyStageG12={render,validate,getTodayTasks};
  render();
  const originalRenderHome=window.renderHome;
  if(typeof originalRenderHome==='function'&&!originalRenderHome.__g12Wrapped){
    const wrapped=function(...args){const out=originalRenderHome.apply(this,args);setTimeout(render,0);return out};wrapped.__g12Wrapped=true;window.renderHome=wrapped;
  }
  document.documentElement.dataset.readyStageG12=VERSION;
})();