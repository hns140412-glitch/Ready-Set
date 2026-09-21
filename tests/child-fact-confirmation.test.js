const assert=require('assert');

const domainApi=require('../ready-assignment-domain-v2.js');

function memoryStorage(){
  const map=new Map();
  return {
    getItem:k=>map.has(k)?map.get(k):null,
    setItem:(k,v)=>map.set(k,String(v)),
    removeItem:k=>map.delete(k)
  };
}

const assignments=domainApi.createDomain(memoryStorage());

const child=assignments.addEventFact({
  actor:'CHILD',
  title:'내일 학교 준비물 챙기기',
  source_range:'알림장',
  provenance:{kind:'CHILD_INPUT',surface:'MISSION'}
});

assert.equal(child.confirmation_state,'INPUT_CAPTURED');
assert.equal(assignments.pendingChildFacts().length,1);
assert.equal(assignments.pendingChildFacts()[0].assignment_id,child.assignment_id);

assert.throws(
  ()=>assignments.confirmFact(child.assignment_id,{actor:'CHILD'}),
  /PARENT_CONFIRMATION_REQUIRED/
);

const rejected=assignments.reviewChildFact(child.assignment_id,{
  actor:'PARENT',
  decision:'REJECT',
  reason:'NOT_AN_ASSIGNMENT'
});
assert.equal(rejected.ok,true);
assert.equal(rejected.fact.confirmation_state,'REJECTED_BY_PARENT');
assert.equal(rejected.fact.lifecycle,'REJECTED');
assert.equal(assignments.pendingChildFacts().length,0);

const child2=assignments.addEventFact({
  actor:'CHILD',
  title:'사회 조사 숙제',
  deadline_boundary:'2026-09-22',
  provenance:{kind:'CHILD_INPUT',surface:'MISSION'}
});
assert.equal(assignments.pendingChildFacts().length,1);

const confirmed=assignments.reviewChildFact(child2.assignment_id,{
  actor:'PARENT',
  decision:'CONFIRM'
});
assert.equal(confirmed.ok,true);
assert.equal(confirmed.fact.confirmation_state,'FACT_CONFIRMED');
assert.equal(confirmed.fact.confirmed_by,'PARENT');
assert.equal(confirmed.fact.analysis_state,'READY_FOR_INTERPRETATION');
assert.equal(assignments.pendingChildFacts().length,0);

assert.throws(
  ()=>assignments.reviewChildFact(child2.assignment_id,{actor:'CHILD',decision:'CONFIRM'}),
  /PARENT_REVIEW_REQUIRED/
);

console.log('PASS: CHILD input requires Parent review before FACT confirmation and Planner eligibility');
