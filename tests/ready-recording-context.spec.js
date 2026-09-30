const assert=require('node:assert/strict');
const r=require('../ready-recording-context-v1.js');
const d=new Date('2026-09-30T12:00:00+09:00');
assert.equal(r.filename({name:'Judy',labels:['Bricks grammar'],date:d,ext:'m4a'}),'Judy’s Bricks grammar recording 2026 09 30.m4a');
assert.equal(r.filename({name:'Judy',labels:['Bricks Spelling Bee'],date:d,ext:'m4a'}),'Judy’s Bricks spelling Bee recording 2026 09 30.m4a');
console.log(JSON.stringify({gate:'READY_RECORDING_CONTEXT',pass:true},null,2));
