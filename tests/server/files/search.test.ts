// What server/files/search/search.ts does with a query and with a request for names: which roots it
// runs over, and which paths of a hub it gives ripgrep for the hub's notes folder, its `notes_dir`.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    runNames,
    runSearch,
    type RunOutcome
} from '../../../src/lib/server/files/search/search.ts';
import {
    ALL_ROOTS,
    NOTES_SCOPE,
    emptyQuery,
    type SearchQuery
} from '../../../src/lib/data/helpers/search/query.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const ROOTS: Root[] = [
    { key: 'hub', dir: '/hub' },
    { key: 'notes', dir: '/notes' }
];

/** The milliseconds every case gives one root, standing in for `search.timeout_s`. */
const TIMEOUT = 10000;

/** What a names list of a case is given past its run and the folders it skips. */
const NAMES = { timeout: TIMEOUT, max: 100, withheld: [] };

function query(changes: Partial<SearchQuery> = {}): SearchQuery {
    return { ...emptyQuery(500), q: 'needle', ...changes };
}

/** A run that answers nothing at all, so the fold sees an empty stream. */
function quiet(): RunOutcome {
    return { code: 1, stderr: '', timedOut: false, stopped: false };
}

describe('what the process is given', () => {
    it('refuses a root outside the served list before any process starts', async () => {
        let started = 0;
        const outcome = await runSearch(ROOTS, query({ root: 'elsewhere' }), {
            run: () => {
                started += 1;
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT,
            skipFolders: []
        });
        expect(outcome).toEqual({ ok: false, refused: 'unknown_root' });
        expect(started).toBe(0);
    });

    it('hands ripgrep one negated glob per name search.skip_folders gives, in a search and a names list (G13)', async () => {
        const given: string[][] = [];
        const run = (_dir: string, args: string[]) => {
            given.push(args);
            return Promise.resolve(quiet());
        };
        const skipFolders = ['node_modules', 'build out'];
        await runSearch(ROOTS, query({ root: 'hub' }), { run, timeout: TIMEOUT, skipFolders });
        await runNames(ROOTS, 'hub', { run, skipFolders, ...NAMES });
        const globs = given.map((args) =>
            args.flatMap((one, at) => (args[at - 1] === '--glob' ? [one] : []))
        );
        expect(globs).toEqual([
            ['!node_modules', '!build\\ out'],
            ['!node_modules', '!build\\ out']
        ]);
    });

    it('refuses a names list for a root outside the served list before any process starts', async () => {
        for (const root of ['elsewhere', '']) {
            let started = 0;
            const run = (): Promise<RunOutcome> => {
                started += 1;
                return Promise.resolve(quiet());
            };
            const outcome = await runNames(ROOTS, root, { run, skipFolders: [], ...NAMES });
            expect(outcome).toEqual({ ok: false, refused: 'unknown_root' });
            expect(started).toBe(0);
        }
    });
});

/** The paths each run was given: the arguments after the pattern. */
function pathsOf(given: string[][]): string[][] {
    return given.map((args) => args.slice(args.indexOf('--regexp') + 2));
}

/** A scratch hub whose notes folder, its `notes_dir`, is there. */
function hubWithNotes(notes: string): string {
    const hub = scratchDir('oculus-search-notes-');
    mkdirSync(join(hub, ...notes.split('/')), { recursive: true });
    return hub;
}

describe("the hub's notes folder a search reads, the hub's notes_dir", () => {
    it.each([
        ['a dot folder, named beside the root', '.lab/notes', ['.', './.lab/notes']],
        ['no dot folder, read with the root', 'journal', ['.']]
    ])('searches a whole hub whose notes folder is in %s (G13)', async (_name, notes, paths) => {
        const given: string[][] = [];
        const run = (_dir: string, args: string[]) => {
            given.push(args);
            return Promise.resolve(quiet());
        };
        const roots: Root[] = [{ key: 'hub', dir: hubWithNotes(notes), hub: true, notes }];
        await runSearch(roots, query({ root: 'hub' }), { run, timeout: TIMEOUT, skipFolders: [] });
        expect(pathsOf(given)).toEqual([paths]);
    });

    it('searches the notes folder each hub names for the notes of every root, and no root that is no hub (G13)', async () => {
        const given: string[][] = [];
        const dirs: string[] = [];
        const run = (dir: string, args: string[]) => {
            dirs.push(dir);
            given.push(args);
            return Promise.resolve(quiet());
        };
        const lab = hubWithNotes('.lab/notes');
        const journal = hubWithNotes('journal');
        const roots: Root[] = [
            { key: 'lab', dir: lab, hub: true, notes: '.lab/notes' },
            { key: 'plain', dir: scratchDir('oculus-search-plain-') },
            { key: 'journal', dir: journal, hub: true, notes: 'journal' }
        ];
        const all = query({ root: ALL_ROOTS, under: NOTES_SCOPE });
        await runSearch(roots, all, { run, timeout: TIMEOUT, skipFolders: [] });
        expect(dirs).toEqual([lab, journal]);
        expect(pathsOf(given)).toEqual([['./.lab/notes'], ['./journal']]);
    });
});
