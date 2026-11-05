(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewRelationAffinity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='EXPLORER_CREW_RELATION_AFFINITY_V1';
  const STATES=Object.freeze([
    'UNSEEN','FIRST_ENCOUNTER','KNOWN','AFFINITY_BUILDING',
    'COMPANION_AVAILABLE','COMPANION','MAIN_COMPANION'
  ]);
  const EVENT_TYPES=Object.freeze([
    'FIRST_MET','REENCOUNTERED','SHARED_ACTIVITY','HELP_REQUEST_COMPLETED',
    'STORY_EVENT_SHARED','CHAPTER_SHARED','SPECIAL_EVENT_SHARED',
    'COMPANION_SELECTED','MAIN_SELECTED','MAIN_CHANGED'
  ]);

  const SCORE_EVENT=Object.freeze({
    REENCOUNTERED:1,
    SHARED_ACTIVITY:2,
    HELP_REQUEST_COMPLETED:2,
    STORY_EVENT_SHARED:2,
    CHAPTER_SHARED:2,
    SPECIAL_EVENT_SHARED:3
  });
  const clean=v=>typeof v==='string'?v.trim():'';
  const iso=v=>typeof v==='string'&&!Number.isNaN(Date.parse(v))?v:null;
  const now=()=>new Date().toISOString();

  function initial(characterIds=[]){
    return {
      version:VERSION,
      members:Object.fromEntries(characterIds.map(id=>[id,{
        character_id:id,
        relation_state:'UNSEEN',
        affinity:0,
        affinity_evidence_ids:[],
        first_met_at:null,
        companion_available_at:null,
        companion_selected_at:null,
        main_selected_at:null,
        updated_at:null
      }])),
      main_character_id:null
    };
  }
  function cloneLedger(ledger){
    return JSON.parse(JSON.stringify(ledger));
  }

  function ensureMember(ledger,id){
    if(!ledger?.members?.[id])throw new Error('RELATION_UNKNOWN_CHARACTER:'+id);
    return ledger.members[id];
  }

  function recordFirstEncounter(ledger,id,at=now()){
    const out=cloneLedger(ledger),m=ensureMember(out,id),tick=iso(at);
    if(!tick)throw new Error('RELATION_DATE_REQUIRED');
    if(m.relation_state==='UNSEEN'){
      m.relation_state='FIRST_ENCOUNTER';
      m.first_met_at=tick;
      m.updated_at=tick;
    }
    return out;
  }

  function completeFirstEncounter(ledger,id,at=now()){
    const out=cloneLedger(ledger),m=ensureMember(out,id),tick=iso(at);
    if(!tick)throw new Error('RELATION_DATE_REQUIRED');
    if(m.relation_state==='FIRST_ENCOUNTER'){
      m.relation_state='KNOWN';
      m.updated_at=tick;
    }
    return out;
  }

  function gateResult(gate={}){
    const checks={
      affinity_requirement_met:gate.affinity_requirement_met===true,
      story_unlocked:gate.story_unlocked===true
    };
    const reasons=[];
    if(!checks.affinity_requirement_met)reasons.push('AFFINITY_NOT_MET');
    if(!checks.story_unlocked)reasons.push('STORY_LOCKED');
    return Object.freeze({ok:reasons.length===0,checks:Object.freeze(checks),reasons:Object.freeze(reasons)});
  }

  function applyMeaningfulEvent(ledger,id,event={},gate={}){
    const out=cloneLedger(ledger),m=ensureMember(out,id);
    const type=clean(event.type),eventId=clean(event.event_id),tick=iso(event.at||now());
    if(!EVENT_TYPES.includes(type))throw new Error('RELATION_EVENT_INVALID');
    if(!eventId)throw new Error('RELATION_EVENT_ID_REQUIRED');
    if(!tick)throw new Error('RELATION_DATE_REQUIRED');
    if(['UNSEEN','FIRST_ENCOUNTER'].includes(m.relation_state))throw new Error('RELATION_KNOWN_REQUIRED');
    if(m.affinity_evidence_ids.includes(eventId))return out;
    const delta=SCORE_EVENT[type]||0;
    if(delta<=0)throw new Error('RELATION_EVENT_NOT_AFFINITY_EVIDENCE');
    m.affinity_evidence_ids.push(eventId);
    m.affinity+=delta;
    if(m.relation_state==='KNOWN'&&m.affinity>0)m.relation_state='AFFINITY_BUILDING';
    const gateCheck=gateResult(gate);
    m.companion_gate=gateCheck;
    if(gateCheck.ok&&['KNOWN','AFFINITY_BUILDING'].includes(m.relation_state)){
      m.relation_state='COMPANION_AVAILABLE';
      m.companion_available_at=tick;
    }
    m.updated_at=tick;
    return out;
  }
  function selectCompanion(ledger,id,at=now()){
    const out=cloneLedger(ledger),m=ensureMember(out,id),tick=iso(at);
    if(!tick)throw new Error('RELATION_DATE_REQUIRED');
    if(!['COMPANION_AVAILABLE','COMPANION','MAIN_COMPANION'].includes(m.relation_state)){
      throw new Error('RELATION_COMPANION_GATE_NOT_MET');
    }
    if(m.relation_state!=='MAIN_COMPANION')m.relation_state='COMPANION';
    if(!m.companion_selected_at)m.companion_selected_at=tick;
    m.updated_at=tick;
    return out;
  }

  function selectMain(ledger,id,at=now()){
    let out=selectCompanion(ledger,id,at);
    const tick=iso(at),prev=out.main_character_id;
    if(prev&&prev!==id){
      const pm=ensureMember(out,prev);
      if(pm.relation_state==='MAIN_COMPANION')pm.relation_state='COMPANION';
      pm.updated_at=tick;
    }
    const m=ensureMember(out,id);
    m.relation_state='MAIN_COMPANION';
    if(!m.main_selected_at)m.main_selected_at=tick;
    m.updated_at=tick;
    out.main_character_id=id;
    return out;
  }

  function snapshot(ledger){
    const frozen=cloneLedger(ledger);
    return Object.freeze({
      version:VERSION,
      main_character_id:frozen.main_character_id||null,
      members:Object.freeze(Object.fromEntries(
        Object.entries(frozen.members||{}).map(([id,m])=>[id,Object.freeze({...m})])
      ))
    });
  }

  return Object.freeze({
    VERSION,STATES,EVENT_TYPES,
    initial,recordFirstEncounter,completeFirstEncounter,gateResult,
    applyMeaningfulEvent,selectCompanion,selectMain,snapshot
  });
});
