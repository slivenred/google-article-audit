import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { overview, guidance, readGuidance, selectGuidance, bundleIntegrity } from '../src/catalog.js';
import { reportJsonSchema } from '../src/report.js';

test('all canonical sources, checks and modules and original bytes survive', () => {
  assert.deepEqual(bundleIntegrity().counts, {sources:117, checks:44, modules:32});
  assert.equal(bundleIntegrity().ok, true);
  assert.equal(overview().historical_reference_source_count, 7);
});
test('selector agrees with original Python helper', () => {
  const script = fileURLToPath(new URL('../skills/google-article-audit/scripts/select_guidance.py', import.meta.url));
  const original = JSON.parse(execFileSync('python3',[script,'--module','reviews','--check','MET-02','--summary'],{encoding:'utf8'}));
  const actual = selectGuidance({modules:['reviews'], checks:['MET-02'], summary:true});
  assert.deepEqual(actual.modules, original.modules);
  assert.deepEqual(actual.checks, original.checks);
  assert.deepEqual(actual.sources, original.sources);
});
test('selection is explicit, rejects invalid IDs, and limits detailed payloads', () => {
  assert.throws(() => selectGuidance({}));
  assert.throws(() => selectGuidance({modules:['constructor']}));
  assert.throws(() => selectGuidance({checks:['FAKE-1']}));
  assert.throws(() => selectGuidance({sources:['SRC-999']}));
  assert.throws(() => selectGuidance({modules:['core','page'],summary:false}), /12/);
  assert.equal(selectGuidance({sources:['SRC-003'],summary:false}).sources.length,1);
});
test('guidance allowlist and pagination preserve complete content', () => {
  assert.throws(() => guidance('../package.json'));
  assert.throws(() => guidance('__proto__'));
  const all=[]; let start=1;
  while(start) {const page=readGuidance({document:'conditional',start_line:start,max_lines:11});all.push(page.text);start=page.next_line;}
  assert.equal(all.join('\n'),guidance('conditional'));
});
test('published report schema is exactly the code schema', () => {
  assert.deepEqual(JSON.parse(readFileSync(new URL('../schemas/report.schema.json',import.meta.url),'utf8')),reportJsonSchema);
});
