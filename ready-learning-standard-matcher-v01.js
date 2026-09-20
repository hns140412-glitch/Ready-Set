(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyLearningStandardMatcherV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.3.0';
  const OFFICIAL_STANDARD_DATASET={
    curriculum:'2022_REVISED_KOREA_NATIONAL_CURRICULUM',
    school_level:'ELEMENTARY',
    grade_band:'5_6',
    authority:'NATIONAL_EDUCATION_COMMISSION__MINISTRY_OF_EDUCATION__NCIC',
    current_elementary_framework_notice:'NCEC_NOTICE_2026_1',
    subject_curriculum_notice:'MOE_NOTICE_2022_33',
    standard_codes_bound:false,
    source_refs:[
      'NCEC_NOTICE_2026_1_ELEMENTARY_FRAMEWORK',
      'MOE_NOTICE_2022_33_SUBJECT_CURRICULA',
      'NCIC_2022_REVISED_ELEMENTARY_ACHIEVEMENT_STANDARDS'
    ]
  };

  const RULES={
    '국어':[
      {domain:'읽기',concept:'내용 이해·근거 파악',terms:['읽기','읽고','근거','요약','중심 내용','주제','내용 파악']},
      {domain:'쓰기',concept:'목적에 맞는 글쓰기',terms:['쓰기','글쓰기','문장','문단','고쳐쓰기','작성']},
      {domain:'듣기·말하기',concept:'듣기·말하기 상호작용',terms:['발표','말하기','듣기','토의','토론','면담','면담 절차','상대','질문','설명하기']},
      {domain:'문법',concept:'언어 형식과 표현',terms:['문법','맞춤법','어휘','낱말','문장 구조','문장 성분','호응 관계','띄어쓰기','시간 표현','표준어','방언','고유어','관용 표현']},
      {domain:'문학',concept:'문학 작품 이해·감상',terms:['시','동화','소설','인물','작품','감상']},
      {domain:'매체',concept:'매체 자료 이해·활용',terms:['매체','광고','영상','자료 출처','인터넷']}
    ],
    '수학':[
      {domain:'수와 연산',concept:'수 개념·계산',terms:['분수','소수','약수','배수','계산','곱셈','나눗셈','덧셈','뺄셈','수와 연산']},
      {domain:'변화와 관계',concept:'규칙·대응 관계',terms:['규칙','대응','관계','비례','변화']},
      {domain:'도형과 측정',concept:'도형·길이·넓이·각·측정',terms:['도형','각도','넓이','둘레','부피','길이','측정','삼각형','사각형','원','직육면체','정육면체','각기둥','각뿔','원기둥','원뿔','구','전개도','겉넓이','원주율','쌓기나무','대칭','합동']},
      {domain:'자료와 가능성',concept:'자료 해석·가능성',terms:['자료','그래프','표','평균','가능성','확률']}
    ],
    '사회':[
      {domain:'지리',concept:'공간·지역·지도 이해',terms:['지도','위치','지역','지형','기후','국토','공간','환경']},
      {domain:'일반사회',concept:'사회 제도·경제·공동체',terms:['경제','시장','정부','법','권리','의무','사회','공동체','민주주의']},
      {domain:'역사',concept:'시대·사건·인물의 맥락',terms:['역사','시대','왕','전쟁','유적','유물','사건','인물','조선','고려','삼국']}
    ],
    '과학':[
      {domain:'운동과 에너지',concept:'힘·운동·빛·열·에너지',terms:['힘','운동','속력','빛','렌즈','전기','열','에너지','자석']},
      {domain:'물질',concept:'물질의 성질·변화',terms:['물질','용해','용액','기체','고체','액체','혼합','상태 변화','산성','염기성']},
      {domain:'생명',concept:'생물의 구조·기능·환경',terms:['생물','식물','동물','세포','기관','생태','먹이','번식','광합성']},
      {domain:'지구와 우주',concept:'지구·대기·천체·지질',terms:['지구','우주','행성','달','별','태양','지층','화석','화석 생성','퇴적암','과거 생물과 환경','날씨','대기','계절']},
      {domain:'과학과 사회',concept:'과학 기술과 사회의 관계',terms:['과학 기술','과학기술','환경 문제','지속가능','안전','사회 문제','혼합물 분리','분리 장치','장치','조사','공유']}
    ],
    '영어':[
      {domain:'이해',concept:'듣기·읽기 이해',terms:['listening','listen','reading','read','듣기','읽기','해석','내용 이해','단어']},
      {domain:'표현',concept:'말하기·쓰기 표현',terms:['speaking','recording','writing','write','말하기','녹음','쓰기','발표','문장 만들기']}
    ],
    '피아노':[
      {domain:'악보 이해',concept:'악보·기호 읽기',terms:['악보','음표','쉼표','조표','박자표','기호']},
      {domain:'리듬·템포',concept:'리듬·속도 유지',terms:['리듬','템포','메트로놈','박자','속도']},
      {domain:'음·박자 정확성',concept:'음정·박자 정확도',terms:['정확','음정','틀린 음','박자']},
      {domain:'양손 협응',concept:'양손 협응',terms:['양손','오른손','왼손','손가락','운지']},
      {domain:'프레이즈·표현',concept:'프레이즈·다이내믹 표현',terms:['프레이즈','표현','강약','다이내믹','아티큘레이션']},
      {domain:'구간 반복',concept:'구간 반복 연습',terms:['마디','구간','반복','부분 연습']},
      {domain:'녹음 비교',concept:'연주 녹음·자기 비교',terms:['녹음','record','비교','다시 듣기']}
    ]
  };

  function officialRegistryApi(){
    if(typeof globalThis!=='undefined'&&globalThis.ReadyOfficialStandardRegistryV01)return globalThis.ReadyOfficialStandardRegistryV01;
    if(typeof require==='function'){try{return require('./ready-official-standard-registry-v01.js')}catch{}}
    return null;
  }

  const clean=v=>String(v??'').trim();
  const normalize=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
  function contextText(context={}){
    return [
      context.workbook_name,context.title,context.source_range,context.teacher_instruction,
      context.unit_name,context.component,context.components_text
    ].map(clean).filter(Boolean).join(' | ');
  }

  function scoreRule(text,rule){
    const normalized=normalize(text);
    const matched=rule.terms.filter(term=>normalized.includes(normalize(term)));
    return {score:matched.length,matched_terms:matched};
  }

  function match(subject,context={}){
    const key=clean(subject);
    const text=contextText(context);
    const rules=RULES[key]||[];
    const base={
      subject:key||null,
      matcher_version:VERSION,
      grade:context.grade||null,
      grade_band:key==='피아노'?'LEARNER_LEVEL_BASED':OFFICIAL_STANDARD_DATASET.grade_band,
      source_context_present:!!text,
      official_standard_dataset:key==='피아노'?null:{...OFFICIAL_STANDARD_DATASET},
      official_standard_code:null,
      standard_binding_status:key==='피아노'?'NOT_APPLICABLE':'UNBOUND_REQUIRES_VERIFIED_STANDARD_RECORD',
      candidates:[],
      selected:null,
      evidence_text:text||null
    };
    if(!key||!text)return {...base,status:'REFERENCE_GAP',unresolved:['ACTUAL_ASSIGNMENT_CONTEXT_REQUIRED']};
    if(!rules.length)return {...base,status:'REFERENCE_GAP',unresolved:['MATCH_RULESET_NOT_DEFINED']};

    const scored=rules.map(rule=>{
      const hit=scoreRule(text,rule);
      return {...rule,score:hit.score,matched_terms:hit.matched_terms};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.domain.localeCompare(b.domain,'ko'));

    if(!scored.length){
      return {...base,status:'SUBJECT_MASTER_ONLY',unresolved:['NO_DOMAIN_SIGNAL_IN_ACTUAL_CONTEXT']};
    }
    const top=scored[0].score;
    const topRows=scored.filter(x=>x.score===top);
    const candidates=scored.slice(0,3).map(x=>({
      domain:x.domain,concept:x.concept,score:x.score,matched_terms:[...x.matched_terms]
    }));
    if(topRows.length!==1){
      return {...base,status:'CANDIDATE',candidates,unresolved:['AMBIGUOUS_DOMAIN_MATCH','OFFICIAL_STANDARD_CODE_NOT_BOUND']};
    }
    const selected=candidates[0];
    const confidence=top>=2?'HIGH':'MEDIUM';
    if(key==='피아노'){
      return {
        ...base,
        status:'MATCHED_DOMAIN_CANDIDATE',
        confidence,
        candidates,
        selected,
        unresolved:[]
      };
    }
    const registry=officialRegistryApi();
    const officialMatch=registry?.match?.(key,selected.domain,text)||null;
    const hasVerifiedCode=officialMatch?.status==='VERIFIED_STANDARD_MATCH'&&officialMatch.selected?.code;
    return {
      ...base,
      status:hasVerifiedCode?'MATCHED_VERIFIED_STANDARD':'MATCHED_DOMAIN_CANDIDATE',
      confidence,
      candidates,
      selected,
      official_standard_code:hasVerifiedCode?officialMatch.selected.code:null,
      standard_binding_status:hasVerifiedCode?'BOUND_VERIFIED_RECORD':'UNBOUND_REQUIRES_VERIFIED_STANDARD_RECORD',
      official_standard_match:officialMatch,
      unresolved:hasVerifiedCode?[]:[
        ...(officialMatch?.unresolved||[]),
        'OFFICIAL_STANDARD_CODE_NOT_BOUND'
      ]
    };
  }

  return {version:VERSION,OFFICIAL_STANDARD_DATASET,RULES,match};
});
