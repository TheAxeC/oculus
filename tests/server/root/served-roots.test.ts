// Layer 2, server tests. The roots every part of the server serves are the folders of the open
// workspace file under their names and no others (G2): the file route's resolution, the directory
// listing, the search list, the language-server relay, the git watch and the app hosts are each
// handed those three folders; no root named `hub` or `engine` exists beside them, and a path
// outside a folder is refused. The workspace file and its folders are planted under the system
// temporary directory, and every watcher the case does not look at is inert.
// @module-tag slow: every case builds a whole server context over a planted workspace.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { resolveRootFile, resolveRootPath } from '../../../src/lib/server/files/files.ts';
import { listDir } from '../../../src/lib/server/files/fs.ts';
import { runNames } from '../../../src/lib/server/files/search/search.ts';
import { servedRoots } from '../../../src/lib/server/machine/lsp/uris.ts';
import {
    createServerContext,
    type ContextDependencies,
    type ServerContext
} from '../../../src/lib/server/root/context.ts';
import { writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { plantHub } from '../../fixtures/hubs/workspace.ts';
import { inert, inertDependencies, scratchEngine, scratchReadMachine } from './inert-context.ts';

let live: ServerContext | undefined;

afterEach(() => {
    live?.close();
    live = undefined;
});

const NAMES = ['research-hub', 'cathedra', 'notes'];

/** What the watchers the case looks at were handed. */
type Seen = {
    gitRoots: () => string[];
    relayRoots: () => { key: string }[];
    appsOpen: () => { roots: { key: string }[] };
};

/** A workspace file over a hub, a folder with a project manifest and a plain folder, opened. */
function started() {
    const root = scratchDir('oculus-served-roots-');
    const folder = (name: string): string => {
        const dir = join(root, name);
        mkdirSync(dir, { recursive: true });
        return dir;
    };
    const research = plantHub(folder('research-hub'));
    const cathedra = folder('cathedra');
    const notes = folder('notes');
    writeFileSync(join(research, 'README.md'), 'hub\n');
    writeFileSync(join(notes, 'a.md'), 'notes\n');
    writeFileSync(join(root, 'outside.md'), 'outside\n');
    mkdirSync(join(cathedra, '.oculus'), { recursive: true });
    writeFileSync(
        join(cathedra, '.oculus', 'project.yml'),
        'tier: research\nstage: exploring\ntitle: Cathedra\n'
    );
    const files = join(research, '.oculus', 'workspaces');
    mkdirSync(files, { recursive: true });
    const file = join(files, 'main.yml');
    writeFileSync(
        file,
        `folders:\n  - { name: research-hub, path: ${research} }\n  - { name: cathedra, path: ${cathedra} }\n  - { name: notes, path: ${notes} }\nprimary: research-hub\n`
    );
    const state = folder('state');
    writeState(state, { open: file, recent: [file], unsaved: { folders: [] } });

    const engine = scratchEngine('oculus-served-roots-engine-');
    const seen = {} as Seen;
    const inertApps = inertDependencies().watchApps;
    if (inertApps === undefined) throw new Error('the inert dependencies hold no apps watcher');
    const replacements: Partial<ContextDependencies> = {
        ...inertDependencies(),
        stateFolder: () => state,
        readMachine: scratchReadMachine(engine),
        watchGit: (_hub: unknown, options: Parameters<ContextDependencies['watchGit']>[1]) => {
            seen.gitRoots = options.roots ?? (() => []);
            return inert();
        },
        createRelay: (options: Parameters<ContextDependencies['createRelay']>[0]) => {
            seen.relayRoots = options.roots;
            return inert();
        },
        watchApps: (
            hub: Parameters<ContextDependencies['watchApps']>[0],
            options: Parameters<ContextDependencies['watchApps']>[1]
        ) => {
            seen.appsOpen = options.open;
            return inertApps(hub, options);
        }
    };
    const context = createServerContext(engine, replacements);
    live = context;
    return { context, seen, research, cathedra, notes, root };
}

describe('the roots served while a workspace file lists three folders', () => {
    it('are the three folders under their names, and no root named hub or engine', () => {
        const { context, seen, research, cathedra, notes } = started();
        const roots = context.workspace.open().roots;
        expect(roots.map((one) => one.key)).toEqual(NAMES);
        expect(roots.map((one) => one.dir)).toEqual([research, cathedra, notes]);
        expect(roots.some((one) => one.key === 'hub' || one.key === 'engine')).toBe(false);
        expect(seen.gitRoots()).toEqual([research, cathedra, notes]);
        expect(seen.relayRoots().map((one) => one.key)).toEqual(NAMES);
        expect(seen.appsOpen().roots.map((one) => one.key)).toEqual(NAMES);
        expect(servedRoots(roots).map((one) => one.key)).toEqual(NAMES);
    });

    it('resolve a file of each folder through the file route and list a folder, and refuse a path outside', () => {
        const { context } = started();
        const roots = context.workspace.open().roots;
        expect(resolveRootFile(roots, 'research-hub', 'README.md')).not.toBeNull();
        expect(resolveRootFile(roots, 'notes', 'a.md')).not.toBeNull();
        expect(resolveRootFile(roots, 'notes', '../outside.md')).toBeNull();
        expect(resolveRootPath(roots, 'notes', '../outside.md')).toEqual({ error: 'outside' });
        expect(resolveRootFile(roots, 'hub', 'README.md')).toBeNull();
        expect(resolveRootPath(roots, 'engine', 'config')).toEqual({ error: 'outside' });
        const listed = listDir(roots, 'notes', '');
        expect('entries' in listed && listed.entries.map((one) => one.name)).toEqual(['a.md']);
        expect(listDir(roots, 'notes', '..')).toEqual({ error: 'outside' });
    });

    it('refuse a names list for the root hub or engine before any process starts', async () => {
        const { context } = started();
        const roots = context.workspace.open().roots;
        for (const name of ['hub', 'engine']) {
            let started = 0;
            const outcome = await runNames(roots, name, {
                run: () => {
                    started += 1;
                    return Promise.reject(new Error('no process is started'));
                },
                timeout: 1000,
                max: 100,
                withheld: []
            });
            expect(outcome).toEqual({ ok: false, refused: 'unknown_root' });
            expect(started).toBe(0);
        }
    });
});
