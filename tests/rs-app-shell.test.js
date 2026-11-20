// Replaces the old-app shell assertions (approved by Taky 2026-11-05): the rebuilt app shell
// loads rs/rs.css, rs/crew.js, rs/rs-app.js with one cache tag shared by index.html, sw.js and art URLs,
// every local asset the app references exists, and the app script parses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html'), sw = read('sw.js'), app = read('rs/rs-app.js'), css = read('rs/rs.css');

const tag = (html.match(/rs\/rs-app\.js\?v=([0-9a-z]+)/) || [])[1];
assert.ok(tag, 'index.html loads rs/rs-app.js with a ?v= tag');
for (const f of ['rs/rs.css', 'rs/crew.js', 'rs/rs-app.js']) {
  assert.ok(html.includes(`${f}?v=${tag}`), `index.html loads ${f}?v=${tag}`);
  assert.ok(sw.includes(`./${f}?v=${tag}`), `sw.js precaches ${f}?v=${tag}`);
}
assert.ok(sw.includes(`ready-set:rebuild-${tag}`), 'sw cache name carries the same tag');
for (const m of (app + css).matchAll(/rs\/(?:art|items)\/[\w-]+\.webp\?v=([0-9a-z]+)/g)) assert.equal(m[1], tag, `art URL ${m[0]} uses the current tag`);

// every local rs/ or assets/ file referenced by the app exists
const refs = new Set();
for (const src of [html, app, css]) for (const m of src.matchAll(/(?:^|["'(`\s])((?:\.\/)?(?:rs|assets)\/[\w\/.-]+\.(?:webp|png|svg|wav|json|js|css))(?![\w])/g)) refs.add(m[1].replace(/^\.\//, ''));
for (const m of css.matchAll(/url\((scenes\/[\w-]+\.webp)/g)) refs.add('rs/' + m[1]);
assert.ok(refs.size > 5, 'found local asset references');
for (const r of refs) if (!r.includes('${')) assert.ok(fs.existsSync(path.join(root, r)), `missing asset ${r}`);
for (const k of ['camera', 'compass', 'notebook', 'binoculars', 'bottle']) assert.ok(fs.existsSync(path.join(root, `rs/items/${k}.webp`)), `item art ${k}`);

execFileSync(process.execPath, ['--check', path.join(root, 'rs/rs-app.js')]);
execFileSync(process.execPath, ['--check', path.join(root, 'rs/crew.js')]);
// focus sound set confirmed 2026-09-18: no lofi
assert.ok(!/\['lofi'/.test(app), 'lofi focus sound stays removed');
assert.ok(app.includes("['essential', 'Essential']"), 'Essential focus sound present');
console.log('rs-app-shell: ok (tag ' + tag + ', ' + refs.size + ' asset refs)');
