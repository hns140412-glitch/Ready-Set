'use strict';

const assert=require('node:assert/strict');
const Router=require('../src/integrations/specialist-router-runtime.js');

function apps(plan){ return plan.allowed_specialists.slice().sort(); }

const math=Router.classify({
  subject:'수학',
  matched_domain:'수와 연산',
  activity_sequence:['SCENE_OR_VISUAL_MODEL','RESTATE_QUESTION','UNDERSTAND_CONCEPT','REPRESENT_RELATION','PREDICT','SOLVE','EXPLAIN','TRANSFER','CHECK_ERROR']
});
assert.equal(math.mode,'READY_ORCHESTRATED');
assert.deepEqual(apps(math),[]);
assert.equal(Router.canLaunch(math,'snap-pop'),false);
assert.equal(Router.canLaunch(math,'hide-seek'),false);

const history=Router.classify({
  subject:'사회',
  matched_domain:'역사',
  activity_sequence:['QUESTION','LIFE_SOCIETY_CONTEXT','PRIMARY_SOURCE_RECORD','CLAIM_EVIDENCE','EXPLAIN']
});
assert.equal(history.mode,'READY_ORCHESTRATED');
assert.deepEqual(apps(history),[]);

const hanja=Router.classify({
  subject:'한자',
  activity_sequence:['FORM','SOUND','CORE_MEANING','VERIFIED_RELATION','COMPOUND_WORD','SCENE_CONTEXT','RECALL']
});
assert.equal(hanja.mode,'HIDE_SPECIALIST');
assert.deepEqual(apps(hanja),['hide-seek']);
assert.equal(Router.canLaunch(hanja,'hide-seek'),true);
assert.equal(Router.canLaunch(hanja,'snap-pop'),false);

const korean=Router.classify({
  subject:'국어',
  activity_sequence:['TOOL_LANGUAGE_GATE','READ_OR_LISTEN','UNDERSTAND','FIND_EVIDENCE','RESPOND_OR_EXPRESS','REVIEW']
});
assert.equal(korean.mode,'READY_ORCHESTRATED');
assert.deepEqual(apps(korean),['snap-pop']);

const english=Router.classify({
  subject:'영어',
  activity_sequence:['INPUT','NOTICE_MEANING','BIDIRECTIONAL_RECALL','COMPREHEND','SELECTIVE_RELEARN','PRODUCE','SELF_REVIEW']
});
assert.equal(english.mode,'READY_ORCHESTRATED');
assert.deepEqual(apps(english),['hide-seek','snap-pop']);

const labelOnly=Router.classify({
  label:'단어 글쓰기',
  activity_sequence:[],
  activity_types:[]
});
assert.equal(labelOnly.mode,'READY_ORCHESTRATED');
assert.deepEqual(apps(labelOnly),[]);
assert.equal(Router.canLaunch(labelOnly,'hide-seek'),false);
assert.equal(Router.canLaunch(labelOnly,'snap-pop'),false);

console.log('SPECIALIST_ROUTER_PASS');
