(function(root){
  'use strict';
  // Ready is a consumer of existing Character Formation identity, NOT the owner of Crew.
  // Source: CharacterFormationJourneyRuntime.CREW and its HARD_LOCK asset manifest.
  const VERSION='READY_EXPEDITION_COMPANION_PRESENTATION_V01';
  function create(options={}){
    const getState=options.getState||(()=>({}));
    const roster=options.roster||[];
    const assetRegistry=options.assetRegistry||null;
    const query=options.query||((selector)=>root.document?.querySelector(selector));
    const imageFactory=options.imageFactory||(()=>new root.Image());
    const introduction=options.introduction||((row)=>row.line||null);
    const preparation=options.preparation||(()=>null);
    const approved=new Map();
    const pending=new Map();
    const targets={
      home:{card:'#homeGuideCard',portrait:'#homeGuidePortrait',name:'#homeGuideName',line:'#homeGuideLine',context:'INTRO'},
      mission:{card:'#missionCompanionCard',portrait:'#missionCompanionPortrait',name:'#missionCompanionName',line:'#missionCompanionLine',context:'PREPARATION'},
      result:{card:'#resultCompanionSlot',portrait:'#resultGuidePortrait',name:'#resultCompanionName',line:null,context:'NONE'}
    };
    const clean=value=>String(value??'').trim();
    function resolve(){
      const state=getState()||{};
      const id=clean(state.expedition?.primaryCompanionId).toLowerCase();
      if(!id)return {ok:false,reason:'PRIMARY_COMPANION_NOT_SELECTED'};
      const row=roster.find(x=>x.id===id)||null;
      if(!row)return {ok:false,reason:'PRIMARY_COMPANION_NOT_IN_LOCKED_ROSTER',id};
      if(assetRegistry?.snapshot?.().state!=='READY')return {ok:false,reason:'APPROVED_CREW_MANIFEST_NOT_READY',id};
      const manifest=assetRegistry.manifest?.();
      if(manifest?.status!=='HARD_LOCK')return {ok:false,reason:'CREW_ASSET_MANIFEST_NOT_HARD_LOCKED',id};
      const asset=assetRegistry.path?.('crew',id)||'';
      if(!asset)return {ok:false,reason:'PRIMARY_COMPANION_APPROVED_ASSET_MISSING',id};
      const alias=clean(state.expedition?.primaryCompanionAlias)||row.name;
      return Object.freeze({ok:true,character_id:id,visual_id:id,name:alias,canonical_name:row.name,
        asset,source:'CHARACTER_FORMATION_JOURNEY_CREW_AND_HARD_LOCK_MANIFEST',row});
    }
    function prove(asset){
      if(approved.has(asset))return Promise.resolve(true);
      if(pending.has(asset))return pending.get(asset);
      const task=new Promise(resolve=>{
        const image=imageFactory();
        image.onload=()=>{approved.set(asset,true);resolve(true);};
        image.onerror=()=>resolve(false);
        image.src=asset;
      }).finally(()=>pending.delete(asset));
      pending.set(asset,task);
      return task;
    }
    function clear(entry,reason){
      const card=query(entry.card),portrait=query(entry.portrait),line=entry.line?query(entry.line):null;
      if(card){card.hidden=true;card.dataset.companionState=reason;}
      if(portrait){
        portrait.style?.removeProperty?.('background-image');
        portrait.removeAttribute?.('data-character-id');
        portrait.removeAttribute?.('data-visual-id');
      }
      if(line){line.textContent='';line.removeAttribute?.('data-dialogue-source');}
      return {ok:false,reason};
    }
    const rendering={home:0,mission:0,result:0};
    async function render(surface){
      const entry=targets[surface];if(!entry)return {ok:false,reason:'COMPANION_SURFACE_UNSUPPORTED'};
      const revision=++rendering[surface];
      const current=resolve();
      if(!current.ok)return clear(entry,current.reason);
      const card=query(entry.card),portrait=query(entry.portrait),name=query(entry.name),line=entry.line?query(entry.line):null;
      if(!card||!portrait||!name)return {ok:false,reason:'COMPANION_SLOT_MISSING'};
      // Never display a legacy Guide portrait while the approved chosen asset is unresolved.
      card.hidden=true;
      const good=await prove(current.asset);
      if(revision!==rendering[surface])return {ok:false,reason:'STALE_COMPANION_RENDER'};
      const still=resolve();
      if(!good||!still.ok||still.character_id!==current.character_id||still.asset!==current.asset)
        return clear(entry,good?'COMPANION_STATE_CHANGED':'APPROVED_CREW_ASSET_FAILED_TO_LOAD');
      portrait.classList?.remove?.('lumi','pico','mori','guest');
      portrait.style.backgroundImage='url("'+current.asset.replace(/"/g,'%22')+'")';
      portrait.dataset.characterId=current.character_id;
      portrait.dataset.visualId=current.visual_id;
      name.textContent=current.name;
      if(line){
        const approvedLine=entry.context==='INTRO'?introduction(current.row)
          :entry.context==='PREPARATION'?preparation(current.character_id):null;
        line.textContent=approvedLine||'';
        if(approvedLine)line.dataset.dialogueSource=entry.context==='INTRO'
          ?'CHARACTER_FORMATION_JOURNEY_CREW_INTRO'
          :'CHARACTER_FORMATION_SCENE_PREPARATION';
        else line.removeAttribute?.('data-dialogue-source');
        line.hidden=!approvedLine;
      }
      card.dataset.characterId=current.character_id;
      card.dataset.visualId=current.visual_id;
      card.dataset.companionState='APPROVED_ASSET_BOUND';
      card.hidden=false;
      return {ok:true,character_id:current.character_id,name:current.name,dialogue_source:line?.dataset.dialogueSource||null};
    }
    return Object.freeze({version:VERSION,resolve,render,renderHome:()=>render('home'),
      renderMission:()=>render('mission'),renderResult:()=>render('result')});
  }
  root.ReadyExpeditionCompanionPresentation=Object.freeze({version:VERSION,create});
})(typeof globalThis!=='undefined'?globalThis:this);
