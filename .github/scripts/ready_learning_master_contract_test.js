#!/usr/bin/env node
const assert=require('assert');
const domainCore=require('../../ready-assignment-domain-v2.js');
const learning=require('../../ready-learning-master-v01.js');
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}}
const domain=domainCore.createDomain(new MemoryStorage());
const books=domainCore.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`p.${i*4+1}~${i*4+4}`,teacher_instruction:subject==='수학'?'분수 개념과 적용':'',artifact_refs:[`cover_${subject}`],answer_reference_ids:[`answer_${subject}`]}));
const pkg=domain.upsertTalentPackage({actor:'PARENT',source_date:'2026-09-15',deadline_boundary:'2026-09-22',books});
assert.strictEqual(pkg.fact_ids.length,6);
let state=domain.load();
for(const assignmentId of pkg.fact_ids)domain.confirmFact(assignmentId,{actor:'PARENT'});
state=domain.load();
const all=[];
for(const assignmentId of pkg.fact_ids)all.push(learning.interpretInto(state,assignmentId));
domain.save(state);
assert.strictEqual(all.length,6);
assert(all.every(x=>x.analysis.primary_split_basis==='LEARNING_ACTIVITY_BOUNDARY'));
assert(all.every(x=>x.analysis.minutes_role==='OBSERVATION_ONLY'));
assert(all.every(x=>x.learning_units.length===1));
const math=all.flatMap(x=>x.learning_units).find(x=>x.subject==='수학');
assert(math.activity_types.includes('CONCEPT'));
assert(math.cognitive_load_profile.includes('ERROR_CORRECTION'));
assert.strictEqual(math.concept_skill_target,'분수 개념과 적용');
assert(!('estimated_minutes' in math));
assert(!('page_count' in math));
const workbook=domain.upsertWorkbookRef({name:'English Workbook A',subject:'영어',provenance:{kind:'PARENT_CAPTURE'}});
const pending=domain.upsertEnglishAssignment({assignment_id:'eng_1',actor:'CHILD',workbook_ref_id:workbook.workbook_ref_id,source_date:'2026-09-16',source_range:'p.32~41',weekday_prints:{MON:'print A',WED:'print B'},components:{vocabulary:'unit 3',listening:'track 4'},next_academy:''});
assert.throws(()=>learning.interpretFact(pending),/FACT_CONFIRMED/);
domain.confirmFact('eng_1',{actor:'PARENT'});
state=domain.load();
assert.throws(()=>learning.interpretFact(state.assignmentFacts.eng_1),/NEXT_ACADEMY_UNVERIFIED/);
const eng2=domain.upsertEnglishAssignment({assignment_id:'eng_2',actor:'PARENT',workbook_ref_id:workbook.workbook_ref_id,source_date:'2026-09-16',source_range:'p.32~41',weekday_prints:{MON:'print A',WED:'print B'},components:{vocabulary:'unit 3',listening:'track 4',recording:'sentence 2',writing:'paragraph 1'},next_academy:'2026-09-23'});
domain.confirmFact(eng2.assignment_id,{actor:'PARENT'});
state=domain.load();
const interpreted=learning.interpretInto(state,eng2.assignment_id);
assert.strictEqual(interpreted.learning_units.length,7);
assert.strictEqual(interpreted.learning_units.filter(x=>x.divisible_boundary==='PRINT_UNIT').length,2);
assert(interpreted.learning_units.every(x=>x.assignment_id==='eng_2'));
const conflictId='eng_conflict';
domain.upsertEnglishAssignment({assignment_id:conflictId,actor:'PARENT',workbook_ref_id:workbook.workbook_ref_id,source_date:'2026-09-16',source_range:'p.1~5',next_academy:'2026-09-23'});
domain.upsertEnglishAssignment({assignment_id:conflictId,actor:'CHILD',workbook_ref_id:workbook.workbook_ref_id,source_date:'2026-09-16',source_range:'p.1~8',next_academy:'2026-09-23'});
state=domain.load();
assert.strictEqual(state.assignmentFacts[conflictId].confirmation_state,'CONFIRMATION_REQUIRED');
assert.throws(()=>domain.confirmFact(conflictId,{actor:'PARENT'}),/conflict resolution required/);
console.log(JSON.stringify({pass:true,talent_books:6,english_units:7,physical_page_not_learning_unit:true,minutes_not_primary:true,conflict_blocks_interpretation:true}));

