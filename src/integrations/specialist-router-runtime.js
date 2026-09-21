(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadySpecialistRouter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_SPECIALIST_ROUTER_V01';
  const HIDE_STAGES=new Set([
    'RETRIEVE','RECALL','BIDIRECTIONAL_RECALL','SELECTIVE_RELEARN',
    'FORM','SOUND','CORE_MEANING','VERIFIED_RELATION','COMPOUND_WORD','SCENE_CONTEXT',
    'ENCODE','MEMORY','SPELLING_RECALL','VOCABULARY_RECALL'
  ]);
  const SNAP_STAGES=new Set([
    'PRODUCE','RESPOND_OR_EXPRESS','WRITE','WRITING','REVISE',
    'SPEAK','SPEAKING','RECORDING','ONE_LINE_CONCEPT_EXPRESSION'
  ]);
  const READY_CORE_STAGES=new Set([
    'ORIENT','QUESTION','TOOL_LANGUAGE_GATE','READ_OR_LISTEN','UNDERSTAND','UNDERSTAND_CONCEPT',
    'SCENE_OR_VISUAL_MODEL','RESTATE_QUESTION','REPRESENT','REPRESENT_RELATION','PREDICT','SOLVE',
    'PRACTICE','APPLY','TRANSFER','CHECK_ERROR','RECONSTRUCT_CONCEPT_IF_NEEDED',
    'LIFE_SOCIETY_CONTEXT','PERSON_EVENT','OBJECT_SITE','PRIMARY_SOURCE_RECORD','MAP_TIMELINE',
    'COMPARE_INFER','CLAIM_EVIDENCE','CONNECT_EVIDENCE','OBSERVE','PREDICT_OR_HYPOTHESIZE',
    'COMPREHEND','FIND_EVIDENCE','MEANING_CONTEXT_REUSE','COMPARE_STRATEGY','SELF_REVIEW','REVIEW'
  ]);
  const HIDE_TYPES=new Set(['MEMORY','RECALL','VOCABULARY','SPELLING']);
  const SNAP_TYPES=new Set(['WRITING','SPEAKING','RECORDING','REVISION','PRODUCTION']);

  const clean=v=>String(v??'').trim();
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).map(clean).filter(Boolean))];

  function classify(input={}){
    const subject=clean(input.subject);
    const domain=clean(input.matched_domain||input.domain);
    const stages=uniq(input.activity_sequence||input.method_sequence);
    const types=uniq(input.activity_types);
    const hideStages=stages.filter(x=>HIDE_STAGES.has(x));
    const snapStages=stages.filter(x=>SNAP_STAGES.has(x));
    const readyStages=stages.filter(x=>READY_CORE_STAGES.has(x));
    const hideTypes=types.filter(x=>HIDE_TYPES.has(x));
    const snapTypes=types.filter(x=>SNAP_TYPES.has(x));

    const hideNeed=hideStages.length>0||hideTypes.length>0;
    const snapNeed=snapStages.length>0||snapTypes.length>0;
    const readyNeed=readyStages.length>0||(!hideNeed&&!snapNeed);

    const handoffs=[];
    if(hideNeed) handoffs.push({app:'hide-seek',owner:'HIDE_LANGUAGE_MEMORY',stages:hideStages,activity_types:hideTypes});
    if(snapNeed) handoffs.push({app:'snap-pop',owner:'SNAP_EXPRESSION',stages:snapStages,activity_types:snapTypes});

    let mode='READY_ORCHESTRATED';
    let primary_app='ready-set';
    if(hideNeed&&!snapNeed&&!readyNeed){mode='HIDE_SPECIALIST';primary_app='hide-seek';}
    else if(snapNeed&&!hideNeed&&!readyNeed){mode='SNAP_SPECIALIST';primary_app='snap-pop';}

    return Object.freeze({
      router_version:VERSION,
      authority:'READY_LEARNING_ENGINE_ROUTING',
      subject:subject||null,
      domain:domain||null,
      mode,
      primary_app,
      ready_owned:readyNeed,
      handoffs,
      allowed_specialists:handoffs.map(x=>x.app),
      denied_by_default:true,
      reason:{
        ready_stages:readyStages,
        hide_stages:hideStages,
        snap_stages:snapStages,
        hide_activity_types:hideTypes,
        snap_activity_types:snapTypes
      }
    });
  }

  function canLaunch(plan,app){
    if(!plan||!app)return false;
    return Array.isArray(plan.allowed_specialists)&&plan.allowed_specialists.includes(app);
  }

  return Object.freeze({version:VERSION,classify,canLaunch});
});
