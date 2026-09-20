import { login, logout, verifyRequestOrigin } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { familySessionFromIdentityUser } = core;

export default async function handler(req){
  if(req.method!=='POST') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{ verifyRequestOrigin(req); }
  catch{ return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403}); }

  let body={};
  try{ body=await req.json(); }
  catch{ return Response.json({ok:false,reason:'INVALID_JSON'},{status:400}); }

  const email=String(body.email||'').trim();
  const password=String(body.password||'');
  if(!email||!password) return Response.json({ok:false,reason:'CREDENTIALS_REQUIRED'},{status:400});

  try{
    const user=await login(email,password);
    const mapped=familySessionFromIdentityUser(user||{});
    if(!mapped.ok){
      await logout().catch(()=>{});
      return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
    }
    return Response.json({ok:true,session:mapped.session},{status:200});
  }catch(error){
    return Response.json({ok:false,reason:'LOGIN_FAILED'},{status:401});
  }
}
export const config={path:'/api/auth/login'};
