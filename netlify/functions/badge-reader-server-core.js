'use strict';
const familyCore=require('./ready-family-auth-core.js');
const {createFamilyBadgeReader}=require('./_taky-badge/badge-family-read-access.js');
const {createCasAwardLedger}=require('./_taky-badge/badge-award-ledger-cas-store.js');

const TIER_ORDER=Object.freeze(['GREEN','BLUE','RED','GOLD','PLATINUM']);
const BINDING_CONTRACT='TAKY_APPROVED_BADGE_GATE_BINDINGS_V1';
const clean=v=>typeof v==='string'?v.trim():'';
const deny=(reason,status=403)=>({ok:false,reason,status});

function decodeSigningKey(value){
  const raw=clean(value);
  if(!raw)return null;
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(raw))return null;
  let buf;
  try{buf=Buffer.from(raw,'base64')}catch{return null}
  if(buf.length<32||buf.toString('base64').replace(/=+$/,'')!==raw.replace(/=+$/,''))return null;
  return buf;
}

function normalizeStore(store){
  if(!store||typeof store.getWithMetadata!=='function'||typeof store.set!=='function')
    throw Error('NETLIFY_BLOB_STORE_REQUIRED');
  return {
    async getWithMetadata(key,options={}){
      const result=await store.getWithMetadata(key,{...options,consistency:'strong',type:'text'});
      return result===null?{data:null,etag:null}:result;
    },
    set:(key,value,options)=>store.set(key,value,options)
  };
}

function createBadgeReadService({currentUser,listUsers,store,signingKeyBase64,catalog}={}){
  if(!currentUser||typeof listUsers!=='function'||!catalog||!Array.isArray(catalog.entries))
    throw Error('BADGE_READER_SERVER_CAPABILITIES_REQUIRED');
  const mapped=familyCore.familySessionFromIdentityUser(currentUser);
  if(!mapped.ok)return {ok:false,reason:mapped.reason,status:mapped.status||403};
  const session=mapped.session;
  if(!['PARENT','CHILD'].includes(session.role))
    return deny('BADGE_READ_ROLE_NOT_AUTHORIZED',403);

  async function memberById(memberId){
    let users;
    try{users=await listUsers()}catch{return null}
    if(!Array.isArray(users))return null;
    const user=users.find(x=>clean(x?.id)===memberId);
    if(!user)return null;
    const m=familyCore.familySessionFromIdentityUser(user);
    if(!m.ok||m.session.role!=='CHILD')return null;
    return {
      identity_verified:true,member_id:m.session.member_id,role:'CHILD',
      family_id:m.session.family_id
    };
  }

  async function targetChild(requestedChild){
    const requested=clean(requestedChild);
    const child=session.role==='CHILD'?session.member_id:requested;
    if(!child)return deny('TARGET_CHILD_REQUIRED',400);
    if(session.role==='CHILD'&&requested&&requested!==session.member_id)
      return deny('CHILD_MAY_ONLY_READ_OWN_BADGES',403);
    const member=await memberById(child);
    if(!member||member.family_id!==session.family_id)
      return deny('VERIFIED_CHILD_FAMILY_MEMBERSHIP_REQUIRED',403);
    return {ok:true,child_id:child,family_id:session.family_id};
  }

  function sourceFor(scope){
    const key=decodeSigningKey(signingKeyBase64);
    if(!key)return {ok:false,reason:'BADGE_LEDGER_SIGNING_KEY_NOT_CONFIGURED',status:503};
    let ledger;
    try{
      ledger=createCasAwardLedger({
        store:normalizeStore(store),family_id:scope.family_id,signingKey:key,
        // This service is read-only. Even if a caller somehow obtained the
        // returned ledger object, writes remain impossible without real owner capabilities.
        verifyDecision:async()=>({ok:false}),
        isBadgeActive:async()=>false
      });
    }catch{return {ok:false,reason:'BADGE_LEDGER_SOURCE_UNAVAILABLE',status:503}}
    return {ok:true,source:ledger.source};
  }

  async function progress({badge_id,child_id}={}){
    const badge=clean(badge_id);
    if(!badge)return deny('BADGE_ID_REQUIRED',400);
    const scope=await targetChild(child_id);
    if(!scope.ok)return scope;
    const opened=sourceFor(scope);
    if(!opened.ok)return opened;
    const reader=createFamilyBadgeReader({
      resolveServerSession:async()=>session,
      lookupIdentityMember:memberById,
      openFamilyLedgerSource:async()=>opened.source
    });
    const result=await reader.getProgress(null,{
      child_id:scope.child_id,badge_id:badge,tier_order:TIER_ORDER
    });
    return result.ok?{...result,status:200}:{...result,status:403};
  }

  async function bindings({badge_ids,child_id}={}){
    const ids=[...new Set((Array.isArray(badge_ids)?badge_ids:[]).map(clean).filter(Boolean))];
    if(!ids.length||ids.length>20)return deny('BADGE_ID_LIST_REQUIRED',400);
    const scope=await targetChild(child_id);
    if(!scope.ok)return scope;
    const byId=new Map(catalog.entries.map(x=>[clean(x.badge_id),x]));
    return {
      ok:true,status:200,contract:BINDING_CONTRACT,
      family_id:scope.family_id,child_id:scope.child_id,
      catalog_version:catalog.version||null,
      bindings:ids.map(badge_id=>{
        const x=byId.get(badge_id);
        return {
          badge_id,
          approved:x?.approved===true,
          runtime_active:x?.runtime_active===true
        };
      })
    };
  }

  return Object.freeze({ok:true,session,progress,bindings});
}

module.exports=Object.freeze({
  TIER_ORDER,BINDING_CONTRACT,decodeSigningKey,normalizeStore,createBadgeReadService
});