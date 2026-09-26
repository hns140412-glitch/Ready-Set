'use strict';

const { execFileSync } = require('node:child_process');

function fail(message){
  console.error('FAIL '+message);
  process.exit(1);
}
function pass(message){
  console.log('PASS '+message);
}

const listing=execFileSync('bash',['-lc','git archive --format=tar HEAD | tar -tf -'],{encoding:'utf8'})
  .split(/\r?\n/)
  .map(x=>x.trim())
  .filter(Boolean);

const forbiddenPrefixes=['.github/','tests/','C2S/','HANDOFF/','REBUILD/','ui-audit/'];
for(const prefix of forbiddenPrefixes){
  if(listing.some(path=>path.startsWith(prefix))) fail('release archive contains '+prefix);
}
if(listing.some(path=>path.toLowerCase().endsWith('.md'))) fail('release archive contains markdown evidence');
if(listing.some(path=>path.toLowerCase().endsWith('.zip'))) fail('release archive contains nested zip');

const required=[
  'index.html',
  'app.js',
  'styles.css',
  'package.json',
  'ready-planner-v01.js',
  'ready-local-first-v01.js',
  'src/persistence/member-scope-runtime.js',
  'netlify/functions/ready-sync.mjs'
];
for(const path of required){
  if(!listing.includes(path)) fail('release archive missing runtime '+path);
}

pass('release archive excludes governance/test evidence');
pass('release archive keeps required runtime surface');
console.log('ARCHIVE_ENTRY_COUNT='+listing.length);
