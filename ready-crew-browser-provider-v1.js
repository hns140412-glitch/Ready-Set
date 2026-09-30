(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root&&typeof window!=='undefined'){
    root.ReadyCrewBrowserProviderInstallV1=api;
    Promise.resolve().then(()=>api.installFromRoot(root)).catch(error=>{
      root.ReadyCrewBrowserProviderStatus=Object.freeze({state:'DISABLED_INSTALL_ERROR',reason:String(error?.message||error)});
    });
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='READY_CREW_BROWSER_PROVIDER_INSTALL_V1';
  const APP='READY_SET';
  const clean=v=>typeof v==='string'?v.trim():'';
  const status=(root,state,extra={})=>root.ReadyCrewBrowserProviderStatus=Object.freeze({version:VERSION,state,...extra});
  async function genericScope(host){
    let session,member;
    try{session=await host.currentSession();member=typeof host.selectedMemberId==='function'?await host.selectedMemberId():session?.selected_member_id||session?.member_id;}catch{return {authenticated:false};}
    member=clean(member);
    if(session?.authenticated!==true||!clean(session.family_id)||!member)return {authenticated:false};
    if(Array.isArray(session.authorized_member_ids)&&!session.authorized_member_ids.includes(member))return {authenticated:false};
    return {authenticated:true,family_id:clean(session.family_id),member_id:member};
  }
  async function readyScope(root,host){
    const Session=root.ReadyCentralEvidenceSessionV01;
    const ready=root.ReadyFamilySession?.current?.();
    if(typeof Session?.resolve!=='function'||!ready)return genericScope(host);
    let central,member;
    try{central=await host.currentSession();member=typeof host.selectedMemberId==='function'?await host.selectedMemberId():ready.role==='CHILD'?ready.member_id:'';}catch{return {authenticated:false};}
    const resolved=Session.resolve({readySession:ready,centralSession:central,selectedMemberId:member});
    return resolved?.ok===true?{authenticated:true,family_id:resolved.session.family_id,member_id:resolved.session.selected_member_id}:{authenticated:false};
  }
  async function installFromRoot(root){
    const Runtime=root?.TakyCrewEvidenceBrowserProviderV1;
    if(typeof Runtime?.create!=='function')return {ok:false,status:status(root,'DISABLED_RUNTIME_REQUIRED',{reason:'CENTRAL_CREW_BROWSER_RUNTIME_REQUIRED'})};
    const cfg=root.TAKY_CREW_CONFIG||root.TIMEATTACK_CONFIG||{};
    const endpointUrl=clean(cfg.CENTRAL_CREW_EVIDENCE_ENDPOINT);
    if(!endpointUrl)return {ok:false,status:status(root,'DISABLED_CONFIG_REQUIRED',{reason:'CENTRAL_CREW_EVIDENCE_ENDPOINT_REQUIRED'})};
    const host=root.TakyCentralCrewAuthHost||root.ReadyCentralAuthHost||null;
    if(typeof host?.currentSession!=='function'||typeof host?.accessToken!=='function')return {ok:false,status:status(root,'DISABLED_AUTH_HOST_REQUIRED',{reason:'CENTRAL_CREW_AUTH_HOST_REQUIRED'})};
    let provider;
    try{provider=Runtime.create({appId:APP,endpointUrl,fetchImpl:root.fetch?.bind(root),tokenProvider:()=>host.accessToken(),scopeProvider:()=>readyScope(root,host),eventTarget:root});}
    catch(error){return {ok:false,status:status(root,'DISABLED_CONFIG_INVALID',{reason:String(error?.message||error)})};}
    const installed=provider.install();
    if(!installed.ok)return {ok:false,status:status(root,'DISABLED_EVENT_HOST_REQUIRED',{reason:installed.reason})};
    root.ReadyCrewBrowserProvider=provider;
    return {ok:true,provider,status:status(root,'INSTALLED_FAIL_CLOSED')};
  }
  return Object.freeze({VERSION,APP,genericScope,installFromRoot});
});
