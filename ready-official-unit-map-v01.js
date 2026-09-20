(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyOfficialUnitMapV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.2.1';
  const DATASET={
    authority:'GYEONGGI_PROVINCIAL_OFFICE_OF_EDUCATION',
    source_id:'GOE_2026_EVAL',
    source_type:'OFFICIAL_EDUCATION_OFFICE_STANDARD_UNIT_CONNECTION_TABLE',
    scope:'2026_ELEMENTARY_5_6_KOREAN_SOCIAL_MATH_SCIENCE',
    source_url:'https://www.goe.go.kr/resource/goe/na/bbs_2675/2026/02/116dc7a4-254a-44fe-9e77-3e908ecc5ff3.pdf',
    source_pages:{korean:'8-11',social:'12-14',math:'15-18',science:'19-22'},
    rule:'This layer is official mapping evidence from the source table. It is separate from curriculum authority and is not universal publisher-textbook truth.',
    context_required_for_application:true,
    mapped_subjects:['국어','사회','수학','과학'],
    english_status:'NO_STANDARD_UNIT_CONNECTION_TABLE_IN_THIS_SOURCE'
  };

  const GROUPS=[
    // 국어 5-1
    {subject:'국어',grade:5,semester:1,unit_no:1,unit_title:'짐작하며 대화해요',source_page:8,codes:['6국01-01','6국01-03']},
    {subject:'국어',grade:5,semester:1,unit_no:2,unit_title:'체험한 일을 써요',source_page:9,codes:['6국03-03','6국04-05']},
    {subject:'국어',grade:5,semester:1,unit_no:3,unit_title:'매체로 발표해요',source_page:8,codes:['6국01-03','6국01-05','6국06-01']},
    {subject:'국어',grade:5,semester:1,unit_no:4,unit_title:'대상을 설명해요',source_page:8,codes:['6국02-01','6국03-01']},
    {subject:'국어',grade:5,semester:1,unit_no:5,unit_title:'의논하며 토의해요',source_page:8,codes:['6국01-06','6국02-04']},
    {subject:'국어',grade:5,semester:1,unit_no:6,unit_title:'빗대어 표현해요',source_page:10,codes:['6국05-02','6국05-04']},
    {subject:'국어',grade:5,semester:1,unit_no:null,unit_title:'독서 단원. 책을 읽고 함께 이야기해요',source_page:8,codes:['6국02-01','6국02-05','6국05-04']},
    {subject:'국어',grade:5,semester:1,unit_no:null,unit_title:'매체 단원. 필요한 정보를 찾아요',source_page:9,codes:['6국03-02','6국06-01']},

    // 국어 5-2
    {subject:'국어',grade:5,semester:2,unit_no:1,unit_title:'작품에 대한 생각을 나누어요',source_page:8,codes:['6국01-06','6국05-04']},
    {subject:'국어',grade:5,semester:2,unit_no:2,unit_title:'올바른 문장으로 글을 써요',source_page:9,codes:['6국03-04','6국04-04']},
    {subject:'국어',grade:5,semester:2,unit_no:3,unit_title:'추론하며 읽어요',source_page:8,codes:['6국02-01','6국02-02']},
    {subject:'국어',grade:5,semester:2,unit_no:4,unit_title:'표준어와 방언을 알아봐요',source_page:10,codes:['6국02-05','6국04-02','6국05-06']},
    {subject:'국어',grade:5,semester:2,unit_no:5,unit_title:'의견을 조정하며 문제를 해결해요',source_page:8,codes:['6국01-01','6국01-06']},
    {subject:'국어',grade:5,semester:2,unit_no:6,unit_title:'작품을 감상해요',source_page:10,codes:['6국02-02','6국05-03','6국05-05']},
    {subject:'국어',grade:5,semester:2,unit_no:null,unit_title:'독서 단원. 여러 가지 형태의 책을 읽어요',source_page:9,codes:['6국02-05','6국06-01']},
    {subject:'국어',grade:5,semester:2,unit_no:null,unit_title:'매체 단원. 평가하며 이용해요',source_page:9,codes:['6국02-03','6국06-02']},

    // 국어 6-1
    {subject:'국어',grade:6,semester:1,unit_no:1,unit_title:'성찰하며 읽어요',source_page:8,codes:['6국01-03','6국02-05','6국05-06']},
    {subject:'국어',grade:6,semester:1,unit_no:2,unit_title:'바르게 고쳐 써요',source_page:10,codes:['6국03-06','6국04-04','6국04-06']},
    {subject:'국어',grade:6,semester:1,unit_no:3,unit_title:'절차를 지키며 토론해요',source_page:8,codes:['6국01-02','6국01-07']},
    {subject:'국어',grade:6,semester:1,unit_no:4,unit_title:'비판적으로 읽어요',source_page:9,codes:['6국02-03','6국02-04']},
    {subject:'국어',grade:6,semester:1,unit_no:5,unit_title:'관용 표현을 이해하고 생각을 표현해요',source_page:9,codes:['6국03-03','6국04-03']},
    {subject:'국어',grade:6,semester:1,unit_no:6,unit_title:'자신의 글쓰기 과정을 살펴봐요',source_page:9,codes:['6국03-02','6국03-05','6국04-06']},
    {subject:'국어',grade:6,semester:1,unit_no:null,unit_title:'독서 단원. 같은 주제에 대한 책을 읽고 생각을 나누어요',source_page:8,codes:['6국01-06','6국02-05']},
    {subject:'국어',grade:6,semester:1,unit_no:null,unit_title:'매체 단원. 매체 자료를 만들어요',source_page:10,codes:['6국04-01','6국06-03']},

    // 국어 6-2
    {subject:'국어',grade:6,semester:2,unit_no:1,unit_title:'작가의 의도를 파악해요',source_page:8,codes:['6국02-01','6국05-01']},
    {subject:'국어',grade:6,semester:2,unit_no:2,unit_title:'궁금한 점을 해결해요',source_page:8,codes:['6국01-03','6국01-04']},
    {subject:'국어',grade:6,semester:2,unit_no:3,unit_title:'보거나 듣고 판단해요',source_page:8,codes:['6국01-02','6국02-03']},
    {subject:'국어',grade:6,semester:2,unit_no:4,unit_title:'우리말의 아름다움을 느껴요',source_page:9,codes:['6국02-02','6국04-03']},
    {subject:'국어',grade:6,semester:2,unit_no:5,unit_title:'언어의 특성과 독자를 고려하여 소통해요',source_page:9,codes:['6국03-04','6국04-01']},
    {subject:'국어',grade:6,semester:2,unit_no:6,unit_title:'시와 이야기로 표현해요',source_page:10,codes:['6국03-06','6국05-05']},
    {subject:'국어',grade:6,semester:2,unit_no:null,unit_title:'독서 단원. 다양한 책을 읽고 문제를 해결해요',source_page:9,codes:['6국02-04','6국03-03']},
    {subject:'국어',grade:6,semester:2,unit_no:null,unit_title:'매체 단원. 나를 돌아봐요',source_page:10,codes:['6국03-06','6국06-04']},

    // 사회
    {subject:'사회',grade:5,semester:1,unit_no:1,unit_title:'우리나라 국토여행',source_page:12,codes:['6사01-01','6사01-02']},
    {subject:'사회',grade:5,semester:1,unit_no:2,unit_title:'우리나라 지리탐구',source_page:12,codes:['6사02-01','6사02-02']},
    {subject:'사회',grade:5,semester:1,unit_no:3,unit_title:'법과 인권의 보장',source_page:12,codes:['6사03-01','6사03-02']},
    {subject:'사회',grade:5,semester:2,unit_no:1,unit_title:'유적과 유물로 살펴본 옛 사람들의 생활',source_page:12,codes:['6사04-01','6사04-02','6사04-03']},
    {subject:'사회',grade:5,semester:2,unit_no:2,unit_title:'달라지는 시대, 변화하는 생활 모습',source_page:13,codes:['6사05-01','6사05-02']},
    {subject:'사회',grade:5,semester:2,unit_no:3,unit_title:'식민 통치와 저항, 전쟁이 바꾼 사회와 생활',source_page:13,codes:['6사06-01','6사06-02']},
    {subject:'사회',grade:6,semester:1,unit_no:1,unit_title:'평화 통일을 위한 노력, 민주화와 산업화',source_page:13,codes:['6사07-01','6사07-02']},
    {subject:'사회',grade:6,semester:1,unit_no:2,unit_title:'민주주의와 시민 참여',source_page:13,codes:['6사08-01','6사08-02','6사08-03']},
    {subject:'사회',grade:6,semester:1,unit_no:3,unit_title:'지구, 대륙 그리고 국가들',source_page:14,codes:['6사09-01','6사09-02']},
    {subject:'사회',grade:6,semester:2,unit_no:1,unit_title:'세계의 자연환경',source_page:14,codes:['6사10-01','6사10-02']},
    {subject:'사회',grade:6,semester:2,unit_no:2,unit_title:'시장경제와 국가 간 거래',source_page:14,codes:['6사11-01','6사11-02','6사11-03']},
    {subject:'사회',grade:6,semester:2,unit_no:3,unit_title:'지구촌 사람들',source_page:14,codes:['6사12-01','6사12-02']},

    // 수학
    {subject:'수학',grade:5,semester:1,unit_no:1,unit_title:'자연수의 혼합 계산',source_page:15,codes:['6수01-01']},
    {subject:'수학',grade:5,semester:1,unit_no:2,unit_title:'약수와 배수',source_page:15,codes:['6수01-04','6수01-05']},
    {subject:'수학',grade:5,semester:1,unit_no:3,unit_title:'대응 관계',source_page:16,codes:['6수02-01']},
    {subject:'수학',grade:5,semester:1,unit_no:4,unit_title:'약분과 통분',source_page:15,codes:['6수01-06','6수01-07','6수01-12']},
    {subject:'수학',grade:5,semester:1,unit_no:5,unit_title:'분수의 덧셈과 뺄셈',source_page:15,codes:['6수01-08']},
    {subject:'수학',grade:5,semester:1,unit_no:6,unit_title:'다각형의 둘레와 넓이',source_page:17,codes:['6수03-11','6수03-12','6수03-13','6수03-14']},
    {subject:'수학',grade:5,semester:2,unit_no:1,unit_title:'수의 범위와 올림, 버림, 반올림',source_page:15,codes:['6수01-02','6수01-03']},
    {subject:'수학',grade:5,semester:2,unit_no:2,unit_title:'분수의 곱셈',source_page:15,codes:['6수01-09']},
    {subject:'수학',grade:5,semester:2,unit_no:3,unit_title:'합동과 대칭',source_page:16,codes:['6수03-01','6수03-02']},
    {subject:'수학',grade:5,semester:2,unit_no:4,unit_title:'소수의 곱셈',source_page:15,codes:['6수01-13']},
    {subject:'수학',grade:5,semester:2,unit_no:5,unit_title:'직육면체와 정육면체',source_page:16,codes:['6수03-03','6수03-04']},
    {subject:'수학',grade:5,semester:2,unit_no:6,unit_title:'평균과 가능성',source_page:18,codes:['6수04-01','6수04-04','6수04-05','6수04-06']},
    {subject:'수학',grade:6,semester:1,unit_no:1,unit_title:'분수의 나눗셈',source_page:15,codes:['6수01-10','6수01-11']},
    {subject:'수학',grade:6,semester:1,unit_no:2,unit_title:'각기둥과 각뿔',source_page:16,codes:['6수03-05','6수03-06']},
    {subject:'수학',grade:6,semester:1,unit_no:3,unit_title:'소수의 나눗셈',source_page:15,codes:['6수01-14','6수01-15']},
    {subject:'수학',grade:6,semester:1,unit_no:4,unit_title:'비와 비율',source_page:16,codes:['6수02-02','6수02-03']},
    {subject:'수학',grade:6,semester:1,unit_no:5,unit_title:'여러 가지 그래프',source_page:18,codes:['6수04-02','6수04-03']},
    {subject:'수학',grade:6,semester:1,unit_no:6,unit_title:'직육면체의 겉넓이와 부피',source_page:17,codes:['6수03-17','6수03-18','6수03-19']},
    {subject:'수학',grade:6,semester:2,unit_no:1,unit_title:'분수의 나눗셈',source_page:15,codes:['6수01-11']},
    {subject:'수학',grade:6,semester:2,unit_no:2,unit_title:'공간과 입체',source_page:17,codes:['6수03-09','6수03-10']},
    {subject:'수학',grade:6,semester:2,unit_no:3,unit_title:'소수의 나눗셈',source_page:15,codes:['6수01-15']},
    {subject:'수학',grade:6,semester:2,unit_no:4,unit_title:'비례식과 비례배분',source_page:16,codes:['6수02-04','6수02-05']},
    {subject:'수학',grade:6,semester:2,unit_no:5,unit_title:'원의 둘레와 넓이',source_page:17,codes:['6수03-15','6수03-16']},
    {subject:'수학',grade:6,semester:2,unit_no:6,unit_title:'원기둥, 원뿔, 구',source_page:16,codes:['6수03-07','6수03-08']},

    // 과학
    {subject:'과학',grade:5,semester:1,unit_no:1,unit_title:'지층과 화석',source_page:19,codes:['6과01-01','6과01-02','6과01-03']},
    {subject:'과학',grade:5,semester:1,unit_no:2,unit_title:'빛의 성질',source_page:20,codes:['6과02-01','6과02-02','6과02-03']},
    {subject:'과학',grade:5,semester:1,unit_no:3,unit_title:'용해와 용액',source_page:21,codes:['6과03-01','6과03-02','6과03-03']},
    {subject:'과학',grade:5,semester:1,unit_no:4,unit_title:'우리 몸의 구조와 기능',source_page:22,codes:['6과04-01','6과04-02','6과04-03']},
    {subject:'과학',grade:5,semester:2,unit_no:1,unit_title:'혼합물의 분리',source_page:21,codes:['6과05-01','6과05-02','6과05-03']},
    {subject:'과학',grade:5,semester:2,unit_no:2,unit_title:'날씨와 우리 생활',source_page:19,codes:['6과06-01','6과06-02','6과06-03']},
    {subject:'과학',grade:5,semester:2,unit_no:3,unit_title:'열과 우리 생활',source_page:20,codes:['6과07-01','6과07-02','6과07-03','6과07-04']},
    {subject:'과학',grade:5,semester:2,unit_no:4,unit_title:'자원과 에너지',source_page:22,codes:['6과08-01','6과08-02','6과08-03']},
    {subject:'과학',grade:6,semester:1,unit_no:1,unit_title:'산과 염기',source_page:21,codes:['6과09-01','6과09-02','6과09-03','6과09-04']},
    {subject:'과학',grade:6,semester:1,unit_no:2,unit_title:'물체의 운동',source_page:20,codes:['6과10-01','6과10-02','6과10-03']},
    {subject:'과학',grade:6,semester:1,unit_no:3,unit_title:'식물의 구조와 기능',source_page:22,codes:['6과11-01','6과11-02','6과11-03']},
    {subject:'과학',grade:6,semester:1,unit_no:4,unit_title:'지구의 운동',source_page:19,codes:['6과12-01','6과12-02','6과12-03']},
    {subject:'과학',grade:6,semester:2,unit_no:1,unit_title:'계절의 변화',source_page:19,codes:['6과13-01','6과13-02','6과13-03']},
    {subject:'과학',grade:6,semester:2,unit_no:2,unit_title:'물질의 연소',source_page:21,codes:['6과14-01','6과14-02','6과14-03','6과14-04']},
    {subject:'과학',grade:6,semester:2,unit_no:3,unit_title:'전기의 이용',source_page:20,codes:['6과15-01','6과15-02','6과15-03','6과15-04']},
    {subject:'과학',grade:6,semester:2,unit_no:4,unit_title:'과학과 나의 진로',source_page:22,codes:['6과16-01','6과16-02']}
  ];

  const RECORDS=GROUPS.flatMap(group=>group.codes.map(standard_code=>({
    standard_code,
    subject:group.subject,
    grade:group.grade,
    semester:group.semester,
    unit_no:group.unit_no,
    unit_title:group.unit_title,
    source_page:group.source_page
  })));

  const EXPECTED_STANDARD_COVERAGE={국어:34,사회:27,수학:45,과학:51};
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
  const listByCode=code=>RECORDS.filter(x=>x.standard_code===clean(code));
  const listBySubject=subject=>RECORDS.filter(x=>x.subject===clean(subject));
  const mappedCodesBySubject=subject=>[...new Set(listBySubject(subject).map(x=>x.standard_code))].sort();
  const coverage=subject=>{
    const expected=EXPECTED_STANDARD_COVERAGE[clean(subject)]??null;
    const mapped=mappedCodesBySubject(subject).length;
    return {
      subject:clean(subject),
      expected_standard_count:expected,
      mapped_standard_count:mapped,
      status:expected!==null&&mapped===expected?'VERIFIED_FULL_UNIT_MAPPING_COVERAGE':'PARTIAL_OR_UNSUPPORTED'
    };
  };

  function evaluate(standardCode,context={}){
    const rows=listByCode(standardCode);
    if(!rows.length)return {status:'UNIT_MAPPING_EVIDENCE_GAP',selected:null,candidates:[],unresolved:['NO_VERIFIED_UNIT_MAPPING_RECORD']};
    const grade=Number(context.grade||0)||null;
    const semester=Number(context.semester||0)||null;
    const unitText=norm(context.unit_name||'');
    const candidates=rows.map(row=>{
      let score=0; const evidence=[];
      if(grade&&grade===row.grade){score+=2;evidence.push('GRADE_MATCH')}
      if(semester&&semester===row.semester){score+=2;evidence.push('SEMESTER_MATCH')}
      if(unitText&&unitText.includes(norm(row.unit_title))){score+=4;evidence.push('UNIT_TITLE_MATCH')}
      else if(unitText&&norm(row.unit_title).split(' ').some(t=>t.length>=2&&unitText.includes(t))){score+=1;evidence.push('UNIT_TOKEN_MATCH')}
      return {...row,score,evidence};
    }).sort((a,b)=>b.score-a.score||a.grade-b.grade||a.semester-b.semester);

    const applicationContextComplete=!!(grade&&semester&&unitText);
    if(!applicationContextComplete){
      const missing=[];
      if(!grade)missing.push('GRADE_REQUIRED');
      if(!semester)missing.push('SEMESTER_REQUIRED');
      if(!unitText)missing.push('UNIT_CONTEXT_REQUIRED');
      return {status:'UNIT_MAPPING_EVIDENCE_AVAILABLE_NOT_APPLIED',selected:null,candidates,unresolved:['ACTUAL_GRADE_SEMESTER_UNIT_CONTEXT_REQUIRED',...missing]};
    }
    const top=candidates[0];
    const ties=candidates.filter(x=>x.score===top.score);
    if(top.score>=4&&ties.length===1){
      return {status:'UNIT_MAPPING_CONTEXT_MATCHED',selected:top,candidates,unresolved:[]};
    }
    return {status:'UNIT_MAPPING_CANDIDATE',selected:null,candidates,unresolved:['UNIT_CONTEXT_NOT_STRONG_OR_UNIQUE_ENOUGH']};
  }

  return {version:VERSION,DATASET,GROUPS,RECORDS,EXPECTED_STANDARD_COVERAGE,listByCode,listBySubject,mappedCodesBySubject,coverage,evaluate};
});
