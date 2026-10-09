import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const serverPath = process.env.AUDIT_SMOKE_SERVER ?? fileURLToPath(new URL('../src/server.js', import.meta.url));
const sample = readFileSync(new URL('../examples/report.synthetic.json', import.meta.url), 'utf8');
const decode = result => result.structuredContent ?? JSON.parse(result.content[0].text);
for (const mode of ['legacy', 'auto']) {
  const client = new Client({name: 'google-article-audit-smoke', version: '1.0.0'}, {versionNegotiation: {mode, probe: {timeoutMs: 5000}}});
  const transport = new StdioClientTransport({command: process.execPath, args: [serverPath], cwd: '/tmp', stderr: 'pipe'});
  try {
    await client.connect(transport);
    const {tools} = await client.listTools();
    assert.equal(tools.length, 6);
    const overview = await client.callTool({name: 'audit_overview', arguments: {}});
    assert.equal(decode(overview).source_count, 117);
    const prepared = await client.callTool({name: 'prepare_audit', arguments: {mode: 'audit-only'}});
    assert.match(decode(prepared).instructions, /UNKNOWN/);
    const selected = await client.callTool({name: 'select_guidance', arguments: {modules: ['reviews']}});
    assert.ok(decode(selected).checks.some(c => c.id === 'REV-01'));
    const invalid = await client.callTool({name: 'select_guidance', arguments: {modules: ['../../etc/passwd']}});
    assert.equal(invalid.isError, true);
    const unknown = await client.callTool({name: 'read_guidance', arguments: {document: '../../etc/passwd'}});
    assert.equal(unknown.isError, true);
    const validated = await client.callTool({name: 'validate_report_structure', arguments: {report_json: sample}});
    assert.equal(decode(validated).structurally_valid, true);
    assert.match(decode(validated).disclaimer, /cannot verify facts/);
    const {resources} = await client.listResources();
    assert.equal(resources.length, 7);
    const core = await client.readResource({uri: 'audit://guidance/core'});
    assert.ok(core.contents[0].text.length > 100);
    const {prompts} = await client.listPrompts();
    assert.equal(prompts[0].name, 'audit_article');
    const prompt = await client.getPrompt({name: 'audit_article', arguments: {mode: 'audit+optimize'}});
    assert.match(prompt.messages[0].content.text, /audit\+optimize/);
    console.log(`PASS ${mode}: connect, tools/list, 7 calls including negative cases, resources/list+read, prompts/list+get`);
  } finally {await client.close();}
}
