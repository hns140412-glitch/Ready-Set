(function(root){
  'use strict';

  const VERSION='READY_CHARACTER_GENERATION_JOB_V01';
  const STATES=Object.freeze([
    'DRAFT','SOURCE_READY','QUEUED',
    'GENERATING_A','GENERATING_B','GENERATING_C',
    'READY_FOR_SELECTION','SELECTED',
    'CORRECTION_PENDING','CORRECTED',
    'MASTER_LOCKED','FAILED'
  ]);

  const ALLOWED=Object.freeze({
    DRAFT:['SOURCE_READY','FAILED'],
    SOURCE_READY:['QUEUED','FAILED'],
    QUEUED:['GENERATING_A','FAILED'],
    GENERATING_A:['GENERATING_B','FAILED'],
    GENERATING_B:['GENERATING_C','FAILED'],
    GENERATING_C:['READY_FOR_SELECTION','FAILED'],
    READY_FOR_SELECTION:['SELECTED','FAILED'],
    SELECTED:['CORRECTION_PENDING','MASTER_LOCKED','FAILED'],
    CORRECTION_PENDING:['CORRECTED','FAILED'],
    CORRECTED:['MASTER_LOCKED','CORRECTION_PENDING','FAILED'],
    MASTER_LOCKED:[],
    FAILED:[]
  });

  function nowIso(now=Date.now){return new Date(now()).toISOString();}

  function create({visual_id,member_scope,source_hash,directions,now=Date.now}={}){
    if(!visual_id||!member_scope)throw new Error('CHARACTER_JOB_IDENTITY_REQUIRED');
    if(!source_hash)throw new Error('CHARACTER_JOB_SOURCE_HASH_REQUIRED');
    if(!Array.isArray(directions)||directions.length!==3)throw new Error('CHARACTER_JOB_THREE_DIRECTIONS_REQUIRED');
    const provenance=directions.map(x=>x?.source);
    if(provenance.join('|')!=='USER_SELECTION_1|USER_SELECTION_2|SYSTEM_AUTO_CONTRAST'){
      throw new Error('CHARACTER_JOB_DIRECTION_PROVENANCE_INVALID');
    }
    if(new Set(directions.map(x=>x?.direction?.id)).size!==3)throw new Error('CHARACTER_JOB_DIRECTIONS_NOT_DISTINCT');
    const created=nowIso(now);
    return {
      contract_version:VERSION,
      job_id:'charjob_'+visual_id+'_'+source_hash.slice(0,12),
      visual_id,
      member_scope,
      source_hash,
      status:'DRAFT',
      created_at:created,
      updated_at:created,
      directions:directions.map((x,i)=>({
        slot:['A','B','C'][i],
        source:x.source,
        direction_id:x.direction.id,
        direction_label:x.direction.label
      })),
      assets:{source:null,A:null,B:null,C:null,selected:null,corrected:null,master:null},
      selected_slot:null,
      correction_revision:0,
      error:null,
      trace:[{at:created,event:'JOB_CREATED',status:'DRAFT'}]
    };
  }

  function transition(job,next,{event,patch={},now=Date.now}={}){
    if(!job||!STATES.includes(job.status))throw new Error('CHARACTER_JOB_INVALID_STATE');
    if(!STATES.includes(next))throw new Error('CHARACTER_JOB_UNKNOWN_NEXT_STATE');
    if(!(ALLOWED[job.status]||[]).includes(next))throw new Error('CHARACTER_JOB_INVALID_TRANSITION:'+job.status+'->'+next);
    const at=nowIso(now);
    const out={...job,...patch,status:next,updated_at:at};
    out.trace=[...(job.trace||[]),{at,event:event||next,status:next}];
    return out;
  }

  function select(job,slot,{now=Date.now}={}){
    if(job.status!=='READY_FOR_SELECTION')throw new Error('CHARACTER_JOB_NOT_READY_FOR_SELECTION');
    if(!['A','B','C'].includes(slot))throw new Error('CHARACTER_JOB_INVALID_SLOT');
    if(!job.assets?.[slot])throw new Error('CHARACTER_JOB_SLOT_ASSET_MISSING');
    return transition(job,'SELECTED',{
      event:'CANDIDATE_SELECTED',
      patch:{selected_slot:slot,assets:{...job.assets,selected:job.assets[slot]}},
      now
    });
  }

  function fail(job,reason,{now=Date.now}={}){
    return transition(job,'FAILED',{event:'JOB_FAILED',patch:{error:String(reason||'UNKNOWN')},now});
  }

  root.ReadyCharacterGenerationJob=Object.freeze({
    version:VERSION,
    STATES,
    create,
    transition,
    select,
    fail
  });
})(typeof globalThis!=='undefined'?globalThis:this);
