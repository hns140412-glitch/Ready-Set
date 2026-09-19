(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyLearningMasterV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='0.1.0';
  const PROFILE={
    '연산':{activity_types:['REPETITIVE_CALCULATION'],cognitive_load:['FATIGUE_ACCUMULATION'],default_boundary:'PROBLEM_SET'},
    '한자':{activity_types:['MEMORY','RECALL'],cognitive_load:['RETRIEVAL_LOAD'],default_boundary:'CHARACTER_SET'},
    '국어':{activity_types:['READING','COMPREHENSION','WRITING'],cognitive_load:['LANGUAGE_INTEGRATION'],default_boundary:'TEXT_OR_QUESTION_CLUSTER'},
    '사회':{activity_types:['READING','CONCEPT_LINKAGE'],cognitive_load:['CONCEPT_CONNECTION'],default_boundary:'TOPIC_CLUSTER'},
    '수학':{activity_types:['CONCEPT','APPLICATION','CORRECTION'],cognitive_load:['REASONING','ERROR_CORRECTION'],default_boundary:'CONCEPT_PROBLEM_CLUSTER'},
    '생각하는 피자':{activity_types:['REASONING','EXPLORATION'],cognitive_load:['SUSTAINED_THINKING'],default_boundary:'EXPLORATION_CLUSTER'},
    'WORKBOOK_RANGE':{activity_types:['PRACTICE'],cognitive_load:['SUBJECT_DEPENDENT'],default_boundary:'SKILL_CLUSTER'},
    'PRINT':{activity_types:['PRINT_ACTIVITY'],cognitive_load:['CONTENT_DEPENDENT'],default_boundary:'PRINT_UNIT'},
    'vocabulary':{activity_types:['MEMORY','RECALL'],cognitive_load:['RETRIEVAL_LOAD'],default_boundary:'VOCABULARY_SET'},
    'listening':{activity_types:['LISTENING'],cognitive_load:['AUDITORY_ATTENTION'],default_boundary:'AUDIO_SEGMENT'},
    'recording':{activity_types:['SPEAKING','RECORDING'],cognitive_load:['PRODUCTION_LOAD'],default_boundary:'RECORDING_PROMPT'},
    'writing':{activity_types:['WRITING'],cognitive_load:['LANGUAGE_PRODUCTION'],default_boundary:'WRITING_PROMPT'}
  };
  const now=()=>new Date().toISOString();
  const id=p=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const clean=v=>String(v??'').trim();

  function assertReady(fact){
    if(!fact)throw new Error('assignment fact required');
    if(fact.confirmation_state!=='FACT_CONFIRMED')throw new Error('FACT_CONFIRMED required');
    if(fact.deadline_state==='NEXT_ACADEMY_UNVERIFIED')throw new Error('NEXT_ACADEMY_UNVERIFIED');
    if(!clean(fact.source_range) && fact.source_type==='TALENT_BOOK_ASSIGNMENT')throw new Error('source range required');
  }
  function unitBase(fact,analysis,kind,index,extra={}){
    const p=PROFILE[kind]||PROFILE[fact.book_subject]||PROFILE.WORKBOOK_RANGE;
    return {
      learning_unit_id:id('unit'),
      analysis_id:analysis.analysis_id,
      assignment_id:fact.assignment_id,
      subject:fact.book_subject||fact.subject,
      concept_skill_target:extra.concept_skill_target||'SUBJECT_MASTER_REFINEMENT_REQUIRED',
      source_range:extra.source_range??fact.source_range??null,
      activity_types:clone(extra.activity_types||p.activity_types),
      cognitive_load_profile:clone(extra.cognitive_load_profile||p.cognitive_load),
      divisible_boundary:extra.divisible_boundary||p.default_boundary,
      prerequisite:extra.prerequisite||null,
      parent_help_dependency:extra.parent_help_dependency||'UNRESOLVED',
      analysis_provenance:{engine:'READY_LEARNING_MASTER_V01',version:VERSION,assignment_id:fact.assignment_id,source_claim_ids:(fact.claims||[]).filter(x=>x.status!=='SUPERSEDED').map(x=>x.claim_id)},
      confidence:extra.confidence??0.55,
      unresolved_flags:clone(extra.unresolved_flags||['CONCEPT_SKILL_REQUIRES_SUBJECT_ANALYSIS']),
      ordinal:index,
      state:'INTERPRETED'
    };
  }
  function talentUnits(fact,analysis){
    const p=PROFILE[fact.book_subject];
    return [unitBase(fact,analysis,fact.book_subject,0,{
      concept_skill_target:clean(fact.teacher_instruction)||'SUBJECT_MASTER_REFINEMENT_REQUIRED',
      activity_types:p.activity_types,cognitive_load_profile:p.cognitive_load,divisible_boundary:p.default_boundary,
      unresolved_flags:clean(fact.teacher_instruction)?[]:['CONCEPT_SKILL_REQUIRES_SUBJECT_ANALYSIS']
    })];
  }
  function englishUnits(fact,analysis){
    const out=[];let n=0;
    if(clean(fact.source_range))out.push(unitBase(fact,analysis,'WORKBOOK_RANGE',n++,{source_range:fact.source_range}));
    for(const [weekday,value] of Object.entries(fact.weekday_prints||{}))if(clean(value))out.push(unitBase(fact,analysis,'PRINT',n++,{source_range:clean(value),divisible_boundary:'PRINT_UNIT',concept_skill_target:weekday+'_PRINT'}));
    for(const [kind,value] of Object.entries(fact.components||{}))if(clean(value))out.push(unitBase(fact,analysis,kind,n++,{source_range:clean(value),concept_skill_target:kind.toUpperCase()}));
    return out;
  }
  function interpretFact(fact,input={}){
    assertReady(fact);
    const analysis={analysis_id:id('analysis'),assignment_id:fact.assignment_id,analysis_version:VERSION,state:'INTERPRETED',created_at:now(),provenance:{kind:'LEARNING_MASTER',actor:input.actor||'SYSTEM',source_fact_updated_at:fact.updated_at||null},confidence:0.55,unresolved_flags:[]};
    const units=fact.source_type==='TALENT_BOOK_ASSIGNMENT'?talentUnits(fact,analysis):fact.source_type==='ENGLISH_ACADEMY_PACKAGE'?englishUnits(fact,analysis):[unitBase(fact,analysis,'WORKBOOK_RANGE',0)];
    if(!units.length)throw new Error('no interpretable learning units');
    analysis.learning_unit_ids=units.map(x=>x.learning_unit_id);
    analysis.primary_split_basis='LEARNING_UNIT';
    analysis.page_count_role='SECONDARY_SOURCE_FACT';
    analysis.minutes_role='OBSERVATION_ONLY';
    return {analysis,learning_units:units};
  }
  function interpretInto(domainState,assignmentId,input={}){
    const s=domainState;const fact=s.assignmentFacts?.[assignmentId];const result=interpretFact(fact,input);
    s.analyses[result.analysis.analysis_id]=clone(result.analysis);
    for(const unit of result.learning_units)s.learningUnits[unit.learning_unit_id]=clone(unit);
    fact.analysis_state='INTERPRETED';fact.current_analysis_id=result.analysis.analysis_id;fact.updated_at=now();
    return clone(result);
  }
  function interpretConfirmed(assignmentId,input={}){
    const domain=globalThis.ReadyAssignments;
    if(!domain)throw new Error('ReadyAssignments runtime required');
    const state=domain.load(),result=interpretInto(state,assignmentId,input);domain.save(state);return result;
  }
  function interpretAllConfirmed(input={}){
    const domain=globalThis.ReadyAssignments;
    if(!domain)throw new Error('ReadyAssignments runtime required');
    const state=domain.load(),results=[];
    for(const fact of Object.values(state.assignmentFacts)){
      if(fact.confirmation_state==='FACT_CONFIRMED'&&fact.analysis_state!=='INTERPRETED')results.push(interpretInto(state,fact.assignment_id,input));
    }
    domain.save(state);return results;
  }
  return {version:VERSION,PROFILE,interpretFact,interpretInto,interpretConfirmed,interpretAllConfirmed};
});
