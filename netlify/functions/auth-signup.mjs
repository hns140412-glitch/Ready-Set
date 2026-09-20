import { signup, verifyRequestOrigin } from '@netlify/identity';

export default async function handler(req){
  if(req.method!=='POST') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{ verifyRequestOrigin(req); }
  catch{ return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403}); }
  let body={};
  try{ body=await req.json(); }
  catch{ return Response.json({ok:false,reason:'INVALID_JSON'},{status:400}); }
  const email=String(body.email||'').trim();
  const password=String(body.password||'');
  const name=String(body.name||'').trim();
  if(!email||password.length<8) return Response.json({ok:false,reason:'SIGNUP_INPUT_INVALID'},{status:400});
  try{
    await signup(email,password,name?{full_name:name}:{});
    return Response.json({ok:true,confirmation_required:true,role_after_confirmation:'CHILD'},{status:201});
  }catch{
    return Response.json({ok:false,reason:'SIGNUP_FAILED'},{status:400});
  }
}
export const config={path:'/api/auth/signup'};
