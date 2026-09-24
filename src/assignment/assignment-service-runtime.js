(function(root){
  'use strict';

  function create(options={}){
    const assignments=options.assignments||root.ReadyAssignments;
    const capture=options.capture||root.ReadyCaptureV01;
    const integration=options.integration||root.ReadyIntegrationV1;
    const captureService=options.captureService;
    const localDateKey=options.localDateKey||(()=>new Date().toISOString().slice(0,10));
    const talentBooks=options.talentBooks||[];

    if(!assignments||!capture||!integration||!captureService)throw new Error('ASSIGNMENT_SERVICE_DEPENDENCY_MISSING');

    async function saveTalent({source,deadline,books=[]}={}){
      if(!source||!deadline)return {ok:false,reason:'TALENT_SOURCE_OR_DEADLINE_MISSING'};
      if(books.some(x=>!String(x.source_range||'').trim()))return {ok:false,reason:'TALENT_RANGE_MISSING'};

      for(const subject of talentBooks){
        const closure=await capture.reviewClosureForGroup?.('TALENT:'+subject);
        if(closure&&closure.unresolved_count>0){
          return {ok:false,reason:'CAPTURE_REVIEW_UNRESOLVED',subject,unresolved_count:closure.unresolved_count};
        }
      }

      const links={},signatures={};
      for(const book of books){
        links[book.subject]=await capture.factLinkForGroup?.('TALENT:'+book.subject);
        signatures[book.subject]=captureService.stableFactSignature({
          source_date:source,
          deadline_boundary:deadline,
          source_range:book.source_range,
          teacher_instruction:book.teacher_instruction
        });
      }

      const active=talentBooks.filter(subject=>links[subject]?.assignment_id);
      if(active.length===0){
        const closed={};
        for(const subject of talentBooks){
          closed[subject]=await capture.lastClosedFactLinkForGroup?.('TALENT:'+subject);
        }
        const closedSubjects=talentBooks.filter(subject=>closed[subject]?.assignment_id);
        if(closedSubjects.length===talentBooks.length&&closedSubjects.every(subject=>closed[subject]?.payload_signature===signatures[subject])){
          return {ok:false,reason:'DUPLICATE_TALENT_FACT'};
        }
      }

      const existingPackageId=Object.values(links).map(x=>x?.package_id).find(Boolean)||undefined;
      const pkg=assignments.upsertTalentPackage({
        actor:'PARENT',
        package_id:existingPackageId,
        source_date:source,
        deadline_boundary:deadline,
        books:books.map(b=>({...b,assignment_id:links[b.subject]?.assignment_id||undefined})),
        provenance:{kind:'PARENT_INPUT',surface:'PARENT_INTAKE'}
      });

      let todoCount=0,held=0;
      for(let i=0;i<pkg.fact_ids.length;i++){
        const assignmentId=pkg.fact_ids[i];
        const subject=talentBooks[i];
        assignments.confirmFact(assignmentId,{actor:'PARENT'});
        await capture.recordFactLink?.('TALENT:'+subject,{
          assignment_id:assignmentId,
          package_id:pkg.package_id,
          fact_confirmation_state:'FACT_CONFIRMED',
          payload_signature:signatures[subject]
        });
        const processed=integration.processAssignment?.(assignmentId,{start_date:localDateKey()});
        if(processed?.ok)todoCount+=(processed.todos||[]).length;
        else held++;
      }
      await capture.finalizeFactLinkage?.();
      return {ok:true,package_id:pkg.package_id,todoCount,held};
    }

    async function saveEnglish(input={}){
      const {
        name,range,nextAcademy,weekdayPrints,recurringDays=[],components={},teacherInstruction='',
        sourceDate=localDateKey()
      }=input;
      if(!String(name||'').trim()||!String(range||'').trim())return {ok:false,reason:'ENGLISH_NAME_OR_RANGE_MISSING'};

      const groupKeys=['ENGLISH:WORKBOOK','ENGLISH:PRINT','ENGLISH:OTHER'];
      const links=await Promise.all(groupKeys.map(k=>capture.factLinkForGroup?.(k)));
      const existing=links.find(x=>x?.assignment_id||x?.workbook_ref_id)||null;
      const signature=captureService.stableFactSignature({
        source_date:sourceDate,
        workbook_name:name,
        source_range:range,
        next_academy:nextAcademy,
        weekday_prints:weekdayPrints,
        recurring_days:recurringDays,
        components,
        teacher_instruction:teacherInstruction
      });

      if(!links.some(x=>x?.assignment_id||x?.workbook_ref_id)){
        const closed=await Promise.all(groupKeys.map(k=>capture.lastClosedFactLinkForGroup?.(k)));
        const linkedClosed=closed.filter(x=>x?.assignment_id);
        if(linkedClosed.length&&linkedClosed.every(x=>x.assignment_id===linkedClosed[0].assignment_id&&x.payload_signature===signature)){
          return {ok:false,reason:'DUPLICATE_ENGLISH_FACT'};
        }
      }

      const ref=assignments.upsertWorkbookRef({
        workbook_ref_id:existing?.workbook_ref_id||undefined,
        name,
        subject:'영어',
        provenance:{kind:'PARENT_INPUT'}
      });

      const groups=await Promise.all(groupKeys.map(k=>captureService.capturedRefs(k)));
      const source=groups.flatMap(x=>x.source);
      const answers=groups.flatMap(x=>x.answers);
      const reviewedValue={
        workbook_name:name,
        source_range:range,
        weekday_prints:weekdayPrints,
        recurring_days:recurringDays,
        components,
        teacher_instruction:teacherInstruction
      };
      const captureReviews=[];
      for(const groupKey of groupKeys){
        const review=await captureService.recordCaptureReview(groupKey,reviewedValue,'PARENT_REVIEWED');
        if(review)captureReviews.push(review);
      }
      for(const groupKey of groupKeys){
        const closure=await capture.reviewClosureForGroup?.(groupKey);
        if(closure&&closure.unresolved_count>0){
          return {ok:false,reason:'CAPTURE_REVIEW_UNRESOLVED',groupKey,unresolved_count:closure.unresolved_count};
        }
      }

      const fact=assignments.upsertEnglishAssignment({
        actor:'PARENT',
        assignment_id:existing?.assignment_id||undefined,
        workbook_ref_id:ref.workbook_ref_id,
        source_date:sourceDate,
        source_range:range,
        weekday_prints:weekdayPrints,
        recurring_days:recurringDays,
        components,
        teacher_instruction:teacherInstruction,
        next_academy:nextAcademy,
        artifact_refs:source,
        answer_reference_ids:answers,
        provenance:captureReviews.length
          ?{kind:'PARENT_REVIEWED_CAPTURE',surface:'PARENT_INTAKE',capture_linked:true,capture_reviews:captureReviews}
          :{kind:'PARENT_INPUT',surface:'PARENT_INTAKE',capture_linked:source.length+answers.length>0}
      });

      assignments.confirmFact(fact.assignment_id,{actor:'PARENT'});
      for(const groupKey of groupKeys){
        const refs=await captureService.capturedRefs(groupKey);
        if(refs.source.length||refs.answers.length){
          await capture.recordFactLink?.(groupKey,{
            assignment_id:fact.assignment_id,
            workbook_ref_id:ref.workbook_ref_id,
            fact_confirmation_state:'FACT_CONFIRMED',
            payload_signature:signature
          });
        }
      }
      await capture.finalizeFactLinkage?.();
      const processed=integration.processAssignment?.(fact.assignment_id,{start_date:localDateKey()});
      return {ok:true,fact,processed};
    }

    return Object.freeze({saveTalent,saveEnglish});
  }

  root.ReadyRebuildAssignmentService=Object.freeze({
    version:'READY_REBUILD_ASSIGNMENT_SERVICE_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
