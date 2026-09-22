// What the /api/changes route answers: one page of the log, the page before it, and the refusal a
// request from another origin gets.
//
// The log is a file under the system temporary directory, asserted to be inside it before anything
// is written, so nothing here reads or writes ~/.oculus/changes.jsonl.

import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PAGE, handleChanges, logChanges } from '../../../src/lib/server/git/changes.ts';
import { fsWrites } from '../../../src/lib/server/files/fs.ts';
import type { Change, ChangeLog } from '../../../src/lib/server/git/changes.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const HOST = '127.0.0.1:8791';

/** A log of its own, under the system temporary directory. */
function log(keep = 500): ChangeLog {
    const dir = scratchDir('oculus-changes-route-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const file = join(dir, 'changes.jsonl');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    return { file, keep, writes: fsWrites() };
}

/** A request as the page makes it, with whatever headers a case wants instead. */
function request(query = '', headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/changes${query}`, {
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            ...headers
        }
    });
}

/** `count` changes appended one after another, oldest first. */
async function fill(into: ChangeLog, count: number): Promise<void> {
    for (let at = 0; at < count; at += 1) {
        await logChanges(into, 'manifest', [
            {
                file: 'projects/manuscripts/alpha/project.yml',
                key: 'alpha',
                field: `f${at}`,
                before: null,
                after: at,
                undo: 'field'
            }
        ]);
    }
}

/** What the route answered. */
async function answer(response: Response): Promise<{ changes: Change[]; page?: number }> {
    return (await response.json()) as { changes: Change[]; page?: number };
}

describe('the change log endpoint', () => {
    it('answers the newest page first, with the page size it used', async () => {
        const into = log();
        await fill(into, 3);
        const response = handleChanges(request(), into);
        expect(response.status).toBe(200);
        const body = await answer(response);
        expect(body.page).toBe(PAGE);
        expect(body.changes.map((one) => one.field)).toEqual(['f2', 'f1', 'f0']);
    });

    it('answers the page before the moment `before` names', async () => {
        const into = log();
        await fill(into, PAGE + 3);
        const first = await answer(handleChanges(request(), into));
        expect(first.changes).toHaveLength(PAGE);
        const oldest = first.changes[first.changes.length - 1].at;
        const older = await answer(
            handleChanges(request(`?before=${encodeURIComponent(oldest)}`), into)
        );
        expect(older.changes.map((one) => one.field)).toEqual(['f2', 'f1', 'f0']);
        // The page before the oldest row never repeats a row the page above it already showed.
        expect(older.changes.every((one) => one.at < oldest)).toBe(true);
    });

    it('answers the page size it used, and every row of a log capped below it', async () => {
        const into = log(10);
        await fill(into, 18);
        const body = await answer(handleChanges(request(), into));
        // The cap bounds the file, not the read: a page cut to the cap would put the rows past it
        // out of the view's reach, since the view walks back by the oldest row it holds.
        expect(body.page).toBe(PAGE);
        expect(body.changes).toHaveLength(18);
        expect(body.changes[0].field).toBe('f17');
        expect(body.changes[body.changes.length - 1].field).toBe('f0');
    });

    it('refuses a request that did not come from this page', async () => {
        const into = log();
        await fill(into, 1);
        const response = handleChanges(
            request('', { origin: 'http://evil.example', 'sec-fetch-site': 'cross-site' }),
            into
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'origin' });
    });

    it('answers an empty page for a process that holds no log', async () => {
        const response = handleChanges(request(), undefined);
        expect(response.status).toBe(200);
        expect((await answer(response)).changes).toEqual([]);
    });

    it('answers an empty page for a log whose file is not there yet', async () => {
        const response = handleChanges(request(), log());
        expect(response.status).toBe(200);
        expect((await answer(response)).changes).toEqual([]);
    });
});
