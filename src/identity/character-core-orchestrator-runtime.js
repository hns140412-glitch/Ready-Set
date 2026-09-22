(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_CORE_ORCHESTRATOR_V01';

  function create(options={}){
    const directionApi=options.directionApi||root.CharacterVisualIdDirection||root.ReadyCharacterDirection;
    const jobApi=options.jobApi||root.CharacterVisualIdGenerationJob||root.ReadyCharacterGenerationJob;
    const assetKeysApi=options.assetKeysApi||root.CharacterVisualIdAssetKeys||root.ReadyCharacterAssetKeys;
    const identityApi=options.identityApi||root.CharacterVisualIdentityConsistency||null;
    const itemApi=options.itemApi||root.CharacterExplorationSignatureItem||null;
    if(!directionApi||!jobApi||!assetKeysApi||!identityApi||!itemApi)throw new Error('CHARACTER_CORE_DEPENDENCY_MISSING');

    function ensureProfile(profile){
      if(!profile||typeof profile!=='object')throw new Error('CHARACTER_PROFILE_REQUIRED');
      if(!profile.sourcePhoto?.source_hash)throw new Error('CHARACTER_SOURCE_PHOTO_REQUIRED');
      profile.characterDirection=profile.characterDirection||directionApi.createState();
      return profile;
    }

    function begin(profile){
      const p=ensureProfile(profile);
      p.characterDirection=directionApi.createState();
      p.characterSignatureItem=null;
      p.characterGenerationJob=null;
      return {
        status:'ROUND_1',
        options:directionApi.firstRound(),
        profile:p
      };
    }

    function choose(profile,directionId,{memberScope,visualId}={}){
      const p=ensureProfile(profile);
      p.characterDirection=directionApi.select(p.characterDirection,directionId);

      if(p.characterDirection.status==='ROUND_2'){
        return {
          status:'ROUND_2',
          options:directionApi.secondRound(p.characterDirection.firstSelection),
          profile:p
        };
      }

      if(p.characterDirection.status==='READY_FOR_CANDIDATE_GENERATION'){
        const directionIds=[
          p.characterDirection.firstSelection,
          p.characterDirection.secondSelection,
          p.characterDirection.autoContrast
        ].filter(Boolean);
        p.characterSignatureItem=itemApi.createState(directionIds);
        return {
          status:'ITEM_SELECTION',
          options:p.characterSignatureItem.offered.map(id=>itemApi.item(id)),
          profile:p
        };
      }

      throw new Error('CHARACTER_CORE_UNEXPECTED_DIRECTION_STATE');
    }

    function chooseItem(profile,itemId,{memberScope,visualId}={}){
      const p=ensureProfile(profile);
      if(!p.characterSignatureItem)throw new Error('CHARACTER_SIGNATURE_ITEM_STATE_REQUIRED');
      p.characterSignatureItem=itemApi.select(p.characterSignatureItem,itemId);

      const resolvedVisualId=String(visualId||p.visualId||'').trim();
      const resolvedMemberScope=String(memberScope||'').trim();
      if(!resolvedVisualId)throw new Error('CHARACTER_VISUAL_ID_REQUIRED');
      if(!resolvedMemberScope)throw new Error('CHARACTER_MEMBER_SCOPE_REQUIRED');

      p.visualId=resolvedVisualId;
      const job=jobApi.create({
        visual_id:resolvedVisualId,
        member_scope:resolvedMemberScope,
        source_hash:p.sourcePhoto.source_hash,
        directions:p.characterDirection.candidates
      });
      job.assets={...job.assets,...assetKeysApi.keys(resolvedMemberScope,resolvedVisualId)};
      p.characterGenerationJob=job;
      p.characterIdentityContract=identityApi.generationContract(p.characterDirection.candidates);
      p.characterSignatureItemContract=itemApi.generationContract(p.characterSignatureItem.selected);

      return {
        status:'READY_FOR_CANDIDATE_GENERATION',
        job,
        identityContract:p.characterIdentityContract,
        signatureItemContract:p.characterSignatureItemContract,
        profile:p
      };
    }

    function generationPayload(profile){
      const p=ensureProfile(profile);
      const job=p.characterGenerationJob;
      if(!job)throw new Error('CHARACTER_GENERATION_JOB_REQUIRED');
      return Object.freeze({
        contract_version:job.contract_version,
        job_id:job.job_id,
        visual_id:job.visual_id,
        member_scope:job.member_scope,
        source_hash:job.source_hash,
        identity_contract:p.characterIdentityContract||identityApi.generationContract(p.characterDirection.candidates),
        signature_item:p.characterSignatureItemContract||itemApi.generationContract(p.characterSignatureItem?.selected),
        directions:job.directions.map(x=>({
          slot:x.slot,
          source:x.source,
          direction_id:x.direction_id
        }))
      });
    }

    return Object.freeze({begin,choose,chooseItem,generationPayload});
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    create
  });
  root.CharacterVisualIdCoreOrchestrator=api;
  root.ReadyCharacterCoreOrchestrator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
