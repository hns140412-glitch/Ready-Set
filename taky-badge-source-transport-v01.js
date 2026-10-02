(() => {
  'use strict';

  const VERSION='TAKY_BADGE_SOURCE_TRANSPORT_V1';

  async function prepareSignedObservation(appId,observation){
    const identity=globalThis.TakyBadgeSourceIdentityV1;
    const signer=globalThis.TakyBadgeSourceSignerV1;
    if(!identity)throw new Error('BADGE_SOURCE_TRANSPORT_IDENTITY_HELPER_REQUIRED');
    if(!signer)throw new Error('BADGE_SOURCE_TRANSPORT_SIGNER_HELPER_REQUIRED');
    if(!observation||observation.app_id!==appId)
      throw new Error('BADGE_SOURCE_TRANSPORT_APP_ID_MISMATCH');

    const material=await identity.signingMaterial(appId);
    const signed=await signer.signObservation(observation,{
      privateKey:material.privateKey,
      keyId:material.keyId
    });

    return Object.freeze({
      contract_version:VERSION,
      method:'POST',
      headers:Object.freeze({
        'content-type':'application/json',
        ...signed.headers
      }),
      body:JSON.stringify(observation),
      app_id:appId,
      installation_id:material.installationId,
      key_id:material.keyId,
      network_sent:false
    });
  }

  globalThis.TakyBadgeSourceTransportV1=Object.freeze({
    version:VERSION,
    prepareSignedObservation
  });
})();
