(function(root){
  'use strict';

  const VERSION='READY_CHARACTER_DIRECTION_V01';

  const DIRECTIONS=Object.freeze({
    LIVELY:Object.freeze({id:'LIVELY',label:'신나!',keywords:['활발','씩씩','장난꾸러기'],visual:['dynamic-pose','bright-expression','playful-motion']}),
    CURIOUS:Object.freeze({id:'CURIOUS',label:'두근두근',keywords:['호기심','모험','발견'],visual:['explorer-curiosity','discovery-gaze','adventure-readiness']}),
    WARM:Object.freeze({id:'WARM',label:'포근해',keywords:['따뜻','친근','다정'],visual:['gentle-expression','warm-presence','friendly-posture']}),
    BOLD:Object.freeze({id:'BOLD',label:'멋져!',keywords:['자신감','당당','용감'],visual:['confident-posture','clear-gaze','brave-presence']}),
    FOCUSED:Object.freeze({id:'FOCUSED',label:'집중!',keywords:['차분','똑똑','꼼꼼'],visual:['calm-focus','thoughtful-posture','precise-detail']}),
    IMAGINATIVE:Object.freeze({id:'IMAGINATIVE',label:'상상중',keywords:['신비','창의','이야기'],visual:['dreamy-curiosity','creative-pose','story-rich-detail']})
  });

  const FIRST_ROUND=Object.freeze(['LIVELY','WARM','FOCUSED']);

  const DISTANCE=Object.freeze({
    LIVELY:Object.freeze({LIVELY:0,CURIOUS:2,WARM:2,BOLD:2,FOCUSED:4,IMAGINATIVE:3}),
    CURIOUS:Object.freeze({LIVELY:2,CURIOUS:0,WARM:3,BOLD:2,FOCUSED:3,IMAGINATIVE:2}),
    WARM:Object.freeze({LIVELY:2,CURIOUS:3,WARM:0,BOLD:3,FOCUSED:2,IMAGINATIVE:2}),
    BOLD:Object.freeze({LIVELY:2,CURIOUS:2,WARM:3,BOLD:0,FOCUSED:2,IMAGINATIVE:3}),
    FOCUSED:Object.freeze({LIVELY:4,CURIOUS:3,WARM:2,BOLD:2,FOCUSED:0,IMAGINATIVE:3}),
    IMAGINATIVE:Object.freeze({LIVELY:3,CURIOUS:2,WARM:2,BOLD:3,FOCUSED:3,IMAGINATIVE:0})
  });

  function assertDirection(id){
    if(!DIRECTIONS[id]) throw new Error('UNKNOWN_CHARACTER_DIRECTION:'+String(id));
    return id;
  }

  function option(id){
    const d=DIRECTIONS[assertDirection(id)];
    return {id:d.id,label:d.label,keywords:[...d.keywords],visual:[...d.visual]};
  }

  function firstRound(){
    return FIRST_ROUND.map(option);
  }

  function scoreAgainst(candidate, selected){
    return selected.reduce((sum,id)=>sum+(DISTANCE[id]?.[candidate]??0),0);
  }

  function pickDistinct(ids,selected,count){
    return ids
      .filter(id=>!selected.includes(id))
      .map(id=>({id,score:scoreAgainst(id,selected)}))
      .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))
      .slice(0,count)
      .map(x=>x.id);
  }

  function secondRound(firstSelection){
    const first=assertDirection(firstSelection);
    const ids=Object.keys(DIRECTIONS);
    return pickDistinct(ids,[first],3).map(option);
  }

  function automaticContrast(firstSelection,secondSelection){
    const first=assertDirection(firstSelection);
    const second=assertDirection(secondSelection);
    if(first===second) throw new Error('CHARACTER_DIRECTION_SELECTIONS_MUST_DIFFER');
    const id=pickDistinct(Object.keys(DIRECTIONS),[first,second],1)[0];
    return option(id);
  }

  function buildCandidateDirections(firstSelection,secondSelection){
    const first=assertDirection(firstSelection);
    const second=assertDirection(secondSelection);
    if(first===second) throw new Error('CHARACTER_DIRECTION_SELECTIONS_MUST_DIFFER');
    const contrast=automaticContrast(first,second).id;
    return Object.freeze([
      Object.freeze({slot:'A',source:'USER_SELECTION_1',direction:option(first)}),
      Object.freeze({slot:'B',source:'USER_SELECTION_2',direction:option(second)}),
      Object.freeze({slot:'C',source:'SYSTEM_AUTO_CONTRAST',direction:option(contrast)})
    ]);
  }

  function createState(){
    return {
      version:VERSION,
      identityAuthority:'SOURCE_PHOTO',
      selectionCount:0,
      firstSelection:null,
      secondSelection:null,
      autoContrast:null,
      candidates:[],
      status:'ROUND_1'
    };
  }

  function select(state,directionId){
    const next={...createState(),...(state||{})};
    const id=assertDirection(directionId);
    if(next.status==='ROUND_1'){
      if(!FIRST_ROUND.includes(id)) throw new Error('DIRECTION_NOT_OFFERED_IN_ROUND_1');
      next.firstSelection=id;
      next.secondSelection=null;
      next.autoContrast=null;
      next.candidates=[];
      next.selectionCount=1;
      next.status='ROUND_2';
      return next;
    }
    if(next.status==='ROUND_2'){
      const offered=secondRound(next.firstSelection).map(x=>x.id);
      if(!offered.includes(id)) throw new Error('DIRECTION_NOT_OFFERED_IN_ROUND_2');
      next.secondSelection=id;
      next.selectionCount=2;
      next.candidates=buildCandidateDirections(next.firstSelection,id);
      next.autoContrast=next.candidates.find(x=>x.slot==='C').direction.id;
      next.status='READY_FOR_CANDIDATE_GENERATION';
      return next;
    }
    throw new Error('CHARACTER_DIRECTION_SELECTION_CLOSED');
  }

  function identityContract(){
    return Object.freeze({
      sourcePhotoIsHighestAuthority:true,
      userSelectionsExactly:2,
      thirdDirection:'SYSTEM_AUTO_CONTRAST',
      directionChangesIdentity:false,
      emojiOrEmoticonUi:false,
      visualCardQuality:'HIGH_DENSITY_PREMIUM_ILLUSTRATION',
      preserveTimerYellowAsFunctionalAccent:true
    });
  }

  root.ReadyCharacterDirection=Object.freeze({
    version:VERSION,
    DIRECTIONS,
    firstRound,
    secondRound,
    automaticContrast,
    buildCandidateDirections,
    createState,
    select,
    identityContract
  });
})(typeof globalThis!=='undefined'?globalThis:this);
