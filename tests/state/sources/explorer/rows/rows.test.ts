// The rows of the Files tree that are pure functions of the listings: which files nest under which
// (rows/nesting.ts), which folders fold into one row (rows/compact.ts), what git says of a row
// (rows/decorations.ts), what the filter leaves and marks (rows/filter.ts), and the rows the
// keyboard reads (rows/tree-rows.ts).
//
// What this does NOT cover: the rows drawn, which is tests/views/sources/files/files.test.ts, and
// the fetches that fill the listings.

import { describe, expect, it } from 'vitest';
import {
    chainLabel,
    compactChain,
    decorationOf,
    filterRows,
    namePartsOf,
    nestEntries,
    nestingRulesOf,
    rowStanding,
    statusFold,
    treeKeyRows,
    treeRows,
    type FsEntry,
    type FsRoot
} from '../../../../../src/lib/state/sources/fs.ts';
import {
    HEADER_ID,
    withHeader
} from '../../../../../src/lib/state/sources/explorer/rows/tree-rows.ts';
import type { GitEntry } from '../../../../../src/lib/data/model/index.ts';
import { dir, file } from '../../../../fixtures/doubles.ts';

const HUB: FsRoot = { key: 'hub', dir: '/r/hub', fixed: true };

/**
 * A listing lookup over a table keyed `root:path`; a folder the table lacks is a read, empty one.
 */
function listings(table: Record<string, FsEntry[]>) {
    return (root: string, path: string): FsEntry[] => table[`${root}:${path}`] ?? [];
}

/** The same table as `held`, where a folder the table lacks was never read. */
function held(table: Record<string, FsEntry[]>) {
    return (root: string, path: string): FsEntry[] | null => table[`${root}:${path}`] ?? null;
}

/** The default nesting patterns the cases use, the shapes VS Code's defaults have. */
const RULES = nestingRulesOf({
    patterns: {
        'package.json': ['package-lock.json'],
        '*.ts': ['${capture}.js', '${capture}.d.ts']
    }
});

describe('file nesting in one folder', () => {
    // Revert: return the entries unchanged from nestEntries whatever the rules are.
    it('puts package-lock.json under package.json and index.js and index.d.ts under index.ts', () => {
        const entries = [
            file('index.d.ts'),
            file('index.js'),
            file('index.ts'),
            file('package-lock.json'),
            file('package.json')
        ];
        const nested = nestEntries(entries, RULES, 'src');

        expect(nested.map((one) => one.entry.name)).toEqual(['index.ts', 'package.json']);
        expect(nested[0]?.children.map((one) => one.name)).toEqual(['index.d.ts', 'index.js']);
        expect(nested[1]?.children.map((one) => one.name)).toEqual(['package-lock.json']);
    });

    // Revert: drop the empty-rules early return in nestEntries.
    it('leaves every entry flat with no rules', () => {
        const entries = [file('index.js'), file('index.ts'), file('package.json')];
        const nested = nestEntries(entries, [], 'src');

        expect(nested.map((one) => one.entry.name)).toEqual([
            'index.js',
            'index.ts',
            'package.json'
        ]);
        expect(nested.every((one) => one.children.length === 0)).toBe(true);
    });

    // Revert: let nestEntries take folders into the names it nests.
    it('never nests a folder, nor under a folder', () => {
        const nested = nestEntries([dir('index.js'), file('index.ts')], RULES, 'src');

        expect(nested.map((one) => one.entry.name)).toEqual(['index.js', 'index.ts']);
        expect(nested.flatMap((one) => one.children)).toEqual([]);
    });

    // Revert: have nestingRulesOf return every pattern whatever its value.
    it('reads the rules out of a configuration, leaving a pattern it cannot use', () => {
        const rules = nestingRulesOf({
            patterns: { '': ['a'], 'x.ts': [1, 2], 'package.json': ['package-lock.json'] }
        });

        expect(rules).toEqual([{ key: 'package.json', children: ['package-lock.json'] }]);
        expect(nestingRulesOf({})).toEqual([]);
    });
});

