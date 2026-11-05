(function(root,factory){
'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CrewRuntimePolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='CREW_RUNTIME_POLICY_V1';
const DIALOGUE_INTENTS=Object.freeze(['NOTICE_DETAIL','CURIOUS_FOLLOWUP','WAIT_WITHOUT_PRESSURE','PLAYFUL_SURPRISE','ACKNOWLEDGE_EFFORT','ASK_FOR_EXAMPLE','RETURN_INITIATIVE','COMPLETE_WITHOUT_OVERPRAISE']);
const SLOTS=Object.freeze(['FG_LEFT','FG_RIGHT','MID_LEFT','MID_RIGHT','BG_WORLD','PEEK_LEFT','PEEK_RIGHT']);
const DEFAULT_BUDGET=Object.freeze({foreground_reactions:1,ambient_active:2,spoken_dialogue:1,overlay:1});
const INTERRUPTIBILITY=Object.freeze({AMBIENT:'IMMEDIATE',OBSERVE:'IMMEDIATE',THINK:'IMMEDIATE',LISTEN:'PROTECTED',GUIDE:'AFTER_SHORT_UNIT',REACTION:'AFTER_SHORT_UNIT',COMPLETE:'IMMEDIATE_ON_NAVIGATION',PEEK:'IMMEDIATE',HIDE:'IMMEDIATE'});
const SLOT_BY_ROLE=Object.freeze({MAIN:['FG_LEFT','FG_RIGHT'],GUEST:['MID_LEFT','MID_RIGHT'],AMBIENT:['MID_LEFT','MID_RIGHT','BG_WORLD'],CHAPTER_OWNER:['FG_LEFT','FG_RIGHT'],ACTING_CREW:['FG_LEFT','FG_RIGHT']});
function clean(v){return String(v??'').trim();}
function boundedInt(v,d,min=0,max=99){const n=Number(v);return Number.isInteger(n)&&n>=min&&n<=max?n:d;}
function normalizeHistory(v,limit){return Array.isArray(v)?v.map(clean).filter(Boolean).slice(-limit):[];}
function selectDialogueIntent({requested_intent,child_response_state='UNKNOWN',help_request_state='NONE',recent_dialogue_intents=[]}={}){
 const recent=new Set(normalizeHistory(recent_dialogue_intents,8));
 const candidates=[];
 if(DIALOGUE_INTENTS.includes(requested_intent))candidates.push(requested_intent);
 if(help_request_state==='REQUESTED')candidates.push('ASK_FOR_EXAMPLE','RETURN_INITIATIVE');
 if(child_response_state==='STUCK'||child_response_state==='SILENT')candidates.push('WAIT_WITHOUT_PRESSURE','CURIOUS_FOLLOWUP');
 if(child_response_state==='DETAIL_ADDED')candidates.push('NOTICE_DETAIL','CURIOUS_FOLLOWUP');
 if(child_response_state==='PLAYFUL')candidates.push('PLAYFUL_SURPRISE','CURIOUS_FOLLOWUP');
 if(child_response_state==='COMPLETE')candidates.push('COMPLETE_WITHOUT_OVERPRAISE','ACKNOWLEDGE_EFFORT');
 candidates.push('CURIOUS_FOLLOWUP','RETURN_INITIATIVE');
 return candidates.find(x=>DIALOGUE_INTENTS.includes(x)&&!recent.has(x))||candidates.find(x=>DIALOGUE_INTENTS.includes(x))||'RETURN_INITIATIVE';
}
function selectSlot({role='AMBIENT',occupied_slots=[],preferred_slot=null}={}){
 const occupied=new Set(Array.isArray(occupied_slots)?occupied_slots:[]);
 const allowed=SLOT_BY_ROLE[role]||SLOT_BY_ROLE.AMBIENT;
 if(preferred_slot&&allowed.includes(preferred_slot)&&!occupied.has(preferred_slot))return preferred_slot;
 return allowed.find(x=>!occupied.has(x))||null;
}
function cooldownKey(command={}){
 return [clean(command.character_id),clean(command.behavior_state),clean(command.ambient_action||command.dialogue_intent||'NONE')].join(':');
}
function allocateScene({commands=[],budget=DEFAULT_BUDGET,recent_action_keys=[],recent_dialogue_intents=[],child_response_state='UNKNOWN',help_request_state='NONE'}={}){
 const accepted=[],rejected=[],occupied_slots=[],usage={foreground_reactions:0,ambient_active:0,spoken_dialogue:0,overlay:0};
 for(const command of Array.isArray(commands)?commands:[]){
   const decision=evaluate({command,budget,usage,occupied_slots,recent_action_keys,recent_dialogue_intents,child_response_state,help_request_state});
   if(decision.ok){
     accepted.push(Object.freeze({command,decision}));
     occupied_slots.push(decision.scene_slot);
     if(['MAIN','CHAPTER_OWNER','ACTING_CREW'].includes(command.role)||['GUIDE','REACTION','COMPLETE'].includes(command.behavior_state))usage.foreground_reactions++;
     if(command.role==='AMBIENT')usage.ambient_active++;
     if(['VOICE','TEXT_AND_VOICE'].includes(command.interaction_mode))usage.spoken_dialogue++;
     if(command.dialogue_intent)usage.overlay++;
   }else rejected.push(Object.freeze({command,decision}));
 }
 return Object.freeze({accepted:Object.freeze(accepted),rejected:Object.freeze(rejected),usage:Object.freeze({...usage}),occupied_slots:Object.freeze([...occupied_slots])});
}
function evaluate(input={}){
 const command=input.command||null;if(!command)return {ok:false,reason:'SEMANTIC_COMMAND_REQUIRED'};
 const budget={foreground_reactions:boundedInt(input.budget?.foreground_reactions,1,0,4),ambient_active:boundedInt(input.budget?.ambient_active,2,0,6),spoken_dialogue:boundedInt(input.budget?.spoken_dialogue,1,0,2),overlay:boundedInt(input.budget?.overlay,1,0,2)};
 const usage=input.usage||{};
 const wantsForeground=['MAIN','CHAPTER_OWNER','ACTING_CREW'].includes(command.role)||['GUIDE','REACTION','COMPLETE'].includes(command.behavior_state);
 const wantsSpeech=['VOICE','TEXT_AND_VOICE'].includes(command.interaction_mode);
 const wantsOverlay=!!command.dialogue_intent;
 const rejects=[];
 if(wantsForeground&&boundedInt(usage.foreground_reactions,0)>=budget.foreground_reactions)rejects.push('FOREGROUND_REACTION_BUDGET_EXHAUSTED');
 if(command.role==='AMBIENT'&&boundedInt(usage.ambient_active,0)>=budget.ambient_active)rejects.push('AMBIENT_BUDGET_EXHAUSTED');
 if(wantsSpeech&&boundedInt(usage.spoken_dialogue,0)>=budget.spoken_dialogue)rejects.push('SPOKEN_DIALOGUE_BUDGET_EXHAUSTED');
 if(wantsOverlay&&boundedInt(usage.overlay,0)>=budget.overlay)rejects.push('OVERLAY_BUDGET_EXHAUSTED');
 const key=cooldownKey(command),recentActions=new Set(normalizeHistory(input.recent_action_keys,5));
 if(recentActions.has(key))rejects.push('RECENT_ACTION_REPEAT');
 const scene_slot=selectSlot({role:command.role,occupied_slots:input.occupied_slots,preferred_slot:input.preferred_slot});
 if(!scene_slot)rejects.push('NO_SCENE_SLOT_AVAILABLE');
 const dialogue_intent=command.dialogue_intent?selectDialogueIntent({requested_intent:command.dialogue_intent,child_response_state:input.child_response_state,help_request_state:input.help_request_state,recent_dialogue_intents:input.recent_dialogue_intents}):null;
 const interruptibility=INTERRUPTIBILITY[command.behavior_state]||'IMMEDIATE';
 return Object.freeze({
   ok:rejects.length===0,
   reason:rejects[0]||null,
   rejected_reasons:Object.freeze(rejects),
   scene_slot,
   dialogue_intent,
   interruptibility,
   cooldown_key:key,
   cooldown_after:boundedInt(command.cooldown_after,input.default_cooldown_after??2,0,20),
   reaction_budget:Object.freeze(budget),
   selection_reason:rejects.length?'BLOCKED_BY_RUNTIME_POLICY':'WITHIN_BUDGET_SLOT_AND_COOLDOWN'
 });
}
return Object.freeze({version:VERSION,dialogueIntents:DIALOGUE_INTENTS,slots:SLOTS,defaultBudget:DEFAULT_BUDGET,interruptibility:INTERRUPTIBILITY,selectDialogueIntent,selectSlot,cooldownKey,evaluate,allocateScene});
});
