'use strict';
const assert=require('node:assert/strict');

global.window=global;
global.__READY_SPECIALIST_TARGETS__={};
require('../src/integrations/specialist-targets-runtime.js');

const targets=global.ReadySetSpecialistTargets;
assert.equal(targets.version,'READY_SPECIALIST_TARGETS_V01');
assert.equal(targets.resolve('hide-seek').target_kind,'LEGACY_FALLBACK');
assert.equal(targets.resolve('hide-seek').learning_context_contract,'UNVERIFIED_CONSUMER');
assert.equal(targets.config().hideSeekV2,null);
assert.equal(targets.config().snapPopV2,null);
assert.equal(targets.trustedOrigins().length,2);
assert.equal(targets.resolve('unknown'),null);
console.log('SPECIALIST_TARGETS_PASS');
