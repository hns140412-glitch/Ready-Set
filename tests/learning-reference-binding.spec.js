const { test, expect } = require('@playwright/test');

const learningMaster=require('../ready-learning-master-v01.js');
const reference=require('../ready-learning-reference-v01.js');
const matcher=require('../ready-learning-standard-matcher-v01.js');
const registry=require('../ready-official-standard-registry-v01.js');
const unitMap=require('../ready-official-unit-map-v01.js');

test('official reference registry and unit-map coverage stay complete for supported core subjects', async ()=>{
  for(const [subject,expected] of Object.entries({국어:34,사회:27,수학:45,과학:51})){
    expect(registry.COVERAGE[subject].status).toBe('VERIFIED_FULL_SUBJECT_COVERAGE');
    expect(registry.COVERAGE[subject].verified_record_count).toBe(expected);
    expect(unitMap.coverage(subject).status).toBe('VERIFIED_FULL_UNIT_MAPPING_COVERAGE');
    expect(unitMap.coverage(subject).mapped_standard_count).toBe(expected);
  }
  expect(registry.COVERAGE.영어.status).toBe('VERIFIED_FULL_SUBJECT_COVERAGE');
  expect(unitMap.DATASET.english_status).toBe('NO_STANDARD_UNIT_CONNECTION_TABLE_IN_THIS_SOURCE');
});

test('Learning Master binds actual math assignment context to verified standard and verified unit evidence', async ()=>{
  const fact={
    assignment_id:'fact_math_5_1_u2',
    source_type:'TALENT_BOOK_ASSIGNMENT',
    confirmation_state:'FACT_CONFIRMED',
    book_subject:'수학',
    subject:'수학',
    workbook_name:'수학 5-1',
    source_range:'1~6번',
    teacher_instruction:'약수와 공약수, 최대공약수를 구하고 설명하기',
    grade:5,
    semester:1,
    unit_name:'약수와 배수',
    claims:[]
  };
  const result=learningMaster.interpretFact(fact);
  expect(result.analysis.learning_reference.status).toBe('REFERENCE_READY');
  expect(result.analysis.learning_reference.standard_match.status).toBe('MATCHED_VERIFIED_STANDARD');
  expect(result.analysis.learning_reference.standard_match.official_standard_code).toBe('6수01-04');
  expect(result.analysis.learning_reference.standard_match.unit_mapping_evidence.status).toBe('UNIT_MAPPING_CONTEXT_MATCHED');
  expect(result.analysis.learning_reference.standard_match.unit_mapping_evidence.selected.unit_title).toBe('약수와 배수');

  const unit=result.learning_units[0];
  expect(unit.analysis_provenance.learning_reference.standard_match.official_standard_code).toBe('6수01-04');
  expect(unit.analysis_provenance.learning_reference.standard_match.unit_mapping_evidence.status).toBe('UNIT_MAPPING_CONTEXT_MATCHED');
});

test('official binding fails closed when assignment context is insufficient instead of inventing a standard', async ()=>{
  const resolved=reference.resolve('수학',{
    workbook_name:'수학 문제집',
    source_range:'1~6번',
    teacher_instruction:'문제를 풀어 오기'
  });
  expect(resolved.status).toBe('PARTIAL_REFERENCE');
  expect(resolved.standard_match.official_standard_code).toBeNull();
  expect(resolved.unresolved).toContain('OFFICIAL_STANDARD_CODE_NOT_BOUND');
});

test('English may bind verified achievement standard while keeping unit mapping explicitly unavailable', async ()=>{
  const matched=matcher.match('영어',{
    teacher_instruction:'예시문을 참고해 목적에 맞는 글쓰기와 쓰기 활동',
    component:'writing',
    components_text:'writing: 목적에 맞는 간단한 글쓰기'
  });
  expect(matched.status).toBe('MATCHED_VERIFIED_STANDARD');
  expect(matched.official_standard_code).toBe('6영02-08');
  expect(matched.unit_mapping_evidence).toBeNull();
});
