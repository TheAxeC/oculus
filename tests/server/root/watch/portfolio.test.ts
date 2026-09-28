// The portfolio and feed watcher against a synthetic hub and engine in temporary directories.
// Nothing outside them is read or written, every write asserts its path is inside first, and every
// watcher is closed when the test ends.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { handleWrite } from '../../../../src/lib/server/edit/writes.ts';
import { handleSource } from '../../../../src/lib/server/files/source.ts';
import { mintToken } from '../../../../src/lib/server/core/auth.ts';
import { ENGINE_ROOT, engineRoot } from '../../../../src/lib/server/files/files.ts';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { engineDir, loadConfig, type IconMemory } from '../../../../src/lib/data/sources/config.ts';
import {
    namedByConfig,
    relevant,
    watchPortfolio,
    watchedDirectories
} from '../../../../src/lib/server/root/watch/portfolio.ts';
import type { Watcher } from '../../../../src/lib/server/root/watch/portfolio.ts';
import type {
    AuditPayload,
    ConfigPayload,
    FeedsPayload,
    Message,
    Snapshot
} from '../../../../src/lib/data/model/index.ts';
import { recording } from './probe.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';
import { careerRules } from '../../../../src/lib/server/edit/writes/subtasks.ts';

afterAll(sweepScratch);

const LAYOUT = [
    'scan:',
    '  - { dir: projects/ideas, type: idea }',
    '  - { dir: projects/active, type: active }',
    '  - { dir: projects/manuscripts, type: manuscript }',
    '  - { dir: projects/coauthor, nested: true }',
    '  - { dir: projects/archive, nested: true }',
    'venues_file: registries/venues.yml',
    'datasets_file: registries/data.yml',
    'pillars_file: registries/pillars.yml',
    'domains_file: registries/domains.yml',
    'collections:',
    '  - { key: funding, file: funding/funding.yml }',
    '  - { key: events, file: network/events.yml }',
    'linkedin_cadence_days: 30',
    ''
].join('\n');

const VOCAB = ['type_color:', '  idea: teal', '  active: blue', '  manuscript: amber', ''].join(
    '\n'
);

const SCHEMA = [
    'manifest_schema:',
    '  fields:',
    '    id: { label: "id" }',
    '    type: { label: "Type" }',
    '    title: { label: "Title" }',
    ''
].join('\n');

const TEXT = ['text:', '  app:', '    title: "oculus"', ''].join('\n');

/** The keys of behavior.yml a config draws no finding of its own without. */
const BEHAVIOR = ['editor:', '  paint_limit_kb: 64', ''].join('\n');

const MANIFEST = 'id: loewner\ntype: active\ntitle: Loewner layers\n';

const watchers: Watcher[] = [];

/** The machine a watcher under test is told it runs on. */
const HOST = { name: 'test-machine', address: 'http://127.0.0.1:8799' };

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

