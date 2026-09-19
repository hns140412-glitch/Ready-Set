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
    progress_events:[]
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
      progress_events:Array.isArray(x.progress_events)?x.progress_events:[]
    };
  }

  function createPlanner(storage){
    function load(){
      try{return normalize(JSON.parse(storage.getItem(STORAGE_KEY)||'null'))}catch{return blank()}
    }
    function save(s){storage.setItem(STORAGE_KEY,JSON.stringify(normalize(s)))}
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
        let todo=s.dated_todos.find(x=>x.date===date&&x.label===label&&x.source===source&&x.state!=='COMPLETED');
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
      upsertScheduleCommitment,
      upsertHomeworkTemplate,
      upsertDatedTodo,
      linkOrCreateTodayItems,
      recordTaskState
    };
  }

  return {createPlanner,dateKey,SCHEMA_VERSION};
});
