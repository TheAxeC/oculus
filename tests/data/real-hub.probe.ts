// A read-only probe, not a test: no `.test.` in the name, so `npm test` never runs it.
// It points the two O2 sources at the hub loadLocal resolves and prints what they found, so the
// counts and the findings can be compared against the real tree. It opens files for reading only.
//
// Run it from tools/oculus with `node tests/data/real-hub.probe.ts`.

import { engineDir, loadLocal } from '../../src/lib/data/sources/config.ts';
import { readManifests } from '../../src/lib/data/sources/manifests.ts';
import { readRegistries } from '../../src/lib/data/sources/registries.ts';
import type { Finding, RegistryName, ScanRule } from '../../src/lib/data/model.ts';

// The five rules of the hub's layout config, by hand: O5 copies the config file itself.
const SCAN: ScanRule[] = [
  { dir: 'projects/ideas', type: 'idea' },
  { dir: 'projects/active', type: 'active' },
  { dir: 'projects/manuscripts', type: 'manuscript' },
  { dir: 'projects/coauthor', nested: true },
  { dir: 'projects/archive', nested: true }
];

const REGISTRIES: RegistryName[] = ['venues', 'datasets', 'programs', 'domains', 'funding'];

function report(label: string, findings: Finding[]): void {
  console.log(`${label} findings: ${findings.length}`);
  for (const f of findings) console.log(`  ${f.file} [${f.key}] ${f.message}`);
}

const hub = loadLocal(engineDir()).hub;
console.log(`hub: ${hub}`);

const { manifests, findings } = readManifests(hub, SCAN);
console.log(`manifests: ${manifests.length}`);
for (const rule of SCAN) {
  const tier = rule.dir.split('/').pop();
  console.log(`  ${tier}: ${manifests.filter((m) => m.tier === tier).length}`);
}
report('manifest', findings);

const registries = readRegistries(hub);
for (const name of REGISTRIES) {
  const reg = registries[name];
  console.log(`${name}: ${reg.entries.length} entries, meta keys ${Object.keys(reg.meta).join(', ')}`);
}
report('registry', registries.findings);
