(() => {
  'use strict';

  const VERSION = '2026.09.08-stage-f1';
  const STORE_KEY = 'readyset_planner_v1';
  const ROLE_PARAM = new URLSearchParams(location.search).get('role');
  const ROLE = ROLE_PARAM === 'parent' ? 'PARENT' : 'CHILD';

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const id = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const loadPlanner = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)||'null') || {version:1,days:{},talentWeek:{}}; } catch { return {version:1,days:{},talentWeek:{}}; } };
  const savePlanner = p => localStorage.setItem(STORE_KEY, JSON.stringify(p));
  const ensureDay = (p,date) => p.days[date] || (p.days[date] = {localDate:date,createdAt:new Date().toISOString(),scheduleNote:'',tasks:[]});

  function injectStyles(){
    if(document.getElementById('readyStageFStyle')) return;
    const s=document.createElement('style');
    s.id='readyStageFStyle';
    s.textContent=`
      .rsf-role-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;background:#fff3bd;color:#664f00;margin:0 0 10px}
      .rsf-card{border:1px solid rgba(0,0,0,.10);border-radius:22px;background:#fffdf8;padding:14px;margin:0 0 12px;box-shadow:0 8px 24px rgba(52,39,10,.06)}
      .rsf-card h2{margin:0 0 5px;font-size:20px}.rsf-card p{margin:0;color:#756c5e;font-size:12px;line-height:1.45}
      .rsf-task-list{display:grid;gap:8px;margin-top:12px}.rsf-task{display:grid;grid-template-columns:auto 1fr;gap:10px;padding:12px;border:1px solid #e6ded0;border-radius:16px;background:#fff}.rsf-task input{width:21px;height:21px;margin-top:3px}.rsf-task b{display:block;font-size:14px}.rsf-task small{display:block;margin-top:4px;color:#7d7468}.rsf-task .tag{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;background:#f2eee4;font-size:10px;font-weight:900;color:#6d6457}
      .rsf-event{display:flex;gap:7px;margin-top:10px}.rsf-event input{flex:1;min-width:0;padding:11px 12px;border:1px solid #d9d0c0;border-radius:13px;background:#fff}.rsf-event button,.rsf-primary{border:0;border-radius:13px;padding:11px 13px;font-weight:900;background:#1f1f1d;color:#fff}.rsf-secondary{border:0;border-radius:13px;padding:11px 13px;font-weight:900;background:#ffe277;color:#332b12}
      .rsf-parent-grid{display:grid;gap:9px;margin-top:12px}.rsf-parent-task{padding:12px;border:1px solid #e6ded0;border-radius:16px;background:#fff}.rsf-parent-task .row{display:grid;grid-template-columns:1.3fr .8fr .7fr;gap:7px;margin-top:8px}.rsf-parent-task input,.rsf-parent-task select{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d8cfbe;border-radius:10px;background:#fff}.rsf-parent-note{font-size:11px;color:#776b59;margin-top:7px}.rsf-parent-actions{display:flex;gap:8px;position:sticky;bottom:0;padding-top:10px;background:linear-gradient(180deg,rgba(255,253,248,0),#fffdf8 35%)}
      html[data-ready-role='CHILD'] #todayPlannerCard{display:none!important}
      html[data-ready-role='PARENT'] #todayPlannerCard{display:none!important}
      html[data-ready-role='PARENT'] #missionView .progressSteps,html[data-ready-role='PARENT'] #missionView .glassCard,html[data-ready-role='PARENT'] #missionView .missionPreview,html[data-ready-role='PARENT'] #missionView .stackActions{display:none!important}
      html[data-ready-role='PARENT'] #missionView .pageHeader .kicker{display:none}
      html[data-ready-role='PARENT'] #missionView .pageHeader h1{font-size:26px}
    `;
    document.head.appendChild(s);
  }

  function applyExplorerTerms(){
    if(ROLE!=='CHILD') return;
    const replacements = new Map([
      ['타임어택 작전 설정','오늘의 탐험 준비'],['오늘 목표 정하기','오늘 탐험 정하기'],['작전 개시 전, 응원 요청!','가족에게 응원 요청'],
      ['작전 기록실','탐험 기록'],['작전 일지','탐험 일지'],['오늘의 작전 미리보기','오늘의 탐험 미리보기'],['작전 공유하기','가족에게 응원 요청'],
      ['타임어택 START','탐험 시작'],['오늘의 작전 보고서','오늘의 탐험 기록'],['오늘의 작전','오늘의 탐험'],['작전 완료','탐험 완료']
    ]);
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length) return;
      const t=(el.textContent||'').trim();
      if(replacements.has(t)) el.textContent=replacements.get(t);
    });
  }

  function currentDay(){ const p=loadPlanner(); return {p,day:ensureDay(p,todayKey())}; }

  function renderChildSurface(){
    const missionMain=document.querySelector('#missionView main'); if(!missionMain) return;
    let root=document.getElementById('rsfChildSurface');
    if(!root){root=document.createElement('section');root.id='rsfChildSurface';root.className='rsf-card';missionMain.prepend(root)}
    const {p,day}=currentDay();
    const tasks=(day.tasks||[]).filter(t=>t.status!=='COMPLETED');
    root.innerHTML=`<span class="rsf-role-badge">아이 화면 · 실행 중심</span><h2>오늘 뭐부터 할까?</h2><p>Planner가 오늘 할 일을 준비했어요. 지금 할 것을 골라 탐험을 시작해요.</p><div class="rsf-task-list">${tasks.length?tasks.map(t=>`<label class="rsf-task"><input type="checkbox" data-rsf-select="${esc(t.id)}" ${t.selected?'checked':''}><span><b>${esc(t.title||t.subject||'할 일')}</b><small>${esc(t.volume||'분량 미입력')}${t.estimatedMin?` · 예상 ${esc(t.estimatedMin)}분`:''}</small>${t.origin==='CHILD_ADDED'?'<span class="tag">학교에서 추가 · 부모 확인 예정</span>':''}</span></label>`).join(''):'<div class="rsf-task"><span></span><span><b>오늘 배정된 할 일이 아직 없어요.</b><small>학교에서 새 숙제가 생겼다면 아래에서 추가할 수 있어요.</small></span></div>'}</div><div class="rsf-event"><input id="rsfEventInput" placeholder="+ 학교에서 새 숙제 생겼어요"><button id="rsfEventAdd">추가</button></div>`;
    root.querySelectorAll('[data-rsf-select]').forEach(ch=>ch.addEventListener('change',()=>{
      const q=loadPlanner(),d=ensureDay(q,todayKey()),task=d.tasks.find(t=>t.id===ch.dataset.rsfSelect);if(task)task.selected=ch.checked;savePlanner(q);
      const apply=document.querySelector('#todayPlannerCard [data-plan-action="apply"]');if(apply) apply.click();
    }));
    root.querySelector('#rsfEventAdd')?.addEventListener('click',()=>{
      const input=root.querySelector('#rsfEventInput'),title=input?.value.trim();if(!title)return;
      const q=loadPlanner(),d=ensureDay(q,todayKey());d.tasks.push({id:id('todo'),localDate:todayKey(),subject:'학교',sourceDay:'오늘',title,volume:'',difficulty:'미확정',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:'미확정',selected:false,status:'PLANNED',origin:'CHILD_ADDED',reviewState:'PARENT_REVIEW_PENDING',note:'아이 이벤트 숙제 추가 · 실행 가능 · 부모 확인 시 세부정보 보완'});savePlanner(q);renderChildSurface();
    });
  }

  function renderParentSurface(){
    const missionMain=document.querySelector('#missionView main'); if(!missionMain) return;
    const header=document.querySelector('#missionView .pageHeader h1');if(header)header.textContent='숙제 입력 · 확인';
    let root=document.getElementById('rsfParentSurface');if(!root){root=document.createElement('section');root.id='rsfParentSurface';root.className='rsf-card';missionMain.prepend(root)}
    const {day}=currentDay();const tasks=day.tasks||[];
    root.innerHTML=`<span class="rsf-role-badge">부모 화면 · 입력/확인 중심</span><h2>숙제 내용만 입력해 주세요</h2><p>부모가 날짜를 배포하지 않습니다. 분량·마감처럼 실제 사실을 입력하면 Planner가 일정과 난이도, 실제 수행기록을 보고 자동 배정합니다.</p><div class="rsf-parent-grid">${tasks.map(t=>`<div class="rsf-parent-task" data-rsf-parent="${esc(t.id)}"><b>${esc(t.title||'숙제')}</b>${t.origin==='CHILD_ADDED'?'<span class="rsf-role-badge">아이 추가 · 확인 필요</span>':''}<div class="row"><input data-field="volume" placeholder="분량 예: p.12~18" value="${esc(t.volume||'')}"><select data-field="difficulty"><option ${t.difficulty==='미확정'?'selected':''}>미확정</option><option ${String(t.difficulty).includes('낮')?'selected':''}>낮음</option><option ${String(t.difficulty).includes('보통')?'selected':''}>보통</option><option ${String(t.difficulty).includes('높')?'selected':''}>높음</option></select><input data-field="estimatedMin" type="number" min="1" max="240" placeholder="예상 분" value="${Number.isFinite(Number(t.estimatedMin))?esc(t.estimatedMin):''}"></div><div class="row"><input data-field="deadline" placeholder="마감" value="${esc(t.deadline||'')}"><input data-field="subject" placeholder="과목" value="${esc(t.subject||'')}"><input data-field="title" placeholder="숙제명" value="${esc(t.title||'')}"></div><div class="rsf-parent-note">${esc(t.note||'Planner가 자동 배정할 입력값입니다.')}</div></div>`).join('')}</div><div class="rsf-event"><input id="rsfParentNew" placeholder="새 숙제명"><button id="rsfParentAdd" class="rsf-secondary">숙제 추가</button></div><div class="rsf-parent-actions"><button id="rsfParentSave" class="rsf-primary">입력 내용 저장</button></div>`;
    root.querySelector('#rsfParentAdd')?.addEventListener('click',()=>{const input=root.querySelector('#rsfParentNew'),title=input?.value.trim();if(!title)return;const q=loadPlanner(),d=ensureDay(q,todayKey());d.tasks.push({id:id('todo'),localDate:todayKey(),subject:'기타',sourceDay:'오늘',title,volume:'',difficulty:'미확정',estimatedMin:null,estimateKind:'UNVERIFIED',deadline:'미확정',selected:false,status:'INBOX',origin:'PARENT_INPUT',note:'부모 입력 원본 · Planner 자동배정 대기'});savePlanner(q);renderParentSurface();});
    root.querySelector('#rsfParentSave')?.addEventListener('click',()=>{
      const q=loadPlanner(),d=ensureDay(q,todayKey());root.querySelectorAll('[data-rsf-parent]').forEach(card=>{const t=d.tasks.find(x=>x.id===card.dataset.rsfParent);if(!t)return;card.querySelectorAll('[data-field]').forEach(el=>{let v=el.value;if(el.dataset.field==='estimatedMin')v=v?Number(v):null;t[el.dataset.field]=v;});if(t.origin==='CHILD_ADDED')t.reviewState='PARENT_REVIEWED';});savePlanner(q);toast('숙제 입력을 저장했어요. Planner 배정 기준으로 사용합니다.');renderParentSurface();
    });
  }

  function patchHome(){
    if(ROLE==='PARENT'){
      document.querySelectorAll('[data-nav="mission"]').forEach(b=>{const strong=b.querySelector('b');if(strong)strong.textContent='숙제 입력 · 확인';const small=b.querySelector('small');if(small)small.textContent='분량·마감 등 실제 숙제 정보 입력';});
      const share=document.getElementById('preShareBtn');if(share)share.style.display='none';
    } else {
      const main=document.querySelector('.commandCard [data-nav="mission"] b');if(main)main.textContent='오늘 탐험 정하기';
      const small=document.querySelector('.commandCard [data-nav="mission"] small');if(small)small.textContent='오늘 할 일을 고르고 목표 시간을 정해요';
      const share=document.getElementById('preShareBtn');if(share){const b=share.querySelector('b');if(b)b.textContent='가족에게 응원 요청';const s=share.querySelector('small');if(s)s.textContent='오늘의 탐험과 목표를 선택적으로 공유';}
    }
  }

  function toast(msg){ window.toast ? window.toast(msg) : alert(msg); }
  function boot(){
    document.documentElement.dataset.readyStageF=VERSION;document.documentElement.dataset.readyRole=ROLE;
    injectStyles();patchHome();applyExplorerTerms();
    if(ROLE==='PARENT')renderParentSurface();else renderChildSurface();
    const mo=new MutationObserver(()=>{patchHome();applyExplorerTerms();if(ROLE==='PARENT')renderParentSurface();else renderChildSurface();});
    mo.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.ReadyStageF=Object.freeze({version:VERSION,role:ROLE,render:()=>ROLE==='PARENT'?renderParentSurface():renderChildSurface()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();