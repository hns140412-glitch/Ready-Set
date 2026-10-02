(function(root,factory){
  const core=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=core;
  if(root&&root.localStorage){
    root.ReadySetPlanner=core.createPlanner(root.localStorage);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='readyset_planner_v1';
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

  const blank=()=>({
    schema_version:SCHEMA_VERSION,
    storage_backend:'LOCALSTORAGE_COMPATIBILITY_SCAFFOLD',
    schedule_periods:[],
    schedule_commitments:[],
    schedule_buffers:[],
    daily_availability_windows:[],
    homework_templates:[],
    dated_todos:[],
    progress_events:[],
    allocation_runs:[],
    execution_observations:[],
    carry_over_queue:[],
    adaptive_estimate_proposals:[]
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
      schedule_periods:Array.isArray(x.schedule_periods)?x.schedule_periods:[],
      schedule_commitments:Array.isArray(x.schedule_commitments)?x.schedule_commitments:[],
      schedule_buffers:Array.isArray(x.schedule_buffers)?x.schedule_buffers:[],
      daily_availability_windows:Array.isArray(x.daily_availability_windows)?x.daily_availability_windows:[],
      homework_templates:Array.isArray(x.homework_templates)?x.homework_templates:[],
      dated_todos:Array.isArray(x.dated_todos)?x.dated_todos:[],
      progress_events:Array.isArray(x.progress_events)?x.progress_events:[],
      allocation_runs:Array.isArray(x.allocation_runs)?x.allocation_runs:[],
      execution_observations:Array.isArray(x.execution_observations)?x.execution_observations:[],
      carry_over_queue:Array.isArray(x.carry_over_queue)?x.carry_over_queue:[],
      adaptive_estimate_proposals:Array.isArray(x.adaptive_estimate_proposals)?x.adaptive_estimate_proposals:[]
    };
  }

  function createPlanner(storage){
    const isOpenTodo=t=>t&&t.state!=='COMPLETED'&&t.state!=='SUPERSEDED';
    function load(){
      try{return normalize(JSON.parse(storage.getItem(STORAGE_KEY)||'null'))}catch{return blank()}
    }
    function save(s){const payload=JSON.stringify(normalize(s));storage.setItem(STORAGE_KEY,payload);globalThis.ReadySetLocalFirst?.capture?.('planner',payload).catch?.(()=>{})}
    function mutate(fn){const s=load();const out=fn(s);save(s);return out}

    function requireParentScheduleWrite(source=''){
      if(globalThis.ReadyFamilySession && (!source||cleanText(source)==='PARENT_ADMIN_UI')){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok) throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
    }
    function validDateString(value){return /^\d{4}-\d{2}-\d{2}$/.test(cleanText(value))}
    function activeSchedulePeriodFromState(state,date){
      const key=cleanText(date);
      if(!validDateString(key))return null;
      return [...(state.schedule_periods||[])]
        .filter(x=>x&&x.enabled!==false&&validDateString(x.valid_from)&&validDateString(x.valid_until)&&x.valid_from<=key&&key<=x.valid_until)
        .sort((a,b)=>(Number(b.priority)||100)-(Number(a.priority)||100)||String(b.updated_at||'').localeCompare(String(a.updated_at||'')))[0]||null;
    }
    function activeSchedulePeriod(date=dateKey()){
      const item=activeSchedulePeriodFromState(load(),date);
      return item?{...item}:null;
    }
    function rangesOverlap(aStart,aEnd,bStart,bEnd){
      return !!(aStart&&aEnd&&bStart&&bEnd&&aStart<=bEnd&&bStart<=aEnd);
    }
    function timesOverlap(aStart,aEnd,bStart,bEnd){
      return !!(aStart&&aEnd&&bStart&&bEnd&&aStart<bEnd&&bStart<aEnd);
    }
    function periodConflictPreviewFromState(state,input={}){
      const periodId=cleanText(input.period_id)||null;
      const validFrom=cleanText(input.valid_from),validUntil=cleanText(input.valid_until);
      if(!validDateString(validFrom)||!validDateString(validUntil)||validUntil<validFrom)
        return {ok:false,reason:'INVALID_PERIOD_RANGE',conflicts:[]};
      const conflicts=(state.schedule_periods||[])
        .filter(x=>x&&x.enabled!==false&&x.period_id!==periodId&&validDateString(x.valid_from)&&validDateString(x.valid_until))
        .filter(x=>rangesOverlap(validFrom,validUntil,x.valid_from,x.valid_until))
        .map(x=>({
          type:'PERIOD_OVERLAP',
          period_id:x.period_id,
          name:x.name,
          valid_from:x.valid_from,
          valid_until:x.valid_until,
          message:`${x.name} ${x.valid_from}~${x.valid_until}와 기간이 겹칩니다.`
        }));
      return {ok:true,requires_acknowledgement:conflicts.length>0,conflicts};
    }
    function scheduleConflictPreviewFromState(state,input={}){
      const commitmentId=cleanText(input.commitment_id)||null;
      const recurrence=cleanText(input.recurrence).toUpperCase();
      const weekly=recurrence==='WEEKLY';
      const periodId=cleanText(input.period_id)||null;
      const weekday=Number.isInteger(input.weekday)?input.weekday:Number(input.weekday);
      const start=weekly?cleanText(input.start):String(input.start_at||'').slice(11,16);
      const end=weekly?cleanText(input.end):String(input.end_at||'').slice(11,16);
      const date=weekly?null:String(input.start_at||'').slice(0,10);
      const conflicts=[];
      const pushConflict=(x,materializedDate=null,type='COMMITMENT_OVERLAP')=>{
        if(!x||x.commitment_id===commitmentId)return;
        conflicts.push({
          type,
          commitment_id:x.commitment_id,
          title:x.title,
          date:materializedDate||String(x.start_at||'').slice(0,10)||null,
          weekday:Number.isFinite(Number(x.weekday))?Number(x.weekday):null,
          start:x.start||String(x.start_at||'').slice(11,16)||null,
          end:x.end||String(x.end_at||'').slice(11,16)||null,
          message:`${x.title} ${x.start||String(x.start_at||'').slice(11,16)}~${x.end||String(x.end_at||'').slice(11,16)}와 시간이 겹칩니다.`
        });
      };
      if(weekly){
        for(const x of state.schedule_commitments||[]){
          if(!x||x.confirmed===false||x.commitment_id===commitmentId)continue;
          if(cleanText(x.recurrence).toUpperCase()==='WEEKLY'){
            const sameScope=(cleanText(x.period_id)||null)===periodId;
            if(sameScope&&Number(x.weekday)===weekday&&timesOverlap(start,end,x.start,x.end))pushConflict(x);
            continue;
          }
          const xDate=String(x.start_at||'').slice(0,10);
          if(!validDateString(xDate)||parseLocal(xDate,'12:00').getDay()!==weekday)continue;
          if(periodId){
            const period=(state.schedule_periods||[]).find(p=>p.period_id===periodId);
            if(!period||xDate<period.valid_from||xDate>period.valid_until||activeSchedulePeriodFromState(state,xDate)?.period_id!==periodId)continue;
          }else{
            if(activeSchedulePeriodFromState(state,xDate))continue;
            const validFrom=cleanText(input.valid_from),validUntil=cleanText(input.valid_until);
            if(validFrom&&xDate<validFrom)continue;
            if(validUntil&&xDate>validUntil)continue;
          }
          if(timesOverlap(start,end,String(x.start_at).slice(11,16),String(x.end_at).slice(11,16)))pushConflict(x,xDate);
        }
      }else if(validDateString(date)){
        for(const x of scheduleCommitmentsByDateFromState(state,date)){
          if(x.commitment_id===commitmentId)continue;
          if(timesOverlap(start,end,String(x.start_at).slice(11,16),String(x.end_at).slice(11,16)))pushConflict(x,date);
        }
        for(const b of scheduleBuffersByDateFromState(state,date)){
          const bStart=String(b.start_at||'').slice(11,16),bEnd=String(b.end_at||'').slice(11,16);
          if(timesOverlap(start,end,bStart,bEnd)){
            conflicts.push({
              type:'LIFE_BUFFER_OVERLAP',
              buffer_id:b.buffer_id,
              title:b.title,
              kind:b.kind,
              date,
              start:bStart,
              end:bEnd,
              message:`${b.title} ${bStart}~${bEnd} 생활시간과 겹칩니다.`
            });
          }
        }
      }
      const unique=[];
      const seen=new Set();
      for(const x of conflicts){
        const key=[x.type,x.commitment_id||x.buffer_id||'',x.date||'',x.start||'',x.end||''].join('|');
        if(!seen.has(key)){seen.add(key);unique.push(x)}
      }
      return {ok:true,requires_acknowledgement:unique.length>0,conflicts:unique};
    }
    function previewSchedulePeriod(input={}){return periodConflictPreviewFromState(load(),input)}
    function previewScheduleCommitment(input={}){return scheduleConflictPreviewFromState(load(),input)}
    function upsertSchedulePeriod(input={}){
      requireParentScheduleWrite(input.source);
      const name=cleanText(input.name)||cleanText(input.label);
      const validFrom=cleanText(input.valid_from),validUntil=cleanText(input.valid_until);
      if(!name)throw new Error('period name required');
      if(!validDateString(validFrom)||!validDateString(validUntil)||validUntil<validFrom)throw new Error('valid period range required');
      if(cleanText(input.source)==='PARENT_ADMIN_UI'&&!input.conflict_acknowledged){
        const review=periodConflictPreviewFromState(load(),input);
        if(review.requires_acknowledgement)return {ok:false,reason:'PERIOD_CONFLICT_REVIEW_REQUIRED',conflicts:review.conflicts};
      }
      return mutate(s=>{
        const id=cleanText(input.period_id)||makeId('period');
        const existing=s.schedule_periods.find(x=>x.period_id===id);
        const item={
          period_id:id,
          name,
          valid_from:validFrom,
          valid_until:validUntil,
          priority:Number.isFinite(input.priority)?Number(input.priority):(existing?Number(existing.priority)||100:((s.schedule_periods||[]).reduce((max,p)=>Math.max(max,Number(p.priority)||100),99)+1)),
          enabled:input.enabled!==false,
          parent_editable:input.parent_editable!==false,
          source:cleanText(input.source)||existing?.source||'READY_LOCAL',
          created_at:existing?.created_at||new Date().toISOString(),
          updated_at:new Date().toISOString()
        };
        const i=s.schedule_periods.findIndex(x=>x.period_id===id);
        if(i>=0)s.schedule_periods[i]=item;else s.schedule_periods.push(item);
        return item;
      });
    }
    function removeSchedulePeriod(id){
      requireParentScheduleWrite();
      const target=cleanText(id);if(!target)return {ok:false,reason:'PERIOD_ID_REQUIRED'};
      return mutate(s=>{
        const before=s.schedule_periods.length;
        s.schedule_periods=s.schedule_periods.filter(x=>x.period_id!==target);
        if(before===s.schedule_periods.length)return {ok:false,reason:'PERIOD_NOT_FOUND'};
        const removedCommitmentIds=new Set(s.schedule_commitments.filter(x=>x.period_id===target).map(x=>x.commitment_id));
        const linked=removedCommitmentIds.size;
        s.schedule_commitments=s.schedule_commitments.filter(x=>x.period_id!==target);
        const beforeBuffers=s.schedule_buffers.length;
        s.schedule_buffers=s.schedule_buffers.filter(x=>x.period_id!==target&&!removedCommitmentIds.has(x.linked_commitment_id));
        return {ok:true,period_id:target,removed_commitments:linked,removed_buffers:beforeBuffers-s.schedule_buffers.length};
      });
    }
    function scheduleCommitmentsByDateFromState(state,date){
      const key=cleanText(date);
      if(!validDateString(key))return [];
      const dow=parseLocal(key,'12:00').getDay();
      const activePeriod=activeSchedulePeriodFromState(state,key);
      return (state.schedule_commitments||[])
        .filter(x=>x&&x.confirmed!==false)
        .filter(x=>{
          if(cleanText(x.recurrence).toUpperCase()==='WEEKLY'){
            if(Number(x.weekday)!==dow)return false;
            if(x.period_id)return activePeriod?.period_id===x.period_id;
            if(activePeriod)return false;
            if(x.valid_from&&key<x.valid_from)return false;
            if(x.valid_until&&key>x.valid_until)return false;
            return true;
          }
          return x.start_at&&x.end_at&&String(x.start_at).slice(0,10)===key&&String(x.end_at).slice(0,10)===key;
        })
        .map(x=>cleanText(x.recurrence).toUpperCase()==='WEEKLY'?{
          ...x,
          materialized_date:key,
          start_at:`${key}T${x.start}:00`,
          end_at:`${key}T${x.end}:00`,
          active_period_id:activePeriod?.period_id||null,
          active_period_name:activePeriod?.name||null
        }:{...x,materialized_date:key})
        .sort((a,b)=>String(a.start_at||'').localeCompare(String(b.start_at||''))||String(a.title||'').localeCompare(String(b.title||''),'ko'));
    }
    function scheduleCommitmentsByDate(date=dateKey()){
      return scheduleCommitmentsByDateFromState(load(),date).map(x=>({...x}));
    }

    function upsertScheduleCommitment(input={}){
      requireParentScheduleWrite(input.source);
      const title=cleanText(input.title); if(!title) throw new Error('title required');
      const recurrence=cleanText(input.recurrence).toUpperCase();
      const weekly=recurrence==='WEEKLY';
      const weekday=Number.isInteger(input.weekday)?input.weekday:Number(input.weekday);
      const startTime=cleanText(input.start),endTime=cleanText(input.end);
      const periodId=cleanText(input.period_id)||null;
      if(weekly&&!(weekday>=0&&weekday<=6))throw new Error('weekday required');
      if(weekly&&(!/^\d{2}:\d{2}$/.test(startTime)||!/^\d{2}:\d{2}$/.test(endTime)||endTime<=startTime))throw new Error('valid start/end required');
      if(!weekly){
        const startAt=String(input.start_at||''),endAt=String(input.end_at||'');
        if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startAt)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(endAt)||endAt<=startAt)throw new Error('valid start/end required');
      }
      if(cleanText(input.source)==='PARENT_ADMIN_UI'&&!input.conflict_acknowledged){
        const review=scheduleConflictPreviewFromState(load(),input);
        if(review.requires_acknowledgement)return {ok:false,reason:'SCHEDULE_CONFLICT_REVIEW_REQUIRED',conflicts:review.conflicts};
      }
      return mutate(s=>{
        if(weekly&&periodId&&!s.schedule_periods.some(x=>x.period_id===periodId))throw new Error('schedule period not found');
        const id=cleanText(input.commitment_id)||makeId('commitment');
        const existing=s.schedule_commitments.find(x=>x.commitment_id===id);
        const item={
          commitment_id:id,
          title,
          category:cleanText(input.category)||existing?.category||'OTHER',
          start_at:weekly?null:(input.start_at||existing?.start_at||null),
          end_at:weekly?null:(input.end_at||existing?.end_at||null),
          recurrence:weekly?'WEEKLY':null,
          weekday:weekly?weekday:null,
          start:weekly?startTime:null,
          end:weekly?endTime:null,
          period_id:weekly?periodId:null,
          valid_from:weekly&&!periodId?(cleanText(input.valid_from)||null):null,
          valid_until:weekly&&!periodId?(cleanText(input.valid_until)||null):null,
          confirmed:input.confirmed!==false,
          planner_movable:!!input.planner_movable,
          parent_editable:input.parent_editable!==false,
          source:cleanText(input.source)||existing?.source||'READY_LOCAL',
          created_at:existing?.created_at||new Date().toISOString(),
          updated_at:new Date().toISOString()
        };
        const i=s.schedule_commitments.findIndex(x=>x.commitment_id===id);
        if(i>=0)s.schedule_commitments[i]=item;else s.schedule_commitments.push(item);
        return item;
      });
    }
    function removeScheduleCommitment(id){
      requireParentScheduleWrite();
      const target=cleanText(id);if(!target)return {ok:false,reason:'COMMITMENT_ID_REQUIRED'};
      return mutate(s=>{
        const before=s.schedule_commitments.length;
        s.schedule_commitments=s.schedule_commitments.filter(x=>x.commitment_id!==target);
        if(before===s.schedule_commitments.length)return {ok:false,reason:'COMMITMENT_NOT_FOUND'};
        const beforeBuffers=s.schedule_buffers.length;
        s.schedule_buffers=s.schedule_buffers.filter(x=>x.linked_commitment_id!==target);
        return {ok:true,commitment_id:target,removed_buffers:beforeBuffers-s.schedule_buffers.length};
      });
    }

    const BUFFER_KINDS=new Set(['TRAVEL','MEAL','PREPARATION','REST','SAFETY','OTHER']);
    function upsertScheduleBuffer(input={}){
      requireParentScheduleWrite(input.source);
      const kind=cleanText(input.kind).toUpperCase()||'OTHER';
      if(!BUFFER_KINDS.has(kind))throw new Error('invalid buffer kind');
      const mode=cleanText(input.mode).toUpperCase()==='AROUND_COMMITMENT'?'AROUND_COMMITMENT':'ABSOLUTE';
      const recurrence=cleanText(input.recurrence).toUpperCase();
      const weekly=recurrence==='WEEKLY';
      const title=cleanText(input.title)||kind;
      const periodId=cleanText(input.period_id)||null;
      const weekday=Number.isInteger(input.weekday)?input.weekday:Number(input.weekday);
      const side=cleanText(input.side).toUpperCase();
      const minutesValue=Math.max(0,Math.floor(Number(input.minutes)||0));
      const date=cleanText(input.date),start=cleanText(input.start),end=cleanText(input.end);
      const linkedCommitmentId=cleanText(input.linked_commitment_id)||null;
      if(mode==='AROUND_COMMITMENT'){
        if(!linkedCommitmentId)throw new Error('linked commitment required');
        if(!['BEFORE','AFTER'].includes(side))throw new Error('buffer side required');
        if(minutesValue<=0)throw new Error('buffer minutes required');
      }else{
        if(weekly&&!(weekday>=0&&weekday<=6))throw new Error('weekday required');
        if(!weekly&&!validDateString(date))throw new Error('date required');
        if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||end<=start)throw new Error('valid start/end required');
      }
      return mutate(s=>{
        if(mode==='AROUND_COMMITMENT'&&!s.schedule_commitments.some(x=>x.commitment_id===linkedCommitmentId))throw new Error('linked commitment not found');
        if(mode==='ABSOLUTE'&&weekly&&periodId&&!s.schedule_periods.some(x=>x.period_id===periodId))throw new Error('schedule period not found');
        const id=cleanText(input.buffer_id)||makeId('buffer');
        const existing=s.schedule_buffers.find(x=>x.buffer_id===id);
        const item={
          buffer_id:id,
          kind,
          title,
          mode,
          linked_commitment_id:mode==='AROUND_COMMITMENT'?linkedCommitmentId:null,
          side:mode==='AROUND_COMMITMENT'?side:null,
          minutes:mode==='AROUND_COMMITMENT'?minutesValue:null,
          recurrence:mode==='ABSOLUTE'&&weekly?'WEEKLY':null,
          weekday:mode==='ABSOLUTE'&&weekly?weekday:null,
          start:mode==='ABSOLUTE'?start:null,
          end:mode==='ABSOLUTE'?end:null,
          date:mode==='ABSOLUTE'&&!weekly?date:null,
          period_id:mode==='ABSOLUTE'&&weekly?periodId:null,
          valid_from:mode==='ABSOLUTE'&&weekly&&!periodId?(cleanText(input.valid_from)||null):null,
          valid_until:mode==='ABSOLUTE'&&weekly&&!periodId?(cleanText(input.valid_until)||null):null,
          confirmed:input.confirmed!==false,
          parent_editable:input.parent_editable!==false,
          source:cleanText(input.source)||existing?.source||'READY_LOCAL',
          created_at:existing?.created_at||new Date().toISOString(),
          updated_at:new Date().toISOString()
        };
        const i=s.schedule_buffers.findIndex(x=>x.buffer_id===id);
        if(i>=0)s.schedule_buffers[i]=item;else s.schedule_buffers.push(item);
        return item;
      });
    }
    function removeScheduleBuffer(id){
      requireParentScheduleWrite();
      const target=cleanText(id);if(!target)return {ok:false,reason:'BUFFER_ID_REQUIRED'};
      return mutate(s=>{
        const before=s.schedule_buffers.length;
        s.schedule_buffers=s.schedule_buffers.filter(x=>x.buffer_id!==target);
        return before===s.schedule_buffers.length?{ok:false,reason:'BUFFER_NOT_FOUND'}:{ok:true,buffer_id:target};
      });
    }
    function scheduleBuffersByDateFromState(state,date){
      const key=cleanText(date);
      if(!validDateString(key))return [];
      const dow=parseLocal(key,'12:00').getDay();
      const activePeriod=activeSchedulePeriodFromState(state,key);
      const commitments=scheduleCommitmentsByDateFromState(state,key);
      const byId=new Map(commitments.map(x=>[x.commitment_id,x]));
      return (state.schedule_buffers||[])
        .filter(x=>x&&x.confirmed!==false)
        .flatMap(x=>{
          if(x.mode==='AROUND_COMMITMENT'){
            const linked=byId.get(x.linked_commitment_id);if(!linked)return [];
            const linkedStart=parseLocal(key,String(linked.start_at).slice(11,16));
            const linkedEnd=parseLocal(key,String(linked.end_at).slice(11,16));
            const duration=Math.max(0,Number(x.minutes)||0)*60000;
            if(!duration)return [];
            const start=x.side==='BEFORE'?new Date(linkedStart-duration):linkedEnd;
            const end=x.side==='BEFORE'?linkedStart:new Date(linkedEnd.getTime()+duration);
            return [{...x,materialized_date:key,start_at:start.toISOString(),end_at:end.toISOString(),linked_title:linked.title}];
          }
          if(x.recurrence==='WEEKLY'){
            if(Number(x.weekday)!==dow)return [];
            if(x.period_id&&activePeriod?.period_id!==x.period_id)return [];
            if(!x.period_id&&activePeriod)return [];
            if(x.valid_from&&key<x.valid_from)return [];
            if(x.valid_until&&key>x.valid_until)return [];
            return [{...x,materialized_date:key,start_at:`${key}T${x.start}:00`,end_at:`${key}T${x.end}:00`,active_period_id:activePeriod?.period_id||null,active_period_name:activePeriod?.name||null}];
          }
          if(x.date!==key)return [];
          return [{...x,materialized_date:key,start_at:`${key}T${x.start}:00`,end_at:`${key}T${x.end}:00`}];
        })
        .sort((a,b)=>String(a.start_at||'').localeCompare(String(b.start_at||''))||String(a.title||'').localeCompare(String(b.title||''),'ko'));
    }
    function scheduleBuffersByDate(date=dateKey()){
      return scheduleBuffersByDateFromState(load(),date).map(x=>({...x}));
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
      return mutate(s=>{
        const id=cleanText(input.availability_id)||makeId('availability');
        const item={
          availability_id:id,date:recurrence==='WEEKLY'?null:date,start,end,
          recurrence:recurrence==='WEEKLY'?'WEEKLY':null,
          weekday:recurrence==='WEEKLY'?weekday:null,
          valid_from:cleanText(input.valid_from)||null,
          valid_until:cleanText(input.valid_until)||null,
          confirmed:input.confirmed!==false,
          source:cleanText(input.source)||'READY_LOCAL',
          parent_editable:input.parent_editable!==false,
          updated_at:new Date().toISOString()
        };
        const i=s.daily_availability_windows.findIndex(x=>x.availability_id===id);
        if(i>=0)s.daily_availability_windows[i]=item;else s.daily_availability_windows.push(item);
        return item;
      });
    }

    function removeDailyAvailabilityWindow(id){
      const target=cleanText(id); if(!target)return {ok:false,reason:'AVAILABILITY_ID_REQUIRED'};
      if(globalThis.ReadyFamilySession){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok) throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
      return mutate(s=>{
        const before=s.daily_availability_windows.length;
        s.daily_availability_windows=s.daily_availability_windows.filter(x=>x.availability_id!==target);
        return before===s.daily_availability_windows.length?{ok:false,reason:'AVAILABILITY_NOT_FOUND'}:{ok:true,availability_id:target};
      });
    }

    function candidateWindowsByDate(dates=[]){
      const s=load(),out={};
      for(const date of dates||[]){
        const dow=parseLocal(date,'12:00').getDay();
        out[date]=(s.daily_availability_windows||[])
          .filter(x=>x.confirmed!==false)
          .filter(x=>{
            if(x.recurrence==='WEEKLY'){
              if(Number(x.weekday)!==dow)return false;
              if(x.valid_from&&date<x.valid_from)return false;
              if(x.valid_until&&date>x.valid_until)return false;
              return true;
            }
            return x.date===date;
          })
          .sort((a,b)=>String(a.start).localeCompare(String(b.start)))
          .map(x=>x.recurrence==='WEEKLY'
            ? {start:x.start,end:x.end,availability_id:x.availability_id,source:x.source,recurrence:'WEEKLY',weekday:Number(x.weekday)}
            : {start:x.start,end:x.end,availability_id:x.availability_id,source:x.source});
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
          ...(Array.isArray(input.activity_types)?{activity_types:[...input.activity_types]}:{}),
          ...(Array.isArray(input.activity_sequence)?{activity_sequence:[...input.activity_sequence]}:{}),
          small_task:input.small_task===true,
          required_today:input.required_today===true,
          ...(input.review_policy&&typeof input.review_policy==='object'?
            {review_policy:structuredClone(input.review_policy)}:{}),
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

    // The existing Planner compatibility store is shared. A new central
    // child-scoped checkpoint must be invisible and unroutable unless the
    // independently authenticated central host supplies the active scope.
    // Legacy carry-over rows predate explicit central_scope metadata. Resolve
    // their ownership against the original Planner TODO rather than exposing
    // a formerly child-scoped item when a stored projection is upgraded.
    function centralCarryScope(carry,s){
      const source=s.dated_todos.find(t=>t.todo_id===carry?.source_todo_id);
      if(carry?.source_todo_source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT'&&
         source?.source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT')return null;
      return {family_id:carry?.central_scope?.family_id||source?.provenance?.family_id||null,
        member_id:carry?.central_scope?.member_id||source?.provenance?.member_id||null};
    }
    function visibleToCentralScope(todo,scope){
      if(todo?.source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT')return true;
      return scope?.authenticated===true&&
        cleanText(scope.family_id)===cleanText(todo.provenance?.family_id)&&
        cleanText(scope.selected_member_id)===cleanText(todo.provenance?.member_id)&&
        !!cleanText(todo.provenance?.family_id)&&
        !!cleanText(todo.provenance?.member_id);
    }
    function linkTodayItems(todoIds=[],options={}){
      const date=cleanText(options.date)||dateKey();
      const orderedIds=[...new Set((todoIds||[]).map(cleanText).filter(Boolean))];
      const allowedStates=new Set(Array.isArray(options.allowed_states)&&options.allowed_states.length?options.allowed_states:['PLANNED']);
      const rows=load().dated_todos.filter(x=>x.date===date&&allowedStates.has(x.state)&&
        visibleToCentralScope(x,options.central_scope));
      const byId=new Map(rows.map(x=>[x.todo_id,x]));
      return orderedIds.map(id=>byId.get(id)).filter(Boolean).map((x,childSelectionIndex)=>({
        todo_id:x.todo_id,label:x.label,date:x.date,source:x.source,
        assignment_id:x.assignment_id,analysis_id:x.analysis_id,learning_unit_id:x.learning_unit_id,
        template_id:x.template_id,allocation_run_id:x.allocation_run_id,
        estimated_minutes:Number.isFinite(x.estimated_minutes)?x.estimated_minutes:null,
        activity_types:Array.isArray(x.activity_types)?x.activity_types:[],
        activity_sequence:Array.isArray(x.activity_sequence)?x.activity_sequence:[],
        cognitive_load_profile:Array.isArray(x.cognitive_load_profile)?x.cognitive_load_profile:[],
        activity_load_score:Number.isFinite(x.activity_load_score)?x.activity_load_score:null,
        difficulty:Number.isFinite(x.difficulty)?x.difficulty:null,
        recovery_need:x.recovery_need||null,
        review_policy:x.review_policy||null,
        parent_help_dependency:x.parent_help_dependency||null,
        small_task:x.small_task===true,
        required_today:x.required_today===true,
        child_selection_order:childSelectionIndex+1
      }));
    }
    function linkOrCreateTodayItems(values=[],options={}){
      const s=load(),date=cleanText(options.date)||dateKey();
      const ids=(values||[]).map(v=>typeof v==='object'?v.todo_id:v).filter(v=>s.dated_todos.some(x=>x.todo_id===v));
      return linkTodayItems(ids,{...options,date});
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
        const scheduleByDate=Object.fromEntries(dates.map(d=>[d,scheduleCommitmentsByDateFromState(s,d)]));
        const bufferByDate=Object.fromEntries(dates.map(d=>[d,scheduleBuffersByDateFromState(s,d)]));
        const proposals=[];
        for(const unit of units){
          const existing=s.dated_todos.find(t=>t.learning_unit_id===unit.learning_unit_id&&isOpenTodo(t));
          if(existing){proposals.push({decision:'REUSE',date:existing.date,todo_id:existing.todo_id,learning_unit_id:unit.learning_unit_id});continue}
          const tags=unit.cognitive_load_profile||[];
          const unitLoad=unit.activity_load||{};
          const unitScore=Number.isFinite(unitLoad.score)?unitLoad.score:3;
          const unitDifficulty=Number.isFinite(unitLoad.difficulty)?unitLoad.difficulty:3;
          const unitRecovery=unitLoad.recovery_need||'MEDIUM';
          const date=[...dates].sort((a,b)=>{
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
              const buffers=bufferByDate[d]||[];
              const commitmentMinutes=commitments.reduce((sum,x)=>{
                const start=parseLocal(d,String(x.start_at).slice(11,16));
                const end=parseLocal(d,String(x.end_at).slice(11,16));
                return sum+Math.max(0,minutes(end-start));
              },0);
              const bufferMinutes=buffers.reduce((sum,x)=>{
                const start=new Date(x.start_at),end=new Date(x.end_at);
                return sum+Math.max(0,minutes(end-start));
              },0);
              const existingLoad=taskLoads.reduce((sum,x)=>sum+(x.score||3),0);
              const overlap=taskLoads.reduce((sum,x)=>sum+(x.tags||[]).filter(tag=>tags.includes(tag)).length,0);
              const highLoadStack=taskLoads.filter(x=>(x.score||3)>=4).length;
              const highDifficultyStack=taskLoads.filter(x=>(x.difficulty||3)>=4).length;
              const recoveryStack=taskLoads.filter(x=>x.recovery_need==='HIGH').length;
              const schedulePressure=commitments.length*15+buffers.length*6+Math.min(40,Math.floor((commitmentMinutes+bufferMinutes)/30));
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
          const templateId=`template_${unit.learning_unit_id}`;
          const factRevision=Number(fact.fact_revision)||1;
          const template={template_id:templateId,title:`${unit.subject} · ${unit.source_range||unit.concept_skill_target}`,subject:unit.subject,assignment_cycle:fact.assignment_cycle,learning_units:[unit.learning_unit_id],provenance:{kind:'LEARNING_MASTER_OUTPUT',assignment_id:assignmentId,analysis_id:analysis.analysis_id,fact_revision:factRevision},confirmation_state:'CONFIRMED',deadline_date:fact.deadline_boundary||null,estimated_minutes:null,planner_estimated_minutes:null,allocation_priority:100,required_today:false,preferred_days:[],updated_at:new Date().toISOString()};
          const ti=s.homework_templates.findIndex(x=>x.template_id===templateId);if(ti>=0)s.homework_templates[ti]=template;else s.homework_templates.push(template);
          proposals.push({
            decision:'PROPOSE',date,label:template.title,subject:unit.subject,assignment_id:assignmentId,analysis_id:analysis.analysis_id,
            fact_revision:Number(fact.fact_revision)||1,
            learning_unit_id:unit.learning_unit_id,template_id:templateId,
            activity_types:unit.activity_types,
            activity_sequence:unit.activity_sequence||[],
            cognitive_load_profile:unit.cognitive_load_profile,
            activity_load_score:unitScore,
            difficulty:unitDifficulty,
            recovery_need:unitRecovery,
            review_policy:unit.review_policy||'RESULT_DEPENDENT',
            parent_help_dependency:unit.parent_help_dependency||'UNRESOLVED',
            prerequisite:unit.prerequisite,
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
            cognitive_load_profile:p.cognitive_load_profile,
            activity_load_score:p.activity_load_score,difficulty:p.difficulty,recovery_need:p.recovery_need,
            free_window_evidence:p.free_window_evidence||null,
            review_policy:p.review_policy,parent_help_dependency:p.parent_help_dependency,
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
        if(source.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT')
          return {ok:false,reason:'CENTRAL_CHECKPOINT_REQUIRES_FRESH_LEARNING_DECISION'};
        const nextDepth=Math.max(0,Number(source.provenance?.carry_over_depth)||0)+1;
        const template=s.homework_templates.find(x=>x.template_id===source.template_id)||null;
        const deadline=cleanText(template?.deadline_date)||null;
        const deadlineExceeded=deadline&&date>deadline;
        const nearDeadline=deadline&&date>=addDays(deadline,-1);
        const maxAutoDepth=Math.max(1,Number(input.max_auto_depth)||3);
        if(deadlineExceeded||nextDepth>maxAutoDepth||(nearDeadline&&nextDepth>=maxAutoDepth)){
          carry.resolution_required=true;
          carry.allocation_ready=false;
          carry.escalation_reason=deadlineExceeded?'DEADLINE_EXCEEDED':nearDeadline?'REPEATED_CARRY_NEAR_DEADLINE':'REPEATED_CARRY_LIMIT';
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
      return scheduleCommitmentsByDateFromState(state,date)
        .map(x=>({
          start:parseLocal(date,String(x.start_at).slice(11,16)),
          end:parseLocal(date,String(x.end_at).slice(11,16)),
          commitment_id:x.commitment_id,
          title:x.title,
          source_kind:'COMMITMENT'
        }))
        .filter(x=>x.end>x.start);
    }
    function bufferIntervals(state,date){
      return scheduleBuffersByDateFromState(state,date)
        .map(x=>({
          start:new Date(x.start_at),
          end:new Date(x.end_at),
          buffer_id:x.buffer_id,
          kind:x.kind,
          title:x.title,
          linked_commitment_id:x.linked_commitment_id||null,
          source_kind:'BUFFER'
        }))
        .filter(x=>x.end>x.start);
    }
    function blockedIntervals(state,date){
      return [...commitmentIntervals(state,date),...bufferIntervals(state,date)].sort((a,b)=>a.start-b.start||a.end-b.end);
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
      if(!candidate.length)return {known:false,date,total_free_minutes:null,largest_contiguous_minutes:null,window_count:0,open_windows:[],commitment_count:0,buffer_count:0,buffers:[]};
      const commitments=commitmentIntervals(state,date);
      const buffers=bufferIntervals(state,date);
      const blocks=[...commitments,...buffers];
      const open=candidate.flatMap(w=>subtractIntervals(w,blocks));
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
        commitment_count:commitments.length,
        buffer_count:buffers.length,
        buffers:buffers.map(x=>({buffer_id:x.buffer_id,kind:x.kind,title:x.title,linked_commitment_id:x.linked_commitment_id,start:x.start.toISOString(),end:x.end.toISOString()})),
        open_windows:spans
      };
    }

    function freeWindowEvidenceForDate(date=dateKey()){
      const windows=candidateWindowsByDate([date])?.[date]||[];
      return freeWindowEvidence(load(),date,windows);
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
        const blocks=blockedIntervals(s,date);
        const open=candidateWindows.flatMap(w=>subtractIntervals(w,blocks));
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
              required_today:p.reason==='REQUIRED_TODAY',
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
      const mapped=READY_TO_TODO[readyState]||readyState;
      if(!TODO_STATES.has(mapped)) return {ok:false,reason:'INVALID_READY_STATE'};
      const actualMs=Number.isFinite(input.actual_ms)?Math.max(0,input.actual_ms):0;
      const actualMinutes=Math.round(actualMs/60000);
      return mutate(s=>{
        const todo=s.dated_todos.find(x=>x.todo_id===todoId);
        if(!todo)return {ok:false,reason:'TODO_NOT_FOUND'};
        const sessionId=cleanText(input.session_id)||null;
        if(todo.active_session_id&&sessionId&&todo.active_session_id!==sessionId){
          return {ok:false,reason:'SESSION_OWNERSHIP_CONFLICT',todo_id:todoId,active_session_id:todo.active_session_id};
        }
        // Ready's task-state event can already mark this exact task COMPLETED
        // before the final session-outcome recorder attaches elapsed time.
        // Allow that one same-session completion, not an unrelated replay.
        const sameCompletedEvent=todo.state==='COMPLETED'&&mapped==='COMPLETED'&&
          !!sessionId&&!!cleanText(input.task_id)&&s.progress_events.some(e=>
            e.todo_id===todoId&&e.session_id===sessionId&&
            e.task_id===cleanText(input.task_id)&&e.state==='COMPLETED'&&
            e.source==='READY_SESSION');
        if(todo.state!=='IN_PROGRESS'&&!sameCompletedEvent&&
          !['PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED'].includes(todo.state)){
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
            source:'READY_SESSION_OUTCOME',
            at:eventAt
          });
          s.progress_events=s.progress_events.slice(-500);
        }

        const carryEligible=['PARTIAL','DEFERRED'].includes(mapped);
        const carryNeedsResolution=['BLOCKED','WAITING_FOR_PARENT'].includes(mapped);
        const existing=s.carry_over_queue.find(x=>x.source_todo_id===todoId&&x.status==='OPEN');
        if((carryEligible||carryNeedsResolution)&&!existing){
          s.carry_over_queue.push({
            carry_over_id:makeId('carry'),
            source_todo_id:todoId,
            source_todo_source:todo.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT'?todo.source:null,
            central_scope:todo.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT'
              ?{family_id:todo.provenance?.family_id||null,member_id:todo.provenance?.member_id||null}:null,
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
            created_at:new Date().toISOString()
          });
        }
        if(mapped==='COMPLETED'){
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
        .filter(x=>!centralCarryScope(x,s))
        .filter(x=>x.status==='OPEN'&&x.allocation_ready===true&&x.resolution_required!==true)
        .filter(x=>cleanText(x.from_date)<date)
        .map(x=>x.carry_over_id);
      const results=[];
      for(const carryOverId of ids)results.push(replanCarryOver({carry_over_id:carryOverId,date}));
      return {ok:true,date,attempted:ids.length,results};
    }

    // A newly allocated, independently based central decision closes older
    // terminal checkpoint carry-over for that child/skill. It never redates
    // the previous task, creates a task or treats a self-report as proof.
    function reconcileCentralCheckpointCarries(input={}){
      const id=cleanText(input.new_todo_id);
      if(!id)return {ok:false,reason:'NEW_CENTRAL_TODO_REQUIRED'};
      return mutate(s=>{
        const next=s.dated_todos.find(x=>x.todo_id===id);
        if(next?.source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT'||
          !['PLANNED','IN_PROGRESS'].includes(next.state)||
          !cleanText(next.provenance?.family_id)||
          !cleanText(next.provenance?.member_id)||
          !cleanText(next.provenance?.subject)||
          !cleanText(next.provenance?.concept_skill_target))
          return {ok:false,reason:'VALID_NEW_CENTRAL_CHECKPOINT_REQUIRED'};
        const p=next.provenance;
        if(input.family_id!==p.family_id||input.member_id!==p.member_id||
          input.subject!==p.subject||input.concept_skill_target!==p.concept_skill_target)
          return {ok:false,reason:'CENTRAL_RECONCILIATION_SCOPE_MISMATCH'};
        const resolved=[];
        for(const carry of s.carry_over_queue){
          if(carry.status!=='OPEN'||carry.source_todo_id===id)continue;
          const scope=centralCarryScope(carry,s);
          if(!scope||scope.family_id!==p.family_id||scope.member_id!==p.member_id)continue;
          const previous=s.dated_todos.find(x=>x.todo_id===carry.source_todo_id);
          if(!previous||previous.source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT'||
            previous.provenance?.subject!==p.subject||
            previous.provenance?.concept_skill_target!==p.concept_skill_target||
            !['PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT'].includes(previous.state)||
            previous.provenance?.verified_receipt_id===p.verified_receipt_id&&
            previous.provenance?.observation_basis_digest_sha256===
              p.observation_basis_digest_sha256)
            continue;
          carry.status='RESOLVED';
          carry.resolution='SUPERSEDED_BY_FRESH_CENTRAL_DECISION';
          carry.rescheduled_todo_id=id;
          carry.resolved_at=new Date().toISOString();
          resolved.push(carry.carry_over_id);
        }
        return {ok:true,resolved};
      });
    }

    function carryOverCandidates(options={}){
      const s=load();
      return s.carry_over_queue.filter(x=>x.status==='OPEN')
        .filter(x=>{const bound=centralCarryScope(x,s);return !bound||
          visibleToCentralScope({source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
            provenance:bound},options.central_scope)})
        .map(x=>({...x}));
    }

    function resolveCarryOver(carryOverId,input={}){
      const id=cleanText(carryOverId); if(!id)return {ok:false,reason:'CARRY_OVER_ID_REQUIRED'};
      return mutate(s=>{
        const carry=s.carry_over_queue.find(x=>x.carry_over_id===id&&x.status==='OPEN');
        if(!carry)return {ok:false,reason:'CARRY_OVER_NOT_FOUND'};
        const resolution=cleanText(input.resolution)||'READY_FOR_REPLAN';
        const centralBound=centralCarryScope(carry,s);
        if(centralBound){
          if(!visibleToCentralScope({source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
            provenance:centralBound},input.central_scope))
            return {ok:false,reason:'CENTRAL_CARRY_OVER_MEMBER_SCOPE_REQUIRED'};
          if(resolution==='READY_FOR_REPLAN')
            return {ok:false,reason:'CENTRAL_CHECKPOINT_REQUIRES_FRESH_LEARNING_DECISION'};
        }
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
          if(todo.active_session_id&&sessionId&&todo.active_session_id!==sessionId){
            return {ok:false,reason:'SESSION_OWNERSHIP_CONFLICT',todo_id:todoId,active_session_id:todo.active_session_id};
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

    function today(date=dateKey(),options={}){
      const s=load();
      return s.dated_todos
        .filter(x=>x.date===date&&isOpenTodo(x)&&
          visibleToCentralScope(x,options.central_scope))
        .sort((a,b)=>(a.order??999)-(b.order??999)||a.label.localeCompare(b.label,'ko'));
    }

    function todayProjection(date=dateKey(),options={}){
      return today(date,options).map(x=>({
        todo_id:x.todo_id,
        assignment_id:x.assignment_id||null,
        analysis_id:x.analysis_id||null,
        learning_unit_id:x.learning_unit_id||null,
        template_id:x.template_id||null,
        allocation_run_id:x.allocation_run_id||null,
        label:x.label,
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
        small_task:x.small_task===true,
        required_today:x.required_today===true,
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
      previewSchedulePeriod,
      upsertSchedulePeriod,
      removeSchedulePeriod,
      activeSchedulePeriod,
      scheduleCommitmentsByDate,
      previewScheduleCommitment,
      upsertScheduleCommitment,
      removeScheduleCommitment,
      scheduleBuffersByDate,
      upsertScheduleBuffer,
      removeScheduleBuffer,
      upsertDailyAvailabilityWindow,
      removeDailyAvailabilityWindow,
      candidateWindowsByDate,
      freeWindowEvidenceForDate,
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
      reconcileCentralCheckpointCarries,
      resolveCarryOver,
      recentEstimateEvidence,
      crossRevisionLearningSignal,
      learningHistory,
      proposeEstimateAdjustment,
      decideEstimateAdjustment,
      pendingEstimateAdjustments
    };
  }

  return {createPlanner,dateKey,SCHEMA_VERSION};
});
