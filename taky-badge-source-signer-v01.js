(() => {
  'use strict';

  const VERSION='TAKY_BADGE_SOURCE_SIGNER_V1';

  function canonicalMessage(observation){
    if(!observation||typeof observation!=='object')throw new Error('BADGE_SOURCE_SIGNER_OBSERVATION_REQUIRED');
    const fields=[
      observation.contract_version,
      observation.event_id,
      observation.app_id,
      observation.event_family,
      observation.behavior_code,
      observation.occurred_at,
      observation.source_contract_id,
      observation.evidence_ref,
      observation.explicit_child_action===true?'true':'false'
    ];
    if(fields.some(v=>v===undefined||v===null||String(v).trim()===''))
      throw new Error('BADGE_SOURCE_SIGNER_CANONICAL_FIELDS_REQUIRED');
    return fields.map(v=>String(v).trim()).join('\n');
  }

  function bytesToBase64Url(bytes){
    let binary='';
    for(const value of bytes)binary+=String.fromCharCode(value);
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  async function signObservation(observation,{privateKey,keyId}={}){
    if(!globalThis.crypto?.subtle)throw new Error('BADGE_SOURCE_SIGNER_WEBCRYPTO_REQUIRED');
    if(!privateKey)throw new Error('BADGE_SOURCE_SIGNER_PRIVATE_KEY_REQUIRED');
    if(!keyId)throw new Error('BADGE_SOURCE_SIGNER_KEY_ID_REQUIRED');
    const data=new TextEncoder().encode(canonicalMessage(observation));
    const signature=new Uint8Array(await crypto.subtle.sign(
      {name:'ECDSA',hash:'SHA-256'},
      privateKey,
      data
    ));
    return Object.freeze({
      keyId:String(keyId),
      signature:bytesToBase64Url(signature),
      headers:Object.freeze({
        'x-taky-badge-key-id':String(keyId),
        'x-taky-badge-signature':bytesToBase64Url(signature)
      })
    });
  }

  globalThis.TakyBadgeSourceSignerV1=Object.freeze({
    version:VERSION,
    canonicalMessage,
    signObservation
  });
})();
