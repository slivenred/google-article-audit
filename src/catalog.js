import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const skillRoot = fileURLToPath(new URL('../skills/google-article-audit/', import.meta.url));
const read = file => readFileSync(resolve(skillRoot, file), 'utf8');
export const modules = JSON.parse(read('references/modules.json'));
export const checkCatalog = JSON.parse(read('references/checks.json'));
export const registry = JSON.parse(read('references/source-registry.json'));
export const checks = new Map(checkCatalog.checks.map(item => [item.id, item]));
export const sources = new Map(registry.sources.map(item => [item.id, item]));
export const guidanceFiles = Object.freeze({
  skill: 'SKILL.md', core: 'references/core.md', findings: 'references/findings.md',
  conditional: 'references/conditional.md', formats: 'references/formats.md', sources: 'references/sources.md'
});
export const WARNING = 'Cached guidance is not live verification. The host AI must inspect the article and obtain relevant evidence. No Google score, ranking guarantee, automatic fact check, or publication permission is supplied.';

export function guidance(document) {
  if (!Object.hasOwn(guidanceFiles, document)) throw new Error(`Unknown guidance document: ${document}`);
  return read(guidanceFiles[document]);
}

export function overview() {
  return {
    name: 'google-article-audit', version: '1.0.0', cache_as_of: registry.as_of,
    source_count: sources.size, current_recommended_source_count: registry.current_recommended_source_count,
    historical_reference_source_count: registry.historical_reference_source_count, check_count: checks.size,
    module_count: Object.keys(modules).length, warning: WARNING,
    modules: Object.entries(modules).map(([id, value]) => ({id, trigger: value.trigger})),
    documents: Object.keys(guidanceFiles),
    next_step: 'Call prepare_audit for core workflow. Select only triggered modules with select_guidance. Read conditional/formats guidance when applicable. The host AI performs the audit using its own authorized research tools.'
  };
}

export function selectGuidance({modules: requestedModules = [], checks: requestedChecks = [], sources: requestedSources = [], summary = true} = {}) {
  if (!(requestedModules.length + requestedChecks.length + requestedSources.length)) throw new Error('Select at least one module, check, or source; use audit_overview to discover modules.');
  for (const [label, requested, has] of [
    ['module', requestedModules, id => Object.hasOwn(modules, id)],
    ['check', requestedChecks, id => checks.has(id)],
    ['source', requestedSources, id => sources.has(id)]
  ]) for (const id of requested) if (!has(id)) throw new Error(`Unknown ${label}: ${id}`);
  const selectedChecks = new Set(requestedChecks);
  const selectedSources = new Set(requestedSources);
  for (const id of requestedModules) {
    for (const check of modules[id].checks ?? []) selectedChecks.add(check);
    for (const source of modules[id].sources ?? []) selectedSources.add(source);
  }
  for (const id of selectedChecks) for (const source of checks.get(id).source_ids) selectedSources.add(source);
  if (!summary && selectedSources.size > 12) throw new Error('Full detail is limited to 12 selected sources per call. Use summary:true, then request individual source IDs.');
  return {
    cache_as_of: registry.as_of, warning: WARNING,
    modules: Object.fromEntries([...new Set(requestedModules)].map(id => [id, modules[id]])),
    checks: [...selectedChecks].sort().map(id => checks.get(id)),
    sources: [...selectedSources].sort().map(id => {
      const item = structuredClone(sources.get(id));
      if (summary) delete item.notes;
      return item;
    })
  };
}

export function readGuidance({document, start_line = 1, max_lines = 200}) {
  const lines = guidance(document).split('\n');
  const end = Math.min(lines.length, start_line - 1 + max_lines);
  if (start_line > lines.length) throw new Error(`start_line exceeds ${lines.length} lines`);
  return {document, start_line, total_lines: lines.length, next_line: end < lines.length ? end + 1 : null, text: lines.slice(start_line - 1, end).join('\n')};
}

export function bundleIntegrity() {
  const manifest = JSON.parse(readFileSync(new URL('../PROVENANCE.json', import.meta.url), 'utf8'));
  const results = Object.entries(manifest.skill_files_sha256).map(([file, expected]) => ({
    file, matches: createHash('sha256').update(readFileSync(resolve(skillRoot, file))).digest('hex') === expected
  }));
  const invalid = [];
  if (sources.size !== 117 || registry.sources.length !== 117) invalid.push('Expected 117 distinct sources');
  if (checks.size !== 44 || checkCatalog.checks.length !== 44) invalid.push('Expected 44 distinct checks');
  if (Object.keys(modules).length !== 32) invalid.push('Expected 32 modules');
  for (const check of checks.values()) for (const id of check.source_ids) if (!sources.has(id)) invalid.push(`${check.id}: missing ${id}`);
  for (const [id, module] of Object.entries(modules)) {
    for (const check of module.checks ?? []) if (!checks.has(check)) invalid.push(`${id}: missing ${check}`);
    for (const source of module.sources ?? []) if (!sources.has(source)) invalid.push(`${id}: missing ${source}`);
  }
  return {ok: results.every(r => r.matches) && invalid.length === 0, files: results, errors: invalid, counts: {sources: sources.size, checks: checks.size, modules: Object.keys(modules).length}};
}
