import { getStore } from '@netlify/blobs';
import { admin, getUser } from '@netlify/identity';
import serverCore from './badge-reader-server-core.js';
import catalog from './badge-gate-catalog-v1.js';

const {createBadgeReadService}=serverCore;

function store(){
  return getStore('taky-badge-award-ledger-v1');
}
async function allUsers(){
  const result=await admin.listUsers({page:1,perPage:1000});
  return Array.isArray(result)?result:Array.isArray(result?.users)?result.users:[];
}
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});

export default async function handler(req){
  if(req.method!=='GET')return json({ok:false,reason:'METHOD_NOT_ALLOWED'},405);
  let user;
  try{user=await getUser()}catch{return json({ok:false,reason:'IDENTITY_UNAVAILABLE'},503)}
  if(!user)return json({ok:false,reason:'UNAUTHENTICATED'},401);

  let service;
  try{
    service=createBadgeReadService({
      currentUser:user,listUsers:allUsers,store:store(),
      signingKeyBase64:process.env.TAKY_BADGE_LEDGER_SIGNING_KEY_BASE64,
      catalog
    });
  }catch{return json({ok:false,reason:'BADGE_READER_INITIALIZATION_FAILED'},503)}
  if(!service.ok)return json({ok:false,reason:service.reason},service.status||403);

  const url=new URL(req.url),path=url.pathname;
  const requestedChild=url.searchParams.get('child_id')||null;

  if(path.endsWith('/progress')){
    const result=await service.progress({
      badge_id:url.searchParams.get('badge_id'),
      child_id:requestedChild
    });
    const {status=200,...body}=result;
    return json(body,status);
  }

  if(path.endsWith('/gate-bindings')){
    const badge_ids=(url.searchParams.get('badge_ids')||'').split(',').map(x=>x.trim()).filter(Boolean);
    const result=await service.bindings({badge_ids,child_id:requestedChild});
    const {status=200,...body}=result;
    return json(body,status);
  }

  return json({ok:false,reason:'NOT_FOUND'},404);
}

export const config={path:['/api/badges/progress','/api/badges/gate-bindings']};