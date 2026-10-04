import assert from 'node:assert/strict';
import { validateCaptureEnvelope, validateUploadedImageKeys, validateReadyDrafts } from '../netlify/functions/capture-ocr-contract.mjs';

const source={capture_item_id:'src-1',group_key:'TALENT:연산',kind:'RANGE',mime_type:'image/jpeg'};
const answer={capture_item_id:'answer-1',group_key:'TALENT:연산',kind:'ANSWER_REFERENCE',mime_type:'image/jpeg'};
const manifest=[source,answer];
const visionManifest=[
  {source_id:'src-1',mime_type:'image/jpeg',analyzable:true},
  {source_id:'answer-1',mime_type:'image/jpeg',analyzable:false}
];
const input={request_id:'vision_test_1',manifest,vision_manifest:visionManifest};
const pass=validateCaptureEnvelope(input);
assert.equal(pass.ok,true);
assert.deepEqual(pass.analyzable_ids,['src-1']);
assert.equal(validateUploadedImageKeys(['image__src-1','vision_ingest_request_id'],pass.analyzable_ids).ok,true);
assert.equal(validateUploadedImageKeys(['image__answer-1'],pass.analyzable_ids).reason,'UNEXPECTED_IMAGE_FILE');
assert.equal(validateUploadedImageKeys(['image__foreign'],pass.analyzable_ids).reason,'UNEXPECTED_IMAGE_FILE');

assert.equal(validateCaptureEnvelope({...input,request_id:''}).reason,'VISION_REQUEST_ID_REQUIRED');
assert.equal(validateCaptureEnvelope({...input,vision_manifest:visionManifest.slice(1)}).reason,'VISION_MANIFEST_MISMATCH');
assert.equal(validateCaptureEnvelope({...input,vision_manifest:[
  {source_id:'answer-1',mime_type:'image/jpeg',analyzable:true},visionManifest[1]
]}).reason,'VISION_MANIFEST_MISMATCH');
assert.equal(validateCaptureEnvelope({...input,vision_manifest:[
  visionManifest[0],{...visionManifest[1],analyzable:true}
]}).reason,'VISION_MANIFEST_MISMATCH');
assert.equal(validateCaptureEnvelope({...input,manifest:[source,source],vision_manifest:[visionManifest[0],visionManifest[0]]}).reason,'INVALID_CAPTURE_SOURCE');
assert.equal(validateCaptureEnvelope({...input,manifest:[answer],vision_manifest:[visionManifest[1]]}).reason,'NO_ANALYZABLE_IMAGES');
const tooMany=Array.from({length:25},(_,i)=>({...source,capture_item_id:'src-'+i}));
assert.equal(validateCaptureEnvelope({
  request_id:'vision_large',manifest:tooMany,
  vision_manifest:tooMany.map(x=>({source_id:x.capture_item_id,mime_type:x.mime_type,analyzable:true}))
}).reason,'CAPTURE_IMAGE_LIMIT_EXCEEDED');
console.log('PASS: OCR request envelope and upload file allowlist preserve exact analyzable sources');

const validDraft={group_key:'TALENT:연산',confidence:.7,evidence_item_ids:['src-1'],warnings:[]};
assert.equal(validateReadyDrafts([validDraft],pass.analyzable).ok,true);
assert.equal(validateReadyDrafts([{...validDraft,evidence_item_ids:[]}],pass.analyzable).reason,'ANALYSIS_EVIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,evidence_item_ids:['answer-1']}],pass.analyzable).reason,'ANALYSIS_EVIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,evidence_item_ids:['foreign']}],pass.analyzable).reason,'ANALYSIS_EVIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,evidence_item_ids:['src-1','src-1']}],pass.analyzable).reason,'ANALYSIS_EVIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,group_key:'HIDE:VOCABULARY'}],pass.analyzable).reason,'ANALYSIS_EVIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,confidence:'high'}],pass.analyzable).reason,'ANALYSIS_CONFIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,confidence:NaN}],pass.analyzable).reason,'ANALYSIS_CONFIDENCE_INVALID');
assert.equal(validateReadyDrafts([{...validDraft,confidence:2}],pass.analyzable).drafts[0].confidence,1);
console.log('PASS: OCR response drafts fail closed on excluded/foreign/empty evidence and invalid confidence');
