(function(root){
  'use strict';

  const VERSION='READY_SPECIALIST_TARGETS_V01';
  const LEGACY_DEFAULTS=Object.freeze({
    hideSeekLegacy:'https://dainty-froyo-a6e427.netlify.app',
    snapPopLegacy:'https://cheerful-pothos-d1c3ee.netlify.app'
  });

  function safeHttpUrl(value){
    if(!value)return null;
    try{
      const url=new URL(String(value));
      if(!['http:','https:'].includes(url.protocol))return null;
      return url.href.replace(/\/$/,'');
    }catch{return null}
  }

  const bootstrap=(root.__READY_SPECIALIST_TARGETS__&&typeof root.__READY_SPECIALIST_TARGETS__==='object')
    ?root.__READY_SPECIALIST_TARGETS__
    :{};

  const config=Object.freeze({
    hideSeekLegacy:safeHttpUrl(bootstrap.hideSeekLegacy)||LEGACY_DEFAULTS.hideSeekLegacy,
    snapPopLegacy:safeHttpUrl(bootstrap.snapPopLegacy)||LEGACY_DEFAULTS.snapPopLegacy,
    hideSeekV2:safeHttpUrl(bootstrap.hideSeekV2),
    snapPopV2:safeHttpUrl(bootstrap.snapPopV2)
  });

  function resolve(app,{preferV2=true}={}){
    if(app==='hide-seek'){
      const v2=preferV2?config.hideSeekV2:null;
      return Object.freeze({
        app,
        url:v2||config.hideSeekLegacy,
        target_kind:v2?'EXPLICIT_V2':'LEGACY_FALLBACK',
        learning_context_contract:v2?'READY_LEARNING_CONTEXT_V1':'UNVERIFIED_CONSUMER'
      });
    }
    if(app==='snap-pop'){
      const v2=preferV2?config.snapPopV2:null;
      return Object.freeze({
        app,
        url:v2||config.snapPopLegacy,
        target_kind:v2?'EXPLICIT_V2':'LEGACY_FALLBACK',
        learning_context_contract:v2?'READY_LEARNING_CONTEXT_V1':'UNVERIFIED_CONSUMER'
      });
    }
    return null;
  }

  function trustedOrigins(){
    const urls=[resolve('hide-seek')?.url,resolve('snap-pop')?.url].filter(Boolean);
    return [...new Set(urls.map(value=>{try{return new URL(value).origin}catch{return null}}).filter(Boolean))];
  }

  root.ReadySetSpecialistTargets=Object.freeze({
    version:VERSION,
    config:()=>({...config}),
    resolve,
    trustedOrigins
  });
})(typeof globalThis!=='undefined'?globalThis:this);
