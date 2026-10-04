// Layer 2, server test. Paste (copy and move) and upload under the served roots, and the guard on
// the machine's own config/local.yml, over the worlds of tests/server/files/ops-fixture.ts.
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

import { existsSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import { folder, names, spy, world, worldOver, type World } from './ops-fixture.ts';

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
});
