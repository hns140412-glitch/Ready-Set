(function(root){
  'use strict';

  const VERSION='READY_CHARACTER_REMOTE_ADAPTER_V01';

  function create(options={}){
    const fetchImpl=options.fetchImpl||root.fetch?.bind(root);
    if(!fetchImpl)throw new Error('CHARACTER_REMOTE_FETCH_UNAVAILABLE');

    async function json(path,init={}){
      const res=await fetchImpl(path,{credentials:'same-origin',...init,headers:{Accept:'application/json',...(init.headers||{})}});
      const body=await res.json().catch(()=>({}));
      if(!res.ok)return {ok:false,status:res.status,reason:body?.reason||('HTTP_'+res.status),body};
      return body;
    }

    async function uploadSource({visual_id,source_hash,data_url}={}){
      return json('/api/character/source',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id,source_hash,data_url})
      });
    }

    async function createJob(payload={}){
      return json('/api/character/job',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
    }

    async function getJob(visualId){
      return json('/api/character/job?visual_id='+encodeURIComponent(String(visualId||'')),{method:'GET'});
    }

    async function startGeneration({visual_id,slot}={}){
      return json('/api/character/generate',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id,slot})
      });
    }

    async function selectCandidate({visual_id,slot}={}){
      return json('/api/character/action',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id,action:'SELECT_CANDIDATE',slot})
      });
    }

    async function correctLikeness({visual_id}={}){
      return json('/api/character/correct',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id})
      });
    }

    async function lockMaster({visual_id}={}){
      return json('/api/character/master',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id})
      });
    }

    function assetUrl(visualId,slot){
      return '/api/character/asset?visual_id='+encodeURIComponent(String(visualId||''))+'&slot='+encodeURIComponent(String(slot||''));
    }

    return Object.freeze({uploadSource,createJob,getJob,startGeneration,selectCandidate,correctLikeness,lockMaster,assetUrl});
  }

  root.ReadyCharacterRemoteAdapter=Object.freeze({version:VERSION,create});
})(typeof globalThis!=='undefined'?globalThis:this);
