const assert=require('node:assert/strict');
const r=require('../ready-smart-random-guest-v1.js');
assert.equal(r.choose({all:['a','b','c'],main:'a',history:['b'],random:()=>0}),'c');
assert.equal(r.choose({all:['a','b','c'],main:'a',history:['b','c','b'],random:()=>0}),'c');
assert.notEqual(r.choose({all:['a','b','c'],main:'a',history:['b'],random:()=>0.9}),'b');
console.log(JSON.stringify({gate:'READY_SMART_RANDOM_GUEST',pass:true},null,2));