const reference=require('../../ready-learning-reference-v01.js');
const science=learning.interpretFact({assignment_id:'sci_1',source_type:'SCHOOL_EVENT',subject:'과학',confirmation_state:'FACT_CONFIRMED',deadline_state:null,source_range:'1~6',teacher_instruction:'관찰 결과를 근거로 설명',claims:[]});
assert(science.learning_units[0].activity_types.includes('OBSERVATION'));
assert.strictEqual(science.analysis.learning_reference.subject,'과학');
const piano=learning.interpretFact({assignment_id:'piano_1',source_type:'SCHOOL_EVENT',subject:'피아노',confirmation_state:'FACT_CONFIRMED',deadline_state:null,source_range:'24~27마디',teacher_instruction:'오른손 구간 연습 후 녹음',claims:[]});
assert(piano.learning_units[0].activity_types.includes('PERFORMANCE'));
assert.strictEqual(piano.analysis.learning_reference.method,'SCORE_UNDERSTAND_SECTION_PRACTICE_RECORD_COMPARE_NEXT_ACTION');
assert.strictEqual(reference.resolve('미등록과목').status,'REFERENCE_GAP');

const subjectMaster=require('../../ready-subject-master-v01.js');
const gradeBandMath=subjectMaster.resolve('수학',{source_range:'1~10',teacher_instruction:'분수 계산'});
assert.strictEqual(gradeBandMath.grade_band,'ELEMENTARY_5_6');
assert(gradeBandMath.domains.includes('수와 연산'));
assert.strictEqual(gradeBandMath.status,'SUBJECT_MASTER_CONTEXT_READY');
const koreanRef=reference.resolve('국어',{source_range:'3~5',teacher_instruction:'근거를 찾아 요약'});
assert(koreanRef.subject_master.domains.includes('읽기'));
assert(koreanRef.evidence_refs.some(x=>x.includes('1eStKtnFuxAwjMIuK2UcaqElMdxNkMEoX')));
const scienceRef=reference.resolve('과학',{source_range:'1~6',teacher_instruction:'관찰 결과 설명'});
assert(scienceRef.subject_master.domains.includes('운동과 에너지'));
const pianoRef=reference.resolve('피아노',{source_range:'24~27마디',teacher_instruction:'오른손 연습 후 녹음'});
assert.strictEqual(pianoRef.subject_master.grade_band,'LEARNER_LEVEL_BASED');
assert(pianoRef.subject_master.domains.includes('녹음 비교'));

const arithmeticMaster=subjectMaster.resolve('연산',{source_range:'1~20'});
assert.strictEqual(arithmeticMaster.status,'SUBJECT_MASTER_CONTEXT_READY');
assert(arithmeticMaster.domains.includes('계산 유창성'));
const hanjaMaster=subjectMaster.resolve('한자',{source_range:'1~12'});
assert(hanjaMaster.domains.includes('회상'));
const pizzaMaster=subjectMaster.resolve('생각하는 피자',{teacher_instruction:'풀이 방법을 설명'});
assert(pizzaMaster.learning_loop.includes('EXPLAIN'));

const standardMatcher=require('../../ready-learning-standard-matcher-v01.js');

const mathMatch=standardMatcher.match('수학',{teacher_instruction:'분수 계산을 풀고 틀린 문제 다시 확인'});
assert.strictEqual(mathMatch.status,'MATCHED_DOMAIN_CANDIDATE');
assert.strictEqual(mathMatch.selected.domain,'수와 연산');
assert.strictEqual(mathMatch.official_standard_code,null);
assert.strictEqual(mathMatch.standard_binding_status,'UNBOUND_REQUIRES_VERIFIED_STANDARD_RECORD');

