# Verification record

Date: 2026-10-08. Environment actually exercised: Linux, Node.js 24.19.0, npm 11.9.0, Python 3.12.14.

## Passed

- 18 automated tests: catalog counts/integrity, original selector parity, explicit selection and invalid IDs, guidance pagination/allowlist, schema export parity, report statuses/evidence fields, scope gates, version-bound authorization records, revision requirements, provisional-state consistency, nonblocking warnings, rejected invented score fields, and oversized-frame termination without content logging
- All 12 canonical Skill files are byte-identical to the input Skill; hashes recorded in PROVENANCE.json
- 117 distinct source records, 44 distinct internal checks, 32 modules; all referenced IDs resolve; 110 current-recommended and 7 historical source records preserved
- Additional all-module comparison against the original Python selector for all 32 modules
- Actual subprocess stdio protocol: legacy initialize and modern discovery/negotiation; tools/list; valid and invalid calls; resources/list and resources/read; prompts/list and prompts/get; cleanup/exit
- Additional raw-wire negative probes: unknown and prototype-like IDs, path/URI traversal, unexpected keys, bad pagination, selection caps, malformed and oversized report JSON; server remains usable after ordinary invalid calls
- A 1.1 MiB incoming frame terminates the server promptly with a generic diagnostic and no supplied content in logs
- CLI help, guidance, selectors, JSON schema export, structural validation and negative cases
- Fresh source-copy installation with npm ci --ignore-scripts, followed by tests, protocol smoke and bundle integrity check
- npm pack and ephemeral local install; both installed CLI and installed/symlinked MCP bin entry points exercised. The .tgz was a packaging test, not the primary source distribution
- npm audit --omit=dev reported zero known production dependency vulnerabilities on the test date. This is a point-in-time registry result, not a security guarantee

## Not claimed

- No installation or end-to-end UI test was performed on the user's Mac, Windows, Codex app, Claude Code app or Cursor app
- Node 20 is the official SDK's declared minimum, but this package was executed on Node 24.19.0
- Official client setup instructions were checked against current documentation; that does not prove every client UI/version behaves identically
- No article's factual truth, live Google policy compliance, ranking, indexing, rich-result eligibility or publication authorization was established by software tests
- The 117 cached source pages were not all re-opened during packaging; original read dates and evidence statuses are retained

## Reproduce

From a fresh repository clone or the source ZIP after extraction:

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run smoke
```

The source ZIP includes package-lock.json, test and smoke scripts, docs, examples and the complete Skill. It excludes dependencies, credentials, unrelated research, build caches and Git history. npm automatically omits package-lock.json from an npm .tgz, so extract the source ZIP for the documented npm ci workflow.
