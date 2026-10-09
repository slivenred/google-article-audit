# Architecture and trust boundaries

## One maintained authority

`skills/google-article-audit/` contains the canonical workflow, evidence/decision contract, detailed conditional guidance, 117-record source registry, 44 checks, 32 modules, and original stdlib helper. It is directly usable as a portable Skill. The Node catalog reads those same files relative to its own module URL, independent of the client's working directory.

MCP does not maintain a second rewritten rubric. `prepare_audit` combines canonical text with an operational checklist; `select_guidance` returns original records. Source `last_successful_read`, status and historical caveats survive selection. Summaries omit only extended notes.

The optional report JSON schema is a local adapter convention. It is derived from `src/report.js` and exported to `schemas/report.schema.json`; tests ensure equality. It is not a required editorial form or Google schema. Reports may remain human-readable.

## Division of work

- Server: select guidance, expose exact bundled text, validate shape and declared-state consistency
- Host AI: read article/metadata, determine applicability, investigate claims, inspect current official rules, reason about findings, revise only when requested, recheck the actual version
- User/authorized person: provide actual publication approval for a specific version, when desired

The server never decides that an article is true, complete, policy-compliant or ready to publish. `structurally_valid` is deliberately narrower than those judgments. Necessary FAIL/UNKNOWN rules are checked only against the declarations supplied by the caller; applicability, evidence and authorization authenticity remain unverified.

## MCP surface

Six read-only tools, six static Markdown guidance resources plus a schema resource, and one host-executed prompt. The official MCP SDK v2 factory stdio entry supports both modern discovery and legacy initialize connections. No HTTP listener is opened. Client closure ends the process.

Input limits: 1 MiB transport buffer per incoming frame; report JSON string <=524,288 characters; at most 200 findings in a structured report; bounded string/array fields; at most 10 module selectors or 20 explicit source selectors per call; full source detail limited to 12 resulting sources. Invalid IDs fail closed. Guidance is addressed through enum/allowlist identifiers, not paths or URLs.

MCP offers no arbitrary filesystem, shell, network, upload, CMS or publishing tool. It does not fetch source URLs. CLI `validate` accepts a user-chosen local regular JSON file <=512 KiB; this local filename feature is not exposed through MCP. The process has whatever OS permissions the launching host grants, as other local software does; use a restricted host where appropriate.

No telemetry, credential store, API key, article storage, daemon, auto-update or startup installer is included. Errors from the protocol transport do not log supplied article/report content. MCP tool results go to the host, which may forward them to its AI provider. Host browsing has its own network and privacy implications.

Article text, citations and user-supplied reports are untrusted data. Successful tool calls do not grant permissions. The Skill explicitly rejects instructions embedded in source material and separates editorial, full-page and version-bound publication decisions.

## Dependencies and maintenance

Direct dependencies are exact versions in package.json; package-lock.json pins the dependency tree and integrity values. Use `npm ci --ignore-scripts`. No install lifecycle scripts are defined. This is a source distribution, so dependencies are installed from the standard npm registry on the user's machine.

When changing the guidance, preserve source evidence and dates, regenerate relevant hashes in PROVENANCE.json, review the diff, and run the parity, integrity, schema and MCP tests. Do not change `last_successful_read` solely because software was packaged or a request failed.
