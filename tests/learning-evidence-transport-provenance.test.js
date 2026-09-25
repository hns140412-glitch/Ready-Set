'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const p=JSON.parse(fs.readFileSync(path.join(__dirname,'..','LEARNING_EVIDENCE_TRANSPORT_PROVENANCE.json'),'utf8'));
const content=fs.readFileSync(path.join(__dirname,'..',p.consumer_path));
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+content.length+'\0'),content
])).digest('hex');

assert.equal(p.capability_id,'CAP-LEARNING-EVIDENCE-TRANSPORT-001');
assert.equal(p.canonical_source.path,'LEARNING/transport/server-transport-kernel.js');
assert.equal(gitBlob,p.canonical_source.blob_sha);
console.log('LEARNING_EVIDENCE_TRANSPORT_PROVENANCE_PASS');