const koreanMatch=standardMatcher.match('국어',{teacher_instruction:'글을 읽고 중심 내용을 찾아 근거를 들어 요약'});
assert.strictEqual(koreanMatch.selected.domain,'읽기');
assert(koreanMatch.selected.matched_terms.includes('근거'));

const scienceMatch=standardMatcher.match('과학',{teacher_instruction:'지층과 화석을 관찰하고 증거를 설명'});
assert.strictEqual(scienceMatch.selected.domain,'지구와 우주');
assert.strictEqual(scienceMatch.confidence,'HIGH');

const socialMatch=standardMatcher.match('사회',{teacher_instruction:'지도에서 지역의 위치와 지형을 비교'});
assert.strictEqual(socialMatch.selected.domain,'지리');

const englishMatch=standardMatcher.match('영어',{components_text:'listening:Track 4 | writing:Paragraph 1'});
assert(['CANDIDATE','MATCHED_DOMAIN_CANDIDATE'].includes(englishMatch.status));
assert(englishMatch.candidates.some(x=>x.domain==='이해'));
assert(englishMatch.candidates.some(x=>x.domain==='표현'));

const pianoMatch=standardMatcher.match('피아노',{source_range:'24~27마디',teacher_instruction:'오른손 구간 반복 후 녹음'});
assert.strictEqual(pianoMatch.selected.domain,'구간 반복');
assert.strictEqual(pianoMatch.standard_binding_status,'NOT_APPLICABLE');

const noContextMatch=standardMatcher.match('과학',{});
assert.strictEqual(noContextMatch.status,'REFERENCE_GAP');

const unknownMatch=standardMatcher.match('미등록과목',{teacher_instruction:'복습'});
assert.strictEqual(unknownMatch.status,'REFERENCE_GAP');

const scienceRefWithMatch=reference.resolve('과학',{teacher_instruction:'지층과 화석 관찰 결과 설명'});
assert.strictEqual(scienceRefWithMatch.standard_match.selected.domain,'지구와 우주');

const scienceFactWithMatch=learning.interpretFact({
  assignment_id:'sci_match_1',source_type:'SCHOOL_EVENT',subject:'과학',
  confirmation_state:'FACT_CONFIRMED',source_range:'교과서 42~45쪽',
  teacher_instruction:'지층과 화석을 관찰하고 증거를 설명',claims:[]
});
assert.strictEqual(scienceFactWithMatch.analysis.learning_reference.standard_match.selected.domain,'지구와 우주');
assert.strictEqual(scienceFactWithMatch.analysis.learning_reference.standard_match.official_standard_code,null);
assert.strictEqual(scienceFactWithMatch.learning_units[0].analysis_provenance.learning_reference.standard_match.selected.domain,'지구와 우주');

assert.strictEqual(subjectMaster.OFFICIAL_BASE.current_elementary_framework_notice,'NCEC_NOTICE_2026_1');
assert.strictEqual(subjectMaster.OFFICIAL_BASE.subject_curriculum_notice,'MOE_NOTICE_2022_33');
assert(standardMatcher.OFFICIAL_STANDARD_DATASET.source_refs.includes('NCEC_NOTICE_2026_1_ELEMENTARY_FRAMEWORK'));
assert(standardMatcher.OFFICIAL_STANDARD_DATASET.source_refs.includes('MOE_NOTICE_2022_33_SUBJECT_CURRICULA'));

const officialRegistry=require('../../ready-official-standard-registry-v01.js');

