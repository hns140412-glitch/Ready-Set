(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root){
    root.ReadyAssignmentDomainV2=api;
    if(root.localStorage) root.ReadyAssignments=api.createDomain(root.localStorage);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='0.1.0';
  const STORAGE_KEY='readyset_assignments_v2';
  const TALENT_BOOKS=['연산','한자','국어','사회','수학','생각하는 피자'];
  const CONFIRMED='FACT_CONFIRMED';
  const now=()=>new Date().toISOString();
  const clean=v=>String(v??'').trim();
  const id=p=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const blank=()=>({schema_version:2,assignmentFacts:{},assignmentPackages:{},workbookRefs:{},artifacts:{},analyses:{},learningUnits:{}});
  function requireBrowserActor(actor){
    const normalized=clean(actor).toUpperCase();
    const family=globalThis.ReadyFamilySession;
    if(!family)return {ok:true};
    if(normalized==='PARENT')return family.requireRole?.('PARENT')||{ok:false,reason:'PARENT_AUTH_REQUIRED'};
    if(normalized==='CHILD')return family.requireRole?.('CHILD')||{ok:false,reason:'ROLE_NOT_ALLOWED'};
    return {ok:true};
  }


  function normalize(raw){
    const x=raw&&typeof raw==='object'?raw:{};
    return {...blank(),...x,
      assignmentFacts:x.assignmentFacts&&typeof x.assignmentFacts==='object'?x.assignmentFacts:{},
      assignmentPackages:x.assignmentPackages&&typeof x.assignmentPackages==='object'?x.assignmentPackages:{},
      workbookRefs:x.workbookRefs&&typeof x.workbookRefs==='object'?x.workbookRefs:{},
      artifacts:x.artifacts&&typeof x.artifacts==='object'?x.artifacts:{},
      analyses:x.analyses&&typeof x.analyses==='object'?x.analyses:{},
      learningUnits:x.learningUnits&&typeof x.learningUnits==='object'?x.learningUnits:{}
    };
  }
  function createDomain(storage){
    function load(){try{return normalize(JSON.parse(storage.getItem(STORAGE_KEY)||'null'))}catch{return blank()}}
    function save(s){const n=normalize(s),payload=JSON.stringify(n);storage.setItem(STORAGE_KEY,payload);globalThis.ReadySetLocalFirst?.capture?.('assignments',payload).catch?.(()=>{});return n}
    function mutate(fn){const s=load(),out=fn(s);save(s);return out}

    function upsertWorkbookRef(input={}){
      const name=clean(input.name);if(!name)throw new Error('workbook name required');
      return mutate(s=>{const refId=clean(input.workbook_ref_id)||id('workbook');const old=s.workbookRefs[refId]||{};
        const row={...old,workbook_ref_id:refId,subject:clean(input.subject)||old.subject||'영어',name,cover_artifact_id:input.cover_artifact_id||old.cover_artifact_id||null,provenance:input.provenance||old.provenance||null,updated_at:now()};
        s.workbookRefs[refId]=row;return clone(row);
      });
    }
    function claimsConflict(claims){
      const active=claims.filter(x=>x.status!=='SUPERSEDED');
      const signatures=new Set(active.map(x=>JSON.stringify(x.value)));
      return signatures.size>1;
    }
    function addClaim(s,fact,actor,value,provenance){
      for(const previous of fact.claims||[]){
        if(previous.actor===clean(actor)&&previous.status==='ACTIVE')previous.status='SUPERSEDED';
      }
      const claim={claim_id:id('claim'),actor:clean(actor)||'UNKNOWN',value:clone(value),provenance:provenance||null,captured_at:now(),status:'ACTIVE'};
      fact.claims=Array.isArray(fact.claims)?fact.claims:[];fact.claims.push(claim);
      fact.confirmation_state=claimsConflict(fact.claims)?'CONFIRMATION_REQUIRED':'INPUT_CAPTURED';
      fact.updated_at=now();return claim;
    }
    function registerArtifacts(s,assignmentId,items=[],kind='SOURCE',visibility='FAMILY'){
      return items.map(item=>{
        const source=typeof item==='object'?item:{artifact_id:clean(item)};
        const artifactId=clean(source.artifact_id)||id('artifact');
        s.artifacts[artifactId]={
          artifact_id:artifactId,assignment_id:assignmentId,kind:source.kind||kind,
          visibility:source.visibility||visibility,source:source.source||null,
          captured_at:source.captured_at||now()
        };
        return artifactId;
      });
    }
    function confirmFact(assignmentId,input={}){
      const actorGuard=requireBrowserActor(input.actor);if(!actorGuard.ok)throw new Error(actorGuard.reason);
      return mutate(s=>{const f=s.assignmentFacts[assignmentId];if(!f)throw new Error('fact not found');
        if(claimsConflict(f.claims||[])&&!input.accepted_claim_id)throw new Error('conflict resolution required');
        if(input.accepted_claim_id){
          for(const c of f.claims||[])c.status=c.claim_id===input.accepted_claim_id?'ACCEPTED':'SUPERSEDED';
          const accepted=(f.claims||[]).find(c=>c.status==='ACCEPTED');if(accepted)Object.assign(f,clone(accepted.value));
        }else{const last=(f.claims||[]).at(-1);if(last)Object.assign(f,clone(last.value));}
        f.confirmation_state=CONFIRMED;f.confirmed_by=clean(input.actor)||'PARENT';f.confirmed_at=now();f.analysis_state='READY_FOR_INTERPRETATION';f.updated_at=now();return clone(f);
      });
    }
    function upsertTalentPackage(input={}){
      const actorGuard=requireBrowserActor(input.actor);if(!actorGuard.ok)throw new Error(actorGuard.reason);
      const sourceDate=clean(input.source_date);const deadline=clean(input.deadline_boundary);
      if(!sourceDate||!deadline)throw new Error('talent cycle boundary required');
      const books=Array.isArray(input.books)?input.books:[];const byName=new Map(books.map(x=>[clean(x.subject),x]));
      if(TALENT_BOOKS.some(x=>!byName.has(x)))throw new Error('all six talent books required');
      return mutate(s=>{const packageId=clean(input.package_id)||id('talent_pkg');const factIds=[];
        for(const subject of TALENT_BOOKS){const b=byName.get(subject),assignmentId=clean(b.assignment_id)||id('assignment');
          const f=s.assignmentFacts[assignmentId]||{assignment_id:assignmentId,claims:[],created_at:now()};
          Object.assign(f,{package_id:packageId,source_type:'TALENT_BOOK_ASSIGNMENT',subject:'재능',book_subject:subject,source_actor:clean(input.actor)||'PARENT',assignment_cycle:'TALENT_WEEKLY',source_date:sourceDate,deadline_boundary:deadline,lifecycle:'ACTIVE',analysis_state:'NOT_ANALYZED'});
          const artifactRefs=registerArtifacts(s,assignmentId,Array.isArray(b.artifact_refs)?b.artifact_refs:[],'SOURCE','FAMILY');
          const answerRefs=registerArtifacts(s,assignmentId,Array.isArray(b.answer_reference_ids)?b.answer_reference_ids:[],'ANSWER_REFERENCE','PARENT_ONLY');
          addClaim(s,f,input.actor||'PARENT',{source_range:clean(b.source_range),teacher_instruction:clean(b.teacher_instruction),artifact_refs:artifactRefs,answer_reference_ids:answerRefs},b.provenance||input.provenance||{kind:'PARENT_INPUT'});
          s.assignmentFacts[assignmentId]=f;factIds.push(assignmentId);
        }
        const pkg={package_id:packageId,source_type:'TALENT_WEEKLY_ASSIGNMENT',source_date:sourceDate,deadline_boundary:deadline,fact_ids:factIds,cycle_boundary_kind:'DEADLINE_NEXT_CYCLE_NOT_ALLOCATION_SLOT',created_at:now(),updated_at:now()};
        s.assignmentPackages[packageId]=pkg;return clone(pkg);
      });
    }
    function upsertEnglishAssignment(input={}){
      const actorGuard=requireBrowserActor(input.actor);if(!actorGuard.ok)throw new Error(actorGuard.reason);
      const workbookRefId=clean(input.workbook_ref_id);if(!workbookRefId)throw new Error('workbook ref required');
      return mutate(s=>{if(!s.workbookRefs[workbookRefId])throw new Error('workbook ref not found');
        const assignmentId=clean(input.assignment_id)||id('assignment');const f=s.assignmentFacts[assignmentId]||{assignment_id:assignmentId,claims:[],created_at:now()};
        Object.assign(f,{source_type:'ENGLISH_ACADEMY_PACKAGE',subject:'영어',workbook_ref_id:workbookRefId,source_actor:clean(input.actor)||'UNKNOWN',assignment_cycle:'ACADEMY_TO_NEXT_CONFIRMED_CLASS',source_date:clean(input.source_date),deadline_boundary:clean(input.next_academy)||null,deadline_state:clean(input.next_academy)?'NEXT_ACADEMY_CONFIRMED':'NEXT_ACADEMY_UNVERIFIED',lifecycle:'ACTIVE',analysis_state:'NOT_ANALYZED'});
        const artifactRefs=registerArtifacts(s,assignmentId,Array.isArray(input.artifact_refs)?input.artifact_refs:[],'SOURCE','FAMILY');
        const answerRefs=registerArtifacts(s,assignmentId,Array.isArray(input.answer_reference_ids)?input.answer_reference_ids:[],'ANSWER_REFERENCE','PARENT_ONLY');
        addClaim(s,f,input.actor||'UNKNOWN',{source_range:clean(input.source_range),weekday_prints:clone(input.weekday_prints||{}),components:clone(input.components||{}),teacher_instruction:clean(input.teacher_instruction),artifact_refs:artifactRefs,answer_reference_ids:answerRefs},input.provenance||{kind:(input.actor==='CHILD'?'CHILD_INPUT':'PARENT_INPUT')});
        s.assignmentFacts[assignmentId]=f;return clone(f);
      });
    }
    function addEventFact(input={}){
      const actorGuard=requireBrowserActor(input.actor);if(!actorGuard.ok)throw new Error(actorGuard.reason);
      const title=clean(input.title);if(!title)throw new Error('event title required');
      return mutate(s=>{const assignmentId=clean(input.assignment_id)||id('assignment');
        const f={assignment_id:assignmentId,source_type:'SCHOOL_EVENT',subject:clean(input.subject)||'학교',source_actor:clean(input.actor)||'CHILD',assignment_cycle:'AD_HOC',claims:[],created_at:now(),lifecycle:'ACTIVE',analysis_state:'NOT_ANALYZED'};
        addClaim(s,f,input.actor||'CHILD',{title,source_range:clean(input.source_range),teacher_instruction:clean(input.teacher_instruction),deadline_boundary:clean(input.deadline_boundary)||null},input.provenance||{kind:'CHILD_INPUT'});
        s.assignmentFacts[assignmentId]=f;return clone(f);
      });
    }
    function project(role='CHILD'){
      const s=load(),parent=String(role).toUpperCase()==='PARENT';
      const visibleArtifacts=Object.fromEntries(Object.entries(s.artifacts).filter(([,a])=>parent||a.visibility!=='PARENT_ONLY'));
      const facts=Object.values(s.assignmentFacts).map(f=>{
        const row=clone(f);
        for(const claim of row.claims||[]){
          if(!parent&&claim.value?.answer_reference_ids)claim.value.answer_reference_ids=[];
          if(claim.value?.artifact_refs)claim.value.artifact_refs=claim.value.artifact_refs.filter(x=>visibleArtifacts[x]);
        }
        if(!parent)delete row.answer_reference_ids;
        return row;
      });
      return {role:parent?'PARENT':'CHILD',facts,packages:Object.values(s.assignmentPackages).map(clone),workbookRefs:Object.values(s.workbookRefs).map(clone),artifacts:Object.values(visibleArtifacts).map(clone)};
    }
    return {version:VERSION,load,save,upsertWorkbookRef,upsertTalentPackage,upsertEnglishAssignment,addEventFact,confirmFact,project};
  }
  return {version:VERSION,STORAGE_KEY,TALENT_BOOKS,createDomain,normalize};
});