describe('compact folders', () => {
    const TABLE = {
        'hub:': [dir('a')],
        'hub:a': [dir('b')],
        'hub:a/b': [dir('c')],
        'hub:a/b/c': [file('file')]
    };

    // Revert: stop the chain in compactChain at the first folder.
    it('folds a/b/c into one chain when a and b each hold one folder', () => {
        const chain = compactChain('hub', { name: 'a', path: 'a' }, held(TABLE));

        expect(chain.map((step) => step.path)).toEqual(['a', 'a/b', 'a/b/c']);
        expect(chainLabel(chain)).toBe('a / b / c');
    });

    // Revert: drop the `inside.length === 1` test in compactChain.
    it('does not fold a folder that holds a file too', () => {
        const chain = compactChain(
            'hub',
            { name: 'a', path: 'a' },
            held({ ...TABLE, 'hub:a': [dir('b'), file('x.txt')] })
        );

        expect(chain.map((step) => step.path)).toEqual(['a']);
    });

    // Revert: drop the `held(root, next) === null` test in compactChain.
    it('does not fold into a folder that was never read', () => {
        const table: Record<string, FsEntry[]> = { 'hub:': [dir('a')], 'hub:a': [dir('b')] };
        const chain = compactChain('hub', { name: 'a', path: 'a' }, held(table));

        expect(chain.map((step) => step.path)).toEqual(['a']);
    });

    // Revert: drop the `link` test in compactChain.
    it('does not fold across a symbolic link', () => {
        const table: Record<string, FsEntry[]> = {
            'hub:a': [{ ...dir('b'), link: true }],
            'hub:a/b': []
        };

        expect(compactChain('hub', { name: 'a', path: 'a' }, held(table)).length).toBe(1);
    });

    // Revert: drop the `blocked` call in compactChain.
    it('stops short of a step the caller blocks', () => {
        const chain = compactChain(
            'hub',
            { name: 'a', path: 'a' },
            held(TABLE),
            (step) => step.to === 'a/b/c'
        );

        expect(chain.map((step) => step.path)).toEqual(['a', 'a/b']);
    });

    // Revert: leave `held` out of the options treeRows passes to compactChain.
    it('draws the chain as one row standing at its last folder, open with that folder', () => {
        const rows = treeRows([HUB], listings(TABLE), ['hub:', 'hub:a/b/c'], null, null, {
            held: held(TABLE)
        });
        const row = rows.find((one) => one.name === 'c');

        expect(row).toMatchObject({ path: 'a/b/c', depth: 1, open: true });
        expect(row?.chain?.map((step) => step.name)).toEqual(['a', 'b', 'c']);
        expect(rows.map((one) => one.path)).toEqual(['', 'a/b/c', 'a/b/c/file']);
    });

    // Revert: draw a chain only when `held` lists the first folder, not all of them.
    it('draws no chain without the listings as read', () => {
        const rows = treeRows([HUB], listings(TABLE), ['hub:', 'hub:a', 'hub:a/b', 'hub:a/b/c']);

        expect(rows.every((one) => one.chain === undefined)).toBe(true);
        expect(rows.map((one) => one.path)).toEqual(['', 'a', 'a/b', 'a/b/c', 'a/b/c/file']);
    });

    // Revert: drop the `named` test in treeRows' entryRow.
    it('stops the run short of the folder being renamed so that it keeps a row to type in', () => {
        const rows = treeRows(
            [HUB],
            listings(TABLE),
            ['hub:', 'hub:a'],
            null,
            { mode: 'rename', root: 'hub', path: 'a/b' },
            { held: held(TABLE) }
        );

        expect(rows.find((one) => one.path === 'a')?.chain).toBeUndefined();
        expect(rows.find((one) => one.path === 'a/b')?.editing).toBe('rename');
    });

    // Revert: have rowStanding look at the exact path only.
    it('finds the compacted row that holds a segment', () => {
        const rows = treeRows([HUB], listings(TABLE), ['hub:'], null, null, { held: held(TABLE) });

        expect(rowStanding(rows, { root: 'hub', path: 'a/b' })?.path).toBe('a/b/c');
        expect(rowStanding(rows, { root: 'hub', path: 'nowhere' })).toBeNull();
    });
});

