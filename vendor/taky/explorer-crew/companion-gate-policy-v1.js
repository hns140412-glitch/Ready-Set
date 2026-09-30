(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewCompanionGateRegistry);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./companion-gate-registry-v1.js'));
  }else if(root)root.TakyExplorerCrewCompanionGatePolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(registry){
  'use strict';
  const VERSION='EXPLORER_CREW_COMPANION_GATE_POLICY_V1';

  function resolveCharacterId(event={}){
    const raw=String(event.character_id||'').trim();
    if(registry?.characters?.[raw])return raw;
    const hit=Object.values(registry?.characters||{}).find(x=>
      String(x.code||'').toLowerCase()===raw.toLowerCase() ||
      String(x.visual_id||'')===raw
    );
    return hit?.character_id||raw;
  }

  function evaluate({context={},event={},member=null}={}){
    const id=resolveCharacterId(event);
    const entry=registry?.characters?.[id]||null;
    const explicit=context?.companion_gate||{};
    return Object.freeze({
      affinity_requirement_met:explicit.affinity_requirement_met===true,
      story_unlocked:explicit.story_unlocked===true,
      expression_status:Object.freeze({
        character_approved:entry?.character_approved===true,
        manifest_ready:entry?.manifest_ready===true,
        source_sha:entry?.source_sha||null,
        manifest_status:entry?.manifest_status||null
      }),
      evidence:Object.freeze({
        character_id:id||null,
        registry_found:!!entry,
        relation_state:member?.relation_state||null
      })
    });
  }

  return Object.freeze({VERSION,evaluate,registry});
});
