import * as z from 'zod/v4';
import { checks, sources } from './catalog.js';

const text = z.string().min(1).max(8000);
const short = z.string().min(1).max(200);
const scope = z.enum(['content_only', 'provided_metadata', 'rendered_page', 'site_sample', 'search_console', 'owner_records']);
const priority = z.enum(['P0', 'P1', 'P2']);
const editorial = z.enum(['BLOCKED', 'NEEDS_EVIDENCE', 'READY_WITH_WARNINGS', 'READY']);
const fullPage = z.enum(['NOT_ASSESSED', 'BLOCKED', 'NEEDS_EVIDENCE', 'REVIEW_READY_WITH_WARNINGS', 'REVIEW_READY']);
const sourceReference = z.object({
  source_id: z.string().regex(/^SRC-\d{3}$/).optional(),
  url: z.url().max(2048), section: text.optional(), checked_on: z.iso.date().optional(),
  evidence_state: z.enum(['live_read', 'cached_read', 'unavailable', 'user_supplied'])
}).strict();

export const reportSchema = z.object({
  schema_version: z.literal('1.0'),
  artifact: z.object({id: short, version: short}).strict(),
  mode: z.enum(['audit-only', 'audit+optimize']),
  requested_scope: z.array(scope).min(1).max(6),
  observed_scope: z.array(scope).min(1).max(6),
  scope_note: text,
  decisions: z.object({
    editorial, full_page: fullPage,
    publication_authorization: z.enum(['NOT_REQUESTED', 'PENDING', 'APPROVED_FOR_VERSION', 'REVOKED_OR_STALE']),
    approved_version: short.optional(), authorization_evidence: text.optional()
  }).strict(),
  findings: z.array(z.object({
    id: short, check_id: z.string().max(20).optional(), location: text, claim: text,
    rule_class: z.enum(['search_policy', 'official_recommendation', 'rater_concept', 'technical_eligibility', 'surface_requirement', 'internal_standard']),
    applicability: text, status: z.enum(['PASS', 'FAIL', 'UNKNOWN', 'NA']),
    evidence: text.optional(), gap: text.optional(), na_reason: text.optional(),
    fix: text, recheck: text, priority: priority.optional(),
    gate: z.enum(['none', 'editorial', 'full_page', 'surface']), required: z.boolean(),
    sources: z.array(sourceReference).max(20)
  }).strict()).max(200),
  remaining_questions: z.array(text).max(100),
  known_future_publication_blockers: z.array(text).max(100),
  revision: z.object({version: short, artifact_reference: text, recheck_result: text, provisional: z.boolean()}).strict().optional()
}).strict();

export const reportJsonSchema = z.toJSONSchema(reportSchema, {target: 'draft-2020-12'});

