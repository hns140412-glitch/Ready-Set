import { getUser } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { accountSessionFromIdentityUser } = core;

export default async function handler(req){
  if(req.method!=='GET') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user) return Response.json({ok:false,authenticated:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=accountSessionFromIdentityUser(user);
  if(!mapped.ok) return Response.json({ok:false,authenticated:true,reason:mapped.reason},{status:mapped.status});
  return Response.json({ok:true,session:mapped.session},{status:200});
}
export const config={path:'/api/auth/session'};
