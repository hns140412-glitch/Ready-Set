'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const src=fs.readFileSync(path.join(__dirname,'..','netlify','functions','learning-evidence-ingest.mjs'),'utf8');
assert(src.includes("getUser"));
assert(src.includes("admin.listUsers"));
assert(src.includes("resolveEvidenceIdentity"));
assert(src.includes("getStore(STORE_NAME,{consistency:'strong'})"));
assert(src.includes("onlyIfMatch"));
assert(src.includes("onlyIfNew"));
assert(src.includes("'/api/learning-evidence/ingest'"));
assert(src.includes("MEMBER_SCOPE_NOT_AUTHORIZED"));
assert(src.includes("FAMILY_SCOPE_MISMATCH"));
assert(src.includes("TAKY_LEARNING_EVIDENCE_TRANSPORT_KERNEL_V1"));
console.log('LEARNING_EVIDENCE_ENDPOINT_CONTRACT_PASS');
