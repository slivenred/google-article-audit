import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('oversized wire frame closes promptly without logging input', {timeout:10000}, async t => {
  const child=spawn(process.execPath,[fileURLToPath(new URL('../src/server.js',import.meta.url))],{stdio:['pipe','pipe','pipe']});
  t.after(()=>{if(child.exitCode===null)child.kill();});
  let stdout='',stderr='';
  child.stderr.on('data',data=>{stderr+=data;});
  child.stdin.on('error',()=>{}); // The expected rejection may race an outstanding pipe write.
  const firstResponse=new Promise(resolve=>child.stdout.on('data',data=>{stdout+=data;if(stdout.includes('\n'))resolve();}));
  const exited=new Promise(resolve=>child.on('close',(code,signal)=>resolve({code,signal})));
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'size-test',version:'1'}}})+'\n');
  await firstResponse;
  assert.equal(JSON.parse(stdout.trim()).id,1);
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'validate_report_structure',arguments:{report_json:'PRIVATE_MARKER_'+ 'x'.repeat(1100000)}}})+'\n');
  const exit=await exited;
  assert.equal(exit.code,1);
  assert.match(stderr,/MCP transport error/);
  assert.doesNotMatch(stdout+stderr,/PRIVATE_MARKER/);
});
