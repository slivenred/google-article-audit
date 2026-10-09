# Google Article Audit Portable

One canonical guidance bundle, exposed as an Agent Skill, a local read-only MCP server, and a CLI. Unofficial; not affiliated with Google.

**Start with the Skill** for editorial work in local Codex, Claude Code or Cursor. Use MCP when your client needs callable guidance and optional report-structure validation. The host AI does the semantic audit and evidence research; this package is not an automated fact checker.

## Get the package

Download and extract this repository's ZIP, or clone it:

```sh
git clone https://github.com/slivenred/google-article-audit.git
cd google-article-audit
```

Run the following commands from the repository root. Keep this directory at a stable location if using MCP.

## Skill-only

Copy the complete `skills/google-article-audit` directory, without overwriting an existing installation:

- Codex / Cursor: `~/.agents/skills/google-article-audit`, or project `.agents/skills/google-article-audit`
- Claude Code: `~/.claude/skills/google-article-audit`, or project `.claude/skills/google-article-audit`

Keep only one active same-name copy per client. Refresh discovery or open a new session if needed. Local installation does not configure hosted/web clients. No Node.js or API key is needed for reading Skill instructions; its optional selection helper uses Python 3 stdlib.

Prompt: `Use $google-article-audit to audit this draft. Give evidence-backed findings and minimal proposed fixes. Preserve UNKNOWN for missing evidence. Do not rewrite unless I ask. [article]`

## Optional MCP

Requires Node >=20 and npm; tested on Node 24.19.0. From this repository:

```sh
npm ci --ignore-scripts
npm run check
npm run smoke
codex mcp add google-article-audit -- "$(node -p 'process.execPath')" "$PWD/src/server.js"
```

The last command changes your local Codex configuration when you run it. No client configuration is changed by installing dependencies or running tests. For Claude Code:

```sh
claude mcp add --transport stdio --scope user google-article-audit -- "$(node -p 'process.execPath')" "$PWD/src/server.js"
```

See [client examples](examples/clients/) for Cursor and manual configuration. Replace all placeholders with absolute paths and merge into existing configuration; do not replace whole files. Use forward slashes or escaped backslashes in Windows JSON.

Ask your host AI: `Use the google-article-audit MCP. Call prepare_audit, load only triggered guidance modules, verify the supplied article's important claims, and deliver an audit in my language. Tool success is not audit completion. [article]`

Six ordinary tools work even in clients without resource/prompt support:

1. `audit_overview`: snapshot counts, module triggers and guidance documents
2. `prepare_audit`: canonical workflow, evidence rules, decisions and core guidance
3. `read_guidance`: allowlisted documents with line pagination
4. `select_guidance`: sources/checks for explicit IDs or modules
5. `get_report_schema`: optional local JSON report convention
6. `validate_report_structure`: shape and declared-state consistency only

The `audit_article` prompt and seven static resources are optional conveniences. All semantic decisions, browsing and revisions take place in the host client using its authorized tools. If evidence is unavailable, report it as UNKNOWN. Audit completion never authorizes publication.

## CLI and tests

```sh
node src/cli.js overview
node src/cli.js select --module reviews
node src/cli.js validate examples/report.synthetic.json
npm test
```

`npm test` additionally needs Python 3 for one parity test against the original Skill helper. `npm run smoke` tests legacy and modern MCP connections, tool calls, resources and prompts, then closes each subprocess. No GUI host integration is claimed. See [verification](docs/verification.md).

The bundle preserves 117 source records (110 current-recommended, 7 historical), 44 internal checks, and 32 conditional modules. Snapshot date: 2026-10-08. Cached reads are not fresh verification; source dates and statuses must not be silently refreshed.

No API key, telemetry, HTTP listener, arbitrary file/network tool, background daemon, or auto-update is included. The host AI provider can still receive article content and tool outputs. Local MCP is not a promise of offline or private model inference.

The Skill is the single source of truth. See [architecture](docs/architecture.md), [provenance](PROVENANCE.json) and [notice](NOTICE.md). Original code and owner-authored audit instructions are licensed under [MIT](LICENSE), Copyright (c) 2026 Sliven Red. Google documentation and other third-party materials retain their original rights. `private: true` only prevents accidental npm publication; it does not restrict the MIT license or public repository.

Official setup references checked 2026-10-08: [Codex Skills](https://learn.chatgpt.com/docs/build-skills), [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Claude Skills](https://code.claude.com/docs/en/skills), [Claude MCP](https://code.claude.com/docs/en/mcp), [Cursor Skills](https://cursor.com/docs/skills), [Cursor MCP](https://cursor.com/docs/mcp), [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk).
