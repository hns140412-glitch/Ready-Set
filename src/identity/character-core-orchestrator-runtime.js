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
      p.characterSignatureItem=itemApi.createState();
      p.characterGenerationJob=null;
      return {
        status:'ITEM_SELECTION',
        options:p.characterSignatureItem.offered.map(id=>itemApi.item(id)),
        profile:p
      };
    }

    function chooseItem(profile,itemId){
      const p=ensureProfile(profile);
      if(!p.characterSignatureItem||!['ITEM_SELECTION','ITEM_SELECTED'].includes(p.characterSignatureItem.status)){
        p.characterSignatureItem=itemApi.createState();
      }
      if(p.characterSignatureItem.status==='ITEM_SELECTED'){
        p.characterSignatureItem={...itemApi.createState(),offered:[...p.characterSignatureItem.offered]};
      }
      p.characterSignatureItem=itemApi.select(p.characterSignatureItem,itemId);
      return {
        status:'ITEM_SELECTED',
        options:p.characterSignatureItem.offered.map(id=>itemApi.item(id)),
        selected:p.characterSignatureItem.selected,
        profile:p
      };
    }

    function continueAfterItem(profile){
      const p=ensureProfile(profile);
      if(p.characterSignatureItem?.status!=='ITEM_SELECTED')throw new Error('CHARACTER_SIGNATURE_ITEM_SELECTION_REQUIRED');
      p.characterDirection=directionApi.createState();
      return {
        status:'ROUND_1',
        options:directionApi.firstRound(),
        profile:p
      };
    }

    function choose(profile,directionId,{memberScope,visualId}={}){
      const p=ensureProfile(profile);
      if(p.characterSignatureItem?.status!=='ITEM_SELECTED')throw new Error('CHARACTER_SIGNATURE_ITEM_REQUIRED_BEFORE_DIRECTION');
      p.characterDirection=directionApi.select(p.characterDirection,directionId);

      if(p.characterDirection.status==='ROUND_2'){
        return {
          status:'ROUND_2',
          options:directionApi.secondRound(p.characterDirection.firstSelection),
          profile:p
        };
      }

      if(p.characterDirection.status==='READY_FOR_CANDIDATE_GENERATION'){
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

      throw new Error('CHARACTER_CORE_UNEXPECTED_DIRECTION_STATE');
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

    return Object.freeze({begin,chooseItem,continueAfterItem,choose,generationPayload});
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    create
  });
  root.CharacterVisualIdCoreOrchestrator=api;
  root.ReadyCharacterCoreOrchestrator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
