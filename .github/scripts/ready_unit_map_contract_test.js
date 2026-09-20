const assert=require('assert');
const registry=require('../../ready-official-standard-registry-v01.js');
const unitMap=require('../../ready-official-unit-map-v01.js');

assert.strictEqual(registry.DATASET.coverage_status,'VERIFIED_FULL_CORE_SUBJECT_COVERAGE');
assert.strictEqual(registry.RECORDS.length,177);
assert.strictEqual(unitMap.version,'0.2.0');
assert.strictEqual(unitMap.RECORDS.length,196);

const expected={국어:34,사회:27,수학:45,과학:51};
for(const [subject,count] of Object.entries(expected)){
  assert.strictEqual(unitMap.COVERAGE[subject].status,'FULL_SOURCE_TABLE_STRUCTURED');
  const standardCodes=new Set(registry.list(subject).map(x=>x.code));
  const mappedCodes=new Set(unitMap.listBySubject(subject).map(x=>x.standard_code));
  assert.strictEqual(standardCodes.size,count,subject+' registry count');
  assert.strictEqual(mappedCodes.size,count,subject+' unit-map standard count');
  for(const code of standardCodes)assert(mappedCodes.has(code),subject+' missing '+code);
}
assert.strictEqual(unitMap.COVERAGE['영어'].status,'UNIT_MAPPING_SOURCE_GAP');
assert.strictEqual(unitMap.listBySubject('영어').length,0);

assert.strictEqual(unitMap.listByCode('6국01-03').length,4);
assert.strictEqual(unitMap.listByCode('6수01-11').length,2);

const math=unitMap.evaluate('6수03-19',{grade:6,semester:1,unit_name:'6. 직육면체의 겉넓이와 부피'});
assert.strictEqual(math.status,'UNIT_MAPPING_CONTEXT_MATCHED');

const social=unitMap.evaluate('6사09-02',{grade:6,semester:1,unit_name:'3. 지구, 대륙 그리고 국가들'});
assert.strictEqual(social.status,'UNIT_MAPPING_CONTEXT_MATCHED');

const korean=unitMap.evaluate('6국01-03',{grade:6,semester:2,unit_name:'2. 궁금한 점을 해결해요'});
assert.strictEqual(korean.status,'UNIT_MAPPING_CONTEXT_MATCHED');

const mismatch=unitMap.evaluate('6과01-01',{grade:6,semester:2,unit_name:'4. 과학과 나의 진로'});
assert.notStrictEqual(mismatch.status,'UNIT_MAPPING_CONTEXT_MATCHED');

console.log(JSON.stringify({
  pass:true,
  standard_coverage:157,
  mapping_records:196,
  subjects:{korean:34,social:27,math:45,science:51},
  english:'UNIT_MAPPING_SOURCE_GAP',
  multi_mapping_preserved:true
}));
