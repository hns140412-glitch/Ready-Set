(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewBehaviorPatterns=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_BEHAVIOR_PATTERNS_V1';

  const AMBIENT_ACTIONS=Object.freeze([
    'READ_BOOK','READ_MAP','WRITE_NOTE','CHECK_COMPASS',
    'ORGANIZE_BAG','USE_MAGNIFIER','USE_RADIO','REST','IDLE'
  ]);

  const BEHAVIOR_STATES=Object.freeze([
    'AMBIENT','PEEK','OBSERVE','TALK','THINK','IDEA',
    'GUIDE','LISTEN','REACTION','COMPLETE','HIDE'
  ]);

  const ESCALATION=Object.freeze(['AMBIENT','PEEK','OBSERVE','TALK','GUIDE','HIDE']);
  const HINT_FLOW=Object.freeze(['SILENT','OBSERVE','ASK','H1','H2','H3']);

  const RULES=Object.freeze({
    default_speaker_count:1,
    foreground_max:2,
    ambient_recommended_min:0,
    ambient_recommended_max:3,
    one_question_at_a_time:true,
    one_hint_at_a_time:true,
    direct_answer_default:false,
    overpraise:false,
    grading_tone:false,
    ridicule:false,
    affinity_write:false,
    memory_write:false,
    asset_selection:false
  });
  function decide(context={}){
    const focus=context.focus_state==='FOCUS';
    const paused=context.child_state==='PAUSED';
    const incorrect=context.child_state==='INCORRECT';
    const help=context.help_requested===true;
    const completed=context.task_state==='COMPLETED';

    if(completed)return Object.freeze({
      behavior_state:'COMPLETE',interaction_mode:'SILENT',hint_level:'H0',
      ambient_action:null,reason:'TASK_COMPLETED'
    });
    if(focus&&!paused&&!incorrect&&!help)return Object.freeze({
      behavior_state:'AMBIENT',interaction_mode:'SILENT',hint_level:'H0',
      ambient_action:'READ_MAP',reason:'FOCUS_PROTECTION'
    });
    if(help)return Object.freeze({
      behavior_state:'GUIDE',interaction_mode:'GUIDE',hint_level:'H1',
      ambient_action:null,reason:'EXPLICIT_HELP_REQUEST'
    });
    if(incorrect)return Object.freeze({
      behavior_state:'OBSERVE',interaction_mode:'TALK',hint_level:'H1',
      ambient_action:null,reason:'INCORRECT_ONE_CLUE'
    });
    if(paused)return Object.freeze({
      behavior_state:'PEEK',interaction_mode:'TALK',hint_level:'H0',
      ambient_action:null,reason:'PAUSED_ONE_QUESTION'
    });
    return Object.freeze({
      behavior_state:'AMBIENT',interaction_mode:'SILENT',hint_level:'H0',
      ambient_action:'IDLE',reason:'DEFAULT_SILENT'
    });
  }

  function validatePlan(plan={}){
    const errors=[];
    if(!BEHAVIOR_STATES.includes(plan.behavior_state))errors.push('INVALID_BEHAVIOR_STATE');
    if(plan.hint_level==='H4')errors.push('HINT_LEVEL_TOO_HIGH');
    if(plan.direct_answer===true)errors.push('DIRECT_ANSWER_FORBIDDEN');
    if(plan.speaker_count>1)errors.push('MULTI_SPEAKER_CONFLICT');
    if(plan.focus_state==='FOCUS'&&plan.behavior_state==='TALK'&&plan.focus_interruption!==true)errors.push('FOCUS_INTERRUPTION');
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }

  return Object.freeze({
    VERSION,AMBIENT_ACTIONS,BEHAVIOR_STATES,ESCALATION,HINT_FLOW,RULES,
    decide,validatePlan
  });
});
