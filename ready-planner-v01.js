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
  const TODO_STATES=new Set(['PLANNED','IN_PROGRESS','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED']);
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
    schedule_commitments:[],
    homework_templates:[],
    dated_todos:[],
    progress_events:[],
    allocation_runs:[],
    execution_observations:[],
    carry_over_queue:[]
  });

  const cleanText=x=>String(x??'').trim();
  const dateKey=(d=new Date())=>{
    const x=d instanceof Date?d:new Date(d);
    const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),day=String(x.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const makeId=(prefix)=>`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  function normalize(raw){
    const x=raw&&typeof raw==='object'?raw:{};
    return {
      ...blank(),
      ...x,
      schema_version:SCHEMA_VERSION,
      schedule_commitments:Array.isArray(x.schedule_commitments)?x.schedule_commitments:[],
      homework_templates:Array.isArray(x.homework_templates)?x.homework_templates:[],
      dated_todos:Array.isArray(x.dated_todos)?x.dated_todos:[],
      progress_events:Array.isArray(x.progress_events)?x.progress_events:[],
      allocation_runs:Array.isArray(x.allocation_runs)?x.allocation_runs:[],
      execution_observations:Array.isArray(x.execution_observations)?x.execution_observations:[],
      carry_over_queue:Array.isArray(x.carry_over_queue)?x.carry_over_queue:[]
    };
  }

  function createPlanner(storage){
    function load(){
      try{return normalize(JSON.parse(storage.getItem(STORAGE_KEY)||'null'))}catch{return blank()}
    }
    function save(s){const payload=JSON.stringify(normalize(s));storage.setItem(STORAGE_KEY,payload);globalThis.ReadySetLocalFirst?.capture?.('planner',payload).catch?.(()=>{})}
    function mutate(fn){const s=load();const out=fn(s);save(s);return out}

    function upsertScheduleCommitment(input={}){
      const title=cleanText(input.title); if(!title) throw new Error('title required');
      return mutate(s=>{
        const id=cleanText(input.commitment_id)||makeId('commitment');
        const item={
          commitment_id:id,
          title,
          category:cleanText(input.category)||'OTHER',
          start_at:input.start_at||null,
          end_at:input.end_at||null,
          recurrence:input.recurrence||null,
          confirmed:input.confirmed!==false,
          planner_movable:!!input.planner_movable,
          parent_editable:input.parent_editable!==false,
          source:cleanText(input.source)||'READY_LOCAL',
          updated_at:new Date().toISOString()
        };
        const i=s.schedule_commitments.findIndex(x=>x.commitment_id===id);
        if(i>=0)s.schedule_commitments[i]=item;else s.schedule_commitments.push(item);
        return item;
      });
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
      return mutate(s=>{
        const id=cleanText(input.todo_id)||makeId('todo');
        const state=TODO_STATES.has(input.state)?input.state:'PLANNED';
        const item={
          todo_id:id,
          date:cleanText(input.date)||dateKey(),
          label,
          template_id:cleanText(input.template_id)||null,
          source:cleanText(input.source)||'PLANNER',
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

    function linkOrCreateTodayItems(labels=[],options={}){
      const date=cleanText(options.date)||dateKey();
      const source=cleanText(options.source)||'READY_MANUAL';
      const sourceActor=cleanText(options.source_actor)||'READY_USER';
      const uniq=[...new Set((labels||[]).map(cleanText).filter(Boolean))];
      return mutate(s=>uniq.map((label,order)=>{
        let todo=s.dated_todos.find(x=>x.date===date&&x.label===label&&x.state!=='COMPLETED');
        if(!todo){
          todo={
            todo_id:makeId('todo'),
            date,label,template_id:null,source,source_actor:sourceActor,
            provenance:{kind:'READY_EXECUTION_INTAKE'},
            order,state:'PLANNED',
            created_at:new Date().toISOString(),updated_at:new Date().toISOString()
          };
          s.dated_todos.push(todo);
        }
        return {todo_id:todo.todo_id,label:todo.label,date:todo.date,source:todo.source};
      }));
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

    function commitmentIntervals(state,date){
      return state.schedule_commitments
        .filter(x=>x.confirmed!==false && x.start_at && x.end_at)
        .filter(x=>String(x.start_at).slice(0,10)===date && String(x.end_at).slice(0,10)===date)
        .map(x=>({
          start:parseLocal(date,String(x.start_at).slice(11,16)),
          end:parseLocal(date,String(x.end_at).slice(11,16)),
          commitment_id:x.commitment_id,
          title:x.title
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
          s.dated_todos.filter(x=>x.date===date&&x.state!=='COMPLETED').map(x=>x.template_id).filter(Boolean)
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
          let todo=s.dated_todos.find(x=>x.date===run.date&&x.template_id===p.template_id&&x.state!=='COMPLETED');
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
      const mapped=READY_TO_TODO[readyState]||readyState;
      if(!TODO_STATES.has(mapped)) return {ok:false,reason:'INVALID_READY_STATE'};
      const actualMs=Number.isFinite(input.actual_ms)?Math.max(0,input.actual_ms):0;
      const actualMinutes=Math.round(actualMs/60000);
      return mutate(s=>{
        const todo=s.dated_todos.find(x=>x.todo_id===todoId);
        if(!todo)return {ok:false,reason:'TODO_NOT_FOUND'};
        todo.state=mapped;
        todo.actual_minutes=actualMinutes;
        todo.updated_at=new Date().toISOString();

        const observationKey=[cleanText(input.session_id),cleanText(input.task_id),todoId].join('|');
        let obs=s.execution_observations.find(x=>x.observation_key===observationKey);
        if(!obs){
          obs={
            observation_id:makeId('observation'),
            observation_key:observationKey,
            todo_id:todoId,
            template_id:todo.template_id||null,
            planned_minutes:Number.isFinite(todo.estimated_minutes)?todo.estimated_minutes:null,
            actual_minutes:actualMinutes,
            ready_state:readyState,
            session_id:cleanText(input.session_id)||null,
            task_id:cleanText(input.task_id)||null,
            source:'READY_SESSION',
            at:input.at||new Date().toISOString()
          };
          s.execution_observations.push(obs);
          s.execution_observations=s.execution_observations.slice(-500);
        }

        const carryEligible=['PARTIAL','DEFERRED'].includes(mapped);
        const carryNeedsResolution=['BLOCKED','WAITING_FOR_PARENT'].includes(mapped);
        const existing=s.carry_over_queue.find(x=>x.source_todo_id===todoId&&x.status==='OPEN');
        if((carryEligible||carryNeedsResolution)&&!existing){
          s.carry_over_queue.push({
            carry_over_id:makeId('carry'),
            source_todo_id:todoId,
            template_id:todo.template_id||null,
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

    function recentEstimateEvidence(templateId,limit=5){
      const rows=load().execution_observations
        .filter(x=>x.template_id===templateId&&Number.isFinite(x.actual_minutes)&&x.actual_minutes>0)
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
        authority:'OBSERVATION_ONLY'
      };
    }

    function recordTaskState(input={}){
      const todoId=cleanText(input.todo_id); if(!todoId) return null;
      const mapped=READY_TO_TODO[input.ready_state]||null; if(!mapped) return null;
      return mutate(s=>{
        const todo=s.dated_todos.find(x=>x.todo_id===todoId); if(!todo) return null;
        todo.state=mapped; todo.updated_at=new Date().toISOString();
        const eventKey=[input.session_id,input.task_id,todoId,mapped].map(cleanText).join('|');
        if(!s.progress_events.some(x=>x.event_key===eventKey)){
          s.progress_events.push({
            event_id:makeId('progress'),
            event_key:eventKey,
            todo_id:todoId,
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

    function today(date=dateKey()){
      const s=load();
      return s.dated_todos
        .filter(x=>x.date===date&&x.state!=='COMPLETED')
        .sort((a,b)=>(a.order??999)-(b.order??999)||a.label.localeCompare(b.label,'ko'));
    }

    function todayProjection(date=dateKey()){
      return today(date).map(x=>({
        todo_id:x.todo_id,
        label:x.label,
        state:x.state,
        source:x.source,
        estimated_minutes:Number.isFinite(x.estimated_minutes)?x.estimated_minutes:null,
        planner_owned:x.source==='PLANNER_ALLOCATION'
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
      return {ok:issues.length===0,issues,schema_version:s.schema_version,storage_backend:s.storage_backend};
    }

    return {
      snapshot:()=>load(),
      validate,
      today,
      todayProjection,
      upsertScheduleCommitment,
      upsertHomeworkTemplate,
      upsertDatedTodo,
      linkOrCreateTodayItems,
      recordTaskState,
      allocateToday,
      commitAllocation,
      recordSessionOutcome,
      carryOverCandidates,
      resolveCarryOver,
      recentEstimateEvidence
    };
  }

  return {createPlanner,dateKey,SCHEMA_VERSION};
});
