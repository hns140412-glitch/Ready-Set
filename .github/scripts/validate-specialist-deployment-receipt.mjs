#!/usr/bin/env node
import fs from 'node:fs';

const EXPECTED = Object.freeze({
  contract_version: 'READY_SPECIALIST_DEPLOYMENT_RECEIPT_V1',
  hideSeekV2: Object.freeze({
    repo: 'hns140412-glitch/Hide-Seek',
    source_sha: 'bf345ac064fee433660ae5f9bfffb205c20cddde',
    archive_sha256: 'c2e95ce4be7c5bc9a05326f32b5ecec4be5a1d68b520bdde5f34c4d8f54761ed'
  }),
  snapPopV2: Object.freeze({
    repo: 'hns140412-glitch/Snap-Pop',
    source_sha: '7fcd4d39d4f1fbf159d49a447b17d3cc8c32b15c',
    archive_sha256: 'e7d4d4b0694993481bb9deeddd46e9da6706c0d9649c6d6a400a988c71505592'
  })
});

function fail(message){
  console.error(`READY_SPECIALIST_DEPLOY_GATE_FAIL: ${message}`);
  process.exit(1);
}

function text(value){
  return typeof value === 'string' ? value.trim() : '';
}

function sha256(value){
  return /^[a-f0-9]{64}$/.test(text(value));
}

function httpsUrl(value){
  try{
    const url = new URL(text(value));
    return url.protocol === 'https:' && !!url.hostname;
  }catch{
    return false;
  }
}

function validateTarget(name, actual, expected){
  if(!actual || typeof actual !== 'object') fail(`${name} missing`);
  if(text(actual.repo) !== expected.repo) fail(`${name}.repo mismatch`);
  if(text(actual.source_sha) !== expected.source_sha) fail(`${name}.source_sha mismatch`);
  if(!sha256(actual.archive_sha256)) fail(`${name}.archive_sha256 invalid`);
  if(text(actual.archive_sha256) !== expected.archive_sha256) fail(`${name}.archive_sha256 mismatch`);
  if(!text(actual.provider)) fail(`${name}.provider missing`);
  if(!text(actual.site_id)) fail(`${name}.site_id missing`);
  if(!text(actual.deploy_id)) fail(`${name}.deploy_id missing`);
  if(!httpsUrl(actual.deployed_url)) fail(`${name}.deployed_url must be HTTPS`);
  if(!text(actual.rollback_target)) fail(`${name}.rollback_target missing`);
  return {
    repo: expected.repo,
    source_sha: expected.source_sha,
    archive_sha256: expected.archive_sha256,
    provider: text(actual.provider),
    site_id: text(actual.site_id),
    deploy_id: text(actual.deploy_id),
    deployed_url: new URL(text(actual.deployed_url)).href.replace(/\/$/, ''),
    rollback_target: text(actual.rollback_target)
  };
}

const receiptPath = process.argv[2];
if(!receiptPath){
  fail('usage: node scripts/validate-specialist-deployment-receipt.mjs <receipt.json>');
}

let receipt;
try{
  receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
}catch(error){
  fail(`cannot read receipt: ${error.message}`);
}

if(text(receipt.contract_version) !== EXPECTED.contract_version){
  fail('contract_version mismatch');
}

const hide = validateTarget('hideSeekV2', receipt.hideSeekV2, EXPECTED.hideSeekV2);
const snap = validateTarget('snapPopV2', receipt.snapPopV2, EXPECTED.snapPopV2);

if(new URL(hide.deployed_url).origin === new URL(snap.deployed_url).origin){
  fail('Hide and Snap deployed origins must be independently identified');
}

const bootstrap = {
  hideSeekV2: hide.deployed_url,
  snapPopV2: snap.deployed_url
};

console.log('READY_SPECIALIST_DEPLOY_GATE_PASS');
console.log(JSON.stringify({
  contract_version: EXPECTED.contract_version,
  targets: { hideSeekV2: hide, snapPopV2: snap },
  ready_bootstrap: bootstrap,
  next_gate: 'LIVE_HOSTED_CROSS_APP_ROUNDTRIP'
}, null, 2));
