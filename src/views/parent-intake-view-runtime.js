(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));
    const talentBooks=options.talentBooks||[];
    const localDateKey=options.localDateKey||(()=>'');

    function ensureTalentRows(){
      const root=q('#talentBookFacts');
      if(root&&!root.children.length){
        root.innerHTML=talentBooks.map(subject=>`
          <div class="adminGrid two" data-talent-book="${subject}">
            <label class="inputBlock">${subject} 범위<input data-range placeholder="숙제 범위"></label>
            <label class="inputBlock">${subject} 교사 지시<input data-instruction placeholder="지시사항"></label>
            <input data-answer type="hidden" value="">
          </div>`).join('');
      }
    }

    function renderFactStatus(assignments){
      const status=q('#assignmentFactStatus');
      const projection=assignments?.project?.('PARENT');
      if(!status||!projection)return;
      const pending=assignments?.pendingChildFacts?.()||[];
      const pendingIds=new Set(pending.map(x=>x.assignment_id));
      status.innerHTML=projection.facts.slice(-20).reverse().map(f=>{
        const childPending=pendingIds.has(f.assignment_id);
        const actions=childPending?`<div class="adminInlineActions"><button class="miniAction" data-child-fact-confirm="${f.assignment_id}">확인</button><button class="miniAction" data-child-fact-reject="${f.assignment_id}">제외</button></div>`:'';
        const label=f.title||f.book_subject||f.subject||'숙제 제안';
        return `<div class="adminListItem"><span><b>${escapeHtml(label)}</b><small>${childPending?'CHILD 제안 · Parent 확인 대기':escapeHtml(f.confirmation_state)} · ${escapeHtml(f.analysis_state)}</small></span>${actions}</div>`;
      }).join('');
    }

    function renderLearningSummary(assignments,learningMasterVersion){
      const root=q('#learningMasterSummary');
      const domain=assignments?.load?.();
      if(root&&domain){
        const rows=Object.values(domain.assignmentFacts||{}).filter(f=>f.current_analysis_id).slice(-12).reverse();
        root.innerHTML=rows.length?rows.map(f=>{
          const analysis=domain.analyses?.[f.current_analysis_id];
          const units=(analysis?.learning_unit_ids||[]).map(id=>domain.learningUnits?.[id]).filter(Boolean);
          const maxDifficulty=units.reduce((m,u)=>Math.max(m,u.activity_load?.difficulty||0),0);
          const maxLoad=units.reduce((m,u)=>Math.max(m,u.activity_load?.score||0),0);
          const recovery=units.some(u=>u.activity_load?.recovery_need==='HIGH')?'회복 필요 높음':units.some(u=>u.activity_load?.recovery_need==='MEDIUM')?'회복 필요 보통':'회복 부담 낮음';
          const unresolved=[...new Set(units.flatMap(u=>u.unresolved_flags||[]))];
          return `<div class="adminListItem"><span><b>${escapeHtml(f.book_subject||f.subject)} · ${units.length}개 학습단위</b><small>난이도 ${maxDifficulty||'-'} · 부하 ${maxLoad||'-'} · ${recovery}${unresolved.length?` · 확인 ${unresolved.length}건`:''}</small></span></div>`;
        }).join(''):'<div class="plannerEmpty"><b>아직 해석된 숙제가 없어요.</b><small>FACT 확인 후 Learning Master가 학습단위를 만듭니다.</small></div>';
      }
      const version=q('#learningMasterVersion');
      if(version)version.textContent='v'+(learningMasterVersion||'0.5.1');
      const sourceDate=q('#talentSourceDate');
      if(sourceDate&&!sourceDate.value)sourceDate.value=localDateKey();
    }

    function render({assignments,learningMasterVersion}={}){
      ensureTalentRows();
      renderFactStatus(assignments);
      renderLearningSummary(assignments,learningMasterVersion);
      return {ok:true};
    }

    return Object.freeze({render,ensureTalentRows,renderFactStatus,renderLearningSummary});
  }

  root.ReadyRebuildParentIntakeView=Object.freeze({
    version:'READY_REBUILD_PARENT_INTAKE_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
