// Layer 2, server test. The portfolio watcher and the store of folder-glob matches the deck reads
// go through (G32): a deck folder added, moved or removed under a held glob drops the key at the
// event, a project folder moved under a scan folder rebuilds the snapshot, and the next read of the
// deck holds what the disk holds, for a hub, for two hubs, for a workspace folder that is no hub
// and for a key a deck read took between two rebuilds. A save of a slide and a folder made inside
// `code/` drop nothing, a folder made inside a project rebuilds nothing, and the deck route's read
// of the deck the build read walks nothing.
// @module-tag slow: the watcher builds the portfolio of hub copies over the real folders.
//
// Each hub is a copy of tests/fixtures/hubs/demo/ whose projects are replaced by the shape of a hub
// with two scan folders under `projects/`, its portfolio deck finding its members by
// `projects/**/present` with the tier `research`, so the glob's fixed part lies above the scan
// folders. A case waits on the watcher's `built` hook and on the store's drops, never on a timer;
// the case of a folder made inside a project runs the watcher's debounce on faked timers, so the
// rebuild it would queue is run, or not, by the test's own clock. Every directory here is under the
// system temporary directory.

import { appendFileSync, globSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import type { Deck, Snapshot } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import {
    folderGlobs,
    type FolderGlobs,
    type HeldGlob
} from '../../../../src/lib/data/sources/documents/folder-globs.ts';
import { readDeck, type DeckSource } from '../../../../src/lib/server/content/deck/read.ts';
import { TOKEN_HEADER } from '../../../../src/lib/server/core/auth.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { writeBytesAtomic } from '../../../../src/lib/server/core/json.ts';
import { hubTargets, primaryConfig } from '../../../../src/lib/server/files/roots.ts';
import type { GlobSource } from '../../../../src/lib/server/root/watch/portfolio/glob-watch.ts';
import {
    watchPortfolio,
    type PortfolioWatcher
} from '../../../../src/lib/server/root/watch/portfolio/portfolio.ts';
import { GET } from '../../../../src/routes/api/(docs)/deck/+server.ts';
import { workspaceWith, type FolderSpec } from '../../../fixtures/hubs/workspace.ts';
import { it, plantFile, scratchDir } from '../../../fixtures/scratch.ts';
import { copyHub } from '../../../data/hubs/hubs-fixture.ts';
import { contextFixture } from '../context-fixture.ts';

/** The pattern of the portfolio deck's group. */
const PATTERN = 'projects/**/present';

const PORTFOLIO = [
    'deck:',
    '    title: Portfolio',
    'groups:',
    '    research:',
    `        find: { folders: [${PATTERN}], tiers: [research] }`,
    '        discover: true',
    'order:',
    '    - title.md',
    '    - { slides: research }',
    ''
].join('\n');

let watcher: PortfolioWatcher | undefined;

afterEach(() => {
    watcher?.close();
    watcher = undefined;
});

/** A path under `dir`, checked to stay inside it before anything is made or removed there. */
function under(dir: string, rel: string): string {
    const full = join(dir, rel);
    if (!resolve(full).startsWith(resolve(dir) + sep)) throw new Error(`outside: ${rel}`);
    return full;
}

/** A project folder of the tier `research` with its deck, under the hub at `dir`. */
function plantProject(dir: string, rel: string): void {
    plantFile(dir, `${rel}/project.yml`, 'tier: research\nstage: in-prep\ntitle: A project\n');
    plantFile(dir, `${rel}/present/present.yml`, 'order: [main.md]\n');
    plantFile(dir, `${rel}/present/main.md`, '# The slide\n');
}

/** A copy of the demo hub with the shape of the case: two scan folders and three projects. */
function plantHub(base: string, name: string): string {
    const dir = copyHub(base, name);
    rmSync(under(dir, 'projects'), { recursive: true, force: true });
    appendFileSync(
        under(dir, HUB_FILE),
        '\nscan:\n  - { dir: projects/active }\n  - { dir: projects/archive }\n'
    );
    writeFileSync(under(dir, 'deck/present.yml'), PORTFOLIO);
    for (const rel of ['projects/active/a', 'projects/active/b', 'projects/archive/z']) {
        plantProject(dir, rel);
    }
    return dir;
}

/** A deck whose one group finds the decks under `slides/`. */
const TALK = [
    'groups:',
    '    parts:',
    "        find: { folders: ['slides/*'] }",
    '        discover: true',
    'order:',
    '    - title.md',
    '    - { slides: parts }',
    ''
].join('\n');

/**
 * A store over a walk that counts its runs by folder and by pattern, handed to the watcher with the
 * fan-out of its listener, and a wait for the next drop of a key.
 */
function heldGlobs() {
    const runs = new Map<string, number>();
    const patterns = new Map<string, number>();
    const listeners = new Set<(glob: HeldGlob) => void>();
    const waits: { key: string; done: () => void }[] = [];
    const inner = folderGlobs({
        walk: (pattern, options) => {
            runs.set(options.cwd, (runs.get(options.cwd) ?? 0) + 1);
            patterns.set(pattern, (patterns.get(pattern) ?? 0) + 1);
            return globSync(pattern, options);
        },
        taken: (glob) => {
            for (const listener of [...listeners]) listener(glob);
        }
    });
    const store: FolderGlobs = {
        matches: (root, pattern) => inner.matches(root, pattern),
        held: () => inner.held(),
        drop: (key) => {
            inner.drop(key);
            for (const wait of waits.splice(0)) {
                if (wait.key === key) wait.done();
                else waits.push(wait);
            }
        }
    };
    const source: GlobSource = {
        store,
        follow: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
    return {
        source,
        runs: (dir: string): number => runs.get(dir) ?? 0,
        /** The walks of `pattern` under every folder, however the folder is spelled. */
        walks: (pattern: string): number => patterns.get(pattern) ?? 0,
        holds: (key: string): boolean => store.held().some((one) => one.key === key),
        /** The next drop of `key`, asked for before the change that makes it. */
        dropped: (key: string): Promise<void> =>
            new Promise((done) => {
                waits.push({ key, done });
            })
    };
}

/** Every build the watcher publishes from now on, and a wait for the first snapshot `wanted` is. */
function buildsOf(channels: Hub) {
    let count = 0;
    let waiting: { wanted: (one: Snapshot) => boolean; done: () => void } | null = null;
    const snapshot = (): Snapshot => channels.latest('portfolio')?.payload as Snapshot;
    return {
        built: (): void => {
            count += 1;
            if (waiting?.wanted(snapshot()) === true) {
                waiting.done();
                waiting = null;
            }
        },
        count: (): number => count,
        until: (wanted: (one: Snapshot) => boolean): Promise<void> =>
            new Promise((done) => {
                waiting = { wanted, done };
            })
    };
}

/** Whether a snapshot holds a project at the folder `folder` of the hub `hub`. */
function holdsFolder(snapshot: Snapshot, hub: string, folder: string): boolean {
    return Object.values(snapshot.entities.projects).some(
        (one) => one.root === hub && one.folder === folder
    );
}

/** The watcher over a workspace of these folders, the first the primary. */
function watched(folders: readonly FolderSpec[]) {
    const workspace = workspaceWith(folders, folders[0].name);
    const channels = new Hub();
    const globs = heldGlobs();
    const builds = buildsOf(channels);
    const settings = (hub: string) => loadConfig(engineDir(), { hub });
    watcher = watchPortfolio(
        channels,
        {
            engine: engineDir(),
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => workspace.open(),
            settings,
            defaults: () => loadConfig(engineDir()),
            problems: () => [],
            self: () => '',
            globs: globs.source
        },
        { debounce: 20, built: builds.built }
    );
    /** What a deck route reads over now: the roots, the hubs and the published snapshot. */
    const source = (): DeckSource => {
        const open = workspace.open();
        const snapshot = channels.latest('portfolio')?.payload as Snapshot;
        const primary = folders[0];
        const { config, from } = settings(primary.dir);
        return {
            roots: open.roots,
            primary: { key: primary.name, dir: primary.dir },
            config: primaryConfig(config, open, settings, from),
            projects: Object.values(snapshot.entities.projects),
            entities: (kind) => snapshot.entities[kind],
            hubs: hubTargets(open, settings),
            globs: globs.source.store
        };
    };
    const read = (root: string, path: string): Deck => {
        const deck = readDeck(source(), root, path);
        if (deck === 'outside') throw new Error(`${path} is outside`);
        return deck;
    };
    return { workspace, channels, globs, builds, read };
}

/** The folders of the members of a deck's group. */
function members(deck: Deck, group = 'research'): string[] {
    return (deck.groups.find((one) => one.name === group)?.members ?? [])
        .map((one) => one.path)
        .sort();
}

const START = [
    'projects/active/a/present',
    'projects/active/b/present',
    'projects/archive/z/present'
];

describe('the portfolio deck over the folders of a hub, read through the server store (G32)', () => {
    it('holds a deck folder added under a scan folder after the rebuild (case C3)', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { builds, read } = watched([{ name: 'hub', dir }]);
        expect(members(read('hub', 'deck'))).toEqual(START);
        const rebuilt = builds.until((one) => holdsFolder(one, 'hub', 'projects/active/c'));
        plantProject(dir, 'projects/active/c');
        await rebuilt;
        expect(members(read('hub', 'deck'))).toEqual(
            [...START, 'projects/active/c/present'].sort()
        );
    });

    it('holds a moved deck folder at its new path with the tiers filter applied, after the rebuild (case C4)', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { builds, read } = watched([{ name: 'hub', dir }]);
        expect(members(read('hub', 'deck'))).toEqual(START);
        const rebuilt = builds.until((one) => holdsFolder(one, 'hub', 'projects/active/b2'));
        renameSync(under(dir, 'projects/active/b'), under(dir, 'projects/active/b2'));
        await rebuilt;
        expect(members(read('hub', 'deck'))).toEqual([
            'projects/active/a/present',
            'projects/active/b2/present',
            'projects/archive/z/present'
        ]);
    });

    it('holds the deck of a project inside a filing folder moved in from outside the hub, after the rebuild', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const outside = scratchDir('oculus-deck-filed-');
        plantProject(outside, 'filed/x');
        const { builds, read } = watched([{ name: 'hub', dir }]);
        expect(members(read('hub', 'deck'))).toEqual(START);
        const rebuilt = builds.until((one) => holdsFolder(one, 'hub', 'projects/archive/filed/x'));
        renameSync(join(outside, 'filed'), under(dir, 'projects/archive/filed'));
        await rebuilt;
        expect(members(read('hub', 'deck'))).toEqual(
            [...START, 'projects/archive/filed/x/present'].sort()
        );
    });

    it('leaves a removed deck folder out after the rebuild (case C5)', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { builds, read } = watched([{ name: 'hub', dir }]);
        expect(members(read('hub', 'deck'))).toEqual(START);
        const rebuilt = builds.until((one) => !holdsFolder(one, 'hub', 'projects/active/a'));
        rmSync(under(dir, 'projects/active/a'), { recursive: true, force: true });
        await rebuilt;
        expect(members(read('hub', 'deck'))).toEqual(START.slice(1));
    });

    it('keeps the key through a save of a slide and reads the saved text with no walk (case C6)', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { globs, read } = watched([{ name: 'hub', dir }]);
        const key = `${dir}\n${PATTERN}`;
        read('hub', 'deck');
        // A key no slide save drops, whose drop by a file made after the save says the save's
        // events were heard first.
        globs.source.store.matches(dir, 'projects/**/fence.txt');
        const walked = globs.runs(dir);
        const fenced = globs.dropped(`${dir}\nprojects/**/fence.txt`);
        writeBytesAtomic(
            under(dir, 'projects/active/a/present/main.md'),
            Buffer.from('# The saved slide\n')
        );
        plantFile(dir, 'projects/active/a/fence.txt', 'fence\n');
        await fenced;
        expect(globs.holds(key)).toBe(true);
        const deck = read('hub', 'deck');
        expect(JSON.stringify(deck.slides)).toContain('The saved slide');
        expect(globs.runs(dir)).toBe(walked);
    });

    it('keeps the key when a folder is made inside a project code folder (case C7)', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { globs, read } = watched([{ name: 'hub', dir }]);
        const key = `${dir}\n${PATTERN}`;
        read('hub', 'deck');
        globs.source.store.matches(dir, 'projects/**/fence.txt');
        const fenced = globs.dropped(`${dir}\nprojects/**/fence.txt`);
        mkdirSync(under(dir, 'projects/active/a/code/present'), { recursive: true });
        plantFile(dir, 'projects/active/a/fence.txt', 'fence\n');
        await fenced;
        expect(globs.holds(key)).toBe(true);
    });

    it('rebuilds nothing for a folder made inside a project', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { globs, builds, read } = watched([{ name: 'hub', dir }]);
        read('hub', 'deck');
        globs.source.store.matches(dir, 'projects/**/fence.txt');
        const fenced = globs.dropped(`${dir}\nprojects/**/fence.txt`);
        const before = builds.count();
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
        try {
            mkdirSync(under(dir, 'projects/active/a/results/run1'), { recursive: true });
            plantFile(dir, 'projects/active/a/fence.txt', 'fence\n');
            await fenced;
            vi.advanceTimersByTime(1000);
            expect(builds.count()).toBe(before);
        } finally {
            vi.useRealTimers();
        }
    });

    it('reads the deck the build read through the deck route with no walk of its own', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        const { workspace, channels, globs } = watched([{ name: 'hub', dir }]);
        expect(globs.walks(PATTERN)).toBe(1);
        const context = contextFixture({
            hub: channels,
            workspace,
            engine: engineDir(),
            deckGlobs: globs.source.store
        });
        try {
            const request = new Request('http://127.0.0.1/api/deck?root=hub&path=deck', {
                headers: { [TOKEN_HEADER]: context.token }
            });
            const locals = {
                server: context,
                token: context.token,
                config: () => context.configCache.read()
            };
            const route = GET as unknown as (event: object) => Response | Promise<Response>;
            const answer = await route({ request, locals });
            expect(answer.status).toBe(200);
            expect(members((await answer.json()) as Deck)).toEqual(START);
            expect(globs.walks(PATTERN)).toBe(1);
        } finally {
            context.close();
        }
    });

    it("drops the key of the hub a folder was added under and keeps the other hub's (case C9)", async () => {
        const base = scratchDir('oculus-deck-folders-');
        const hub = plantHub(base, 'hub');
        const lab = plantHub(base, 'lab');
        const { globs, builds, read } = watched([
            { name: 'hub', dir: hub },
            { name: 'lab', dir: lab }
        ]);
        // The build reads the portfolio deck of the primary only, so the deck route's read of the
        // other hub's deck takes that hub's key.
        expect(members(read('lab', 'deck'))).toEqual(START);
        expect(globs.holds(`${hub}\n${PATTERN}`)).toBe(true);
        expect(globs.holds(`${lab}\n${PATTERN}`)).toBe(true);
        const dropped = globs.dropped(`${hub}\n${PATTERN}`);
        const rebuilt = builds.until((one) => holdsFolder(one, 'hub', 'projects/active/c'));
        plantProject(hub, 'projects/active/c');
        await dropped;
        await rebuilt;
        expect(globs.holds(`${lab}\n${PATTERN}`)).toBe(true);
        expect(globs.runs(lab)).toBe(1);
        expect(globs.runs(hub)).toBe(2);
    });

    it('holds a deck folder added under the glob of a workspace folder that is no hub (case C13)', async () => {
        const base = scratchDir('oculus-deck-folders-');
        const hub = plantHub(base, 'hub');
        const notes = under(base, 'notes');
        plantFile(notes, 'talk/present.yml', TALK);
        plantFile(notes, 'talk/title.md', '# Talk\n');
        plantFile(notes, 'slides/one/present.yml', 'order: [main.md]\n');
        plantFile(notes, 'slides/one/main.md', '# One\n');
        const { globs, read } = watched([
            { name: 'hub', dir: hub },
            { name: 'notes', dir: notes }
        ]);
        expect(members(read('notes', 'talk'), 'parts')).toEqual(['slides/one']);
        const dropped = globs.dropped(`${notes}\nslides/*`);
        plantFile(notes, 'slides/two/present.yml', 'order: [main.md]\n');
        await dropped;
        expect(members(read('notes', 'talk'), 'parts')).toEqual(['slides/one', 'slides/two']);
    });

    it('drops a key a deck read took between two rebuilds at the event, before any rebuild (case C14)', async () => {
        const dir = plantHub(scratchDir('oculus-deck-folders-'), 'hub');
        plantFile(dir, 'talks/talk/present.yml', TALK.replace('slides/*', 'talks/*-deck'));
        plantFile(dir, 'talks/talk/title.md', '# Talk\n');
        plantFile(dir, 'talks/one-deck/present.yml', 'order: [main.md]\n');
        plantFile(dir, 'talks/one-deck/main.md', '# One\n');
        const { globs, builds, read } = watched([{ name: 'hub', dir }]);
        const key = `${dir}\ntalks/*-deck`;
        expect(globs.holds(key)).toBe(false);
        expect(members(read('hub', 'talks/talk'), 'parts')).toEqual(['talks/one-deck']);
        expect(globs.holds(key)).toBe(true);
        const before = builds.count();
        const dropped = globs.dropped(key);
        plantFile(dir, 'talks/two-deck/present.yml', 'order: [main.md]\n');
        await dropped;
        expect(builds.count()).toBe(before);
        expect(members(read('hub', 'talks/talk'), 'parts')).toEqual([
            'talks/one-deck',
            'talks/two-deck'
        ]);
    });
});
