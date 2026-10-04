// Layer 2, route tests. What the /api/changes route answers: one page of the log and the page
// before it. Where the request came from is judged before the route, by the origin guard
// tests/server/root/hooks-server.test.ts covers.
//
// The log is a file under the system temporary directory, asserted to be inside it before anything
// is written, so nothing here reads or writes ~/.oculus/changes.jsonl.
//
// A case that takes 100 ms or more in a run of its own is tagged slow; the others run in npm test.

import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { PAGE, handleChanges, logChanges } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import type { Change, ChangeLog } from '../../../src/lib/server/core/changes.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const HOST = '127.0.0.1:8791';

/** A log of its own, under the system temporary directory. */
function log(keep = 500): ChangeLog {
    const dir = scratchDir('oculus-changes-route-');
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

    it('answers the page before the moment `before` names', { tags: ['slow'] }, async () => {
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
