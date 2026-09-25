(() => {
  'use strict';

  const VERSION='0.1.0';
  const Registry=globalThis.TakyFamilyMemberRegistry;
  const StorageScope=globalThis.TakyStorageScope;
  if(!Registry?.normalizeRegistry) throw new Error('READY_FAMILY_REGISTRY_CONTRACT_UNAVAILABLE');

  let registry=Registry.normalizeRegistry({family_id:null,members:[],revision:0});
  let loading=null;

  function familySession(){return globalThis.ReadyFamilySession?.current?.()||{authenticated:false}}
  function selectionKey(){
    const session=familySession();
    if(!StorageScope?.storageKey)return 'readyset_active_child_v1';
    return StorageScope.storageKey('family/active-child','readyset_active_child_v1',session);
  }
  function readSelected(){
    try{return String(localStorage.getItem(selectionKey())||'').trim()||null}catch{return null}
  }
  function writeSelected(id){
    try{
      if(id)localStorage.setItem(selectionKey(),id);
      else localStorage.removeItem(selectionKey());
    }catch{}
  }
  function publish(){
    window.dispatchEvent(new CustomEvent('readyset-family-registry',{detail:current()}));
  }
  function current(){return Registry.normalizeRegistry(registry)}
  function members(){return current().members}
  function children(){return Registry.children(current())}
  function self(){
    const id=familySession().member_id;
    return current().members.find(m=>m.member_id===id)||null;
  }
  function activeChild(){
    const session=familySession();
    if(session.role==='CHILD')return self();
    const selected=readSelected();
    return children().find(m=>m.member_id===selected)||children()[0]||null;
  }
  function minimalProjection(memberId=null){
    const member=memberId
      ? current().members.find(m=>m.member_id===memberId)
      : (familySession().role==='CHILD'?self():activeChild());
    return member?Registry.minimalProjection(member):{member_id:null,display_name:null,avatar_ref:null};
  }
  function apply(next){
    const normalized=Registry.normalizeRegistry(next||{});
    const session=familySession();
    if(session.authenticated&&normalized.family_id&&normalized.family_id!==session.family_id){
      throw new Error('FAMILY_REGISTRY_SCOPE_MISMATCH');
    }
    registry=normalized;
    const child=activeChild();
    if(session.role==='PARENT'&&child)writeSelected(child.member_id);
    publish();
    return current();
  }
  async function hydrate(){
    const session=familySession();
    if(!session.authenticated){
      registry=Registry.normalizeRegistry({family_id:null,members:[],revision:0});
      publish();
      return {ok:true,registry:current(),reason:'ANONYMOUS_LOCAL'};
    }
    if(loading)return loading;
    loading=(async()=>{
      try{
        const res=await fetch('/api/family/members',{method:'GET',headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'});
        const body=await res.json().catch(()=>({}));
        if(!res.ok||!body?.registry)return {ok:false,reason:body?.reason||('FAMILY_MEMBERS_HTTP_'+res.status),registry:current()};
        return {ok:true,registry:apply(body.registry)};
      }catch(error){
        return {ok:false,reason:String(error?.message||error),registry:current()};
      }finally{loading=null}
    })();
    return loading;
  }
  function selectActiveChild(memberId){
    const session=familySession();
    if(session.role!=='PARENT')return {ok:false,reason:'PARENT_ROLE_REQUIRED',registry:current()};
    const selected=Registry.selectActiveChild(current(),memberId);
    if(!selected.ok)return selected;
    registry=selected.registry;
    writeSelected(memberId);
    publish();
    return {ok:true,registry:current(),active_child:activeChild()};
  }
  async function updateProfile(input={}){
    const session=familySession();
    if(!session.authenticated)return {ok:false,reason:'AUTH_REQUIRED'};
    const member_id=String(input.member_id||session.member_id||'').trim();
    const profile={
      display_name:String(input.display_name||'').trim()||null,
      avatar_ref:String(input.avatar_ref||'').trim()||null
    };
    const res=await fetch('/api/family/profile',{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      credentials:'same-origin',
      body:JSON.stringify({member_id,profile})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok||!body?.member)return {ok:false,reason:body?.reason||('FAMILY_PROFILE_HTTP_'+res.status)};
    const next=current().members.map(m=>m.member_id===body.member.member_id?body.member:m);
    registry=Registry.normalizeRegistry({...current(),members:next});
    publish();
    return {ok:true,member:body.member,registry:current()};
  }
  function clear(){
    registry=Registry.normalizeRegistry({family_id:null,members:[],revision:0});
    publish();
    return current();
  }

  window.ReadyFamilyRegistry=Object.freeze({
    version:VERSION,current,members,children,self,activeChild,minimalProjection,
    hydrate,selectActiveChild,updateProfile,clear
  });

  window.addEventListener('readyset-family-session',()=>{
    const s=familySession();
    if(s.authenticated)hydrate().catch(()=>{});
    else clear();
  });
  if(familySession().authenticated)hydrate().catch(()=>{});
})();