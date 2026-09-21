'use strict';

const assert=require('node:assert/strict');
const Subject=require('../ready-subject-master-v01.js');
const LearningMaster=require('../ready-learning-master-v01.js');

function includesAll(actual, expected, label){
  for(const item of expected) assert.ok(actual.includes(item), label+': missing '+item);
}

const math=Subject.resolve('수학',{grade:'5',semester:'1',unit_name:'분수',matched_domain:'수와 연산'});
assert.equal(math.method_variant,'CONCEPT_VISUAL_RELATION_PRIORITY');
includesAll(math.learning_loop,[
  'SCENE_OR_VISUAL_MODEL','RESTATE_QUESTION','UNDERSTAND_CONCEPT',
  'REPRESENT_RELATION','PREDICT','SOLVE','EXPLAIN','TRANSFER',
  'CHECK_ERROR','RECONSTRUCT_CONCEPT_IF_NEEDED'
],'math loop');

const history=Subject.resolve('사회',{
  grade:'5',semester:'2',unit_name:'조선 사회',matched_domain:'역사',
  teacher_instruction:'조선 시대 유물과 사료를 보고 설명하기'
});
assert.equal(history.method_variant,'KOREAN_HISTORY_EVIDENCE_ROUTE');
includesAll(history.learning_loop,[
  'QUESTION','LIFE_SOCIETY_CONTEXT','OBJECT_SITE','PRIMARY_SOURCE_RECORD',
  'MAP_TIMELINE','CLAIM_EVIDENCE','EXPLAIN'
],'history loop');

includesAll(Subject.resolve('영어',{teacher_instruction:'영어 단어 읽고 쓰기'}).learning_loop,
  ['BIDIRECTIONAL_RECALL','SELECTIVE_RELEARN','PRODUCE'],'english loop');
includesAll(Subject.resolve('국어',{teacher_instruction:'글을 읽고 근거 찾기'}).learning_loop,
  ['TOOL_LANGUAGE_GATE','MEANING_CONTEXT_REUSE','RESPOND_OR_EXPRESS'],'korean loop');
includesAll(Subject.resolve('한자',{teacher_instruction:'한자의 음과 뜻 익히기'}).learning_loop,
  ['FORM','SOUND','CORE_MEANING','VERIFIED_RELATION','COMPOUND_WORD','SCENE_CONTEXT','RECALL'],'hanja loop');

const mathFact={
  assignment_id:'a_math',
  confirmation_state:'FACT_CONFIRMED',
  deadline_state:'DATE_CONFIRMED',
  source_type:'TALENT_BOOK_ASSIGNMENT',
  book_subject:'수학',
  subject:'수학',
  source_range:'1~6번',
  grade:'5',
  semester:'1',
  unit_name:'분수',
  teacher_instruction:'분수의 뜻과 관계를 그림으로 이해하고 설명하기',
  claims:[]
};
const mathResult=LearningMaster.interpretFact(mathFact);
assert.ok(mathResult.learning_units.length>0);
includesAll(mathResult.learning_units[0].activity_sequence,
  ['SCENE_OR_VISUAL_MODEL','RESTATE_QUESTION','PREDICT','EXPLAIN','RECONSTRUCT_CONCEPT_IF_NEEDED'],
  'math learning unit');

const historyFact={
  assignment_id:'a_history',
  confirmation_state:'FACT_CONFIRMED',
  deadline_state:'DATE_CONFIRMED',
  source_type:'TALENT_BOOK_ASSIGNMENT',
  book_subject:'사회',
  subject:'사회',
  source_range:'1~4번',
  grade:'5',
  semester:'2',
  unit_name:'조선 사회',
  teacher_instruction:'조선 시대 유물과 사료를 보고 변화의 근거를 설명하기',
  claims:[]
};
const historyResult=LearningMaster.interpretFact(historyFact);
assert.ok(historyResult.learning_units.length>0);
assert.equal(historyResult.learning_units[0].analysis_provenance.learning_reference.matched_domain,'역사');
includesAll(historyResult.learning_units[0].activity_sequence,
  ['QUESTION','PRIMARY_SOURCE_RECORD','CLAIM_EVIDENCE','EXPLAIN','CROSS_PERIOD_CONNECTION'],
  'history learning unit');

console.log('SUBJECT_METHOD_ROUTING_PASS');
