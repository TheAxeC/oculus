// What server/files/search.ts does with a query: which roots it runs over, what it hands the
// process, what it makes of ripgrep's JSON stream, where it stops reading, and what it says when a
// root will not answer.
//
// Most cases hand in their own runner, so no process starts and the argument vector is read word
// for word. The last group runs the real binary of the `@vscode/ripgrep` dependency over mkdtemp
// folders, which is where the dependency itself and ripgrep's own --max-count are exercised.

import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    runSearch,
    type RunOutcome,
    type SearchRunner
} from '../../../src/lib/server/files/search.ts';
import { handleSearch } from '../../../src/lib/server/files/search-routes.ts';
import {
    ALL_ROOTS,
    HIT_WIDTH,
    emptyQuery,
    type SearchQuery
} from '../../../src/lib/data/helpers/search/query.ts';
import type { SearchFile, SearchHit } from '../../../src/lib/data/model/index.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { hitKey } from '../../../src/lib/state/sources/search/hits.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const ROOTS: Root[] = [
    { key: 'hub', dir: '/hub' },
    { key: 'engine', dir: '/engine' }
];

/** The milliseconds every case gives one root, standing in for `search.timeout_s`. */
const TIMEOUT = 10000;

function query(changes: Partial<SearchQuery> = {}): SearchQuery {
    return { ...emptyQuery(500), q: 'needle', ...changes };
}

/**
 * A runner over a prepared stream, handing its lines over one at a time as the real one does and
 * stopping where the real one kills the child.
 */
function speaks(stdout: string, extra: Partial<RunOutcome> = {}): SearchRunner {
    return (_dir, _args, _timeout, onLine) => {
        let stopped = false;
        for (const line of stdout.split('\n')) {
            if (!onLine(line)) {
                stopped = true;
                break;
            }
        }
        return Promise.resolve({ code: 0, stderr: '', timedOut: false, stopped, ...extra });
    };
}

/** The sentence a root that ran out of time is named with. */
const TIMED_OUT = 'the search timed out';

/** What one root's stream is folded into. */
type Folded = { files: SearchFile[]; total: number; truncated: boolean };

/** The files, the hit total and whether the stream had more, for one root's stream of lines. */
async function foldedBy(stream: string, root = 'hub', max = 500): Promise<Folded> {
    const outcome = await runSearch([{ key: root, dir: `/${root}` }], query({ root, max }), {
        run: speaks(stream),
        timeout: TIMEOUT
    });
    if (!outcome.ok) throw new Error(`the run did not answer: ${JSON.stringify(outcome)}`);
    const { files, total, truncated } = outcome.answer;
    return { files, total, truncated };
}

/** A run that answers nothing at all, so the fold sees an empty stream. */
function quiet(): RunOutcome {
    return { code: 1, stderr: '', timedOut: false, stopped: false };
}

/** One `rg --json` match line over one file. */
function match(path: string, line: number, text: string, start: number, matched: string): string {
    return JSON.stringify({
        type: 'match',
        data: {
            path: { text: `./${path}` },
            lines: { text: `${text}\n` },
            line_number: line,
            absolute_offset: 0,
            submatches: [{ match: { text: matched }, start, end: start + matched.length }]
        }
    });
}

/**
 * The begin and end records ripgrep wraps one file's matches in, with its own matched-line count.
 */
function file(path: string, matches: string[], counted = matches.length): string {
    return [
        JSON.stringify({ type: 'begin', data: { path: { text: `./${path}` } } }),
        ...matches,
        JSON.stringify({
            type: 'end',
            data: { path: { text: `./${path}` }, stats: { matched_lines: counted } }
        })
    ].join('\n');
}

/** A folder of this case's own, which scratchDir makes inside the system temporary directory. */
function scratch(): string {
    return scratchDir('oculus-search-');
}

