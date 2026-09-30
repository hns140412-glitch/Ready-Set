#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const repo=path.resolve(__dirname,'..');
const root=path.join(repo,'vendor','taky','explorer-crew');
const lock=JSON.parse(fs.readFileSync(path.join(root,'source-lock-v2.json'),'utf8').replace(/^\uFEFF/,''));
const shaText=p=>crypto.createHash('sha256').update(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')).digest('hex');
const shaBytes=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

assert.equal(lock.version,'EXPLORER_CREW_V2_SOURCE_LOCK_20261001');
assert.equal(lock.algorithm,'sha256');
assert.equal(lock.normalization,'lf');
assert.equal(lock.file_count,34);

const names=Object.keys(lock.files||{}).sort();
assert.equal(names.length,34);
for(const name of names){
  const file=path.join(root,name);
  assert.equal(fs.existsSync(file),true,'LOCK_FILE_MISSING:'+name);
  assert.equal(shaText(file),lock.files[name],'LOCK_HASH_MISMATCH:'+name);
}

const allowedProjectFiles=new Set(['ready-authority-consumer-v1.js']);
const actualCommon=fs.readdirSync(root)
  .filter(n=>n!=='source-lock-v2.json'&&!allowedProjectFiles.has(n)&&fs.statSync(path.join(root,n)).isFile())
  .sort();
assert.deepEqual(actualCommon,names);
for(const file of allowedProjectFiles)assert.equal(fs.existsSync(path.join(root,file)),true,'READY_CONSUMER_MISSING');

const cutouts={
  'dubi.png':'611f460174a09e0ed186e909812464e8a991cc24a9891e21c087050e78d6109b',
  'ink.png':'5108c5d31437afda09eebd414ac3fd7000dabeca7504b469e630f2368160ef30',
  'lori.png':'1642e080034e48cf7a11cd3bea12be8db44e10468b20b231f5f714360f27fcac',
  'nova.png':'11aea6f91f0197a0c2ab70a203550530ebe2e2aad39136198851ca97092a0d34',
  'take.png':'3cd6720c13473f20f4b23f64fa3d42c7491ea9277ba204f80f096e3f0d57d88a',
  'zero.png':'7eb9ad58b94349eb8367236a3058a7feb0c9e994b981915c6ef82f74dd88b233'
};
for(const [name,hash] of Object.entries(cutouts)){
  assert.equal(shaBytes(path.join(repo,'characters','ui_cutouts',name)),hash,'CUTOUT_HASH_MISMATCH:'+name);
}

console.log(JSON.stringify({
  gate:'READY_EXPLORER_CREW_V2_SOURCE_LOCK',
  common_files:34,
  normalized_hashes:'PASS',
  project_consumer_boundary:'PASS',
  static_cutouts:6,
  cutout_hashes:'PASS'
},null,2));
