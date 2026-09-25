(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ReadyLegacyLearningCompat=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_LEGACY_LEARNING_COMPAT_V1_0_0';
  const clean=v=>String(v??'').trim();

  function specialistEvidenceSignal(rows=[]){
    const evidence=(rows||[]).flatMap(x=>Array.isArray(x.learning_evidence)?x.learning_evidence:[]);
    const memory=evidence.filter(x=>x?.evidence_type==='MEMORY_RETRIEVAL_EVIDENCE');
    const production=evidence.filter(x=>x?.evidence_type==='LEARNER_PRODUCTION_EVIDENCE');
    const advisoryMap=new Map();
    for(const row of memory.flatMap(x=>Array.isArray(x?.memory?.review_advisories)?x.memory.review_advisories:[])){
      const lexicalId=clean(row?.lexicalId||row?.lexical_id);
      const priority=Number(row?.nextReviewPriority??row?.priority);
      if(!lexicalId)continue;
      const existing=advisoryMap.get(lexicalId);
      if(!existing||(!Number.isFinite(existing.nextReviewPriority)&&Number.isFinite(priority))||(Number.isFinite(priority)&&priority>existing.nextReviewPriority)){
        advisoryMap.set(lexicalId,{lexicalId,nextReviewPriority:Number.isFinite(priority)?priority:null});
      }
    }
    const reviewAdvisories=[...advisoryMap.values()].sort((a,b)=>(Number(b.nextReviewPriority)||0)-(Number(a.nextReviewPriority)||0)).slice(0,24);
    const priorities=reviewAdvisories.map(x=>Number(x.nextReviewPriority)).filter(Number.isFinite);
    const weakStrength=memory.map(x=>Number(x?.memory?.average_strength)).filter(Number.isFinite);
    const childAuthored=production.filter(x=>x?.production?.child_authored===true).length;
    return {
      authority:'READY_LEGACY_COMPAT_EVIDENCE_INTERPRETATION_ONLY',
      memory_evidence_count:memory.length,
      production_evidence_count:production.length,
      max_memory_review_priority:priorities.length?Math.max(...priorities):null,
      review_advisories:reviewAdvisories,
      min_memory_strength:weakStrength.length?Math.min(...weakStrength):null,
      child_authored_production_count:childAuthored,
      can_influence:['LEGACY_RECOVERY_INTENSITY','LEGACY_CHECKPOINT_SELECTION','LEGACY_UNIT_SPAN'],
      cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION','LEARNER_MODEL_AUTHORITY']
    };
  }

  function learnerAdaptiveProfile(rows=[],options={}){
    const asOf=Date.parse(options.as_of||'');
    const anchor=Number.isFinite(asOf)?asOf:Date.now();
    const cutoff=anchor-1000*60*60*24*90;
    const seen=new Set();
    const memberId=clean(options.member_id);
    const subject=clean(options.subject).toLowerCase();
    const recent=(rows||[]).filter(row=>{
      const rowMember=clean(row?.member_id||row?.learner_id);
      const rowSubject=clean(row?.subject||row?.book_subject).toLowerCase();
      if(memberId&&rowMember&&rowMember!==memberId)return false;
      if(subject&&rowSubject&&rowSubject!==subject)return false;
      const stamp=Date.parse(row?.at||row?.created_at||row?.updated_at||'');
      return !Number.isFinite(stamp)||stamp>=cutoff;
    }).slice(-12);
    const evidence=recent.flatMap((row,rowIndex)=>(Array.isArray(row.learning_evidence)?row.learning_evidence:[]).map((e,eIndex)=>({e,row,rowIndex,eIndex})))
      .filter(({e,row,rowIndex,eIndex})=>{
        const key=clean(e?.evidence_id||e?.event_id||e?.session_id||row?.session_id||row?.execution_observation_id)||
          JSON.stringify([row?.at||row?.created_at||rowIndex,e?.evidence_type,e?.memory?.average_strength,eIndex]);
        if(seen.has(key))return false;
        seen.add(key);return true;
      });
    const memory=evidence.map(x=>x.e).filter(x=>x?.evidence_type==='MEMORY_RETRIEVAL_EVIDENCE');
    const strengths=memory.map(x=>Number(x?.memory?.average_strength)).filter(Number.isFinite);
    const priorities=memory.flatMap(x=>Array.isArray(x?.memory?.review_advisories)?x.memory.review_advisories:[])
      .map(x=>Number(x?.nextReviewPriority??x?.priority)).filter(Number.isFinite);
    const frictionStates=recent.map(x=>x.ready_state||x.state).filter(x=>['PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT'].includes(x));
    const enough=strengths.length>=3;
    const baseline=enough?strengths.slice(0,-1).reduce((a,b)=>a+b,0)/Math.max(1,strengths.length-1):null;
    const latest=strengths.length?strengths[strengths.length-1]:null;
    const delta=Number.isFinite(baseline)&&Number.isFinite(latest)?latest-baseline:null;
    const trend=!Number.isFinite(delta)?'INSUFFICIENT_EVIDENCE':delta<=-10?'DECLINING':delta>=10?'IMPROVING':'STABLE';
    return {
      authority:'READY_LEGACY_COMPAT_ADAPTIVE_PROFILE_ONLY',
      observation_count:recent.length,
      unique_evidence_count:evidence.length,
      freshness_window_days:90,
      member_scope:memberId||null,
      subject_scope:subject||null,
      memory_sample_count:strengths.length,
      baseline_memory_strength:Number.isFinite(baseline)?Math.round(baseline*10)/10:null,
      latest_memory_strength:latest,
      memory_delta:Number.isFinite(delta)?Math.round(delta*10)/10:null,
      trend,
      friction_count:frictionStates.length,
      max_memory_review_priority:priorities.length?Math.max(...priorities):null,
      cannot_influence:['SCHEDULE_DATE','PLANNER_DATE','ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION','LEARNER_MODEL_AUTHORITY']
    };
  }

  function assessMemoryConcern(rows=[],options={}){
    const specialist=specialistEvidenceSignal(rows);
    const adaptiveProfile=learnerAdaptiveProfile(rows,options);
    const priority=Number(specialist.max_memory_review_priority);
    const strength=Number(specialist.min_memory_strength);
    const personalDecline=adaptiveProfile.trend==='DECLINING';
    const memoryConcern=(Number.isFinite(priority)&&priority>=70)||(Number.isFinite(strength)&&strength<60)||personalDecline;
    return {
      authority:'READY_LEGACY_COMPATIBILITY_ONLY',
      memory_concern:memoryConcern,
      specialist_evidence:specialist,
      learner_adaptive_profile:adaptiveProfile,
      thresholds:{review_priority_gte:70,memory_strength_lt:60,decline_delta_lte:-10},
      runtime_default_authority:false
    };
  }

  return Object.freeze({VERSION,specialistEvidenceSignal,learnerAdaptiveProfile,assessMemoryConcern});
});