describe('what the process is given', () => {
    it('runs each root in its own directory, with the query as one list of arguments', async () => {
        const ran: { dir: string; args: string[]; timeout: number }[] = [];
        await runSearch(ROOTS, query(), {
            run: (dir, args, timeout) => {
                ran.push({ dir, args, timeout });
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });

        expect(ran.map((one) => one.dir)).toEqual(['/hub', '/engine']);
        expect(ran[0].timeout).toBe(TIMEOUT);
        expect(ran[0].args).toEqual([
            '--json',
            '--max-count',
            '501',
            '--max-filesize',
            '2M',
            '--glob',
            '!node_modules',
            '--glob',
            '!.git',
            '--glob',
            '!.svelte-kit',
            '--fixed-strings',
            '--ignore-case',
            '--regexp',
            'needle',
            '.'
        ]);
    });

    it('runs one root when the query names one', async () => {
        const ran: string[] = [];
        await runSearch(ROOTS, query({ root: 'engine' }), {
            run: (dir) => {
                ran.push(dir);
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });
        expect(ran).toEqual(['/engine']);
    });

    it('carries each option into the arguments', async () => {
        const seen: string[][] = [];
        for (const changes of [{ word: true }, { case: true }, { regex: true }]) {
            await runSearch(ROOTS.slice(0, 1), query(changes), {
                run: (_dir, args) => {
                    seen.push(args);
                    return Promise.resolve(quiet());
                },
                timeout: TIMEOUT
            });
        }
        expect(seen[0]).toContain('--word-regexp');
        expect(seen[1]).toContain('--case-sensitive');
        expect(seen[2]).not.toContain('--fixed-strings');
    });

    it('refuses a root outside the served list before any process starts', async () => {
        let started = 0;
        const outcome = await runSearch(ROOTS, query({ root: 'elsewhere' }), {
            run: () => {
                started += 1;
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });
        expect(outcome).toEqual({ ok: false, refused: 'unknown_root' });
        expect(started).toBe(0);
    });

    it('refuses an empty query before any process starts', async () => {
        let started = 0;
        const outcome = await runSearch(ROOTS, query({ q: '' }), {
            run: () => {
                started += 1;
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });
        expect(outcome).toEqual({ ok: false, refused: 'empty' });
        expect(started).toBe(0);
    });
});

describe('the JSON stream', () => {
    it('folds matches into files with their line, column, length and text', async () => {
        const stream = file('src/a.ts', [match('src/a.ts', 12, 'the needle here', 4, 'needle')]);
        expect(await foldedBy(stream)).toEqual({
            files: [
                {
                    root: 'hub',
                    path: 'src/a.ts',
                    hits: [{ line: 12, column: 5, length: 6, text: 'the needle here', at: 4 }]
                }
            ],
            total: 1,
            truncated: false
        });
    });

    it('leaves out a file that begins and ends with no match, and a line that is not JSON', async () => {
        const stream = [
            file('src/empty.ts', []),
            'not json at all',
            file('src/a.ts', [match('src/a.ts', 1, 'needle', 0, 'needle')])
        ].join('\n');
        const folded = await foldedBy(stream);
        expect(folded.files.map((one) => one.path)).toEqual(['src/a.ts']);
    });

    it('counts a column in characters where the line carries more bytes than characters', async () => {
        const stream = file('src/a.ts', [
            // The three leading characters are two bytes each, so ripgrep's start is 6 and the
            // column the page draws with is 4.
            match('src/a.ts', 3, 'aaaneedle', 6, 'needle')
        ]);
        const line = stream.replace(/aaa/g, '\u00e9\u00e9\u00e9');
        const hit = (await foldedBy(line)).files[0].hits[0];
        expect(hit.column).toBe(4);
        expect(hit.at).toBe(3);
    });

    it('stops at the room it is given and says the stream had more', async () => {
        const stream = file('src/a.ts', [
            match('src/a.ts', 1, 'needle one', 0, 'needle'),
            match('src/a.ts', 2, 'needle two', 0, 'needle'),
            match('src/a.ts', 3, 'needle three', 0, 'needle')
        ]);
        const folded = await foldedBy(stream, 'hub', 2);
        expect(folded.total).toBe(2);
        expect(folded.truncated).toBe(true);
        expect(folded.files[0].hits.map((hit) => hit.line)).toEqual([1, 2]);
    });

    it('says the stream had more when the end record counts more lines than the hits kept', async () => {
        // ripgrep's own --max-count cut the file at three and emitted no record for the rest, so
        // its count in the end record is the only place the loss shows.
        const stream = file(
            'src/a.ts',
            [
                match('src/a.ts', 1, 'needle one', 0, 'needle'),
                match('src/a.ts', 2, 'needle two', 0, 'needle'),
                match('src/a.ts', 3, 'needle three', 0, 'needle')
            ],
            5
        );
        const folded = await foldedBy(stream);
        expect(folded.total).toBe(3);
        expect(folded.truncated).toBe(true);
    });

    it('says nothing was cut when the end record counts exactly the hits kept', async () => {
        const stream = file('src/a.ts', [match('src/a.ts', 1, 'needle', 0, 'needle')], 1);
        expect((await foldedBy(stream)).truncated).toBe(false);
    });

    it('asks a run to stop only once a match has been dropped', async () => {
        const lines = [
            JSON.stringify({ type: 'begin', data: { path: { text: './a.ts' } } }),
            match('a.ts', 1, 'needle one', 0, 'needle'),
            match('a.ts', 2, 'needle two', 0, 'needle'),
            match('a.ts', 3, 'needle three', 0, 'needle')
        ];
        const fed: string[] = [];
        await runSearch([{ key: 'hub', dir: '/hub' }], query({ root: 'hub', max: 1 }), {
            run: (_dir, _args, _timeout, onLine) => {
                let stopped = false;
                for (const line of lines) {
                    fed.push(line);
                    if (!onLine(line)) {
                        stopped = true;
                        break;
                    }
                }
                return Promise.resolve({ code: 0, stderr: '', timedOut: false, stopped });
            },
            timeout: TIMEOUT
        });
        // The first match fits; the line after it is read, and the second match is the one dropped.
        expect(fed).toEqual(lines.slice(0, 3));
    });
});

describe('the answer', () => {
    it('caps the whole run across roots, says it was cut, and leaves the later roots unopened', async () => {
        const ran: string[] = [];
        const outcome = await runSearch(ROOTS, query({ max: 2 }), {
            run: (dir, args, timeout, onLine) => {
                ran.push(dir);
                return speaks(
                    file('a.ts', [
                        match('a.ts', 1, 'needle one', 0, 'needle'),
                        match('a.ts', 2, 'needle two', 0, 'needle'),
                        match('a.ts', 3, 'needle three', 0, 'needle')
                    ])
                )(dir, args, timeout, onLine);
            },
            timeout: TIMEOUT,
            now: () => 0
        });
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) return;
        expect(outcome.answer.total).toBe(2);
        expect(outcome.answer.truncated).toBe(true);
        expect(outcome.answer.files.map((one) => one.root)).toEqual(['hub']);
        // The second root is never opened: the cap was spent on the first.
        expect(ran).toEqual(['/hub']);
    });

    it('stops the run at the cap rather than reading the rest of the stream', async () => {
        const seen: string[] = [];
        await runSearch(ROOTS.slice(0, 1), query({ max: 1 }), {
            run: (_dir, _args, _timeout, onLine) => {
                const lines = file('a.ts', [
                    match('a.ts', 1, 'needle one', 0, 'needle'),
                    match('a.ts', 2, 'needle two', 0, 'needle'),
                    match('a.ts', 3, 'needle three', 0, 'needle')
                ]).split('\n');
                let stopped = false;
                for (const line of lines) {
                    seen.push(line);
                    if (!onLine(line)) {
                        stopped = true;
                        break;
                    }
                }
                return Promise.resolve({ code: 0, stderr: '', timedOut: false, stopped });
            },
            timeout: TIMEOUT
        });
        // The begin, the kept match, and the one that found no room; the third match and the end
        // record are never read.
        expect(seen).toHaveLength(3);
    });

    it('carries the elapsed time the clock gave it', async () => {
        const times = [100, 340];
        const outcome = await runSearch(ROOTS.slice(0, 1), query(), {
            run: () => Promise.resolve(quiet()),
            timeout: TIMEOUT,
            now: () => times.shift() ?? 340
        });
        expect(outcome.ok && outcome.answer.ms).toBe(240);
    });

    it('answers the last line of the reason when a root failed and nothing was found', async () => {
        const outcome = await runSearch(ROOTS.slice(0, 1), query({ regex: true, q: 'fo(' }), {
            run: () =>
                Promise.resolve({
                    code: 2,
                    stderr: 'rg: regex parse error:\n    (?:fo()\n error: unclosed group\n',
                    timedOut: false,
                    stopped: false
                }),
            timeout: TIMEOUT
        });
        expect(outcome).toEqual({ ok: false, error: 'error: unclosed group', timedOut: false });
    });

    it('keeps the hits of the roots that answered and names the root that failed', async () => {
        const outcome = await runSearch(ROOTS, query(), {
            run: (dir, args, timeout, onLine) =>
                dir === '/hub'
                    ? Promise.resolve({
                          code: 2,
                          stderr: 'rg: no such file',
                          timedOut: false,
                          stopped: false
                      })
                    : speaks(file('b.ts', [match('b.ts', 4, 'needle', 0, 'needle')]))(
                          dir,
                          args,
                          timeout,
                          onLine
                      ),
            timeout: TIMEOUT
        });
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) return;
        expect(outcome.answer.files.map((one) => one.root)).toEqual(['engine']);
        expect(outcome.answer.failed).toEqual([{ root: 'hub', reason: 'rg: no such file' }]);
    });

    it('names a root that ran out of time and says the answer was cut', async () => {
        const outcome = await runSearch(ROOTS, query(), {
            run: (dir, args, timeout, onLine) =>
                dir === '/hub'
                    ? Promise.resolve({ code: 2, stderr: '', timedOut: true, stopped: false })
                    : speaks(file('b.ts', [match('b.ts', 4, 'needle', 0, 'needle')]))(
                          dir,
                          args,
                          timeout,
                          onLine
                      ),
            timeout: TIMEOUT
        });
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) return;
        expect(outcome.answer.truncated).toBe(true);
        expect(outcome.answer.failed).toEqual([{ root: 'hub', reason: TIMED_OUT }]);
    });

    it('ends at the timeout when the runner never answers', async () => {
        const outcome = await runSearch(ROOTS.slice(0, 1), query(), {
            // A runner that answers nothing at all, which is what a hung process looks like here.
            run: () => new Promise<RunOutcome>(() => undefined),
            timeout: 30
        });
        expect(outcome).toEqual({ ok: false, error: TIMED_OUT, timedOut: true });
    });

    it('cuts the reason down to one line', async () => {
        const reason = async (stderr: string): Promise<string | null> => {
            const outcome = await runSearch(ROOTS.slice(0, 1), query(), {
                run: () => Promise.resolve({ code: 2, stderr, timedOut: false, stopped: false }),
                timeout: TIMEOUT
            });
            return outcome.ok || 'refused' in outcome ? null : outcome.error;
        };
        expect(await reason('')).toBe('');
        expect(await reason('rg: one thing\n')).toBe('rg: one thing');
        expect(await reason(`a\n${'x'.repeat(400)}`)).toHaveLength(203);
    });
});

describe('the binary the dependency carries', () => {
    it('finds a literal, and misses on a word boundary and on a case, over three real files', async () => {
        const dir = scratch();
        writeFileSync(join(dir, 'literal.txt'), 'a needle in here\n');
        writeFileSync(join(dir, 'inside.txt'), 'a needlepoint in here\n');
        writeFileSync(join(dir, 'upper.txt'), 'a NEEDLE in here\n');
        const roots: Root[] = [{ key: 'scratch', dir }];

        const plain = await runSearch(roots, query({ root: 'scratch' }), { timeout: TIMEOUT });
        expect(plain.ok).toBe(true);
        if (!plain.ok) return;
        expect(plain.answer.files.map((one) => one.path).sort()).toEqual([
            'inside.txt',
            'literal.txt',
            'upper.txt'
        ]);
        expect(plain.answer.truncated).toBe(false);
        const hit = plain.answer.files.find((one) => one.path === 'literal.txt')?.hits[0];
        expect(hit).toEqual({ line: 1, column: 3, length: 6, text: 'a needle in here', at: 2 });

        const word = await runSearch(roots, query({ root: 'scratch', word: true }), {
            timeout: TIMEOUT
        });
        expect(word.ok && word.answer.files.map((one) => one.path).sort()).toEqual([
            'literal.txt',
            'upper.txt'
        ]);

        const cased = await runSearch(roots, query({ root: 'scratch', case: true }), {
            timeout: TIMEOUT
        });
        expect(cased.ok && cased.answer.files.map((one) => one.path).sort()).toEqual([
            'inside.txt',
            'literal.txt'
        ]);

        const exact = await runSearch(roots, query({ root: 'scratch', case: true, word: true }), {
            timeout: TIMEOUT
        });
        expect(exact.ok && exact.answer.files.map((one) => one.path)).toEqual(['literal.txt']);

        const none = await runSearch(roots, query({ root: 'scratch', q: 'haystack' }), {
            timeout: TIMEOUT
        });
        expect(none.ok && none.answer.files).toEqual([]);
    });

    it('says the answer was cut when ripgrep own max-count dropped matches in a file', async () => {
        const dir = scratch();
        writeFileSync(join(dir, 'many.txt'), 'needle\n'.repeat(5));
        const outcome = await runSearch(
            [{ key: 'scratch', dir }],
            query({ root: 'scratch', max: 3 }),
            {
                timeout: TIMEOUT
            }
        );
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) return;
        expect(outcome.answer.total).toBe(3);
        expect(outcome.answer.truncated).toBe(true);
    });

    it('answers a regex ripgrep will not read with the reason ripgrep gave', async () => {
        const dir = scratch();
        writeFileSync(join(dir, 'a.txt'), 'anything\n');
        const outcome = await runSearch(
            [{ key: 'scratch', dir }],
            query({ root: 'scratch', regex: true, q: 'fo(' }),
            { timeout: TIMEOUT }
        );
        expect(outcome.ok).toBe(false);
        expect(!outcome.ok && 'error' in outcome && outcome.error).toContain('unclosed');
    });

    it('names a root whose directory is not there while the other root answers', async () => {
        const dir = scratch();
        writeFileSync(join(dir, 'a.txt'), 'needle\n');
        const gone = join(dir, 'not-a-folder');
        const outcome = await runSearch(
            [
                { key: 'gone', dir: gone },
                { key: 'scratch', dir }
            ],
            query({ root: ALL_ROOTS }),
            { timeout: TIMEOUT }
        );
        expect(outcome.ok).toBe(true);
        if (!outcome.ok) return;
        expect(outcome.answer.files.map((one) => one.root)).toEqual(['scratch']);
        expect(outcome.answer.failed.map((one) => one.root)).toEqual(['gone']);
        expect(outcome.answer.failed[0].reason).not.toBe('');
    });

    it('does not open a hidden file or a hidden directory', async () => {
        const dir = scratch();
        writeFileSync(join(dir, 'plain.txt'), 'needle\n');
        writeFileSync(join(dir, '.env'), 'needle\n');
        mkdirSync(join(dir, '.hidden'));
        writeFileSync(join(dir, '.hidden', 'inside.txt'), 'needle\n');
        const outcome = await runSearch([{ key: 'scratch', dir }], query({ root: 'scratch' }), {
            timeout: TIMEOUT
        });
        expect(outcome.ok && outcome.answer.files.map((one) => one.path)).toEqual(['plain.txt']);
    });
});

