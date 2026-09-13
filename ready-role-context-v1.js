(() => {
  'use strict';
  if(window.ReadyRoleContextV1)return;
  const VERSION='2026.09.13-role-context-v1.1';
  const KEY='readyset_active_role_v1';
  const readIdentity=()=>{try{return window.ReadyIdentityV1?.get?.()||JSON.parse(localStorage.getItem('readyset_identity_v1')||'{}')||{}}catch{return {}}};
  const valid=v=>v==='parent'||v==='child';
  function stored(){const v=localStorage.getItem(KEY);return valid(v)?v:null}
  function derived(){
    const url=new URL(location.href),explicit=url.searchParams.get('role');
    if(valid(explicit))return explicit;
    const saved=stored();if(saved)return saved;
    const i=readIdentity();return i?.operator?.role==='GUARDIAN'||i?.setupMode==='GUARDIAN_FOR_CHILD'?'parent':'child';
  }
  function sync({force=false}={}){
    const role=derived(),url=new URL(location.href),current=url.searchParams.get('role');
    localStorage.setItem(KEY,role);
    if(force||!valid(current)){url.searchParams.set('role',role);history.replaceState(history.state,'',url)}
    document.documentElement.dataset.readyRole=role.toUpperCase();
    return role;
  }
  function switchRole(role,{reload=true}={}){
    if(!valid(role))throw Error('INVALID_READY_ROLE');
    localStorage.setItem(KEY,role);const url=new URL(location.href);url.searchParams.set('role',role);
    if(reload)location.assign(url.href);else{history.replaceState(history.state,'',url);document.documentElement.dataset.readyRole=role.toUpperCase()}
    return role;
  }
  function activateIdentityRole({reload=true}={}){
    const i=readIdentity(),role=i?.operator?.role==='GUARDIAN'||i?.setupMode==='GUARDIAN_FOR_CHILD'?'parent':'child';
    return switchRole(role,{reload});
  }
  const role=sync();
  window.ReadyRoleContextV1={version:VERSION,current:()=>valid(new URL(location.href).searchParams.get('role'))?new URL(location.href).searchParams.get('role'):derived(),isParent:()=>derived()==='parent',isChild:()=>derived()==='child',sync,switchRole,activateIdentityRole};
})();
