(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const planner=options.planner||(()=>root.ReadySetPlanner);
    const integration=options.integration||(()=>root.ReadyIntegrationV1);
    const query=options.query||((s)=>root.document?.querySelector?.(s));
    const eventTarget=options.eventTarget||root.document;
    const requireParentUi=options.requireParentUi||(()=>false);
    const localDateKey=options.localDateKey;
    const addDays=options.addDays;
    const nav=options.nav||(()=>{});
    const toast=options.toast||(()=>{});
    const renderParentIntake=options.renderParentIntake||(()=>{});
    const renderPlanner=options.renderPlanner||(()=>{});
    let bound=false;
    if(!view||!localDateKey||!addDays)throw new Error('PLANNER_ADMIN_CONTROLLER_DEPENDENCY_MISSING');

    function snapshot(){
      return planner()?.snapshot?.()||{dated_todos:[],schedule_commitments:[],daily_availability_windows:[],carry_over_queue:[]};
    }

    function clearScheduleForm(){
      query('#scheduleId').value='';
      query('#scheduleTitle').value='';
      query('#scheduleCategory').value='';
      query('#scheduleDate').value=localDateKey();
      query('#scheduleWeekly').checked=false;
      query('#scheduleWeekday').value='1';
      query('#scheduleStart').value='';
      query('#scheduleEnd').value='';
      query('#scheduleMovable').checked=false;
    }

    function clearScheduleExceptionForm(){
      query('#scheduleExceptionCommitment').value='';
      query('#scheduleExceptionDate').value=localDateKey();
      query('#scheduleExceptionType').value='SKIP';
      query('#scheduleExceptionStart').value='';
      query('#scheduleExceptionEnd').value='';
      query('#scheduleExceptionNote').value='';
    }

    function clearAvailabilityForm(){
      query('#availabilityId').value='';
      query('#availabilityDate').value=localDateKey();
      query('#availabilityWeekly').checked=false;
      query('#availabilityWeekday').value='1';
      query('#availabilityStart').value='';
      query('#availabilityEnd').value='';
    }

    function render(){
      if(!requireParentUi()){nav('planner');return {ok:false,reason:'PARENT_REQUIRED'};}
      const scheduleRoot=query('#scheduleAdminList');
      if(!scheduleRoot)return {ok:false,reason:'ADMIN_VIEW_MISSING'};
      const snap=snapshot();
      view.render(snap);
      if(!query('#scheduleDate').value)query('#scheduleDate').value=localDateKey();
      if(!query('#availabilityDate').value)query('#availabilityDate').value=localDateKey();
      if(!query('#scheduleExceptionDate').value)query('#scheduleExceptionDate').value=localDateKey();
      renderParentIntake();
      return {ok:true,snapshot:snap};
    }

    function editSchedule(id){
      const item=snapshot().schedule_commitments.find(v=>v.commitment_id===id);
      if(!item)return false;
      query('#scheduleId').value=item.commitment_id;
      query('#scheduleTitle').value=item.title||'';
      query('#scheduleCategory').value=item.category||'';
      query('#scheduleWeekly').checked=item.recurrence==='WEEKLY';
      query('#scheduleWeekday').value=String(item.weekday??1);
      query('#scheduleDate').value=item.recurrence==='WEEKLY'?localDateKey():String(item.start_at||'').slice(0,10);
      query('#scheduleStart').value=item.recurrence==='WEEKLY'?(item.start||''):String(item.start_at||'').slice(11,16);
      query('#scheduleEnd').value=item.recurrence==='WEEKLY'?(item.end||''):String(item.end_at||'').slice(11,16);
      query('#scheduleMovable').checked=!!item.planner_movable;
      return true;
    }

    function editAvailability(id){
      const item=snapshot().daily_availability_windows.find(v=>v.availability_id===id);
      if(!item)return false;
      query('#availabilityId').value=item.availability_id;
      query('#availabilityWeekly').checked=item.recurrence==='WEEKLY';
      query('#availabilityDate').value=item.date||localDateKey();
      query('#availabilityWeekday').value=String(item.weekday??1);
      query('#availabilityStart').value=item.start||'';
      query('#availabilityEnd').value=item.end||'';
      return true;
    }

    function refresh(){
      render();
      renderPlanner();
    }

    function removeAvailability(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const removed=planner()?.removeDailyAvailabilityWindow?.(id);
      toast(removed?.ok?'학습 가능 시간을 삭제했어요. Planner가 다음 배정부터 사용하지 않습니다.':'학습 가능 시간을 삭제하지 못했어요.');
      clearAvailabilityForm();refresh();
      return removed;
    }

    function reviewCarry(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=integration()?.reviewEscalatedCarryOver?.(id,{start_date:localDateKey()});
      toast(result?.ok?'학습 패턴을 다시 분석하고 Planner를 갱신했어요.':'학습 재검토를 완료하지 못했어요.');
      refresh();
      return result;
    }

    function readyCarry(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const resolved=planner()?.resolveCarryOver?.(id,{resolution:'READY_FOR_REPLAN',actor:'PARENT'});
      if(resolved?.ok){
        const tomorrow=localDateKey(addDays(new Date(),1));
        const replanned=planner()?.replanCarryOver?.({carry_over_id:id,date:tomorrow});
        toast(replanned?.ok?'남은 탐험을 다음 일정으로 옮겼어요.':'다시 계획 가능한 상태로 바꿨어요.');
        refresh();
        return replanned||resolved;
      }
      toast('남은 탐험 상태를 변경하지 못했어요.');
      refresh();
      return resolved;
    }

    function cancelCarry(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const resolved=planner()?.resolveCarryOver?.(id,{resolution:'CANCEL',actor:'PARENT'});
      toast(resolved?.ok?'이 남은 탐험은 종료했어요.':'종료 처리하지 못했어요.');
      refresh();
      return resolved;
    }

    function saveSchedule(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const title=query('#scheduleTitle').value.trim();
      const weekly=query('#scheduleWeekly').checked;
      const date=query('#scheduleDate').value;
      const start=query('#scheduleStart').value;
      const end=query('#scheduleEnd').value;
      if(!title||(!weekly&&!date)||!start||!end){toast('일정명·날짜/요일·시작·종료 시간을 확인해 주세요.');return {ok:false,reason:'INVALID_INPUT'};}
      if(end<=start){toast('종료 시간은 시작 시간보다 늦어야 해요.');return {ok:false,reason:'INVALID_RANGE'};}
      const result=planner()?.upsertScheduleCommitment?.({
        commitment_id:query('#scheduleId').value||undefined,
        title,
        category:query('#scheduleCategory').value.trim()||'OTHER',
        start_at:weekly?null:(date+'T'+start+':00'),
        end_at:weekly?null:(date+'T'+end+':00'),
        recurrence:weekly?'WEEKLY':null,
        weekday:weekly?Number(query('#scheduleWeekday').value):null,
        start:weekly?start:null,
        end:weekly?end:null,
        confirmed:true,
        planner_movable:query('#scheduleMovable').checked,
        parent_editable:true,
        source:'PARENT_ADMIN_UI'
      });
      toast('고정 일정을 저장했어요.');
      refresh();
      return result;
    }

    function saveScheduleException(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const commitmentId=query('#scheduleExceptionCommitment').value;
      const date=query('#scheduleExceptionDate').value;
      const type=query('#scheduleExceptionType').value;
      const start=query('#scheduleExceptionStart').value;
      const end=query('#scheduleExceptionEnd').value;
      const note=query('#scheduleExceptionNote').value.trim();
      const result=planner()?.upsertScheduleException?.({
        commitment_id:commitmentId,date,type,start,end,note,source:'PARENT_ADMIN_UI'
      });
      if(result?.ok)toast(type==='SKIP'?'이번 날짜만 휴강으로 반영했어요.':'이번 날짜만 변경 시간으로 반영했어요.');
      else if(result?.reason==='VALID_REPLACEMENT_TIME_REQUIRED')toast('변경 시작·종료 시간을 확인해 주세요.');
      else toast('반복 일정 예외를 저장하지 못했어요.');
      if(result?.ok){clearScheduleExceptionForm();refresh();}
      return result;
    }

    function removeScheduleException(id){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=planner()?.removeScheduleException?.({exception_id:id});
      toast(result?.ok?'일정 예외를 삭제했어요. 다시 기본 반복 일정이 적용됩니다.':'일정 예외를 삭제하지 못했어요.');
      refresh();
      return result;
    }

    function saveAvailability(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const weekly=query('#availabilityWeekly').checked;
      const date=query('#availabilityDate').value;
      const start=query('#availabilityStart').value;
      const end=query('#availabilityEnd').value;
      if((!weekly&&!date)||!start||!end){toast('날짜·시작·종료 시간을 확인해 주세요.');return {ok:false,reason:'INVALID_INPUT'};}
      if(end<=start){toast('종료 시간은 시작 시간보다 늦어야 해요.');return {ok:false,reason:'INVALID_RANGE'};}
      const result=planner()?.upsertDailyAvailabilityWindow?.({
        availability_id:query('#availabilityId').value||undefined,
        date,start,end,
        recurrence:weekly?'WEEKLY':null,
        weekday:weekly?Number(query('#availabilityWeekday').value):null,
        confirmed:true,parent_editable:true,source:'PARENT_ADMIN_UI'
      });
      toast('학습 가능 시간을 확인했어요. Planner가 배정 근거로 사용합니다.');
      refresh();
      return result;
    }

    function planWeeklyReflow(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=planner()?.planWeeklyReflow?.({start_date:localDateKey(),days:7});
      if(result?.ok){
        const count=result.run?.moves?.length||0;
        toast(count?`이번 주 ${count}개 탐험 재배치안을 만들었어요. 확인 후 적용해 주세요.`:'이번 주 배치는 그대로 유지해도 좋아요.');
      }else toast('이번 주 재배치안을 만들지 못했어요.');
      refresh();
      return result;
    }

    function decideWeeklyReflow(id,decision){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=planner()?.decideWeeklyReflow?.(id,{decision,actor:'PARENT'});
      if(result?.ok)toast(decision==='CONFIRM'?`주간 재배치 ${result.applied?.length||0}건을 반영했어요.`:'현재 주간 배치를 유지했어요.');
      else toast('주간 재배치 결정을 반영하지 못했어요.');
      refresh();
      return result;
    }

    function refreshAdaptiveSuggestions(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const snap=snapshot();
      let created=0,reused=0,insufficient=0,unchanged=0;
      for(const template of snap.homework_templates||[]){
        const result=planner()?.proposeEstimateAdjustment?.(template.template_id,{min_samples:3,min_delta_minutes:5,evidence_limit:5});
        if(result?.ok){
          if(result.reused)reused++; else created++;
        }else if(result?.reason==='INSUFFICIENT_EVIDENCE')insufficient++;
        else if(result?.reason==='DELTA_BELOW_THRESHOLD')unchanged++;
      }
      toast(created?(`실제 수행시간을 분석해 ${created}개의 조정안을 만들었어요.`):'새로 조정할 시간 제안이 없어요.');
      refresh();
      return {ok:true,created,reused,insufficient,unchanged};
    }

    function decideAdaptive(id,decision){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const result=planner()?.decideEstimateAdjustment?.(id,{decision,actor:'PARENT'});
      if(result?.ok){
        toast(decision==='CONFIRM'?'실제 수행시간 기준을 다음 배정에 반영했어요.':'현재 배정 기준을 유지했어요.');
      }else{
        toast('시간 조정 제안을 처리하지 못했어요.');
      }
      refresh();
      return result;
    }

    function onDocumentClick(event){
      const schedule=event.target.closest?.('[data-edit-schedule]');
      if(schedule){editSchedule(schedule.dataset.editSchedule);return;}
      const exceptionRemove=event.target.closest?.('[data-delete-schedule-exception]');
      if(exceptionRemove){removeScheduleException(exceptionRemove.dataset.deleteScheduleException);return;}
      const availability=event.target.closest?.('[data-edit-availability]');
      if(availability){editAvailability(availability.dataset.editAvailability);return;}
      const remove=event.target.closest?.('[data-delete-availability]');
      if(remove){removeAvailability(remove.dataset.deleteAvailability);return;}
      const review=event.target.closest?.('[data-carry-review]');
      if(review){reviewCarry(review.dataset.carryReview);return;}
      const ready=event.target.closest?.('[data-carry-ready]');
      if(ready){readyCarry(ready.dataset.carryReady);return;}
      const cancel=event.target.closest?.('[data-carry-cancel]');
      if(cancel){cancelCarry(cancel.dataset.carryCancel);return;}
      const reflowConfirm=event.target.closest?.('[data-reflow-confirm]');
      if(reflowConfirm){decideWeeklyReflow(reflowConfirm.dataset.reflowConfirm,'CONFIRM');return;}
      const reflowReject=event.target.closest?.('[data-reflow-reject]');
      if(reflowReject){decideWeeklyReflow(reflowReject.dataset.reflowReject,'REJECT');return;}
      const estimateConfirm=event.target.closest?.('[data-estimate-confirm]');
      if(estimateConfirm){decideAdaptive(estimateConfirm.dataset.estimateConfirm,'CONFIRM');return;}
      const estimateReject=event.target.closest?.('[data-estimate-reject]');
      if(estimateReject){decideAdaptive(estimateReject.dataset.estimateReject,'REJECT');}
    }

    function bind(){
      if(bound)return false;
      bound=true;
      query('#scheduleClearBtn')?.addEventListener('click',clearScheduleForm);
      query('#scheduleExceptionClearBtn')?.addEventListener('click',clearScheduleExceptionForm);
      query('#availabilityClearBtn')?.addEventListener('click',clearAvailabilityForm);
      query('#saveScheduleBtn')?.addEventListener('click',saveSchedule);
      query('#saveScheduleExceptionBtn')?.addEventListener('click',saveScheduleException);
      query('#saveAvailabilityBtn')?.addEventListener('click',saveAvailability);
      query('#weeklyReflowPlanBtn')?.addEventListener('click',planWeeklyReflow);
      query('#adaptiveEstimateRefreshBtn')?.addEventListener('click',refreshAdaptiveSuggestions);
      eventTarget.addEventListener?.('click',onDocumentClick);
      return true;
    }

    return Object.freeze({
      snapshot,render,clearScheduleForm,clearScheduleExceptionForm,clearAvailabilityForm,editSchedule,editAvailability,
      removeAvailability,removeScheduleException,reviewCarry,readyCarry,cancelCarry,saveSchedule,saveScheduleException,saveAvailability,
      planWeeklyReflow,decideWeeklyReflow,refreshAdaptiveSuggestions,decideAdaptive,bind
    });
  }

  root.ReadyRebuildPlannerAdminController=Object.freeze({
    version:'READY_REBUILD_PLANNER_ADMIN_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
