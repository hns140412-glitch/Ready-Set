(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const core=options.core;
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>null);
    const familySession=options.familySession||(()=>({}));
    const toast=options.toast||(()=>{});
    const remote=options.remote||null;
    const masterApi=options.masterApi||root.ReadyCharacterMaster||null;
    if(!view||!core)throw new Error('CHARACTER_SETUP_CONTROLLER_DEPENDENCY_MISSING');

    function profile(){return getState().profile||{};}

    function memberScope(){
      const session=familySession()||{};
      const raw=String(session.member_id||'local_child');
      return raw.replace(/[^A-Za-z0-9._-]/g,'_')||'local_child';
    }

    function visualId(p=profile()){
      if(p.visualId)return p.visualId;
      const hash=String(p.sourcePhoto?.source_hash||'').slice(0,16);
      if(!hash)throw new Error('CHARACTER_SOURCE_PHOTO_REQUIRED');
      return 'visual_'+hash;
    }

    function snapshot(){
      const p=profile();
      const s=p.characterDirection||{};
      if(s.status==='ROUND_2'){
        return {profile:p,status:'ROUND_2',options:root.ReadyCharacterDirection.secondRound(s.firstSelection),candidates:[],remoteJob:p.characterRemoteJob||null,master:p.characterMaster||null};
      }
      if(s.status==='READY_FOR_CANDIDATE_GENERATION'){
        return {profile:p,status:s.status,options:[],candidates:s.candidates||[],remoteJob:p.characterRemoteJob||null,master:p.characterMaster||null};
      }
      if(s.status==='ROUND_1'){
        return {profile:p,status:'ROUND_1',options:root.ReadyCharacterDirection.firstRound(),candidates:[],remoteJob:p.characterRemoteJob||null,master:p.characterMaster||null};
      }
      return {profile:p,status:'START',options:[],candidates:[],remoteJob:p.characterRemoteJob||null,master:p.characterMaster||null};
    }

    function render(){view.render(snapshot());}

    function begin(){
      const p=profile();
      if(!p.sourcePhoto?.source_hash){
        toast('먼저 사진을 등록해 주세요.');
        return {ok:false,reason:'CHARACTER_SOURCE_PHOTO_REQUIRED'};
      }
      const out=core.begin(p);
      save();
      view.render({profile:p,status:out.status,options:out.options,candidates:[]});
      return {ok:true,...out};
    }

    function choose(directionId){
      const p=profile();
      try{
        const out=core.choose(p,directionId,{memberScope:memberScope(),visualId:visualId(p)});
        save();
        if(out.status==='ROUND_2'){
          view.render({profile:p,status:out.status,options:out.options,candidates:[]});
        }else{
          view.render({profile:p,status:out.status,options:[],candidates:p.characterDirection?.candidates||[]});
          toast('후보 3개 생성 준비가 끝났어요.');
        }
        return {ok:true,...out};
      }catch(err){
        toast('캐릭터 방향을 다시 확인해 주세요.');
        return {ok:false,reason:err?.message||'CHARACTER_DIRECTION_FAILED'};
      }
    }

    function generationPayload(){
      return core.generationPayload(profile());
    }

    function ensureRemoteProfile(){
      const p=profile();
      if(!p.visualId)throw new Error('CHARACTER_VISUAL_ID_REQUIRED');
      if(!p.sourcePhoto?.source_hash||!p.photo)throw new Error('CHARACTER_SOURCE_PHOTO_REQUIRED');
      if(!p.characterGenerationJob)throw new Error('CHARACTER_GENERATION_JOB_REQUIRED');
      return p;
    }

    async function prepareRemoteJob(){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      const upload=await remote.uploadSource({
        visual_id:p.visualId,
        source_hash:p.sourcePhoto.source_hash,
        data_url:p.photo
      });
      if(!upload?.ok)return upload;
      const created=await remote.createJob(generationPayload());
      if(created?.ok){
        p.characterRemoteJob=created.job||null;
        save();
      }
      return created;
    }

    async function startGeneration(slot){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      return remote.startGeneration({visual_id:p.visualId,slot});
    }

    async function refreshRemoteJob(){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      const result=await remote.getJob(p.visualId);
      if(result?.ok){
        p.characterRemoteJob=result.job||null;
        save();
      }
      return result;
    }

    async function generateAllCandidates(){
      const p=ensureRemoteProfile();
      if(!p.characterRemoteJob)return {ok:false,reason:'CHARACTER_REMOTE_JOB_REQUIRED'};
      for(const slot of ['A','B','C']){
        const current=p.characterRemoteJob?.candidate_assets?.[slot];
        if(current)continue;
        const result=await startGeneration(slot);
        if(!result?.ok)return result;
        const refreshed=await refreshRemoteJob();
        if(!refreshed?.ok)return refreshed;
      }
      return refreshRemoteJob();
    }

    async function selectCandidate(slot){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      const result=await remote.selectCandidate({visual_id:p.visualId,slot});
      if(!result?.ok)return result;
      p.characterRemoteJob=result.job||null;
      if(masterApi){
        const candidates=(result.job?.directions||[]).map(x=>({
          slot:x.slot,
          direction_id:x.direction_id,
          source:x.source,
          asset_key:result.job?.candidate_assets?.[x.slot]?.asset_key||null,
          asset_url:remote.assetUrl(p.visualId,x.slot),
          asset_hash:null
        }));
        let model=masterApi.create({
          visual_id:p.visualId,
          source_hash:p.sourcePhoto.source_hash,
          candidates
        });
        model=masterApi.select(model,slot);
        p.characterMaster=model;
      }
      save();
      return result;
    }

    async function correctLikeness(){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      const result=await remote.correctLikeness({visual_id:p.visualId});
      if(!result?.ok)return result;
      p.characterRemoteJob=result.job||null;
      if(masterApi&&p.characterMaster){
        const current=p.characterMaster.state==='CORRECTION_PENDING'
          ? p.characterMaster
          : masterApi.requestCorrection(p.characterMaster,'SOURCE_PHOTO_LIKENESS_STRONGER');
        p.characterMaster=masterApi.applyCorrection(current,{
          asset_key:result.job?.corrected_asset?.asset_key||null,
          asset_url:remote.assetUrl(p.visualId,'CORRECTED'),
          asset_hash:null
        });
      }
      save();
      return result;
    }

    async function lockMaster(){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      const result=await remote.lockMaster({visual_id:p.visualId});
      if(!result?.ok)return result;
      p.characterRemoteJob=result.job||null;
      p.characterMasterRemote=result.master||null;
      if(masterApi&&p.characterMaster){
        const assets={
          avatar_square:remote.assetUrl(p.visualId,'MASTER_AVATAR'),
          portrait_card:remote.assetUrl(p.visualId,'MASTER_PORTRAIT'),
          full_character:remote.assetUrl(p.visualId,'MASTER_FULL')
        };
        p.characterMaster=masterApi.lock(p.characterMaster,{master_assets:assets,locked_at:result.master?.locked_at});
      }
      save();
      return result;
    }

    async function generateMasterSheet(){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      const result=await remote.generateMasterSheet({visual_id:p.visualId});
      if(!result?.ok)return result;
      p.characterRemoteJob=result.job||null;
      p.characterMasterSheet={
        asset_url:remote.assetUrl(p.visualId,'MASTER_SHEET'),
        asset_key:result.job?.master_sheet?.asset_key||null
      };
      save();
      return result;
    }

    return Object.freeze({
      render,begin,choose,generationPayload,prepareRemoteJob,startGeneration,
      refreshRemoteJob,generateAllCandidates,selectCandidate,correctLikeness,lockMaster,generateMasterSheet
    });
  }

  root.ReadyCharacterSetupController=Object.freeze({
    version:'READY_CHARACTER_SETUP_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
