(() => {
'use strict';
if (window.TakyFamilyAuthRuntimeV1) return;

const VERSION='2026.09.30-family-auth-runtime-v1';
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
  installFamilyRuntime,
  currentSession,
  idToken,
  clear,
  status:()=>({provider_available:!!provider,state:document.documentElement.dataset.takyCentralAuth||'UNBOUND'})
};
})();