describe('the JSON stream with records of an odd shape', () => {
    const begin = JSON.stringify({ type: 'begin', data: { path: { text: './a.ts' } } });

    /** One match record over `a.ts` whose fields the case overrides. */
    function matchWith(over: Record<string, unknown>): string {
        return JSON.stringify({
            type: 'match',
            data: {
                path: { text: 'a.ts' },
                lines: { text: 'abc def\n' },
                line_number: 3,
                submatches: [{ match: { text: 'abc' }, start: 0, end: 3 }],
                ...over
            }
        });
    }

    /** One `end` record carrying this stats value. */
    function endWith(stats: unknown): string {
        return JSON.stringify({ type: 'end', data: { path: { text: 'a.ts' }, stats } });
    }

    /** The answer for one stream of these lines over the root `r` with room for ten hits. */
    function folded(...lines: string[]): Promise<Folded> {
        return foldedBy(lines.join('\n'), 'r', 10);
    }

    const WHOLE = { line: 3, column: 1, length: 3, text: 'abc def', at: 0 };
    const BARE = { line: 3, column: 1, length: 0, text: 'abc def', at: 0 };
    const one = (hit: SearchHit, truncated = false): Folded => ({
        files: [{ root: 'r', path: 'a.ts', hits: [hit] }],
        total: 1,
        truncated
    });

    it('drops a match whose line number is text and says the file held more', async () => {
        expect(
            await folded(begin, matchWith({ line_number: '3' }), endWith({ matched_lines: 1 }))
        ).toStrictEqual({ files: [], total: 0, truncated: true });
    });

    it('reads a hit at column 1 of length 0 when its first submatch is not an object holding a match', async () => {
        for (const submatches of ['x', [null], ['abc'], [5], []]) {
            expect(
                await folded(begin, matchWith({ submatches }), endWith({ matched_lines: 1 })),
                JSON.stringify(submatches)
            ).toStrictEqual(one(BARE));
        }
    });

    it('takes the count of an end record only when matched_lines is a number', async () => {
        for (const stats of [[], { matched_lines: '5' }]) {
            expect(await folded(begin, matchWith({}), endWith(stats))).toStrictEqual(one(WHOLE));
        }
        expect(await folded(begin, matchWith({}), endWith({ matched_lines: 9 }))).toStrictEqual(
            one(WHOLE, true)
        );
    });

    it('keeps a count, a line number and an offset of infinity as numbers', async () => {
        const infinite = (text: string): string => text.replace('"@inf"', '1e999');
        expect(
            await folded(begin, matchWith({}), infinite(endWith({ matched_lines: '@inf' })))
        ).toStrictEqual(one(WHOLE, true));
        expect(await folded(begin, infinite(matchWith({ line_number: '@inf' })))).toStrictEqual(
            one({ ...WHOLE, line: Infinity })
        );
        const offset = [{ match: { text: 'abc' }, start: '@inf', end: 3 }];
        expect(await folded(begin, infinite(matchWith({ submatches: offset })))).toStrictEqual(
            one({ ...WHOLE, column: 9, at: 8 })
        );
    });

    it('skips a line that is not JSON, a list, a number, null and a record whose data is a list', async () => {
        expect(
            await folded(
                begin,
                'not json',
                '[]',
                '3',
                'null',
                matchWith({}),
                endWith({ matched_lines: 1 })
            )
        ).toStrictEqual(one(WHOLE));
        expect(
            await folded(JSON.stringify({ type: 'begin', data: [] }), matchWith({}))
        ).toStrictEqual({
            files: [],
            total: 0,
            truncated: false
        });
    });
});

