(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_IDENTITY_CONSISTENCY_V01';

  const CONTRACT=Object.freeze({
    identity_authority:'SOURCE_PHOTO',
    protected:Object.freeze([
      'recognizable_identity',
      'face_shape',
      'hairstyle_cues',
      'age_impression',
      'natural_body_proportions'
    ]),
    direction_may_change:Object.freeze([
      'expression',
      'pose',
      'gesture',
      'motion_energy',
      'atmosphere',
      'exploration_detail'
    ]),
    direction_must_not_change:Object.freeze([
      'person_identity',
      'age_band',
      'facial_structure',
      'sensitive_traits'
    ]),
    forbidden:Object.freeze([
      'identity_substitution',
      'sensitive_trait_inference',
      'face_obstruction',
      'franchise_character_imitation',
      'text_logo_watermark'
    ]),
    candidate_rule:'SAME_CHILD_DIFFERENT_DIRECTION',
    correction_rule:'SOURCE_PHOTO_OVERRIDES_GENERATED_CANDIDATE'
  });

  function candidateContract(direction){
    if(!direction?.slot||!direction?.direction?.id)throw new Error('CHARACTER_IDENTITY_DIRECTION_REQUIRED');
    return Object.freeze({
      contract_version:VERSION,
      slot:String(direction.slot),
      provenance:String(direction.source||''),
      direction_id:String(direction.direction.id),
      identity_authority:CONTRACT.identity_authority,
      candidate_rule:CONTRACT.candidate_rule
    });
  }

  function generationContract(directions=[]){
    if(!Array.isArray(directions)||directions.length!==3)throw new Error('CHARACTER_IDENTITY_THREE_DIRECTIONS_REQUIRED');
    return Object.freeze({
      contract_version:VERSION,
      identity_authority:CONTRACT.identity_authority,
      protected:[...CONTRACT.protected],
      direction_may_change:[...CONTRACT.direction_may_change],
      direction_must_not_change:[...CONTRACT.direction_must_not_change],
      forbidden:[...CONTRACT.forbidden],
      candidate_rule:CONTRACT.candidate_rule,
      correction_rule:CONTRACT.correction_rule,
      candidates:directions.map(candidateContract)
    });
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    CONTRACT,
    candidateContract,
    generationContract
  });

  root.CharacterVisualIdentityConsistency=api;
})(typeof globalThis!=='undefined'?globalThis:this);
