(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>null);
    const toast=options.toast||(()=>{});
    const renderHome=options.renderHome||(()=>{});
    const FileReaderCtor=options.FileReaderCtor||root.FileReader;
    if(!view)throw new Error('PROFILE_CONTROLLER_DEPENDENCY_MISSING');

    function renderProfile(){
      return view.renderProfile(getState());
    }

    function loadPhoto(file){
      if(!file||!FileReaderCtor)return false;
      const reader=new FileReaderCtor();
      reader.onload=()=>{
        const state=getState();
        state.profile.photo=reader.result;
        save();
        renderProfile();
      };
      reader.readAsDataURL(file);
      return true;
    }

    function setStyle(style){
      const state=getState();
      state.profile.style=style;
      save();
      renderProfile();
    }

    function saveProfile({name='',shareAvatar=false}={}){
      const state=getState();
      state.profile.name=String(name||'').trim();
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
