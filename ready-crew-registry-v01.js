(() => {
  'use strict';
  const Crew=globalThis.TakyCrewRegistry;
  if(!Crew?.normalizeRegistry)throw new Error('READY_CREW_REGISTRY_UNAVAILABLE');

  let registry=Crew.defaultRegistry(null);
  let loading=null;

  function family(){return globalThis.ReadyFamilySession?.current?.()||{authenticated:false,role:'CHILD',member_id:null}}
  function targetMemberId(){
    const s=family();
    if(!s.authenticated)return null;
    if(s.role==='PARENT')return globalThis.ReadyFamilyRegistry?.activeChild?.()?.member_id||null;
    return s.member_id||null;
  }
  function current(){return Crew.normalizeRegistry(registry)}
  function primary(){return Crew.primary(current())}
  async function hydrate(){
    const id=targetMemberId();
    if(!id){registry=Crew.defaultRegistry(null);return {ok:true,registry:current(),reason:'NO_AUTHENTICATED_LEARNER'}}
    if(loading)return loading;
    loading=(async()=>{
      try{
        const res=await fetch('/api/family/crew?member_id='+encodeURIComponent(id),{method:'GET',headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'});
        const body=await res.json().catch(()=>({}));
        if(!res.ok||!body?.crew)return {ok:false,reason:body?.reason||('FAMILY_CREW_HTTP_'+res.status),registry:current()};
        registry=Crew.normalizeRegistry(body.crew);
        window.dispatchEvent(new CustomEvent('readyset-crew-registry',{detail:current()}));
        return {ok:true,registry:current()};
      }catch(error){
        return {ok:false,reason:String(error?.message||error),registry:current()};
      }finally{loading=null}
    })();
    return loading;
  }
  async function update(input={}){
    const s=family(),id=targetMemberId();
    if(!s.authenticated||s.role!=='CHILD'||id!==s.member_id)return {ok:false,reason:'CREW_WRITE_CHILD_ONLY'};
    const res=await fetch('/api/family/crew/update',{
      method:'PATCH',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',
      body:JSON.stringify({member_id:id,...input})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok||!body?.crew)return {ok:false,reason:body?.reason||('FAMILY_CREW_UPDATE_HTTP_'+res.status)};
    registry=Crew.normalizeRegistry(body.crew);
    window.dispatchEvent(new CustomEvent('readyset-crew-registry',{detail:current()}));
    return {ok:true,registry:current()};
  }
  async function selectPrimary(character_id){return update({primary_companion_id:character_id})}
  async function rename(character_id,display_name){return update({rename:{character_id,display_name}})}

  window.ReadyCrewRegistry=Object.freeze({current,primary,hydrate,selectPrimary,rename,targetMemberId});
  window.addEventListener('readyset-family-registry',()=>hydrate().catch(()=>{}));
  window.addEventListener('readyset-family-session',()=>hydrate().catch(()=>{}));
  hydrate().catch(()=>{});
})();