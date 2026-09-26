(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const escapeHtml=options.escapeHtml||((s)=>String(s??''));

    function renderSchedule(snapshot={}){
      const el=q('#scheduleAdminList'); if(!el)return;
      const rows=snapshot.schedule_commitments||[];
      el.innerHTML=rows.length
        ? [...rows].sort((a,b)=>String(a.start_at||'').localeCompare(String(b.start_at||''))).map(x=>`
          <button class="adminListItem" type="button" data-edit-schedule="${x.commitment_id}">
            <span><b>${escapeHtml(x.title)}</b><small>${x.recurrence==='WEEKLY'?'매주 '+['일','월','화','수','목','금','토'][Number(x.weekday)]+'요일 '+escapeHtml(x.start)+' → '+escapeHtml(x.end):String(x.start_at||'').slice(0,16).replace('T',' ')+' → '+String(x.end_at||'').slice(11,16)} · ${escapeHtml(x.category||'OTHER')}</small></span><strong>수정</strong>
          </button>`).join('')
        : '<div class="plannerEmpty"><b>등록된 고정 일정이 없어요.</b><small>학원·피아노·태권도처럼 움직이지 않는 일정을 먼저 넣어요.</small></div>';
    }

    function renderScheduleExceptions(snapshot={}){
      const select=q('#scheduleExceptionCommitment');
      const el=q('#scheduleExceptionList');
      const weekly=(snapshot.schedule_commitments||[]).filter(x=>x.recurrence==='WEEKLY');
      if(select){
        const current=select.value;
        select.innerHTML='<option value="">반복 일정 선택</option>'+weekly.map(x=>`<option value="${x.commitment_id}">${escapeHtml(x.title)}</option>`).join('');
        if(weekly.some(x=>x.commitment_id===current))select.value=current;
      }
      if(!el)return;
      const byId=new Map((snapshot.schedule_commitments||[]).map(x=>[x.commitment_id,x]));
      const rows=snapshot.schedule_exceptions||[];
      el.innerHTML=rows.length?rows.map(x=>{
        const schedule=byId.get(x.commitment_id);
        const desc=x.type==='SKIP'?'휴강':`시간 변경 ${escapeHtml(x.start)} → ${escapeHtml(x.end)}`;
        return `<div class="adminListItem"><span><b>${escapeHtml(schedule?.title||'반복 일정')} · ${escapeHtml(x.date)}</b><small>${desc}${x.note?' · '+escapeHtml(x.note):''}</small></span><button class="miniAction" data-delete-schedule-exception="${x.exception_id}">삭제</button></div>`;
      }).join(''):'<div class="plannerEmpty"><b>이번 주 예외 일정이 없어요.</b><small>휴강·보강·시간 변경이 있을 때만 추가하면 됩니다.</small></div>';
    }

    function renderAvailability(snapshot={}){
      const el=q('#availabilityAdminList'); if(!el)return;
      const rows=snapshot.daily_availability_windows||[];
      el.innerHTML=rows.length
        ? [...rows].sort((a,b)=>String((a.date||a.weekday)+a.start).localeCompare(String((b.date||b.weekday)+b.start))).map(x=>`
          <div class="adminListItem">
            <button type="button" data-edit-availability="${x.availability_id}"><span><b>${x.recurrence==='WEEKLY'?'매주 '+['일','월','화','수','목','금','토'][Number(x.weekday)]+'요일':escapeHtml(x.date)} 학습 가능</b><small>${escapeHtml(x.start)} → ${escapeHtml(x.end)} · Parent 확인</small></span><strong>수정</strong></button>
            <button class="miniAction" type="button" data-delete-availability="${x.availability_id}">삭제</button>
          </div>`).join('')
        : '<div class="plannerEmpty"><b>확인된 학습 가능 시간이 없어요.</b><small>Planner는 시간을 추정하지 않고, 확인된 범위가 있을 때만 가용시간 근거로 사용해요.</small></div>';
    }

    function renderAvailabilityExceptions(snapshot={}){
      const select=q('#availabilityExceptionAvailability'),el=q('#availabilityExceptionList');
      const weekly=(snapshot.daily_availability_windows||[]).filter(x=>x.recurrence==='WEEKLY');
      if(select){const current=select.value;select.innerHTML='<option value="">반복 가능시간 선택</option>'+weekly.map(x=>`<option value="${x.availability_id}">매주 ${['일','월','화','수','목','금','토'][Number(x.weekday)]} ${escapeHtml(x.start)}-${escapeHtml(x.end)}</option>`).join('');if(weekly.some(x=>x.availability_id===current))select.value=current;}
      if(!el)return;
      const byId=new Map((snapshot.daily_availability_windows||[]).map(x=>[x.availability_id,x]));
      const rows=snapshot.availability_exceptions||[];
      el.innerHTML=rows.length?rows.map(x=>{const base=byId.get(x.availability_id);const desc=x.type==='SKIP'?'학습 불가':`가능시간 변경 ${escapeHtml(x.start)} → ${escapeHtml(x.end)}`;return `<div class="adminListItem"><span><b>${escapeHtml(x.date)} · ${desc}</b><small>기본 ${escapeHtml(base?.start||'')} → ${escapeHtml(base?.end||'')}${x.note?' · '+escapeHtml(x.note):''}</small></span><button class="miniAction" data-delete-availability-exception="${x.exception_id}">삭제</button></div>`;}).join(''):'<div class="plannerEmpty"><b>가능시간 예외가 없어요.</b><small>가족 일정·외출 등으로 이번 날만 달라질 때 추가합니다.</small></div>';
    }

    function renderReflow(snapshot={}){
      const el=q('#weeklyReflowAdminList'); if(!el)return;
      const run=[...(snapshot.weekly_reflow_runs||[])].filter(x=>x.status==='PENDING').at(-1);
      if(!run){
        const review=snapshot.reflow_review||{};
        el.innerHTML=review.needed
          ? '<div class="plannerEmpty"><b>일정 변경을 감지했어요.</b><small>이번 주 배정을 다시 볼 필요가 있습니다. 재배치안 만들기를 눌러 확인한 뒤 적용하세요.</small></div>'
          : '<div class="plannerEmpty"><b>검토할 주간 재배치안이 없어요.</b><small>고정 일정이나 가능 시간이 바뀌면 Planner가 이번 주 안에서 다시 맞출 수 있어요.</small></div>';
        return;
      }
      const moves=run.moves||[];
      el.innerHTML=moves.length
        ? `<div class="adminListItem"><span><b>이번 주 ${moves.length}개 탐험 재배치 제안</b><small>진행 중·완료 항목은 잠금 · 시작 전 Planner TODO만 이동</small></span><div class="adminInlineActions"><button class="miniAction" data-reflow-confirm="${run.reflow_run_id}">적용</button><button class="miniAction" data-reflow-reject="${run.reflow_run_id}">유지</button></div></div>`+
          moves.map(x=>`<div class="adminListItem"><span><b>${escapeHtml(x.label)}</b><small>${escapeHtml(x.from_date)} → ${escapeHtml(x.to_date)} · ${x.reason==='FREE_WINDOW_AND_LOAD_BALANCE'?'가용시간·부하 균형':'학습 부하 균형'}</small></span></div>`).join('')
        : '<div class="plannerEmpty"><b>현재 배치를 유지해도 좋아요.</b><small>이번 주에는 옮길 필요가 있는 탐험이 없습니다.</small></div>';
    }

    function renderAdaptive(snapshot={}){
      const el=q('#adaptiveEstimateAdminList'); if(!el)return;
      const rows=(snapshot.adaptive_estimate_proposals||[]).filter(x=>x.status==='PENDING');
      el.innerHTML=rows.length?rows.map(x=>{
        const template=(snapshot.homework_templates||[]).find(t=>t.template_id===x.template_id);
        const current=Number.isFinite(x.current_planner_estimated_minutes)?x.current_planner_estimated_minutes:'미설정';
        const proposed=Number.isFinite(x.proposed_planner_estimated_minutes)?x.proposed_planner_estimated_minutes:'-';
        const samples=x.evidence?.sample_count||0;
        return `<div class="adminListItem"><span><b>${escapeHtml(template?.title||'학습 탐험 시간 조정')}</b><small>현재 ${escapeHtml(current)}분 → 제안 ${escapeHtml(proposed)}분 · 실제 수행 ${samples}회 근거</small></span><div class="adminInlineActions"><button class="miniAction" data-estimate-confirm="${x.proposal_id}">적용</button><button class="miniAction" data-estimate-reject="${x.proposal_id}">유지</button></div></div>`;
      }).join(''):'<div class="plannerEmpty"><b>검토할 시간 조정 제안이 없어요.</b><small>실제 수행시간이 충분히 쌓이면 Planner가 조정안을 제안합니다.</small></div>';
    }

    function renderCarry(snapshot={}){
      const el=q('#carryOverAdminList'); if(!el)return;
      const rows=(snapshot.carry_over_queue||[]).filter(x=>x.status==='OPEN');
      el.innerHTML=rows.length?rows.map(x=>{
        const needs=x.resolution_required===true;
        const escalated=x.escalation_level==='PARENT_LEARNING_MASTER_REVIEW';
        const status=escalated?'반복 검토 필요':needs?'확인 필요':'다음 일정 대기';
        const actions=escalated
          ? `<div class="adminInlineActions"><button class="miniAction" data-carry-review="${x.carry_over_id}">학습 재검토</button><button class="miniAction" data-carry-cancel="${x.carry_over_id}">종료</button></div>`
          : needs
            ? `<div class="adminInlineActions"><button class="miniAction" data-carry-ready="${x.carry_over_id}">다시 계획</button><button class="miniAction" data-carry-cancel="${x.carry_over_id}">종료</button></div>`
            : '<strong>자동 재진입</strong>';
        const note=escalated?` · ${escapeHtml(x.escalation_reason||'REVIEW_REQUIRED')}`:'';
        return `<div class="adminListItem"><span><b>${escapeHtml(x.label||'남은 탐험')}</b><small>${escapeHtml(x.state||'')} · ${escapeHtml(status)} · ${escapeHtml(x.from_date||'')}${note}</small></span>${actions}</div>`;
      }).join(''):'<div class="plannerEmpty"><b>확인할 남은 탐험이 없어요.</b><small>새 carry-over가 생기면 여기에 표시됩니다.</small></div>';
    }

    function render(snapshot={}){
      renderSchedule(snapshot);
      renderScheduleExceptions(snapshot);
      renderAvailability(snapshot);
      renderAvailabilityExceptions(snapshot);
      renderReflow(snapshot);
      renderAdaptive(snapshot);
      renderCarry(snapshot);
      return {ok:true};
    }

    return Object.freeze({render,renderSchedule,renderScheduleExceptions,renderAvailability,renderAvailabilityExceptions,renderReflow,renderAdaptive,renderCarry});
  }

  root.ReadyRebuildPlannerAdminView=Object.freeze({
    version:'READY_REBUILD_PLANNER_ADMIN_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
