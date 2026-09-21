import { getUser } from '@netlify/identity';
import familyCore from './ready-family-auth-core.js';

const { familySessionFromIdentityUser } = familyCore;

const MAX_IMAGES=24;
const MAX_TOTAL_BYTES=24*1024*1024;
const ALLOWED_MIME=new Set(['image/jpeg','image/png','image/webp','image/gif']);

function outputText(response){
  if(typeof response?.output_text==='string')return response.output_text;
  for(const item of response?.output||[]){
    for(const content of item?.content||[]){
      if(content?.type==='output_text'&&typeof content.text==='string')return content.text;
    }
  }
  return '';
}

function schema(){
  return {
    type:'object',
    additionalProperties:false,
    required:['analysis_version','drafts'],
    properties:{
      analysis_version:{type:'string'},
      drafts:{
        type:'array',
        items:{
          type:'object',
          additionalProperties:false,
          required:[
            'group_key','detected_material_type','detected_subject','workbook_name',
            'source_range','teacher_instruction','components','weekday_prints',
            'confidence','evidence_item_ids','warnings'
          ],
          properties:{
            group_key:{type:'string'},
            detected_material_type:{
              type:'string',
              enum:['TALENT_BOOK','ENGLISH_WORKBOOK','ENGLISH_PRINT','ENGLISH_OTHER','UNKNOWN']
            },
            detected_subject:{type:'string'},
            workbook_name:{type:'string'},
            source_range:{type:'string'},
            teacher_instruction:{type:'string'},
            components:{
              type:'object',
              additionalProperties:false,
              required:['vocabulary','grammar','reading','listening','recording','writing'],
              properties:{
                vocabulary:{type:'string'},
                grammar:{type:'string'},
                reading:{type:'string'},
                listening:{type:'string'},
                recording:{type:'string'},
                writing:{type:'string'}
              }
            },
            weekday_prints:{
              type:'array',
              items:{
                type:'object',
                additionalProperties:false,
                required:['weekday','value'],
                properties:{
                  weekday:{type:'string'},
                  value:{type:'string'}
                }
              }
            },
            confidence:{type:'number'},
            evidence_item_ids:{type:'array',items:{type:'string'}},
            warnings:{type:'array',items:{type:'string'}}
          }
        }
      }
    }
  };
}

export default async function handler(req){
  if(req.method!=='POST'){
    return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  }

  const user=await getUser();
  const mapped=user?familySessionFromIdentityUser(user):null;
  if(!mapped?.ok||mapped.session.role!=='PARENT'){
    return Response.json({ok:false,reason:'PARENT_AUTH_REQUIRED'},{status:403});
  }

  const apiKey=String(process.env.OPENAI_API_KEY||'').trim();
  if(!apiKey){
    return Response.json({ok:false,reason:'ANALYSIS_PROVIDER_NOT_CONFIGURED'},{status:503});
  }

  let form;
  try{form=await req.formData()}
  catch{return Response.json({ok:false,reason:'INVALID_MULTIPART'},{status:400})}

  let manifest=[];
  try{manifest=JSON.parse(String(form.get('manifest')||'[]'))}
  catch{return Response.json({ok:false,reason:'INVALID_MANIFEST'},{status:400})}
  if(!Array.isArray(manifest)||!manifest.length){
    return Response.json({ok:false,reason:'EMPTY_MANIFEST'},{status:400});
  }

  const analyzable=manifest.filter(x=>x&&x.kind!=='ANSWER_REFERENCE').slice(0,MAX_IMAGES);
  if(!analyzable.length){
    return Response.json({ok:false,reason:'NO_ANALYZABLE_IMAGES'},{status:400});
  }

  let totalBytes=0;
  const content=[
    {
      type:'input_text',
      text:[
        'You extract homework assignment facts from Korean/English workbook photos.',
        'Return review drafts only. Never invent unreadable values.',
        'Preserve the provided group_key exactly.',
        'Do not treat physical page count as a learning-unit split rule.',
        'Extract only observable assignment facts: subject/material type/workbook name/range/teacher instruction/components/weekday prints.',
        'For English components, preserve vocabulary, grammar, reading, listening, recording, and writing separately when visible.',
        'Use empty strings for unknown fields and add a warning explaining uncertainty.',
        'Do not output answer contents even if an answer sheet is visible.'
      ].join('\n')
    }
  ];

  for(const item of analyzable){
    const file=form.get('image__'+item.capture_item_id);
    if(!(file instanceof File))continue;
    if(!ALLOWED_MIME.has(file.type)){
      return Response.json({ok:false,reason:'UNSUPPORTED_IMAGE_TYPE',capture_item_id:item.capture_item_id},{status:415});
    }
    totalBytes+=file.size;
    if(totalBytes>MAX_TOTAL_BYTES){
      return Response.json({ok:false,reason:'CAPTURE_BATCH_TOO_LARGE'},{status:413});
    }
    const bytes=Buffer.from(await file.arrayBuffer());
    const dataUrl=`data:${file.type};base64,${bytes.toString('base64')}`;
    content.push({
      type:'input_text',
      text:`capture_item_id=${item.capture_item_id}; group_key=${item.group_key}; capture_kind=${item.kind}`
    });
    content.push({type:'input_image',image_url:dataUrl,detail:'high'});
  }

  if(content.length===1){
    return Response.json({ok:false,reason:'NO_IMAGE_FILES_RECEIVED'},{status:400});
  }

  const model=String(process.env.READY_CAPTURE_MODEL||'gpt-5.6-luna').trim();
  const upstream=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{
      'Authorization':'Bearer '+apiKey,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      model,
      input:[{role:'user',content}],
      text:{
        format:{
          type:'json_schema',
          name:'ready_set_capture_review_draft',
          strict:true,
          schema:schema()
        }
      },
      store:false
    })
  });

  const raw=await upstream.json().catch(()=>null);
  if(!upstream.ok){
    return Response.json({
      ok:false,
      reason:'ANALYSIS_PROVIDER_ERROR',
      provider_status:upstream.status,
      provider_type:raw?.error?.type||null
    },{status:502});
  }

  const text=outputText(raw);
  if(!text){
    return Response.json({ok:false,reason:'ANALYSIS_OUTPUT_MISSING'},{status:502});
  }

  let parsed;
  try{parsed=JSON.parse(text)}
  catch{return Response.json({ok:false,reason:'ANALYSIS_OUTPUT_INVALID_JSON'},{status:502})}

  const allowedGroups=new Set(manifest.map(x=>String(x.group_key||'')));
  parsed.drafts=(Array.isArray(parsed.drafts)?parsed.drafts:[])
    .filter(x=>allowedGroups.has(String(x.group_key||'')))
    .map(x=>({
      ...x,
      confidence:Math.max(0,Math.min(1,Number(x.confidence)||0)),
      evidence_item_ids:(Array.isArray(x.evidence_item_ids)?x.evidence_item_ids:[])
        .filter(id=>manifest.some(m=>m.capture_item_id===id&&m.group_key===x.group_key)),
      warnings:Array.isArray(x.warnings)?x.warnings.map(String):[]
    }));

  return Response.json({
    ok:true,
    provider:'OPENAI_RESPONSES_VISION',
    model,
    family_id:mapped.session.family_id,
    result:parsed
  },{status:200,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/capture/analyze'};
