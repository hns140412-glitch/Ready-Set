(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewContracts);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./contracts-v1.js'));
  }else if(root)root.TakyExplorerCrewRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(contracts){
  'use strict';
  const VERSION='EXPLORER_CREW_RUNTIME_V1';

  function requiredEngine(engines,key){
    const fn=engines?.[key];
    if(typeof fn!=='function')throw new Error('EXPLORER_CREW_ENGINE_MISSING:'+key);
    return fn;
  }

  function createRuntime(engines={}){
    const encounter=requiredEngine(engines,'encounter');
    const relation=requiredEngine(engines,'relation');
    const memory=requiredEngine(engines,'memory');
    const crew=requiredEngine(engines,'crew');
    const behavior=requiredEngine(engines,'behavior');
    const arbitrate=requiredEngine(engines,'arbitrate');
    const dialogue=requiredEngine(engines,'dialogue');
    const scene=requiredEngine(engines,'scene');
    const asset=requiredEngine(engines,'asset');
    const render=requiredEngine(engines,'render');
    const update=requiredEngine(engines,'update');
    const validate=requiredEngine(engines,'validate');
    const collectContext=typeof engines.collectContext==='function'?engines.collectContext:async c=>c;
    const captureInteraction=typeof engines.captureInteraction==='function'?engines.captureInteraction:async c=>c.interaction_result||null;
    const summarize=typeof engines.summarize==='function'?engines.summarize:async (_c,x)=>({status:x.report?.status||'UNKNOWN'});
    const eventLogger=typeof engines.eventLogger==='function'?engines.eventLogger:async()=>{};
    const emit=async(type,payload)=>{try{await eventLogger(type,payload)}catch{}};

    async function cycle(context={}){
      const trace=[];
      const ctx=await collectContext(context);trace.push(['CONTEXT',ctx]);await emit('CONTEXT_SNAPSHOT',ctx);
      const encountered=await encounter(ctx);trace.push(['ENCOUNTER',encountered]);
      const relationSnapshot=await relation(ctx,encountered);trace.push(['RELATION',relationSnapshot]);
      const memoryCue=await memory(ctx,encountered,relationSnapshot);trace.push(['MEMORY',memoryCue]);
      const crewPlan=await crew(ctx,encountered,relationSnapshot,memoryCue);trace.push(['CREW',crewPlan]);
      const action=await behavior(ctx,crewPlan,relationSnapshot,memoryCue);trace.push(['BEHAVIOR',action]);await emit('BEHAVIOR_DECISION',action);
      const actionCheck=contracts?.validateSemanticAction?.(action);
      await emit('BEHAVIOR_GATE_RESULT',actionCheck||{ok:true,errors:[]});if(actionCheck&&!actionCheck.ok)throw new Error('SEMANTIC_ACTION_INVALID:'+actionCheck.errors.join(','));
      const arbitrated=await arbitrate(ctx,action,crewPlan);trace.push(['ARBITRATION',arbitrated]);
      const dialogueCommand=await dialogue(ctx,arbitrated,memoryCue);trace.push(['DIALOGUE',dialogueCommand]);
      const sceneCommand=await scene(ctx,arbitrated,crewPlan);trace.push(['SCENE',sceneCommand]);
      const sceneCheck=contracts?.validateSceneCommand?.(sceneCommand);
      if(sceneCheck&&!sceneCheck.ok)throw new Error('SCENE_COMMAND_INVALID:'+sceneCheck.errors.join(','));
      await emit('ASSET_RESOLVE_REQUEST',{action:arbitrated,scene:sceneCommand});const visual=await asset(ctx,arbitrated,sceneCommand);trace.push(['ASSET',visual]);
      const visualCheck=contracts?.validateResolvedVisual?.(visual);await emit('ASSET_GATE_RESULT',visualCheck||{ok:true,errors:[]});await emit('VISUAL_COMMAND',visual);
      const visualBlocked=!!(visualCheck&&!visualCheck.ok);
      const rendered=visualBlocked
        ? Object.freeze({rendered:false,blocked:true,reason:'VISUAL_COMMAND_INVALID:'+visualCheck.errors.join(','),errors:Object.freeze([...visualCheck.errors])})
        : await render(ctx,{dialogueCommand,sceneCommand,visual});
      trace.push(['RENDER',rendered]);await emit('UI_RENDER_RESULT',rendered);
      const interaction=await captureInteraction(ctx,{rendered,visual,sceneCommand,dialogueCommand});trace.push(['INTERACTION',interaction]);await emit('INTERACTION_RESULT',interaction);
      const stateUpdate=await update(ctx,{interaction,relationSnapshot,memoryCue,crewPlan,action:arbitrated,visualBlocked,visualErrors:visualCheck?.errors||[]});
      trace.push(['STATE_UPDATE',stateUpdate]);if(stateUpdate?.relation_changed)await emit('RELATION_UPDATE',stateUpdate.relation);
      const report=await validate(ctx,{trace,stateUpdate,visualCheck,visualBlocked});trace.push(['VALIDATION',report]);
      const summary=await summarize(ctx,{trace,stateUpdate,report,visualBlocked});trace.push(['SUMMARY',summary]);await emit('SESSION_SUMMARY',summary);
      return Object.freeze({
        version:VERSION,
        trace:Object.freeze(trace.map(row=>Object.freeze(row))),
        report,
        output:Object.freeze({dialogueCommand,sceneCommand,visual,rendered,stateUpdate,summary})
      });
    }

    return Object.freeze({VERSION,cycle});
  }

  return Object.freeze({
    VERSION,
    createRuntime,
    pipelineOrder:contracts?.PIPELINE_ORDER||[]
  });
});
