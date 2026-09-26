(function(root){
  'use strict';

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));
    const labelFor=options.captureDraftLabel||((v)=>String(v||''));
    const warningsFor=options.captureDraftWarnings||((d)=>Array.isArray(d?.warnings)?d.warnings:[]);
    const confidenceFor=options.captureDraftConfidence||(()=>0);

    function renderStatus(session){
      const badge=q('#captureStateBadge'),status=q('#captureAnalysisStatus');
      if(!badge||!status)return;
      if(!session){
        badge.textContent='임시저장';
        status.textContent='촬영하면 자동으로 임시저장됩니다.';
        return;
      }
      badge.textContent=session.status==='TEMP_CAPTURE'
        ?'임시저장'
        :session.analysis_state==='WAITING_ANALYSIS_ADAPTER'
          ?'분석 대기'
          :'저장됨';
      status.textContent=session.analysis_state==='WAITING_ANALYSIS_ADAPTER'
        ?'원본 저장 완료 · OCR/분류 분석기 연결 대기 중입니다. 가짜 분석 결과는 만들지 않습니다.'
        :session.analysis_state==='ANALYSIS_COMPLETE'
          ?'분석 결과가 준비되었습니다. Parent 검토 후 FACT로 확정하세요.'
          :session.analysis_state==='ANALYSIS_FAILED'
            ?`분석 실패 · ${escapeHtml(session.analysis_result?.reason||'원본은 보존되어 있으며 다시 분석할 수 있습니다.')}`
            :session.status==='TEMP_CAPTURE'
              ?'촬영할 때마다 자동 임시저장 중입니다.'
              :'촬영 세션이 저장되었습니다.';
    }

    function renderGroups(groups=[]){
      const root=q('#captureGroupSummary'); if(!root)return;
      root.innerHTML=groups.length?groups.map(g=>{
        const label=String(g.group_key||'').replace('TALENT:','').replace('ENGLISH:','영어 · ');
        const kinds=Object.entries(g.kinds||{}).map(([k,n])=>`${k} ${n}`).join(' · ');
        return `<div class="adminListItem"><span><b>${escapeHtml(label)}</b><small>${escapeHtml(kinds||'자료 저장됨')}</small></span><strong>${g.total}장</strong></div>`;
      }).join(''):'';
    }

    function renderReview(session){
      const section=q('#captureReviewSection'),root=q('#captureReviewDrafts'),reanalyze=q('#captureReanalyzeBtn');
      if(!section||!root)return;
      const drafts=session?.analysis_state==='ANALYSIS_COMPLETE'&&Array.isArray(session.analysis_result?.drafts)
        ?session.analysis_result.drafts:[];
      section.hidden=!drafts.length;
      if(reanalyze)reanalyze.hidden=!drafts.length;
      if(!drafts.length){root.innerHTML='';return}

      const history=Array.isArray(session.analysis_history)?session.analysis_history:[];
      const dispositions=Array.isArray(session.analysis_result?.capture_item_dispositions)?session.analysis_result.capture_item_dispositions:[];
      const unresolved=dispositions.filter(x=>x.disposition==='UNRESOLVED');
      const unresolvedHtml=unresolved.length?`<div class="captureReviewClosure">
        <div class="adminSectionHead"><div><small>NO SILENT LOSS</small><h2>미해결 촬영 원본 ${unresolved.length}건</h2></div><span>Parent 처리 필요</span></div>
        ${unresolved.map(row=>{
          const sameGroupDrafts=drafts.map((d,i)=>({d,i})).filter(x=>x.d.group_key===row.group_key);
          const firstDraft=sameGroupDrafts[0]?.d;
          return `<div class="adminListItem" data-unresolved-capture="${escapeHtml(row.capture_item_id)}">
            <span><b>${escapeHtml(labelFor(row.group_key))}</b><small>${escapeHtml(row.capture_kind)} · 분석 결과에 근거 연결이 없습니다.</small></span>
            <span class="captureDispositionActions">
              ${firstDraft?`<button type="button" class="miniAction" data-link-capture-item="${escapeHtml(row.capture_item_id)}" data-review-draft-id="${escapeHtml(firstDraft.review_draft_id)}">현재 초안에 연결</button>`:''}
              <button type="button" class="miniAction" data-ignore-capture-item="${escapeHtml(row.capture_item_id)}">분석 제외</button>
            </span>
          </div>`;
        }).join('')}
      </div>`:'';

      root.innerHTML=(history.length?`<div class="adminListItem"><span><b>분석 이력</b><small>이전 분석 ${history.length}회 보존 · 현재 실행 #${session.analysis_result?.analysis_run_no||session.analysis_run_no||1}</small></span><strong>HISTORY</strong></div>`:'')
        +unresolvedHtml
        +drafts.map((draft,index)=>{
          const warnings=warningsFor(draft);
          const detail=[
            draft.source_range?`범위 ${draft.source_range}`:'',
            draft.teacher_instruction?`지시 ${draft.teacher_instruction}`:'',
            `신뢰도 ${confidenceFor(draft)}%`,
            `초안 v${draft.draft_version||1}`
          ].filter(Boolean).join(' · ');
          return `<div class="captureReviewDraft">
            <div>
              <b>${escapeHtml(labelFor(draft.group_key))}</b>
              <small>${escapeHtml(detail||'분석 초안')}</small>
              ${warnings.length?`<small class="captureWarnings">확인 필요 · ${escapeHtml(warnings.join(' / '))}</small>`:''}
            </div>
            <button type="button" class="miniAction" data-apply-capture-draft="${index}">폼에 적용</button>
          </div>`;
        }).join('');
      root._drafts=drafts;
    }

    return Object.freeze({renderStatus,renderGroups,renderReview});
  }

  root.ReadyRebuildCaptureView=Object.freeze({
    version:'READY_REBUILD_CAPTURE_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
