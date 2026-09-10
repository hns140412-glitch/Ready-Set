const MODEL='gpt-image-2.5-sunburst';
const MAX_SOURCE_BYTES=2_500_000;
const BASE_PROMPT=`Use the uploaded child photo as the sole identity reference. Preserve the same child's recognizable facial identity with very high priority: face shape, eye shape and spacing, eyebrows, nose, mouth, smile, cheeks, hairline, hairstyle and overall impression. Do not beautify into a different person and do not invent a generic child face. Transform the same child into a warm, bright, premium high-density 2.5D editorial explorer character for Ready & Set. Match the polished quality of a premium animated character key visual: expressive eyes without changing identity, soft dimensional skin and hair shading, clean detailed clothing materials, refined lighting, crisp silhouette, natural age-appropriate body proportions, full body visible, small explorer backpack, simple bright background. The three candidates must look like the SAME PERSON and have the SAME rendering quality; only expression, pose, hair styling nuance and explorer mood may differ. No text, logos, labels, extra people, face reshaping, age change or beauty-filter look. Priority: facial resemblance > same-person identity > consistent premium 2.5D quality > full-body consistency > mood styling.`;
const DIRECTIONS=[
  {key:'LIVELY',label:'활발한 탐험가',subtitle:'호기심 가득, 새로운 길을 발견하는 느낌',tags:['발랄해요','활동적이에요','도전해요'],prompt:'Direction: LIVELY EXPLORER. Bright energetic smile, open welcoming gesture or light forward-moving pose, lively ponytail nuance, adventurous and curious energy. Keep identity and render quality exactly equal to the other candidates.'},
  {key:'WARM',label:'따뜻한 탐험가',subtitle:'친근하고 포근하게 함께하는 느낌',tags:['사랑스러워요','친근해요','배려해요'],prompt:'Direction: WARM EXPLORER. Gentle warm smile, friendly relaxed pose, soft approachable expression, caring companion energy. Keep identity and render quality exactly equal to the other candidates.'},
  {key:'CALM',label:'차분한 탐험가',subtitle:'관찰하고 생각하며 꼼꼼하게 탐험하는 느낌',tags:['차분해요','집중해요','꼼꼼해요'],prompt:'Direction: CALM EXPLORER. Calm confident smile, thoughtful composed pose, tidy hair styling nuance, observant and prepared explorer energy. Keep identity and render quality exactly equal to the other candidates.'}
];
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function parseDataUrl(v=''){const m=String(v).match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!m)throw new Error('SOURCE_PHOTO_FORMAT');const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));if(bytes.byteLength>MAX_SOURCE_BYTES)throw new Error('SOURCE_PHOTO_TOO_LARGE');return{type:m[1],bytes}}
async function generateOne(source,direction,index,generationId){
  const form=new FormData();
  form.append('model',MODEL);
  form.append('prompt',`${BASE_PROMPT}\n${direction.prompt}`);
  form.append('n','1');form.append('size','1024x1536');form.append('quality','high');form.append('output_format','webp');
  form.append('image',new Blob([source.bytes],{type:source.type}),source.type==='image/png'?'reference.png':'reference.jpg');
  const r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  const data=await r.json();
  if(!r.ok)throw Object.assign(new Error(data?.error?.message||'Image generation failed'),{status:r.status});
  const x=data?.data?.[0];const assetRef=x?.b64_json?`data:image/webp;base64,${x.b64_json}`:x?.url||'';
  if(!assetRef)throw new Error('CANDIDATE_ASSET_MISSING');
  return {id:`${generationId}_${index+1}`,assetRef,generatorVersion:MODEL,personalityKey:direction.key,label:direction.label,subtitle:direction.subtitle,tags:direction.tags,quality:'high'};
}
export default async(req)=>{
  if(req.method!=='POST')return json(405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  if(!process.env.OPENAI_API_KEY)return json(503,{ok:false,error:'IMAGE_PROVIDER_NOT_CONFIGURED'});
  let body;try{body=await req.json()}catch{return json(400,{ok:false,error:'INVALID_JSON'})}
  if(body?.confirmCost!==true)return json(409,{ok:false,error:'COST_CONFIRMATION_REQUIRED'});
  let source;try{source=parseDataUrl(body.sourcePhoto)}catch(e){return json(400,{ok:false,error:e.message})}
  const generationId=crypto.randomUUID();
  try{
    const candidates=await Promise.all(DIRECTIONS.map((d,k)=>generateOne(source,d,k,generationId)));
    return json(200,{ok:true,generationId,provider:'OPENAI',model:MODEL,quality:'high',candidatePolicy:'SAME_IDENTITY_SAME_QUALITY_DIFFERENT_MOOD',candidates});
  }catch(e){return json(e?.status||500,{ok:false,error:e?.status?'PROVIDER_ERROR':'ADAPTER_FAILURE',providerStatus:e?.status||null,message:String(e?.message||e)})}
};
export const config={path:'/api/character-candidates'};
