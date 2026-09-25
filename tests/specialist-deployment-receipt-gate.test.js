'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ready-specialist-deploy-gate-'));
const receiptPath=path.join(tmp,'receipt.json');

const good={
  contract_version:'READY_SPECIALIST_DEPLOYMENT_RECEIPT_V1',
  hideSeekV2:{
    repo:'hns140412-glitch/Hide-Seek',
    source_sha:'bf345ac064fee433660ae5f9bfffb205c20cddde',
    archive_sha256:'c2e95ce4be7c5bc9a05326f32b5ecec4be5a1d68b520bdde5f34c4d8f54761ed',
    provider:'TEST_PROVIDER',
    site_id:'hide-site',
    deploy_id:'hide-deploy',
    deployed_url:'https://hide-v2.example.test',
    rollback_target:'hide-prev-deploy'
  },
  snapPopV2:{
    repo:'hns140412-glitch/Snap-Pop',
    source_sha:'7fcd4d39d4f1fbf159d49a447b17d3cc8c32b15c',
    archive_sha256:'e7d4d4b0694993481bb9deeddd46e9da6706c0d9649c6d6a400a988c71505592',
    provider:'TEST_PROVIDER',
    site_id:'snap-site',
    deploy_id:'snap-deploy',
    deployed_url:'https://snap-v2.example.test',
    rollback_target:'snap-prev-deploy'
  }
};

fs.writeFileSync(receiptPath,JSON.stringify(good));
const out=execFileSync('node',['.github/scripts/validate-specialist-deployment-receipt.mjs',receiptPath],{encoding:'utf8'});
if(!out.includes('READY_SPECIALIST_DEPLOY_GATE_PASS')) throw new Error('valid exact-source receipt did not pass');
if(!out.includes('LIVE_HOSTED_CROSS_APP_ROUNDTRIP')) throw new Error('next gate not emitted');

const bad=structuredClone(good);
bad.hideSeekV2.source_sha='0000000000000000000000000000000000000000';
fs.writeFileSync(receiptPath,JSON.stringify(bad));
const denied=spawnSync('node',['.github/scripts/validate-specialist-deployment-receipt.mjs',receiptPath],{encoding:'utf8'});
if(denied.status===0) throw new Error('mismatched source SHA was accepted');
if(!String(denied.stderr).includes('hideSeekV2.source_sha mismatch')) throw new Error('fail-closed reason missing');

console.log('PASS specialist deployment receipt gate accepts only frozen exact-source provenance');
