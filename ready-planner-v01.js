(function(root,factory){
  const core=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=core;
  if(root&&root.localStorage){
    root.ReadySetPlanner=core.createPlanner(root.localStorage);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='readyset_planner_v1';
  const FAMILY_STORAGE_KEY='readyset_planner_family_v1';
  const SCHEMA_VERSION=1;
  const TODO_STATES=new Set(['PLANNED','IN_PROGRESS','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED','SUPERSEDED']);
  const READY_TO_TODO={
    PENDING:'PLANNED',
    COMPLETED:'COMPLETED',
    PARTIAL:'PARTIAL',
    DEFERRED:'DEFERRED',
    WAITING_FOR_PARENT:'WAITING_FOR_PARENT',
    BLOCKED:'BLOCKED'
  };
  const rebuildPolicy=globalThis.ReadyRebuildPlannerPolicy||null;
  const rebuildProjection=globalThis.ReadyRebuildPlannerProjection||null;

  const blank=()=>({
    schema_version:SCHEMA_VERSION,
    storage_backend:'LOCALSTORAGE_COMPATIBILITY_SCAFFOLD',
    schedule_commitments:[],
    schedule_exceptions:[],
    daily_availability_windows:[],
    availability_exceptions:[],
    homework_templates:[],
    dated_todos:[],
    progress_events:[],
    allocation_runs:[],
    execution_observations:[],
    carry_over_queue:[],
    adaptive_estimate_proposals:[],
    weekly_reflow_runs:[],
    reflow_review:{needed:false,reasons:[],updated_at:null}
  });

  const cleanText=x=>String(x??'').trim();
  const dateKey=(d=new Date())=>{
    const x=d instanceof Date?d:new Date(d);
    const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),day=String(x.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const makeId=(prefix)=>`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const addDays=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d)};

  function normalize(raw){
    const x=raw&&typeof raw==='object'?raw:{};
    return {
      ...blank(),
      ...x,
      schema_version:SCHEMA_VERSION,
      schedule_commitments:Array.isArray(x.schedule_commitments)?x.schedule_commitments:[],
      schedule_exceptions:Array.isArray(x.schedule_exceptions)?x.schedule_exceptions:[],
      daily_availability_windows:Array.isArray(x.daily_availability_windows)?x.daily_availability_windows:[],
      availability_exceptions:Array.isArray(x.availability_exceptions)?x.availability_exceptions:[],
      homework_templates:Array.isArray(x.homework_templates)?x.homework_templates:[],
      dated_todos:Array.isArray(x.dated_todos)?x.dated_todos:[],
      progress_events:Array.isArray(x.progress_events)?x.progress_events:[],
      allocation_runs:Array.isArray(x.allocation_runs)?x.allocation_runs:[],
      execution_observations:Array.isArray(x.execution_observations)?x.execution_observations:[],
      carry_over_queue:Array.isArray(x.carry_over_queue)?x.carry_over_queue:[],
      adaptive_estimate_proposals:Array.isArray(x.adaptive_estimate_proposals)?x.adaptive_estimate_proposals:[],
      weekly_reflow_runs:Array.isArray(x.weekly_reflow_runs)?x.weekly_reflow_runs:[],
      reflow_review:(x.reflow_review&&typeof x.reflow_review==='object')?x.reflow_review:{needed:false,reasons:[],updated_at:null}
    };
  }

  function createPlanner(storage){
    const isOpenTodo=t=>t&&t.state!=='COMPLETED'&&t.state!=='SUPERSEDED';
    function storageKey(){return globalThis.ReadyMemberScope?.storageKey?.(STORAGE_KEY)||STORAGE_KEY}
    function familyStorageKey(){return globalThis.ReadyMemberScope?.familyStorageKey?.(FAMILY_STORAGE_KEY)||FAMILY_STORAGE_KEY}
    function activeSession(){return globalThis.ReadyFamilySession?.current?.()||{authenticated:false,member_id:null,family_id:null,role:'CHILD'}}

    function sharedBlank(){
      return {schedule_commitments:[],schedule_exceptions:[],daily_availability_windows:[],availability_exceptions:[]};
    }
    function audienceVisible(row={}){
      const s=activeSession();
      if(s.role==='PARENT')return true;
      const scope=cleanText(row.audience_scope)||'FAMILY_ALL';
      if(scope==='FAMILY_ALL')return true;
      return scope==='MEMBER'&&cleanText(row.target_member_id)===cleanText(s.member_id);
    }
    function normalizeFamily(raw){
      const x=raw&&typeof raw==='object'?raw:{};
      return {
        ...sharedBlank(),
        ...x,
        schedule_commitments:Array.isArray(x.schedule_commitments)?x.schedule_commitments:[],
        schedule_exceptions:Array.isArray(x.schedule_exceptions)?x.schedule_exceptions:[],
        daily_availability_windows:Array.isArray(x.daily_availability_windows)?x.daily_availability_windows:[],
        availability_exceptions:Array.isArray(x.availability_exceptions)?x.availability_exceptions:[]
      };
    }
    function loadMember(){
      try{
        const state=normalize(JSON.parse(storage.getItem(storageKey())||'null'));
        state.schedule_commitments=[];
        state.schedule_exceptions=[];
        state.daily_availability_windows=[];
        state.availability_exceptions=[];
        return state;
      }catch{return blank()}
    }
    function loadFamily(){
      try{
        const direct=storage.getItem(familyStorageKey());
        if(direct)return normalizeFamily(JSON.parse(direct));
        // One-time compatibility lift: existing schedule data is promoted into family scope.
        const legacy=normalize(JSON.parse(storage.getItem(storageKey())||'null'));
        const lifted=normalizeFamily({
          schedule_commitments:legacy.schedule_commitments,
          schedule_exceptions:legacy.schedule_exceptions,
          daily_availability_windows:legacy.daily_availability_windows,
          availability_exceptions:legacy.availability_exceptions
        });
        if(lifted.schedule_commitments.length||lifted.schedule_exceptions.length||lifted.daily_availability_windows.length||lifted.availability_exceptions.length){
          storage.setItem(familyStorageKey(),JSON.stringify(lifted));
        }
        return lifted;
      }catch{return sharedBlank()}
    }
    function load(){
      const member=loadMember(),family=loadFamily();
      return normalize({
        ...member,
        schedule_commitments:family.schedule_commitments.filter(audienceVisible),
        schedule_exceptions:family.schedule_exceptions,
        daily_availability_windows:family.daily_availability_windows.filter(audienceVisible),
        availability_exceptions:family.availability_exceptions
      });
    }
    function save(s){
      const member=normalize(s);
      member.schedule_commitments=[];
      member.schedule_exceptions=[];
      member.daily_availability_windows=[];
      member.availability_exceptions=[];
      const payload=JSON.stringify(member);
      storage.setItem(storageKey(),payload);
      globalThis.ReadySetLocalFirst?.capture?.('planner',payload).catch?.(()=>{});
    }
    function saveFamily(s){
      const payload=JSON.stringify(normalizeFamily(s));
      storage.setItem(familyStorageKey(),payload);
      globalThis.ReadySetLocalFirst?.capture?.('planner_family',payload).catch?.(()=>{});
    }
    function mutate(fn){const s=load();const out=fn(s);save(s);return out}
    function mutateFamily(fn){
      const s=loadFamily();
      const out=fn(s);
      saveFamily(s);
      return out;
    }

    function markReflowReview(state,reason){
      const reasons=new Set(Array.isArray(state.reflow_review?.reasons)?state.reflow_review.reasons:[]);
      if(reason)reasons.add(reason);
      state.reflow_review={needed:true,reasons:[...reasons],updated_at:new Date().toISOString()};
    }

    function clearReflowReview(state){
      state.reflow_review={needed:false,reasons:[],updated_at:new Date().toISOString()};
    }

    function scheduleCommitmentsForDate(date,state=load()){
      const dow=parseLocal(date,'12:00').getDay();
      const exceptionByCommitment=new Map((state.schedule_exceptions||[])
        .filter(x=>x.date===date)
        .map(x=>[x.commitment_id,x]));
      return (state.schedule_commitments||[])
        .filter(x=>x.confirmed!==false)
        .filter(x=>{
          if(x.recurrence==='WEEKLY'){
            if(Number(x.weekday)!==dow)return false;
            if(x.valid_from&&date<x.valid_from)return false;
            if(x.valid_until&&date>x.valid_until)return false;
            return /^\d{2}:\d{2}$/.test(String(x.start||''))&&/^\d{2}:\d{2}$/.test(String(x.end||''));
          }
          return x.start_at&&x.end_at&&String(x.start_at).slice(0,10)===date&&String(x.end_at).slice(0,10)===date;
        })
        .flatMap(x=>{
          const exception=exceptionByCommitment.get(x.commitment_id)||null;
          if(exception?.type==='SKIP')return [];
          if(x.recurrence==='WEEKLY'){
            const start=exception?.type==='REPLACE'?(exception.start||x.start):x.start;
            const end=exception?.type==='REPLACE'?(exception.end||x.end):x.end;
            return [{...x,start_at:date+'T'+start+':00',end_at:date+'T'+end+':00',occurrence_date:date,schedule_exception:exception}];
          }
          return [{...x,occurrence_date:date,schedule_exception:exception}];
        });
    }

    function upsertScheduleCommitment(input={}){
      if(globalThis.ReadyFamilySession && cleanText(input.source)==='PARENT_ADMIN_UI'){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok) throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      const title=cleanText(input.title); if(!title) throw new Error('title required');
      return mutateFamily(s=>{
        const id=cleanText(input.commitment_id)||makeId('commitment');
        const recurrence=cleanText(input.recurrence)||null;
        const weekday=Number.isInteger(input.weekday)?input.weekday:null;
        const start=cleanText(input.start)||null;
        const end=cleanText(input.end)||null;
        if(recurrence==='WEEKLY'){
          if(!(weekday>=0&&weekday<=6))throw new Error('weekday required');
          if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start)throw new Error('valid start/end required');
        }
        const item={...(rebuildProjection?.scheduleCommitment?.(input,{id,now:new Date().toISOString()})||{
          commitment_id:id,
          title,
          category:cleanText(input.category)||'OTHER',
          start_at:recurrence==='WEEKLY'?null:(input.start_at||null),
          end_at:recurrence==='WEEKLY'?null:(input.end_at||null),
          recurrence:recurrence==='WEEKLY'?'WEEKLY':null,
          weekday:recurrence==='WEEKLY'?weekday:null,
          start:recurrence==='WEEKLY'?start:null,
          end:recurrence==='WEEKLY'?end:null,
          valid_from:cleanText(input.valid_from)||null,
          valid_until:cleanText(input.valid_until)||null,
          confirmed:input.confirmed!==false,
          planner_movable:!!input.planner_movable,
          parent_editable:input.parent_editable!==false,
          source:cleanText(input.source)||'READY_LOCAL',
          updated_at:new Date().toISOString()
        }),
          audience_scope:cleanText(input.audience_scope)==='MEMBER'?'MEMBER':'FAMILY_ALL',
          target_member_id:cleanText(input.audience_scope)==='MEMBER'?(cleanText(input.target_member_id)||null):null
        };
        const i=s.schedule_commitments.findIndex(x=>x.commitment_id===id);
        if(i>=0)s.schedule_commitments[i]=item;else s.schedule_commitments.push(item);
        markReflowReview(s,'SCHEDULE_CHANGED');
        return item;
      });
    }

    function upsertScheduleException(input={}){
      if(globalThis.ReadyFamilySession){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok)throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      const commitmentId=cleanText(input.commitment_id);
      const date=cleanText(input.date);
      const type=cleanText(input.type).toUpperCase();
      if(!commitmentId||!/^\d{4}-\d{2}-\d{2}$/.test(date))return {ok:false,reason:'COMMITMENT_AND_DATE_REQUIRED'};
      if(!['SKIP','REPLACE'].includes(type))return {ok:false,reason:'INVALID_EXCEPTION_TYPE'};
      const start=cleanText(input.start)||null,end=cleanText(input.end)||null;
      if(type==='REPLACE'&&(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start))return {ok:false,reason:'VALID_REPLACEMENT_TIME_REQUIRED'};
      return mutateFamily(s=>{
        const commitment=s.schedule_commitments.find(x=>x.commitment_id===commitmentId&&x.recurrence==='WEEKLY');
        if(!commitment)return {ok:false,reason:'WEEKLY_COMMITMENT_NOT_FOUND'};
        const key=commitmentId+'@'+date;
        const item={
          exception_id:cleanText(input.exception_id)||key,
          commitment_id:commitmentId,
          date,
          type,
          start:type==='REPLACE'?start:null,
          end:type==='REPLACE'?end:null,
          note:cleanText(input.note)||null,
          source:cleanText(input.source)||'PARENT_ADMIN_UI',
          updated_at:new Date().toISOString()
        };
        const i=s.schedule_exceptions.findIndex(x=>x.commitment_id===commitmentId&&x.date===date);
        if(i>=0)s.schedule_exceptions[i]=item;else s.schedule_exceptions.push(item);
        markReflowReview(s,'SCHEDULE_EXCEPTION_CHANGED');
        return {ok:true,item:{...item}};
      });
    }

    function removeScheduleException(input={}){
      if(globalThis.ReadyFamilySession){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok)throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      const id=cleanText(input.exception_id);
      const commitmentId=cleanText(input.commitment_id);
      const date=cleanText(input.date);
      return mutateFamily(s=>{
        const before=s.schedule_exceptions.length;
        s.schedule_exceptions=s.schedule_exceptions.filter(x=>id?x.exception_id!==id:!(x.commitment_id===commitmentId&&x.date===date));
        if(before===s.schedule_exceptions.length)return {ok:false,reason:'SCHEDULE_EXCEPTION_NOT_FOUND'};
        markReflowReview(s,'SCHEDULE_EXCEPTION_REMOVED');
        return {ok:true};
      });
    }

    function upsertDailyAvailabilityWindow(input={}){
      if(globalThis.ReadyFamilySession && cleanText(input.source)==='PARENT_ADMIN_UI'){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok) throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      const date=cleanText(input.date),start=cleanText(input.start),end=cleanText(input.end);
      const recurrence=cleanText(input.recurrence)||null;
      const weekday=Number.isInteger(input.weekday)?input.weekday:null;
      if(recurrence!=='WEEKLY'&&!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date required');
      if(recurrence==='WEEKLY'&&!(weekday>=0&&weekday<=6)) throw new Error('weekday required');
      if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start) throw new Error('valid start/end required');
      return mutateFamily(s=>{
        const id=cleanText(input.availability_id)||makeId('availability');
        const item={...(rebuildProjection?.availabilityWindow?.(input,{id,now:new Date().toISOString()})||{
          availability_id:id,date:recurrence==='WEEKLY'?null:date,start,end,
          recurrence:recurrence==='WEEKLY'?'WEEKLY':null,
          weekday:recurrence==='WEEKLY'?weekday:null,
          valid_from:cleanText(input.valid_from)||null,
          valid_until:cleanText(input.valid_until)||null,
          confirmed:input.confirmed!==false,
          source:cleanText(input.source)||'READY_LOCAL',
          parent_editable:input.parent_editable!==false,
          updated_at:new Date().toISOString()
        }),
          audience_scope:cleanText(input.audience_scope)==='MEMBER'?'MEMBER':'FAMILY_ALL',
          target_member_id:cleanText(input.audience_scope)==='MEMBER'?(cleanText(input.target_member_id)||null):null
        };
        const i=s.daily_availability_windows.findIndex(x=>x.availability_id===id);
        if(i>=0)s.daily_availability_windows[i]=item;else s.daily_availability_windows.push(item);
        markReflowReview(s,'AVAILABILITY_CHANGED');
        return item;
      });
    }

    function upsertAvailabilityException(input={}){
      if(globalThis.ReadyFamilySession){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok)throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      const availabilityId=cleanText(input.availability_id);
      const date=cleanText(input.date);
      const type=cleanText(input.type).toUpperCase();
      if(!availabilityId||!/^\d{4}-\d{2}-\d{2}$/.test(date))return {ok:false,reason:'AVAILABILITY_AND_DATE_REQUIRED'};
      if(!['SKIP','REPLACE'].includes(type))return {ok:false,reason:'INVALID_EXCEPTION_TYPE'};
      const start=cleanText(input.start)||null,end=cleanText(input.end)||null;
      if(type==='REPLACE'&&(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start))return {ok:false,reason:'VALID_REPLACEMENT_TIME_REQUIRED'};
      return mutateFamily(s=>{
        const source=s.daily_availability_windows.find(x=>x.availability_id===availabilityId&&x.recurrence==='WEEKLY');
        if(!source)return {ok:false,reason:'WEEKLY_AVAILABILITY_NOT_FOUND'};
        const item={exception_id:cleanText(input.exception_id)||(availabilityId+'@'+date),availability_id:availabilityId,date,type,start:type==='REPLACE'?start:null,end:type==='REPLACE'?end:null,note:cleanText(input.note)||null,source:cleanText(input.source)||'PARENT_ADMIN_UI',updated_at:new Date().toISOString()};
        const i=s.availability_exceptions.findIndex(x=>x.availability_id===availabilityId&&x.date===date);
        if(i>=0)s.availability_exceptions[i]=item;else s.availability_exceptions.push(item);
        markReflowReview(s,'AVAILABILITY_EXCEPTION_CHANGED');
        return {ok:true,item:{...item}};
      });
    }

    function removeAvailabilityException(input={}){
      if(globalThis.ReadyFamilySession){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok)throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      const id=cleanText(input.exception_id),availabilityId=cleanText(input.availability_id),date=cleanText(input.date);
      return mutateFamily(s=>{
        const before=s.availability_exceptions.length;
        s.availability_exceptions=s.availability_exceptions.filter(x=>id?x.exception_id!==id:!(x.availability_id===availabilityId&&x.date===date));
        if(before===s.availability_exceptions.length)return {ok:false,reason:'AVAILABILITY_EXCEPTION_NOT_FOUND'};
        markReflowReview(s,'AVAILABILITY_EXCEPTION_REMOVED');
        return {ok:true};
      });
    }

    function removeDailyAvailabilityWindow(id){
      const target=cleanText(id); if(!target)return {ok:false,reason:'AVAILABILITY_ID_REQUIRED'};
      if(globalThis.ReadyFamilySession){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok) throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      return mutateFamily(s=>{
        const before=s.daily_availability_windows.length;
        s.daily_availability_windows=s.daily_availability_windows.filter(x=>x.availability_id!==target);
        if(before===s.daily_availability_windows.length)return {ok:false,reason:'AVAILABILITY_NOT_FOUND'};
        markReflowReview(s,'AVAILABILITY_REMOVED');
        return {ok:true,availability_id:target};
      });
    }

    function candidateWindowsByDate(dates=[]){
      const s=load(),out={};
      for(const date of dates||[]){
        const dow=parseLocal(date,'12:00').getDay();
        const exceptionByAvailability=new Map((s.availability_exceptions||[]).filter(x=>x.date===date).map(x=>[x.availability_id,x]));
        out[date]=(s.daily_availability_windows||[])
          .filter(x=>x.confirmed!==false)
          .filter(x=>{
            if(x.recurrence==='WEEKLY'){
              if(Number(x.weekday)!==dow)return false;
              if(x.valid_from&&date<x.valid_from)return false;
              if(x.valid_until&&date>x.valid_until)return false;
              if(exceptionByAvailability.get(x.availability_id)?.type==='SKIP')return false;
              return true;
            }
            return x.date===date;
          })
          .sort((a,b)=>String(a.start).localeCompare(String(b.start)))
          .map(x=>{
            const exception=exceptionByAvailability.get(x.availability_id)||null;
            if(x.recurrence==='WEEKLY')return {start:exception?.type==='REPLACE'?(exception.start||x.start):x.start,end:exception?.type==='REPLACE'?(exception.end||x.end):x.end,availability_id:x.availability_id,source:x.source,recurrence:'WEEKLY',weekday:Number(x.weekday),availability_exception:exception};
            return {start:x.start,end:x.end,availability_id:x.availability_id,source:x.source};
          });
      }
      return out;
    }

    function upsertHomeworkTemplate(input={}){
      const title=cleanText(input.title); if(!title) throw new Error('title required');
      return mutate(s=>{
        const id=cleanText(input.template_id)||makeId('template');
        const item={
          template_id:id,
          title,
          subject:cleanText(input.subject)||null,
          assignment_cycle:input.assignment_cycle||null,
          learning_units:Array.isArray(input.learning_units)?input.learning_units:[],
          provenance:input.provenance||null,
          confirmation_state:cleanText(input.confirmation_state)||'CONFIRMED',
          deadline_date:cleanText(input.deadline_date)||null,
          estimated_minutes:Number.isFinite(input.estimated_minutes)?Math.max(0,input.estimated_minutes):null,
          planner_estimated_minutes:Number.isFinite(input.planner_estimated_minutes)?Math.max(0,input.planner_estimated_minutes):null,
          allocation_priority:Number.isFinite(input.allocation_priority)?input.allocation_priority:100,
          required_today:input.required_today===true,
          preferred_days:Array.isArray(input.preferred_days)?input.preferred_days.map(Number).filter(x=>x>=0&&x<=6):[],
          updated_at:new Date().toISOString()
        };
        const i=s.homework_templates.findIndex(x=>x.template_id===id);
        if(i>=0)s.homework_templates[i]=item;else s.homework_templates.push(item);
        return item;
      });
    }

    function upsertDatedTodo(input={}){
      const label=cleanText(input.label); if(!label) throw new Error('label required');
      const requestedSource=cleanText(input.source)||'PLANNER';
      if(/^READY|^PARENT/.test(requestedSource))throw new Error('DATED TODO authority belongs to Planner');
      return mutate(s=>{
        const id=cleanText(input.todo_id)||makeId('todo');
        const state=TODO_STATES.has(input.state)?input.state:'PLANNED';
        const item={
          todo_id:id,
          date:cleanText(input.date)||dateKey(),
          label,
          template_id:cleanText(input.template_id)||null,
          assignment_id:cleanText(input.assignment_id)||null,
          analysis_id:cleanText(input.analysis_id)||null,
          learning_unit_id:cleanText(input.learning_unit_id)||null,
          allocation_run_id:cleanText(input.allocation_run_id)||null,
          source:requestedSource,
          source_actor:cleanText(input.source_actor)||null,
          provenance:input.provenance||null,
          order:Number.isFinite(input.order)?input.order:999,
          state,
          created_at:input.created_at||new Date().toISOString(),
          updated_at:new Date().toISOString()
        };
        const i=s.dated_todos.findIndex(x=>x.todo_id===id);
        if(i>=0)s.dated_todos[i]={...s.dated_todos[i],...item};else s.dated_todos.push(item);
        return item;
      });
    }

    function linkTodayItems(todoIds=[],options={}){
      const date=cleanText(options.date)||dateKey();
      const ids=new Set((todoIds||[]).map(cleanText).filter(Boolean));
      const allowedStates=new Set(Array.isArray(options.allowed_states)&&options.allowed_states.length?options.allowed_states:['PLANNED']);
      return load().dated_todos.filter(x=>ids.has(x.todo_id)&&x.date===date&&allowedStates.has(x.state)).map(x=>({
        todo_id:x.todo_id,label:x.label,date:x.date,source:x.source,subject:x.subject||null,
        matched_domain:x.matched_domain||null,method_variant:x.method_variant||null,
        concept_skill_target:x.concept_skill_target||null,
        divisible_boundary:x.divisible_boundary||null,
        confidence:Number.isFinite(x.confidence)?x.confidence:null,
        unresolved_flags:Array.isArray(x.unresolved_flags)?[...x.unresolved_flags]:[],
        assignment_id:x.assignment_id,analysis_id:x.analysis_id,learning_unit_id:x.learning_unit_id,
        template_id:x.template_id,allocation_run_id:x.allocation_run_id,
        activity_types:Array.isArray(x.activity_types)?x.activity_types:[],
        activity_sequence:Array.isArray(x.activity_sequence)?x.activity_sequence:[],
        cognitive_load_profile:Array.isArray(x.cognitive_load_profile)?x.cognitive_load_profile:[],
        activity_load_score:Number.isFinite(x.activity_load_score)?x.activity_load_score:null,
        difficulty:Number.isFinite(x.difficulty)?x.difficulty:null,
        recovery_need:x.recovery_need||null,
        review_policy:x.review_policy||null,
        parent_help_dependency:x.parent_help_dependency||null
      }));
    }
    function linkOrCreateTodayItems(values=[],options={}){
      const s=load(),date=cleanText(options.date)||dateKey();
      const ids=(values||[]).map(v=>typeof v==='object'?v.todo_id:v).filter(v=>s.dated_todos.some(x=>x.todo_id===v));
      return linkTodayItems(ids,{date});
    }

    function allocationDates(fact,input={}){
      if(Array.isArray(input.candidate_dates)&&input.candidate_dates.length)return [...new Set(input.candidate_dates.map(cleanText).filter(Boolean))].filter(d=>!fact.deadline_boundary||d<fact.deadline_boundary);
      const start=cleanText(input.start_date)||dateKey(),end=cleanText(fact.deadline_boundary);
      if(!end)return [];
      const out=[];for(let d=start;d<end;d=addDays(d,1))out.push(d);return out;
    }
    function invalidateAssignmentOutputs(assignmentId,input={}){
      const id=cleanText(assignmentId);if(!id)return {ok:false,reason:'ASSIGNMENT_ID_REQUIRED'};
      const reason=cleanText(input.reason)||'FACT_REVISION';
      const revision=Number(input.fact_revision)||null;
      return mutate(s=>{
        const nowIso=new Date().toISOString();
        let superseded_todos=0,in_progress_count=0,superseded_templates=0,superseded_runs=0,superseded_carry=0,rejected_estimates=0;
        for(const todo of s.dated_todos){
          if(todo.assignment_id!==id)continue;
          if(todo.state==='COMPLETED')continue;
          if(todo.state==='IN_PROGRESS'){
            todo.revision_conflict=true;
            todo.revision_conflict_reason=reason;
            todo.revision_conflict_with_fact_revision=revision;
            todo.updated_at=nowIso;
            in_progress_count++;
            continue;
          }
          if(todo.state!=='SUPERSEDED'){
            todo.state='SUPERSEDED';
            todo.superseded_at=nowIso;
            todo.supersede_reason=reason;
            todo.superseded_by_fact_revision=revision;
            superseded_todos++;
          }
        }
        for(const template of s.homework_templates){
          if(template.provenance?.assignment_id!==id)continue;
          if(template.confirmation_state!=='SUPERSEDED'){
            template.confirmation_state='SUPERSEDED';
            template.superseded_at=nowIso;
            template.supersede_reason=reason;
            superseded_templates++;
          }
        }
        for(const run of s.allocation_runs){
          if(run.assignment_id!==id)continue;
          if(run.state!=='SUPERSEDED'){
            run.state='SUPERSEDED';
            run.superseded_at=nowIso;
            run.supersede_reason=reason;
            superseded_runs++;
          }
        }
        for(const carry of s.carry_over_queue){
          if(carry.assignment_id!==id||carry.status!=='OPEN')continue;
          carry.status='SUPERSEDED';
          carry.superseded_at=nowIso;
          carry.supersede_reason=reason;
          superseded_carry++;
        }
        const affectedTemplates=new Set(
          s.homework_templates.filter(x=>x.provenance?.assignment_id===id).map(x=>x.template_id)
        );
        for(const proposal of s.adaptive_estimate_proposals){
          if(proposal.status!=='PENDING'||!affectedTemplates.has(proposal.template_id))continue;
          proposal.status='REJECTED';
          proposal.decision_actor='SYSTEM_FACT_REVISION';
          proposal.decision_role='SYSTEM';
          proposal.decision_note='Superseded by FACT revision';
          proposal.decided_at=nowIso;
          rejected_estimates++;
        }
        return {ok:true,assignment_id:id,superseded_todos,in_progress_count,superseded_templates,superseded_runs,superseded_carry,rejected_estimates};
      });
    }

    function isEnglishAcademyCommitment(item={}){
      const text=(cleanText(item.title)+' '+cleanText(item.category)).toUpperCase();
      const hasEnglish=/영어|ENGLISH/.test(text);
      const hasAcademy=/학원|ACADEMY/.test(text);
      return hasEnglish&&hasAcademy;
    }

    function operatingRuleForUnit(unit={},date,scheduleByDate={}){
      const target=cleanText(unit.concept_skill_target).toUpperCase();
      const isVocabulary=target==='VOCABULARY';
      if(!isVocabulary)return null;
      const academy=(scheduleByDate[date]||[]).find(isEnglishAcademyCommitment);
      if(!academy)return null;
      return {
        rule_id:'ENGLISH_ACADEMY_MORNING_VOCAB_REVIEW',
        preferred_daypart:'MORNING',
        evidence:{
          commitment_id:academy.commitment_id||null,
          commitment_title:academy.title||null,
          commitment_category:academy.category||null,
          academy_date:date,
          learning_unit_id:unit.learning_unit_id||null,
          concept_skill_target:unit.concept_skill_target||null
        }
      };
    }

    function allocateLearningUnits(input={}){
      const assignmentId=cleanText(input.assignment_id);if(!assignmentId)return {ok:false,reason:'ASSIGNMENT_ID_REQUIRED'};
      const domain=input.domain_state||globalThis.ReadyAssignments?.load?.();
      const fact=domain?.assignmentFacts?.[assignmentId];
      if(!fact)return {ok:false,reason:'ASSIGNMENT_FACT_NOT_FOUND'};
      if(fact.confirmation_state!=='FACT_CONFIRMED')return {ok:false,reason:'FACT_NOT_CONFIRMED'};
      if(fact.deadline_state==='NEXT_ACADEMY_UNVERIFIED')return {ok:false,reason:'NEXT_ACADEMY_UNVERIFIED'};
      if(fact.analysis_state!=='INTERPRETED'||!fact.current_analysis_id)return {ok:false,reason:'LEARNING_MASTER_REQUIRED'};
      const analysis=domain.analyses?.[fact.current_analysis_id];
      const units=(analysis?.learning_unit_ids||[]).map(id=>domain.learningUnits?.[id]).filter(x=>x?.state==='INTERPRETED');
      if(!units.length)return {ok:false,reason:'NO_INTERPRETED_LEARNING_UNITS'};
      const dates=allocationDates(fact,input);if(!dates.length)return {ok:false,reason:'NO_ALLOCATION_WINDOW'};
      return mutate(s=>{
        const runId=makeId('allocation_v2');
        const storedWindowsByDate=candidateWindowsByDate(dates);
        const explicitWindowsByDate=(input.candidate_windows_by_date&&typeof input.candidate_windows_by_date==='object')?input.candidate_windows_by_date:{};
        const windowsByDate={...storedWindowsByDate,...explicitWindowsByDate};
        const freeWindowByDate=Object.fromEntries(dates.map(d=>[d,freeWindowEvidence(s,d,windowsByDate[d]||[])]));
        const freeWindowCoverage=dates.filter(d=>freeWindowByDate[d].known).length;
        const loadByDate=Object.fromEntries(dates.map(d=>[d,(s.dated_todos||[])
          .filter(t=>t.date===d&&isOpenTodo(t))
          .map(t=>({
            tags:t.cognitive_load_profile||[],
            score:Number.isFinite(t.activity_load_score)?t.activity_load_score:3,
            difficulty:Number.isFinite(t.difficulty)?t.difficulty:3,
            recovery_need:t.recovery_need||'MEDIUM'
          }))]));
        const scheduleByDate=Object.fromEntries(dates.map(d=>[d,scheduleCommitmentsForDate(d,s)]));
        const proposals=[];
        for(const unit of units){
          const existing=s.dated_todos.find(t=>t.learning_unit_id===unit.learning_unit_id&&isOpenTodo(t));
          if(existing){proposals.push({decision:'REUSE',date:existing.date,todo_id:existing.todo_id,learning_unit_id:unit.learning_unit_id});continue}
          const tags=unit.cognitive_load_profile||[];
          const unitLoad=unit.activity_load||{};
          const unitScore=Number.isFinite(unitLoad.score)?unitLoad.score:3;
          const unitDifficulty=Number.isFinite(unitLoad.difficulty)?unitLoad.difficulty:3;
          const unitRecovery=unitLoad.recovery_need||'MEDIUM';
          const operatingRuleByDate=Object.fromEntries(dates.map(d=>[d,operatingRuleForUnit(unit,d,scheduleByDate)]));
          const date=[...dates].sort((a,b)=>{
            const ar=!!operatingRuleByDate[a],br=!!operatingRuleByDate[b];
            if(ar!==br)return ar?-1:1;
            const wa=freeWindowByDate[a],wb=freeWindowByDate[b];
            if(wa.known||wb.known){
              if(wa.known!==wb.known)return wa.known?-1:1;
              const aHas=wa.total_free_minutes>0,bHas=wb.total_free_minutes>0;
              if(aHas!==bHas)return aHas?-1:1;
              if((wb.largest_contiguous_minutes||0)!==(wa.largest_contiguous_minutes||0))return (wb.largest_contiguous_minutes||0)-(wa.largest_contiguous_minutes||0);
              if((wb.total_free_minutes||0)!==(wa.total_free_minutes||0))return (wb.total_free_minutes||0)-(wa.total_free_minutes||0);
            }
            const score=d=>{
              const taskLoads=loadByDate[d]||[];
              const commitments=scheduleByDate[d]||[];
              const commitmentMinutes=commitments.reduce((sum,x)=>{
                const start=parseLocal(d,String(x.start_at).slice(11,16));
                const end=parseLocal(d,String(x.end_at).slice(11,16));
                return sum+Math.max(0,minutes(end-start));
              },0);
              const existingLoad=taskLoads.reduce((sum,x)=>sum+(x.score||3),0);
              const overlap=taskLoads.reduce((sum,x)=>sum+(x.tags||[]).filter(tag=>tags.includes(tag)).length,0);
              const highLoadStack=taskLoads.filter(x=>(x.score||3)>=4).length;
              const highDifficultyStack=taskLoads.filter(x=>(x.difficulty||3)>=4).length;
              const recoveryStack=taskLoads.filter(x=>x.recovery_need==='HIGH').length;
              const schedulePressure=commitments.length*15+Math.min(30,Math.floor(commitmentMinutes/30));
              const recoveryPenalty=unitRecovery==='HIGH'?(highLoadStack*18+recoveryStack*15):unitRecovery==='MEDIUM'?highLoadStack*8:0;
              const difficultyPenalty=unitDifficulty>=4?highDifficultyStack*12:0;
              const historicalSignal=crossRevisionLearningSignal({
                assignment_id:assignmentId,
                subject:unit.subject,
                current_revision:Number(fact.fact_revision)||1,
                activity_types:unit.activity_types||[],
                allow_subject_generalization:true
              });
              const historySafetyPenalty=historicalSignal?.risk_band==='HIGH'?(highLoadStack*8+recoveryStack*6):historicalSignal?.risk_band==='MEDIUM'?highLoadStack*3:0;
              return taskLoads.length*8
                + existingLoad*4
                + overlap*18
                + recoveryPenalty
                + difficultyPenalty
                + historySafetyPenalty
                + (unitScore>=5&&commitmentMinutes>=120?20:0)
                + schedulePressure;
            };
            return score(a)-score(b)||a.localeCompare(b);
          })[0];
          loadByDate[date].push({tags,score:unitScore,difficulty:unitDifficulty,recovery_need:unitRecovery});
          const operatingRule=operatingRuleByDate[date]||null;
          const templateId=`template_${unit.learning_unit_id}`;
          const factRevision=Number(fact.fact_revision)||1;
          const template={template_id:templateId,title:`${unit.subject} · ${unit.source_range||unit.concept_skill_target}`,subject:unit.subject,assignment_cycle:fact.assignment_cycle,learning_units:[unit.learning_unit_id],provenance:{kind:'LEARNING_MASTER_OUTPUT',assignment_id:assignmentId,analysis_id:analysis.analysis_id,fact_revision:factRevision},confirmation_state:'CONFIRMED',deadline_date:fact.deadline_boundary||null,estimated_minutes:null,planner_estimated_minutes:null,allocation_priority:operatingRule?20:100,required_today:!!operatingRule,preferred_days:[],operating_rule:operatingRule?.rule_id||null,preferred_daypart:operatingRule?.preferred_daypart||null,operating_rule_evidence:operatingRule?.evidence||null,updated_at:new Date().toISOString()};
          const ti=s.homework_templates.findIndex(x=>x.template_id===templateId);if(ti>=0)s.homework_templates[ti]=template;else s.homework_templates.push(template);
          proposals.push({
            decision:'PROPOSE',date,label:template.title,subject:unit.subject,assignment_id:assignmentId,analysis_id:analysis.analysis_id,
            fact_revision:Number(fact.fact_revision)||1,
            learning_unit_id:unit.learning_unit_id,template_id:templateId,
            activity_types:unit.activity_types,
            activity_sequence:unit.activity_sequence||[],
            matched_domain:unit.analysis_provenance?.learning_reference?.matched_domain||null,
            method_variant:unit.analysis_provenance?.learning_reference?.method_variant||null,
            concept_skill_target:unit.concept_skill_target||null,
            divisible_boundary:unit.divisible_boundary||null,
            confidence:Number.isFinite(unit.confidence)?unit.confidence:null,
            unresolved_flags:Array.isArray(unit.unresolved_flags)?[...unit.unresolved_flags]:[],
            cognitive_load_profile:unit.cognitive_load_profile,
            activity_load_score:unitScore,
            difficulty:unitDifficulty,
            recovery_need:unitRecovery,
            review_policy:unit.review_policy||'RESULT_DEPENDENT',
            parent_help_dependency:unit.parent_help_dependency||'UNRESOLVED',
            prerequisite:unit.prerequisite,
            operating_rule:operatingRule?.rule_id||null,
            preferred_daypart:operatingRule?.preferred_daypart||null,
            operating_rule_evidence:operatingRule?.evidence||null,
            cross_revision_learning_signal:crossRevisionLearningSignal({
              assignment_id:assignmentId,
              subject:unit.subject,
              current_revision:Number(fact.fact_revision)||1,
              activity_types:unit.activity_types||[],
              allow_subject_generalization:true
            }),
            free_window_evidence:freeWindowByDate[date]
          });
        }
        const run={allocation_run_id:runId,version:'PLANNER_V2',assignment_id:assignmentId,analysis_id:analysis.analysis_id,fact_revision:Number(fact.fact_revision)||1,primary_basis:'LEARNING_UNIT_ACTIVITY_LOAD',minutes_role:'SECONDARY_SAFETY_ONLY',free_window_role:'SECONDARY_CAPACITY_SAFETY',free_window_coverage:{known_dates:freeWindowCoverage,total_dates:dates.length},free_window_by_date:freeWindowByDate,proposals,created_at:new Date().toISOString()};
        s.allocation_runs.push(run);return {ok:true,...run};
      });
    }
    function commitLearningAllocation(runId){
      return mutate(s=>{const run=s.allocation_runs.find(x=>x.allocation_run_id===runId&&x.version==='PLANNER_V2');if(!run)return {ok:false,reason:'ALLOCATION_RUN_NOT_FOUND'};
        const created=[];
        for(const p of run.proposals.filter(x=>x.decision==='PROPOSE')){
          let todo=s.dated_todos.find(x=>x.learning_unit_id===p.learning_unit_id&&isOpenTodo(x));
          if(!todo){todo={
            todo_id:makeId('todo'),date:p.date,label:p.label,subject:p.subject||null,assignment_id:p.assignment_id,analysis_id:p.analysis_id,
            fact_revision:Number(p.fact_revision)||Number(run.fact_revision)||1,
            learning_unit_id:p.learning_unit_id,template_id:p.template_id,allocation_run_id:runId,
            activity_types:p.activity_types,activity_sequence:p.activity_sequence||[],
            matched_domain:p.matched_domain||null,method_variant:p.method_variant||null,
            concept_skill_target:p.concept_skill_target||null,
            divisible_boundary:p.divisible_boundary||null,
            confidence:Number.isFinite(p.confidence)?p.confidence:null,
            unresolved_flags:Array.isArray(p.unresolved_flags)?[...p.unresolved_flags]:[],
            cognitive_load_profile:p.cognitive_load_profile,
            activity_load_score:p.activity_load_score,difficulty:p.difficulty,recovery_need:p.recovery_need,
            free_window_evidence:p.free_window_evidence||null,
            review_policy:p.review_policy,parent_help_dependency:p.parent_help_dependency,
            operating_rule:p.operating_rule||null,
            preferred_daypart:p.preferred_daypart||null,
            operating_rule_evidence:p.operating_rule_evidence||null,
            source:'PLANNER_V2_ALLOCATION',source_actor:'PLANNER_MAIN',
            provenance:{assignment_id:p.assignment_id,analysis_id:p.analysis_id,learning_unit_id:p.learning_unit_id,allocation_run_id:runId,fact_revision:Number(p.fact_revision)||Number(run.fact_revision)||1},
            order:created.length,state:'PLANNED',estimated_minutes:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()
          };s.dated_todos.push(todo)}
          created.push({...todo});
        }
        return {ok:true,created};
      });
    }
    function replanCarryOver(input={}){
      const carryId=cleanText(input.carry_over_id),date=cleanText(input.date);if(!carryId||!date)return {ok:false,reason:'CARRY_AND_DATE_REQUIRED'};
      return mutate(s=>{const carry=s.carry_over_queue.find(x=>x.carry_over_id===carryId&&x.status==='OPEN');if(!carry)return {ok:false,reason:'CARRY_OVER_NOT_FOUND'};
        if(carry.resolution_required)return {ok:false,reason:'CARRY_OVER_REQUIRES_RESOLUTION'};
        const source=s.dated_todos.find(x=>x.todo_id===carry.source_todo_id);if(!source)return {ok:false,reason:'SOURCE_TODO_NOT_FOUND'};
        const nextDepth=Math.max(0,Number(source.provenance?.carry_over_depth)||0)+1;
        const template=s.homework_templates.find(x=>x.template_id===source.template_id)||null;
        const deadline=cleanText(template?.deadline_date)||null;
        const maxAutoDepth=Math.max(1,Number(input.max_auto_depth)||3);
        const escalation=rebuildPolicy?.carryEscalation?.({nextDepth,deadline,targetDate:date,maxAutoDepth})||(()=>{const deadlineExceeded=deadline&&date>deadline;const nearDeadline=deadline&&date>=addDays(deadline,-1);return {required:!!(deadlineExceeded||nextDepth>maxAutoDepth||(nearDeadline&&nextDepth>=maxAutoDepth)),reason:deadlineExceeded?'DEADLINE_EXCEEDED':nearDeadline?'REPEATED_CARRY_NEAR_DEADLINE':nextDepth>maxAutoDepth?'REPEATED_CARRY_LIMIT':null}})();
        if(escalation.required){
          carry.resolution_required=true;
          carry.allocation_ready=false;
          carry.escalation_reason=escalation.reason;
          carry.escalation_level='PARENT_LEARNING_MASTER_REVIEW';
          carry.escalated_at=new Date().toISOString();
          carry.next_carry_over_depth=nextDepth;
          carry.deadline_date=deadline;
          carry.updated_at=new Date().toISOString();
          return {ok:false,reason:'CARRY_OVER_ESCALATION_REQUIRED',carry_over_id:carryId,escalation_reason:carry.escalation_reason,escalation_level:carry.escalation_level,next_depth:nextDepth,deadline_date:deadline};
        }
        const rootTodoId=cleanText(source.provenance?.root_todo_id)||source.todo_id;
        const lineageDepth=nextDepth;
        const todo={
          todo_id:makeId('todo'),
          date,
          label:source.label,
          subject:source.subject||null,
          template_id:source.template_id||null,
          assignment_id:source.assignment_id||null,
          analysis_id:source.analysis_id||null,
          fact_revision:Number(source.fact_revision)||Number(source.provenance?.fact_revision)||1,
          learning_unit_id:source.learning_unit_id||null,
          allocation_run_id:source.allocation_run_id||null,
          activity_types:Array.isArray(source.activity_types)?[...source.activity_types]:[],
          activity_sequence:Array.isArray(source.activity_sequence)?[...source.activity_sequence]:[],
          cognitive_load_profile:Array.isArray(source.cognitive_load_profile)?[...source.cognitive_load_profile]:[],
          activity_load_score:Number.isFinite(source.activity_load_score)?source.activity_load_score:null,
          difficulty:Number.isFinite(source.difficulty)?source.difficulty:null,
          recovery_need:source.recovery_need||null,
          review_policy:source.review_policy||null,
          parent_help_dependency:source.parent_help_dependency||null,
          operating_rule:source.operating_rule||null,
          preferred_daypart:source.preferred_daypart||null,
          operating_rule_evidence:source.operating_rule_evidence||null,
          estimated_minutes:Number.isFinite(source.estimated_minutes)?source.estimated_minutes:null,
          source:'PLANNER_V2_CARRY_OVER',
          source_actor:'PLANNER_MAIN',
          provenance:{
            assignment_id:source.assignment_id||source.provenance?.assignment_id||null,
            analysis_id:source.analysis_id||source.provenance?.analysis_id||null,
            learning_unit_id:source.learning_unit_id||source.provenance?.learning_unit_id||null,
            allocation_run_id:source.allocation_run_id||source.provenance?.allocation_run_id||null,
            fact_revision:Number(source.fact_revision)||Number(source.provenance?.fact_revision)||1,
            carry_over_id:carryId,
            source_todo_id:source.todo_id,
            root_todo_id:rootTodoId,
            carry_over_depth:lineageDepth
          },
          order:Number.isFinite(source.order)?source.order:999,
          state:'PLANNED',
          created_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        };
        s.dated_todos.push(todo);carry.status='RESCHEDULED';carry.rescheduled_todo_id=todo.todo_id;carry.rescheduled_to=date;carry.updated_at=new Date().toISOString();return {ok:true,todo:{...todo}};
      });
    }


    function parseLocal(date,time){
      const [y,m,d]=String(date).split('-').map(Number);
      const [hh,mm]=String(time||'00:00').split(':').map(Number);
      return new Date(y,m-1,d,hh||0,mm||0,0,0);
    }

    function clampWindows(date,windows=[]){
      return (windows||[]).map(w=>{
        const start=parseLocal(date,w.start);
        const end=parseLocal(date,w.end);
        return {start,end,start_text:w.start,end_text:w.end};
      }).filter(w=>w.end>w.start);
    }

    function mergeIntervals(intervals=[]){
      const sorted=[...(intervals||[])].sort((a,b)=>a.start-b.start);
      const out=[];
      for(const interval of sorted){
        if(!out.length||interval.start>out[out.length-1].end){out.push({...interval});continue}
        if(interval.end>out[out.length-1].end)out[out.length-1].end=interval.end;
      }
      return out;
    }

    function commitmentIntervals(state,date){
      return scheduleCommitmentsForDate(date,state)
        .filter(x=>x.confirmed!==false && x.start_at && x.end_at)
        .map(x=>({
          start:parseLocal(date,String(x.start_at).slice(11,16)),
          end:parseLocal(date,String(x.end_at).slice(11,16)),
          commitment_id:x.commitment_id,
          title:x.title,
          schedule_exception:x.schedule_exception||null
        }))
        .filter(x=>x.end>x.start);
    }

    function subtractIntervals(base,blocks){
      let parts=[base];
      for(const block of blocks){
        const next=[];
        for(const p of parts){
          if(block.end<=p.start || block.start>=p.end){next.push(p);continue}
          if(block.start>p.start)next.push({...p,end:block.start});
          if(block.end<p.end)next.push({...p,start:block.end});
        }
        parts=next;
      }
      return parts.filter(p=>p.end>p.start);
    }

    function minutes(ms){return Math.max(0,Math.floor(ms/60000));}

    function freeWindowEvidence(state,date,windows=[]){
      const candidate=mergeIntervals(clampWindows(date,windows||[]));
      if(!candidate.length)return {known:false,date,total_free_minutes:null,largest_contiguous_minutes:null,window_count:0,open_windows:[]};
      const commitments=commitmentIntervals(state,date);
      const open=candidate.flatMap(w=>subtractIntervals(w,commitments));
      const spans=open.map(w=>({
        start:w.start.toISOString(),
        end:w.end.toISOString(),
        minutes:minutes(w.end-w.start)
      }));
      const total=spans.reduce((sum,w)=>sum+w.minutes,0);
      const largest=spans.reduce((max,w)=>Math.max(max,w.minutes),0);
      return {
        known:true,
        date,
        total_free_minutes:total,
        largest_contiguous_minutes:largest,
        window_count:spans.length,
        open_windows:spans
      };
    }

    function eligibleTemplate(template,date){
      if(template.confirmation_state && template.confirmation_state!=='CONFIRMED')return false;
      if(template.deadline_date && date>template.deadline_date)return false;
      const dow=parseLocal(date,'12:00').getDay();
      if(template.preferred_days?.length && !template.preferred_days.includes(dow) && !template.required_today)return false;
      return true;
    }

    function allocateToday(input={}){
      const date=cleanText(input.date)||dateKey();
      const candidateWindows=clampWindows(date,input.candidate_windows||[]);
      if(!candidateWindows.length){
        return {ok:false,reason:'NO_CANDIDATE_WINDOWS',date,proposals:[],available_minutes:0};
      }
      return mutate(s=>{
        const commitments=commitmentIntervals(s,date);
        const open=candidateWindows.flatMap(w=>subtractIntervals(w,commitments));
        const availableMinutes=open.reduce((sum,w)=>sum+minutes(w.end-w.start),0);
        const maxMinutes=Number.isFinite(input.max_minutes)
          ? Math.max(0,Math.min(input.max_minutes,availableMinutes))
          : availableMinutes;

        const existingOpen=new Set(
          s.dated_todos.filter(x=>x.date===date&&isOpenTodo(x)).map(x=>x.template_id).filter(Boolean)
        );
        const openCarry=s.carry_over_queue.filter(x=>x.status==='OPEN');
        const carryByTemplate=new Map(openCarry.filter(x=>x.template_id).map(x=>[x.template_id,x]));
        const candidates=s.homework_templates
          .filter(t=>eligibleTemplate(t,date) || carryByTemplate.has(t.template_id))
          .filter(t=>!existingOpen.has(t.template_id))
          .filter(t=>Number.isFinite(t.estimated_minutes) && t.estimated_minutes>0)
          .sort((a,b)=>{
            if(!!a.required_today!==!!b.required_today)return a.required_today?-1:1;
            const ac=carryByTemplate.has(a.template_id),bc=carryByTemplate.has(b.template_id);
            if(ac!==bc)return ac?-1:1;
            const ad=a.deadline_date||'9999-12-31',bd=b.deadline_date||'9999-12-31';
            if(ad!==bd)return ad.localeCompare(bd);
            if(a.allocation_priority!==b.allocation_priority)return a.allocation_priority-b.allocation_priority;
            return a.title.localeCompare(b.title,'ko');
          });

        const proposals=[];
        let used=0;
        for(const t of candidates){
          const carry=carryByTemplate.get(t.template_id)||null;
          if(carry?.resolution_required){
            proposals.push({
              template_id:t.template_id,label:t.title,estimated_minutes:t.estimated_minutes,
              decision:'HOLD',reason:'CARRY_OVER_REQUIRES_RESOLUTION',
              deadline_date:t.deadline_date||null,carry_over_id:carry.carry_over_id
            });
            continue;
          }
          const evidence=recentEstimateEvidence(t.template_id);
          const est=t.estimated_minutes;
          if(!t.required_today && used+est>maxMinutes)continue;
          if(t.required_today && used+est>maxMinutes){
            proposals.push({
              template_id:t.template_id,label:t.title,estimated_minutes:est,
              decision:'REQUIRES_REPLAN',reason:'REQUIRED_TASK_EXCEEDS_CURRENT_CAPACITY',
              deadline_date:t.deadline_date||null,
              carry_over_id:carry?.carry_over_id||null,
              estimate_evidence:evidence
            });
            continue;
          }
          proposals.push({
            template_id:t.template_id,label:t.title,estimated_minutes:est,
            decision:'PROPOSE',reason:t.required_today?'REQUIRED_TODAY':'FITS_CONFIRMED_CAPACITY',
            deadline_date:t.deadline_date||null,
            carry_over_id:carry?.carry_over_id||null,
            estimate_evidence:evidence
          });
          used+=est;
        }

        const run={
          allocation_run_id:makeId('allocation'),
          date,
          source:'READY_PLANNER_V01',
          candidate_windows:(input.candidate_windows||[]),
          available_minutes:availableMinutes,
          max_minutes:maxMinutes,
          proposed_minutes:used,
          proposals,
          condition_evidence:input.condition_evidence||null,
          created_at:new Date().toISOString()
        };
        s.allocation_runs.push(run);
        s.allocation_runs=s.allocation_runs.slice(-100);
        return {ok:true,...run,open_windows:open.map(w=>({
          start:w.start.toISOString(),end:w.end.toISOString(),minutes:minutes(w.end-w.start)
        }))};
      });
    }

    function commitAllocation(runId,templateIds=[]){
      const ids=new Set(templateIds);
      return mutate(s=>{
        const run=s.allocation_runs.find(x=>x.allocation_run_id===runId);
        if(!run)return {ok:false,reason:'ALLOCATION_RUN_NOT_FOUND',created:[]};
        const created=[];
        for(const p of run.proposals){
          if(p.decision!=='PROPOSE'||!ids.has(p.template_id))continue;
          let todo=s.dated_todos.find(x=>x.date===run.date&&x.template_id===p.template_id&&isOpenTodo(x));
          if(!todo){
            todo={
              todo_id:makeId('todo'),
              date:run.date,
              label:p.label,
              template_id:p.template_id,
              source:'PLANNER_ALLOCATION',
              source_actor:'PLANNER_MAIN',
              provenance:{allocation_run_id:runId},
              order:created.length,
              state:'PLANNED',
              estimated_minutes:p.estimated_minutes,
              created_at:new Date().toISOString(),
              updated_at:new Date().toISOString()
            };
            s.dated_todos.push(todo);
          }
          if(p.carry_over_id){
            const carry=s.carry_over_queue.find(x=>x.carry_over_id===p.carry_over_id);
            if(carry&&carry.status==='OPEN'){
              carry.status='RESCHEDULED';
              carry.rescheduled_todo_id=todo.todo_id;
              carry.rescheduled_to=run.date;
              carry.updated_at=new Date().toISOString();
            }
          }
          created.push({todo_id:todo.todo_id,label:todo.label,template_id:todo.template_id,carry_over_id:p.carry_over_id||null});
        }
        return {ok:true,created};
      });
    }


    function recordSessionOutcome(input={}){
      const todoId=cleanText(input.todo_id); if(!todoId) return {ok:false,reason:'TODO_ID_REQUIRED'};
      const readyState=cleanText(input.ready_state);
      const mapped=rebuildPolicy?.mapReadyState?.(readyState)??(READY_TO_TODO[readyState]||readyState);
      if(!mapped||!TODO_STATES.has(mapped)) return {ok:false,reason:'INVALID_READY_STATE'};
      const actualMs=Number.isFinite(input.actual_ms)?Math.max(0,input.actual_ms):0;
      const actualMinutes=Math.round(actualMs/60000);
      return mutate(s=>{
        const todo=s.dated_todos.find(x=>x.todo_id===todoId);
        if(!todo)return {ok:false,reason:'TODO_NOT_FOUND'};
        const sessionId=cleanText(input.session_id)||null;
        const ownership=rebuildPolicy?.validateSessionOwnership?.(todo,sessionId)||{ok:!(todo.active_session_id&&sessionId&&todo.active_session_id!==sessionId),reason:'SESSION_OWNERSHIP_CONFLICT',active_session_id:todo.active_session_id};
        if(!ownership.ok){
          return {ok:false,reason:ownership.reason||'SESSION_OWNERSHIP_CONFLICT',todo_id:todoId,active_session_id:ownership.active_session_id||todo.active_session_id};
        }
        const finishable=rebuildPolicy?.canFinishTodo?.(todo)??(todo.state==='IN_PROGRESS'||['PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED'].includes(todo.state));
        if(!finishable){
          return {ok:false,reason:'TODO_NOT_FINISHABLE',todo_id:todoId,state:todo.state};
        }
        todo.state=mapped;
        todo.actual_minutes=actualMinutes;
        todo.active_session_id=null;
        todo.active_task_id=null;
        todo.updated_at=new Date().toISOString();

        const eventAt=input.at||new Date().toISOString();
        const observationKey=[cleanText(input.session_id),cleanText(input.task_id),todoId].join('|');
        let obs=s.execution_observations.find(x=>x.observation_key===observationKey);
        if(!obs){
          obs={
            observation_id:makeId('observation'),
            observation_key:observationKey,
            todo_id:todoId,
            template_id:todo.template_id||null,
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            allocation_run_id:todo.allocation_run_id||null,
            fact_revision:Number(todo.fact_revision)||Number(todo.provenance?.fact_revision)||1,
            subject:todo.subject||null,
            activity_types:Array.isArray(todo.activity_types)?[...todo.activity_types]:[],
            difficulty:Number.isFinite(todo.difficulty)?todo.difficulty:null,
            recovery_need:todo.recovery_need||null,
            planned_minutes:Number.isFinite(todo.estimated_minutes)?todo.estimated_minutes:null,
            actual_minutes:actualMinutes,
            ready_state:readyState,
            session_id:cleanText(input.session_id)||null,
            task_id:cleanText(input.task_id)||null,
            source:'READY_SESSION',
            time_attribution:cleanText(input.time_attribution)||'DIRECT_TASK_OBSERVATION',
            session_total_actual_ms:Number.isFinite(input.session_total_actual_ms)?Math.max(0,input.session_total_actual_ms):null,
            session_task_count:Number.isFinite(input.session_task_count)?Math.max(1,Math.floor(input.session_task_count)):null,
            learning_evidence:Array.isArray(input.learning_evidence)?input.learning_evidence.slice(-120):[],
            completed_specialists:Array.isArray(input.completed_specialists)?[...new Set(input.completed_specialists.map(cleanText).filter(Boolean))]:[],
            at:eventAt
          };
          s.execution_observations.push(obs);
          s.execution_observations=s.execution_observations.slice(-500);
        }

        const progressKey=[cleanText(input.session_id),cleanText(input.task_id),todoId,mapped].join('|');
        if(!s.progress_events.some(x=>x.event_key===progressKey)){
          s.progress_events.push({
            event_id:makeId('progress'),
            event_key:progressKey,
            todo_id:todoId,
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            template_id:todo.template_id||null,
            allocation_run_id:todo.allocation_run_id||null,
            fact_revision:Number(todo.fact_revision)||Number(todo.provenance?.fact_revision)||1,
            session_id:cleanText(input.session_id)||null,
            task_id:cleanText(input.task_id)||null,
            state:mapped,
            evidence_types:[...new Set((Array.isArray(input.learning_evidence)?input.learning_evidence:[]).map(x=>cleanText(x?.evidence_type)).filter(Boolean))],
            completed_specialists:Array.isArray(input.completed_specialists)?[...new Set(input.completed_specialists.map(cleanText).filter(Boolean))]:[],
            source:'READY_SESSION_OUTCOME',
            at:eventAt
          });
          s.progress_events=s.progress_events.slice(-500);
        }

        const carryPolicy=rebuildPolicy?.carryPolicyForState?.(mapped)||{carryEligible:['PARTIAL','DEFERRED'].includes(mapped),resolutionRequired:['BLOCKED','WAITING_FOR_PARENT'].includes(mapped),resolvesOpenCarry:mapped==='COMPLETED'};
        const carryEligible=carryPolicy.carryEligible;
        const carryNeedsResolution=carryPolicy.resolutionRequired;
        const existing=s.carry_over_queue.find(x=>x.source_todo_id===todoId&&x.status==='OPEN');
        if((carryEligible||carryNeedsResolution)&&!existing){
          s.carry_over_queue.push({
            carry_over_id:makeId('carry'),
            source_todo_id:todoId,
            template_id:todo.template_id||null,
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            allocation_run_id:todo.allocation_run_id||null,
            fact_revision:Number(todo.fact_revision)||Number(todo.provenance?.fact_revision)||1,
            label:todo.label,
            from_date:todo.date,
            state:mapped,
            status:'OPEN',
            allocation_ready:carryEligible,
            resolution_required:carryNeedsResolution,
            planned_minutes:Number.isFinite(todo.estimated_minutes)?todo.estimated_minutes:null,
            actual_minutes:actualMinutes,
            evidence_types:[...new Set((Array.isArray(input.learning_evidence)?input.learning_evidence:[]).map(x=>cleanText(x?.evidence_type)).filter(Boolean))],
            completed_specialists:Array.isArray(input.completed_specialists)?[...new Set(input.completed_specialists.map(cleanText).filter(Boolean))]:[],
            created_at:new Date().toISOString()
          });
        }
        if(carryPolicy.resolvesOpenCarry){
          s.carry_over_queue.forEach(x=>{
            if(x.source_todo_id===todoId&&x.status==='OPEN'){
              x.status='RESOLVED';
              x.resolved_at=new Date().toISOString();
            }
          });
        }
        return {ok:true,todo_id:todoId,state:mapped,actual_minutes:actualMinutes,carry_over_created:!!((carryEligible||carryNeedsResolution)&&!existing)};
      });
    }

    function replanReadyCarryOvers(input={}){
      const date=cleanText(input.date)||dateKey();
      const s=load();
      const ids=s.carry_over_queue
        .filter(x=>x.status==='OPEN'&&x.allocation_ready===true&&x.resolution_required!==true)
        .filter(x=>cleanText(x.from_date)<date)
        .map(x=>x.carry_over_id);
      const results=[];
      for(const carryOverId of ids)results.push(replanCarryOver({carry_over_id:carryOverId,date}));
      return {ok:true,date,attempted:ids.length,results};
    }

    function carryOverCandidates(){
      return load().carry_over_queue.filter(x=>x.status==='OPEN').map(x=>({...x}));
    }

    function resolveCarryOver(carryOverId,input={}){
      const id=cleanText(carryOverId); if(!id)return {ok:false,reason:'CARRY_OVER_ID_REQUIRED'};
      return mutate(s=>{
        const carry=s.carry_over_queue.find(x=>x.carry_over_id===id&&x.status==='OPEN');
        if(!carry)return {ok:false,reason:'CARRY_OVER_NOT_FOUND'};
        const resolution=cleanText(input.resolution)||'READY_FOR_REPLAN';
        if(resolution==='READY_FOR_REPLAN'){
          carry.resolution_required=false;
          carry.allocation_ready=true;
          carry.resolution='READY_FOR_REPLAN';
          carry.resolved_by=cleanText(input.actor)||'HUMAN_CONFIRMATION';
          carry.updated_at=new Date().toISOString();
          return {ok:true,carry_over_id:id,status:'OPEN',allocation_ready:true};
        }
        if(resolution==='CANCEL'){
          carry.status='CANCELLED';
          carry.resolution='CANCEL';
          carry.resolved_by=cleanText(input.actor)||'HUMAN_CONFIRMATION';
          carry.resolved_at=new Date().toISOString();
          return {ok:true,carry_over_id:id,status:'CANCELLED',allocation_ready:false};
        }
        return {ok:false,reason:'INVALID_CARRY_OVER_RESOLUTION'};
      });
    }

    function crossRevisionLearningSignal(input={}){
      const assignmentId=cleanText(input.assignment_id);
      const subject=cleanText(input.subject);
      const currentRevision=Number(input.current_revision)||null;
      const activityTypes=new Set((input.activity_types||[]).map(cleanText).filter(Boolean));
      const allowSubjectGeneralization=input.allow_subject_generalization===true;
      const maxSamples=Math.max(2,Math.min(20,Number(input.max_samples)||12));
      const maxAgeDays=Math.max(14,Math.min(365,Number(input.max_age_days)||120));
      const halfLifeDays=Math.max(7,Math.min(maxAgeDays,Number(input.half_life_days)||30));
      const nowMs=Number.isFinite(input.now_ms)?input.now_ms:Date.now();
      const s=load();

      const eligible=x=>{
        if(currentRevision!==null&&Number(x.fact_revision)===currentRevision)return false;
        if(!Number.isFinite(x.actual_minutes)||x.actual_minutes<=0)return false;
        if(subject&&x.subject!==subject)return false;
        const rowTypes=new Set((x.activity_types||[]).map(cleanText).filter(Boolean));
        if(activityTypes.size&&!([...activityTypes].some(t=>rowTypes.has(t))))return false;
        const atMs=Date.parse(x.at||'');
        if(!Number.isFinite(atMs))return false;
        const ageDays=Math.max(0,(nowMs-atMs)/86400000);
        return ageDays<=maxAgeDays;
      };
      const assignmentRows=s.execution_observations.filter(x=>x.assignment_id===assignmentId&&eligible(x));
      let scope='SAME_ASSIGNMENT_HISTORY';
      let rows=assignmentRows;
      if(rows.length<2&&allowSubjectGeneralization&&subject&&activityTypes.size){
        rows=s.execution_observations.filter(x=>eligible(x));
        scope='SAME_SUBJECT_ACTIVITY_HISTORY';
      }
      rows=rows
        .map(x=>{
          const ageDays=Math.max(0,(nowMs-Date.parse(x.at))/86400000);
          const recencyWeight=Math.pow(0.5,ageDays/halfLifeDays);
          return {...x,_age_days:ageDays,_weight:recencyWeight};
        })
        .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))
        .slice(0,maxSamples);
      if(rows.length<2)return null;

      const totalWeight=rows.reduce((sum,x)=>sum+x._weight,0);
      if(totalWeight<1.1)return null;
      const weightedMedian=()=>{
        const ordered=[...rows].sort((a,b)=>a.actual_minutes-b.actual_minutes);
        let acc=0;
        for(const row of ordered){
          acc+=row._weight;
          if(acc>=totalWeight/2)return row.actual_minutes;
        }
        return ordered.at(-1)?.actual_minutes||null;
      };
      const frictionStates=new Set(['PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED']);
      const weightedRate=predicate=>rows.reduce((sum,x)=>sum+(predicate(x)?x._weight:0),0)/totalWeight;
      const signal={
        authority:'CROSS_REVISION_ADVISORY_ONLY',
        source:'EXECUTION_HISTORY',
        generalization_scope:scope,
        sample_count:rows.length,
        effective_sample_weight:Number(totalWeight.toFixed(2)),
        median_actual_minutes:weightedMedian(),
        friction_rate:Number(weightedRate(x=>frictionStates.has(cleanText(x.ready_state))).toFixed(2)),
        high_recovery_rate:Number(weightedRate(x=>x.recovery_need==='HIGH').toFixed(2)),
        subject:subject||null,
        activity_types:[...activityTypes],
        source_revisions:[...new Set(rows.map(x=>Number(x.fact_revision)||1))].sort((a,b)=>a-b),
        recency_policy:{half_life_days:halfLifeDays,max_age_days:maxAgeDays,max_samples:maxSamples},
        oldest_sample_age_days:Number(Math.max(...rows.map(x=>x._age_days)).toFixed(1)),
        newest_sample_age_days:Number(Math.min(...rows.map(x=>x._age_days)).toFixed(1)),
        can_influence:['LOAD_SAFETY','RECOVERY_SPACING'],
        cannot_influence:['ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','REQUIRED_TODAY','FACT_CONFIRMATION']
      };
      signal.risk_band=signal.friction_rate>=0.5||signal.high_recovery_rate>=0.5?'HIGH':signal.friction_rate>=0.25?'MEDIUM':'LOW';
      return signal;
    }

    function recentEstimateEvidence(templateId,limit=5,options={}){
      const s=load();
      const template=s.homework_templates.find(x=>x.template_id===templateId)||null;
      const targetRevision=Number(options.fact_revision)||Number(template?.provenance?.fact_revision)||null;
      const rows=s.execution_observations
        .filter(x=>x.template_id===templateId&&Number.isFinite(x.actual_minutes)&&x.actual_minutes>0)
        .filter(x=>targetRevision===null||Number(x.fact_revision)===targetRevision)
        .slice(-Math.max(1,limit));
      if(!rows.length)return null;
      const vals=rows.map(x=>x.actual_minutes).sort((a,b)=>a-b);
      const mid=Math.floor(vals.length/2);
      const median=vals.length%2?vals[mid]:Math.round((vals[mid-1]+vals[mid])/2);
      return {
        template_id:templateId,
        sample_count:vals.length,
        median_actual_minutes:median,
        values:vals,
        authority:'OBSERVATION_ONLY',
        fact_revision:targetRevision
      };
    }


    function learningHistory(assignmentId,options={}){
      const id=cleanText(assignmentId);if(!id)return [];
      const currentRevision=Number(options.current_revision)||null;
      const s=load();
      return s.execution_observations
        .filter(x=>x.assignment_id===id)
        .map(x=>({
          ...x,
          history_role:currentRevision!==null&&Number(x.fact_revision)===currentRevision
            ?'CURRENT_REVISION_OBSERVATION'
            :'HISTORICAL_OBSERVATION_ONLY',
          reusable_for_current_estimate:currentRevision!==null&&Number(x.fact_revision)===currentRevision
        }));
    }

    function proposeEstimateAdjustment(templateId,input={}){
      const id=cleanText(templateId);
      if(!id)return {ok:false,reason:'TEMPLATE_ID_REQUIRED'};
      const minSamples=Number.isFinite(input.min_samples)?Math.max(1,Math.floor(input.min_samples)):3;
      const minDelta=Number.isFinite(input.min_delta_minutes)?Math.max(0,Math.floor(input.min_delta_minutes)):5;
      const evidenceLimit=Number.isFinite(input.evidence_limit)?Math.max(minSamples,Math.floor(input.evidence_limit)):5;
      return mutate(s=>{
        const template=s.homework_templates.find(x=>x.template_id===id);
        if(!template)return {ok:false,reason:'TEMPLATE_NOT_FOUND'};
        const targetRevision=Number(template.provenance?.fact_revision)||null;
        const rows=s.execution_observations
          .filter(x=>x.template_id===id&&Number.isFinite(x.actual_minutes)&&x.actual_minutes>0)
          .filter(x=>targetRevision===null||Number(x.fact_revision)===targetRevision)
          .slice(-evidenceLimit);
        if(rows.length<minSamples)return {ok:false,reason:'INSUFFICIENT_EVIDENCE',sample_count:rows.length,min_samples:minSamples};
        const vals=rows.map(x=>x.actual_minutes).sort((a,b)=>a-b);
        const mid=Math.floor(vals.length/2);
        const median=vals.length%2?vals[mid]:Math.round((vals[mid-1]+vals[mid])/2);
        const current=Number.isFinite(template.planner_estimated_minutes)?template.planner_estimated_minutes:null;
        if(current!==null && Math.abs(median-current)<minDelta){
          return {ok:false,reason:'DELTA_BELOW_THRESHOLD',current_planner_estimated_minutes:current,median_actual_minutes:median,delta_minutes:median-current};
        }
        const existing=s.adaptive_estimate_proposals.find(x=>x.template_id===id&&x.status==='PENDING');
        if(existing)return {ok:true,reused:true,proposal:{...existing}};
        const proposal={
          proposal_id:makeId('estimate'),
          template_id:id,
          current_planner_estimated_minutes:current,
          proposed_planner_estimated_minutes:median,
          delta_minutes:current===null?null:median-current,
          evidence:{sample_count:vals.length,median_actual_minutes:median,values:vals,authority:'OBSERVATION_ONLY',fact_revision:targetRevision},
          authority:'PLANNER_PROPOSAL_HUMAN_APPROVAL_REQUIRED',
          status:'PENDING',
          created_at:new Date().toISOString()
        };
        s.adaptive_estimate_proposals.push(proposal);
        s.adaptive_estimate_proposals=s.adaptive_estimate_proposals.slice(-200);
        return {ok:true,reused:false,proposal:{...proposal}};
      });
    }

    function decideEstimateAdjustment(proposalId,input={}){
      const id=cleanText(proposalId);
      if(!id)return {ok:false,reason:'PROPOSAL_ID_REQUIRED'};
      const decision=cleanText(input.decision).toUpperCase();
      if(!['CONFIRM','REJECT'].includes(decision))return {ok:false,reason:'INVALID_DECISION'};
      return mutate(s=>{
        const proposal=s.adaptive_estimate_proposals.find(x=>x.proposal_id===id);
        if(!proposal)return {ok:false,reason:'PROPOSAL_NOT_FOUND'};
        if(proposal.status!=='PENDING')return {ok:false,reason:'PROPOSAL_ALREADY_DECIDED',status:proposal.status};
        const template=s.homework_templates.find(x=>x.template_id===proposal.template_id);
        if(!template)return {ok:false,reason:'TEMPLATE_NOT_FOUND'};
        proposal.status=decision==='CONFIRM'?'CONFIRMED':'REJECTED';
        proposal.decision_actor=cleanText(input.actor)||'HUMAN_APPROVER';
        proposal.decision_role='HUMAN_APPROVER';
        proposal.decided_at=new Date().toISOString();
        proposal.decision_note=cleanText(input.note)||null;
        if(decision==='CONFIRM'){
          template.planner_estimated_minutes=proposal.proposed_planner_estimated_minutes;
          template.updated_at=new Date().toISOString();
          proposal.applied_planner_estimated_minutes=template.planner_estimated_minutes;
        }else{
          proposal.applied_planner_estimated_minutes=Number.isFinite(template.planner_estimated_minutes)?template.planner_estimated_minutes:null;
        }
        return {ok:true,proposal:{...proposal},template:{...template}};
      });
    }

    function pendingEstimateAdjustments(){
      return load().adaptive_estimate_proposals.filter(x=>x.status==='PENDING').map(x=>({...x}));
    }

    function planWeeklyReflow(input={}){
      const start=cleanText(input.start_date)||dateKey();
      const days=Number.isFinite(input.days)?Math.max(1,Math.min(14,Math.floor(input.days))):7;
      const dates=Array.from({length:days},(_,i)=>addDays(start,i));
      const windowsByDate=candidateWindowsByDate(dates);
      return mutate(s=>{
        const existingPending=s.weekly_reflow_runs.find(x=>x.status==='PENDING'&&x.start_date===start&&x.days===days);
        if(existingPending){clearReflowReview(s);return {ok:true,reused:true,run:{...existingPending}};}

        const templateById=new Map((s.homework_templates||[]).map(x=>[x.template_id,x]));
        const evidenceByDate=Object.fromEntries(dates.map(d=>[d,freeWindowEvidence(s,d,windowsByDate[d]||[])]));
        const protectedTodos=(s.dated_todos||[]).filter(t=>dates.includes(t.date)&&(
          t.state!=='PLANNED'||!/^PLANNER/.test(t.source||'')||!!t.active_session_id
        ));
        const movable=(s.dated_todos||[]).filter(t=>dates.includes(t.date)&&t.state==='PLANNED'&&/^PLANNER/.test(t.source||'')&&!t.active_session_id);

        const load=Object.fromEntries(dates.map(d=>[d,{minutes:0,semantic:0,count:0}]));
        for(const t of protectedTodos){
          const template=templateById.get(t.template_id);
          const est=Number.isFinite(t.estimated_minutes)?t.estimated_minutes:(Number.isFinite(template?.planner_estimated_minutes)?template.planner_estimated_minutes:null);
          if(est!==null)load[t.date].minutes+=est;
          load[t.date].semantic+=Number.isFinite(t.activity_load_score)?t.activity_load_score:(Number.isFinite(t.difficulty)?t.difficulty:3);
          load[t.date].count++;
        }

        const ordered=[...movable].sort((a,b)=>{
          const ta=templateById.get(a.template_id),tb=templateById.get(b.template_id);
          const ad=ta?.deadline_date||'9999-12-31',bd=tb?.deadline_date||'9999-12-31';
          if(ad!==bd)return ad.localeCompare(bd);
          const ac=Number(a.provenance?.carry_over_depth)||0,bc=Number(b.provenance?.carry_over_depth)||0;
          if(ac!==bc)return bc-ac;
          return (a.order??999)-(b.order??999)||String(a.label||'').localeCompare(String(b.label||''),'ko');
        });

        const moves=[];
        for(const todo of ordered){
          const template=templateById.get(todo.template_id);
          const deadline=cleanText(template?.deadline_date)||null;
          const est=Number.isFinite(todo.estimated_minutes)?todo.estimated_minutes:(Number.isFinite(template?.planner_estimated_minutes)?template.planner_estimated_minutes:null);
          const semantic=Number.isFinite(todo.activity_load_score)?todo.activity_load_score:(Number.isFinite(todo.difficulty)?todo.difficulty:3);
          let eligible=dates.filter(d=>!deadline||d<=deadline);
          if(todo.operating_rule==='ENGLISH_ACADEMY_MORNING_VOCAB_REVIEW'){
            const academyDates=eligible.filter(d=>scheduleCommitmentsForDate(d,s).some(isEnglishAcademyCommitment));
            if(academyDates.length)eligible=academyDates;
          }
          if(!eligible.length)continue;
          const anyKnown=eligible.some(d=>evidenceByDate[d]?.known);
          const ranked=eligible.map(d=>{
            const ev=evidenceByDate[d];
            const capacityPenalty=(anyKnown&&!ev.known)?100000:0;
            const overflow=(ev?.known&&est!==null)?Math.max(0,(load[d].minutes+est)-(ev.total_free_minutes||0)):0;
            const overflowPenalty=overflow*1000;
            const semanticPenalty=load[d].semantic*100;
            const countPenalty=load[d].count*10;
            const churnPenalty=d===todo.date?0:1;
            return {date:d,score:capacityPenalty+overflowPenalty+semanticPenalty+countPenalty+churnPenalty,ev};
          }).sort((a,b)=>a.score-b.score||a.date.localeCompare(b.date));
          const chosen=ranked[0]?.date||todo.date;
          if(est!==null)load[chosen].minutes+=est;
          load[chosen].semantic+=semantic;
          load[chosen].count++;
          if(chosen!==todo.date){
            moves.push({
              todo_id:todo.todo_id,
              label:todo.label,
              from_date:todo.date,
              to_date:chosen,
              template_id:todo.template_id||null,
              deadline_date:deadline,
              estimated_minutes:est,
              semantic_load:semantic,
              reason:evidenceByDate[chosen]?.known?'FREE_WINDOW_AND_LOAD_BALANCE':'SEMANTIC_LOAD_BALANCE'
            });
          }
        }

        const run={
          reflow_run_id:makeId('reflow'),
          start_date:start,
          days,
          status:'PENDING',
          authority:'PLANNER_PROPOSAL_HUMAN_APPROVAL_REQUIRED',
          movable_count:movable.length,
          protected_count:protectedTodos.length,
          moves,
          evidence_by_date:evidenceByDate,
          created_at:new Date().toISOString()
        };
        s.weekly_reflow_runs.push(run);
        s.weekly_reflow_runs=s.weekly_reflow_runs.slice(-50);
        clearReflowReview(s);
        return {ok:true,reused:false,run:{...run}};
      });
    }

    function decideWeeklyReflow(runId,input={}){
      const id=cleanText(runId);if(!id)return {ok:false,reason:'REFLOW_RUN_ID_REQUIRED'};
      const decision=cleanText(input.decision).toUpperCase();
      if(!['CONFIRM','REJECT'].includes(decision))return {ok:false,reason:'INVALID_DECISION'};
      return mutate(s=>{
        const run=s.weekly_reflow_runs.find(x=>x.reflow_run_id===id);
        if(!run)return {ok:false,reason:'REFLOW_RUN_NOT_FOUND'};
        if(run.status!=='PENDING')return {ok:false,reason:'REFLOW_ALREADY_DECIDED',status:run.status};
        run.status=decision==='CONFIRM'?'CONFIRMED':'REJECTED';
        run.decision_actor=cleanText(input.actor)||'PARENT';
        run.decided_at=new Date().toISOString();
        const applied=[],skipped=[];
        if(decision==='CONFIRM'){
          for(const move of run.moves||[]){
            const todo=s.dated_todos.find(x=>x.todo_id===move.todo_id);
            if(!todo||todo.state!=='PLANNED'||todo.active_session_id||todo.date!==move.from_date){
              skipped.push({todo_id:move.todo_id,reason:'TODO_CHANGED_SINCE_PROPOSAL'});
              continue;
            }
            todo.date=move.to_date;
            todo.reflow_run_id=run.reflow_run_id;
            todo.reflow_reason=move.reason;
            todo.updated_at=new Date().toISOString();
            applied.push({todo_id:todo.todo_id,from_date:move.from_date,to_date:move.to_date});
          }
        }
        run.applied=applied;
        run.skipped=skipped;
        return {ok:true,decision,status:run.status,applied,skipped,run:{...run}};
      });
    }

    function pendingWeeklyReflows(){
      return load().weekly_reflow_runs.filter(x=>x.status==='PENDING').map(x=>({...x}));
    }

    function recordTaskState(input={}){
      const todoId=cleanText(input.todo_id); if(!todoId) return null;
      const requested=cleanText(input.ready_state);
      const mapped=READY_TO_TODO[requested]||(TODO_STATES.has(requested)?requested:null); if(!mapped) return null;
      return mutate(s=>{
        const todo=s.dated_todos.find(x=>x.todo_id===todoId); if(!todo) return null;
        const sessionId=cleanText(input.session_id)||null;
        if(mapped==='IN_PROGRESS'){
          if(todo.state==='IN_PROGRESS'&&todo.active_session_id&&todo.active_session_id!==sessionId){
            return {ok:false,reason:'SESSION_OWNERSHIP_CONFLICT',todo_id:todoId,active_session_id:todo.active_session_id};
          }
          if(todo.state!=='PLANNED'&&todo.state!=='IN_PROGRESS'){
            return {ok:false,reason:'TODO_NOT_STARTABLE',todo_id:todoId,state:todo.state};
          }
          todo.state='IN_PROGRESS';
          todo.active_session_id=sessionId;
          todo.active_task_id=cleanText(input.task_id)||null;
          todo.started_at=todo.started_at||input.at||new Date().toISOString();
        }else{
          const ownership=rebuildPolicy?.validateSessionOwnership?.(todo,sessionId)||{ok:!(todo.active_session_id&&sessionId&&todo.active_session_id!==sessionId),reason:'SESSION_OWNERSHIP_CONFLICT',active_session_id:todo.active_session_id};
          if(!ownership.ok){
            return {ok:false,reason:ownership.reason||'SESSION_OWNERSHIP_CONFLICT',todo_id:todoId,active_session_id:ownership.active_session_id||todo.active_session_id};
          }
          todo.state=mapped;
          todo.active_session_id=null;
          todo.active_task_id=null;
        }
        todo.updated_at=new Date().toISOString();
        const eventKey=[input.session_id,input.task_id,todoId,mapped].map(cleanText).join('|');
        if(!s.progress_events.some(x=>x.event_key===eventKey)){
          s.progress_events.push({
            event_id:makeId('progress'),
            event_key:eventKey,
            todo_id:todoId,
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            template_id:todo.template_id||null,
            allocation_run_id:todo.allocation_run_id||null,
            fact_revision:Number(todo.fact_revision)||Number(todo.provenance?.fact_revision)||1,
            session_id:cleanText(input.session_id)||null,
            task_id:cleanText(input.task_id)||null,
            state:mapped,
            source:'READY_SESSION',
            at:input.at||new Date().toISOString()
          });
        }
        return {todo_id:todo.todo_id,state:todo.state};
      });
    }

    function sessionRuntimeStatus(sessionId){
      const id=cleanText(sessionId);
      if(!id)return {session_id:null,in_progress:[],linked:[]};
      const s=load();
      const linked=s.dated_todos.filter(x=>x.active_session_id===id);
      return {
        session_id:id,
        in_progress:linked.filter(x=>x.state==='IN_PROGRESS').map(x=>({...x})),
        linked:linked.map(x=>({...x}))
      };
    }

    function today(date=dateKey()){
      const s=load();
      return s.dated_todos
        .filter(x=>x.date===date&&isOpenTodo(x))
        .sort((a,b)=>(a.order??999)-(b.order??999)||a.label.localeCompare(b.label,'ko'));
    }

    function todayProjection(date=dateKey()){
      return today(date).map(x=>rebuildProjection?.todayItem?.(x)||({
        todo_id:x.todo_id,
        assignment_id:x.assignment_id||null,
        analysis_id:x.analysis_id||null,
        learning_unit_id:x.learning_unit_id||null,
        template_id:x.template_id||null,
        allocation_run_id:x.allocation_run_id||null,
        label:x.label,
        subject:x.subject||null,
        matched_domain:x.matched_domain||null,
        method_variant:x.method_variant||null,
        concept_skill_target:x.concept_skill_target||null,
        divisible_boundary:x.divisible_boundary||null,
        confidence:Number.isFinite(x.confidence)?x.confidence:null,
        unresolved_flags:Array.isArray(x.unresolved_flags)?[...x.unresolved_flags]:[],
        state:x.state,
        source:x.source,
        estimated_minutes:Number.isFinite(x.estimated_minutes)?x.estimated_minutes:null,
        activity_types:Array.isArray(x.activity_types)?x.activity_types:[],
        activity_sequence:Array.isArray(x.activity_sequence)?x.activity_sequence:[],
        cognitive_load_profile:Array.isArray(x.cognitive_load_profile)?x.cognitive_load_profile:[],
        activity_load_score:Number.isFinite(x.activity_load_score)?x.activity_load_score:null,
        difficulty:Number.isFinite(x.difficulty)?x.difficulty:null,
        recovery_need:x.recovery_need||null,
        review_policy:x.review_policy||null,
        parent_help_dependency:x.parent_help_dependency||null,
        planner_owned:/^PLANNER/.test(x.source||'')
      }));
    }

    function validate(){
      const s=load(),issues=[];
      const todoIds=new Set();
      for(const t of s.dated_todos){
        if(!t.todo_id||todoIds.has(t.todo_id))issues.push('DATED_TODO_ID_INVALID');
        todoIds.add(t.todo_id);
        if(!TODO_STATES.has(t.state))issues.push('DATED_TODO_STATE_INVALID');
      }
      for(const e of s.progress_events){
        if(e.todo_id&&!todoIds.has(e.todo_id))issues.push('ORPHAN_PROGRESS_EVENT');
      }
      for(const ae of s.availability_exceptions){if(!['SKIP','REPLACE'].includes(ae.type))issues.push('AVAILABILITY_EXCEPTION_TYPE_INVALID');}
      for(const e of s.schedule_exceptions){
        if(!['SKIP','REPLACE'].includes(e.type))issues.push('SCHEDULE_EXCEPTION_TYPE_INVALID');
      }
      for(const r of s.weekly_reflow_runs){
        if(!['PENDING','CONFIRMED','REJECTED'].includes(r.status))issues.push('WEEKLY_REFLOW_STATUS_INVALID');
      }
      for(const p of s.adaptive_estimate_proposals){
        if(!['PENDING','CONFIRMED','REJECTED'].includes(p.status))issues.push('ADAPTIVE_ESTIMATE_STATUS_INVALID');
        if(!s.homework_templates.some(x=>x.template_id===p.template_id))issues.push('ORPHAN_ADAPTIVE_ESTIMATE_PROPOSAL');
      }
      return {ok:issues.length===0,issues,schema_version:s.schema_version,storage_backend:s.storage_backend};
    }

    return {
      snapshot:()=>load(),
      validate,
      today,
      todayProjection,
      upsertScheduleCommitment,
      scheduleCommitmentsForDate,
      upsertScheduleException,
      removeScheduleException,
      upsertDailyAvailabilityWindow,
      upsertAvailabilityException,
      removeAvailabilityException,
      removeDailyAvailabilityWindow,
      candidateWindowsByDate,
      upsertHomeworkTemplate,
      upsertDatedTodo,
      linkTodayItems,
      linkOrCreateTodayItems,
      invalidateAssignmentOutputs,
      allocateLearningUnits,
      commitLearningAllocation,
      replanCarryOver,
      replanReadyCarryOvers,
      recordTaskState,
      sessionRuntimeStatus,
      allocateToday,
      commitAllocation,
      recordSessionOutcome,
      carryOverCandidates,
      resolveCarryOver,
      recentEstimateEvidence,
      crossRevisionLearningSignal,
      learningHistory,
      proposeEstimateAdjustment,
      decideEstimateAdjustment,
      pendingEstimateAdjustments,
      planWeeklyReflow,
      decideWeeklyReflow,
      pendingWeeklyReflows
    };
  }

  return {createPlanner,dateKey,SCHEMA_VERSION};
});
