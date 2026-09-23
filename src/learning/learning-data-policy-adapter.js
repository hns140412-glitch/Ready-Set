'use strict';

const VERSION='READY_LEARNING_DATA_POLICY_ADAPTER_V1';

function assertDecision(decision={}){
  if(!decision || typeof decision!=='object') throw new Error('POLICY_DECISION_REQUIRED');
  if(!decision.policy_version) throw new Error('POLICY_VERSION_REQUIRED');
  if(!decision.function_id) throw new Error('POLICY_FUNCTION_REQUIRED');
  if(!['ALLOW','ALLOW_CONDITIONAL','DENY'].includes(decision.decision)) throw new Error('POLICY_DECISION_INVALID');
  if(decision.decision==='DENY') throw new Error(decision.reason||'POLICY_DENIED');
  return decision;
}

function apply({decision,analysisProvenance={},evidence={},requestedBehavior=null}={}){
  const d=assertDecision(decision);
  if(d.consumer_app && d.consumer_app!=='READY_SET') throw new Error('POLICY_CONSUMER_MISMATCH');
  const cannotClaim=Array.isArray(d.cannot_claim)?[...d.cannot_claim]:[];
  if(requestedBehavior==='SCHEDULE_DATE_MUTATION') throw new Error('READY_POLICY_CANNOT_MUTATE_PLANNER_DATE');
  return Object.freeze({
    authority:'READY_LEARNING_DATA_POLICY_CONSUMER_ONLY',
    policy:Object.freeze({
      policy_version:d.policy_version,
      policy_id:d.policy_id||null,
      function_id:d.function_id,
      authorization_class:d.authorization_class||null,
      decision:d.decision,
      cannot_claim:Object.freeze(cannotClaim)
    }),
    analysis_provenance:Object.freeze({...analysisProvenance,learning_data_policy:{
      policy_version:d.policy_version,policy_id:d.policy_id||null,function_id:d.function_id,
      authorization_class:d.authorization_class||null,decision:d.decision,cannot_claim:cannotClaim
    }}),
    evidence:Object.freeze({...evidence,cannot_claim:Object.freeze([
      ...new Set([...(Array.isArray(evidence.cannot_claim)?evidence.cannot_claim:[]),...cannotClaim])
    ])})
  });
}

module.exports=Object.freeze({version:VERSION,apply});
