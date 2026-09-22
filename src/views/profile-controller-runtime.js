(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>null);
    const toast=options.toast||(()=>{});
    const renderHome=options.renderHome||(()=>{});
    const FileReaderCtor=options.FileReaderCtor||root.FileReader;
    const photoIntake=options.photoIntake||root.ReadySourcePhotoIntake||null;
    if(!view)throw new Error('PROFILE_CONTROLLER_DEPENDENCY_MISSING');

    function renderProfile(){
      return view.renderProfile(getState());
    }

    async function loadPhoto(file){
      if(!file)return {ok:false,reason:'NO_FILE'};
      if(!photoIntake?.normalize){
        if(!FileReaderCtor)return {ok:false,reason:'PHOTO_INTAKE_UNAVAILABLE'};
        return new Promise(resolve=>{
          const reader=new FileReaderCtor();
          reader.onload=()=>{
            const state=getState();
            state.profile.photo=reader.result;
            state.profile.sourcePhoto={identityAuthority:'SOURCE_PHOTO',legacy:true};
            save();
            renderProfile();
            resolve({ok:true,legacy:true});
          };
          reader.onerror=()=>resolve({ok:false,reason:'SOURCE_PHOTO_READ_FAILED'});
          reader.readAsDataURL(file);
        });
      }
      try{
        const normalized=await photoIntake.normalize(file,{FileReaderCtor});
        if(!normalized?.ok){
          toast('사진을 확인해 주세요.');
          return normalized||{ok:false,reason:'PHOTO_NORMALIZE_FAILED'};
        }
        const state=getState();
        state.profile.photo=normalized.data_url;
        state.profile.sourcePhoto={
          identityAuthority:'SOURCE_PHOTO',
          source_hash:normalized.source_hash,
          width:normalized.width,
          height:normalized.height,
          bytes:normalized.bytes,
          mime:normalized.mime,
          original:normalized.original
        };
        save();
        renderProfile();
        return normalized;
      }catch(err){
        toast('사진을 처리하지 못했어요.');
        return {ok:false,reason:err?.message||'PHOTO_NORMALIZE_FAILED'};
      }
    }

    function setStyle(style){
      const state=getState();
      state.profile.style=style;
      save();
      renderProfile();
    }

    function saveProfile({name='',birthdate='',shareAvatar=false}={}){
      const state=getState();
      const birth=String(birthdate||'').trim();
      if(birth&&!/^\d{4}-\d{2}-\d{2}$/.test(birth)){toast('생년월일 형식을 확인해 주세요.');return {ok:false,reason:'INVALID_BIRTHDATE'};}
      const today=new Date().toLocaleDateString('sv-SE');
      if(birth&&birth>today){toast('생년월일은 오늘보다 미래일 수 없어요.');return {ok:false,reason:'FUTURE_BIRTHDATE'};}
      state.profile.name=String(name||'').trim();
      state.profile.birthdate=birth;
      state.profile.shareAvatar=!!shareAvatar;
      save();
      toast('프로필을 저장했어요.');
      renderHome();
      return state.profile;
    }

    return Object.freeze({renderProfile,loadPhoto,setStyle,saveProfile});
  }

  root.ReadyRebuildProfileController=Object.freeze({
    version:'READY_REBUILD_PROFILE_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
