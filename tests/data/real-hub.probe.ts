// A read-only probe, not a test: no `.test.` in the name, so `npm test` never runs it.
// It points the data sources at the hub loadLocal resolves and prints what they found, so the
// counts and the findings can be compared against the real tree. It opens files for reading only.
//
// Run it from tools/oculus with `node tests/data/real-hub.probe.ts`.

import { engineDir, loadConfig, loadLocal } from '../../src/lib/data/sources/config.ts';
import { readManifests } from '../../src/lib/data/sources/manifests.ts';
import { readRegistries } from '../../src/lib/data/sources/registries.ts';
import { readCollections } from '../../src/lib/data/sources/collections.ts';
import type { CollectionFile } from '../../src/lib/data/sources/collections.ts';
import { PROJECT_DOCS, projectDocs } from '../../src/lib/data/sources/docs.ts';
import type { Finding, RegistryName, ScanRule } from '../../src/lib/data/model.ts';
import { join } from 'node:path';

// The five rules of the hub's layout config, by hand: O5 copies the config file itself.
const SCAN: ScanRule[] = [
    { dir: 'projects/ideas', type: 'idea' },
    { dir: 'projects/active', type: 'active' },
    { dir: 'projects/manuscripts', type: 'manuscript' },
    { dir: 'projects/coauthor', nested: true },
    { dir: 'projects/archive', nested: true }
];

const REGISTRIES: RegistryName[] = ['venues', 'datasets', 'programs', 'domains', 'funding'];

// The eight entries of the layout config's `collections:` list, by hand for the same reason.
const COLLECTIONS: CollectionFile[] = [
    { key: 'statements', file: 'registries/boilerplate.yml' },
    { key: 'funding', file: 'funding/funding.yml' },
    { key: 'events', file: 'network/events.yml' },
    { key: 'education', file: 'education/education.yml' },
    { key: 'applications', file: 'applications/applications.yml' },
    { key: 'collaborations', file: 'network/collaborations.yml' },
    { key: 'tasks', file: 'tasks/tasks.yml' },
    { key: 'code', file: 'registries/repos.yml' }
];

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
    console.log(
        `${name}: ${reg.entries.length} entries, meta keys ${Object.keys(reg.meta).join(', ')}`
    );
}
report('registry', registries.findings);

const collections = readCollections(hub, COLLECTIONS);
console.log('collections:');
for (const asked of COLLECTIONS) {
    const coll = collections.collections[asked.key];
    console.log(
        `  ${asked.key}: ${coll.entries.length} entries, meta keys ${Object.keys(coll.meta).join(', ')}`
    );
}
report('collection', collections.findings);

// Document presence over every manifest's folder, counted per document name.
const counts = new Map<string, number>(PROJECT_DOCS.map((name) => [name, 0]));
for (const manifest of manifests) {
    for (const doc of projectDocs(join(hub, manifest.folder))) {
        if (doc.present) counts.set(doc.name, (counts.get(doc.name) ?? 0) + 1);
    }
}
console.log(`project documents, over ${manifests.length} project folders:`);
for (const name of PROJECT_DOCS) console.log(`  ${name}: ${counts.get(name)}`);

const config = loadConfig(engineDir());
console.log(`config keys: ${Object.keys(config.config).join(', ')}`);
report('config', config.findings);
