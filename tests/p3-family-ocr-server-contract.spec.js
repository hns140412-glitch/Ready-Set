const {test,expect}=require('@playwright/test');
const fs=require('fs');

test('family capture server keeps Ready and Hide authorization/domain boundaries',async()=>{
  const src=fs.readFileSync('netlify/functions/capture-analyze.mjs','utf8');

  expect(src).toContain("const READY_DOMAIN='READY_ASSIGNMENT_FACT'");
  expect(src).toContain("const HIDE_DOMAIN='HIDE_VOCABULARY'");
  expect(src).toContain("if(domain===READY_DOMAIN)return role==='PARENT'");
  expect(src).toContain("if(domain===HIDE_DOMAIN)return role==='PARENT'||role==='CHILD'");

  expect(src).toContain('function readyAssignmentSchema()');
  expect(src).toContain('function hideVocabularySchema()');
  expect(src).toContain("analysis_domain:{type:'string',enum:[HIDE_DOMAIN]}");
  expect(src).toContain("required:['eng','kor','confidence','evidence_item_id','source_column','source_row_index','source_column_index','warnings']");
  expect(src).toContain("source_column:{type:'string',enum:['LEFT','RIGHT','CENTER','UNKNOWN']}");
  expect(src).toContain("source_row_index:{type:'integer',minimum:0}");
  expect(src).toContain("source_column_index:{type:'integer',minimum:0}");

  expect(src).toContain("const analysisDomain=String(form.get('analysis_domain')||READY_DOMAIN)");
  expect(src).toContain("if(!SUPPORTED_DOMAINS.has(analysisDomain))");
  expect(src).toContain("reason:'ANALYSIS_DOMAIN_UNSUPPORTED'");

  expect(src).toContain("Each row must cite the capture_item_id");
  expect(src).toContain("allowedItems.has(String(x.evidence_item_id||''))");
  expect(src).toContain("actor_role:mapped.session.role");
  expect(src).toContain("analysis_domain:analysisDomain");
});

test('Hide vocabulary prompt forbids invention and preserves visible pairing',async()=>{
  const src=fs.readFileSync('netlify/functions/capture-analyze.mjs','utf8');
  expect(src).toContain('Never invent missing words, meanings, examples, hints, or answers.');
  expect(src).toContain('Pair each English word with its visible Korean meaning while preserving source order.');
  expect(src).toContain('Ignore headers, page numbers, decorative text, and unrelated instructions.');
});
