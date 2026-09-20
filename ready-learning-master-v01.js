(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyLearningMasterV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.5.1';
  const referenceApi=()=>{
    if(typeof globalThis!=='undefined'&&globalThis.ReadyLearningReferenceV01)return globalThis.ReadyLearningReferenceV01;
    if(typeof require==='function'){try{return require('./ready-learning-reference-v01.js')}catch{}}
    return null;
  };
  const PROFILE={
    '연산':{
      activity_types:['REPETITIVE_CALCULATION','SELF_CHECK'],
      activity_sequence:['SOLVE','CHECK','MARK_ERROR'],
      cognitive_load:['PROCEDURAL_FLUENCY','FATIGUE_ACCUMULATION'],
      default_boundary:'PROBLEM_CLUSTER',
      base_difficulty:2,
      activity_load_score:3,
      recovery_need:'MEDIUM',
      parent_help_dependency:'LOW',
      split_policy:{kind:'ITEM',max_span:20},
      default_goal:'정확도와 계산 유창성 확보'
    },
    '한자':{
      activity_types:['MEMORY','RECALL','SELF_CHECK'],
      activity_sequence:['ENCODE','RECALL','CHECK'],
      cognitive_load:['MEMORY_ENCODING','RETRIEVAL_LOAD'],
      default_boundary:'CHARACTER_CLUSTER',
      base_difficulty:2,
      activity_load_score:3,
      recovery_need:'LOW',
      parent_help_dependency:'LOW',
      split_policy:{kind:'ITEM',max_span:12},
      default_goal:'형태·음·뜻 기억과 회상'
    },
    '국어':{
      activity_types:['READING','COMPREHENSION','WRITING'],
      activity_sequence:['READ','UNDERSTAND','RESPOND'],
      cognitive_load:['LANGUAGE_INTEGRATION','WRITTEN_EXPRESSION'],
      default_boundary:'TEXT_OR_QUESTION_CLUSTER',
      base_difficulty:3,
      activity_load_score:4,
      recovery_need:'MEDIUM',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'ITEM',max_span:8},
      default_goal:'읽기 이해와 근거 있는 표현'
    },
    '사회':{
      activity_types:['READING','CONCEPT_LINKAGE','RECALL'],
      activity_sequence:['READ','CONNECT_CONCEPTS','RECALL'],
      cognitive_load:['CONCEPT_CONNECTION','MEMORY_RETRIEVAL'],
      default_boundary:'TOPIC_CLUSTER',
      base_difficulty:3,
      activity_load_score:4,
      recovery_need:'MEDIUM',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'ITEM',max_span:8},
      default_goal:'핵심 개념 이해와 관계 연결'
    },
    '수학':{
      activity_types:['CONCEPT','APPLICATION','ERROR_CORRECTION'],
      activity_sequence:['UNDERSTAND_CONCEPT','APPLY','CHECK_ERROR'],
      cognitive_load:['REASONING','TRANSFER','ERROR_CORRECTION'],
      default_boundary:'CONCEPT_PROBLEM_CLUSTER',
      base_difficulty:4,
      activity_load_score:5,
      recovery_need:'HIGH',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'ITEM',max_span:6},
      default_goal:'개념 이해 후 적용과 오류 수정'
    },
    '과학':{
      activity_types:['OBSERVATION','QUESTION','EVIDENCE','EXPLANATION'],
      activity_sequence:['OBSERVE','QUESTION','CONNECT_EVIDENCE','EXPLAIN'],
      cognitive_load:['CAUSAL_REASONING','EVIDENCE_INTEGRATION'],
      default_boundary:'CONCEPT_EVIDENCE_CLUSTER',
      base_difficulty:4,
      activity_load_score:4,
      recovery_need:'MEDIUM',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'ITEM',max_span:6},
      default_goal:'관찰과 근거를 연결해 과학 개념을 설명'
    },
    '피아노':{
      activity_types:['SCORE_READING','SECTION_PRACTICE','PERFORMANCE','SELF_REVIEW'],
      activity_sequence:['READ_SCORE','PRACTICE_SECTION','PERFORM_RECORD','COMPARE','NEXT_ACTION'],
      cognitive_load:['MOTOR_COORDINATION','AUDITORY_MONITORING','EXPRESSIVE_CONTROL'],
      default_boundary:'MUSICAL_SECTION',
      base_difficulty:4,
      activity_load_score:5,
      recovery_need:'HIGH',
      parent_help_dependency:'LOW',
      split_policy:{kind:'NONE',max_span:null},
      default_goal:'악보 이해-구간 연습-연주 비교-다음 행동으로 연결'
    },
    '생각하는 피자':{
      activity_types:['REASONING','EXPLORATION','EXPLANATION'],
      activity_sequence:['EXPLORE','REASON','EXPLAIN'],
      cognitive_load:['SUSTAINED_THINKING','OPEN_ENDED_REASONING'],
      default_boundary:'EXPLORATION_CLUSTER',
      base_difficulty:5,
      activity_load_score:5,
      recovery_need:'HIGH',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'NONE',max_span:null},
      default_goal:'탐색·추론·설명 과정 유지'
    },
    'WORKBOOK_RANGE':{
      activity_types:['PRACTICE','SELF_CHECK'],
      activity_sequence:['PRACTICE','CHECK'],
      cognitive_load:['SUBJECT_DEPENDENT'],
      default_boundary:'SKILL_CLUSTER',
      base_difficulty:3,
      activity_load_score:3,
      recovery_need:'MEDIUM',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'ITEM',max_span:10},
      default_goal:'워크북 범위의 핵심 기능 연습'
    },
    'PRINT':{
      activity_types:['PRINT_ACTIVITY','SELF_CHECK'],
      activity_sequence:['COMPLETE','CHECK'],
      cognitive_load:['CONTENT_DEPENDENT'],
      default_boundary:'PRINT_UNIT',
      base_difficulty:3,
      activity_load_score:3,
      recovery_need:'LOW',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'NONE',max_span:null},
      default_goal:'프린트 과제 완수'
    },
    'vocabulary':{
      activity_types:['MEMORY','RECALL','SELF_CHECK'],
      activity_sequence:['ENCODE','RECALL','CHECK'],
      cognitive_load:['RETRIEVAL_LOAD'],
      default_boundary:'VOCABULARY_SET',
      base_difficulty:2,
      activity_load_score:3,
      recovery_need:'LOW',
      parent_help_dependency:'LOW',
      split_policy:{kind:'ITEM',max_span:15},
      default_goal:'단어 기억과 회상'
    },
    'listening':{
      activity_types:['LISTENING','COMPREHENSION'],
      activity_sequence:['LISTEN','UNDERSTAND','CHECK'],
      cognitive_load:['AUDITORY_ATTENTION'],
      default_boundary:'AUDIO_SEGMENT',
      base_difficulty:3,
      activity_load_score:3,
      recovery_need:'LOW',
      parent_help_dependency:'LOW',
      split_policy:{kind:'NONE',max_span:null},
      default_goal:'듣기 이해와 핵심 정보 파악'
    },
    'recording':{
      activity_types:['SPEAKING','RECORDING','SELF_REVIEW'],
      activity_sequence:['PREPARE','SPEAK','REVIEW'],
      cognitive_load:['PRODUCTION_LOAD','SELF_MONITORING'],
      default_boundary:'RECORDING_PROMPT',
      base_difficulty:4,
      activity_load_score:4,
      recovery_need:'MEDIUM',
      parent_help_dependency:'LOW',
      split_policy:{kind:'NONE',max_span:null},
      default_goal:'말하기 산출과 자기 점검'
    },
    'writing':{
      activity_types:['WRITING','REVISION'],
      activity_sequence:['PLAN','WRITE','REVISE'],
      cognitive_load:['LANGUAGE_PRODUCTION','WORKING_MEMORY'],
      default_boundary:'WRITING_PROMPT',
      base_difficulty:4,
      activity_load_score:5,
      recovery_need:'HIGH',
      parent_help_dependency:'UNRESOLVED',
      split_policy:{kind:'NONE',max_span:null},
      default_goal:'계획-쓰기-수정의 표현 과정 완성'
    }
  };

  const now=()=>new Date().toISOString();
  const id=p=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const clean=v=>String(v??'').trim();
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function assertReady(fact){
    if(!fact)throw new Error('assignment fact required');
    if(fact.confirmation_state!=='FACT_CONFIRMED')throw new Error('FACT_CONFIRMED required');
    if(fact.deadline_state==='NEXT_ACADEMY_UNVERIFIED')throw new Error('NEXT_ACADEMY_UNVERIFIED');
    if(!clean(fact.source_range) && fact.source_type==='TALENT_BOOK_ASSIGNMENT')throw new Error('source range required');
  }

  function rangeDescriptor(raw){
    const text=clean(raw);
    if(!text)return {raw:null,kind:'NONE',start:null,end:null,count:null,splittable:false};
    const compact=text.replace(/\s+/g,'');
    const numbers=[...compact.matchAll(/\d+/g)].map(x=>Number(x[0]));
    const pageLike=/(^|[^a-z])(p\.?|page|쪽)/i.test(compact);
    const itemLike=/(번|문제|문항|개|단어|한자)/.test(compact);
    if(numbers.length>=2 && numbers[1]>=numbers[0]){
      const kind=pageLike?'PAGE':itemLike?'ITEM':'AMBIGUOUS_NUMERIC_RANGE';
      return {raw:text,kind,start:numbers[0],end:numbers[1],count:numbers[1]-numbers[0]+1,splittable:kind==='ITEM'};
    }
    if(numbers.length===1){
      const kind=pageLike?'PAGE_SINGLE':itemLike?'ITEM_SINGLE':'UNSTRUCTURED';
      return {raw:text,kind,start:numbers[0],end:numbers[0],count:1,splittable:false};
    }
    return {raw:text,kind:'UNSTRUCTURED',start:null,end:null,count:null,splittable:false};
  }

  function splitRange(raw,profile,options={}){
    const desc=rangeDescriptor(raw);
    const basePolicy=profile.split_policy||{kind:'NONE'};
    const policy={...basePolicy};
    if(Number.isFinite(options.max_span)&&options.max_span>0)policy.max_span=Math.max(1,Math.floor(options.max_span));
    if(policy.kind!=='ITEM'||!desc.splittable||!Number.isFinite(policy.max_span)||policy.max_span<=0){
      return [{source_range:clean(raw)||null,range_descriptor:desc}];
    }
    const chunks=[];
    for(let start=desc.start;start<=desc.end;start+=policy.max_span){
      const end=Math.min(desc.end,start+policy.max_span-1);
      chunks.push({
        source_range:start===end?String(start):`${start}~${end}`,
        range_descriptor:{...desc,start,end,count:end-start+1,derived_from:desc.raw}
      });
    }
    return chunks;
  }

  function adaptiveReviewPolicy(analysis,profile){
    const signal=analysis?.escalation_review_signal;
    if(!signal||signal.authority!=='ESCALATION_ADVISORY_ONLY')return null;
    const states=(signal.states||[]).map(clean).filter(Boolean);
    const repeatedFriction=states.filter(x=>['PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT'].includes(x)).length;
    const helpBlocked=states.some(x=>['BLOCKED','WAITING_FOR_PARENT'].includes(x));
    const depth=Math.max(0,Number(signal.carry_over_depth)||0);
    const baseSpan=Number(profile?.split_policy?.max_span)||null;
    return {
      authority:'ADAPTIVE_REVIEW_ONLY',
      reduce_unit_span:!!(baseSpan&&repeatedFriction>=2&&depth>=3),
      max_span:baseSpan?Math.max(1,Math.ceil(baseSpan/2)):null,
      add_checkpoint:repeatedFriction>=2,
      recovery_floor:(depth>=4||repeatedFriction>=3)?'HIGH':repeatedFriction>=2?'MEDIUM':null,
      parent_help_floor:helpBlocked?'HIGH':repeatedFriction>=3?'MEDIUM':null,
      evidence:{repeated_friction_count:repeatedFriction,carry_over_depth:depth,states:[...states]}
    };
  }

  function reviewAdjustedSequence(sequence=[],policy){
    const out=[...(sequence||[])];
    if(!policy?.add_checkpoint||!out.length)return out;
    if(out.includes('SHORT_CHECKPOINT'))return out;
    const at=Math.max(1,out.length-1);
    out.splice(at,0,'SHORT_CHECKPOINT');
    return out;
  }

  function recoveryRank(v){return ({LOW:1,MEDIUM:2,HIGH:3})[clean(v)]||0}
  function helpRank(v){return ({LOW:1,UNRESOLVED:1,MEDIUM:2,HIGH:3})[clean(v)]||0}
  function maxRecovery(a,b){return recoveryRank(b)>recoveryRank(a)?b:a}
  function maxHelp(a,b){return helpRank(b)>helpRank(a)?b:a}

  function difficulty(profile,instruction,rangeDesc){
    const text=clean(instruction);
    let score=profile.base_difficulty||3;
    if(/복습|기본|반복|외우|암기/.test(text))score-=1;
    if(/응용|심화|서술|추론|설명|창의|생각/.test(text))score+=1;
    if(rangeDesc?.count>=20)score+=1;
    return clamp(score,1,5);
  }

  function conceptTarget(fact,profile,kind){
    const instruction=clean(fact.teacher_instruction);
    if(instruction)return instruction;
    if(kind==='PRINT')return 'PRINT_TASK_TARGET_REQUIRES_CONTENT_READING';
    return profile.default_goal||'SUBJECT_MASTER_REFINEMENT_REQUIRED';
  }

  function unitBase(fact,analysis,kind,index,extra={}){
    const subjectKey=fact.book_subject||fact.subject;
    const profile=(kind==='WORKBOOK_RANGE'&&PROFILE[subjectKey])?PROFILE[subjectKey]:(PROFILE[kind]||PROFILE[subjectKey]||PROFILE.WORKBOOK_RANGE);
    const desc=extra.range_descriptor||rangeDescriptor(extra.source_range??fact.source_range);
    const reviewPolicy=adaptiveReviewPolicy(analysis,profile);
    const unresolved=[...(extra.unresolved_flags||[])];
    if(!clean(fact.teacher_instruction)&&!extra.concept_skill_target)unresolved.push('CONCEPT_TARGET_INFERRED_FROM_SUBJECT_PROFILE');
    if(desc.kind==='AMBIGUOUS_NUMERIC_RANGE')unresolved.push('RANGE_SEMANTICS_AMBIGUOUS_NOT_SPLIT');
    if(/^PAGE/.test(desc.kind))unresolved.push('PAGE_RANGE_RETAINED_AS_SOURCE_ONLY');

    return {
      learning_unit_id:id('unit'),
      analysis_id:analysis.analysis_id,
      assignment_id:fact.assignment_id,
      subject:fact.book_subject||fact.subject,
      concept_skill_target:extra.concept_skill_target||conceptTarget(fact,profile,kind),
      learning_goal:extra.learning_goal||profile.default_goal||null,
      source_range:extra.source_range??fact.source_range??null,
      range_descriptor:clone(desc),
      activity_types:clone(extra.activity_types||profile.activity_types),
      activity_sequence:clone(reviewAdjustedSequence(extra.activity_sequence||profile.activity_sequence||[],reviewPolicy)),
      cognitive_load_profile:clone(extra.cognitive_load_profile||profile.cognitive_load),
      activity_load:{
        score:extra.activity_load_score??profile.activity_load_score??3,
        recovery_need:maxRecovery(extra.recovery_need||profile.recovery_need||'MEDIUM',reviewPolicy?.recovery_floor||null),
        difficulty:extra.difficulty??difficulty(profile,fact.teacher_instruction,desc)
      },
      divisible_boundary:extra.divisible_boundary||profile.default_boundary,
      prerequisite:extra.prerequisite||null,
      parent_help_dependency:maxHelp(extra.parent_help_dependency||profile.parent_help_dependency||'UNRESOLVED',reviewPolicy?.parent_help_floor||null),
      review_policy:extra.review_policy||(
        (profile.activity_types||[]).includes('ERROR_CORRECTION')?'ERROR_DRIVEN':
        (profile.activity_types||[]).includes('SELF_CHECK')?'SELF_CHECK_AFTER_EXECUTION':'RESULT_DEPENDENT'
      ),
      analysis_provenance:{
        engine:'READY_LEARNING_MASTER',
        version:VERSION,
        assignment_id:fact.assignment_id,
        source_claim_ids:(fact.claims||[]).filter(x=>x.status!=='SUPERSEDED').map(x=>x.claim_id),
        cross_revision_learning_signal:analysis.cross_revision_learning_signal?clone(analysis.cross_revision_learning_signal):null,
        escalation_review_signal:analysis.escalation_review_signal?clone(analysis.escalation_review_signal):null,
        adaptive_review_policy:reviewPolicy?clone(reviewPolicy):null,
        learning_reference:(()=>{
          const ref=referenceApi()?.resolve?.(subjectKey,{
            workbook_name:fact.workbook_name||fact.workbook_ref_id||null,
            source_range:extra.source_range??fact.source_range??null,
            teacher_instruction:fact.teacher_instruction||null,
            grade:fact.grade||null,
            semester:fact.semester||null,
            unit_name:fact.unit_name||null
          });
          return ref?{
            status:ref.status,
            reference_classes:ref.reference_classes,
            method:ref.method,
            evidence_refs:ref.evidence_refs,
            standard_match:ref.standard_match||null
          }:null;
        })()
      },
      confidence:extra.confidence??(clean(fact.teacher_instruction)?0.78:0.62),
      unresolved_flags:[...new Set(unresolved)],
      ordinal:index,
      state:'INTERPRETED'
    };
  }

  function talentUnits(fact,analysis){
    const profile=PROFILE[fact.book_subject]||PROFILE.WORKBOOK_RANGE;
    const reviewPolicy=adaptiveReviewPolicy(analysis,profile);
    const chunks=splitRange(fact.source_range,profile,{max_span:reviewPolicy?.reduce_unit_span?reviewPolicy.max_span:null});
    return chunks.map((chunk,index)=>unitBase(fact,analysis,fact.book_subject,index,{
      source_range:chunk.source_range,
      range_descriptor:chunk.range_descriptor,
      concept_skill_target:clean(fact.teacher_instruction)||null,
      divisible_boundary:profile.default_boundary
    }));
  }

  function englishUnits(fact,analysis){
    const out=[];let n=0;
    if(clean(fact.source_range)){
      const profile=PROFILE.WORKBOOK_RANGE;
      const reviewPolicy=adaptiveReviewPolicy(analysis,profile);
      for(const chunk of splitRange(fact.source_range,profile,{max_span:reviewPolicy?.reduce_unit_span?reviewPolicy.max_span:null})){
        out.push(unitBase(fact,analysis,'WORKBOOK_RANGE',n++,{
          source_range:chunk.source_range,
          range_descriptor:chunk.range_descriptor,
          concept_skill_target:clean(fact.teacher_instruction)||profile.default_goal
        }));
      }
    }
    for(const [weekday,value] of Object.entries(fact.weekday_prints||{})){
      if(clean(value))out.push(unitBase(fact,analysis,'PRINT',n++,{
        source_range:clean(value),
        divisible_boundary:'PRINT_UNIT',
        concept_skill_target:`${weekday}_PRINT`,
        learning_goal:'해당 요일 프린트 과제 완수'
      }));
    }
    for(const [kind,value] of Object.entries(fact.components||{})){
      if(clean(value))out.push(unitBase(fact,analysis,kind,n++,{
        source_range:clean(value),
        concept_skill_target:kind.toUpperCase()
      }));
    }
    return out;
  }

  function interpretFact(fact,input={}){
    assertReady(fact);
    const analysis={
      analysis_id:id('analysis'),
      assignment_id:fact.assignment_id,
      analysis_version:VERSION,
      state:'INTERPRETED',
      created_at:now(),
      provenance:{kind:'LEARNING_MASTER',actor:input.actor||'SYSTEM',source_fact_updated_at:fact.updated_at||null,fact_revision:Number(fact.fact_revision)||1,previous_analysis_ids:[...(fact.previous_analysis_ids||[])]},
      cross_revision_learning_signal:input.learning_signal?clone(input.learning_signal):null,
      escalation_review_signal:input.escalation_review_signal?clone(input.escalation_review_signal):null,
      review_reason:clean(input.review_reason)||null,
      confidence:clean(fact.teacher_instruction)?0.78:0.62,
      unresolved_flags:[]
    };
    const units=fact.source_type==='TALENT_BOOK_ASSIGNMENT'
      ?talentUnits(fact,analysis)
      :fact.source_type==='ENGLISH_ACADEMY_PACKAGE'
        ?englishUnits(fact,analysis)
        :[unitBase(fact,analysis,'WORKBOOK_RANGE',0)];

    if(!units.length)throw new Error('no interpretable learning units');
    analysis.learning_unit_ids=units.map(x=>x.learning_unit_id);
    analysis.primary_split_basis='LEARNING_ACTIVITY_BOUNDARY';
    analysis.page_count_role='SECONDARY_SOURCE_FACT_ONLY';
    analysis.minutes_role='OBSERVATION_ONLY';
    analysis.load_model='SUBJECT_ACTIVITY_DIFFICULTY_RECOVERY';
    analysis.subject_profile=fact.book_subject||fact.subject||null;
    analysis.adaptive_review_policy=adaptiveReviewPolicy(analysis,PROFILE[analysis.subject_profile]||PROFILE.WORKBOOK_RANGE);
    const ref=referenceApi()?.resolve?.(analysis.subject_profile,{
      workbook_name:fact.workbook_name||fact.workbook_ref_id||null,
      title:fact.title||null,
      source_range:fact.source_range||null,
      teacher_instruction:fact.teacher_instruction||null,
      grade:fact.grade||null,
      semester:fact.semester||null,
      unit_name:fact.unit_name||null,
      components_text:fact.components?Object.entries(fact.components).map(([k,v])=>k+':'+v).join(' | '):null
    });
    analysis.learning_reference=ref||{subject:analysis.subject_profile,status:'REFERENCE_GAP',reference_classes:['ASSIGNMENT_FACT'],method:'SOURCE_FACT_ONLY',evidence_refs:[],unresolved:['REFERENCE_REGISTRY_UNAVAILABLE']};
    analysis.unresolved_flags=[...new Set([
      ...units.flatMap(x=>x.unresolved_flags||[]),
      ...(analysis.learning_reference.unresolved||[])
    ])];
    return {analysis,learning_units:units};
  }

  function interpretInto(domainState,assignmentId,input={}){
    const s=domainState;
    const fact=s.assignmentFacts?.[assignmentId];
    if(fact?.workbook_ref_id&&!fact.workbook_name&&s.workbookRefs?.[fact.workbook_ref_id]?.name){
      fact.workbook_name=s.workbookRefs[fact.workbook_ref_id].name;
    }
    const result=interpretFact(fact,input);
    s.analyses[result.analysis.analysis_id]=clone(result.analysis);
    for(const unit of result.learning_units)s.learningUnits[unit.learning_unit_id]=clone(unit);
    fact.analysis_state='INTERPRETED';
    fact.current_analysis_id=result.analysis.analysis_id;
    fact.updated_at=now();
    return clone(result);
  }

  function interpretConfirmed(assignmentId,input={}){
    const domain=globalThis.ReadyAssignments;
    if(!domain)throw new Error('ReadyAssignments runtime required');
    const state=domain.load();
    const fact=state.assignmentFacts?.[assignmentId];
    if(input.force_review===true&&fact?.current_analysis_id){
      const previous=state.analyses?.[fact.current_analysis_id];
      if(previous){
        previous.state='SUPERSEDED';
        previous.superseded_at=now();
        previous.supersede_reason=clean(input.review_reason)||'LEARNING_MASTER_REVIEW';
      }
      for(const unit of Object.values(state.learningUnits||{})){
        if(unit.analysis_id===fact.current_analysis_id&&unit.state==='INTERPRETED'){
          unit.state='SUPERSEDED';
          unit.superseded_at=now();
          unit.supersede_reason=clean(input.review_reason)||'LEARNING_MASTER_REVIEW';
        }
      }
      fact.previous_analysis_ids=[...new Set([...(fact.previous_analysis_ids||[]),fact.current_analysis_id])];
      fact.analysis_state='REVIEW_REQUIRED';
      fact.current_analysis_id=null;
    }
    const result=interpretInto(state,assignmentId,input);
    domain.save(state);
    return result;
  }

  function interpretAllConfirmed(input={}){
    const domain=globalThis.ReadyAssignments;
    if(!domain)throw new Error('ReadyAssignments runtime required');
    const state=domain.load(),results=[];
    for(const fact of Object.values(state.assignmentFacts)){
      if(fact.confirmation_state==='FACT_CONFIRMED'&&fact.analysis_state!=='INTERPRETED'){
        results.push(interpretInto(state,fact.assignment_id,input));
      }
    }
    domain.save(state);
    return results;
  }

  return {version:VERSION,PROFILE,rangeDescriptor,splitRange,interpretFact,interpretInto,interpretConfirmed,interpretAllConfirmed};
});
