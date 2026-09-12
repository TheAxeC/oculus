// watchPortfolio against a synthetic hub and a synthetic engine in temporary directories. Nothing
// outside them is read or written, every write asserts its path is inside first, and every watcher
// is closed when the test ends.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Hub } from '../../src/lib/server/channels.ts';
import type { Sink } from '../../src/lib/server/channels.ts';
import {
    relevant,
    watchPortfolio,
    watchedDirectories
} from '../../src/lib/server/watch/portfolio.ts';
import type { Watcher } from '../../src/lib/server/watch/portfolio.ts';
import type { ConfigPayload, Message, Snapshot } from '../../src/lib/data/model.ts';

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
            close: () => {}
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

/** A started watcher over a fresh hub and engine, with a sink already subscribed to both channels. */
function start(): { hub: string; engine: string; got: Message[] } {
    const hub = buildHub();
    const engine = buildEngine();
    const channels = new Hub();
    const client = recording();
    channels.subscribe(client.sink, ['portfolio', 'config']);
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
            join('/hub', 'registries')
        ]);
    });
});

describe('watchPortfolio', () => {
    it('publishes both channels at start, each at version 1', async () => {
        const started = start();
        await until(() => started.got.length >= 2, 2000);

        const portfolio = on(started.got, 'portfolio');
        const config = on(started.got, 'config');
        expect(portfolio[0].version).toBe(1);
        expect(config[0].version).toBe(1);

        const snapshot = portfolio[0].payload as Snapshot;
        expect(snapshot.version).toBe(1);
        expect(snapshot.entities.projects.loewner.title).toBe('Loewner layers');

        const payload = config[0].payload as ConfigPayload;
        expect(payload.text['app.title']).toBe('oculus');
        expect(payload.findings).toEqual([]);
        expect(payload.config.venues_file).toBe('registries/venues.yml');
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

    it('republishes both channels when a config file changes', async () => {
        const started = start();
        await quiet(started.got);
        const portfolioBefore = on(started.got, 'portfolio').length;
        const configBefore = on(started.got, 'config').length;

        write(started.engine, 'config/text.yml', TEXT.replace('"oculus"', '"oculus, live"'));
        await until(() => on(started.got, 'config').length > configBefore, 2000);
        await until(() => on(started.got, 'portfolio').length > portfolioBefore, 2000);

        const config = on(started.got, 'config');
        const last = config[config.length - 1];
        expect(last.version).toBe(configBefore + 1);
        expect((last.payload as ConfigPayload).text['app.title']).toBe('oculus, live');
        expect(on(started.got, 'portfolio').length).toBe(portfolioBefore + 1);
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
