import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createServer, fixtures} from './server.mjs';
const read = name => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
const setup = read('./setup.js');
for (const name of ['../../index.html','../../app.js','../../sw.js']) {
  assert.doesNotMatch(read(name), /visual-qa|__visual|visualQaReady/);
}
assert.doesNotMatch(setup, /activeSession|createSession|readyset_state|readyset_.*session|fetch\(|XMLHttpRequest/);
assert.doesNotMatch(read('./server.mjs'), /loadEnv|process\.env|netlify\/functions|character-candidates/);
function run(hostname, port, pathname, fixture) {
  const storage = new Map([['sentinel','preserve']]);
  const context = vm.createContext({location:{hostname,port,pathname,search:`?state=${fixture}`},
    URLSearchParams, localStorage:{clear:()=>storage.clear(),setItem:(k,v)=>storage.set(k,v)},
    sessionStorage:{clear(){}}, document:{createElement:()=>({}),head:{appendChild(){}}},
    addEventListener(){}});
  context.window = context;
  vm.runInContext(setup, context);
  return storage;
}
for (const args of [['example.com','4177','/__visual/','onboarding-mode'],
  ['127.0.0.1','8080','/__visual/','onboarding-mode'], ['127.0.0.1','4177','/','onboarding-mode'],
  ['127.0.0.1','4177','/__visual/','unknown']]) {
  assert.equal(run(...args).get('sentinel'), 'preserve');
}
for (const fixture of fixtures) {
  const storage = run('127.0.0.1','4177','/__visual/',fixture);
  assert.deepEqual([...storage.keys()], ['readyset_identity_v1']);
  assert.equal(JSON.parse(storage.get('readyset_identity_v1')).onboardingStep, fixture.split('-')[1].toUpperCase());
}
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const url of ['/', '/index.html', '/.env.local', '/.git/HEAD', '/api/character-candidates', '/sw.js', '/tests/visual-qa/setup.js', '/assets/../../config.js']) {
    assert.equal((await fetch(origin + url)).status, 404, url);
  }
  assert.equal((await fetch(origin + '/__visual/?state=unknown')).status,400);
  assert.equal((await fetch(origin + '/__visual/?state=onboarding-mode',{method:'POST'})).status,405);
  for (const fixture of fixtures) {
    const response = await fetch(`${origin}/__visual/?state=${fixture}`);
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-security-policy'), /connect-src 'none'; worker-src 'none'/);
    const html = await response.text();
    assert.ok(html.indexOf('Dedicated disposable QA origin') < html.indexOf('id="identityPreboot"'));
  }
  assert.equal((await fetch(origin + '/app.js')).status,200);
} finally { await new Promise(resolve => server.close(resolve)); }
console.log('PASS: QA isolation, fixture ownership, production entry points, API/worker denial, routes');
