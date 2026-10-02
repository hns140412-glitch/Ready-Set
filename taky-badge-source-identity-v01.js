(() => {
  'use strict';

  const VERSION='TAKY_BADGE_SOURCE_IDENTITY_V1';
  const DB_NAME='taky-badge-source-identity-v1';
  const STORE_NAME='keys';
  const RECORD_KEY='installation';

  function openDb(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('BADGE_SOURCE_IDENTITY_DB_OPEN_FAILED'));
    });
  }

  async function getRecord(){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,'readonly');
        const request=tx.objectStore(STORE_NAME).get(RECORD_KEY);
        request.onsuccess=()=>resolve(request.result||null);
        request.onerror=()=>reject(request.error||new Error('BADGE_SOURCE_IDENTITY_READ_FAILED'));
      });
    }finally{db.close();}
  }

  async function putRecord(record){
    const db=await openDb();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,'readwrite');
        tx.objectStore(STORE_NAME).put(record,RECORD_KEY);
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||new Error('BADGE_SOURCE_IDENTITY_WRITE_FAILED'));
        tx.onabort=()=>reject(tx.error||new Error('BADGE_SOURCE_IDENTITY_WRITE_ABORTED'));
      });
    }finally{db.close();}
    return record;
  }

  function makeInstallationId(appId){
    if(!crypto.randomUUID)throw new Error('BADGE_SOURCE_IDENTITY_RANDOM_UUID_REQUIRED');
    return String(appId).toLowerCase()+'-'+crypto.randomUUID();
  }

  async function ensureIdentity(appId){
    if(!crypto?.subtle)throw new Error('BADGE_SOURCE_IDENTITY_WEBCRYPTO_REQUIRED');
    const existing=await getRecord();
    if(existing?.appId===appId&&existing?.privateKey&&existing?.publicKey&&existing?.installationId){
      return existing;
    }

    const pair=await crypto.subtle.generateKey(
      {name:'ECDSA',namedCurve:'P-256'},
      false,
      ['sign','verify']
    );
    const record={
      version:VERSION,
      appId,
      installationId:makeInstallationId(appId),
      privateKey:pair.privateKey,
      publicKey:pair.publicKey,
      createdAt:new Date().toISOString()
    };
    await putRecord(record);
    return record;
  }

  async function pairingPayload(appId){
    const identity=await ensureIdentity(appId);
    const publicJwk=await crypto.subtle.exportKey('jwk',identity.publicKey);
    return Object.freeze({
      contract_version:VERSION,
      app_id:identity.appId,
      installation_id:identity.installationId,
      public_jwk:publicJwk
    });
  }

  async function signingMaterial(appId){
    const identity=await ensureIdentity(appId);
    return Object.freeze({
      installationId:identity.installationId,
      privateKey:identity.privateKey
    });
  }

  globalThis.TakyBadgeSourceIdentityV1=Object.freeze({
    version:VERSION,
    ensureIdentity,
    pairingPayload,
    signingMaterial
  });
})();