function scratch(name: string): string {
    const dir = scratchDir(`oculus-${name}-`);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

function write(root: string, rel: string, body: string): void {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/** An engine directory holding the four config files the build reads. */
function buildEngine(): string {
    const engine = scratch('engine');
    // The block the source editor's cap lives in: a config without it is a finding of its own, and
    // what these cases are about is the findings the hub and the icon map produce.
    write(engine, 'config/behavior.yml', BEHAVIOR);
    write(engine, 'config/layout.yml', LAYOUT);
    write(engine, 'config/catalogs/vocab.yml', VOCAB);
    write(engine, 'config/catalogs/manifest-schema.yml', SCHEMA);
    write(engine, 'config/text.yml', TEXT);
    // The audit's words and the data layer's finding sentences are the engine's own catalog files,
    // so the scan and the build the watcher runs have the messages they write their findings in
    // rather than a copy of them typed into this file.
    mkdirSync(join(engine, 'config', 'text', 'views', 'system'), { recursive: true });
    for (const name of ['views/system/audit.yml', 'findings.yml']) {
        cpSync(join(engineDir(), 'config', 'text', name), join(engine, 'config', 'text', name));
    }
    return engine;
}

/** A hub with the five tiers, one project, the five registries and one collection. */
function buildHub(): string {
    const hub = scratch('hub');
    for (const tier of ['ideas', 'active', 'manuscripts', 'coauthor', 'archive']) {
        mkdirSync(join(hub, 'projects', tier), { recursive: true });
    }
    write(hub, 'projects/active/loewner/project.yml', MANIFEST);
    write(hub, 'registries/venues.yml', 'entries: []\n');
    write(hub, 'registries/data.yml', 'datasets: []\n');
    write(hub, 'registries/pillars.yml', 'entries: []\n');
    write(hub, 'registries/domains.yml', 'entries: []\n');
    write(hub, 'funding/funding.yml', 'entries: []\n');
    write(hub, 'network/events.yml', 'title: Talks\nentries: []\n');
    write(hub, 'feeds/position-leads.yml', 'meta: {}\nentries: []\n');
    write(hub, 'feeds/literature-radar.yml', 'meta: {}\nentries: []\n');
    write(
        hub,
        'theaxec.github.io/_linkedin/01-start.md',
        '---\ntitle: "Start"\ndate: 2026-09-01\n---\n\nFirst post.\n'
    );
    return hub;
}

/** The messages of one channel, newest last. */
function on(got: Message[], channel: string): Message[] {
    return got.filter((message) => message.channel === channel);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll until the predicate holds or the time runs out; the caller asserts what it wanted. */
async function until(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(20);
}

/**
 * Wait until the messages stop arriving. The first fs.watch of a process on darwin can deliver an
 * event for a write that happened shortly before the watch was opened, which is the fixture's own
 * writes here; the watcher then rebuilds once more with the same result. Measured with three
 * watchers in one process: the first saw the extra rebuild, the second and third did not. So a test
 * that counts rebuilds counts them from a quiet point, never from the start.
 */
async function quiet(got: Message[], ms = 100): Promise<number> {
    let held = -1;
    while (held !== got.length) {
        held = got.length;
        await sleep(ms);
    }
    return held;
}

/** A started watcher over a fresh hub and engine, subscribed before the starting publications. */
function start(
    prepare?: (hub: string, engine: string) => void,
    icons: IconMemory = { set: {} }
): {
    hub: string;
    engine: string;
    got: Message[];
    icons: IconMemory;
} {
    const hub = buildHub();
    const engine = buildEngine();
    prepare?.(hub, engine);
    const channels = new Hub();
    const client = recording();
    channels.subscribe(client.sink, ['portfolio', 'config', 'feeds', 'audit']);
    watchers.push(watchPortfolio(channels, { hub, engine, icons, host: HOST }, { debounce: 20 }));
    return { hub, engine, got: client.got, icons };
}

describe('relevant', () => {
    it('takes a yaml file outside every code and attic folder', () => {
        expect(relevant('active/loewner/project.yml')).toBe(true);
        expect(relevant('venues.yml')).toBe(true);
        expect(relevant('active/loewner/code/results.yml')).toBe(false);
        expect(relevant('archive/nogo/thing/attic/old.yml')).toBe(false);
        expect(relevant('active/loewner/.project.yml.swp')).toBe(false);
        expect(relevant(null)).toBe(false);
    });

    it('takes the documents and folders the audit scan reads off the disk', () => {
        expect(relevant('active/loewner/README.md')).toBe(true);
        expect(relevant('active/loewner/PRESENT.md')).toBe(true);
        expect(relevant('active/loewner/DATA.md')).toBe(true);
        expect(relevant('active/loewner/IDEA.md')).toBe(true);
        expect(relevant('active/loewner/notes/METHOD_NOTES.md')).toBe(true);
        expect(relevant('active/loewner/paper')).toBe(true);
        expect(relevant('active/loewner/paper/main.tex')).toBe(true);
    });

    it('takes the deposit README and nothing else out of a code folder', () => {
        expect(relevant('active/loewner/code/README.md')).toBe(true);
        expect(relevant('active/loewner/code/train.py')).toBe(false);
        expect(relevant('active/loewner/code/notes/README.md')).toBe(false);
        expect(relevant('active/loewner/attic/README.md')).toBe(false);
    });

    it('leaves a document the audit does not read alone', () => {
        expect(relevant('active/loewner/NOTES.md')).toBe(false);
        expect(relevant('active/loewner/manuscript/main.tex')).toBe(false);
    });

    it('takes a PRESENT.md, whose front matter is in the snapshot, and no other markdown', () => {
        expect(relevant('active/loewner/PRESENT.md')).toBe(true);
        expect(relevant('active/loewner/code/PRESENT.md')).toBe(false);
        expect(relevant('active/loewner/present.md')).toBe(false);
        expect(relevant('active/loewner/NOTES.md')).toBe(false);
    });
});

describe('namedByConfig', () => {
    const config = {
        scan: [{ dir: 'projects/active' }],
        feeds: {
            leads: 'feeds/position-leads.yml',
            radar: 'feeds/literature-radar.yml',
            linkedin: 'site/_linkedin'
        },
        linkedinCadenceDays: 30,
        career: 'registries/career.yml',
        registries: {
            venues: 'registries/venues.yml',
            datasets: 'registries/data.yml',
            pillars: 'registries/pillars.yml',
            domains: 'registries/domains.yml',
            funding: 'funding/funding.yml',
            people: 'registries/people.yml',
            organisations: 'registries/organisations.yml'
        },
        collections: [{ key: 'events', file: 'network/events.yml' }],
        schema: undefined,
        vocab: { types: [], statuses: [] },
        deck: undefined,
        deckFile: '/hub/config/present.yml',
        text: {}
    };

    it('names a manifest, a PRESENT.md and what the audit reads under a scan tier', () => {
        const named = namedByConfig('/hub', config);
        expect(named(join('/hub', 'projects/active/loewner/project.yml'))).toBe(true);
        expect(named(join('/hub', 'projects/active/loewner/PRESENT.md'))).toBe(true);
        expect(named(join('/hub', 'projects/ideas/other/PRESENT.md'))).toBe(false);
        expect(named(join('/hub', 'projects/active/loewner/README.md'))).toBe(true);
        expect(named(join('/hub', 'projects/active/loewner/code/README.md'))).toBe(true);
        expect(named(join('/hub', 'projects/active/loewner/paper'))).toBe(true);
        expect(named(join('/hub', 'registries/venues.yml'))).toBe(true);
    });

    it('names no document of the hub above a tier, and none the audit does not read', () => {
        const named = namedByConfig('/hub', config);
        expect(named(join('/hub', 'README.md'))).toBe(false);
        expect(named(join('/hub', 'projects/ideas/other/README.md'))).toBe(false);
        expect(named(join('/hub', 'projects/active/loewner/NOTES.md'))).toBe(false);
    });

    it('rebuilds on a PRESENT.md under a tier and on none under a project code folder', () => {
        // The pair the watcher applies: the filename filter, then the file the build reads.
        const named = namedByConfig('/hub', config);
        const accepts = (rel: string): boolean =>
            relevant(rel) && named(join('/hub', 'projects/active', rel));
        expect(accepts('loewner/PRESENT.md')).toBe(true);
        expect(accepts('loewner/code/PRESENT.md')).toBe(false);
        expect(accepts('loewner/attic/PRESENT.md')).toBe(false);
    });
});

describe('watchedDirectories', () => {
    it('names every scan tier and the folder of every registry, collection and feed file', () => {
        const dirs = watchedDirectories('/hub', {
            scan: [{ dir: 'projects/active' }],
            feeds: {
                leads: 'feeds/position-leads.yml',
                radar: 'feeds/literature-radar.yml',
                linkedin: 'theaxec.github.io/_linkedin'
            },
            linkedinCadenceDays: 30,
            career: 'registries/career.yml',
            registries: {
                venues: 'registries/venues.yml',
                datasets: 'registries/data.yml',
                pillars: 'registries/pillars.yml',
                domains: 'registries/domains.yml',
                funding: 'funding/funding.yml',
                people: 'registries/people.yml',
                organisations: 'registries/organisations.yml'
            },
            collections: [{ key: 'events', file: 'network/events.yml' }],
            schema: undefined,
            vocab: { types: [], statuses: [] },
            deck: undefined,
            deckFile: '/hub/config/present.yml',
            text: {}
        });
        expect(dirs.sort()).toEqual([
            join('/hub', 'feeds'),
            join('/hub', 'funding'),
            join('/hub', 'network'),
            join('/hub', 'projects/active'),
            join('/hub', 'registries'),
            join('/hub', 'theaxec.github.io/_linkedin')
        ]);
    });
});

describe('watchPortfolio', () => {
    it('opens a LinkedIn folder created after the start and publishes its posts', async () => {
        const folder = 'later/linkedin';
        const started = start((_hub, engine) => {
            write(engine, 'config/sources.yml', `linkedin_dir: ${folder}\n`);
        });
        await quiet(started.got);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).linkedin.missing).toBe(
            true
        );
        const before = on(started.got, 'feeds').length;
        // Creating the folder is the only change: the flat watch on its parent sees it appear.
        write(started.hub, `${folder}/01-new.md`, '---\ntitle: New\n---\n');
        await until(() => on(started.got, 'feeds').length > before, 3000);
        expect(
            (on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).linkedin.entries[0]?.title
        ).toBe('New');

        await quiet(started.got);
        const opened = on(started.got, 'feeds').length;
        write(started.hub, `${folder}/01-new.md`, '---\ntitle: Edited\n---\n');
        await until(() => on(started.got, 'feeds').length > opened, 2000);
        expect(
            (on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).linkedin.entries[0]?.title
        ).toBe('Edited');
    });

    it('publishes YAML and Markdown changes from a shared feed directory', async () => {
        const started = start((hub, engine) => {
            write(engine, 'config/sources.yml', 'linkedin_dir: feeds\n');
            write(hub, 'feeds/01-shared.md', '---\ntitle: Shared\n---\n');
        });
        await quiet(started.got);
        const before = on(started.got, 'feeds').length;
        write(
            started.hub,
            'feeds/literature-radar.yml',
            'meta: {}\nentries:\n  - { title: shared, bucket: method }\n'
        );
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).radar.entries).toEqual([
            { title: 'shared', bucket: 'method' }
        ]);

        await quiet(started.got);
        const yamlSeen = on(started.got, 'feeds').length;
        write(started.hub, 'feeds/01-shared.md', '---\ntitle: Edited\n---\n');
        await until(() => on(started.got, 'feeds').length > yamlSeen, 2000);
        expect(
            (on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).linkedin.entries[0]?.title
        ).toBe('Edited');
    });

    it('publishes a LinkedIn post with an uppercase Markdown suffix', async () => {
        const started = start();
        await quiet(started.got);
        const before = on(started.got, 'feeds').length;
        write(
            started.hub,
            'theaxec.github.io/_linkedin/02-upper.MD',
            '---\ntitle: Uppercase\n---\n'
        );
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect(
            (on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).linkedin.entries
        ).toContainEqual(expect.objectContaining({ file: '02-upper.MD', title: 'Uppercase' }));
    });

    it('ignores nested LinkedIn Markdown while still publishing flat changes', async () => {
        const started = start((hub) => {
            write(
                hub,
                'theaxec.github.io/_linkedin/nested/01-child.md',
                '---\ntitle: Child\n---\n'
            );
        });
        await quiet(started.got);
        const before = started.got.length;
        write(
            started.hub,
            'theaxec.github.io/_linkedin/nested/01-child.md',
            '---\ntitle: Nested edit\n---\n'
        );
        await sleep(150);
        expect(started.got).toHaveLength(before);

        const feedsBefore = on(started.got, 'feeds').length;
        write(
            started.hub,
            'theaxec.github.io/_linkedin/01-start.md',
            '---\ntitle: Flat edit\n---\n'
        );
        await until(() => on(started.got, 'feeds').length > feedsBefore, 2000);
        expect(
            (on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).linkedin.entries[0]?.title
        ).toBe('Flat edit');
    });

    it('delivers a feed field written through handleWrite in a feeds message', async () => {
        const started = start((hub) => {
            write(
                hub,
                'feeds/literature-radar.yml',
                'meta: {}\nentries:\n  - title: Paper\n    bucket: method\n'
            );
        });
        await quiet(started.got);
        const before = on(started.got, 'feeds').length;
        const config = portfolioConfigFrom(loadConfig(started.engine).config, started.engine);
        expect(
            resolve(join(started.hub, config.feeds.radar)).startsWith(resolve(started.hub) + sep)
        ).toBe(true);
        const token = mintToken();
        const response = await handleWrite(
            new Request('http://localhost/api/write', {
                method: 'POST',
                headers: {
                    host: 'localhost',
                    origin: 'http://localhost',
                    'content-type': 'application/json',
                    'x-oculus-token': token
                },
                body: JSON.stringify({
                    kind: 'feed-field',
                    feed: 'radar',
                    id: 'Paper',
                    field: 'dismissed',
                    value: true
                })
            }),
            token,
            {
                hub: started.hub,
                config,
                engine: started.engine,
                career: careerRules(loadConfig(started.engine).config),
                projects: () => [],
                bookmarks: join(started.hub, 'bookmarks.yml'),
                behaviorFile: join(started.engine, 'config', 'behavior.yml'),
                layoutFile: join(started.engine, 'config', 'layout.yml'),
                glyphs: []
            }
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
            ok: true,
            changed: ['dismissed'],
            refused: []
        });
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).radar.entries).toEqual([
            { title: 'Paper', bucket: 'method', dismissed: true }
        ]);
    });

    it('republishes a whole feed file saved through handleSource on the feeds channel', async () => {
        const started = start();
        await quiet(started.got);
        const before = on(started.got, 'feeds').length;
        const config = portfolioConfigFrom(loadConfig(started.engine).config, started.engine);
        const path = config.feeds.radar;
        expect(resolve(join(started.hub, path)).startsWith(resolve(started.hub) + sep)).toBe(true);
        const token = mintToken();
        const response = await handleSource(
            new Request('http://localhost/api/source', {
                method: 'POST',
                headers: {
                    host: 'localhost',
                    origin: 'http://localhost',
                    'content-type': 'application/json',
                    'x-oculus-token': token
                },
                body: JSON.stringify({
                    root: 'fixture',
                    path,
                    content:
                        'meta: {}\nentries:\n  - title: Source paper\n    bucket: method\n    dismissed: true\n'
                })
            }),
            token,
            [{ key: 'fixture', dir: started.hub }]
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).radar.entries).toEqual([
            { title: 'Source paper', bucket: 'method', dismissed: true }
        ]);
    });

    it('publishes portfolio, config, and feeds at start, each at version 1', async () => {
        const started = start();
        await until(() => started.got.length >= 3, 2000);

        const portfolio = on(started.got, 'portfolio');
        const config = on(started.got, 'config');
        const feeds = on(started.got, 'feeds');
        expect(portfolio[0].version).toBe(1);
        expect(config[0].version).toBe(1);
        expect(feeds[0].version).toBe(1);

        const snapshot = portfolio[0].payload as Snapshot;
        expect(snapshot.version).toBe(1);
        expect(snapshot.entities.projects.loewner.title).toBe('Loewner layers');

        const payload = config[0].payload as ConfigPayload;
        expect(payload.text['app.title']).toBe('oculus');
        expect(payload.host).toEqual(HOST);
        expect(payload.findings).toEqual([]);
        expect(payload.config.venues_file).toBe('registries/venues.yml');
        expect((feeds[0].payload as FeedsPayload).linkedin.entries[0].title).toBe('Start');
    });

    it('publishes the audit scan beside the portfolio, with the mute list of the config', async () => {
        const started = start((hub, engine) => {
            write(hub, 'projects/active/loewner/README.md', '# Loewner\n\nTODO: the method\n');
            write(engine, 'config/behavior.yml', `audit_ignore: []\n${BEHAVIOR}`);
        });
        await until(() => on(started.got, 'audit').length > 0, 3000);

        const audit = on(started.got, 'audit').at(-1)?.payload as AuditPayload;
        expect(audit.muted).toEqual([]);
        const marker = audit.findings.find((one) => one.kind === 'todo');
        expect(marker?.scope).toBe(join('projects', 'active', 'loewner'));
        expect(marker?.where).toBe('README.md');
        expect(marker?.message).toBe('1 open marker(s), the first "TODO: the method"');
        expect(marker?.signature).toMatch(/^[0-9a-f]{12}$/);
    });

    it('publishes the audit again when a marker is written into a project README', async () => {
        const started = start((_hub, engine) => {
            write(engine, 'config/behavior.yml', `audit_ignore: []\n${BEHAVIOR}`);
        });
        await until(() => on(started.got, 'audit').length > 0, 3000);
        await quiet(started.got);
        const before = on(started.got, 'audit').length;
        expect(
            (on(started.got, 'audit').at(-1)?.payload as AuditPayload).findings.filter(
                (one) => one.kind === 'todo'
            )
        ).toEqual([]);

        // A README is not a `.yml` and not PRESENT.md, so this is the audit's own reason to
        // rebuild.
        write(started.hub, 'projects/active/loewner/README.md', '# Loewner\n\nTODO: the method\n');
        await until(() => on(started.got, 'audit').length > before, 3000);

        const marker = (on(started.got, 'audit').at(-1)?.payload as AuditPayload).findings.find(
            (one) => one.kind === 'todo'
        );
        expect(marker?.where).toBe('README.md');
        expect(marker?.message).toBe('1 open marker(s), the first "TODO: the method"');
    });

    it('publishes the audit again after a mute write, with the signature parked', async () => {
        const started = start((hub, engine) => {
            write(hub, 'projects/active/loewner/README.md', '# Loewner\n\nTODO: the method\n');
            write(engine, 'config/behavior.yml', `audit_ignore: []\n${BEHAVIOR}`);
        });
        await until(() => on(started.got, 'audit').length > 0, 3000);
        const first = on(started.got, 'audit').at(-1)?.payload as AuditPayload;
        const signature = first.findings[0].signature;
        await quiet(started.got);
        const before = on(started.got, 'audit').length;

        const token = mintToken();
        const config = portfolioConfigFrom(loadConfig(started.engine).config, started.engine);
        const response = await handleWrite(
            new Request('http://127.0.0.1:8790/api/write', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'sec-fetch-site': 'same-origin',
                    'x-oculus-token': token
                },
                body: JSON.stringify({ kind: 'audit-mute', signature, muted: true })
            }),
            token,
            {
                hub: started.hub,
                config,
                engine: started.engine,
                career: careerRules(loadConfig(started.engine).config),
                projects: () => [],
                bookmarks: join(started.hub, 'bookmarks.yml'),
                behaviorFile: join(started.engine, 'config', 'behavior.yml'),
                layoutFile: join(started.engine, 'config', 'layout.yml'),
                glyphs: []
            }
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['audit_ignore'],
            refused: []
        });

        await until(() => on(started.got, 'audit').length > before, 3000);
        const after = on(started.got, 'audit').at(-1)?.payload as AuditPayload;
        expect(after.muted).toEqual([signature]);
    });

    it('reports a configured document with no file at its path, and none for one that is there', async () => {
        const started = start((hub, engine) => {
            write(hub, 'THERE.md', '# There\n');
            write(
                engine,
                'config/layout.yml',
                [
                    LAYOUT,
                    'docs:',
                    '  - { label: There, path: THERE.md, group: personal }',
                    '  - { label: Gone, path: GONE.md, group: personal }',
                    ''
                ].join('\n')
            );
        });
        await until(() => on(started.got, 'config').length >= 1, 2000);

        const payload = on(started.got, 'config')[0].payload as ConfigPayload;
        expect(payload.findings.map((finding) => finding.key)).toEqual(['Gone']);
        expect(payload.findings[0].message).toContain('GONE.md; this document draws nothing');
        expect(payload.findings[0].file).toBe(join(started.engine, 'config', 'layout.yml'));
    });

    it('reports a rail button naming a page no arrangement holds, in the catalog words', async () => {
        const started = start((_hub, engine) => {
            write(
                engine,
                'config/layout.yml',
                [
                    LAYOUT,
                    'arrangements:',
                    '  focus: { root: { kind: pane, view: focus } }',
                    'rail:',
                    '  - { label: "Focus", glyph: focus, page: focus }',
                    '  - { label: "Gone", glyph: focus, page: gone }',
                    ''
                ].join('\n')
            );
        });
        await until(() => on(started.got, 'config').length >= 1, 2000);

        const payload = on(started.got, 'config')[0].payload as ConfigPayload;
        expect(payload.findings.map((finding) => finding.key)).toEqual(['rail[1]']);
        expect(payload.findings[0].message).toContain('gone');
        expect(payload.findings[0].file).toBe(join(started.engine, 'config', 'layout.yml'));
    });

    it('republishes the config after a config file is saved through handleSource', async () => {
        const started = start();
        await quiet(started.got);
        const before = on(started.got, 'config').length;
        const token = mintToken();
        const file = join(started.engine, 'config', 'catalogs', 'vocab.yml');
        expect(resolve(file).startsWith(resolve(started.engine) + sep)).toBe(true);
        const body = ['type_color:', '  idea: violet', '  active: blue', ''].join('\n');
        const response = await handleSource(
            new Request('http://localhost/api/source', {
                method: 'POST',
                headers: {
                    host: 'localhost',
                    origin: 'http://localhost',
                    'content-type': 'application/json',
                    'x-oculus-token': token
                },
                body: JSON.stringify({
                    root: ENGINE_ROOT,
                    path: 'catalogs/vocab.yml',
                    content: body
                })
            }),
            token,
            [engineRoot(started.engine)]
        );
        expect(response.status).toBe(200);
        expect(readFileSync(file, 'utf8')).toBe(body);

        await until(() => on(started.got, 'config').length > before, 2000);
        const payload = on(started.got, 'config').at(-1)?.payload as ConfigPayload;
        expect((payload.config.type_color as Record<string, string>).idea).toBe('violet');
    });

    it('replaces the held icon drawings with the ones it publishes', async () => {
        const held: IconMemory = { set: { stale: 'a drawing that is no longer named' } };
        const started = start((_hub, engine) => {
            write(engine, 'config/catalogs/glyphs.yml', 'glyphs:\n  pin: "P"\n');
            write(engine, 'config/catalogs/icons.yml', 'icons:\n  pin: pin\n');
        }, held);
        await until(() => on(started.got, 'config').length >= 1, 2000);

        const payload = on(started.got, 'config')[0].payload as ConfigPayload;
        expect(Object.keys(held.set)).toEqual(['pin']);
        expect(held.set.pin).toContain('<svg');
        // The page is handed what is held, so the push and the load carry the same drawings.
        expect(payload.icons).toStrictEqual(held.set);
    });

    it('republishes feeds beside portfolio when a YAML feed changes', async () => {
        const started = start();
        await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;
        const feedsBefore = on(started.got, 'feeds').length;

        write(
            started.hub,
            'feeds/literature-radar.yml',
            'meta:\n  last_run: 2026-09-13\nentries:\n  - { title: one, bucket: method }\n'
        );
        await until(() => on(started.got, 'feeds').length > feedsBefore, 2000);

        expect(on(started.got, 'portfolio')).toHaveLength(portfolioBefore + 1);
        const feeds = on(started.got, 'feeds');
        const payload = feeds[feeds.length - 1].payload as FeedsPayload;
        expect(payload.radar.entries).toEqual([{ title: 'one', bucket: 'method' }]);
    });

    it('republishes feeds beside portfolio when a flat LinkedIn file changes', async () => {
        const started = start();
        await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;
        const feedsBefore = on(started.got, 'feeds').length;

        write(
            started.hub,
            'theaxec.github.io/_linkedin/01-start.md',
            '---\ntitle: "Changed"\ndate: 2026-09-01\n---\n\nChanged post.\n'
        );
        await until(() => on(started.got, 'feeds').length > feedsBefore, 2000);

        expect(on(started.got, 'portfolio')).toHaveLength(portfolioBefore + 1);
        const feeds = on(started.got, 'feeds');
        const payload = feeds[feeds.length - 1].payload as FeedsPayload;
        expect(payload.linkedin.entries[0].title).toBe('Changed');
    });

    it('republishes the portfolio when a manifest changes', async () => {
        const started = start();
        const before = await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;
        const configBefore = on(started.got, 'config').length;

        const edited = MANIFEST.replace('Loewner layers', 'Loewner neural layers');
        write(started.hub, 'projects/active/loewner/project.yml', edited);
        await until(() => started.got.length > before, 2000);

        const portfolio = on(started.got, 'portfolio');
        expect(portfolio.length).toBe(portfolioBefore + 1);
        const last = portfolio[portfolio.length - 1];
        const snapshot = last.payload as Snapshot;
        expect(last.version).toBe(portfolioBefore + 1);
        expect(snapshot.version).toBe(last.version);
        expect(snapshot.entities.projects.loewner.title).toBe('Loewner neural layers');
        // A hub change is the portfolio channel alone; the vocabulary did not move.
        expect(on(started.got, 'config').length).toBe(configBefore);
    });

    it('republishes the portfolio when the career file changes', async () => {
        const started = start();
        await quiet(started.got);
        // The file is watched on its own from the rebuild after it appears: a manifest change here
        // is what makes that rebuild, and the edit after it is what the watch has to see.
        write(started.hub, 'registries/career.yml', 'title: Career strategy\nhosts: []\n');
        const seen = started.got.length;
        write(
            started.hub,
            'projects/active/loewner/project.yml',
            MANIFEST.replace('Loewner layers', 'Loewner layers again')
        );
        await until(() => started.got.length > seen, 2000);
        const settled = await quiet(started.got);

        write(started.hub, 'registries/career.yml', 'title: Career plan\nhosts: []\n');
        await until(() => started.got.length > settled, 2000);
        const portfolio = on(started.got, 'portfolio');
        const snapshot = portfolio[portfolio.length - 1].payload as Snapshot;
        expect(snapshot.entities.career?.title).toBe('Career plan');
    });

    it('ignores a file written under a project code folder', async () => {
        const started = start();
        const before = await quiet(started.got);

        write(started.hub, 'projects/active/loewner/code/results.yml', 'auc: 0.81\n');
        await sleep(150);

        expect(started.got.length).toBe(before);
    });

    it('rebuilds for a registry the config names and not for another yaml beside it', async () => {
        const started = start();
        const before = await quiet(started.got);

        write(started.hub, 'registries/notes.yml', 'note: nothing the build reads\n');
        await sleep(150);
        expect(started.got.length).toBe(before);

        const portfolioBefore = on(started.got, 'portfolio').length;
        write(started.hub, 'registries/venues.yml', 'entries: []\n');
        await until(() => on(started.got, 'portfolio').length > portfolioBefore, 3000);
        expect(on(started.got, 'portfolio').length).toBeGreaterThan(portfolioBefore);
    });

    it('republishes portfolio, config, and feeds when a config file changes', async () => {
        const started = start();
        await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;
        const configBefore = on(started.got, 'config').length;

        const feedsBefore = on(started.got, 'feeds').length;

        write(started.engine, 'config/text.yml', TEXT.replace('"oculus"', '"oculus, live"'));
        await until(
            () =>
                on(started.got, 'config').length > configBefore &&
                on(started.got, 'portfolio').length > portfolioBefore &&
                on(started.got, 'feeds').length > feedsBefore,
            2000
        );

        const config = on(started.got, 'config');
        const last = config[config.length - 1];
        expect(last.version).toBe(configBefore + 1);
        expect((last.payload as ConfigPayload).text['app.title']).toBe('oculus, live');
        expect(on(started.got, 'portfolio').length).toBe(portfolioBefore + 1);
        expect(on(started.got, 'feeds').length).toBe(feedsBefore + 1);
    });

    it('publishes a portfolio worded by key over a broken sentence file, and rewords it once repaired', async () => {
        const sentences = join(engineDir(), 'config', 'text', 'findings.yml');
        const started = start((hub, engine) => {
            write(engine, 'config/text/findings.yml', 'text: [\n');
            write(
                hub,
                'projects/active/loewner/project.yml',
                MANIFEST.replace('id: loewner', 'id: other')
            );
        });
        const messages = (): string[] => {
            const portfolio = on(started.got, 'portfolio');
            const last = portfolio.at(-1)?.payload as Snapshot | undefined;
            return last?.findings.map((finding) => finding.message) ?? [];
        };
        await until(() => messages().length > 0, 3000);
        // The fixture hub keeps no people or organisations registry, which is two findings of its
        // own.
        expect(messages()).toEqual([
            'findings.manifests.id_not_folder "other" loewner',
            'findings.registries.file_missing',
            'findings.registries.file_missing'
        ]);
        await quiet(started.got);

        write(started.engine, 'config/text/findings.yml', readFileSync(sentences, 'utf8'));
        await until(() => messages()[0] === 'id "other" is not the folder name loewner', 3000);
        expect(messages()).toEqual([
            'id "other" is not the folder name loewner',
            'registry file does not exist',
            'registry file does not exist'
        ]);
    });

    it('publishes an empty portfolio, not a crash, when the config names no scan rule', async () => {
        const started = start();
        await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;

        write(started.engine, 'config/layout.yml', 'scan: "not a list"\n');
        await until(() => on(started.got, 'portfolio').length > portfolioBefore, 2000);

        const portfolio = on(started.got, 'portfolio');
        const last = portfolio[portfolio.length - 1].payload as Snapshot;
        expect(Object.keys(last.entities.projects)).toEqual([]);
    });
});
