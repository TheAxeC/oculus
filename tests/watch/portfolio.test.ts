// The portfolio and feed watcher against a synthetic hub and engine in temporary directories. Nothing
// outside them is read or written, every write asserts its path is inside first, and every watcher
// is closed when the test ends.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Hub } from '../../src/lib/server/channels.ts';
import { handleWrite } from '../../src/lib/server/writes.ts';
import { handleSource } from '../../src/lib/server/source.ts';
import { mintToken } from '../../src/lib/server/auth.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { loadConfig } from '../../src/lib/data/sources/config.ts';
import type { Sink } from '../../src/lib/server/channels.ts';
import {
    relevant,
    watchPortfolio,
    watchedDirectories
} from '../../src/lib/server/watch/portfolio.ts';
import type { Watcher } from '../../src/lib/server/watch/portfolio.ts';
import type { ConfigPayload, FeedsPayload, Message, Snapshot } from '../../src/lib/data/model.ts';
import { noop } from '../doubles.ts';

const LAYOUT = [
    'scan:',
    '  - { dir: projects/ideas, type: idea }',
    '  - { dir: projects/active, type: active }',
    '  - { dir: projects/manuscripts, type: manuscript }',
    '  - { dir: projects/coauthor, nested: true }',
    '  - { dir: projects/archive, nested: true }',
    'venues_file: registries/venues.yml',
    'datasets_file: registries/data.yml',
    'programs_file: registries/programs.yml',
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

const MANIFEST = 'id: loewner\ntype: active\ntitle: Loewner layers\n';

const watchers: Watcher[] = [];

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

function scratch(name: string): string {
    const dir = mkdtempSync(join(tmpdir(), `oculus-${name}-`));
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
    write(engine, 'config/layout.yml', LAYOUT);
    write(engine, 'config/vocab.yml', VOCAB);
    write(engine, 'config/manifest-schema.yml', SCHEMA);
    write(engine, 'config/text.yml', TEXT);
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
    write(hub, 'registries/programs.yml', 'entries: []\n');
    write(hub, 'registries/domains.yml', 'entries: []\n');
    write(hub, 'funding/funding.yml', 'entries: []\n');
    write(hub, 'network/events.yml', 'title: Talks\nentries: []\n');
    write(hub, 'feeds/inbox.yml', 'meta:\n  run: 2026-09-12\nentries: []\n');
    write(hub, 'feeds/position-leads.yml', 'meta: {}\nentries: []\n');
    write(hub, 'feeds/literature-radar.yml', 'meta: {}\nentries: []\n');
    write(
        hub,
        'theaxec.github.io/_linkedin/01-start.md',
        '---\ntitle: "Start"\ndate: 2026-09-01\n---\n\nFirst post.\n'
    );
    return hub;
}

type Recording = {
    sink: Sink;
    got: Message[];
};

function recording(): Recording {
    const got: Message[] = [];
    return {
        got,
        sink: {
            send: (text: string) => {
                got.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
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
async function quiet(got: Message[], ms = 400): Promise<number> {
    let held = -1;
    while (held !== got.length) {
        held = got.length;
        await sleep(ms);
    }
    return held;
}

/** A started watcher over a fresh hub and engine, subscribed before the starting publications. */
function start(prepare?: (hub: string, engine: string) => void): {
    hub: string;
    engine: string;
    got: Message[];
} {
    const hub = buildHub();
    const engine = buildEngine();
    prepare?.(hub, engine);
    const channels = new Hub();
    const client = recording();
    channels.subscribe(client.sink, ['portfolio', 'config', 'feeds']);
    watchers.push(watchPortfolio(channels, { hub, engine }));
    return { hub, engine, got: client.got };
}

describe('relevant', () => {
    it('takes a yaml file outside every code and attic folder', () => {
        expect(relevant('active/loewner/project.yml')).toBe(true);
        expect(relevant('venues.yml')).toBe(true);
        expect(relevant('active/loewner/code/results.yml')).toBe(false);
        expect(relevant('archive/nogo/thing/attic/old.yml')).toBe(false);
        expect(relevant('active/loewner/README.md')).toBe(false);
        expect(relevant('active/loewner/.project.yml.swp')).toBe(false);
        expect(relevant(null)).toBe(false);
    });
});

describe('watchedDirectories', () => {
    it('names every scan tier and the folder of every registry, collection and feed file', () => {
        const dirs = watchedDirectories('/hub', {
            scan: [{ dir: 'projects/active' }],
            feeds: {
                inbox: 'feeds/inbox.yml',
                leads: 'feeds/position-leads.yml',
                radar: 'feeds/literature-radar.yml',
                linkedin: 'theaxec.github.io/_linkedin'
            },
            linkedinCadenceDays: 30,
            career: 'CAREER.yml',
            registries: {
                venues: 'registries/venues.yml',
                datasets: 'registries/data.yml',
                programs: 'registries/programs.yml',
                domains: 'registries/domains.yml',
                funding: 'funding/funding.yml'
            },
            collections: [{ key: 'events', file: 'network/events.yml' }],
            schema: undefined,
            vocab: { types: [], statuses: [] }
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
            'feeds/inbox.yml',
            'meta: {}\nentries:\n  - { id: shared, kind: action }\n'
        );
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).inbox.entries).toEqual([
            { id: 'shared', kind: 'action' }
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
        await sleep(500);
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
            write(hub, 'feeds/inbox.yml', 'meta: {}\nentries:\n  - id: mail\n    kind: action\n');
        });
        await quiet(started.got);
        const before = on(started.got, 'feeds').length;
        const config = portfolioConfigFrom(loadConfig(started.engine).config);
        expect(
            resolve(join(started.hub, config.feeds.inbox)).startsWith(resolve(started.hub) + sep)
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
                    feed: 'inbox',
                    id: 'mail',
                    field: 'triaged',
                    value: true
                })
            }),
            token,
            { hub: started.hub, config }
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
            ok: true,
            changed: ['triaged'],
            refused: []
        });
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).inbox.entries).toEqual([
            { id: 'mail', kind: 'action', triaged: true }
        ]);
    });

    it('republishes a whole feed file saved through handleSource on the feeds channel', async () => {
        const started = start();
        await quiet(started.got);
        const before = on(started.got, 'feeds').length;
        const config = portfolioConfigFrom(loadConfig(started.engine).config);
        const path = config.feeds.inbox;
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
                        'meta: {}\nentries:\n  - id: source-mail\n    kind: action\n    triaged: true\n'
                })
            }),
            token,
            [{ key: 'fixture', dir: started.hub }],
            ['.yml']
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
        await until(() => on(started.got, 'feeds').length > before, 2000);
        expect((on(started.got, 'feeds').at(-1)?.payload as FeedsPayload).inbox.entries).toEqual([
            { id: 'source-mail', kind: 'action', triaged: true }
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
        expect(payload.findings).toEqual([]);
        expect(payload.config.venues_file).toBe('registries/venues.yml');
        expect((feeds[0].payload as FeedsPayload).linkedin.entries[0].title).toBe('Start');
    });

    it('republishes feeds beside portfolio when a YAML feed changes', async () => {
        const started = start();
        await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;
        const feedsBefore = on(started.got, 'feeds').length;

        write(
            started.hub,
            'feeds/inbox.yml',
            'meta:\n  run: 2026-09-13\nentries:\n  - { id: one, kind: action }\n'
        );
        await until(() => on(started.got, 'feeds').length > feedsBefore, 2000);

        expect(on(started.got, 'portfolio')).toHaveLength(portfolioBefore + 1);
        const feeds = on(started.got, 'feeds');
        const payload = feeds[feeds.length - 1].payload as FeedsPayload;
        expect(payload.inbox.entries).toEqual([{ id: 'one', kind: 'action' }]);
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
        write(started.hub, 'CAREER.yml', 'title: Career strategy\nhosts: []\n');
        const seen = started.got.length;
        write(
            started.hub,
            'projects/active/loewner/project.yml',
            MANIFEST.replace('Loewner layers', 'Loewner layers again')
        );
        await until(() => started.got.length > seen, 2000);
        const settled = await quiet(started.got);

        write(started.hub, 'CAREER.yml', 'title: Career plan\nhosts: []\n');
        await until(() => started.got.length > settled, 2000);
        const portfolio = on(started.got, 'portfolio');
        const snapshot = portfolio[portfolio.length - 1].payload as Snapshot;
        expect(snapshot.entities.career?.title).toBe('Career plan');
    });

    it('ignores a file written under a project code folder', async () => {
        const started = start();
        const before = await quiet(started.got);

        write(started.hub, 'projects/active/loewner/code/results.yml', 'auc: 0.81\n');
        await sleep(500);

        expect(started.got.length).toBe(before);
    });

    it('rebuilds for a registry the config names and not for another yaml beside it', async () => {
        const started = start();
        const before = await quiet(started.got);

        write(started.hub, 'registries/notes.yml', 'note: nothing the build reads\n');
        await sleep(500);
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
