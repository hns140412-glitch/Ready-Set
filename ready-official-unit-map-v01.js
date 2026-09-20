(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyOfficialUnitMapV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.1.0';
  const DATASET={
    authority:'GYEONGGI_PROVINCIAL_OFFICE_OF_EDUCATION',
    source_id:'GOE_2026_EVAL',
    source_type:'OFFICIAL_EDUCATION_OFFICE_EXAMPLE_MAPPING',
    scope:'2026_ELEMENTARY_5_6_INSTRUCTION_ASSESSMENT_EXAMPLE',
    rule:'This layer is mapping evidence, not curriculum authority and not a universal publisher-textbook truth.',
    context_required_for_application:true
  };

  const RECORDS=[
    {standard_code:'6국01-04',subject:'국어',grade:6,semester:2,unit_no:2,unit_title:'궁금한 점을 해결해요',source_page:8},
    {standard_code:'6사09-01',subject:'사회',grade:6,semester:1,unit_no:3,unit_title:'지구, 대륙 그리고 국가들',source_page:14},
    {standard_code:'6사09-02',subject:'사회',grade:6,semester:1,unit_no:3,unit_title:'지구, 대륙 그리고 국가들',source_page:14},
    {standard_code:'6사10-01',subject:'사회',grade:6,semester:2,unit_no:1,unit_title:'세계의 자연환경',source_page:14},
    {standard_code:'6수01-05',subject:'수학',grade:5,semester:1,unit_no:2,unit_title:'약수와 배수',source_page:186},
    {standard_code:'6과01-01',subject:'과학',grade:5,semester:1,unit_no:1,unit_title:'지층과 화석',source_page:43},
    {standard_code:'6과01-02',subject:'과학',grade:5,semester:1,unit_no:1,unit_title:'지층과 화석',source_page:19},
    {standard_code:'6과01-03',subject:'과학',grade:5,semester:1,unit_no:1,unit_title:'지층과 화석',source_page:19}
  ];

  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/\s+/g,' ');
  const listByCode=code=>RECORDS.filter(x=>x.standard_code===clean(code));

  function evaluate(standardCode,context={}){
    const rows=listByCode(standardCode);
    if(!rows.length)return {status:'UNIT_MAPPING_EVIDENCE_GAP',selected:null,candidates:[],unresolved:['NO_VERIFIED_UNIT_MAPPING_RECORD']};
    const grade=Number(context.grade||0)||null;
    const semester=Number(context.semester||0)||null;
    const unitText=norm(context.unit_name||context.workbook_name||context.title||'');
    const candidates=rows.map(row=>{
      let score=0; const evidence=[];
      if(grade&&grade===row.grade){score+=2;evidence.push('GRADE_MATCH')}
      if(semester&&semester===row.semester){score+=2;evidence.push('SEMESTER_MATCH')}
      if(unitText&&unitText.includes(norm(row.unit_title))){score+=4;evidence.push('UNIT_TITLE_MATCH')}
      else if(unitText&&norm(row.unit_title).split(' ').some(t=>t.length>=2&&unitText.includes(t))){score+=1;evidence.push('UNIT_TOKEN_MATCH')}
      return {...row,score,evidence};
    }).sort((a,b)=>b.score-a.score);

    const contextPresent=!!(grade||semester||unitText);
    if(!contextPresent){
      return {status:'UNIT_MAPPING_EVIDENCE_AVAILABLE_NOT_APPLIED',selected:null,candidates,unresolved:['ACTUAL_GRADE_SEMESTER_UNIT_CONTEXT_REQUIRED']};
    }
    const top=candidates[0];
    const ties=candidates.filter(x=>x.score===top.score);
    if(top.score>=4&&ties.length===1){
      return {status:'UNIT_MAPPING_CONTEXT_MATCHED',selected:top,candidates,unresolved:[]};
    }
    return {status:'UNIT_MAPPING_CANDIDATE',selected:null,candidates,unresolved:['UNIT_CONTEXT_NOT_STRONG_OR_UNIQUE_ENOUGH']};
  }

  return {version:VERSION,DATASET,RECORDS,listByCode,evaluate};
});
