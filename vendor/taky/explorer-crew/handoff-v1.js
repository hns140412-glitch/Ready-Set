(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewHandoff=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_HANDOFF_V1';
  const PARAM='crew_event';

  function b64urlEncode(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'utf8').toString('base64url');
    const bytes=new TextEncoder().encode(text);
    let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function b64urlDecode(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
    const s=text.replace(/-/g,'+').replace(/_/g,'/');const pad=s+'='.repeat((4-s.length%4)%4);
    const binary=atob(pad),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function pack(event){
    const payload={v:1,at:new Date().toISOString(),event};
    return b64urlEncode(JSON.stringify(payload));
  }
  function unpack(token){
    try{
      const x=JSON.parse(b64urlDecode(token));
      if(x?.v!==1||!x.event)return null;
      return x;
    }catch{return null}
  }
  function appendToUrl(rawUrl,event){
    const url=new URL(rawUrl,typeof location!=='undefined'?location.href:'http://localhost/');
    url.searchParams.set(PARAM,pack(event));
    return url.href;
  }
  function readFromUrl(rawUrl){
    const url=new URL(rawUrl,typeof location!=='undefined'?location.href:'http://localhost/');
    return unpack(url.searchParams.get(PARAM)||'');
  }
  function clearFromUrl(rawUrl){
    const url=new URL(rawUrl,typeof location!=='undefined'?location.href:'http://localhost/');
    url.searchParams.delete(PARAM);
    return url.href;
  }
  return Object.freeze({VERSION,PARAM,pack,unpack,appendToUrl,readFromUrl,clearFromUrl});
});
