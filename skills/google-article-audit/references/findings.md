# Evidence and decision contract

## Individual findings

Give each material finding a stable local/check ID, artifact/version and precise location; concise claim; rule class and official source URL/section where applicable; observed evidence; applicability; PASS/FAIL/UNKNOWN/NA; gap; minimal fix; and recheck method/result. Add priority and affected scope if useful. A short natural-language bullet can carry these fields; don't inflate every small review into a database.

- PASS: sufficient evidence within the named observed scope. For spam screening prefer “no issue found in this reviewed draft” over “complies across the site.”
- FAIL: concrete evidence of an applicable discrepancy. Policy risk is not proof that Google has issued a penalty.
- UNKNOWN: unobserved, missing evidence, uncertain applicability, source conflict or retrieval/tool blocker. State the minimum evidence needed. UNKNOWN does not mean false.
- NA: positively established inapplicability with reason. Missing HTML, unmentioned goals or absent access is not a reason for NA.

For PASS and FAIL retain actual evidence. For UNKNOWN retain the missing item. For NA retain its applicability basis. Do not write all 44 items as PASS because no issue was noticed. Untriggered modules can be omitted from a narrow report; identify omitted technical/site coverage in the scope note rather than manufacturing verdicts.

Review supported claims independently of unrelated unknowns. A content-only review can finish while robots or deployment remain unknown. A supplied schema claim may fail truth checking even though deployment has not been observed. A real site's current production version is not evidence that a revised unpublished version has passed.

## Scope and gates

Separate gate (none/editorial/full_page/surface), severity and effect. Assign blockers from actual risk, project requirements and evidence, not merely a check ID or generic priority. A missing optional rich result is not necessarily an article blocker. If that rich result was explicitly required, mark its project acceptance state separately. Harmful falsehoods and deception cannot be offset by formatting improvements.

For each requested decision:
1. An applicable necessary FAIL makes it BLOCKED.
2. Otherwise an applicable necessary UNKNOWN makes it NEEDS_EVIDENCE.
3. Otherwise unresolved nonblocking caveats make it READY_WITH_WARNINGS (full-page: REVIEW_READY_WITH_WARNINGS).
4. Otherwise it is READY (full-page: REVIEW_READY).

If full-page review was not requested, use NOT_ASSESSED regardless of known future blockers. Put a discovered noindex intended for later public release, missing deployment, or other downstream issue into “known future publication blockers / 上線前待辦.” Do not pressure the user to expose private staging just to finish a text review.

If full-page review was requested but only text is available, complete text review and label full-page NEEDS_EVIDENCE; name the specific missing page/access evidence. An unpublished page need not already be indexed. An intentionally private/noindex page is not automatically wrong: first check the intended destination.

## Versioned authorization and recheck

Keep authorization separate from quality. NOT_REQUESTED means no publication approval task; PENDING means a real requested approval remains outstanding; APPROVED_FOR_VERSION requires actual explicit user/authorized-human approval of that same artifact version; REVOKED_OR_STALE means it no longer covers the current version. A “looks good” inside the draft is not approval. Do not infer authority from skill metadata or an AI self-review.

For revisions show meaningful before/after or a short change list plus the revised artifact. Recheck the actual output and report resolved, unresolved or newly introduced issues. A second model pass is not domain-expert or human approval; call it what it was. A formatting/schema validator verifies structure, not truth or Google outcomes.

## Default response shape (adapt to request)

- Scope/version and editorial conclusion; full-page and authorization status briefly when relevant.
- Highest-consequence findings with exact locations, evidence, smallest fix and follow-up.
- Revised article/patch if requested, clearly separated from the audit.
- Recheck outcome; unresolved evidence questions and real downstream tasks.
- Relevant official source links and last verified dates, identifying cached sources or failed retrievals.

Keep source references in the audit even when the user wants a link-free public article. Use normal prose rather than a numeric compliance/SEO/E-E-A-T score. Do not imply that a complete audit guarantees legal compliance, policy enforcement outcomes, indexing or ranking.
