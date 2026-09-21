const { test, expect } = require('@playwright/test');
const fs=require('fs');

test('P5 active version sources align with Ready renewal registry',async()=>{
  const app=fs.readFileSync('app.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const sw=fs.readFileSync('sw.js','utf8');
  const readme=fs.readFileSync('README.md','utf8');
  const version=JSON.parse(fs.readFileSync('VERSION.json','utf8'));
  const registry=JSON.parse(fs.readFileSync('READY_SET_VERSION_REGISTRY.json','utf8'));
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

  expect(registry.product_version).toBe('1.0.0-alpha.2');
  expect(version.productVersion).toBe(registry.product_version);
  expect(pkg.version).toBe(registry.product_version);
  expect(version.productGeneration).toBe(registry.product_generation);
  expect(version.schemaVersion).toBe(registry.data_schema_version);
  expect(version.sessionSchemaVersion).toBe(registry.session_schema_version);

  expect(app).toContain("app:'1.0.0-alpha.2'");
  expect(app).toContain("generation:'READY_RENEWAL_01'");
  expect(index).toContain('APP_VERSION 1.0.0-alpha.2');
  expect(sw).toContain("const CACHE='ready-set-renewal-01-alpha2'");
  expect(registry.build_identity.branch_candidate_cache).toBe('ready-set-renewal-01-alpha2');

  for(const text of [app,index,sw,readme,JSON.stringify(version)]){
    expect(text).not.toContain('타임어택');
    expect(text).not.toContain('0.9.3-rc1');
    expect(text).not.toContain('ready-set-v093-rev07');
    expect(text).not.toContain('ready-set-v097-full-unit-map-v02');
  }

  expect(version.releaseStatus).toBe('RENEWAL_IN_PROGRESS_BRANCH_CANDIDATE');
  expect(registry.build_identity.branch_candidate_not_release_identity).toBe(true);
});
