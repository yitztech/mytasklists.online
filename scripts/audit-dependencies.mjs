import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

// Exact, expiring toolchain exceptions: upstream has no patched release (deepmerge as of 2026-10-27,
// low severity: only @expo/config 57 merges the project's own app config with it, never app input).
// They do not suppress new advisories, package changes or the backend dependency audit.
const accepted = new Map([
  ['GHSA-gcqx-w48m-w2h4', {name:'deepmerge', until:'2026-11-30'}],
]);
let failed=false;
for (const cwd of ['.', 'apps/mobile']) {
  const result=spawnSync('npm',['audit','--omit=dev','--json'],{cwd,encoding:'utf8'});
  let report; try {report=JSON.parse(result.stdout);} catch {throw new Error(`Auditoría no disponible: ${cwd}`);}
  if (report.error) throw new Error(`Auditoría no disponible: ${cwd}`);
  const advisories=Object.values(report.vulnerabilities ?? {}).flatMap(v=>v.via.filter(a=>typeof a==='object'));
  for (const advisory of advisories) {
    const id=advisory.url.split('/').pop(), exception=accepted.get(id);
    const allowed=cwd==='apps/mobile' && exception?.name===advisory.name && new Date() < new Date(exception.until+'T00:00:00Z');
    console.log(`${cwd}: ${id} ${advisory.name} — ${allowed?'excepción de herramientas hasta '+exception.until:'BLOQUEADO'}`);
    if (!allowed) failed=true;
  }
  if(cwd==='apps/mobile' && advisories.some(a=>a.name==='node-forge')) {
    // The direct distribution must not use unsigned/forge-managed OTA updates.
    const builder=fs.readFileSync('scripts/build-android-direct.mjs','utf8');
    const config=fs.readFileSync('apps/mobile/app.config.js','utf8');
    if(!builder.includes('MYTASKLISTS_LOCAL_RELEASE') || !/enabled\s*:\s*false/.test(config)) failed=true;
  }
}
if(failed) process.exitCode=1;