describe('rows with nesting and compaction together', () => {
    // Revert: walk the nested children as part of the last folder of a chain.
    it('nests the files inside the last folder of a chain', () => {
        const table = {
            'hub:': [dir('a')],
            'hub:a': [dir('b')],
            'hub:a/b': [file('index.ts'), file('index.js')]
        };
        const rows = treeRows(
            [HUB],
            listings(table),
            ['hub:', 'hub:a/b', 'hub:a/b/index.ts'],
            null,
            null,
            {
                held: held(table),
                nesting: RULES
            }
        );

        expect(rows.map((one) => [one.path, one.depth, one.under ?? ''])).toEqual([
            ['', 0, ''],
            ['a/b', 1, ''],
            ['a/b/index.ts', 2, ''],
            ['a/b/index.js', 3, 'a/b/index.ts']
        ]);
        expect(rows.find((one) => one.path === 'a/b/index.ts')?.nests).toBe(true);
    });

    // Revert: drop the `up` row from treeRows.
    it('puts the line that moves a rooted tab up above its head', () => {
        const rows = treeRows(
            [HUB],
            listings({ 'hub:a': [file('x')] }),
            ['hub:a'],
            { path: 'a', name: 'a' },
            null,
            {
                up: { root: 'hub', path: '' }
            }
        );

        expect(rows[0]).toMatchObject({ name: '..', up: true, path: '', depth: 0 });
        expect(rows[1]).toMatchObject({ name: 'a', path: 'a', depth: 0 });
    });
});

/** One git entry, with the counts a listing of changes carries and a row's colour ignores. */
const entry = (path: string, status: string): GitEntry => ({ path, status, added: 0, deleted: 0 });

describe('what git says of a row', () => {
    const fold = statusFold([
        {
            dir: '/r/hub',
            git: {
                staged: [entry('sub/a.txt', 'A')],
                unstaged: [entry('m.txt', 'M')],
                untracked: [entry('u.txt', '??')],
                conflicted: [entry('c.txt', 'UU')]
            }
        }
    ]);

    // Revert: map `U` to the modified hue in TONE.
    it('gives M, U, A and ! to the files, each in its hue', () => {
        const of = (path: string) => decorationOf(fold, `/r/hub/${path}`, 'file');

        expect(of('m.txt')).toEqual({ mark: 'M', tone: 'modified' });
        expect(of('u.txt')).toEqual({ mark: 'U', tone: 'added' });
        expect(of('sub/a.txt')).toEqual({ mark: 'A', tone: 'added' });
        expect(of('c.txt')).toEqual({ mark: '!', tone: 'conflict' });
        expect(of('clean.txt')).toBeNull();
    });

    // Revert: let a folder take the weakest hue below it instead of the strongest.
    it('colours a folder by the strongest change below it, with no letter', () => {
        expect(decorationOf(fold, '/r/hub/sub', 'dir')).toEqual({ mark: '', tone: 'added' });
        expect(decorationOf(fold, '/r/hub', 'dir')).toEqual({ mark: '', tone: 'conflict' });
        expect(decorationOf(fold, '/r/hub/other', 'dir')).toBeNull();
    });

    // Revert: take the first list a path is in rather than the strongest letter.
    it('takes the strongest letter of a file that is in several lists', () => {
        const both = statusFold([
            {
                dir: '/r/hub',
                git: {
                    staged: [entry('x.txt', 'A')],
                    unstaged: [entry('x.txt', 'M')],
                    untracked: [],
                    conflicted: []
                }
            }
        ]);

        expect(decorationOf(both, '/r/hub/x.txt', 'file')?.mark).toBe('A');
    });

    // Revert: drop `whole` from the fold.
    it('marks everything under a whole untracked folder as untracked', () => {
        const whole = statusFold([
            {
                dir: '/r/hub',
                git: {
                    staged: [],
                    unstaged: [],
                    untracked: [entry('newdir/', '??')],
                    conflicted: []
                }
            }
        ]);

        expect(decorationOf(whole, '/r/hub/newdir/deep/f.txt', 'file')).toEqual({
            mark: 'U',
            tone: 'added'
        });
        expect(decorationOf(whole, '/r/hub/newdir/deep', 'dir')).toEqual({
            mark: '',
            tone: 'added'
        });
    });

    // Revert: draw a renamed file in the added hue.
    it('draws a renamed file in the modified hue and a deleted one in its own', () => {
        const kinds = statusFold([
            {
                dir: '/r/hub',
                git: {
                    staged: [entry('r.txt', 'R'), entry('d.txt', 'D')],
                    unstaged: [],
                    untracked: [],
                    conflicted: []
                }
            }
        ]);

        expect(decorationOf(kinds, '/r/hub/r.txt', 'file')).toEqual({
            mark: 'R',
            tone: 'modified'
        });
        expect(decorationOf(kinds, '/r/hub/d.txt', 'file')).toEqual({ mark: 'D', tone: 'deleted' });
    });
});

