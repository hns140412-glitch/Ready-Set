import { getDeployStore, getStore } from '@netlify/blobs';
import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import authCore from './ready-family-auth-core.js';
import memberCore from './family-member-registry-core.js';
import worldCore from './family-world-state-core.js';
import World from '../../vendor/taky/world-state.js';

function store(){
  const context=globalThis.Netlify?.context?.deploy?.context;
  return context==='production'
    ? getStore('taky-family-world-v1',{consistency:'strong'})
    : getDeployStore('taky-family-world-v1');
}
async function readState(s,familyId,memberId){
  const raw=await s.get(worldCore.keyFor(familyId,memberId));
  if(!raw)return World.blank(memberId);
  try{return World.normalize(typeof raw==='string'?JSON.parse(raw):raw)}catch{return World.blank(memberId)}
}
async function writeState(s,familyId,memberId,state){
  const normalized=World.normalize({...state,member_id:memberId});
  await s.set(worldCore.keyFor(familyId,memberId),JSON.stringify(normalized));
  return normalized;
}

export default async function handler(req){
  const actorUser=await getUser();
  const actor=authCore.familySessionFromIdentityUser(actorUser||{});
  if(!actor.ok)return Response.json({ok:false,reason:actor.reason},{status:actor.status||401});

  const url=new URL(req.url);
  const targetId=String(url.searchParams.get('member_id')||actor.session.member_id||'').trim();
  const s=store();

  if(req.method==='GET'){
    const users=await admin.listUsers({page:1,perPage:1000});
    const family=memberCore.registryForSession(actor.session,users||[]);
    if(!family.ok)return Response.json({ok:false,reason:family.reason},{status:family.status||403});
    const allowed=worldCore.canRead(actor.session,targetId,family.registry.members);
    if(!allowed.ok)return Response.json({ok:false,reason:allowed.reason},{status:allowed.status||403});
    const state=await readState(s,actor.session.family_id,targetId);
    return Response.json({ok:true,state});
  }

  if(req.method==='PATCH'){
    try{verifyRequestOrigin(req)}catch{return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403})}
    const allowed=worldCore.canWrite(actor.session,targetId);
    if(!allowed.ok)return Response.json({ok:false,reason:allowed.reason},{status:allowed.status||403});
    let body={}; try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
    const current=await readState(s,actor.session.family_id,targetId);
    const applied=worldCore.applyOperation(current,body.operation||body);
    if(!applied.ok)return Response.json({ok:false,reason:applied.reason},{status:400});
    const state=await writeState(s,actor.session.family_id,targetId,applied.state);
    return Response.json({ok:true,state,reason:applied.reason||'UPDATED'});
  }

  return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
}
export const config={path:'/api/family/world-state'};
