(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_REMOTE_ADAPTER_V01';

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

    async function reviewConsistency({visual_id}={}){
      return json('/api/character/consistency-review',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id})
      });
    }

    async function confirmSameIdentity({visual_id,accepted_same_identity=true,notes=null}={}){
      return json('/api/character/action',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id,action:'CONFIRM_SAME_IDENTITY',accepted_same_identity,notes})
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

    async function uploadDerivatives({visual_id,avatar_square_data_url,portrait_card_data_url}={}){
      return json('/api/character/derivatives',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id,avatar_square_data_url,portrait_card_data_url})
      });
    }

    async function generateMasterSheet({visual_id}={}){
      return json('/api/character/master-sheet',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({visual_id})
      });
    }

    function assetUrl(visualId,slot){
      return '/api/character/asset?visual_id='+encodeURIComponent(String(visualId||''))+'&slot='+encodeURIComponent(String(slot||''));
    }

    return Object.freeze({uploadSource,createJob,getJob,startGeneration,selectCandidate,reviewConsistency,confirmSameIdentity,correctLikeness,lockMaster,uploadDerivatives,generateMasterSheet,assetUrl});
  }

  const api=Object.freeze({version:VERSION,owner:'CHARACTER_VISUAL_ID',create});
  root.CharacterVisualIdRemoteAdapter=api;
  root.ReadyCharacterRemoteAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this);
