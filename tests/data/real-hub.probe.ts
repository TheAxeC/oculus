// A read-only probe, not a test: no `.test.` in the name, so `npm test` never runs it. It points
// the data sources at the hub two folders above oculus and prints what they found, so the counts
// and the findings can be compared against the real tree. It opens files for reading only.
//
// Run it from tools/oculus with `node tests/data/real-hub.probe.ts`.

import { engineDir, loadConfig, localDefaults } from '../../src/lib/data/sources/config.ts';
import { readManifests } from '../../src/lib/data/sources/manifests.ts';
import { readRegistries } from '../../src/lib/data/sources/registries.ts';
import { readCollections } from '../../src/lib/data/sources/collections.ts';
import { PROJECT_DOCS, projectDocs } from '../../src/lib/data/sources/docs.ts';
import { buildPortfolioWithSchemas, portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { ENTITY_KINDS } from '../../src/lib/data/snapshot/normalise.ts';
import { sessions } from '../../src/lib/server/sessions/index.ts';
import { sessionFolders } from '../../src/lib/server/sessions/folders.ts';
import { readState } from '../../src/lib/server/core/git/state.ts';
import type { Finding, RegistryName } from '../../src/lib/data/model/index.ts';
import { join, resolve } from 'node:path';
import { scratchDir, sweepScratch } from '../fixtures/scratch.ts';
import { TEXT } from '../server/text.ts';

const REGISTRIES: RegistryName[] = ['venues', 'datasets', 'pillars', 'domains', 'funding'];

function report(label: string, findings: Finding[]): void {
    console.log(`${label} findings: ${findings.length}`);
    for (const f of findings) console.log(`  ${f.file} [${f.key}] ${f.message}`);
}

const engine = engineDir();
const local = localDefaults();
const hub = resolve(engine, '..', '..');
console.log(`hub: ${hub}`);

// The hub's layout as the copied config/ describes it. Nothing is typed by hand here any more.
const config = loadConfig(engine, { hub });
const portfolio = portfolioConfigFrom(config.config);
const SCAN = portfolio.scan;
const COLLECTIONS = portfolio.collections;

const { manifests, findings } = readManifests(hub, SCAN, portfolio.text);
console.log(`manifests: ${manifests.length}`);
for (const rule of SCAN) {
    const tier = rule.dir.split('/').pop();
    console.log(`  ${tier}: ${manifests.filter((m) => m.tier === tier).length}`);
}
report('manifest', findings);

const registries = readRegistries(hub, portfolio.registries, portfolio.text);
for (const name of REGISTRIES) {
    const reg = registries[name];
    console.log(
        `${name}: ${reg.entries.length} entries, meta keys ${Object.keys(reg.meta).join(', ')}`
    );
}
report('registry', registries.findings);

const collections = readCollections(hub, COLLECTIONS, portfolio.text);
console.log('collections:');
for (const asked of COLLECTIONS) {
    const coll = collections.collections[asked.key];
    console.log(
        `  ${asked.key}: ${coll.entries.length} entries, meta keys ${Object.keys(coll.meta).join(', ')}`
    );
}
report('collection', collections.findings);

// Document presence over every manifest's folder, counted per document name.
const counts = new Map<string, number>(PROJECT_DOCS.map(({ name }) => [name, 0]));
for (const manifest of manifests) {
    for (const doc of projectDocs(join(hub, manifest.folder))) {
        if (doc.present) counts.set(doc.name, (counts.get(doc.name) ?? 0) + 1);
    }
}
console.log(`project documents, over ${manifests.length} project folders:`);
for (const { name } of PROJECT_DOCS) console.log(`  ${name}: ${counts.get(name)}`);

console.log(`config keys: ${Object.keys(config.config).join(', ')}`);
report('config', config.findings);

// The whole of layer 1: read, validate, normalise. Read only, like everything above it.
const snapshot = buildPortfolioWithSchemas(hub, portfolio).snapshot;
console.log(`snapshot version: ${snapshot.version}`);
console.log('entities:');
for (const [kind, entities] of Object.entries(snapshot.entities)) {
    if (!ENTITY_KINDS.includes(kind)) continue;
    console.log(`  ${kind}: ${Object.keys(entities as object).length}`);
}
console.log(`feeds: ${JSON.stringify(snapshot.entities.feeds)}`);
console.log(`career hosts: ${snapshot.entities.career?.hosts.length ?? 0}`);
console.log('relations:');
for (const [name, table] of Object.entries(snapshot.relations)) {
    console.log(`  ${name}: ${table.length}`);
}
report('snapshot', snapshot.findings);

// The session stores, read only. The cache and the overrides live in a temporary directory, never
// in ~/.oculus: a probe measures what a scan costs and leaves no state of its own behind. This file
// has no runner and no hook, so it sweeps its own directory when the run ends, however it ends.
process.on('exit', sweepScratch);
const scratch = scratchDir('oculus-probe-');
const options = {
    ...sessionFolders(local.accounts),
    hub,
    snapshot,
    cachePath: join(scratch, 'transcript-cache.json'),
    overridesPath: join(scratch, 'sessions.json')
};
const cold = Date.now();
const first = sessions(options);
const coldMs = Date.now() - cold;
const warm = Date.now();
const second = sessions(options);
const warmMs = Date.now() - warm;

const count = (tool: string): number => first.records.filter((r) => r.tool === tool).length;
const live = first.records.filter((record) => record.live).length;
console.log(
    `sessions: ${first.records.length} records (claude ${count('claude')}, codex ${count('codex')}), ` +
        `${live} live, ${first.workspaces.length} workspaces, ${coldMs} ms cold, ${warmMs} ms warm`
);
console.log(`sessions warm read: ${second.records.length} records, cache at ${options.cachePath}`);
for (const workspace of first.workspaces) {
    const areas = workspace.areas.map((area) => `${area.short} ${area.sessions.length}`).join(', ');
    console.log(`  ${workspace.name || '(unknown)'}: ${areas}`);
}

// The hub's own git state, through server/core/git/state.ts's four read-only commands and nothing
// else. It reads the repository and changes nothing in it, like everything else in this file.
const state = (await readState(hub, TEXT)).state;
console.log(
    `git ${hub}: branch ${state.branch || '(none)'}, ahead ${state.ahead}, behind ${state.behind}, ` +
        `staged ${state.staged.length}, unstaged ${state.unstaged.length}, ` +
        `untracked ${state.untracked.length}, error ${state.error ?? 'none'}`
);
