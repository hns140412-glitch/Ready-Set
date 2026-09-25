import { admin, getUser } from '@netlify/identity';
import authCore from './ready-family-auth-core.js';
import registryCore from './family-member-registry-core.js';

export default async function handler(req){
  if(req.method!=='GET')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  const mapped=authCore.familySessionFromIdentityUser(user||{});
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status||401});
  const users=await admin.listUsers({page:1,perPage:1000});
  const out=registryCore.registryForSession(mapped.session,users||[]);
  if(!out.ok)return Response.json({ok:false,reason:out.reason},{status:out.status||403});
  return Response.json({ok:true,registry:out.registry});
}
export const config={path:'/api/family/members'};
