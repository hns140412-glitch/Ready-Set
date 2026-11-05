(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewRoleBehaviorPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_ROLE_BEHAVIOR_POLICY_V1';

  const POLICY=Object.freeze({
    MAIN:Object.freeze({
      direct_response:true,
      can_ask:true,
      can_hint:true,
      default_mode:'LISTEN',
      max_consecutive_talk_turns:1,
      exit_required:false
    }),
    GUEST:Object.freeze({
      direct_response:false,
      can_ask:true,
      can_hint:false,
      default_mode:'LISTEN',
      max_consecutive_talk_turns:1,
      exit_required:true
    }),
    AMBIENT:Object.freeze({
      direct_response:false,
      can_ask:false,
      can_hint:false,
      default_mode:'SILENT',
      max_consecutive_talk_turns:0,
      exit_required:false
    }),
    CHAPTER_OWNER:Object.freeze({
      direct_response:false,
      can_ask:true,
      can_hint:true,
      default_mode:'LISTEN',
      max_consecutive_talk_turns:1,
      exit_required:false
    }),
    ACTING_CREW:Object.freeze({
      direct_response:true,
      can_ask:true,
      can_hint:true,
      default_mode:'LISTEN',
      max_consecutive_talk_turns:1,
      exit_required:true
    })
  });

  function policyFor(role){return POLICY[role]||null}

  function validateTurn(input={}){
    const p=policyFor(input.role);
    const errors=[];
    if(!p)errors.push('UNKNOWN_ROLE');
    if(p&&input.talk===true&&p.max_consecutive_talk_turns===0)errors.push('AMBIENT_TALK_FORBIDDEN');
    if(p&&input.hint===true&&!p.can_hint)errors.push('ROLE_HINT_FORBIDDEN');
    if(p&&input.direct_response===true&&!p.direct_response)errors.push('ROLE_DIRECT_RESPONSE_FORBIDDEN');
    if(input.concurrent_speakers>1)errors.push('MULTI_SPEAKER_CONFLICT');
    if(input.role==='GUEST'&&input.exit_planned!==true)errors.push('GUEST_EXIT_REQUIRED');
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }

  return Object.freeze({VERSION,POLICY,policyFor,validateTurn});
});
