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
