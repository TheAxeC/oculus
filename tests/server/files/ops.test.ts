// Layer 2, server test. The file operations of the Files view (server/files/fs/ops.ts, POST
// /api/ops) and the comparison of two files (GET /api/ops): create, rename, trash and delete under
// the served roots, each refusal in the order the server makes it, the request itself, and the
// comparison. Paste, upload and the guard on config/local.yml are tests/server/files/
// ops-paste.test.ts, over the same worlds (tests/server/files/ops-fixture.ts).
//
// Every root here is a directory under the system temporary directory, and the trash call is
// always a spy: the library is replaced by a mock for the whole file, so no case can move anything
// to the real Trash.
//
// What this does NOT cover: the menu that posts these requests and the questions that precede
// them, which are tests/views/sources/files/ and tests/state/sources/explorer/; a Trash that really
// takes a file, which is the library's and is seen at the look; a volume with no Trash.

import {
    chmodSync,
    lstatSync,
    readFileSync,
    readlinkSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { TEXT_LIMIT } from '../../../src/lib/data/file-ops.ts';
import { handleCompare } from '../../../src/lib/server/files/fs/ops.ts';
import { keepCopy, savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    INSENSITIVE,
    create,
    folder,
    names,
    spy,
    world,
    worldOver,
    type World
} from './ops-fixture.ts';

// The library is replaced for the whole file, so a case that hands in no spy of its own reaches
// this one, which moves nothing.
const library = vi.hoisted(() => ({ trash: vi.fn() }));
vi.mock('trash', () => ({ default: library.trash }));

describe('create', () => {
    it('makes an empty file in a folder and answers its path (case 1)', async () => {
        const w = world({}, ['dir']);
        const answer = await w.post(create('dir', 'a.md'));
        expect(answer.body).toEqual({ ok: true, path: 'dir/a.md' });
        expect(readFileSync(join(w.hub, 'dir/a.md'), 'utf8')).toBe('');
    });

    it('makes a folder when asked for one', async () => {
        const w = world({}, ['dir']);
        const answer = await w.post(create('dir', 'sub', true));
        expect(answer.body).toEqual({ ok: true, path: 'dir/sub' });
        expect(lstatSync(join(w.hub, 'dir/sub')).isDirectory()).toBe(true);
    });

    it('makes the folders between for a name of several segments (case 2)', async () => {
        const w = world();
        for (const name of ['x/y/z.md', 'x\\w.md', 'p//q.md', 'r/']) {
            expect((await w.post(create('', name))).body.ok).toBe(true);
        }
        expect(lstatSync(join(w.hub, 'x/y/z.md')).isFile()).toBe(true);
        expect(lstatSync(join(w.hub, 'x/w.md')).isFile()).toBe(true);
        expect(lstatSync(join(w.hub, 'p/q.md')).isFile()).toBe(true);
        expect(lstatSync(join(w.hub, 'r')).isFile()).toBe(true);
    });

    it('refuses a taken name, and the same name in another case where the volume reads it as taken (case 3)', async () => {
        const w = world({ 'readme.md': 'mine' });
        expect((await w.post(create('', 'readme.md'))).body).toEqual({
            ok: false,
            error: 'exists'
        });
        expect(readFileSync(join(w.hub, 'readme.md'), 'utf8')).toBe('mine');
        const upper = await w.post(create('', 'README.md'));
        if (INSENSITIVE) {
            expect(upper.body).toEqual({ ok: false, error: 'exists' });
            expect(names(w.hub)).toEqual(['readme.md']);
        } else {
            expect(upper.body.ok).toBe(true);
            expect(names(w.hub)).toEqual(['README.md', 'readme.md']);
        }
    });

    it('refuses the names the rule refuses, makes the ones it takes, and writes nothing for a refusal (case 4)', async () => {
        const w = world();
        const refused = [
            '',
            '  ',
            '.',
            '..',
            '../x',
            'a/../../b',
            '/a',
            '\\a',
            'a\0b',
            'b'.repeat(256)
        ];
        for (const name of refused) {
            const answer = await w.post(create('', name));
            expect({ name, body: answer.body }).toEqual({
                name,
                body: { ok: false, error: 'invalid_name' }
            });
        }
        expect(names(w.hub)).toEqual([]);
        expect((await w.post(create('', ' a.md'))).body.ok).toBe(true);
        expect((await w.post(create('', 'a.'))).body.ok).toBe(true);
        expect(names(w.hub)).toEqual([' a.md', 'a.']);
    });

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

    it('answers missing for a root whose folder was removed, and for a folder that is not there (case 5)', async () => {
        const gone = folder();
        const w = worldOver(
            [
                { key: 'gone', dir: join(gone, 'removed') },
                { key: 'hub', dir: gone }
            ],
            gone
        );
        expect((await w.post(create('', 'a.md', false, 'gone'))).body).toEqual({
            ok: false,
            error: 'missing'
        });
        expect((await w.post(create('nowhere', 'a.md'))).body).toEqual({
            ok: false,
            error: 'missing'
        });
    });

    it('refuses a name through a file as not a folder (case 6)', async () => {
        const w = world({ 'a.md': 'x' });
        expect((await w.post(create('', 'a.md/b.md'))).body).toEqual({
            ok: false,
            error: 'not_a_folder'
        });
        expect((await w.post(create('a.md', 'b.md'))).body).toEqual({
            ok: false,
            error: 'not_a_folder'
        });
    });

    it('refuses a name that walks through a link to a folder outside the root', async () => {
        const outside = folder({}, ['target']);
        const w = world();
        symlinkSync(join(outside, 'target'), join(w.hub, 'out'));
        expect((await w.post(create('', 'out/a.md'))).body).toEqual({
            ok: false,
            error: 'outside'
        });
        expect(names(join(outside, 'target'))).toEqual([]);
    });

    it('answers denied for a folder this machine will not let it write in (case 26)', async () => {
        const w = world({}, ['locked']);
        const locked = join(w.hub, 'locked');
        chmodSync(locked, 0o555);
        try {
            expect((await w.post(create('locked', 'a.md'))).body).toEqual({
                ok: false,
                error: 'denied'
            });
        } finally {
            chmodSync(locked, 0o755);
        }
    });

    it('answers exists to the second of two creates of one name while the first is held in the chain (case 27)', async () => {
        const w = world();
        let release = (): void => undefined;
        const gate = new Promise<void>((done) => (release = done));
        const first = w.post(create('', 'a.md'), { slow: () => gate });
        await new Promise((done) => setTimeout(done, 10));
        const second = w.post(create('', 'a.md'));
        await new Promise((done) => setTimeout(done, 10));
        release();
        expect((await first).body).toEqual({ ok: true, path: 'a.md' });
        expect((await second).body).toEqual({ ok: false, error: 'exists' });
    });
});

describe('rename', () => {
    const rename = (path: string, name: string, root = 'hub') => ({
        op: 'rename',
        root,
        path,
        name
    });

    it('moves the bytes to the new name and leaves nothing under the old one (case 7)', async () => {
        const w = world({ 'a.md': 'bytes' });
        const answer = await w.post(rename('a.md', 'b.md'));
        expect(answer.body).toEqual({ ok: true, path: 'b.md' });
        expect(readFileSync(join(w.hub, 'b.md'), 'utf8')).toBe('bytes');
        expect(names(w.hub)).toEqual(['b.md']);
    });

    it('refuses a different file that already holds the new name, in any case (case 7)', async () => {
        const w = world({ 'a.md': 'a', 'b.md': 'b' });
        const answer = await w.post(rename('a.md', 'B.md'));
        if (INSENSITIVE) expect(answer.body).toEqual({ ok: false, error: 'exists' });
        else expect(answer.body.ok).toBe(true);
        const again = world({ 'a.md': 'a', 'b.md': 'b' });
        expect((await again.post(rename('a.md', 'b.md'))).body).toEqual({
            ok: false,
            error: 'exists'
        });
    });

    it('renames a name to the same name in another case, which readdir lists (case 8)', async () => {
        const w = world({ 'a.md': 'a' });
        expect((await w.post(rename('a.md', 'A.md'))).body).toEqual({ ok: true, path: 'A.md' });
        expect(names(w.hub)).toEqual(['A.md']);
    });

    it('renames a link as the link, never its target (case 9)', async () => {
        const w = world({ 'target.md': 'kept' });
        symlinkSync('target.md', join(w.hub, 'l'));
        expect((await w.post(rename('l', 'm'))).body).toEqual({ ok: true, path: 'm' });
        expect(lstatSync(join(w.hub, 'm')).isSymbolicLink()).toBe(true);
        expect(readlinkSync(join(w.hub, 'm'))).toBe('target.md');
        expect(names(w.hub)).toEqual(['m', 'target.md']);
        expect(readFileSync(join(w.hub, 'target.md'), 'utf8')).toBe('kept');
    });

    it('refuses to move a folder into its own subtree, and the root itself (case 10)', async () => {
        const w = world({}, ['dir']);
        expect((await w.post(rename('dir', 'dir/sub/x'))).body).toEqual({
            ok: false,
            error: 'into_itself'
        });
        expect(names(join(w.hub, 'dir'))).toEqual([]);
        expect((await w.post(rename('', 'x'))).body).toEqual({ ok: false, error: 'root' });
    });

    it('moves an item into folders its new name makes, and refuses a name the rule refuses', async () => {
        const w = world({ 'a.md': 'a' });
        expect((await w.post(rename('a.md', 'x/y/b.md'))).body).toEqual({
            ok: true,
            path: 'x/y/b.md'
        });
        expect(readFileSync(join(w.hub, 'x/y/b.md'), 'utf8')).toBe('a');
        expect((await w.post(rename('x/y/b.md', '../b.md'))).body).toEqual({
            ok: false,
            error: 'invalid_name'
        });
    });

    it('answers missing for an item that is not there and outside for a path out of the root', async () => {
        const w = world();
        expect((await w.post(rename('gone.md', 'b.md'))).body).toEqual({
            ok: false,
            error: 'missing'
        });
        expect((await w.post(rename('../x', 'b.md'))).body).toEqual({
            ok: false,
            error: 'outside'
        });
    });
});

describe('trash and delete', () => {
    const trash = (paths: string[], root = 'hub') => ({ op: 'trash', root, paths });
    const remove = (paths: string[], root = 'hub') => ({ op: 'delete', root, paths });

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

    it('hands the library a name with glob characters as that name alone (case 12)', async () => {
        const w = world({ '*.md': 'star', 'a.md': 'a' });
        library.trash.mockClear();
        await w.post(trash(['*.md']));
        expect(library.trash.mock.calls).toEqual([[join(w.hub, '*.md'), { glob: false }]]);
    });

    it('stops at the first failure and says which items went before it (case 13)', async () => {
        const w = world({ 'a.md': 'a', 'b.md': 'b' });
        const trashed = spy().mockImplementation((path) =>
            path.endsWith('b.md') ? Promise.reject(new Error('no Trash')) : Promise.resolve()
        );
        const answer = await w.post(trash(['a.md', 'b.md']), { trash: trashed });
        expect(answer.body).toEqual({
            ok: false,
            error: 'trash_failed',
            done: ['a.md'],
            failed: 'b.md'
        });
    });

    it('answers missing for an item that is gone, and root for the root, before trashing it', async () => {
        const w = world({ 'a.md': 'a' });
        const trashed = spy();
        expect((await w.post(trash(['gone.md']), { trash: trashed })).body).toEqual({
            ok: false,
            error: 'missing',
            done: [],
            failed: 'gone.md'
        });
        expect((await w.post(trash(['']), { trash: trashed })).body).toEqual({
            ok: false,
            error: 'root',
            done: [],
            failed: ''
        });
        expect(trashed).not.toHaveBeenCalled();
    });

    it('removes each item for good (case 14)', async () => {
        const w = world({ 'a.md': 'a', 'dir/b.md': 'b', 'keep.md': 'k' });
        const answer = await w.post(remove(['a.md', 'dir']));
        expect(answer.body.ok).toBe(true);
        expect(names(w.hub)).toEqual(['keep.md']);
    });

    it('removes a link and keeps what it points at', async () => {
        const w = world({ 'target.md': 'kept' });
        symlinkSync('target.md', join(w.hub, 'l'));
        expect((await w.post(remove(['l']))).body.ok).toBe(true);
        expect(names(w.hub)).toEqual(['target.md']);
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

    it('does nothing and says ok for an empty list (case 25)', async () => {
        const w = world({ 'a.md': 'a' });
        const trashed = spy();
        for (const body of [
            { op: 'trash', root: 'hub', paths: [] },
            { op: 'delete', root: 'hub', paths: [] },
            { op: 'paste', mode: 'copy', items: [], root: 'hub', path: '', replace: false }
        ]) {
            expect((await w.post(body, { trash: trashed })).body.ok).toBe(true);
        }
        expect(names(w.hub)).toEqual(['a.md']);
        expect(trashed).not.toHaveBeenCalled();
    });
});

describe('the comparison of two files', () => {
    const compare = (w: World, file: string, against: string) =>
        handleCompare(
            new URL(
                `http://localhost/api/ops?${new URLSearchParams({
                    root: 'hub',
                    path: file,
                    withRoot: 'hub',
                    withPath: against
                }).toString()}`
            ),
            w.roots
        );
    const read = async (response: Response) =>
        (await response.json()) as Record<string, unknown> & { files?: Record<string, unknown>[] };

    it('reads the selected file as the left side and the file asked for as the right (case 28)', async () => {
        const w = world({ 'a.md': 'new\n', 'b.md': 'old\n' });
        const body = await read(compare(w, 'a.md', 'b.md'));
        expect(body.ok).toBe(true);
        expect(body.files).toEqual([
            {
                oldPath: 'hub:b.md',
                newPath: 'hub:a.md',
                head: [],
                binary: false,
                encoded: false,
                original: 'old\n',
                modified: 'new\n'
            }
        ]);
    });

    it('marks a binary file and gives it no text (case 28)', async () => {
        const w = world({ 'a.md': 'text\n' });
        writeFileSync(join(w.hub, 'b.bin'), Buffer.from([0, 1, 2, 0, 255]));
        const body = await read(compare(w, 'a.md', 'b.bin'));
        expect(body.files?.[0]).toMatchObject({ binary: true, original: '', modified: '' });
    });

    it('refuses a folder on either side, a file over the limit, a side that is gone and a path out (case 28)', async () => {
        const w = world({ 'a.md': 'a', 'b.md': 'b' }, ['dir']);
        writeFileSync(join(w.hub, 'huge.txt'), 'x'.repeat(TEXT_LIMIT + 1));
        expect((await read(compare(w, 'dir', 'b.md'))).error).toBe('not_a_folder');
        expect((await read(compare(w, 'a.md', 'dir'))).error).toBe('not_a_folder');
        expect((await read(compare(w, 'huge.txt', 'b.md'))).error).toBe('too_large');
        expect((await read(compare(w, 'a.md', 'gone.md'))).error).toBe('missing');
        expect((await read(compare(w, 'gone.md', 'a.md'))).error).toBe('missing');
        expect((await read(compare(w, '../x', 'a.md'))).error).toBe('outside');
    });

    it('answers an empty diff for a file with itself (case 28)', async () => {
        const w = world({ 'a.md': 'same\n' });
        const body = await read(compare(w, 'a.md', 'a.md'));
        expect(body.files?.[0]).toMatchObject({ original: 'same\n', modified: 'same\n' });
    });

    // Revert: read `save=` as a path of the working tree instead of a copy of the history.
    it('reads a copy of the local history as the left side when `save=` names one', async () => {
        const w = world({ 'a.md': 'old\n' });
        const history = join(scratchDir('oculus-compare-'), 'history');
        const kept = keepCopy(history, join(w.hub, 'a.md'), 'save');
        writeFileSync(join(w.hub, 'a.md'), 'new\n');
        const id = savesOf(history, join(w.hub, 'a.md')).saves[0].id;
        expect(kept.ok).toBe(true);
        const ask = (query: Record<string, string>) =>
            handleCompare(
                new URL(`http://localhost/api/ops?${new URLSearchParams(query).toString()}`),
                w.roots,
                history
            );

        const body = await read(ask({ root: 'hub', path: 'a.md', save: id }));
        expect(body.files).toEqual([
            {
                oldPath: `hub:a.md@${id}`,
                newPath: 'hub:a.md',
                head: [],
                binary: false,
                encoded: false,
                original: 'old\n',
                modified: 'new\n'
            }
        ]);
        // an id the file does not list, and a path out of the root, are refused
        expect((await read(ask({ root: 'hub', path: 'a.md', save: 'nope' }))).error).toBe(
            'missing'
        );
        expect((await read(ask({ root: 'hub', path: '../x', save: id }))).error).toBe('outside');
    });

    it("reads the machine's own file as the source tab does, and nothing outside a root", async () => {
        const hub = folder({ 'tools/oculus/config/local.yml': 'secret: 1\n', 'a.md': 'a' });
        const w = worldOver(
            [
                { key: 'hub', dir: hub },
                { key: 'engine', dir: join(hub, 'tools/oculus/config') }
            ],
            hub
        );
        const response = handleCompare(
            new URL(
                'http://localhost/api/ops?root=hub&path=a.md&withRoot=engine&withPath=local.yml'
            ),
            w.roots
        );
        expect((await read(response)).files?.[0]).toMatchObject({ original: 'secret: 1\n' });
        const out = handleCompare(
            new URL('http://localhost/api/ops?root=nowhere&path=a.md&withRoot=hub&withPath=a.md'),
            w.roots
        );
        expect((await read(out)).error).toBe('outside');
    });
});
