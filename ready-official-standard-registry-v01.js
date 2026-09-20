(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyOfficialStandardRegistryV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.1.0';
  const DATASET={
    curriculum:'2022_REVISED_KOREA_NATIONAL_CURRICULUM',
    school_level:'ELEMENTARY',
    grade_band:'5_6',
    current_framework_notice:'NCEC_NOTICE_2026_1',
    subject_curriculum_notice:'MOE_NOTICE_2022_33',
    text_policy:'PARAPHRASED_INDEX_WITH_OFFICIAL_SOURCE_POINTER',
    coverage_status:'PARTIAL_VERIFIED',
    no_guessing:true
  };

  const SOURCES={
    NCIC:{
      authority:'OFFICIAL',
      organization:'NCIC',
      url:'https://ncic.re.kr/',
      note:'Official national curriculum inventory and source archive.'
    },
    GOE_KOREAN_56:{
      authority:'OFFICIAL_EDUCATION_OFFICE',
      organization:'Gyeonggi Provincial Office of Education',
      url:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202312210923589990.pdf'
    },
    GOE_SCIENCE_56:{
      authority:'OFFICIAL_EDUCATION_OFFICE',
      organization:'Gyeonggi Provincial Office of Education',
      url:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202312210923589990.pdf'
    },
    GOE_ENGLISH_56:{
      authority:'OFFICIAL_EDUCATION_OFFICE',
      organization:'Gyeonggi Provincial Office of Education',
      url:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030137/BBS_202412020312537650.pdf'
    },
    GOE_2026_EVAL:{
      authority:'OFFICIAL_EDUCATION_OFFICE',
      organization:'Gyeonggi Provincial Office of Education',
      url:'https://www.goe.go.kr/resource/goe/na/bbs_2675/2026/02/116dc7a4-254a-44fe-9e77-3e908ecc5ff3.pdf'
    },
    GOE_SOCIAL_PROJECT:{
      authority:'OFFICIAL_EDUCATION_OFFICE',
      organization:'Gyeonggi Provincial Office of Education',
      url:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202409110159438010.pdf'
    }
  };

  // semantic_summary is a compact index, not a replacement for the official wording.
  const RECORDS=[
    {code:'6국01-02',subject:'국어',domain:'듣기·말하기',semantic_summary:'주장과 이유·근거의 타당성을 평가하며 듣기',keywords:['주장','이유','근거','타당','듣기'],source:'GOE_KOREAN_56'},
    {code:'6국01-05',subject:'국어',domain:'듣기·말하기',semantic_summary:'핵심 정보를 구성하고 매체를 활용해 발표하기',keywords:['핵심 정보','자료','매체','발표'],source:'GOE_KOREAN_56'},
    {code:'6국02-01',subject:'국어',domain:'읽기',semantic_summary:'글 구조를 고려해 주제·주장을 파악하고 요약하기',keywords:['글 구조','주제','주장','요약','읽기'],source:'GOE_KOREAN_56'},
    {code:'6국02-03',subject:'국어',domain:'읽기',semantic_summary:'글·자료의 타당성과 표현 적절성 평가하기',keywords:['타당성','표현','평가','글','자료'],source:'GOE_KOREAN_56'},
    {code:'6국03-02',subject:'국어',domain:'쓰기',semantic_summary:'적절한 근거와 출처를 활용해 주장하는 글 쓰기',keywords:['근거','출처','주장','글쓰기','쓰기'],source:'GOE_KOREAN_56'},
    {code:'6국03-05',subject:'국어',domain:'쓰기',semantic_summary:'쓰기 과정을 점검·조정하고 통일성 있게 고쳐쓰기',keywords:['고쳐쓰기','점검','조정','통일성','쓰기'],source:'GOE_KOREAN_56'},
    {code:'6국06-02',subject:'국어',domain:'매체',semantic_summary:'뉴스·정보 매체 자료의 신뢰성 평가하기',keywords:['뉴스','정보','매체','신뢰성','평가'],source:'GOE_KOREAN_56'},

    {code:'6수04-01',subject:'수학',domain:'자료와 가능성',semantic_summary:'평균의 의미를 이해하고 자료의 평균을 구해 해석하기',keywords:['평균','자료','구하기','해석'],source:'GOE_2026_EVAL'},

    {code:'6사02-01',subject:'사회',domain:'지리',semantic_summary:'계절별 기후 특성과 기후변화 자연재해의 심각성 탐구',keywords:['기후','계절','기후변화','자연재해','우리나라'],source:'GOE_2026_EVAL'},
    {code:'6사08-01',subject:'사회',domain:'일반사회',semantic_summary:'민주주의에서 선거의 의미·역할과 참여 태도 이해',keywords:['민주주의','선거','주권','참여','시민'],source:'GOE_SOCIAL_PROJECT'},

    {code:'6과01-01',subject:'과학',domain:'지구와 우주',semantic_summary:'지층 특징과 형성 과정을 모형으로 표현하기',keywords:['지층','형성','모형','지질'],source:'GOE_SCIENCE_56'},
    {code:'6과01-02',subject:'과학',domain:'지구와 우주',semantic_summary:'퇴적암을 알고 알갱이 크기에 따라 분류하기',keywords:['퇴적암','이암','사암','역암','분류'],source:'GOE_SCIENCE_56'},
    {code:'6과01-03',subject:'과학',domain:'지구와 우주',semantic_summary:'화석 생성과 과거 생물·환경을 추리해 가치 이해하기',keywords:['화석','생성','과거 생물','환경','추리'],source:'GOE_SCIENCE_56'},

    {code:'6영01-01',subject:'영어',domain:'이해',semantic_summary:'단어·어구·문장의 강세·리듬·억양 식별',keywords:['강세','리듬','억양','듣기'],source:'GOE_ENGLISH_56'},
    {code:'6영01-03',subject:'영어',domain:'이해',semantic_summary:'간단한 단어·어구·문장의 의미 이해',keywords:['단어','어구','문장','의미','이해'],source:'GOE_ENGLISH_56'},
    {code:'6영01-04',subject:'영어',domain:'이해',semantic_summary:'일상생활 담화·글의 세부 정보 파악',keywords:['세부 정보','담화','글','일상생활'],source:'GOE_ENGLISH_56'},
    {code:'6영01-05',subject:'영어',domain:'이해',semantic_summary:'일상생활 담화·글의 중심 내용 파악',keywords:['중심 내용','담화','글','일상생활'],source:'GOE_ENGLISH_56'},
    {code:'6영01-07',subject:'영어',domain:'이해',semantic_summary:'적절한 전략으로 일상생활 담화·글 듣기·읽기',keywords:['전략','듣기','읽기','담화','글'],source:'GOE_ENGLISH_56'},
    {code:'6영01-08',subject:'영어',domain:'이해',semantic_summary:'다양한 매체의 담화·글을 흥미와 자신감을 갖고 듣거나 읽기',keywords:['매체','흥미','자신감','듣기','읽기'],source:'GOE_ENGLISH_56'}
  ];

  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
  function findByCode(code){return RECORDS.find(x=>x.code===clean(code))||null;}
  function list(subject,domain){
    return RECORDS.filter(x=>(!subject||x.subject===subject)&&(!domain||x.domain===domain));
  }
  function score(text,row){
    const t=norm(text);
    const matched=row.keywords.filter(k=>t.includes(norm(k)));
    return {score:matched.length,matched_terms:matched};
  }
  function match(subject,domain,evidenceText){
    const rows=list(clean(subject),clean(domain));
    const text=clean(evidenceText);
    if(!rows.length)return {status:'NO_VERIFIED_RECORDS_FOR_DOMAIN',selected:null,candidates:[],unresolved:['OFFICIAL_STANDARD_RECORD_COVERAGE_GAP']};
    if(!text)return {status:'EVIDENCE_REQUIRED',selected:null,candidates:rows.map(x=>({code:x.code,domain:x.domain})),unresolved:['ACTUAL_ASSIGNMENT_EVIDENCE_REQUIRED']};
    const scored=rows.map(row=>({...row,...score(text,row)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code));
    if(!scored.length)return {status:'NO_VERIFIED_RECORD_MATCH',selected:null,candidates:[],unresolved:['NO_STANDARD_SIGNAL_IN_EVIDENCE']};
    const top=scored[0].score;
    const tied=scored.filter(x=>x.score===top);
    const candidates=scored.slice(0,5).map(x=>({code:x.code,domain:x.domain,score:x.score,matched_terms:x.matched_terms,semantic_summary:x.semantic_summary,source:x.source}));
    if(top<2||tied.length!==1){
      return {status:'VERIFIED_STANDARD_CANDIDATES',selected:null,candidates,unresolved:['STANDARD_MATCH_NOT_UNIQUE_OR_NOT_STRONG_ENOUGH']};
    }
    const x=scored[0];
    return {
      status:'VERIFIED_STANDARD_MATCH',
      selected:{code:x.code,subject:x.subject,domain:x.domain,semantic_summary:x.semantic_summary,score:x.score,matched_terms:x.matched_terms,source:x.source},
      candidates,
      unresolved:[]
    };
  }

  return {version:VERSION,DATASET,SOURCES,RECORDS,findByCode,list,match};
});
