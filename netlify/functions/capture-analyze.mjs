import { getUser } from '@netlify/identity';
import familyCore from './ready-family-auth-core.js';

const { familySessionFromIdentityUser } = familyCore;

const MAX_IMAGES=24;
const MAX_TOTAL_BYTES=24*1024*1024;
const ALLOWED_MIME=new Set(['image/jpeg','image/png','image/webp','image/gif']);
const READY_DOMAIN='READY_ASSIGNMENT_FACT';
const HIDE_DOMAIN='HIDE_VOCABULARY';
const SUPPORTED_DOMAINS=new Set([READY_DOMAIN,HIDE_DOMAIN]);

function outputText(response){
  if(typeof response?.output_text==='string')return response.output_text;
  for(const item of response?.output||[]){
    for(const content of item?.content||[]){
      if(content?.type==='output_text'&&typeof content.text==='string')return content.text;
    }
  }
  return '';
}

function readyAssignmentSchema(){
  return {
    type:'object',
    additionalProperties:false,
    required:['analysis_version','analysis_domain','drafts'],
    properties:{
      analysis_version:{type:'string'},
      analysis_domain:{type:'string',enum:[READY_DOMAIN]},
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
              required:['vocabulary','listening','recording','writing'],
              properties:{
                vocabulary:{type:'string'},
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

function hideVocabularySchema(){
  return {
    type:'object',
    additionalProperties:false,
    required:['analysis_version','analysis_domain','rows'],
    properties:{
      analysis_version:{type:'string'},
      analysis_domain:{type:'string',enum:[HIDE_DOMAIN]},
      rows:{
        type:'array',
        items:{
          type:'object',
          additionalProperties:false,
          required:['eng','kor','confidence','evidence_item_id','source_column','source_row_index','source_column_index','warnings'],
          properties:{
            eng:{type:'string'},
            kor:{type:'string'},
            confidence:{type:'string',enum:['high','medium','low']},
            evidence_item_id:{type:'string'},
            source_column:{type:'string',enum:['LEFT','RIGHT','CENTER','UNKNOWN']},
            source_row_index:{type:'integer',minimum:0},
            source_column_index:{type:'integer',minimum:0},
            warnings:{type:'array',items:{type:'string'}}
          }
        }
      }
    }
  };
}

function domainConfig(domain){
  if(domain===HIDE_DOMAIN){
    return {
      schema:hideVocabularySchema(),
      schemaName:'hide_seek_vocabulary_ocr',
      instructions:[
        'You transcribe printed English vocabulary material for Hide & Seek.',
        'Return only English-word and Korean-meaning rows that are visibly supported by the image.',
        'Pair each English word with its visible Korean meaning while preserving source order.',
        'Also preserve physical layout: source_column is LEFT/RIGHT/CENTER/UNKNOWN, source_row_index is top-to-bottom row within the page, and source_column_index is top-to-bottom index within that physical column.',
        'For multi-column vocabulary sheets, identify the actual left and right blocks from the image; do not infer columns from semantic content.',
        'Never invent missing words, meanings, examples, hints, or answers.',
        'Ignore headers, page numbers, decorative text, and unrelated instructions.',
        'If either side is ambiguous, preserve the visible text as best as possible and use confidence=low with a short warning.',
        'Each row must cite the capture_item_id of the image that visibly supports it.'
      ]
    };
  }
  return {
    schema:readyAssignmentSchema(),
    schemaName:'ready_set_capture_review_draft',
    instructions:[
      'You extract homework assignment facts from Korean/English workbook photos.',
      'Return review drafts only. Never invent unreadable values.',
      'Preserve the provided group_key exactly.',
      'Do not treat physical page count as a learning-unit split rule.',
      'Extract only observable assignment facts: subject/material type/workbook name/range/teacher instruction/components/weekday prints.',
      'Use empty strings for unknown fields and add a warning explaining uncertainty.',
      'Do not output answer contents even if an answer sheet is visible.'
    ]
  };
}

function authorizedForDomain(mapped,domain){
  if(!mapped?.ok)return false;
  const role=String(mapped.session?.role||'').toUpperCase();
  if(domain===READY_DOMAIN)return role==='PARENT';
  if(domain===HIDE_DOMAIN)return role==='PARENT'||role==='CHILD';
  return false;
}

export default async function handler(req){
  if(req.method!=='POST'){
    return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  }

  let form;
  try{form=await req.formData()}
  catch{return Response.json({ok:false,reason:'INVALID_MULTIPART'},{status:400})}

  const analysisDomain=String(form.get('analysis_domain')||READY_DOMAIN).trim()||READY_DOMAIN;
  if(!SUPPORTED_DOMAINS.has(analysisDomain)){
    return Response.json({ok:false,reason:'ANALYSIS_DOMAIN_UNSUPPORTED',analysis_domain:analysisDomain},{status:422});
  }

  const user=await getUser();
  const mapped=user?familySessionFromIdentityUser(user):null;
  if(!authorizedForDomain(mapped,analysisDomain)){
    const reason=analysisDomain===READY_DOMAIN?'PARENT_AUTH_REQUIRED':'FAMILY_ACTOR_AUTH_REQUIRED';
    return Response.json({ok:false,reason,analysis_domain:analysisDomain},{status:403});
  }

  const apiKey=String(process.env.OPENAI_API_KEY||'').trim();
  if(!apiKey){
    return Response.json({ok:false,reason:'ANALYSIS_PROVIDER_NOT_CONFIGURED',analysis_domain:analysisDomain},{status:503});
  }

  let manifest=[];
  try{manifest=JSON.parse(String(form.get('manifest')||'[]'))}
  catch{return Response.json({ok:false,reason:'INVALID_MANIFEST',analysis_domain:analysisDomain},{status:400})}
  if(!Array.isArray(manifest)||!manifest.length){
    return Response.json({ok:false,reason:'EMPTY_MANIFEST',analysis_domain:analysisDomain},{status:400});
  }

  const analyzable=manifest.filter(x=>x&&x.kind!=='ANSWER_REFERENCE').slice(0,MAX_IMAGES);
  if(!analyzable.length){
    return Response.json({ok:false,reason:'NO_ANALYZABLE_IMAGES',analysis_domain:analysisDomain},{status:400});
  }

  let totalBytes=0;
  const config=domainConfig(analysisDomain);
  const content=[{type:'input_text',text:config.instructions.join('\n')}];

  for(const item of analyzable){
    const file=form.get('image__'+item.capture_item_id);
    if(!(file instanceof File))continue;
    if(!ALLOWED_MIME.has(file.type)){
      return Response.json({ok:false,reason:'UNSUPPORTED_IMAGE_TYPE',analysis_domain:analysisDomain,capture_item_id:item.capture_item_id},{status:415});
    }
    totalBytes+=file.size;
    if(totalBytes>MAX_TOTAL_BYTES){
      return Response.json({ok:false,reason:'CAPTURE_BATCH_TOO_LARGE',analysis_domain:analysisDomain},{status:413});
    }
    const bytes=Buffer.from(await file.arrayBuffer());
    const dataUrl=`data:${file.type};base64,${bytes.toString('base64')}`;
    content.push({
      type:'input_text',
      text:`capture_item_id=${item.capture_item_id}; group_key=${item.group_key}; capture_kind=${item.kind}; analysis_domain=${analysisDomain}`
    });
    content.push({type:'input_image',image_url:dataUrl,detail:'high'});
  }

  if(content.length===1){
    return Response.json({ok:false,reason:'NO_IMAGE_FILES_RECEIVED',analysis_domain:analysisDomain},{status:400});
  }

  const model=String(process.env.FAMILY_CAPTURE_MODEL||process.env.READY_CAPTURE_MODEL||'gpt-5.6-luna').trim();
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
          name:config.schemaName,
          strict:true,
          schema:config.schema
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
      analysis_domain:analysisDomain,
      provider_status:upstream.status,
      provider_type:raw?.error?.type||null
    },{status:502});
  }

  const text=outputText(raw);
  if(!text){
    return Response.json({ok:false,reason:'ANALYSIS_OUTPUT_MISSING',analysis_domain:analysisDomain},{status:502});
  }

  let parsed;
  try{parsed=JSON.parse(text)}
  catch{return Response.json({ok:false,reason:'ANALYSIS_OUTPUT_INVALID_JSON',analysis_domain:analysisDomain},{status:502})}

  const allowedItems=new Set(manifest.map(x=>String(x.capture_item_id||'')));
  if(analysisDomain===READY_DOMAIN){
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
  }else{
    parsed.rows=(Array.isArray(parsed.rows)?parsed.rows:[])
      .filter(x=>String(x.eng||'').trim()||String(x.kor||'').trim())
      .filter(x=>allowedItems.has(String(x.evidence_item_id||'')))
      .map(x=>({
        eng:String(x.eng||'').trim(),
        kor:String(x.kor||'').trim(),
        confidence:['high','medium','low'].includes(String(x.confidence||'').toLowerCase())
          ?String(x.confidence).toLowerCase():'low',
        evidence_item_id:String(x.evidence_item_id||''),
        source_column:['LEFT','RIGHT','CENTER','UNKNOWN'].includes(String(x.source_column||'').toUpperCase())
          ?String(x.source_column).toUpperCase():'UNKNOWN',
        source_row_index:Math.max(0,Number.parseInt(x.source_row_index,10)||0),
        source_column_index:Math.max(0,Number.parseInt(x.source_column_index,10)||0),
        warnings:Array.isArray(x.warnings)?x.warnings.map(String):[]
      }));
  }

  parsed.analysis_domain=analysisDomain;

  return Response.json({
    ok:true,
    provider:'OPENAI_RESPONSES_VISION',
    model,
    family_id:mapped.session.family_id,
    actor_role:mapped.session.role,
    analysis_domain:analysisDomain,
    result:parsed
  },{status:200,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/capture/analyze'};