assert.strictEqual(officialRegistry.DATASET.coverage_status,'VERIFIED_FULL_CORE_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.findByCode('6수04-01').subject,'수학');
assert.strictEqual(officialRegistry.findByCode('6과01-03').domain,'지구와 우주');
assert.strictEqual(officialRegistry.findByCode('6영01-08').domain,'이해');

const avgBound=standardMatcher.match('수학',{teacher_instruction:'평균의 의미를 알고 자료를 모아 평균을 구하고 해석'});
assert.strictEqual(avgBound.status,'MATCHED_VERIFIED_STANDARD');
assert.strictEqual(avgBound.official_standard_code,'6수04-01');
assert.strictEqual(avgBound.standard_binding_status,'BOUND_VERIFIED_RECORD');

const fractionStillUnbound=standardMatcher.match('수학',{teacher_instruction:'분수 계산을 풀고 틀린 문제 다시 확인'});
assert.strictEqual(fractionStillUnbound.selected.domain,'수와 연산');
assert.strictEqual(fractionStillUnbound.official_standard_code,null);
assert.strictEqual(fractionStillUnbound.standard_binding_status,'UNBOUND_REQUIRES_VERIFIED_STANDARD_RECORD');

const geologyBound=standardMatcher.match('과학',{teacher_instruction:'지층의 특징을 보고 형성 과정을 모형으로 표현'});
assert.strictEqual(geologyBound.status,'MATCHED_VERIFIED_STANDARD');
assert.strictEqual(geologyBound.official_standard_code,'6과01-01');

const fossilBound=standardMatcher.match('과학',{teacher_instruction:'화석 생성 과정을 설명하고 과거 생물과 환경을 추리'});
assert.strictEqual(fossilBound.official_standard_code,'6과01-03');

const climateBound=standardMatcher.match('사회',{teacher_instruction:'우리나라 계절별 기후 특징과 기후변화 자연재해의 심각성을 탐구'});
assert.strictEqual(climateBound.status,'MATCHED_VERIFIED_STANDARD');
assert.strictEqual(climateBound.official_standard_code,'6사02-01');

const englishMediaBound=standardMatcher.match('영어',{teacher_instruction:'다양한 매체 자료를 흥미와 자신감을 가지고 듣기 읽기'});
assert.strictEqual(englishMediaBound.status,'MATCHED_VERIFIED_STANDARD');
assert.strictEqual(englishMediaBound.official_standard_code,'6영01-08');

const koreanRevisionBound=standardMatcher.match('국어',{teacher_instruction:'쓰기 과정을 점검 조정하고 통일성 있게 고쳐쓰기'});
assert.strictEqual(koreanRevisionBound.status,'MATCHED_VERIFIED_STANDARD');
assert.strictEqual(koreanRevisionBound.official_standard_code,'6국03-05');

const boundScienceFact=learning.interpretFact({
  assignment_id:'sci_bound_1',source_type:'SCHOOL_EVENT',subject:'과학',
  confirmation_state:'FACT_CONFIRMED',source_range:'교과서 42~45쪽',
  teacher_instruction:'지층의 특징을 보고 형성 과정을 모형으로 표현',claims:[]
});
assert.strictEqual(boundScienceFact.analysis.learning_reference.standard_match.official_standard_code,'6과01-01');
assert.strictEqual(boundScienceFact.learning_units[0].analysis_provenance.learning_reference.standard_match.official_standard_code,'6과01-01');

assert.strictEqual(officialRegistry.COVERAGE['영어'].status,'VERIFIED_FULL_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.COVERAGE['영어'].verified_record_count,20);
assert.strictEqual(officialRegistry.list('영어').length,20);
assert.strictEqual(officialRegistry.findByCode('6영02-10').domain,'표현');
assert.strictEqual(officialRegistry.findByCode('6영01-06').domain,'이해');
assert.strictEqual(officialRegistry.COVERAGE['과학'].status,'VERIFIED_FULL_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.findByCode('6과05-03').domain,'과학과 사회');

const englishWritingBound=standardMatcher.match('영어',{teacher_instruction:'예시문을 참고하여 목적에 맞는 간단한 글쓰기'});
assert.strictEqual(englishWritingBound.official_standard_code,'6영02-08');

const englishOrderBound=standardMatcher.match('영어',{teacher_instruction:'일상생활 글에서 사건의 순서를 파악하며 읽기'});
assert.strictEqual(englishOrderBound.official_standard_code,'6영01-06');

const scienceTechBound=standardMatcher.match('과학',{teacher_instruction:'지속가능한 삶을 위한 혼합물 분리 과학기술 장치를 조사하고 공유'});
assert.strictEqual(scienceTechBound.official_standard_code,'6과05-03');

assert.strictEqual(officialRegistry.COVERAGE['국어'].status,'VERIFIED_FULL_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.COVERAGE['국어'].verified_record_count,34);
assert.strictEqual(officialRegistry.list('국어').length,34);
assert.strictEqual(officialRegistry.findByCode('6국04-04').domain,'문법');
assert.strictEqual(officialRegistry.findByCode('6국05-03').domain,'문학');
assert.strictEqual(officialRegistry.findByCode('6국06-04').domain,'매체');

const koreanInterviewBound=standardMatcher.match('국어',{teacher_instruction:'면담 절차를 이해하고 상대와 매체를 고려해 면담'});
assert.strictEqual(koreanInterviewBound.official_standard_code,'6국01-04');

const koreanGrammarBound=standardMatcher.match('국어',{teacher_instruction:'문장 성분과 호응 관계를 살펴 올바른 문장 구성'});
assert.strictEqual(koreanGrammarBound.official_standard_code,'6국04-04');

const koreanLiteratureBound=standardMatcher.match('국어',{teacher_instruction:'소설에서 인물 사건 배경을 파악'});
assert.strictEqual(koreanLiteratureBound.official_standard_code,'6국05-03');

assert.strictEqual(officialRegistry.COVERAGE['수학'].status,'VERIFIED_FULL_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.COVERAGE['수학'].verified_record_count,45);
assert.strictEqual(officialRegistry.list('수학').length,45);
assert.strictEqual(officialRegistry.findByCode('6수01-08').domain,'수와 연산');
assert.strictEqual(officialRegistry.findByCode('6수02-04').domain,'변화와 관계');
assert.strictEqual(officialRegistry.findByCode('6수03-19').domain,'도형과 측정');
assert.strictEqual(officialRegistry.findByCode('6수04-06').domain,'자료와 가능성');
assert.strictEqual(officialRegistry.findByCode('6수03-19').source,'GOE_FRAMEWORK_56');

const fractionAdditionBound=standardMatcher.match('수학',{teacher_instruction:'분모가 다른 분수의 덧셈과 뺄셈 계산 원리를 탐구'});
assert.strictEqual(fractionAdditionBound.official_standard_code,'6수01-08');

const proportionBound=standardMatcher.match('수학',{teacher_instruction:'비례식의 성질을 이해하고 간단한 비례식을 풀기'});
assert.strictEqual(proportionBound.official_standard_code,'6수02-04');

const volumeBound=standardMatcher.match('수학',{teacher_instruction:'직육면체와 정육면체의 부피를 구하는 방법을 이해하고 계산'});
assert.strictEqual(volumeBound.official_standard_code,'6수03-19');

const probabilityBound=standardMatcher.match('수학',{teacher_instruction:'자료를 이용해 가능성을 예상하고 근거를 들어 판단'});
assert.strictEqual(probabilityBound.official_standard_code,'6수04-06');

assert.strictEqual(officialRegistry.COVERAGE['과학'].status,'VERIFIED_FULL_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.COVERAGE['과학'].verified_record_count,51);
assert.strictEqual(officialRegistry.list('과학').length,51);
assert.strictEqual(officialRegistry.findByCode('6과02-02').domain,'운동과 에너지');
assert.strictEqual(officialRegistry.findByCode('6과09-01').domain,'물질');
assert.strictEqual(officialRegistry.findByCode('6과11-01').domain,'생명');
assert.strictEqual(officialRegistry.findByCode('6과13-03').domain,'지구와 우주');
assert.strictEqual(officialRegistry.findByCode('6과16-01').domain,'과학과 사회');

const refractionBound=standardMatcher.match('과학',{teacher_instruction:'빛이 직진 반사 굴절하는 성질을 관찰'});
assert.strictEqual(refractionBound.official_standard_code,'6과02-02');

const cellBound=standardMatcher.match('과학',{teacher_instruction:'생물의 기본 단위 세포를 현미경으로 관찰'});
assert.strictEqual(cellBound.official_standard_code,'6과11-01');

const seasonBound=standardMatcher.match('과학',{teacher_instruction:'지구 자전축이 기울어진 채 공전하여 계절 변화가 생기는 원인 설명'});
assert.strictEqual(seasonBound.official_standard_code,'6과13-03');

const futureScienceBound=standardMatcher.match('과학',{teacher_instruction:'미래 사회 문제를 조사하고 과학이 기여할 방법을 토의'});
assert.strictEqual(futureScienceBound.official_standard_code,'6과16-01');

assert.strictEqual(officialRegistry.COVERAGE['사회'].status,'VERIFIED_FULL_SUBJECT_COVERAGE');
assert.strictEqual(officialRegistry.COVERAGE['사회'].verified_record_count,27);
assert.strictEqual(officialRegistry.COVERAGE['사회'].expected_total,27);
assert.deepStrictEqual(officialRegistry.COVERAGE['사회'].gaps,[]);
assert.strictEqual(officialRegistry.list('사회').length,27);
assert.strictEqual(officialRegistry.findByCode('6사07-01').domain,'역사');
assert.strictEqual(officialRegistry.findByCode('6사08-02').domain,'일반사회');
assert.strictEqual(officialRegistry.findByCode('6사10-02').domain,'지리');

const reunificationBound=standardMatcher.match('사회',{teacher_instruction:'분단으로 나타난 문제와 평화 통일을 위해 할 수 있는 일을 탐색'});
assert.strictEqual(reunificationBound.official_standard_code,'6사07-01');

const separationOfPowersBound=standardMatcher.match('사회',{teacher_instruction:'국회 행정부 법원이 하는 일과 권력 분립 이유를 탐색'});
assert.strictEqual(separationOfPowersBound.official_standard_code,'6사08-02');

const worldClimateBound=standardMatcher.match('사회',{teacher_instruction:'세계의 다양한 기후와 기후 환경이 인간생활에 미치는 관계를 탐구'});
assert.strictEqual(worldClimateBound.official_standard_code,'6사10-02');

assert.strictEqual(officialRegistry.RECORDS.length,177);
assert.deepStrictEqual({
  korean:officialRegistry.list('국어').length,
  math:officialRegistry.list('수학').length,
  social:officialRegistry.list('사회').length,
  science:officialRegistry.list('과학').length,
  english:officialRegistry.list('영어').length
},{korean:34,math:45,social:27,science:51,english:20});

const unitMap=require('../../ready-official-unit-map-v01.js');
assert.strictEqual(unitMap.listByCode('6사09-02')[0].unit_title,'지구, 대륙 그리고 국가들');
assert.strictEqual(unitMap.listByCode('6수01-05')[0].unit_title,'약수와 배수');
assert.strictEqual(unitMap.listByCode('6과01-01')[0].unit_title,'지층과 화석');

const socialWorldBound=standardMatcher.match('사회',{grade:6,semester:1,unit_name:'3. 지구, 대륙 그리고 국가들',teacher_instruction:'세계 주요 대륙과 대양, 여러 국가의 위치와 영토 특징을 이해'});
assert.strictEqual(socialWorldBound.official_standard_code,'6사09-02');
assert.strictEqual(socialWorldBound.unit_mapping_evidence.status,'UNIT_MAPPING_CONTEXT_MATCHED');
assert.strictEqual(socialWorldBound.unit_mapping_evidence.selected.grade,6);
assert.strictEqual(socialWorldBound.unit_mapping_evidence.selected.semester,1);

const mathUnitBound=standardMatcher.match('수학',{grade:5,semester:1,unit_name:'2. 약수와 배수',teacher_instruction:'배수 공배수 최소공배수를 이해하고 구하기'});
assert.strictEqual(mathUnitBound.official_standard_code,'6수01-05');
assert.strictEqual(mathUnitBound.unit_mapping_evidence.status,'UNIT_MAPPING_CONTEXT_MATCHED');

const scienceUnitBound=standardMatcher.match('과학',{grade:5,semester:1,unit_name:'1. 지층과 화석',teacher_instruction:'지층의 특징을 알고 형성 과정을 모형으로 표현'});
assert.strictEqual(scienceUnitBound.official_standard_code,'6과01-01');
assert.strictEqual(scienceUnitBound.unit_mapping_evidence.status,'UNIT_MAPPING_CONTEXT_MATCHED');

const noUnitContext=standardMatcher.match('과학',{teacher_instruction:'지층의 특징을 알고 형성 과정을 모형으로 표현'});
assert.strictEqual(noUnitContext.official_standard_code,'6과01-01');
assert.strictEqual(noUnitContext.unit_mapping_evidence.status,'UNIT_MAPPING_EVIDENCE_AVAILABLE_NOT_APPLIED');

assert.strictEqual(unitMap.version,'0.2.0');
assert.strictEqual(unitMap.COVERAGE['국어'].status,'FULL_SOURCE_TABLE_STRUCTURED');
assert.strictEqual(unitMap.COVERAGE['사회'].status,'FULL_SOURCE_TABLE_STRUCTURED');
assert.strictEqual(unitMap.COVERAGE['수학'].status,'FULL_SOURCE_TABLE_STRUCTURED');
assert.strictEqual(unitMap.COVERAGE['과학'].status,'FULL_SOURCE_TABLE_STRUCTURED');
assert.strictEqual(unitMap.COVERAGE['영어'].status,'UNIT_MAPPING_SOURCE_GAP');
assert.strictEqual(unitMap.RECORDS.length,196);

for(const subject of ['국어','사회','수학','과학']){
  const standardCodes=new Set(officialRegistry.list(subject).map(x=>x.code));
  const mappedCodes=new Set(unitMap.listBySubject(subject).map(x=>x.standard_code));
  assert.strictEqual(mappedCodes.size,standardCodes.size,`${subject} unit-map standard coverage mismatch`);
  for(const code of standardCodes)assert(mappedCodes.has(code),`${subject} missing unit map for ${code}`);
}

assert.strictEqual(unitMap.listByCode('6국01-03').length,4);
assert.strictEqual(unitMap.listByCode('6수01-11').length,2);
assert(unitMap.listByCode('6수01-11').some(x=>x.grade===6&&x.semester===1));
assert(unitMap.listByCode('6수01-11').some(x=>x.grade===6&&x.semester===2));

const mathFullMap=unitMap.evaluate('6수03-19',{grade:6,semester:1,unit_name:'6. 직육면체의 겉넓이와 부피'});
assert.strictEqual(mathFullMap.status,'UNIT_MAPPING_CONTEXT_MATCHED');
assert.strictEqual(mathFullMap.selected.unit_title,'직육면체의 겉넓이와 부피');

const koreanMultiMap=unitMap.evaluate('6국01-03',{grade:6,semester:2,unit_name:'2. 궁금한 점을 해결해요'});
assert.strictEqual(koreanMultiMap.status,'UNIT_MAPPING_CONTEXT_MATCHED');

const mismatchedUnit=unitMap.evaluate('6과01-01',{grade:6,semester:2,unit_name:'4. 과학과 나의 진로'});
assert.notStrictEqual(mismatchedUnit.status,'UNIT_MAPPING_CONTEXT_MATCHED');

assert.strictEqual(unitMap.listBySubject('영어').length,0);
