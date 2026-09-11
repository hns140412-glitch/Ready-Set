/* Shared, extensible MOOD_TILE -> KEYWORDS -> PROMPT_DIRECTION contract. */
(() => {
 'use strict';
 const tile=(key,label,keywords,expression,pose,energy,props,staging,atmosphere)=>({key,label,keywords,direction:{expression,pose,energy,props,staging,atmosphere}});
 const tiles=[
  tile('EXCITED','신나!',['활발','씩씩','장난꾸러기'],'open joyful laugh','wide skipping stride','explosive playful motion','ribbon wand','sweeping outdoor arc','bright festive breeze'),
  tile('DISCOVERY','두근두근',['호기심','모험','발견'],'wide-eyed anticipation','lean forward peeking','tentative discovery','magnifying glass','close garden discovery','fresh dawn wonder'),
  tile('COZY','포근해',['따뜻','친근','다정'],'gentle welcoming smile','seated open embrace','soft restful warmth','small cushion','sheltered reading nook','diffuse peach afternoon'),
  tile('CONFIDENT','멋져!',['자신감','당당','용감'],'determined proud grin','upright hands on hips','bold steady presence','small pennant','high lookout platform','clear heroic blue sky'),
  tile('FOCUSED','집중!',['차분','똑똑','꼼꼼'],'intent thoughtful gaze','crouched careful inspection','quiet precise attention','field notebook','ordered study station','cool focused task light'),
  tile('IMAGINING','상상중',['신비','창의','이야기'],'dreamy amazed smile','reaching upward in a spiral','floating imaginative flow','paper story mobile','layered storybook clouds','luminous lilac twilight')
 ];
 function direction(selection){
  const t=tiles.find(t=>t.key===selection?.tileKey),keywords=selection?.keywords||[];
  if(!t||!Array.isArray(keywords)||keywords.length>2||new Set(keywords).size!==keywords.length||keywords.some(k=>!t.keywords.includes(k)))throw Error('INVALID_MOOD_DIRECTION');
  return {tileKey:t.key,label:t.label,keywords:[...keywords],promptDirection:{...t.direction},prompt:`Expression/generation direction only, never personality or identity classification. ${Object.entries(t.direction).map(([k,v])=>`${k}: ${v}`).join('; ')}. Optional nuances: ${keywords.join(', ')||'none'}.`};
 }
 function plan(raw){
  if(raw?.version!==2||!Array.isArray(raw.selections)||raw.selections.length!==3)throw Error('THREE_MOOD_TILES_REQUIRED');
  const directions=raw.selections.map(direction);
  if(new Set(directions.map(d=>d.tileKey)).size!==3)throw Error('NEAR_DUPLICATE_DIRECTION');
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(Object.keys(directions[a].promptDirection).filter(k=>directions[a].promptDirection[k]!==directions[b].promptDirection[k]).length<5)throw Error('NEAR_DUPLICATE_DIRECTION');
  return directions;
 }
 globalThis.ReadyMoodDirectionV2=Object.freeze({version:2,tiles, direction,plan});
})();
