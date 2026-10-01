// The file listing the project view reads: one request per project, what is held between renders,
// and which channel's version makes it stale.
//
// Nothing here touches the network or the real hub: `fetch` is a stub that records the URL it was
// given and answers what the case wants. What this does NOT cover: the endpoint itself, which is
// tests/routes/files/project-files.test.ts, and the view drawing the rows, which needs a DOM and
// is not run here.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, stubGated, type ClientState } from '../../fixtures/client.ts';
import { matchingFiles } from '../../../src/lib/state/sources/files.svelte.ts';

let client: ClientState;
let files: ClientState['files']['files'];
let invalidate: ClientState['files']['invalidate'];
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ files, invalidate } = client.files);
    ({ receive } = client.entities);
});

type Answer = { status: number; body: unknown };

/** The URLs the stub was asked for, in order. */
let asked: string[] = [];

/** Install a fetch that answers every request the same way, and record what it was asked. */
function serving(answer: Answer): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return Promise.resolve(
            new Response(JSON.stringify(answer.body), {
                status: answer.status,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
}

/** One answer of the endpoint, with a single row whose path is the one given. */
function listing(path: string): Answer {
    return {
        status: 200,
        body: {
            rows: [{ path, size: 12, mtime: 1 }],
            truncated: false,
            folder: 'projects/one'
        }
    };
}

/** A message on the `files` channel, which is what a write under a watched root publishes. */
function wrote(version: number): void {
    receive({ channel: 'files', version, payload: { root: '/hub' } });
}

/** Let the scheduled request run and its answer land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('the files of a project', () => {
    it('asks the endpoint once for an id and holds the answer', async () => {
        serving(listing('README.md'));
        wrote(1);

        expect(files('alpha').loading).toBe(true);
        await settle();

        const held = files('alpha');
        expect(held.rows).toEqual([{ path: 'README.md', size: 12, mtime: 1 }]);
        expect(held.folder).toBe('projects/one');
        expect(held.loading).toBe(false);
        expect(held.error).toBe('');

        files('alpha');
        await settle();
        expect(asked).toEqual(['/api/project-files?id=alpha']);
    });

    it('asks nothing more when the portfolio version moves, which no write under a folder does', async () => {
        serving(listing('README.md'));
        files('bravo');
        await settle();
        expect(asked).toHaveLength(1);

        receive({ channel: 'portfolio', version: 40, payload: { version: 40 } });
        files('bravo');
        await settle();
        receive({ channel: 'portfolio', version: 41, payload: { version: 41 } });
        files('bravo');
        await settle();
        expect(asked).toHaveLength(1);
    });

    it('asks again once the files version moved, and shows what came back', async () => {
        serving(listing('README.md'));
        files('charlie');
        await settle();
        expect(asked).toHaveLength(1);

        serving(listing('notes.md'));
        wrote(2);
        files('charlie');
        await settle();
        expect(asked).toHaveLength(1);
        expect(files('charlie').rows.map((row) => row.path)).toEqual(['notes.md']);
    });

    // Revert: in the files listener of state/sources/files.svelte.ts, take out the queries.mark
    // call.
    it('keeps the held rows showing after a files message, asks once on the next read, and shows the new rows', async () => {
        serving(listing('README.md'));
        files('golf');
        await settle();

        asked = [];
        const { release } = stubGated(
            asked,
            () => new Response(JSON.stringify(listing('later.md').body), { status: 200 })
        );
        wrote(3);
        expect(files('golf').rows.map((row) => row.path)).toEqual(['README.md']);
        files('golf');
        await settle();
        expect(files('golf').rows.map((row) => row.path)).toEqual(['README.md']);
        expect(files('golf').loading).toBe(false);
        expect(asked).toEqual(['/api/project-files?id=golf']);

        release();
        await settle();
        expect(files('golf').rows.map((row) => row.path)).toEqual(['later.md']);
        expect(asked).toHaveLength(1);
    });

    // Revert: in the files listener of state/sources/files.svelte.ts, mark with 'drop' or 'replace'
    // instead of 'wait'.
    it('shows the answer that was out when a files message came, and asks again on the next read', async () => {
        asked = [];
        const { release } = stubGated(
            asked,
            () => new Response(JSON.stringify(listing('a.md').body))
        );
        files('hotel');
        await settle();
        wrote(4);
        release();
        await settle();
        expect(files('hotel').rows.map((row) => row.path)).toEqual(['a.md']);
        await settle();
        expect(asked).toEqual(['/api/project-files?id=hotel', '/api/project-files?id=hotel']);
    });

    it('holds what the endpoint refused with instead of the rows', async () => {
        serving({ status: 404, body: { error: 'no such project' } });
        files('delta');
        await settle();
        expect(files('delta').error).toBe('no such project');
        expect(files('delta').rows).toEqual([]);
    });

    it('forgets one project on demand and nothing of any other', async () => {
        serving(listing('README.md'));
        files('echo');
        files('foxtrot');
        await settle();
        expect(files('echo').rows).toHaveLength(1);

        invalidate('echo');
        expect(files('echo').loading).toBe(true);
        expect(files('foxtrot').rows).toHaveLength(1);
        await settle();
    });

    it('asks nothing for an empty id', async () => {
        serving(listing('README.md'));
        expect(files('').loading).toBe(false);
        await settle();
        expect(asked).toEqual([]);
    });
});

describe('the project files a filter keeps', () => {
    it('are the rows whose path the query fuzzily matches, case and surrounding space aside', () => {
        const rows = [
            { path: 'manuscript/Main.tex', size: 10, mtime: 1 },
            { path: 'code/run.py', size: 20, mtime: 2 }
        ];
        expect(matchingFiles(rows, ' MAIN ')).toEqual([rows[0]]);
        expect(matchingFiles(rows, '')).toBe(rows);
    });

    // Red when matchingFiles goes back to substrings: 'mntx' is no substring of any path.
    it('keeps every row for no query, a row whose path holds the letters in order, and none for letters no path holds', () => {
        const rows = [
            { path: 'manuscript/main.tex', size: 10, mtime: 1 },
            { path: 'code/run.py', size: 20, mtime: 2 }
        ];
        expect(matchingFiles(rows, '')).toEqual(rows);
        expect(matchingFiles(rows, 'mntx').map((row) => row.path)).toContain('manuscript/main.tex');
        expect(matchingFiles(rows, 'qqq')).toEqual([]);
    });
});

describe('the answer of the project files endpoint', () => {
    const none = { rows: [], truncated: false, folder: '', error: '', loading: false };

    /** What the store holds for the id after one request that `response` answers. */
    async function read(response: Response): Promise<unknown> {
        vi.stubGlobal('fetch', () => Promise.resolve(response));
        files('kilo');
        await settle();
        return files('kilo');
    }

    /** A response whose json() answers `body` itself, with the status given. */
    function json(body: unknown, status = 200): Response {
        const ok = status >= 200 && status < 300;
        return { ok, status, json: () => Promise.resolve(body) } as unknown as Response;
    }

    it.each([
        ['a row without a path', [{ size: 1 }], []],
        ['a row with an empty path', [{ path: '' }], []],
        ['a row whose path is a number', [{ path: 3 }], []],
        ['items that are not maps', [3, null, 'x'], []],
        ['items that are lists', [[], ['a']], []],
        ['a size that is text', [{ path: 'a', size: '1' }], [{ path: 'a', size: 0, mtime: 0 }]],
        ['a time that is null', [{ path: 'a', mtime: null }], [{ path: 'a', size: 0, mtime: 0 }]],
        [
            'numbers that are not finite',
            [{ path: 'a', size: NaN, mtime: Infinity }],
            [{ path: 'a', size: NaN, mtime: Infinity }]
        ],
        [
            'numbers that are negative or fractional',
            [{ path: 'a', size: -1, mtime: 1.5 }],
            [{ path: 'a', size: -1, mtime: 1.5 }]
        ],
        [
            'a row with a key it was not asked for',
            [{ extra: 1, mtime: 2, size: 1, path: 'a' }],
            [{ path: 'a', size: 1, mtime: 2 }]
        ]
    ])('reads %s', async (_label, rows, expected) => {
        const held = (await read(json({ rows }))) as { rows: unknown[] };
        expect(held).toStrictEqual({ ...none, rows: expected });
        expect(held.rows.map((row) => Object.keys(row as object))).toEqual(
            expected.map((row) => Object.keys(row))
        );
    });

    it('holds a new list of new rows and not the list it was given', async () => {
        const rows = [{ path: 'a', size: 1, mtime: 2 }];
        const held = (await read(json({ rows }))) as { rows: unknown[] };
        expect(held.rows).not.toBe(rows);
        expect(held.rows[0]).not.toBe(rows[0]);
    });

    it.each([[{}], ['x'], [null], [3], [undefined]])(
        'holds no rows for rows that are %j',
        async (rows) => {
            expect(await read(json({ rows }))).toStrictEqual(none);
        }
    );

    it.each([[[]], ['x'], [7], [true]])('holds nothing for a successful body %j', async (body) => {
        expect(await read(json(body))).toStrictEqual(none);
    });

    it.each([
        [{ truncated: 'true' }, none],
        [{ truncated: 1 }, none],
        [{ truncated: true }, { ...none, truncated: true }],
        [{ folder: 3 }, none],
        [{ folder: 'projects/one' }, { ...none, folder: 'projects/one' }]
    ])('reads the fields beside the rows of %j', async (body, expected) => {
        expect(await read(json(body))).toStrictEqual(expected);
    });

    it.each([
        [{ error: 'no such project' }, 404, 'no such project'],
        [{ error: '' }, 404, ''],
        [{ error: null }, 404, '404'],
        [{}, 500, '500'],
        [[], 500, '500'],
        ['x', 502, '502'],
        [7, 500, '500']
    ])('says why a refused read %j at %i was refused', async (body, status, error) => {
        expect(await read(json(body, status))).toStrictEqual({ ...none, error });
    });

    it.each([[{ error: 3 }], [{ error: ['a'] }]])(
        'says the status for a refused read whose error is not text: %j',
        async (body) => {
            expect(await read(json(body, 404))).toStrictEqual({ ...none, error: '404' });
        }
    );

    it.each([['null'], ['<html>gateway</html>']])(
        'says the status of a refused read whose body is %s',
        async (text) => {
            expect(await read(new Response(text, { status: 503 }))).toStrictEqual({
                ...none,
                error: '503'
            });
        }
    );

    it.each([['null'], ['<html>gateway</html>']])(
        'says the status of a successful read whose body is %s',
        async (text) => {
            expect(await read(new Response(text))).toStrictEqual({ ...none, error: '200' });
        }
    );
});
