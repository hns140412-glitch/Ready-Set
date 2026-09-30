import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const configPath = path.join(root, 'design-gate.json');

function fail(code, detail='') {
  console.error('[DESIGN_GATE][FAIL]', code, detail);
  process.exitCode = 1;
}
function sha256(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
if (!fs.existsSync(configPath)) {
  fail('CONFIG_MISSING', 'design-gate.json');
  process.exit();
}
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (cfg.schema !== 'TAKY_DESIGN_GATE_V1') fail('SCHEMA_INVALID', cfg.schema || '');
if (cfg.rule_id !== 'TKY-ASSET-001') fail('RULE_BINDING_MISSING', cfg.rule_id || '');
if (!cfg.project) fail('PROJECT_MISSING');
if (!Array.isArray(cfg.screens) || cfg.screens.length === 0) fail('SCREENS_MISSING');

for (const screen of cfg.screens || []) {
  const id = screen.id || '<unknown>';
  if (!screen.approved_reference) {
    fail('APPROVED_REFERENCE_PATH_MISSING', id);
    continue;
  }
  const ref = path.join(root, screen.approved_reference);
  if (!fs.existsSync(ref) || !fs.statSync(ref).isFile() || fs.statSync(ref).size === 0) {
    fail('APPROVED_REFERENCE_MISSING', `${id} -> ${screen.approved_reference}`);
    continue;
  }
  if (!screen.approved_sha256 || !/^[a-f0-9]{64}$/i.test(screen.approved_sha256)) {
    fail('APPROVED_SHA_MISSING', id);
  } else {
    const actual = sha256(ref);
    if (actual.toLowerCase() !== screen.approved_sha256.toLowerCase()) {
      fail('APPROVED_SHA_MISMATCH', `${id} expected=${screen.approved_sha256} actual=${actual}`);
    }
  }
  if (!screen.authority_ref) fail('AUTHORITY_REF_MISSING', id);
  if (!screen.snapshot_name) fail('SNAPSHOT_NAME_MISSING', id);
}
if (!process.exitCode) {
  console.log('[DESIGN_GATE][PASS] authority + approved references are pinned and hash-verified.');
}
