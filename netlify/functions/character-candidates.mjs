const MODEL='gpt-image-2.5-sunburst';
const MAX_SOURCE_BYTES=2_500_000;
const PROMPT=`Use the uploaded child photo as the sole identity reference. Preserve the same child's facial identity: face shape, eyes, eyebrows, nose, mouth, cheeks, hairline, hairstyle and overall impression. Do not beautify into a different person. Transform the child into a warm bright high-density 2.5D editorial explorer character for Ready & Set. Show the full body, front-facing, natural age-appropriate proportions, comfortable explorer clothes and a small backpack, on a simple light background. Priority: facial resemblance > same-person identity > full-body character consistency > styling. Do not add text.`;
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function parseDataUrl(v=''){const m=String(v).match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!m)throw new Error('SOURCE_PHOTO_FORMAT');const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));if(bytes.byteLength>MAX_SOURCE_BYTES)throw new Error('SOURCE_PHOTO_TOO_LARGE');return{type:m[1],bytes}}
export default async(req)=>{
  if(req.method!=='POST')return json(405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  if(!process.env.OPENAI_API_KEY)return json(503,{ok:false,error:'IMAGE_PROVIDER_NOT_CONFIGURED'});
  let body;try{body=await req.json()}catch{return json(400,{ok:false,error:'INVALID_JSON'})}
  if(body?.confirmCost!==true)return json(409,{ok:false,error:'COST_CONFIRMATION_REQUIRED'});
  let source;try{source=parseDataUrl(body.sourcePhoto)}catch(e){return json(400,{ok:false,error:e.message})}
  const generationId=crypto.randomUUID();
  try{
    const form=new FormData();
    form.append('model',MODEL);form.append('prompt',PROMPT);form.append('n','3');form.append('size','1024x1536');form.append('quality','medium');form.append('output_format','webp');
    form.append('image',new Blob([source.bytes],{type:source.type}),source.type==='image/png'?'reference.png':'reference.jpg');
    const r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
    const data=await r.json();if(!r.ok)return json(r.status,{ok:false,error:'PROVIDER_ERROR',providerStatus:r.status,providerMessage:data?.error?.message||'Image generation failed'});
    const items=(data?.data||[]).slice(0,3).map((x,k)=>({id:`${generationId}_${k+1}`,assetRef:x.b64_json?`data:image/webp;base64,${x.b64_json}`:x.url||'',generatorVersion:MODEL})).filter(x=>x.assetRef);
    if(items.length!==3)return json(502,{ok:false,error:'THREE_CANDIDATES_NOT_RETURNED'});
    return json(200,{ok:true,generationId,provider:'OPENAI',model:MODEL,candidates:items});
  }catch(e){return json(500,{ok:false,error:'ADAPTER_FAILURE',message:String(e?.message||e)})}
};
export const config={path:'/api/character-candidates'};
