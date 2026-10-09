#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import { overview, selectGuidance, readGuidance, bundleIntegrity } from './catalog.js';
import { prepareAudit } from './workflow.js';
import { reportJsonSchema, validateReport } from './report.js';

const help = `Google Article Audit: read-only guidance CLI (not an AI auditor)
  node src/cli.js overview
  node src/cli.js guidance core [start_line] [max_lines]
  node src/cli.js select --module core --module reviews [--full]
  node src/cli.js select --check MET-02 --source SRC-003
  node src/cli.js prepare [audit-only|audit+optimize]
  node src/cli.js schema
  node src/cli.js validate path/to/report.json
  node src/cli.js check-bundle

Selection and guidance access need no API key or network. Validation checks only
structure and declared-state consistency. The host AI must reason, verify evidence,
and write the audit. No automatic fact checking or Google score is produced.`;

try {
  const [command, ...args] = process.argv.slice(2);
  let result;
  switch (command) {
    case undefined: case 'help': case '--help': console.log(help); process.exit(0);
    case 'overview': result = overview(); break;
    case 'guidance': {
      const [document, line = '1', count = '200'] = args;
      const start_line = Number(line), max_lines = Number(count);
      if (!Number.isSafeInteger(start_line) || start_line < 1 || !Number.isSafeInteger(max_lines) || max_lines < 1 || max_lines > 300) throw new Error('Use positive line numbers and max_lines <= 300');
      result = readGuidance({document, start_line, max_lines}); break;
    }
    case 'select': {
      const query = {modules: [], checks: [], sources: [], summary: true};
      const names = {'--module': 'modules', '--check': 'checks', '--source': 'sources'};
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--full') {query.summary = false; continue;}
        if (!Object.hasOwn(names, args[i]) || !args[i+1]) throw new Error('Invalid select option; use --help');
        query[names[args[i]]].push(args[++i]);
      }
      if (args.length > 160) throw new Error('Too many selection arguments');
      result = selectGuidance(query); break;
    }
    case 'prepare':
      if (args[0] && !['audit-only','audit+optimize'].includes(args[0])) throw new Error('Unknown audit mode');
      result = prepareAudit({mode: args[0] ?? 'audit-only'}); break;
    case 'schema': result = reportJsonSchema; break;
    case 'validate': {
      if (args.length !== 1) throw new Error('Provide exactly one local report JSON filename');
      if (!statSync(args[0]).isFile() || statSync(args[0]).size > 524288) throw new Error('Report must be a regular file <= 512 KiB');
      result = validateReport(JSON.parse(readFileSync(args[0], 'utf8')));
      if (!result.structurally_valid) process.exitCode = 1;
      break;
    }
    case 'check-bundle': result = bundleIntegrity(); if (!result.ok) process.exitCode = 1; break;
    default: throw new Error('Unknown command; use --help');
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
