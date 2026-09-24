(function(root){
  'use strict';

  const VERSION='CHARACTER_FORMATION_ASSET_RUNTIME_V01';
  const DEFAULT_MANIFEST_URL='./assets/character-formation/asset-manifest.json';

  const normalizePath=value=>{
    const path=String(value||'').trim();
    if(!path)return '';
    return path.startsWith('./')||path.startsWith('/')?path:'./'+path;
  };

  function create(options={}){
    const manifestUrl=options.manifestUrl||DEFAULT_MANIFEST_URL;
    const fetcher=options.fetcher||(typeof root.fetch==='function'?root.fetch.bind(root):null);
    let manifest=null;
    let loading=null;
    let lastError=null;
    const listeners=new Set();

    function snapshot(){
      return Object.freeze({
        state:manifest?'READY':lastError?'ERROR':loading?'LOADING':'IDLE',
        version:manifest?.version||null,
        error:lastError?String(lastError.message||lastError):null
      });
    }

    function emit(){
      const value=snapshot();
      listeners.forEach(fn=>{try{fn(value);}catch{}});
      return value;
    }

    function validate(next){
      if(!next||next.status!=='HARD_LOCK')throw new Error('CHARACTER_ASSET_MANIFEST_NOT_HARD_LOCKED');
      if(next.runtime_rule!=='DECOMPOSED_ASSETS_ONLY_NO_FULL_SCREEN_MOCKUP_CROP'){
        throw new Error('CHARACTER_ASSET_RUNTIME_RULE_INVALID');
      }
      if(!next.asset_files||typeof next.asset_files!=='object')throw new Error('CHARACTER_ASSET_FILES_MISSING');
      return next;
    }

    function path(group,key){
      return normalizePath(manifest?.asset_files?.[group]?.[key]);
    }

    function markRoot(scope=document){
      const rootEl=scope?.closest?.('#characterSetupView')||scope?.querySelector?.('#characterSetupView')||document.querySelector?.('#characterSetupView');
      if(!rootEl)return;
      const missing=rootEl.querySelectorAll?.('[data-cf-asset-state="missing"]').length||0;
      const pending=rootEl.querySelectorAll?.('[data-cf-asset-state="undeclared"]').length||0;
      rootEl.dataset.cfAssetManifest=manifest?'ready':lastError?'error':loading?'loading':'idle';
      rootEl.dataset.cfAssetMissing=String(missing+pending);
    }

    function bindImage(el,src){
      if(!src){
        el.hidden=true;
        el.removeAttribute('src');
        el.dataset.cfAssetState='undeclared';
        return;
      }
      el.hidden=false;
      el.dataset.cfAssetState='loading';
      el.onload=()=>{
        el.hidden=false;
        el.dataset.cfAssetState='ready';
        el.closest?.('.assetMissing')?.classList?.remove('assetMissing');
        markRoot(el);
      };
      el.onerror=()=>{
        el.hidden=true;
        el.dataset.cfAssetState='missing';
        el.parentElement?.classList?.add('assetMissing');
        markRoot(el);
      };
      if(el.getAttribute('src')!==src)el.setAttribute('src',src);
    }

    function bindBackground(el,src){
      if(!src){
        el.style.removeProperty('--cf-asset-url');
        el.dataset.cfAssetState='undeclared';
        return;
      }
      el.dataset.cfAssetState='loading';
      const probe=new Image();
      probe.onload=()=>{
        el.style.setProperty('--cf-asset-url','url("'+src.replace(/"/g,'%22')+'")');
        el.dataset.cfAssetState='ready';
        markRoot(el);
      };
      probe.onerror=()=>{
        el.style.removeProperty('--cf-asset-url');
        el.dataset.cfAssetState='missing';
        markRoot(el);
      };
      probe.src=src;
    }

    function bindElement(el,group,key){
      if(!el)return false;
      if(group)el.dataset.cfAssetGroup=group;
      if(key)el.dataset.cfAssetKey=key;
      const g=String(el.dataset.cfAssetGroup||group||'');
      const k=String(el.dataset.cfAssetKey||key||'');
      const src=path(g,k);
      if(el.tagName==='IMG')bindImage(el,src);
      else bindBackground(el,src);
      markRoot(el);
      return Boolean(src);
    }

    function bind(scope=document){
      if(!manifest)return false;
      const nodes=scope?.matches?.('[data-cf-asset-group][data-cf-asset-key]')
        ? [scope]
        : [...(scope?.querySelectorAll?.('[data-cf-asset-group][data-cf-asset-key]')||[])];
      nodes.forEach(el=>bindElement(el));
      markRoot(scope);
      return true;
    }

    async function load(){
      if(manifest)return manifest;
      if(loading)return loading;
      if(!fetcher){
        lastError=new Error('CHARACTER_ASSET_FETCH_UNAVAILABLE');
        emit();
        return null;
      }
      loading=(async()=>{
        try{
          const response=await fetcher(manifestUrl,{cache:'no-store'});
          if(!response?.ok)throw new Error('CHARACTER_ASSET_MANIFEST_HTTP_'+String(response?.status||'ERROR'));
          const next=validate(await response.json());
          manifest=Object.freeze(next);
          lastError=null;
          bind(document);
          return manifest;
        }catch(error){
          lastError=error;
          markRoot(document);
          return null;
        }finally{
          loading=null;
          emit();
        }
      })();
      emit();
      return loading;
    }

    function onChange(fn){
      if(typeof fn!=='function')return ()=>{};
      listeners.add(fn);
      return ()=>listeners.delete(fn);
    }

    return Object.freeze({
      version:VERSION,
      load,
      bind,
      bindElement,
      path,
      manifest:()=>manifest,
      snapshot,
      onChange
    });
  }

  root.CharacterFormationAssetRuntime=Object.freeze({version:VERSION,create});
})(typeof globalThis!=='undefined'?globalThis:this);
