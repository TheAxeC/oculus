// The file listing the project view reads: one request per project, what is held between renders,
// and which channel's version makes it stale.
//
// Nothing here touches the network or the real hub: `fetch` is a stub that records the URL it was
// given and answers what the case wants. What this does NOT cover: the endpoint itself, which is
// tests/routes/files/project-files.test.ts, and the view drawing the rows, which needs a DOM and
// is not run here.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
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
