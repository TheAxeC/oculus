// Layer 2, server test. Paste (copy and move) and upload under the served roots, and the guard on
// the machine's own config/local.yml, over the worlds of tests/server/files/ops-fixture.ts. Create,
// rename, trash, delete and the comparison are tests/server/files/ops.test.ts.
//
// Every root here is a directory under the system temporary directory, the engine's `config/`
// folder is a scratch one holding a fixture `local.yml` of its own, and the trash call is always a
// spy: the library is replaced by a mock for the whole file, so no case can move anything to the
// real Trash.
//
// What this does NOT cover: the menu that posts these requests and the questions that precede
// them, which are tests/views/sources/files/ and tests/state/sources/explorer/; a Trash that really
// takes a file, which is the library's and is seen at the look; a volume with no Trash.
//
// A case that takes 100 ms or more in a run of its own, starts a process or waits on a timer is
// tagged slow.

import {
    existsSync,
    lstatSync,
    readFileSync,
    readlinkSync,
    renameSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { MAX_UPLOAD_BYTES } from '../../../src/lib/data/file-ops.ts';
import { it } from '../../fixtures/scratch.ts';
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
vi.mock('trash', () => ({ default: vi.fn() }));

describe('paste', () => {
    const paste = (
        mode: 'copy' | 'move',
        items: { root: string; path: string }[],
        path: string,
        replace = false,
        root = 'hub'
    ) => ({ op: 'paste', mode, items, root, path, replace });
    const at = (path: string, root = 'hub') => ({ root, path });

    it('copies into its own folder under the name `copy`, then `copy 2` (case 15)', async () => {
        const w = world({ 'report.md': 'r', '.env': 'e', 'notes/n.md': 'n' });
        const first = await w.post(paste('copy', [at('report.md')], ''));
        expect(first.body).toEqual({ ok: true, paths: ['report copy.md'] });
        const second = await w.post(paste('copy', [at('report.md')], ''));
        expect(second.body).toEqual({ ok: true, paths: ['report copy 2.md'] });
        await w.post(paste('copy', [at('notes')], ''));
        await w.post(paste('copy', [at('.env')], ''));
        expect(names(w.hub)).toEqual([
            '.env',
            '.env copy',
            'notes',
            'notes copy',
            'report copy 2.md',
            'report copy.md',
            'report.md'
        ]);
        expect(readFileSync(join(w.hub, 'notes copy/n.md'), 'utf8')).toBe('n');
    });

    it('refuses a move onto a taken name, and with replace sends the old item to the trash first (case 16)', async () => {
        const w = world({ 'a.md': 'new', 'sub/a.md': 'old' });
        const trashed = spy();
        expect((await w.post(paste('move', [at('a.md')], 'sub'), { trash: trashed })).body).toEqual(
            { ok: false, error: 'exists', done: [], failed: 'a.md' }
        );
        expect(readFileSync(join(w.hub, 'sub/a.md'), 'utf8')).toBe('old');
        const replaced = await w.post(paste('move', [at('a.md')], 'sub', true), {
            trash: trashed
        });
        expect(replaced.body.ok).toBe(true);
        expect(trashed.mock.calls).toEqual([[join(w.hub, 'sub/a.md'), { glob: false }]]);
        expect(readFileSync(join(w.hub, 'sub/a.md'), 'utf8')).toBe('new');
        expect(existsSync(join(w.hub, 'a.md'))).toBe(false);
    });

    it('moves nothing when the trash fails on a replace (case 16)', async () => {
        const w = world({ 'a.md': 'new', 'sub/a.md': 'old' });
        const trashed = spy().mockRejectedValue(new Error('no Trash'));
        const answer = await w.post(paste('move', [at('a.md')], 'sub', true), { trash: trashed });
        expect(answer.body).toEqual({
            ok: false,
            error: 'trash_failed',
            done: [],
            failed: 'a.md'
        });
        expect(readFileSync(join(w.hub, 'a.md'), 'utf8')).toBe('new');
        expect(readFileSync(join(w.hub, 'sub/a.md'), 'utf8')).toBe('old');
    });

    it('refuses a folder pasted into itself or below itself, by move and by copy (case 17)', async () => {
        const w = world({}, ['dir/inner']);
        for (const mode of ['move', 'copy'] as const) {
            for (const into of ['dir/inner', 'dir']) {
                const answer = await w.post(paste(mode, [at('dir')], into));
                expect(answer.body).toEqual({
                    ok: false,
                    error: 'into_itself',
                    done: [],
                    failed: 'dir'
                });
            }
        }
        expect(names(join(w.hub, 'dir'))).toEqual(['inner']);
        expect(names(join(w.hub, 'dir/inner'))).toEqual([]);
    });

    it('does nothing for a move into the folder the item is in (case 18)', async () => {
        const w = world({ 'a.md': 'a', 'sub/b.md': 'b' });
        const trashed = spy();
        expect((await w.post(paste('move', [at('a.md')], ''), { trash: trashed })).body.ok).toBe(
            true
        );
        expect(
            (await w.post(paste('move', [at('sub/b.md')], 'sub'), { trash: trashed })).body.ok
        ).toBe(true);
        expect(names(w.hub)).toEqual(['a.md', 'sub']);
        expect(names(join(w.hub, 'sub'))).toEqual(['b.md']);
        expect(trashed).not.toHaveBeenCalled();
    });

    it('copies across two roots (case 19)', async () => {
        const first = folder({ 'a.md': 'a' });
        const second = folder({}, ['into']);
        const w = worldOver(
            [
                { key: 'one', dir: first },
                { key: 'two', dir: second }
            ],
            first
        );
        const answer = await w.post(paste('copy', [at('a.md', 'one')], 'into', false, 'two'));
        expect(answer.body).toEqual({ ok: true, paths: ['into/a.md'] });
        expect(readFileSync(join(second, 'into/a.md'), 'utf8')).toBe('a');
        expect(readFileSync(join(first, 'a.md'), 'utf8')).toBe('a');
    });

    it('moves across two roots and removes the original', async () => {
        const first = folder({ 'a.md': 'a' });
        const second = folder({}, ['into']);
        const w = worldOver(
            [
                { key: 'one', dir: first },
                { key: 'two', dir: second }
            ],
            first
        );
        const answer = await w.post(paste('move', [at('a.md', 'one')], 'into', false, 'two'));
        expect(answer.body.ok).toBe(true);
        expect(existsSync(join(first, 'a.md'))).toBe(false);
        expect(readFileSync(join(second, 'into/a.md'), 'utf8')).toBe('a');
    });

    it('keeps a relative link a link with its target string as written (case 20)', async () => {
        const w = world({ 't.md': 't' }, ['src', 'dest']);
        symlinkSync('../t.md', join(w.hub, 'src/l'));
        const answer = await w.post(paste('copy', [at('src')], 'dest'));
        expect(answer.body.ok).toBe(true);
        const copied = join(w.hub, 'dest/src/l');
        expect(lstatSync(copied).isSymbolicLink()).toBe(true);
        expect(readlinkSync(copied)).toBe('../t.md');
    });

    it('stops at the first item that is gone and says what went before it (case 21)', async () => {
        const w = world({ 'a.md': 'a', 'c.md': 'c' }, ['sub']);
        const answer = await w.post(paste('move', [at('a.md'), at('gone.md'), at('c.md')], 'sub'));
        expect(answer.body).toEqual({
            ok: false,
            error: 'missing',
            done: ['a.md'],
            failed: 'gone.md'
        });
        expect(names(join(w.hub, 'sub'))).toEqual(['a.md']);
        expect(existsSync(join(w.hub, 'c.md'))).toBe(true);
    });

    it('refuses a destination that is a file, and one outside the root', async () => {
        const w = world({ 'a.md': 'a', 'f.md': 'f' });
        expect((await w.post(paste('copy', [at('a.md')], 'f.md'))).body).toEqual({
            ok: false,
            error: 'not_a_folder'
        });
        expect((await w.post(paste('copy', [at('a.md')], '../x'))).body).toEqual({
            ok: false,
            error: 'outside'
        });
    });
});

describe('upload', () => {
    const upload = (name: string, data: string, replace = false, path = '', root = 'hub') => ({
        op: 'upload',
        root,
        path,
        name,
        data,
        replace
    });
    const base64 = (bytes: number[]): string => Buffer.from(bytes).toString('base64');

    it('writes the bytes, an empty file, and refuses what is not base64 or a path (case 22)', async () => {
        const w = world({ 'taken.png': 'old' }, ['sub']);
        const answer = await w.post(upload('p.png', base64([1, 2, 3]), false, 'sub'));
        expect(answer.body).toEqual({ ok: true, path: 'sub/p.png' });
        expect([...readFileSync(join(w.hub, 'sub/p.png'))]).toEqual([1, 2, 3]);
        expect((await w.post(upload('empty.bin', ''))).body.ok).toBe(true);
        expect(readFileSync(join(w.hub, 'empty.bin')).length).toBe(0);
        expect((await w.post(upload('taken.png', base64([9])))).body).toEqual({
            ok: false,
            error: 'exists'
        });
        expect(readFileSync(join(w.hub, 'taken.png'), 'utf8')).toBe('old');
        expect((await w.post(upload('x.png', '%%%'))).body).toEqual({
            ok: false,
            error: 'not_base64'
        });
        expect((await w.post(upload('a/b.png', base64([1])))).body).toEqual({
            ok: false,
            error: 'invalid_name'
        });
        expect(existsSync(join(w.hub, 'a'))).toBe(false);
    });

    it('refuses a replace over a folder, and sends a replaced file to the trash first (case 22)', async () => {
        const w = world({ 'f.png': 'old' }, ['folder']);
        const trashed = spy();
        expect(
            (await w.post(upload('folder', base64([1]), true), { trash: trashed })).body
        ).toEqual({
            ok: false,
            error: 'not_a_folder'
        });
        const answer = await w.post(upload('f.png', base64([7, 7]), true), { trash: trashed });
        expect(answer.body.ok).toBe(true);
        expect(trashed.mock.calls).toEqual([[join(w.hub, 'f.png'), { glob: false }]]);
        expect([...readFileSync(join(w.hub, 'f.png'))]).toEqual([7, 7]);
    });

    it('answers trash_failed for a replace the trash could not take, and writes nothing', async () => {
        const w = world({ 'f.png': 'old' });
        const trashed = spy().mockRejectedValue(new Error('no Trash'));
        const answer = await w.post(upload('f.png', base64([7]), true), { trash: trashed });
        expect(answer.body).toEqual({ ok: false, error: 'trash_failed' });
        expect(readFileSync(join(w.hub, 'f.png'), 'utf8')).toBe('old');
    });

    it('refuses a file over the cap as too large', { tags: ['slow'] }, async () => {
        const w = world();
        const over = Buffer.alloc(MAX_UPLOAD_BYTES + 1).toString('base64');
        expect((await w.post(upload('big.bin', over))).body).toEqual({
            ok: false,
            error: 'too_large'
        });
        expect(names(w.hub)).toEqual([]);
    });

    it('replaces a link to a file outside the root with a fresh file, and leaves the outside file alone (case 23)', async () => {
        const outside = folder({ 'out.txt': 'outside' });
        const w = world();
        symlinkSync(join(outside, 'out.txt'), join(w.hub, 'l'));
        const trashed = spy();
        const answer = await w.post(upload('l', base64([1, 2]), true), { trash: trashed });
        expect(answer.body.ok).toBe(true);
        expect(trashed.mock.calls).toEqual([[join(w.hub, 'l'), { glob: false }]]);
        expect(lstatSync(join(w.hub, 'l')).isSymbolicLink()).toBe(false);
        expect([...readFileSync(join(w.hub, 'l'))]).toEqual([1, 2]);
        expect(readFileSync(join(outside, 'out.txt'), 'utf8')).toBe('outside');
    });
});

describe("the machine's own local.yml", () => {
    /** A hub with the engine's config folder inside it, and links to the folder and the file. */
    function engineWorld(): World & { config: string; local: string } {
        const hub = folder(
            {
                'tools/oculus/config/local.yml': 'secret: 1\n',
                'tools/oculus/config/other.yml': 'x: 1\n'
            },
            ['spare']
        );
        const config = join(hub, 'tools/oculus/config');
        symlinkSync('tools/oculus/config', join(hub, 'lnk'));
        symlinkSync('tools/oculus/config/local.yml', join(hub, 'll'));
        const w = worldOver(
            [
                { key: 'hub', dir: hub },
                { key: 'engine', dir: config }
            ],
            hub
        );
        return { ...w, config, local: join(config, 'local.yml') };
    }

    const refused = (error: string, extra: Record<string, unknown> = {}): unknown =>
        expect.objectContaining({ ok: false, error, ...extra });
    const at = (path: string, root = 'hub') => ({ root, path });

    it('refuses every change to the file and to the folders holding it (case 24)', async () => {
        const w = engineWorld();
        const trashed = spy();
        const deps = { trash: trashed };
        const before = readFileSync(w.local, 'utf8');
        const subjects = [
            at('local.yml', 'engine'),
            at('tools/oculus'),
            at('tools/oculus/config'),
            at('tools/oculus/config/local.yml'),
            at('lnk/local.yml')
        ];
        for (const subject of subjects) {
            const name = `${subject.root}:${subject.path}`;
            const one = [
                { op: 'rename', ...subject, name: 'moved' },
                { op: 'trash', root: subject.root, paths: [subject.path] },
                { op: 'delete', root: subject.root, paths: [subject.path] },
                {
                    op: 'paste',
                    mode: 'move',
                    items: [subject],
                    root: 'hub',
                    path: 'spare',
                    replace: false
                },
                {
                    op: 'paste',
                    mode: 'copy',
                    items: [subject],
                    root: 'hub',
                    path: 'spare',
                    replace: false
                }
            ];
            for (const body of one) {
                const answer = await w.post(body, deps);
                expect({ name, op: body.op, body: answer.body }).toEqual({
                    name,
                    op: body.op,
                    body: refused('protected')
                });
            }
        }
        expect(readFileSync(w.local, 'utf8')).toBe(before);
        expect(names(w.config)).toEqual(['local.yml', 'other.yml']);
        expect(names(join(w.hub, 'spare'))).toEqual([]);
        expect(trashed).not.toHaveBeenCalled();
    });

    it('refuses an upload, a move, a copy and a rename over the file (case 24)', async () => {
        const w = engineWorld();
        const trashed = spy();
        for (const replace of [false, true]) {
            const answer = await w.post(
                {
                    op: 'upload',
                    root: 'engine',
                    path: '',
                    name: 'local.yml',
                    data: 'AA==',
                    replace
                },
                { trash: trashed }
            );
            expect(answer.body).toEqual(refused('protected'));
        }
        writeFileSync(join(w.hub, 'spare/local.yml'), 'other\n');
        const over = await w.post(
            {
                op: 'paste',
                mode: 'move',
                items: [at('spare/local.yml')],
                root: 'engine',
                path: '',
                replace: true
            },
            { trash: trashed }
        );
        expect(over.body).toEqual(refused('protected'));
        const copyOver = await w.post(
            {
                op: 'paste',
                mode: 'copy',
                items: [at('spare/local.yml')],
                root: 'engine',
                path: '',
                replace: true
            },
            { trash: trashed }
        );
        expect(copyOver.body).toEqual(refused('protected'));
        const renameOver = await w.post({
            op: 'rename',
            root: 'engine',
            path: 'other.yml',
            name: 'local.yml'
        });
        expect(renameOver.body).toEqual(refused('protected'));
        expect(readFileSync(w.local, 'utf8')).toBe('secret: 1\n');
        expect(readFileSync(join(w.hub, 'spare/local.yml'), 'utf8')).toBe('other\n');
        expect(trashed).not.toHaveBeenCalled();
    });

    it('refuses every spelling of the file and of its folders that the volume accepts (case 24)', async () => {
        // Where the volume tells the spellings apart, a spelling is another name: a lookup finds
        // nothing, and a name that is made is made beside the file.
        const looked = { ok: false, error: 'missing' };
        const made = { ok: true };
        const cases = [
            {
                label: 'delete LOCAL.YML',
                other: looked,
                body: { op: 'delete', root: 'engine', paths: ['LOCAL.YML'] }
            },
            {
                label: 'trash Local.yml',
                other: looked,
                body: { op: 'trash', root: 'engine', paths: ['Local.yml'] }
            },
            {
                label: 'rename LOCAL.yml',
                other: looked,
                body: { op: 'rename', root: 'engine', path: 'LOCAL.yml', name: 'moved' }
            },
            {
                label: 'rename other.yml to Local.yml',
                other: made,
                body: { op: 'rename', root: 'engine', path: 'other.yml', name: 'Local.yml' }
            },
            {
                label: 'upload LOCAL.YML with replace',
                other: made,
                body: {
                    op: 'upload',
                    root: 'engine',
                    path: '',
                    name: 'LOCAL.YML',
                    data: 'AA==',
                    replace: true
                }
            },
            {
                label: 'delete TOOLS/oculus/config',
                other: looked,
                body: { op: 'delete', root: 'hub', paths: ['TOOLS/oculus/config'] }
            },
            {
                label: 'trash Tools/OCULUS',
                other: looked,
                body: { op: 'trash', root: 'hub', paths: ['Tools/OCULUS'] }
            }
        ];
        const seen: Record<string, unknown> = {};
        for (const one of cases) {
            const w = engineWorld();
            const trashed = spy();
            const done = await w.post(one.body, { trash: trashed });
            const kept = existsSync(w.local) && readFileSync(w.local, 'utf8') === 'secret: 1\n';
            const answer = done.body.ok ? { ok: true } : { ok: false, error: done.body.error };
            seen[one.label] = { ...answer, kept, trashed: trashed.mock.calls.length };
        }
        const refusal = { ok: false, error: 'protected' };
        expect(seen).toEqual(
            Object.fromEntries(
                cases.map((one) => [
                    one.label,
                    { ...(INSENSITIVE ? refusal : one.other), kept: true, trashed: 0 }
                ])
            )
        );
    });

    it('refuses a paste with Replace onto another spelling of the file (case 24)', async () => {
        const w = engineWorld();
        const trashed = spy();
        writeFileSync(join(w.hub, 'spare/Local.yml'), 'other\n');
        const over = await w.post(
            {
                op: 'paste',
                mode: 'move',
                items: [at('spare/Local.yml')],
                root: 'engine',
                path: '',
                replace: true
            },
            { trash: trashed }
        );
        if (INSENSITIVE) {
            expect(over.body).toEqual(refused('protected'));
            expect(readFileSync(w.local, 'utf8')).toBe('secret: 1\n');
            expect(readFileSync(join(w.hub, 'spare/Local.yml'), 'utf8')).toBe('other\n');
            expect(trashed).not.toHaveBeenCalled();
        } else {
            expect(over.body.ok).toBe(true);
            expect(readFileSync(w.local, 'utf8')).toBe('secret: 1\n');
        }
    });

    it(
        'refuses a delete that waited in the chain while local.yml was saved over (case 24)',
        { tags: ['slow'] },
        async () => {
            const w = engineWorld();
            const trashed = spy();
            let release = (): void => undefined;
            const gate = new Promise<void>((done) => (release = done));
            const first = w.post(create('spare', 'a.md'), { slow: () => gate });
            await new Promise((done) => setTimeout(done, 10));
            const second = w.post(
                { op: 'delete', root: 'engine', paths: ['local.yml'] },
                { trash: trashed }
            );
            await new Promise((done) => setTimeout(done, 10));
            // A save writes a temporary file and renames it over the file, which gives it a new
            // inode.
            writeFileSync(join(w.config, 'local.yml.tmp'), 'secret: 2\n');
            renameSync(join(w.config, 'local.yml.tmp'), w.local);
            release();
            expect((await first).body.ok).toBe(true);
            expect((await second).body).toEqual(refused('protected'));
            expect(readFileSync(w.local, 'utf8')).toBe('secret: 2\n');
            expect(trashed).not.toHaveBeenCalled();
        }
    );

    it('answers root before protected for the folder of the engine root, and protected for its copy (case 24)', async () => {
        const w = engineWorld();
        const root = at('', 'engine');
        const bodies = [
            { op: 'rename', ...root, name: 'x' },
            { op: 'trash', root: 'engine', paths: [''] },
            { op: 'delete', root: 'engine', paths: [''] },
            { op: 'paste', mode: 'move', items: [root], root: 'hub', path: 'spare', replace: false }
        ];
        for (const body of bodies) {
            expect({ op: body.op, body: (await w.post(body)).body }).toEqual({
                op: body.op,
                body: refused('root')
            });
        }
        const copy = await w.post({
            op: 'paste',
            mode: 'copy',
            items: [root],
            root: 'hub',
            path: 'spare',
            replace: false
        });
        expect(copy.body).toEqual(refused('protected'));
        expect(names(join(w.hub, 'spare'))).toEqual([]);
    });

    it('renames a link that points at the file as the link, and leaves the file untouched (case 24)', async () => {
        const w = engineWorld();
        const answer = await w.post({ op: 'rename', root: 'hub', path: 'll', name: 'mm' });
        expect(answer.body).toEqual({ ok: true, path: 'mm' });
        expect(lstatSync(join(w.hub, 'mm')).isSymbolicLink()).toBe(true);
        expect(readFileSync(w.local, 'utf8')).toBe('secret: 1\n');
    });

    it('still lets the rest of the config folder be changed', async () => {
        const w = engineWorld();
        const answer = await w.post({
            op: 'rename',
            root: 'engine',
            path: 'other.yml',
            name: 'o2.yml'
        });
        expect(answer.body).toEqual({ ok: true, path: 'o2.yml' });
        expect(names(w.config)).toEqual(['local.yml', 'o2.yml']);
    });
});
