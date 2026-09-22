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
        return {profile:p,status:'ROUND_2',options:root.ReadyCharacterDirection.secondRound(s.firstSelection),candidates:[]};
      }
      if(s.status==='READY_FOR_CANDIDATE_GENERATION'){
        return {profile:p,status:s.status,options:[],candidates:s.candidates||[]};
      }
      if(s.status==='ROUND_1'){
        return {profile:p,status:'ROUND_1',options:root.ReadyCharacterDirection.firstRound(),candidates:[]};
      }
      return {profile:p,status:'START',options:[],candidates:[]};
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

    async function startGeneration(){
      if(!remote)return {ok:false,reason:'CHARACTER_REMOTE_ADAPTER_UNAVAILABLE'};
      const p=ensureRemoteProfile();
      return remote.startGeneration({visual_id:p.visualId});
    }

    return Object.freeze({render,begin,choose,generationPayload,prepareRemoteJob,startGeneration});
  }

  root.ReadyCharacterSetupController=Object.freeze({
    version:'READY_CHARACTER_SETUP_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