describe('the filter', () => {
    const TABLE = {
        'hub:': [dir('src'), file('README.md')],
        'hub:src': [file('files.ts'), file('other.ts')]
    };

    // Revert: ignore `fuzzy` in filterRows' matches.
    it('matches `fls` fuzzily to files.ts and marks f, l and s, and matches nothing as a substring', () => {
        const fuzzy = filterRows([HUB], held(TABLE), 'fls', null, true);
        const hit = fuzzy.find((one) => one.name === 'files.ts');

        expect(hit?.hits).toEqual([0, 2, 4]);
        expect(fuzzy.some((one) => one.name === 'other.ts')).toBe(false);
        expect(filterRows([HUB], held(TABLE), 'fls', null, false).map((one) => one.name)).toEqual([
            'hub'
        ]);
    });

    // Revert: draw a folder above a match closed.
    it('draws the folder above a match open and keeps the rows flat', () => {
        const rows = filterRows([HUB], held(TABLE), 'other');

        expect(rows.map((one) => [one.path, one.depth, one.open])).toEqual([
            ['', 0, true],
            ['src', 1, true],
            ['src/other.ts', 2, false]
        ]);
        expect(rows.every((one) => one.chain === undefined && one.nests === undefined)).toBe(true);
    });

    // Revert: split the name per match rather than per run.
    it('splits a name into the runs the filter matched', () => {
        expect(namePartsOf('files.ts', [0, 2, 3])).toEqual([
            { text: 'f', hit: true },
            { text: 'i', hit: false },
            { text: 'le', hit: true },
            { text: 's.ts', hit: false }
        ]);
        expect(namePartsOf('a', undefined)).toEqual([{ text: 'a', hit: false }]);
    });
});

describe('the rows the keyboard reads', () => {
    const TABLE = {
        'hub:': [dir('a'), file('index.ts'), file('index.js')],
        'hub:a': [file('x')]
    };
    const nested = treeRows([HUB], listings(TABLE), ['hub:', 'hub:a', 'hub:index.ts'], null, null, {
        nesting: RULES
    });

    // Revert: key a nested file under its folder rather than under its parent file.
    it('keys a nested file under its parent file, and a plain row under its folder', () => {
        const keyed = treeKeyRows(nested, false);
        const parentOf = (id: string): string | null | undefined =>
            keyed.find((one) => one.id === id)?.parent;

        expect(parentOf('hub:index.js')).toBe('hub:index.ts');
        expect(parentOf('hub:a/x')).toBe('hub:a');
        expect(parentOf('hub:')).toBeNull();
    });

    // Revert: key a compacted row under its last folder instead of the folder above its first.
    it('keys a compacted row under the folder its first folder sits in', () => {
        const table = { 'hub:': [dir('a')], 'hub:a': [dir('b')], 'hub:a/b': [file('f')] };
        const rows = treeRows([HUB], listings(table), ['hub:'], null, null, { held: held(table) });
        const keyed = treeKeyRows(rows, false);

        expect(keyed.find((one) => one.id === 'hub:a/b')?.parent).toBe('hub:');
    });

    // Revert: have withHeader keep the roots' parents as they are.
    it('puts the workspace header first, every root under it, and nothing under a closed one', () => {
        const keyed = treeKeyRows(nested, false);
        const open = withHeader(keyed, true);

        expect(open[0]).toEqual({ id: HEADER_ID, parent: null, open: true });
        expect(open.find((one) => one.id === 'hub:')?.parent).toBe(HEADER_ID);
        expect(open.find((one) => one.id === 'hub:a')?.parent).toBe('hub:');
        expect(withHeader(keyed, false)).toEqual([{ id: HEADER_ID, parent: null, open: false }]);
    });

    // Revert: leave `fixed` false while a filter draws the rows.
    it('fixes the open state of every row while a filter draws them', () => {
        expect(treeKeyRows(nested, true).every((one) => one.fixed === true)).toBe(true);
        expect(treeKeyRows(nested, false).every((one) => one.fixed === false)).toBe(true);
    });
});
