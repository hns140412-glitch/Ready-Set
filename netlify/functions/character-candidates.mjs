const MODEL='gpt-image-2.5-sunburst';
const MAX_SOURCE_BYTES=2_500_000;
const PAID_GENERATION_ENABLED=process.env.READY_CHARACTER_PAID_GENERATION==='true';
const IDENTITY_MASTER=`Use the uploaded child photo as the sole identity authority. Preserve the SAME CHILD with very high fidelity. Precisely preserve face shape and width-to-height ratio, forehead, eye shape/size/spacing, eyebrow shape and position, nose bridge/tip/width, mouth shape and smile geometry, cheeks, jaw/chin, ears when visible, hairline, hairstyle and the child's overall recognizable impression. Do not beautify, idealize, age up/down, change ethnicity, enlarge eyes excessively, shrink the nose, narrow the jaw, or replace the face with a generic cute child. Temporary face paint, stickers, lighting and camera artifacts are NOT identity features. Natural age-appropriate proportions only.`;
const QUALITY_MASTER=`Render as a warm, bright, premium high-density 2.5D editorial explorer character for Ready & Set. Polished animated-character key-visual quality, dimensional but not photorealistic: refined soft skin shading, dimensional hair strands and masses, clean detailed fabric/materials, soft cinematic light, crisp silhouette, coherent hands and limbs, full body visible, comfortable explorer clothing and a small backpack, simple bright background. Keep facial identity stronger than stylization. No text, logos, labels or extra people.`;
const REFINEMENT_MASTER=`Before producing the final image, internally re-check the result against the original reference: increase facial resemblance; refine the child's facial features and proportions more precisely; preserve the chosen mood while correcting any drift in face shape, eyes, eyebrows, nose, mouth, cheeks, hairline, age impression and head-to-body proportion. If style conflicts with identity, identity wins. The final output should look like a carefully refined version after repeated feedback such as “make the face resemble the original more”, “refine the face similarity”, and “match the original facial features and proportions more precisely”. Do not expose this review as text; apply it visually.`;
const DIRECTIONS=[
  {key:'LIVELY',label:'활발한 탐험가',subtitle:'호기심 가득, 새로운 길을 발견하는 느낌',tags:['발랄해요','활동적이에요','도전해요'],prompt:'LIVELY EXPLORER: bright energetic smile, open welcoming gesture or light forward-moving pose, adventurous and curious energy.'},
  {key:'WARM',label:'따뜻한 탐험가',subtitle:'친근하고 포근하게 함께하는 느낌',tags:['사랑스러워요','친근해요','배려해요'],prompt:'WARM EXPLORER: gentle warm smile, friendly relaxed pose, soft approachable expression, caring companion energy.'},
  {key:'CALM',label:'차분한 탐험가',subtitle:'관찰하고 생각하며 꼼꼼하게 탐험하는 느낌',tags:['차분해요','집중해요','꼼꼼해요'],prompt:'CALM EXPLORER: calm confident smile, thoughtful composed pose, observant and prepared explorer energy.'}
];
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function parseDataUrl(v=''){const m=String(v).match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!m)throw new Error('SOURCE_PHOTO_FORMAT');const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));if(bytes.byteLength>MAX_SOURCE_BYTES)throw new Error('SOURCE_PHOTO_TOO_LARGE');return{type:m[1],bytes}}
function promptFor(direction,intent='INITIAL'){
  const similar=intent==='SIMILAR'?`This is a similarity-refinement request. Keep the previously chosen direction conceptually, but treat the ORIGINAL PHOTO as identity authority and push facial resemblance even higher. Do not copy accumulated facial drift from prior generated images.`:'';
  return `${IDENTITY_MASTER}\n${QUALITY_MASTER}\nMood direction only; mood must never alter identity: ${direction.prompt}\n${similar}\n${REFINEMENT_MASTER}\nAll three candidate directions must have equal master quality. Candidate choice is mood choice, never quality choice.`;
}
async function generateOne(source,direction,index,generationId,intent){
  const form=new FormData();form.append('model',MODEL);form.append('prompt',promptFor(direction,intent));form.append('n','1');form.append('size','1024x1536');form.append('quality','high');form.append('output_format','webp');form.append('image',new Blob([source.bytes],{type:source.type}),source.type==='image/png'?'reference.png':'reference.jpg');
  const r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});const data=await r.json();if(!r.ok)throw Object.assign(new Error(data?.error?.message||'Image generation failed'),{status:r.status});const x=data?.data?.[0],assetRef=x?.b64_json?`data:image/webp;base64,${x.b64_json}`:x?.url||'';if(!assetRef)throw new Error('CANDIDATE_ASSET_MISSING');return{id:`${generationId}_${index+1}`,assetRef,generatorVersion:MODEL,personalityKey:direction.key,label:direction.label,subtitle:direction.subtitle,tags:direction.tags,quality:'high',identityPolicy:'ORIGINAL_PHOTO_AUTHORITY_REFINED'};
}
export default async(req)=>{
  if(req.method!=='POST')return json(405,{ok:false,error:'METHOD_NOT_ALLOWED'});
  if(!PAID_GENERATION_ENABLED)return json(423,{ok:false,error:'PAID_GENERATION_DISABLED',message:'Character generation is staged but intentionally locked until provider/cost/quality approval.'});
  if(!process.env.OPENAI_API_KEY)return json(503,{ok:false,error:'IMAGE_PROVIDER_NOT_CONFIGURED'});
  let body;try{body=await req.json()}catch{return json(400,{ok:false,error:'INVALID_JSON'})}
  if(body?.confirmCost!==true)return json(409,{ok:false,error:'COST_CONFIRMATION_REQUIRED'});
  let source;try{source=parseDataUrl(body.sourcePhoto)}catch(e){return json(400,{ok:false,error:e.message})}
  const generationId=crypto.randomUUID(),intent=body?.intent==='SIMILAR'?'SIMILAR':'INITIAL';
  try{const candidates=await Promise.all(DIRECTIONS.map((d,k)=>generateOne(source,d,k,generationId,intent)));return json(200,{ok:true,generationId,provider:'OPENAI',model:MODEL,quality:'high',candidatePolicy:'SAME_IDENTITY_SAME_QUALITY_DIFFERENT_MOOD',refinementPolicy:'ORIGINAL_PHOTO_EVERY_GENERATION',candidates})}catch(e){return json(e?.status||500,{ok:false,error:e?.status?'PROVIDER_ERROR':'ADAPTER_FAILURE',providerStatus:e?.status||null,message:String(e?.message||e)})}
};
export const config={path:'/api/character-candidates'};
