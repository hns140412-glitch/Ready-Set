(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyLearningReferenceV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.3.0';
  const AUTHORITY={
    ASSIGNMENT_FACT:{rank:100,role:'EXECUTION_TRUTH',can_override_assignment:false},
    TEACHER_INSTRUCTION:{rank:95,role:'LOCAL_INSTRUCTION',can_override_assignment:false},
    OFFICIAL_CURRICULUM:{rank:80,role:'CONCEPT_SKILL_REFERENCE',can_override_assignment:false},
    VERIFIED_SUBJECT_MASTER:{rank:75,role:'SUBJECT_METHOD_REFERENCE',can_override_assignment:false},
    PUBLIC_DIAGNOSTIC:{rank:50,role:'SUPPLEMENTARY_DIAGNOSTIC',can_override_assignment:false},
    COMMUNITY_REFERENCE:{rank:20,role:'IDEA_ONLY',can_override_assignment:false}
  };

  const SUBJECTS={
    '연산':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','OFFICIAL_CURRICULUM'],
      method:'PROCEDURAL_FLUENCY_WITH_ERROR_CHECK',
      evidence_refs:['READY_TALENT_WEEKLY_FACT','OFFICIAL_ELEMENTARY_MATH_CURRICULUM_SET'],
      unresolved:[]
    },
    '한자':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION'],
      method:'FORM_SOUND_MEANING_RECALL',
      evidence_refs:['READY_TALENT_WEEKLY_FACT'],
      unresolved:['OFFICIAL_CURRICULUM_MAPPING_NOT_BOUND']
    },
    '국어':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','OFFICIAL_CURRICULUM','PUBLIC_DIAGNOSTIC'],
      method:'READ_UNDERSTAND_EVIDENCE_RESPOND',
      evidence_refs:[
        'DRIVE:1eStKtnFuxAwjMIuK2UcaqElMdxNkMEoX',
        'DRIVE:1etdoU35AIduFqjXUqPfidMiQAfqzLoVS',
        'EBS_OR_KICE_LITERACY_REFERENCE_SET'
      ],
      unresolved:['GRADE_STANDARD_MAPPING_NOT_YET_BOUND']
    },
    '사회':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','OFFICIAL_CURRICULUM','VERIFIED_SUBJECT_MASTER'],
      method:'WHY_ORIGIN_COMPONENTS_VISUAL_COMPARE_APPLY',
      evidence_refs:['GUIDE_SUBJECT_MASTER_SOCIAL_LOOP'],
      unresolved:['OFFICIAL_CURRICULUM_SOURCE_POINTER_NOT_YET_BOUND']
    },
    '수학':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','OFFICIAL_CURRICULUM'],
      method:'CONCEPT_APPLY_ERROR_CORRECTION',
      evidence_refs:['OFFICIAL_ELEMENTARY_MATH_CURRICULUM_SET'],
      unresolved:['GRADE_STANDARD_MAPPING_NOT_YET_BOUND']
    },
    '과학':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','OFFICIAL_CURRICULUM'],
      method:'OBSERVE_QUESTION_HYPOTHESIS_EVIDENCE_EXPLAIN',
      evidence_refs:['OFFICIAL_ELEMENTARY_SCIENCE_CURRICULUM_SET'],
      unresolved:['GRADE_STANDARD_MAPPING_NOT_YET_BOUND']
    },
    '생각하는 피자':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','VERIFIED_SUBJECT_MASTER'],
      method:'EXPLORE_REASON_EXPLAIN',
      evidence_refs:['READY_TALENT_WEEKLY_FACT'],
      unresolved:[]
    },
    '영어':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','OFFICIAL_CURRICULUM'],
      method:'INPUT_RECALL_COMPREHENSION_PRODUCTION_REVIEW',
      evidence_refs:['OFFICIAL_ELEMENTARY_ENGLISH_CURRICULUM_SET'],
      unresolved:['GRADE_STANDARD_MAPPING_NOT_YET_BOUND']
    },
    '피아노':{
      reference_classes:['ASSIGNMENT_FACT','TEACHER_INSTRUCTION','VERIFIED_SUBJECT_MASTER'],
      method:'SCORE_UNDERSTAND_SECTION_PRACTICE_RECORD_COMPARE_NEXT_ACTION',
      evidence_refs:['DRIVE:18V1TAlSP3hKJOxln-HwTEfb_t5FWikfK'],
      unresolved:['EXTERNAL_DIFFICULTY_DATABASE_NOT_BOUND']
    }
  };

  function clean(v){return String(v??'').trim();}
  function subjectMasterApi(){
    if(typeof globalThis!=='undefined'&&globalThis.ReadySubjectMasterV01)return globalThis.ReadySubjectMasterV01;
    if(typeof require==='function'){try{return require('./ready-subject-master-v01.js')}catch{}}
    return null;
  }
  function standardMatcherApi(){
    if(typeof globalThis!=='undefined'&&globalThis.ReadyLearningStandardMatcherV01)return globalThis.ReadyLearningStandardMatcherV01;
    if(typeof require==='function'){try{return require('./ready-learning-standard-matcher-v01.js')}catch{}}
    return null;
  }
  function resolve(subject,context={}){
    const key=clean(subject);
    const row=SUBJECTS[key];
    if(!row){
      return {
        subject:key||null,
        status:'REFERENCE_GAP',
        reference_classes:['ASSIGNMENT_FACT'],
        method:'SOURCE_FACT_ONLY',
        evidence_refs:[],
        unresolved:['SUBJECT_REFERENCE_PROFILE_MISSING']
      };
    }
    const subjectMaster=subjectMasterApi()?.resolve?.(key,context)||null;
    const standardMatch=standardMatcherApi()?.match?.(key,context)||null;
    const unresolved=[
      ...row.unresolved,
      ...(subjectMaster?.unresolved||[]),
      ...(standardMatch?.unresolved||[])
    ];
    return {
      subject:key,
      status:unresolved.length?'PARTIAL_REFERENCE':'REFERENCE_READY',
      reference_classes:[...row.reference_classes],
      method:row.method,
      evidence_refs:[...new Set([...row.evidence_refs,...(subjectMaster?.source_refs||[])])],
      subject_master:subjectMaster,
      standard_match:standardMatch,
      unresolved:[...new Set(unresolved)]
    };
  }

  return {version:VERSION,AUTHORITY,SUBJECTS,resolve};
});
