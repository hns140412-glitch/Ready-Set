(function(root){
  'use strict';

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const qa=options.queryAll||((s)=>[...document.querySelectorAll(s)]);
    const parsePrints=options.parsePrints||(()=>({}));
    const recordCaptureReview=options.recordCaptureReview||(async()=>null);
    const toast=options.toast||(()=>{});

    async function apply(draft){
      if(!draft)return {ok:false,reason:'NO_DRAFT'};
      const group=String(draft.group_key||'');

      if(group.startsWith('TALENT:')){
        const subject=group.slice('TALENT:'.length);
        const row=qa('[data-talent-book]').find(x=>x.dataset.talentBook===subject);
        if(!row)return {ok:false,reason:'TALENT_ROW_NOT_FOUND',subject};
        if(draft.source_range)row.querySelector('[data-range]').value=draft.source_range;
        if(draft.teacher_instruction)row.querySelector('[data-instruction]').value=draft.teacher_instruction;
        await recordCaptureReview(group,{
          source_range:row.querySelector('[data-range]').value.trim(),
          teacher_instruction:row.querySelector('[data-instruction]').value.trim()
        },'PARENT_APPLIED_DRAFT');
        toast(`${subject} 분석 초안을 입력칸에 적용했어요. 확인 후 FACT를 저장하세요.`);
        return {ok:true,domain:'TALENT',subject};
      }

      if(group.startsWith('ENGLISH:')){
        const workbook=q('#englishWorkbook'),range=q('#englishRange'),instruction=q('#englishInstruction');
        if(draft.workbook_name&&workbook&&!workbook.value)workbook.value=draft.workbook_name;
        if(draft.source_range&&range&&!range.value)range.value=draft.source_range;
        if(draft.teacher_instruction&&instruction){
          const old=instruction.value.trim();
          instruction.value=old?[old,draft.teacher_instruction].filter((x,i,a)=>a.indexOf(x)===i).join(' / '):draft.teacher_instruction;
        }

        const components=draft.components||{};
        const componentMap={
          vocabulary:'#englishVocabulary',
          grammar:'#englishGrammar',
          reading:'#englishReading',
          listening:'#englishListening',
          recording:'#englishRecording',
          writing:'#englishWriting'
        };
        for(const [key,selector] of Object.entries(componentMap)){
          const el=q(selector);
          if(components[key]&&el&&!el.value)el.value=components[key];
        }

        const prints=q('#englishPrints');
        if(Array.isArray(draft.weekday_prints)&&draft.weekday_prints.length&&prints){
          const value=draft.weekday_prints.filter(x=>x?.weekday&&x?.value).map(x=>`${x.weekday}:${x.value}`).join(', ');
          if(value&&!prints.value)prints.value=value;
        }

        await recordCaptureReview(group,{
          workbook_name:workbook?.value.trim()||'',
          source_range:range?.value.trim()||'',
          weekday_prints:parsePrints(prints?.value||''),
          components:{
            vocabulary:q('#englishVocabulary')?.value.trim()||'',
            grammar:q('#englishGrammar')?.value.trim()||'',
            reading:q('#englishReading')?.value.trim()||'',
            listening:q('#englishListening')?.value.trim()||'',
            recording:q('#englishRecording')?.value.trim()||'',
            writing:q('#englishWriting')?.value.trim()||''
          },
          teacher_instruction:instruction?.value.trim()||''
        },'PARENT_APPLIED_DRAFT');

        toast('영어 분석 초안을 입력칸에 적용했어요. 확인 후 FACT를 저장하세요.');
        return {ok:true,domain:'ENGLISH'};
      }

      return {ok:false,reason:'UNSUPPORTED_GROUP',group};
    }

    return Object.freeze({apply});
  }

  root.ReadyRebuildCaptureDraft=Object.freeze({
    version:'READY_REBUILD_CAPTURE_DRAFT_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
