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
      schedule_commitments:Array.isArray(x.schedule_commitments)?x.schedule_commitments:[],
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
    function load(){
      try{return normalize(JSON.parse(storage.getItem(STORAGE_KEY)||'null'))}catch{return blank()}
    }
    function save(s){const payload=JSON.stringify(normalize(s));storage.setItem(STORAGE_KEY,payload);globalThis.ReadySetLocalFirst?.capture?.('planner',payload).catch?.(()=>{})}
    function mutate(fn){const s=load();const out=fn(s);save(s);return out}

    function upsertScheduleCommitment(input={}){
      if(globalThis.ReadyFamilySession && cleanText(input.source)==='PARENT_ADMIN_UI'){
        const gate=globalThis.ReadyFamilySession.requireRole?.('PARENT');
        if(!gate?.ok) throw new Error(gate?.reason||'PARENT_AUTH_REQUIRED');
      }
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
      return load().dated_todos.filter(x=>ids.has(x.todo_id)&&x.date===date&&x.state!=='COMPLETED').map(x=>({
        todo_id:x.todo_id,label:x.label,date:x.date,source:x.source,
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
        const loadByDate=Object.fromEntries(dates.map(d=>[d,(s.dated_todos||[])
          .filter(t=>t.date===d&&t.state!=='COMPLETED')
          .map(t=>({
            tags:t.cognitive_load_profile||[],
            score:Number.isFinite(t.activity_load_score)?t.activity_load_score:3,
            difficulty:Number.isFinite(t.difficulty)?t.difficulty:3,
            recovery_need:t.recovery_need||'MEDIUM'
          }))]));
        const scheduleByDate=Object.fromEntries(dates.map(d=>[d,(s.schedule_commitments||[]).filter(x=>x.confirmed!==false&&x.start_at&&x.end_at&&String(x.start_at).slice(0,10)===d&&String(x.end_at).slice(0,10)===d)]));
        const proposals=[];
        for(const unit of units){
          const existing=s.dated_todos.find(t=>t.learning_unit_id===unit.learning_unit_id&&t.state!=='COMPLETED');
          if(existing){proposals.push({decision:'REUSE',date:existing.date,todo_id:existing.todo_id,learning_unit_id:unit.learning_unit_id});continue}
          const tags=unit.cognitive_load_profile||[];
          const unitLoad=unit.activity_load||{};
          const unitScore=Number.isFinite(unitLoad.score)?unitLoad.score:3;
          const unitDifficulty=Number.isFinite(unitLoad.difficulty)?unitLoad.difficulty:3;
          const unitRecovery=unitLoad.recovery_need||'MEDIUM';
          const date=[...dates].sort((a,b)=>{
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
              return taskLoads.length*8
                + existingLoad*4
                + overlap*18
                + recoveryPenalty
                + difficultyPenalty
                + (unitScore>=5&&commitmentMinutes>=120?20:0)
                + schedulePressure;
            };
            return score(a)-score(b)||a.localeCompare(b);
          })[0];
          loadByDate[date].push({tags,score:unitScore,difficulty:unitDifficulty,recovery_need:unitRecovery});
          const templateId=`template_${unit.learning_unit_id}`;
          const template={template_id:templateId,title:`${unit.subject} · ${unit.source_range||unit.concept_skill_target}`,subject:unit.subject,assignment_cycle:fact.assignment_cycle,learning_units:[unit.learning_unit_id],provenance:{kind:'LEARNING_MASTER_OUTPUT',assignment_id:assignmentId,analysis_id:analysis.analysis_id},confirmation_state:'CONFIRMED',deadline_date:fact.deadline_boundary||null,estimated_minutes:null,allocation_priority:100,required_today:false,preferred_days:[],updated_at:new Date().toISOString()};
          const ti=s.homework_templates.findIndex(x=>x.template_id===templateId);if(ti>=0)s.homework_templates[ti]=template;else s.homework_templates.push(template);
          proposals.push({
            decision:'PROPOSE',date,label:template.title,assignment_id:assignmentId,analysis_id:analysis.analysis_id,
            learning_unit_id:unit.learning_unit_id,template_id:templateId,
            activity_types:unit.activity_types,
            activity_sequence:unit.activity_sequence||[],
            cognitive_load_profile:unit.cognitive_load_profile,
            activity_load_score:unitScore,
            difficulty:unitDifficulty,
            recovery_need:unitRecovery,
            review_policy:unit.review_policy||'RESULT_DEPENDENT',
            parent_help_dependency:unit.parent_help_dependency||'UNRESOLVED',
            prerequisite:unit.prerequisite
          });
        }
        const run={allocation_run_id:runId,version:'PLANNER_V2',assignment_id:assignmentId,analysis_id:analysis.analysis_id,primary_basis:'LEARNING_UNIT_ACTIVITY_LOAD',minutes_role:'SECONDARY_SAFETY_ONLY',proposals,created_at:new Date().toISOString()};
        s.allocation_runs.push(run);return {ok:true,...run};
      });
    }
    function commitLearningAllocation(runId){
      return mutate(s=>{const run=s.allocation_runs.find(x=>x.allocation_run_id===runId&&x.version==='PLANNER_V2');if(!run)return {ok:false,reason:'ALLOCATION_RUN_NOT_FOUND'};
        const created=[];
        for(const p of run.proposals.filter(x=>x.decision==='PROPOSE')){
          let todo=s.dated_todos.find(x=>x.learning_unit_id===p.learning_unit_id&&x.state!=='COMPLETED');
          if(!todo){todo={
            todo_id:makeId('todo'),date:p.date,label:p.label,assignment_id:p.assignment_id,analysis_id:p.analysis_id,
            learning_unit_id:p.learning_unit_id,template_id:p.template_id,allocation_run_id:runId,
            activity_types:p.activity_types,activity_sequence:p.activity_sequence||[],
            cognitive_load_profile:p.cognitive_load_profile,
            activity_load_score:p.activity_load_score,difficulty:p.difficulty,recovery_need:p.recovery_need,
            review_policy:p.review_policy,parent_help_dependency:p.parent_help_dependency,
            source:'PLANNER_V2_ALLOCATION',source_actor:'PLANNER_MAIN',
            provenance:{assignment_id:p.assignment_id,analysis_id:p.analysis_id,learning_unit_id:p.learning_unit_id,allocation_run_id:runId},
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
        const todo={...source,todo_id:makeId('todo'),date,state:'PLANNED',source:'PLANNER_V2_CARRY_OVER',source_actor:'PLANNER_MAIN',provenance:{...(source.provenance||{}),carry_over_id:carryId,source_todo_id:source.todo_id},created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
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
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            allocation_run_id:todo.allocation_run_id||null,
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
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            allocation_run_id:todo.allocation_run_id||null,
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


    function proposeEstimateAdjustment(templateId,input={}){
      const id=cleanText(templateId);
      if(!id)return {ok:false,reason:'TEMPLATE_ID_REQUIRED'};
      const minSamples=Number.isFinite(input.min_samples)?Math.max(1,Math.floor(input.min_samples)):3;
      const minDelta=Number.isFinite(input.min_delta_minutes)?Math.max(0,Math.floor(input.min_delta_minutes)):5;
      const evidenceLimit=Number.isFinite(input.evidence_limit)?Math.max(minSamples,Math.floor(input.evidence_limit)):5;
      return mutate(s=>{
        const template=s.homework_templates.find(x=>x.template_id===id);
        if(!template)return {ok:false,reason:'TEMPLATE_NOT_FOUND'};
        const rows=s.execution_observations
          .filter(x=>x.template_id===id&&Number.isFinite(x.actual_minutes)&&x.actual_minutes>0)
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
          evidence:{sample_count:vals.length,median_actual_minutes:median,values:vals,authority:'OBSERVATION_ONLY'},
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
            assignment_id:todo.assignment_id||null,
            analysis_id:todo.analysis_id||null,
            learning_unit_id:todo.learning_unit_id||null,
            template_id:todo.template_id||null,
            allocation_run_id:todo.allocation_run_id||null,
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
      upsertScheduleCommitment,
      upsertHomeworkTemplate,
      upsertDatedTodo,
      linkTodayItems,
      linkOrCreateTodayItems,
      allocateLearningUnits,
      commitLearningAllocation,
      replanCarryOver,
      recordTaskState,
      allocateToday,
      commitAllocation,
      recordSessionOutcome,
      carryOverCandidates,
      resolveCarryOver,
      recentEstimateEvidence,
      proposeEstimateAdjustment,
      decideEstimateAdjustment,
      pendingEstimateAdjustments
    };
  }

  return {createPlanner,dateKey,SCHEMA_VERSION};
});