export function validateReport(report) {
  const disclaimer = 'This validates shape and declared-state consistency only. It cannot verify facts, source authenticity, applicability, semantic completeness, authorization, current Google rules, or publication readiness.';
  const parsed = reportSchema.safeParse(report);
  if (!parsed.success) return {structurally_valid: false, errors: parsed.error.issues.map(i => ({path: i.path.join('.'), message: i.message})), warnings: [], disclaimer};
  const r = parsed.data, errors = [], warnings = [];
  const add = (path, message) => errors.push({path, message});
  const seen = new Set();
  for (const [i, f] of r.findings.entries()) {
    const path = `findings.${i}`;
    if (seen.has(f.id)) add(`${path}.id`, 'Finding IDs must be unique');
    seen.add(f.id);
    if (f.check_id && !checks.has(f.check_id)) add(`${path}.check_id`, 'Unknown bundled check ID; omit check_id for a custom finding');
    if (['PASS','FAIL'].includes(f.status) && !f.evidence?.trim()) add(`${path}.evidence`, `${f.status} requires observed evidence`);
    if (f.status === 'UNKNOWN' && !f.gap?.trim()) add(`${path}.gap`, 'UNKNOWN requires the missing evidence or uncertainty');
    if (f.status === 'NA' && !f.na_reason?.trim()) add(`${path}.na_reason`, 'NA requires a positive inapplicability basis');
    for (const [j, s] of f.sources.entries()) {
      if (!/^https?:\/\//i.test(s.url)) add(`${path}.sources.${j}.url`, 'Only http(s) evidence URLs are accepted');
      if (s.source_id && !sources.has(s.source_id)) add(`${path}.sources.${j}.source_id`, 'Unknown bundled source ID');
      if (s.evidence_state === 'unavailable' && s.checked_on) warnings.push(`${path}.sources.${j}: a failed retrieval date is not a successful verification date.`);
    }
  }
  const pageRequested = r.requested_scope.includes('rendered_page');
  if (!pageRequested && r.decisions.full_page !== 'NOT_ASSESSED') add('decisions.full_page', 'Use NOT_ASSESSED when full-page review was not requested; list known future blockers separately');
  if (pageRequested && r.decisions.full_page === 'NOT_ASSESSED') add('decisions.full_page', 'Requested full-page review needs its own declared decision');
  if (pageRequested && !r.observed_scope.includes('rendered_page') && !['BLOCKED','NEEDS_EVIDENCE'].includes(r.decisions.full_page)) add('decisions.full_page', 'A requested but unobserved rendered page cannot be declared review-ready');
  for (const [gate, actual] of [['editorial',r.decisions.editorial],['full_page',r.decisions.full_page]]) {
    if (actual === 'NOT_ASSESSED') continue;
    const relevant = r.findings.filter(f => f.gate === gate && f.required);
    if (relevant.some(f => f.status === 'FAIL') && actual !== 'BLOCKED') add(`decisions.${gate}`, 'A declared necessary FAIL requires BLOCKED');
    else if (!relevant.some(f => f.status === 'FAIL') && relevant.some(f => f.status === 'UNKNOWN') && actual !== 'NEEDS_EVIDENCE') add(`decisions.${gate}`, 'A declared necessary UNKNOWN requires NEEDS_EVIDENCE');
    const caveats = r.findings.some(f => f.gate === gate && !f.required && ['FAIL','UNKNOWN'].includes(f.status));
    if (caveats && ['READY','REVIEW_READY'].includes(actual)) add(`decisions.${gate}`, 'Declared nonblocking FAIL/UNKNOWN caveats require a warnings decision, not fully READY');
  }
  if (r.decisions.publication_authorization === 'APPROVED_FOR_VERSION') {
    if (r.decisions.approved_version !== r.artifact.version) add('decisions.approved_version', 'Approval must name the reviewed artifact version');
    if (!r.decisions.authorization_evidence?.trim()) add('decisions.authorization_evidence', 'Explicit approval evidence is required; model review does not grant permission');
    warnings.push('The validator cannot establish whether approval is real, authorized, or still valid. Verify with the user before publishing.');
  }
  if (r.mode === 'audit+optimize' && !r.revision) add('revision', 'Audit+optimize requires a revised artifact reference and actual recheck record');
  if (r.revision && r.revision.version !== r.artifact.version) add('revision.version', 'The final decision must be bound to the actual reviewed revision');
  if (r.revision?.provisional) {
    if (['READY','READY_WITH_WARNINGS'].includes(r.decisions.editorial)) add('decisions.editorial', 'A declared provisional revision cannot be publish-ready; use NEEDS_EVIDENCE or BLOCKED and identify the gap');
    if (['REVIEW_READY','REVIEW_READY_WITH_WARNINGS'].includes(r.decisions.full_page)) add('decisions.full_page', 'A declared provisional revision cannot be full-page review-ready');
  }
  if (r.findings.length === 0) warnings.push('No findings were supplied; structural validity does not demonstrate that an audit was performed.');
  return {structurally_valid: errors.length === 0, errors, warnings, disclaimer};
}
