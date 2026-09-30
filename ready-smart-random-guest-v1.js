(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadySmartRandomGuestV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function choose({all=[],main=null,history=[],random=Math.random}={}){
    const candidates=all.filter(x=>x&&x!==main);
    if(!candidates.length)return null;
    const recent=new Set(history.slice(-1));
    let pool=candidates.filter(x=>!recent.has(x));if(!pool.length)pool=candidates;
    const counts=Object.fromEntries(candidates.map(id=>[id,history.filter(x=>x===id).length]));
    const min=Math.min(...pool.map(id=>counts[id]??0));
    const least=pool.filter(id=>(counts[id]??0)===min);
    const idx=Math.min(least.length-1,Math.floor(Math.max(0,Math.min(0.999999,Number(random()))) * least.length));
    return least[idx]||pool[0];
  }
  return Object.freeze({choose});
});
