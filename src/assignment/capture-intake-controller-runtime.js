(function(root){
  'use strict';

  function create(options={}){
    const query=options.query||((s)=>root.document.querySelector(s));
    const eventTarget=options.eventTarget||root.document;
    const runtime=options.runtime;
    const view=options.view;
    const applyDraft=options.applyDraft||(()=>Promise.resolve());
    const requireParentUi=options.requireParentUi||(()=>false);
    const toast=options.toast||(()=>{});
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));
    let previewUrls=[];
    let bound=false;
    if(!runtime||!view)throw new Error('CAPTURE_INTAKE_CONTROLLER_DEPENDENCY_MISSING');

    function clearPreviewUrls(){
      for(const url of previewUrls){try{URL.revokeObjectURL(url)}catch{}}
      previewUrls=[];
    }

    async function render(){
      const summaryRoot=query('#captureGroupSummary');
      const previewRoot=query('#capturePreviewList');
      if(!summaryRoot||!previewRoot)return {ok:false,reason:'CAPTURE_VIEW_MISSING'};

      clearPreviewUrls();
      const {session,groups,items}=await runtime.loadReview();
      view.renderStatus(session);

      if(!session){
        summaryRoot.innerHTML='<div class="plannerEmpty"><b>촬영한 자료가 없어요.</b><small>자료 그룹을 고르고 촬영을 시작하세요.</small></div>';
        previewRoot.innerHTML='';
        view.renderReview(null);
        return {ok:true,session:null,groups:[],items:[]};
      }

      view.renderGroups(groups);
      previewRoot.innerHTML='';
      for(const item of items){
        const card=root.document.createElement('article');
        card.className='capturePreviewItem';
        const url=item.preview_url;
        if(url)previewUrls.push(url);
        const label=String(item.group_key||'').replace('TALENT:','').replace('ENGLISH:','영어 · ');
        card.innerHTML=`
          ${url?`<img src="${url}" alt="${escapeHtml(label)} 촬영 미리보기">`:'<div class="capturePreviewPlaceholder">IMAGE</div>'}
          <div><b>${escapeHtml(label)}</b><small>${escapeHtml(item.kind)} · ${Math.max(1,Math.round((item.size||0)/1024))}KB</small></div>
          ${session.status==='TEMP_CAPTURE'?`<button type="button" data-remove-capture="${item.capture_item_id}" aria-label="촬영 삭제">×</button>`:''}
        `;
        previewRoot.appendChild(card);
      }
      view.renderReview(session);
      return {ok:true,session,groups,items};
    }

    async function captureFiles(files){
      if(!files?.length)return {ok:false,reason:'NO_FILES'};
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const group=query('#captureGroupSelect')?.value||'TALENT:연산';
      const kind=query('#captureKindSelect')?.value||'RANGE';
      const created=await runtime.addFiles(files,{group_key:group,kind});
      toast(created.length===1?'촬영 자료를 임시저장했어요.':`${created.length}장 임시저장했어요.`);
      await render();
      return {ok:true,created};
    }

    async function onFileChange(event){
      const files=event.target.files;
      await captureFiles(files);
      event.target.value='';
    }

    async function setTarget(){
      return runtime.setTarget(query('#captureGroupSelect').value,query('#captureKindSelect').value);
    }

    async function onDocumentClick(event){
      const linkItem=event.target.closest?.('[data-link-capture-item]');
      if(linkItem){
        const result=await runtime.resolveDisposition(linkItem.dataset.linkCaptureItem,{
          disposition:'LINKED_TO_REVIEW_DRAFT',
          review_draft_id:linkItem.dataset.reviewDraftId
        });
        toast(result?.ok?'촬영 원본을 현재 검토 초안에 연결했어요.':'촬영 원본 연결을 완료하지 못했습니다.');
        await render();
        return;
      }
      const ignoreItem=event.target.closest?.('[data-ignore-capture-item]');
      if(ignoreItem){
        const result=await runtime.resolveDisposition(ignoreItem.dataset.ignoreCaptureItem,{
          disposition:'IGNORED_WITH_REASON',
          reason:'PARENT_MARKED_NOT_ASSIGNMENT_SOURCE'
        });
        toast(result?.ok?'숙제 FACT에 사용하지 않는 원본으로 기록했어요.':'분석 제외 처리를 완료하지 못했습니다.');
        await render();
        return;
      }
      const apply=event.target.closest?.('[data-apply-capture-draft]');
      if(apply){
        const drafts=query('#captureReviewDrafts')?._drafts||[];
        await applyDraft(drafts[Number(apply.dataset.applyCaptureDraft)]);
        return;
      }
      const remove=event.target.closest?.('[data-remove-capture]');
      if(remove){
        await runtime.removeItem(remove.dataset.removeCapture);
        toast('촬영 자료를 삭제했어요.');
        await render();
      }
    }

    async function reanalyze(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=await runtime.requestAnalysis();
      if(!result?.ok){
        toast('재분석에 실패했습니다. 기존 초안과 원본은 그대로 보존돼요.');
        await render();
        return result;
      }
      toast('새 분석 초안을 만들었어요. 이전 초안은 이력으로 보존됩니다.');
      await render();
      return result;
    }

    async function analyze(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=await runtime.requestAnalysis();
      if(!result?.ok){
        const reason=result?.result?.reason||result?.reason;
        const message=reason==='ANALYSIS_PROVIDER_NOT_CONFIGURED'
          ?'분석 서버 키가 아직 설정되지 않았습니다. 원본은 그대로 보존했어요.'
          :reason==='PARENT_AUTH_REQUIRED'
            ?'Parent 로그인 후 분석할 수 있습니다.'
            :reason==='NO_CAPTURE_ITEMS'
              ?'먼저 자료를 촬영해 주세요.'
              :'분석에 실패했습니다. 원본은 보존되어 다시 시도할 수 있어요.';
        toast(message);
        await render();
        return result;
      }
      toast(result.analysis_state==='ANALYSIS_COMPLETE'?'분석 초안이 준비됐어요. Parent 검토가 필요합니다.':'저장하고 분석을 시작했어요.');
      await render();
      return result;
    }

    function bind(){
      if(bound)return false;
      bound=true;
      query('#homeworkCameraInput')?.addEventListener('change',onFileChange);
      query('#homeworkGalleryInput')?.addEventListener('change',onFileChange);
      query('#captureGroupSelect')?.addEventListener('change',setTarget);
      query('#captureKindSelect')?.addEventListener('change',setTarget);
      eventTarget.addEventListener?.('click',onDocumentClick);
      query('#captureReanalyzeBtn')?.addEventListener('click',reanalyze);
      query('#captureAnalyzeBtn')?.addEventListener('click',analyze);
      return true;
    }

    return Object.freeze({render,captureFiles,setTarget,reanalyze,analyze,bind,clearPreviewUrls});
  }

  root.ReadyRebuildCaptureIntakeController=Object.freeze({
    version:'READY_REBUILD_CAPTURE_INTAKE_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
