// Layer 2, server test. The file operations of the Files view (server/files/fs/ops.ts, POST
// /api/ops): create, trash under the served roots, each refusal in the order the server makes it,
// the request itself. Paste and upload are tests/server/files/ops-paste.test.ts, over the same
// worlds (tests/server/files/ops-fixture.ts).
//
// Every root here is a directory under the system temporary directory, and the trash call is
// always a spy: the library is replaced by a mock for the whole file, so no case can move anything
// to the real Trash.
//
// What this does NOT cover: the menu that posts these requests and the questions that precede
// them, which are tests/views/sources/files/ and tests/state/sources/explorer/; a Trash that really
// takes a file, which is the library's and is seen at the look; a volume with no Trash.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import { create, names, spy, world } from './ops-fixture.ts';

// The library is replaced for the whole file, so a case that hands in no spy of its own reaches
// this one, which moves nothing.
const library = vi.hoisted(() => ({ trash: vi.fn() }));
vi.mock('trash', () => ({ default: library.trash }));

describe('create', () => {
    it('refuses a path that climbs out, a root not served and an empty root key (case 5)', async () => {
        const w = world({}, ['dir']);
        expect((await w.post(create('../../etc', 'a.md'))).body).toEqual({
            ok: false,
            error: 'outside'
        });
        expect((await w.post(create('dir', 'a.md', false, 'nowhere'))).body).toEqual({
            ok: false,
            error: 'outside'
        });
        expect((await w.post(create('dir', 'a.md', false, ''))).body).toEqual({
            ok: false,
            error: 'outside'
        });
    });
});

describe('trash and delete', () => {
    const trash = (paths: string[], root = 'hub') => ({ op: 'trash', root, paths });

    it('trashes each item once, in order, by its absolute path and with `glob: false` (case 11)', async () => {
        const w = world({ 'a.md': 'a', 'dir/b.md': 'b' });
        const trashed = spy();
        const answer = await w.post(trash(['a.md', 'dir', 'dir/b.md', 'a.md']), { trash: trashed });
        expect(answer.body.ok).toBe(true);
        expect(trashed.mock.calls).toEqual([
            [join(w.hub, 'a.md'), { glob: false }],
            [join(w.hub, 'dir'), { glob: false }]
        ]);
    });
});

describe('the request itself', () => {
    it('refuses a request without the token, and one that is no operation (case 25)', async () => {
        const w = world({ 'a.md': 'a' });
        const bare = await w.post(create('', 'x.md'), {}, {});
        expect(bare).toEqual({ status: 403, body: { error: 'token' } });
        for (const body of [
            [],
            { op: 'format' },
            { op: 'create', root: 'hub' },
            { op: 'trash', root: 'hub', paths: [1] },
            { op: 'paste', mode: 'swap', items: [], root: 'hub', path: '', replace: false }
        ]) {
            const answer = await w.post(body);
            expect({ body, answer }).toEqual({
                body,
                answer: { status: 400, body: { error: 'not-an-action' } }
            });
        }
        expect(await w.post('not json {')).toEqual({ status: 400, body: { error: 'not-json' } });
        expect(names(w.hub)).toEqual(['a.md']);
    });
});
