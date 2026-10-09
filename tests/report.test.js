import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateReport } from '../src/report.js';
const sample = () => JSON.parse(readFileSync(new URL('../examples/report.synthetic.json',import.meta.url),'utf8'));
test('valid synthetic shape is not semantic truth', () => {
  const result=validateReport(sample());assert.equal(result.structurally_valid,true);assert.match(result.disclaimer,/only/);
});
for(const status of ['PASS','FAIL','UNKNOWN','NA']) test(`${status} requires status-specific support`, () => {
  const r=sample();r.findings[0].status=status;delete r.findings[0].gap;
  assert.equal(validateReport(r).structurally_valid,false);
});
test('no rendered-page inference from draft or unrequested full-page gate', () => {
  const r=sample();r.decisions.full_page='REVIEW_READY';assert.equal(validateReport(r).structurally_valid,false);
  r.requested_scope.push('rendered_page');assert.equal(validateReport(r).structurally_valid,false);
  r.decisions.full_page='NEEDS_EVIDENCE';assert.equal(validateReport(r).structurally_valid,true);
});
test('necessary failure and unknown constrain declared gates', () => {
  const r=sample();r.decisions.editorial='READY';assert.equal(validateReport(r).structurally_valid,false);
  r.findings[0].status='FAIL';r.findings[0].evidence='Concrete supplied counterexample.';r.decisions.editorial='BLOCKED';assert.equal(validateReport(r).structurally_valid,true);
});
test('publication approval requires same version and explicit record but stays unverified', () => {
  const r=sample();r.decisions.publication_authorization='APPROVED_FOR_VERSION';assert.equal(validateReport(r).structurally_valid,false);
  r.decisions.approved_version='draft-1';r.decisions.authorization_evidence='Synthetic fixture only';const result=validateReport(r);assert.equal(result.structurally_valid,true);assert.match(result.warnings.join(' '),/cannot establish/);
});
test('optimization requires revised artifact and actual recheck record', () => {
  const r=sample();r.mode='audit+optimize';assert.equal(validateReport(r).structurally_valid,false);
  r.revision={version:'draft-1',artifact_reference:'example only',recheck_result:'not completed: still provisional',provisional:true};assert.equal(validateReport(r).structurally_valid,true);
});
test('unknown IDs, non-http URLs and invented scoring fields are rejected', () => {
  const r=sample();r.findings[0].check_id='ABC-99';assert.equal(validateReport(r).structurally_valid,false);
  delete r.findings[0].check_id;r.findings[0].sources=[{url:'file:///etc/passwd',evidence_state:'user_supplied'}];assert.equal(validateReport(r).structurally_valid,false);
  r.findings[0].sources=[];r.google_score=100;assert.equal(validateReport(r).structurally_valid,false);
});
test('provisional revisions cannot be declared ready', () => {
  const r=sample();r.mode='audit+optimize';r.findings=[];r.decisions.editorial='READY';
  r.revision={version:'draft-1',artifact_reference:'example only',recheck_result:'pending evidence',provisional:true};
  assert.equal(validateReport(r).structurally_valid,false);
  r.decisions.editorial='READY_WITH_WARNINGS';assert.equal(validateReport(r).structurally_valid,false);
  r.decisions.editorial='NEEDS_EVIDENCE';assert.equal(validateReport(r).structurally_valid,true);
});
test('nonblocking unresolved caveats require warning state', () => {
  const r=sample();r.findings[0].required=false;r.decisions.editorial='READY';
  assert.equal(validateReport(r).structurally_valid,false);
  r.decisions.editorial='READY_WITH_WARNINGS';assert.equal(validateReport(r).structurally_valid,true);
});
