import { oauthLogin, handleAuthCallback, getSettings } from '@netlify/identity';

let settings=null;
let settingsError=null;
let callbackResult=null;
let callbackError=null;

function publicStatus(){
  return Object.freeze({
    configured:!!settings,
    google_enabled:!!settings?.providers?.google,
    disable_signup:!!settings?.disableSignup,
    callback_type:callbackResult?.type||null,
    settings_error:settingsError,
    callback_error:callbackError
  });
}

async function init(){
  try{
    settings=await getSettings();
  }catch(err){
    settingsError=String(err?.message||err||'IDENTITY_SETTINGS_UNAVAILABLE');
  }
  try{
    callbackResult=await handleAuthCallback();
  }catch(err){
    callbackError=String(err?.message||err||'IDENTITY_CALLBACK_FAILED');
  }
  const status=publicStatus();
  globalThis.dispatchEvent?.(new CustomEvent('readyset-identity-ready',{detail:status}));
  if(callbackResult){
    globalThis.dispatchEvent?.(new CustomEvent('readyset-identity-callback',{detail:{
      type:callbackResult.type||null,
      has_user:!!callbackResult.user
    }}));
  }
  return status;
}

function loginGoogle(){
  if(!settings)return {ok:false,reason:'IDENTITY_NOT_CONFIGURED'};
  if(!settings.providers?.google)return {ok:false,reason:'GOOGLE_PROVIDER_NOT_ENABLED'};
  oauthLogin('google');
}

const ready=init();
globalThis.ReadyNetlifyIdentity=Object.freeze({
  version:'READY_NETLIFY_IDENTITY_BROWSER_V01',
  ready,
  status:publicStatus,
  loginGoogle
});