describe('the folder a search is scoped to', () => {
    /** A root holding a folder, a file and a link to a folder outside it. */
    function scoped(): { dir: string; roots: Root[] } {
        const dir = realpathSync(scratch());
        mkdirSync(join(dir, 'src/lib'), { recursive: true });
        writeFileSync(join(dir, 'f.txt'), 'needle');
        const outside = realpathSync(scratch());
        symlinkSync(outside, join(dir, 'out'));
        return { dir, roots: [{ key: 'hub', dir }] };
    }

    const scopedQuery = (under: string) => query({ root: 'hub', under });

    it('runs in the root with the folder as the path argument', async () => {
        const { dir, roots } = scoped();
        const ran: { dir: string; args: string[] }[] = [];
        const outcome = await runSearch(roots, scopedQuery('src/lib'), {
            run: (where, args) => {
                ran.push({ dir: where, args });
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });
        expect(outcome.ok).toBe(true);
        expect(ran.map((one) => one.dir)).toEqual([dir]);
        expect(ran[0].args.slice(-3)).toEqual(['--regexp', 'needle', './src/lib']);
    });

    it('refuses a link to a folder outside the root as outside, before any process starts', async () => {
        const { roots } = scoped();
        let started = 0;
        const outcome = await runSearch(roots, scopedQuery('out'), {
            run: () => {
                started += 1;
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });
        expect(outcome).toEqual({ ok: false, refused: 'outside' });
        expect(started).toBe(0);
    });

    it('refuses a folder that is not there and a path that is a file as missing', async () => {
        const { roots } = scoped();
        let started = 0;
        const options = {
            run: () => {
                started += 1;
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        };
        expect(await runSearch(roots, scopedQuery('nowhere'), options)).toEqual({
            ok: false,
            refused: 'missing'
        });
        expect(await runSearch(roots, scopedQuery('f.txt'), options)).toEqual({
            ok: false,
            refused: 'missing'
        });
        expect(started).toBe(0);
    });

    it('answers the route a 400 with the refusal word, which the page words from its catalog', async () => {
        const { roots } = scoped();
        const words: string[] = [];
        for (const under of ['out', 'nowhere', '../x']) {
            const response = await handleSearch(
                new Request(
                    `http://localhost/api/search?${new URLSearchParams({ q: 'needle', root: 'hub', under })}`,
                    { headers: { 'x-oculus-token': 'tok' } }
                ),
                'tok',
                { roots, cap: 500, timeout: TIMEOUT, run: () => Promise.resolve(quiet()) }
            );
            expect(response.status, under).toBe(400);
            const body = (await response.json()) as { error: string };
            words.push(body.error);
        }
        expect(words).toEqual(['outside', 'missing', 'outside']);
    });

    it('searches a hidden folder it is given whole, with the real binary', async () => {
        const { dir, roots } = scoped();
        mkdirSync(join(dir, '.hidden'));
        writeFileSync(join(dir, '.hidden/h.txt'), 'needle in a hidden folder');
        const outcome = await runSearch(roots, scopedQuery('.hidden'), { timeout: TIMEOUT });
        expect(outcome.ok && outcome.answer.files.map((one) => one.path)).toEqual([
            '.hidden/h.txt'
        ]);
    });
});

describe('a line longer than a hit row is wide, with the real binary', () => {
    it('answers two matches of one long line as two hits that differ in `at` though the windows share a column', async () => {
        const dir = scratch();
        const line = `${'a'.repeat(500)} foo ${'b'.repeat(100)} foo ${'c'.repeat(500)}`;
        writeFileSync(join(dir, 'long.txt'), `${line}\n`);
        const outcome = await runSearch(
            [{ key: 'scratch', dir }],
            query({ root: 'scratch', q: 'foo' }),
            {
                timeout: TIMEOUT
            }
        );
        expect(outcome.ok).toBe(true);
        const hits = outcome.ok ? outcome.answer.files[0].hits : [];
        expect(hits).toHaveLength(2);
        expect(hits[0].column).toBe(hits[1].column);
        expect(hits[0].text.length).toBeLessThanOrEqual(HIT_WIDTH);
        expect(hits.map((one) => one.at)).toEqual([line.indexOf('foo'), line.lastIndexOf('foo')]);
        const file = outcome.ok ? outcome.answer.files[0] : undefined;
        const keys = file === undefined ? [] : hits.map((one) => hitKey(file, one));
        expect(new Set(keys).size).toBe(2);
    });

    it('carries a match longer than the window whole as group 0, in both modes', async () => {
        const dir = scratch();
        const long = 'x'.repeat(300);
        writeFileSync(join(dir, 'long.txt'), `a ${long} b\n`);
        writeFileSync(join(dir, 'short.txt'), 'a xx b\n');
        const roots = [{ key: 'scratch', dir }];
        const regex = await runSearch(roots, query({ root: 'scratch', q: 'x+', regex: true }), {
            timeout: TIMEOUT
        });
        const byPath = (path: string) =>
            regex.ok ? regex.answer.files.find((one) => one.path === path)?.hits[0] : undefined;
        expect(byPath('long.txt')?.groups).toEqual({ '0': long });
        expect(byPath('short.txt')?.groups).toEqual({ '0': 'xx' });
        const literal = await runSearch(roots, query({ root: 'scratch', q: long }), {
            timeout: TIMEOUT
        });
        const hit = literal.ok ? literal.answer.files[0].hits[0] : undefined;
        expect(hit?.groups).toEqual({ '0': long });
        expect(hit?.length).toBe(300);
    });
});
