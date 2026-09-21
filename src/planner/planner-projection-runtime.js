(function(root){
  'use strict';
  const clean=v=>String(v??'').trim();

  function scheduleCommitment(input={},ctx={}){
    const title=clean(input.title);
    if(!title)throw new Error('title required');
    const recurrence=clean(input.recurrence)||null;
    const weekday=Number.isInteger(input.weekday)?input.weekday:null;
    const start=clean(input.start)||null;
    const end=clean(input.end)||null;
    if(recurrence==='WEEKLY'){
      if(!(weekday>=0&&weekday<=6))throw new Error('weekday required');
      if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start)throw new Error('valid start/end required');
    }
    return {
      commitment_id:clean(input.commitment_id)||ctx.id,
      title,
      category:clean(input.category)||'OTHER',
      start_at:recurrence==='WEEKLY'?null:(input.start_at||null),
      end_at:recurrence==='WEEKLY'?null:(input.end_at||null),
      recurrence:recurrence==='WEEKLY'?'WEEKLY':null,
      weekday:recurrence==='WEEKLY'?weekday:null,
      start:recurrence==='WEEKLY'?start:null,
      end:recurrence==='WEEKLY'?end:null,
      valid_from:clean(input.valid_from)||null,
      valid_until:clean(input.valid_until)||null,
      confirmed:input.confirmed!==false,
      planner_movable:!!input.planner_movable,
      parent_editable:input.parent_editable!==false,
      source:clean(input.source)||'READY_LOCAL',
      updated_at:ctx.now
    };
  }

  function availabilityWindow(input={},ctx={}){
    const date=clean(input.date),start=clean(input.start),end=clean(input.end);
    const recurrence=clean(input.recurrence)||null;
    const weekday=Number.isInteger(input.weekday)?input.weekday:null;
    if(recurrence!=='WEEKLY'&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('date required');
    if(recurrence==='WEEKLY'&&!(weekday>=0&&weekday<=6))throw new Error('weekday required');
    if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start)throw new Error('valid start/end required');
    return {
      availability_id:clean(input.availability_id)||ctx.id,
      date:recurrence==='WEEKLY'?null:date,
      start,end,
      recurrence:recurrence==='WEEKLY'?'WEEKLY':null,
      weekday:recurrence==='WEEKLY'?weekday:null,
      valid_from:clean(input.valid_from)||null,
      valid_until:clean(input.valid_until)||null,
      confirmed:input.confirmed!==false,
      source:clean(input.source)||'READY_LOCAL',
      parent_editable:input.parent_editable!==false,
      updated_at:ctx.now
    };
  }

  function todayItem(todo={}){
    return {
      todo_id:todo.todo_id,
      assignment_id:todo.assignment_id||null,
      analysis_id:todo.analysis_id||null,
      learning_unit_id:todo.learning_unit_id||null,
      template_id:todo.template_id||null,
      allocation_run_id:todo.allocation_run_id||null,
      label:todo.label,
      subject:todo.subject||null,
      matched_domain:todo.matched_domain||null,
      method_variant:todo.method_variant||null,
      state:todo.state,
      source:todo.source,
      estimated_minutes:Number.isFinite(todo.estimated_minutes)?todo.estimated_minutes:null,
      activity_types:Array.isArray(todo.activity_types)?todo.activity_types:[],
      activity_sequence:Array.isArray(todo.activity_sequence)?todo.activity_sequence:[],
      cognitive_load_profile:Array.isArray(todo.cognitive_load_profile)?todo.cognitive_load_profile:[],
      activity_load_score:Number.isFinite(todo.activity_load_score)?todo.activity_load_score:null,
      difficulty:Number.isFinite(todo.difficulty)?todo.difficulty:null,
      recovery_need:todo.recovery_need||null,
      review_policy:todo.review_policy||null,
      parent_help_dependency:todo.parent_help_dependency||null,
      planner_owned:/^PLANNER/.test(todo.source||'')
    };
  }

  root.ReadyRebuildPlannerProjection=Object.freeze({
    version:'READY_REBUILD_PLANNER_PROJECTION_V01',
    scheduleCommitment,
    availabilityWindow,
    todayItem
  });
})(typeof globalThis!=='undefined'?globalThis:this);
