import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=fs.readFileSync('ready-runtime-v07.js','utf8');
assert.match(src,/readyReturnUrl\(\).*crew_event|function readyReturnUrl\(\).*crewEvent/s);
assert.match(src,/new URLSearchParams\(location\.search\)\.get\('crew_event'\)/);
assert.match(src,/url\.searchParams\.set\('crew_event',crewEvent\)/);
console.log('READY_EXPLORER_CREW_HANDOFF_CONTRACT_PASS');
