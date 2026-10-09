// Layer 2, route tests. The folder Fix All of the writing rules: the plan POST /api/lint answers to
// the action `folder` (server/machine/runs/lint/writing/folder.ts) and the write POST /api/ops
// makes of the files the reader ticked, `writing-fix` (server/files/fs/lsp-edit.ts), which runs the
// chain `lsp-edit` runs. The plan is read with the real lint route and its edits are posted to the
// real ops route over the same scratch folder.
//
// What this does NOT cover: the dialog that lists the files and the boxes (seen at the look), the
// plan's own check of a result that fails to parse, which no file the reader accepts can reach, and
// the files under the machine's `~/.oculus`, which the plan and the write both withhold the same
// way as the hub's `secrets` folder.

import { existsSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { guarded, protectedFiles } from '../../../src/lib/server/files/fs/ops.ts';
import { savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { it } from '../../fixtures/scratch.ts';
import { plant, route, settingsOf } from '../../server/machine/runs/lint/lint-fixture.ts';
import {
    hashOf,
    records,
    replaceWorld,
    stamps,
    undo,
    writingFixPost,
    type ReplaceWorld
} from './replace-fixture.ts';

const ELLIPSIS = '\u2026';
const EM_DASH = '\u2014';

type PlannedFile = {
    path: string;
    hash: string;
    count: number;
    edits: unknown[];
    reason?: string;
};

/** The world, with the lint route over its roots and the plan of a folder the page asks for. */
function planning(files: Record<string, string>, writingSkip: string[] = []) {
    const w = replaceWorld(files);
    const lint = route(
        () => w.ops.roots,
        () => ({ ...settingsOf(), writingSkip }),
        { isProtected: (real) => guarded(protectedFiles({ roots: w.ops.roots }), real) }
    );
    const plan = async (root = 'hub', path = '', token?: string | null) => {
        const answered = await lint.post({ action: 'folder', root, path }, token);
        return {
            status: answered.status,
            body: answered.body as { ok: boolean; files?: PlannedFile[]; reason?: string }
        };
    };
    return { w, lint, plan };
}

/** The `files` of a write for the planned files, as the page sends them. */
const writeOf = (planned: PlannedFile[], root = 'hub') =>
    planned.map((one) => ({ root, path: one.path, hash: one.hash, edits: one.edits }));

const text = (w: ReplaceWorld, name: string): string => readFileSync(join(w.hub, name), 'utf8');

describe('the plan of a folder (case 50)', () => {
    it('lists the files with an automatic fix, each with its hash and count, and no other file', async () => {
        const wait = `Wait${ELLIPSIS} and${ELLIPSIS} more.\n`;
        const title = `title: Hello${ELLIPSIS}\n`;
        const { w, plan } = planning(
            {
                'docs/a.md': wait,
                'docs/b.yml': title,
                'docs/c.md': `a ${EM_DASH} b\n`,
                'docs/d.ts': 'const a = 1;\n',
                'docs/skipped.md': wait,
                'docs/node_modules/x.md': wait,
                'docs/.git/x.md': wait,
                'secrets/x.md': wait
            },
            ['docs/skipped.md']
        );
        const answer = await plan('hub', 'docs');
        expect(answer.status).toBe(200);
        expect(answer.body).toMatchObject({ ok: true });
        expect(answer.body.files?.map((one) => [one.path, one.count, one.hash])).toEqual([
            ['docs/a.md', 2, hashOf(wait)],
            ['docs/b.yml', 1, hashOf(title)]
        ]);
        const root = await plan('hub', '');
        expect(root.body.files?.map((one) => one.path)).toEqual(['docs/a.md', 'docs/b.yml']);
        expect(existsSync(join(w.hub, 'secrets/x.md'))).toBe(true);
    });

    it("never lists the machine's local.yml, which the plan never reads", async () => {
        const { w, plan } = planning({});
        plant(join(w.engine, 'local.yml'), `secret: x${ELLIPSIS}\n`);
        plant(join(w.engine, 'other.yml'), `note: y${ELLIPSIS}\n`);
        const answer = await plan('engine', '');
        expect(answer.body.files?.map((one) => one.path)).toEqual(['other.yml']);
    });

    it("refuses a start folder that is, or lies under, the hub's secrets folder (G3)", async () => {
        const { plan } = planning({
            'a.md': `x${ELLIPSIS}\n`,
            'secrets/a.md': `x${ELLIPSIS}\n`,
            'secrets/deep/b.yml': `k: y${ELLIPSIS}\n`
        });
        for (const path of ['secrets', 'secrets/deep']) {
            const answer = await plan('hub', path);
            expect({ path, status: answer.status, ok: answer.body.ok }).toEqual({
                path,
                status: 200,
                ok: false
            });
            expect(answer.body.reason).toBe('The writing rules do not read a private folder');
            expect(answer.body.files).toBeUndefined();
        }
    });

    it('refuses the secrets folder named in another letter case, to the plan and the write (G3)', async () => {
        const { w, plan } = planning({
            'a.md': `x${ELLIPSIS}\n`,
            'secrets/a.md': `x${ELLIPSIS}\n`
        });
        // Only a file system that ignores letter case finds the folder by another spelling.
        if (!existsSync(join(w.hub, 'SECRETS'))) return;
        const planned = await plan('hub', 'SECRETS');
        expect({ ok: planned.body.ok, files: planned.body.files }).toEqual({
            ok: false,
            files: undefined
        });
        const [first] = writeOf((await plan()).body.files ?? []);
        const asHub = { ...w, ops: { ...w.ops, hub: w.hub } };
        const answer = await writingFixPost(asHub, [
            first,
            {
                root: 'hub',
                path: 'SECRETS/a.md',
                hash: hashOf(`x${ELLIPSIS}\n`),
                edits: first.edits
            }
        ]);
        expect(answer.body).toEqual({
            ok: false,
            error: 'outside',
            done: [],
            failed: 'hub/SECRETS/a.md'
        });
        expect(text(w, 'secrets/a.md')).toBe(`x${ELLIPSIS}\n`);
    });

    it('refuses a request without the write token (G1)', async () => {
        const { plan } = planning({ 'a.md': `x${ELLIPSIS}\n` });
        expect((await plan('hub', '', null)).status).toBe(403);
        expect((await plan('hub', '', 'another-token')).status).toBe(403);
        expect((await plan('hub', '')).status).toBe(200);
    });

    it('refuses a path that climbs out of the root, a root not served, a file, and a link out of the root (G2)', async () => {
        const { w, plan } = planning({ 'a.md': `x${ELLIPSIS}\n` });
        const outside = plant(join(w.hub, '..', 'outside', 'o.md'), `o${ELLIPSIS}\n`);
        symlinkSync(join(outside, '..'), join(w.hub, 'leaves'));
        for (const [root, path] of [
            ['hub', '..'],
            ['nowhere', ''],
            ['hub', 'a.md'],
            ['hub', 'leaves']
        ]) {
            expect({ root, path, status: (await plan(root, path)).status }).toEqual({
                root,
                path,
                status: 404
            });
        }
    });
});

describe('the write of the ticked files (case 54)', () => {
    it('writes the edits of the plan, keeps a copy of each file as writing-fix and records one files record (G9)', async () => {
        const wait = `Wait${ELLIPSIS} and${ELLIPSIS} more.\n`;
        const title = `title: Hello${ELLIPSIS}\n`;
        const { w, plan } = planning({ 'a.md': wait, 'b.yml': title });
        const planned = (await plan()).body.files ?? [];
        const answer = await writingFixPost(w, writeOf(planned));
        expect(answer.body).toEqual({ ok: true, paths: ['hub/a.md', 'hub/b.yml'] });
        expect([text(w, 'a.md'), text(w, 'b.yml')]).toEqual([
            'Wait... and... more.\n',
            'title: Hello...\n'
        ]);
        const all = records(w);
        expect(all).toHaveLength(1);
        expect(all[0]).toMatchObject({ kind: 'files', field: 'writing-fix', undo: 'file' });
        for (const one of stamps(all[0].before)) expect(one.kept).toEqual(expect.any(String));
        for (const name of ['a.md', 'b.yml']) {
            expect(savesOf(w.ops.history ?? '', join(w.hub, name)).saves).toMatchObject([
                { kind: 'writing-fix' }
            ]);
        }
    });

    it('writes only the files the request names, and undoing the record puts both files back (G9)', async () => {
        const wait = `Wait${ELLIPSIS} more.\n`;
        const { w, plan } = planning({ 'a.md': wait, 'b.md': wait, 'c.md': wait });
        const planned = (await plan()).body.files ?? [];
        const ticked = planned.filter((one) => one.path !== 'c.md');
        expect((await writingFixPost(w, writeOf(ticked))).body.ok).toBe(true);
        expect([text(w, 'a.md'), text(w, 'b.md'), text(w, 'c.md')]).toEqual([
            'Wait... more.\n',
            'Wait... more.\n',
            wait
        ]);
        const [made] = records(w);
        expect((await undo(w, made.at)).status).toBe(200);
        expect([text(w, 'a.md'), text(w, 'b.md'), text(w, 'c.md')]).toEqual([wait, wait, wait]);
        expect(records(w)[0]).toMatchObject({ field: 'writing-fix', undoes: made.at });
    });
});

describe('what stops a write (case 55)', () => {
    const wait = `Wait${ELLIPSIS} more.\n`;

    /** Every file of the world as it is, to compare before and after a refused write. */
    const held = (w: ReplaceWorld): string[] => [
        text(w, 'a.md'),
        text(w, 'b.md'),
        String(savesOf(w.ops.history ?? '', join(w.hub, 'a.md')).saves.length),
        String(records(w).length)
    ];

    it('refuses a request without the token and writes nothing, then writes under the token (G1)', async () => {
        const { w, plan } = planning({ 'a.md': wait, 'b.md': wait });
        const files = writeOf((await plan()).body.files ?? []);
        const before = held(w);
        expect((await writingFixPost(w, files, null)).status).toBe(403);
        expect((await writingFixPost(w, files, 'another-token')).status).toBe(403);
        expect(held(w)).toEqual(before);
        expect((await writingFixPost(w, files)).status).toBe(200);
        expect(text(w, 'a.md')).toBe('Wait... more.\n');
    });

    it('refuses a path out of the root, a link out of it and a root not served, naming the file (G2)', async () => {
        const { w, plan } = planning({ 'a.md': wait, 'b.md': wait });
        const [first] = writeOf((await plan()).body.files ?? []);
        const outside = plant(join(w.hub, '..', 'outside', 'o.md'), wait);
        symlinkSync(outside, join(w.hub, 'leaves.md'));
        const before = held(w);
        const rows: [string, string, string][] = [
            ['hub', '../outside/o.md', 'hub/../outside/o.md'],
            ['hub', 'leaves.md', 'hub/leaves.md'],
            ['nowhere', 'a.md', 'nowhere/a.md']
        ];
        for (const [root, path, named] of rows) {
            const answer = await writingFixPost(w, [
                first,
                { ...first, root, path, hash: hashOf(wait) }
            ]);
            expect({ path, status: answer.status, body: answer.body }).toEqual({
                path,
                status: 400,
                body: {
                    ok: false,
                    error: 'outside',
                    done: [],
                    failed: named
                }
            });
        }
        expect(held(w)).toEqual(before);
        expect(readFileSync(outside, 'utf8')).toBe(wait);
    });

    it("refuses `protected` for the machine's local.yml and writes nothing to it (G3)", async () => {
        const { w, plan } = planning({ 'a.md': wait, 'b.md': wait });
        const local = join(w.engine, 'local.yml');
        writeFileSync(local, `note: x${ELLIPSIS}\n`);
        const [first] = writeOf((await plan()).body.files ?? []);
        const answer = await writingFixPost(w, [
            first,
            {
                root: 'engine',
                path: 'local.yml',
                hash: hashOf(readFileSync(local)),
                edits: [
                    {
                        range: { start: { line: 0, character: 7 }, end: { line: 0, character: 8 } },
                        newText: '...'
                    }
                ]
            }
        ]);
        expect(answer.body).toMatchObject({
            error: 'protected',
            done: [],
            failed: 'engine/local.yml'
        });
        expect(readFileSync(local, 'utf8')).toBe(`note: x${ELLIPSIS}\n`);
        expect(text(w, 'a.md')).toBe(wait);
    });

    it("refuses `outside` for a file under the hub's secrets folder and writes nothing (G3)", async () => {
        const { w, plan } = planning({ 'a.md': wait, 'b.md': wait, 'secrets/s.md': wait });
        const [first] = writeOf((await plan()).body.files ?? []);
        const asHub = { ...w, ops: { ...w.ops, hub: w.hub } };
        const answer = await writingFixPost(asHub, [
            first,
            {
                root: 'hub',
                path: 'secrets/s.md',
                hash: hashOf(wait),
                edits: first.edits
            }
        ]);
        expect(answer.body).toEqual({
            ok: false,
            error: 'outside',
            done: [],
            failed: 'hub/secrets/s.md'
        });
        expect(text(w, 'secrets/s.md')).toBe(wait);
        expect(text(w, 'a.md')).toBe(wait);
    });
});
