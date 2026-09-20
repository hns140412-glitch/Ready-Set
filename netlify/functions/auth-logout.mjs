import { logout, verifyRequestOrigin } from '@netlify/identity';

export default async function handler(req){
  if(req.method!=='POST') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{ verifyRequestOrigin(req); }
  catch{ return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403}); }
  try{ await logout(); }
  catch{}
  return Response.json({ok:true},{status:200});
}
export const config={path:'/api/auth/logout'};
