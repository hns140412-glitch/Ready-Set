(function(root){
  'use strict';

  function clean(value){return String(value??'').trim();}
  function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(clean(value));}
  function ageYears(birthdate,asOf){
    if(!validDateKey(birthdate)||!validDateKey(asOf))return null;
    const [by,bm,bd]=birthdate.split('-').map(Number);
    const [ay,am,ad]=asOf.split('-').map(Number);
    if(ay<by||(ay===by&&(am<bm||(am===bm&&ad<bd))))return null;
    let age=ay-by;
    if(am<bm||(am===bm&&ad<bd))age--;
    return age>=0&&age<=120?age:null;
  }
  function ageBand(age){
    if(!Number.isFinite(age))return 'UNKNOWN';
    if(age<=7)return 'FOUNDATION_5_7';
    if(age<=10)return 'ELEMENTARY_CORE_8_10';
    if(age<=13)return 'UPPER_ELEMENTARY_11_13';
    return 'ADOLESCENT_14_PLUS';
  }
  function resolve({birthdate='',as_of=''}={}){
    const age=ageYears(clean(birthdate),clean(as_of));
    if(!Number.isFinite(age))return null;
    return Object.freeze({
      authority:'BIRTHDATE_ONLY',
      birthdate:clean(birthdate),
      as_of:clean(as_of),
      chronological_age_years:age,
      age_band:ageBand(age),
      inferred_grade:null,
      inferred_region:null,
      inferred_curriculum:null,
      can_influence:['UNIT_SPAN','CHECKPOINT_FREQUENCY'],
      cannot_influence:['GRADE','CURRICULUM','EDUCATION_POLICY','SCHEDULE_DATE','PLANNER_DATE','DEADLINE','ASSIGNMENT_FACT']
    });
  }
  function create(options={}){
    const getBirthdate=options.getBirthdate||(()=>null);
    const dateKey=options.dateKey||(()=>new Date().toLocaleDateString('sv-SE'));
    return Object.freeze({
      current:()=>resolve({birthdate:getBirthdate(),as_of:dateKey()}),
      resolve,
      ageYears,
      ageBand
    });
  }
  root.ReadyRebuildLearnerContext=Object.freeze({
    version:'READY_LEARNER_CONTEXT_V01',
    create,resolve,ageYears,ageBand
  });
})(typeof globalThis!=='undefined'?globalThis:this);
