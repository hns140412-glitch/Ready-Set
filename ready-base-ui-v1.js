(() => {
  'use strict';
  const VERSION='2026.09.09-base-ui-v1';
  const role=new URLSearchParams(location.search).get('role')==='parent'?'PARENT':'CHILD';
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function planner(){try{return JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}')}catch{return {}}}
  function tasks(){return [...(planner().days?.[today()]?.tasks||[])].sort((a,b)=>(a.status==='IN_PROGRESS'?0:a.status==='COMPLETED'?2:1)-(b.status==='IN_PROGRESS'?0:b.status==='COMPLETED'?2:1))}
  function status(t){return t.status==='IN_PROGRESS'?'진행 중':t.status==='COMPLETED'?'완료':'아직 시작 전'}
  function renderHome(){
    const home=document.getElementById('homeView'); if(!home)return;
    home.classList.add('readyBaseV1');
    const main=home.querySelector('.homeMain'); if(!main)return;
    const list=tasks();
    main.innerHTML=`
      <section class="baseHero" aria-label="Ready & Set 탐험 홈">
        <div class="baseHeroCopy"><span class="kicker">TODAY'S EXPLORATION</span><h1>${role==='PARENT'?'오늘의 배정':'오늘, 어디부터 탐험할까?'}</h1><p>${role==='PARENT'?'Planner가 배정한 오늘의 할 일을 확인해요.':'오늘 할 일을 하나씩 발견하고 시작해요.'}</p></div>
        <section class="baseCompanion"><div class="baseUser" aria-label="사용자"><span id="baseUserAvatar">RS</span></div><div class="baseTogether"><small>나의 탐험대</small><b id="baseExplorerName">루미</b><span>${role==='PARENT'?'오늘 탐험을 함께 확인하고 있어요.':'오늘도 같이 가볼까?'}</span></div><div class="guidePortrait" id="baseExplorerPortrait" aria-hidden="true"></div></section>
      </section>
      <section class="baseActions"><button data-nav="mission"><b>${role==='PARENT'?'숙제 입력 · 확인':'오늘 탐험 정하기'}</b><small>${role==='PARENT'?'숙제 원본 FACT 촬영·입력·확인':'Planner가 준비한 오늘 할 일에서 선택'}</small><strong>→</strong></button><button data-nav="history"><b>${role==='PARENT'?'학습 기록':'탐험 기록'}</b><small>${role==='PARENT'?'아이의 진행과 완료 기록 보기':'완료한 탐험과 기록 보기'}</small><strong>→</strong></button></section>
      <section class="baseToday"><div class="sectionTitle"><div><span>${role==='PARENT'?'오늘 배정 현황':'오늘의 할 일'}</span><h2>${role==='PARENT'?'Planner가 오늘 배정한 할 일이에요':'오늘 뭐부터 탐험할까?'}</h2></div><button class="linkBtn" data-nav="mission">자세히</button></div><div id="homeTodayTodoList">${list.length?list.slice(0,3).map(t=>`<${role==='PARENT'?'div':'button'} class="baseTask ${t.status==='COMPLETED'?'completed':''}" ${role==='PARENT'?'':'type="button" data-base-task="'+esc(t.id)+'"'}><span><b>${esc(t.title||t.subject||'할 일')}</b><small>${esc(t.volume||t.unitLabel||t.note||'분량/단위 확인 필요')}</small></span><em>${esc(status(t))}</em></${role==='PARENT'?'div':'button'}>`).join(''):`<div class="baseEmpty">오늘 배정된 탐험은 없어요.${role==='PARENT'?'<small>숙제 원본 FACT가 있다면 Planner 배정 상태를 확인해 주세요.</small>':''}</div>`}</div></section>`;
    home.querySelectorAll('[data-base-task]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.baseTask; const p=planner(); const day=p.days?.[today()]; if(!day)return;
      day.tasks=(day.tasks||[]).map(t=>({...t,selected:String(t.id)===String(id)})); localStorage.setItem('readyset_planner_v1',JSON.stringify(p));
      sessionStorage.setItem('ready_g13_pending_task',String(id)); location.reload();
    }));
    document.documentElement.dataset.readyBaseUi=VERSION;
  }
  function css(){const s=document.createElement('style');s.id='readyBaseV1Style';s.textContent=`html:not([data-ready-base-ui]) #homeView .homeMain{visibility:hidden}.readyBaseV1 .homeMain{visibility:visible!important}.baseHero{padding:18px 0 10px}.baseHeroCopy h1{font-size:34px;line-height:1.05;margin:7px 0 10px}.baseHeroCopy p{margin:0;color:#665f56}.baseCompanion{margin-top:22px;background:rgba(255,255,255,.7);border:1px solid rgba(40,30,20,.08);border-radius:26px;padding:16px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px}.baseUser{width:54px;height:54px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900}.baseTogether small,.baseTogether span{display:block;color:#766e64;font-size:11px}.baseTogether b{display:block;font-size:18px;margin:2px 0}.baseActions{display:grid;gap:10px;margin:10px 0 22px}.baseActions button{border:0;background:#fff;border-radius:20px;padding:15px;text-align:left;display:grid;grid-template-columns:1fr auto}.baseActions small{display:block;color:#756c5e;margin-top:4px}.baseActions strong{grid-column:2;grid-row:1/3;align-self:center}.baseToday{padding-bottom:30px}.baseTask{width:100%;border:1px solid rgba(28,27,24,.1);background:#fffdf8;border-radius:18px;padding:14px;margin-top:10px;text-align:left;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.baseTask small{display:block;color:#756c5e;margin-top:4px}.baseTask em{font-style:normal;font-size:10px;font-weight:900;background:#f1eee6;border-radius:999px;padding:6px 8px}.baseTask.completed{opacity:.65}.baseEmpty{margin-top:12px;padding:16px;border:1px dashed rgba(28,27,24,.16);border-radius:18px;background:rgba(255,255,255,.45);color:#6f685e}.baseEmpty small{display:block;margin-top:7px}`;document.head.appendChild(s)}
  css();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderHome,{once:true}); else renderHome();
  window.ReadyBaseUIV1={version:VERSION,renderHome,tasks};
})();