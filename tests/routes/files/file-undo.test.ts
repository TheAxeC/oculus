// Layer 2, route tests. A file operation in the change log and its undo: what POST /api/ops
// (server/files/fs/ops.ts) records for each operation that changed something, and what POST
// /api/write with the kind `undo` (server/edit/writes/file-undo.ts) checks and does to take it
// back.
//
// The roots, the history folder and the change log are directories under the system temporary
// directory, asserted inside it before anything is written, and the Trash is a spy, so nothing is
// moved to the real Trash and ~/.oculus is never read or written.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no case
// pays for it.

import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { FileStamp } from '../../../src/lib/data/file-ops.ts';
import type { Root } from '../../../src/lib/server/files/workspace/folders.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { logChanges } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { stampOf } from '../../../src/lib/server/files/fs/file-changes.ts';
import { handleOps, type OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import { DELETE_MAX_BYTES } from '../../../src/lib/server/files/fs/history.ts';
import { it, test } from '../../fixtures/scratch.ts';
import { TOKEN as OPS_TOKEN, spy } from '../../server/files/ops-fixture.ts';
import { TOKEN, changesOf, request, target, warmConfig } from '../edit/write-fixture.ts';

const library = vi.hoisted(() => ({ trash: vi.fn() }));
vi.mock('trash', () => ({ default: library.trash }));

type World = { into: PrimaryTarget; ops: OpsTarget; hub: string; config: string };

/** A write target and an ops target over one served folder inside the target's temp hub. */
function world(files: Record<string, string> = {}, dirs: string[] = []): World {
    const into = target();
    const hub = join(into.hub, 'served');
    expect(resolve(hub).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    mkdirSync(hub, { recursive: true });
    for (const dir of dirs) mkdirSync(join(hub, dir), { recursive: true });
    for (const [name, text] of Object.entries(files)) {
        mkdirSync(join(hub, name, '..'), { recursive: true });
        writeFileSync(join(hub, name), text);
    }
    const real = realpathSync(hub);
    const roots = [{ key: 'hub', dir: real }];
    const history = join(into.hub, 'history');
    const writes = fsWrites();
    const config = join(real, 'oculus', 'config');
    into.files = { roots: () => roots, config, history, writes };
    return {
        into,
        hub: real,
        config,
        ops: { roots, config, writes, changes: into.changes, history }
    };
}

async function post(w: World, body: unknown, trash = spy()) {
    const response = await handleOps(
        new Request('http://localhost/api/ops', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': OPS_TOKEN },
            body: JSON.stringify(body)
        }),
        OPS_TOKEN,
        w.ops,
        { trash }
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** The records the file operations left, newest first. */
function records(w: World) {
    return changesOf(w.into).filter((one) => one.kind === 'files');
}

async function undo(w: World, at: string, trash = spy()) {
    const response = await handleWrite(request({ kind: 'undo', at }), TOKEN, w.into, { trash });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

const stamps = (value: unknown) => value as FileStamp[];

test.beforeAll(warmConfig);

describe('what an operation records', () => {
    it('appends one files record for a create, with the path stamped after', async () => {
        const w = world({}, ['d']);
        await post(w, { op: 'create', root: 'hub', path: 'd', name: 'a.md', folder: false });
        const [one] = records(w);
        expect(one).toMatchObject({
            kind: 'files',
            key: 'files',
            field: 'create',
            undo: 'file'
        });
        expect(one.before).toEqual([]);
        expect(stamps(one.after)).toEqual([
            {
                path: join(w.hub, 'd', 'a.md'),
                kind: 'file',
                size: 0,
                mtime: expect.any(Number) as number
            }
        ]);
        expect(records(w)).toHaveLength(1);
    });

    it('records a rename with both paths, and a paste move and a paste copy by their mode', async () => {
        const w = world({ 'a.txt': 'aa', 'b.txt': 'bb' }, ['d']);
        await post(w, { op: 'rename', root: 'hub', path: 'a.txt', name: 'c.txt' });
        await post(w, {
            op: 'paste',
            mode: 'move',
            items: [{ root: 'hub', path: 'c.txt' }],
            root: 'hub',
            path: 'd',
            replace: false
        });
        await post(w, {
            op: 'paste',
            mode: 'copy',
            items: [{ root: 'hub', path: 'b.txt' }],
            root: 'hub',
            path: 'd',
            replace: false
        });
        const [copy, move, rename] = records(w);
        expect([rename.field, move.field, copy.field]).toEqual(['rename', 'move', 'copy']);
        expect(stamps(rename.before)[0].path).toBe(join(w.hub, 'a.txt'));
        expect(stamps(rename.after)[0].path).toBe(join(w.hub, 'c.txt'));
        expect(stamps(move.after)[0].path).toBe(join(w.hub, 'd', 'c.txt'));
        expect(copy.before).toEqual([]);
        expect(stamps(copy.after)[0].path).toBe(join(w.hub, 'd', 'b.txt'));
    });

    it('records an upload', async () => {
        const w = world({}, ['d']);
        await post(w, {
            op: 'upload',
            root: 'hub',
            path: 'd',
            name: 'u.txt',
            data: Buffer.from('hello').toString('base64'),
            replace: false
        });
        const [one] = records(w);
        expect(one.field).toBe('upload');
        expect(stamps(one.after)[0]).toMatchObject({ kind: 'file', size: 5 });
    });

    it('keeps the content of a trashed file of 1 KB, and none of a folder or a file over 5 MB', async () => {
        const w = world({ 'small.txt': 'x'.repeat(1024) }, ['folder']);
        writeFileSync(join(w.hub, 'big.bin'), Buffer.alloc(DELETE_MAX_BYTES + 1, 1));
        await post(w, { op: 'trash', root: 'hub', paths: ['small.txt', 'folder', 'big.bin'] });
        const [one] = records(w);
        expect(one.field).toBe('trash');
        const before = stamps(one.before);
        expect(before.map((s) => [s.path.split('/').at(-1), s.kind, s.kept !== undefined])).toEqual(
            [
                ['small.txt', 'file', true],
                ['folder', 'dir', false],
                ['big.bin', 'file', false]
            ]
        );
        expect(one.after).toEqual([]);
    });
});

describe('taking a create back', () => {
    it('moves the file to the Trash while it is unchanged, and records the reverse', async () => {
        const w = world({}, ['d']);
        await post(w, { op: 'create', root: 'hub', path: 'd', name: 'a.md', folder: false });
        const [made] = records(w);
        const trash = spy();
        const answer = await undo(w, made.at, trash);
        expect(answer.status).toBe(200);
        expect(trash).toHaveBeenCalledTimes(1);
        expect(trash.mock.calls[0][0]).toBe(join(w.hub, 'd', 'a.md'));
        const [reverse] = records(w);
        expect(reverse).toMatchObject({ field: 'trash', undoes: made.at, undo: 'file' });
    });
});

describe('taking a rename back', () => {
    it('moves the file back to its old name', async () => {
        const w = world({ 'a.txt': 'aa' });
        await post(w, { op: 'rename', root: 'hub', path: 'a.txt', name: 'b.txt' });
        const [renamed] = records(w);
        const answer = await undo(w, renamed.at);
        expect(answer.status).toBe(200);
        expect(readFileSync(join(w.hub, 'a.txt'), 'utf8')).toBe('aa');
        expect(existsSync(join(w.hub, 'b.txt'))).toBe(false);
        // The undo is a record that can itself be taken back: the file goes forward again.
        const [reverse] = records(w);
        expect(reverse).toMatchObject({ field: 'rename', undoes: renamed.at });
        expect((await undo(w, reverse.at)).status).toBe(200);
        expect(existsSync(join(w.hub, 'b.txt'))).toBe(true);
    });

    it('takes a move back to the folder it came from', async () => {
        const w = world({ 'a.txt': 'aa' }, ['d']);
        await post(w, {
            op: 'paste',
            mode: 'move',
            items: [{ root: 'hub', path: 'a.txt' }],
            root: 'hub',
            path: 'd',
            replace: false
        });
        const [moved] = records(w);
        expect((await undo(w, moved.at)).status).toBe(200);
        expect(existsSync(join(w.hub, 'a.txt'))).toBe(true);
        expect(existsSync(join(w.hub, 'd', 'a.txt'))).toBe(false);
    });
});

describe('taking a trash back', () => {
    it('writes a 1 KB file back with its text', async () => {
        const text = 'kept text\n'.repeat(100);
        const w = world({ 'a.txt': text });
        const trash = vi.fn(() => {
            rmSync(join(w.hub, 'a.txt'));
            return Promise.resolve();
        });
        await post(w, { op: 'trash', root: 'hub', paths: ['a.txt'] }, trash);
        const [trashed] = records(w);
        const answer = await undo(w, trashed.at);
        expect(answer.status).toBe(200);
        expect(readFileSync(join(w.hub, 'a.txt'), 'utf8')).toBe(text);
        expect(records(w)[0]).toMatchObject({ field: 'create', undoes: trashed.at });
    });
});

describe('what an undo is held to', () => {
    it("never trashes a hub's .oculus/local.yml, even when a record names it", async () => {
        const w = world({ '.oculus/local.yml': 'port: 8800\n' });
        const own = join(w.hub, '.oculus', 'local.yml');
        const roots: Root[] = [
            { key: 'hub', dir: w.hub, hub: true },
            { key: 'dot', dir: join(w.hub, '.oculus') }
        ];
        w.into.files = { roots: () => roots, config: w.config, writes: fsWrites() };
        const stamp = stampOf(own);
        await logChanges(w.into.changes, 'files', [
            { file: own, key: 'files', field: 'create', before: [], after: [stamp], undo: 'file' }
        ]);
        const [forged] = records(w);
        const trash = spy();
        expect(await undo(w, forged.at, trash)).toEqual({ status: 404, body: { error: 'gone' } });
        expect(trash).not.toHaveBeenCalled();
        expect(existsSync(own)).toBe(true);
    });

    it.each([
        ['a workspace folder over the oculus config folder', true],
        ['the hub folder that holds the oculus config folder', false]
    ])(
        "never trashes oculus's own config/local.yml, listed through %s, even when a record names it",
        async (_where, listed) => {
            const w = world({ 'oculus/config/local.yml': 'port: 8800\n' });
            const own = join(w.config, 'local.yml');
            const roots: Root[] = [{ key: 'hub', dir: w.hub, hub: true }];
            if (listed) roots.push({ key: 'oculus', dir: w.config });
            w.into.files = { roots: () => roots, config: w.config, writes: fsWrites() };
            const stamp = stampOf(own);
            await logChanges(w.into.changes, 'files', [
                {
                    file: own,
                    key: 'files',
                    field: 'create',
                    before: [],
                    after: [stamp],
                    undo: 'file'
                }
            ]);
            const [forged] = records(w);
            const trash = spy();
            expect(await undo(w, forged.at, trash)).toEqual({
                status: 404,
                body: { error: 'gone' }
            });
            expect(trash).not.toHaveBeenCalled();
            expect(existsSync(own)).toBe(true);
        }
    );
});
