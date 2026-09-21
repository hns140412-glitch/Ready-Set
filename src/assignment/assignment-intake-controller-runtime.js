(function(root){
  'use strict';

  function create(options={}){
    const query=options.query||((s)=>root.document.querySelector(s));
    const queryAll=options.queryAll||((s)=>[...root.document.querySelectorAll(s)]);
    const eventTarget=options.eventTarget||root.document;
    const assignments=options.assignments||(()=>root.ReadyAssignments);
    const integration=options.integration||(()=>root.ReadyIntegrationV1);
    const learningMaster=options.learningMaster||(()=>root.ReadyLearningMasterV01);
    const assignmentService=options.assignmentService;
    const parentView=options.parentView;
    const captureService=options.captureService;
    const renderCapture=options.renderCapture||(()=>Promise.resolve());
    const requireParentUi=options.requireParentUi||(()=>false);
    const localDateKey=options.localDateKey;
    const parsePrints=options.parsePrints||(()=>[]);
    const toast=options.toast||(()=>{});
    const renderPlanner=options.renderPlanner||(()=>{});
    const renderMission=options.renderMission||(()=>{});
    const talentBooks=options.talentBooks||[];
    let bound=false;
    if(!assignmentService||!parentView||!captureService||!localDateKey)throw new Error('ASSIGNMENT_INTAKE_CONTROLLER_DEPENDENCY_MISSING');

    async function render(){
      parentView.render({
        assignments:assignments(),
        learningMasterVersion:learningMaster()?.version||'0.5.1'
      });
      await Promise.resolve(renderCapture()).catch(()=>{});
      return {ok:true};
    }

    async function capturedRefs(groupKey){
      return captureService.capturedRefs(groupKey);
    }

    async function recordCaptureReview(groupKey,reviewedValue,event='PARENT_REVIEWED'){
      return captureService.recordCaptureReview(groupKey,reviewedValue,event);
    }

    function refresh(){
      render();
      renderPlanner();
      renderMission();
    }

    async function confirmChildFact(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      try{
        const reviewed=assignments()?.reviewChildFact?.(id,{actor:'PARENT',decision:'CONFIRM'});
        const processed=reviewed?.ok?integration()?.processAssignment?.(id,{start_date:localDateKey()}):null;
        toast(processed?.ok?'숙제를 확인했고 Planner가 TODAY 후보를 만들었어요.':reviewed?.ok?'숙제를 확인했어요. Planner 배정 조건을 더 확인해야 합니다.':'숙제 확인을 완료하지 못했어요.');
        refresh();
        return {ok:!!reviewed?.ok,reviewed,processed};
      }catch(error){
        toast(error?.message||'숙제 확인을 완료하지 못했어요.');
        refresh();
        return {ok:false,reason:'CHILD_FACT_CONFIRM_FAILED',error};
      }
    }

    async function rejectChildFact(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      try{
        const reviewed=assignments()?.reviewChildFact?.(id,{actor:'PARENT',decision:'REJECT',reason:'PARENT_REJECTED_CHILD_INPUT'});
        toast('이 CHILD 숙제 제안은 Planner에 보내지 않았어요.');
        refresh();
        return {ok:!!reviewed?.ok,reviewed};
      }catch(error){
        toast(error?.message||'숙제 제외를 완료하지 못했어요.');
        refresh();
        return {ok:false,reason:'CHILD_FACT_REJECT_FAILED',error};
      }
    }

    async function saveTalent(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const source=query('#talentSourceDate').value;
      const deadline=query('#talentDeadline').value;
      if(!source||!deadline){toast('받은 날과 다음 화요일 경계를 확인해 주세요.');return {ok:false,reason:'DATE_REQUIRED'};}
      const books=[];
      for(const row of queryAll('[data-talent-book]')){
        const subject=row.dataset.talentBook;
        const captured=await capturedRefs('TALENT:'+subject);
        const reviewedValue={
          source_range:row.querySelector('[data-range]').value.trim(),
          teacher_instruction:row.querySelector('[data-instruction]').value.trim()
        };
        const reviewProvenance=await recordCaptureReview('TALENT:'+subject,reviewedValue,'PARENT_REVIEWED');
        books.push({
          subject,
          ...reviewedValue,
          artifact_refs:captured.source,
          answer_reference_ids:captured.answers,
          provenance:reviewProvenance
            ?{kind:'PARENT_REVIEWED_CAPTURE',surface:'PARENT_INTAKE',capture_review:reviewProvenance}
            :{kind:'PARENT_INPUT',surface:'PARENT_INTAKE'}
        });
      }
      const result=await assignmentService.saveTalent({source,deadline,books});
      if(!result.ok){
        if(result.reason==='TALENT_RANGE_MISSING')toast('재능 6권의 숙제 범위를 모두 입력해 주세요.');
        else if(result.reason==='CAPTURE_REVIEW_UNRESOLVED')toast(`${result.subject||'재능'} 촬영 원본 ${result.unresolved_count||0}건을 먼저 연결하거나 분석 제외로 처리해 주세요.`);
        else if(result.reason==='DUPLICATE_TALENT_FACT')toast('같은 재능 FACT가 이미 저장·확정되어 있어 중복 생성하지 않았어요.');
        else toast('재능 FACT 저장 조건을 확인해 주세요.');
        return result;
      }
      toast(`재능 6권 분석 완료 · Planner가 ${result.todoCount}개 탐험을 배정했어요${result.held?` · 보류 ${result.held}건`:''}.`);
      refresh();
      return result;
    }

    async function saveEnglish(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const name=query('#englishWorkbook').value.trim();
      const range=query('#englishRange').value.trim();
      if(!name||!range){toast('문제집과 숙제 범위를 확인해 주세요.');return {ok:false,reason:'ENGLISH_RANGE_REQUIRED'};}
      const result=await assignmentService.saveEnglish({
        name,
        range,
        nextAcademy:query('#englishNextAcademy').value,
        weekdayPrints:parsePrints(query('#englishPrints').value),
        components:{
          grammar:query('#englishGrammar').value.trim(),
          reading:query('#englishReading').value.trim(),
          vocabulary:query('#englishVocabulary').value.trim(),
          listening:query('#englishListening').value.trim(),
          recording:query('#englishRecording').value.trim(),
          writing:query('#englishWriting').value.trim()
        },
        teacherInstruction:query('#englishInstruction').value.trim(),
        sourceDate:localDateKey()
      });
      if(!result.ok){
        if(result.reason==='DUPLICATE_ENGLISH_FACT')toast('같은 영어 FACT가 이미 저장·확정되어 있어 중복 생성하지 않았어요.');
        else if(result.reason==='CAPTURE_REVIEW_UNRESOLVED')toast(`영어 촬영 원본 ${result.unresolved_count||0}건을 먼저 연결하거나 분석 제외로 처리해 주세요.`);
        else toast('영어 FACT 저장 조건을 확인해 주세요.');
        return result;
      }
      const fact=result.fact,processed=result.processed;
      if(fact.deadline_state==='NEXT_ACADEMY_UNVERIFIED'||processed?.reason==='NEXT_ACADEMY_UNVERIFIED'){
        toast('영어 FACT 저장 · 다음 학원 일정 확인 전 분석/배정 보류');
      }else if(processed?.ok){
        toast(`영어 숙제 분석 완료 · Planner가 ${(processed.todos||[]).length}개 탐험을 배정했어요.`);
      }else if(processed?.reason==='FACT_REVISION_IN_PROGRESS_HOLD'){
        toast('영어 FACT 수정은 저장했어요. 진행 중인 기존 탐험이 끝난 뒤 새 기준으로 재배정됩니다.');
      }else{
        toast('영어 FACT는 저장했지만 배정 조건을 더 확인해야 해요.');
      }
      refresh();
      return result;
    }

    async function onDocumentClick(event){
      const confirm=event.target.closest?.('[data-child-fact-confirm]');
      if(confirm){await confirmChildFact(confirm.dataset.childFactConfirm);return;}
      const reject=event.target.closest?.('[data-child-fact-reject]');
      if(reject)await rejectChildFact(reject.dataset.childFactReject);
    }

    function bind(){
      if(bound)return false;
      bound=true;
      eventTarget.addEventListener?.('click',onDocumentClick);
      query('#saveTalentFactsBtn')?.addEventListener('click',saveTalent);
      query('#saveEnglishFactBtn')?.addEventListener('click',saveEnglish);
      return true;
    }

    return Object.freeze({render,confirmChildFact,rejectChildFact,saveTalent,saveEnglish,bind});
  }

  root.ReadyRebuildAssignmentIntakeController=Object.freeze({
    version:'READY_REBUILD_ASSIGNMENT_INTAKE_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
