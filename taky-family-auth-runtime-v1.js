(() => {
'use strict';
if (window.TakyFamilyAuthRuntimeV1) return;

const VERSION='2026.09.30-family-auth-runtime-v2';
let provider=null;

function clean(v){return typeof v==='string'?v.trim():''}

function assertProvider(next){
  if(!next||typeof next.getIdToken!=='function'||typeof next.getSession!=='function'||typeof next.getApiBaseUrl!=='function'){
    throw new Error('TAKY_CENTRAL_AUTH_PROVIDER_INVALID');
  }
  return next;
}

function registerProvider(next){
  provider=assertProvider(next);
  return {provider_id:String(next.id||'custom'),version:VERSION};
}

function registerCentralBearerProvider({apiBaseUrl,getIdToken,preferredFamilyId=null,fetchImpl=fetch}={}){
  if(typeof getIdToken!=='function'||typeof fetchImpl!=='function')throw new Error('TAKY_CENTRAL_BEARER_PROVIDER_INVALID');
  const base=new URL(String(apiBaseUrl||''),location.href);
  const local=['localhost','127.0.0.1'].includes(base.hostname);
  if((!local&&base.protocol!=='https:')||!base.href)throw new Error('TAKY_CENTRAL_HTTPS_REQUIRED');
  let cachedSession=null;
  return registerProvider({
    id:'taky-central-bearer-session-v1',
    getApiBaseUrl:async()=>base.href,
    getIdToken:async()=>{
      const token=clean(await getIdToken());
      if(token.length<16||token.length>8192)throw new Error('TAKY_GOOGLE_ID_TOKEN_REQUIRED');
      return token;
    },
    getSession:async()=>{
      if(cachedSession)return cachedSession;
      const token=clean(await getIdToken());
      if(token.length<16||token.length>8192)throw new Error('TAKY_GOOGLE_ID_TOKEN_REQUIRED');
      const endpoint=new URL('/api/family/session',base).href;
      const res=await fetchImpl(endpoint,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:'{}'});
      const body=await res.json().catch(()=>({ok:false,reason:'INVALID_FAMILY_SESSION_RESPONSE'}));
      if(!res.ok||body.ok===false)throw Object.assign(new Error(body.reason||('FAMILY_SESSION_HTTP_'+res.status)),{status:res.status,body});
      const families=Array.isArray(body.session?.families)?body.session.families:[];
      if(!families.length)throw new Error('ACTIVE_FAMILY_SESSION_REQUIRED');
      const wanted=clean(preferredFamilyId);
      const selected=wanted?families.find(f=>clean(f.family_id)===wanted):families.length===1?families[0]:null;
      if(!selected)throw new Error(wanted?'PREFERRED_FAMILY_NOT_AUTHORIZED':'FAMILY_SELECTION_REQUIRED');
      cachedSession={...body.session,family_id:clean(selected.family_id),self_member_id:clean(selected.self_member_id),authorized_member_ids:Array.isArray(selected.authorized_member_ids)?selected.authorized_member_ids.slice():[]};
      return cachedSession;
    }
  });
}

async function currentSession(){
  if(!provider)throw Object.assign(new Error('TAKY_CENTRAL_AUTH_PROVIDER_UNAVAILABLE'),{code:'TAKY_CENTRAL_AUTH_PROVIDER_UNAVAILABLE'});
  const session=await provider.getSession();
  if(!session||typeof session!=='object')throw new Error('TAKY_CENTRAL_SESSION_REQUIRED');
  const familyId=clean(session.family_id||session.familyId);
  if(!familyId)throw new Error('TAKY_CENTRAL_FAMILY_ID_REQUIRED');
  return {...session,family_id:familyId};
}

async function idToken(){
  if(!provider)throw Object.assign(new Error('TAKY_CENTRAL_AUTH_PROVIDER_UNAVAILABLE'),{code:'TAKY_CENTRAL_AUTH_PROVIDER_UNAVAILABLE'});
  const token=clean(await provider.getIdToken());
  if(token.length<16||token.length>8192)throw new Error('TAKY_GOOGLE_ID_TOKEN_REQUIRED');
  return token;
}

async function installFamilyRuntime(){
  const session=await currentSession();
  const baseUrl=clean(await provider.getApiBaseUrl());
  if(!baseUrl)throw new Error('TAKY_CENTRAL_API_BASE_URL_REQUIRED');
  const u=new URL(baseUrl,location.href);
  const local=['localhost','127.0.0.1'].includes(u.hostname);
  if(!local&&u.protocol!=='https:')throw new Error('TAKY_CENTRAL_HTTPS_REQUIRED');

  window.TAKY_FAMILY_RUNTIME=Object.freeze({
    apiBaseUrl:u.href,
    getToken:idToken,
    getFamilyId:async()=>session.family_id,
    currentSession
  });
  document.documentElement.dataset.takyCentralAuth='BOUND';
  try{window.dispatchEvent(new CustomEvent('taky-central-auth-ready',{detail:{family_id:session.family_id}}))}catch{}
  return {state:'BOUND',family_id:session.family_id,apiBaseUrl:u.href};
}

function clear(){
  provider=null;
  try{delete window.TAKY_FAMILY_RUNTIME}catch{window.TAKY_FAMILY_RUNTIME=undefined}
  document.documentElement.dataset.takyCentralAuth='UNBOUND';
}

window.TakyFamilyAuthRuntimeV1={
  version:VERSION,
  registerProvider,
  registerCentralBearerProvider,
  installFamilyRuntime,
  currentSession,
  idToken,
  clear,
  status:()=>({provider_available:!!provider,state:document.documentElement.dataset.takyCentralAuth||'UNBOUND'})
};
})();