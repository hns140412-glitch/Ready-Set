(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadySubjectMasterV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.2.0';
  const GRADE_BAND='ELEMENTARY_5_6';
  const OFFICIAL_BASE={
    curriculum:'2022_REVISED_KOREA_NATIONAL_CURRICULUM',
    authority:'NATIONAL_EDUCATION_COMMISSION__MINISTRY_OF_EDUCATION__NCIC',
    effective_for_grade_band:'2026-03-01',
    current_elementary_framework_notice:'NCEC_NOTICE_2026_1',
    subject_curriculum_notice:'MOE_NOTICE_2022_33',
    notice_scope_note:'NCEC_NOTICE_2026_1 amends general/elementary framework books and does not replace the subject-specific curriculum books used here.',
    source_refs:[
      'NCEC_NOTICE_2026_1_ELEMENTARY_FRAMEWORK',
      'MOE_NOTICE_2022_33_SUBJECT_CURRICULA',
      'NCIC_2022_REVISED_ELEMENTARY_ACHIEVEMENT_STANDARDS'
    ]
  };

  const SUBJECTS={
    '연산':{
      authority:'PROGRAM_SPECIFIC_SUBJECT_MASTER',
      grade_band:GRADE_BAND,
      domains:['기초 연산','정확도','계산 유창성','오류 점검'],
      learning_loop:['SOLVE','CHECK','MARK_ERROR','RETRY'],
      mapping_policy:'ACTUAL_WORKBOOK_RANGE_IS_PRIMARY',
      source_refs:['READY_TALENT_WEEKLY_FACT'],
      unresolved:[]
    },
    '한자':{
      authority:'PROGRAM_SPECIFIC_SUBJECT_MASTER',
      grade_band:GRADE_BAND,
      domains:['형태','음','뜻','회상','쓰기'],
      learning_loop:['ENCODE','RECALL','CHECK','RETRY'],
      mapping_policy:'ACTUAL_WORKBOOK_RANGE_IS_PRIMARY',
      source_refs:['READY_TALENT_WEEKLY_FACT'],
      unresolved:[]
    },
    '생각하는 피자':{
      authority:'PROGRAM_SPECIFIC_SUBJECT_MASTER',
      grade_band:GRADE_BAND,
      domains:['탐색','추론','전략','설명','비교'],
      learning_loop:['EXPLORE','REASON','EXPLAIN','COMPARE','REFLECT'],
      mapping_policy:'TEACHER_INSTRUCTION_AND_TASK_STRUCTURE_ARE_PRIMARY',
      source_refs:['READY_TALENT_WEEKLY_FACT'],
      unresolved:[]
    },
    '국어':{
      authority:'OFFICIAL_CURRICULUM',
      grade_band:GRADE_BAND,
      domains:['듣기·말하기','읽기','쓰기','문법','문학','매체'],
      learning_loop:['READ_OR_LISTEN','UNDERSTAND','FIND_EVIDENCE','RESPOND_OR_EXPRESS','REVIEW'],
      mapping_policy:'FACT_AND_TEXTBOOK_RANGE_REQUIRED_FOR_UNIT_BINDING',
      source_refs:[
        ...OFFICIAL_BASE.source_refs,
        'DRIVE:1eStKtnFuxAwjMIuK2UcaqElMdxNkMEoX',
        'DRIVE:1etdoU35AIduFqjXUqPfidMiQAfqzLoVS'
      ],
      unresolved:['TEXTBOOK_UNIT_TO_STANDARD_BINDING_REQUIRES_ACTUAL_BOOK_CONTEXT']
    },
    '수학':{
      authority:'OFFICIAL_CURRICULUM',
      grade_band:GRADE_BAND,
      domains:['수와 연산','변화와 관계','도형과 측정','자료와 가능성'],
      learning_loop:['UNDERSTAND_CONCEPT','REPRESENT','APPLY','COMPARE_STRATEGY','CHECK_ERROR','TRANSFER'],
      mapping_policy:'FACT_AND_TEXTBOOK_RANGE_REQUIRED_FOR_UNIT_BINDING',
      source_refs:[...OFFICIAL_BASE.source_refs,'NCIC_ELEMENTARY_5_6_MATH_ACHIEVEMENT_STANDARDS'],
      unresolved:['TEXTBOOK_UNIT_TO_STANDARD_BINDING_REQUIRES_ACTUAL_BOOK_CONTEXT']
    },
    '사회':{
      authority:'OFFICIAL_CURRICULUM_PLUS_VERIFIED_SUBJECT_METHOD',
      grade_band:GRADE_BAND,
      domains:['지리','일반사회','역사'],
      learning_loop:['WHY_ORIGIN','COMPONENTS_OR_SYSTEM','MAP_TABLE_PHOTO_EVIDENCE','COMPARE','REAL_LIFE_CASE','APPLY_NEW_CASE','RETURN_TO_TEXT'],
      mapping_policy:'FACT_AND_TEXTBOOK_RANGE_REQUIRED_FOR_UNIT_BINDING',
      source_refs:[...OFFICIAL_BASE.source_refs,'GUIDE_SUBJECT_MASTER_SOCIAL_LOOP'],
      unresolved:['TEXTBOOK_UNIT_TO_STANDARD_BINDING_REQUIRES_ACTUAL_BOOK_CONTEXT']
    },
    '과학':{
      authority:'OFFICIAL_CURRICULUM',
      grade_band:GRADE_BAND,
      domains:['운동과 에너지','물질','생명','지구와 우주','과학과 사회'],
      learning_loop:['OBSERVE','QUESTION','PREDICT_OR_HYPOTHESIZE','CONNECT_EVIDENCE','EXPLAIN','APPLY'],
      mapping_policy:'FACT_AND_TEXTBOOK_RANGE_REQUIRED_FOR_UNIT_BINDING',
      source_refs:[...OFFICIAL_BASE.source_refs,'NCIC_ELEMENTARY_5_6_SCIENCE_CURRICULUM'],
      unresolved:['TEXTBOOK_UNIT_TO_STANDARD_BINDING_REQUIRES_ACTUAL_BOOK_CONTEXT']
    },
    '영어':{
      authority:'OFFICIAL_CURRICULUM',
      grade_band:GRADE_BAND,
      domains:['이해','표현'],
      learning_loop:['INPUT','NOTICE_MEANING','RECALL','COMPREHEND','PRODUCE','SELF_REVIEW'],
      mapping_policy:'FACT_COMPONENT_AND_TEXTBOOK_CONTEXT_REQUIRED_FOR_STANDARD_BINDING',
      source_refs:[...OFFICIAL_BASE.source_refs,'NCIC_ELEMENTARY_5_6_ENGLISH_ACHIEVEMENT_STANDARDS'],
      unresolved:['TEXTBOOK_UNIT_TO_STANDARD_BINDING_REQUIRES_ACTUAL_BOOK_CONTEXT']
    },
    '피아노':{
      authority:'VERIFIED_SUBJECT_MASTER',
      grade_band:'LEARNER_LEVEL_BASED',
      domains:['악보 이해','리듬·템포','음·박자 정확성','양손 협응','아티큘레이션','페달','프레이즈·표현','구간 반복','녹음 비교','성장 기록'],
      learning_loop:['READ_SCORE','IDENTIFY_RISK_SECTION','PRACTICE_SECTION','PERFORM_RECORD','COMPARE_TO_SELF','NEXT_ACTION'],
      mapping_policy:'SCORE_SECTION_AND_TEACHER_INSTRUCTION_REQUIRED',
      source_refs:['DRIVE:18V1TAlSP3hKJOxln-HwTEfb_t5FWikfK'],
      unresolved:['ABRSM_RCM_HENLE_LIVE_DATABASE_NOT_BOUND']
    }
  };

  function clean(v){return String(v??'').trim();}
  function resolve(subject,context={}){
    const key=clean(subject);
    const row=SUBJECTS[key];
    if(!row)return {
      subject:key||null,
      status:'SUBJECT_MASTER_GAP',
      grade_band:null,
      domains:[],
      learning_loop:[],
      source_refs:[],
      unresolved:['SUBJECT_MASTER_NOT_DEFINED']
    };
    const actualContext=!!(
      clean(context.workbook_name)||
      clean(context.source_range)||
      clean(context.teacher_instruction)||
      clean(context.unit_name)
    );
    return {
      subject:key,
      status:actualContext?'SUBJECT_MASTER_CONTEXT_READY':'SUBJECT_MASTER_REFERENCE_ONLY',
      authority:row.authority,
      grade_band:row.grade_band,
      domains:[...row.domains],
      learning_loop:[...row.learning_loop],
      mapping_policy:row.mapping_policy,
      source_refs:[...row.source_refs],
      unresolved:[
        ...row.unresolved,
        ...(actualContext?[]:['ACTUAL_UNIT_CONTEXT_REQUIRED'])
      ]
    };
  }

  return {version:VERSION,GRADE_BAND,OFFICIAL_BASE,SUBJECTS,resolve};
});
