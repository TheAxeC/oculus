// Layer 2, route tests. POST /api/ops with the operation `lsp-edit` (server/files/fs/lsp-edit.ts):
// the edits a language server asks for in files no tab holds, written file by file from the end of
// each, the checks that refuse the whole edit before anything is written, and the record the edit
// leaves in the change log and the local history.
//
// What this does NOT cover: the page that sends the edits (a rename, a code action, a server's
// `workspace/applyEdit`), which is seen at the look, and the undo, which is replace-undo.test.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    hashOf,
    lspEdit,
    lspEditPost,
    lspFile,
    records,
    replaceWorld,
    stamps,
    undo,
    type ReplaceWorld
} from './replace-fixture.ts';

/** A text of `lines` lines of 99 characters each, the first of which reads `foo`. */
const lined = (lines: number): string =>
    `foo${'x'.repeat(96)}\n${`${'y'.repeat(98)}\n`.repeat(lines - 1)}`;

const bytes = (w: { hub: string }, name: string): Buffer => readFileSync(join(w.hub, name));

/** A byte order mark, a line end of CRLF, a letter with an accent and a character of two units. */
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const ODD = 'caf\u00e9 \u{1f600} x\r\nsecond\r\n';

describe('what an lsp-edit writes', () => {
    it('writes the edits of two files, keeps a byte order mark and the line ends, and counts UTF-16 units', async () => {
        const odd = Buffer.concat([BOM, Buffer.from(ODD)]);
        const w = replaceWorld({ 'a.txt': odd, 'b.txt': 'foo\n' });
        const answer = await lspEditPost(w, [
            lspFile('a.txt', odd, [lspEdit([1, 0], [1, 6], '2nd'), lspEdit([0, 8], [0, 9], 'Y')]),
            lspFile('b.txt', 'foo\n', [lspEdit([0, 0], [0, 3], 'bar')])
        ]);
        expect(answer.body).toEqual({ ok: true, paths: ['hub/a.txt', 'hub/b.txt'] });
        expect(bytes(w, 'a.txt')).toEqual(
            Buffer.concat([BOM, Buffer.from('caf\u00e9 \u{1f600} Y\r\n2nd\r\n')])
        );
        expect(bytes(w, 'b.txt').toString()).toBe('bar\n');
    });
});

describe('the size of a file an lsp-edit writes (case 30)', () => {
    it('writes a file of 300 KB, keeps its copy and takes it back with the undo of the record', async () => {
        const big = lined(3100);
        expect(Buffer.byteLength(big)).toBeGreaterThan(300 * 1000);
        const w = replaceWorld({ 'big.txt': big });
        const answer = await lspEditPost(w, [
            lspFile('big.txt', big, [lspEdit([0, 0], [0, 3], 'bar')])
        ]);
        expect(answer.body).toEqual({ ok: true, paths: ['hub/big.txt'] });
        expect(bytes(w, 'big.txt').toString()).toBe(`bar${big.slice(3)}`);
        const kept = savesOf(w.ops.history ?? '', join(w.hub, 'big.txt')).saves;
        expect(kept).toMatchObject([{ kind: 'lsp-edit' }]);
        const [made] = records(w);
        expect((await undo(w, made.at)).status).toBe(200);
        expect(bytes(w, 'big.txt').toString()).toBe(big);
    });

    it('refuses a file over 5 MB as too_large and writes nothing', async () => {
        const huge = lined(55000);
        expect(Buffer.byteLength(huge)).toBeGreaterThan(5 * 1024 * 1024);
        const w = replaceWorld({ 'huge.txt': huge });
        const answer = await lspEditPost(w, [
            lspFile('huge.txt', huge, [lspEdit([0, 0], [0, 3], 'bar')])
        ]);
        expect(answer.status).toBe(400);
        expect(answer.body).toMatchObject({
            ok: false,
            error: 'too_large',
            failed: 'hub/huge.txt'
        });
        expect(bytes(w, 'huge.txt').toString()).toBe(huge);
        expect(savesOf(w.ops.history ?? '', join(w.hub, 'huge.txt')).saves).toEqual([]);
        expect(records(w)).toEqual([]);
    });
});

describe('what stops an lsp-edit', () => {
    /** The text of each file of a world whose files are `a.txt` and `b.txt`, and the history. */
    function untouched(w: ReplaceWorld): unknown {
        return [
            bytes(w, 'a.txt').toString(),
            bytes(w, 'b.txt').toString(),
            savesOf(w.ops.history ?? '', join(w.hub, 'a.txt')).saves,
            savesOf(w.ops.history ?? '', join(w.hub, 'b.txt')).saves,
            records(w)
        ];
    }

    it('refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n', 'b.txt': 'foo\n' });
        const before = untouched(w);
        const edits = [lspEdit([0, 0], [0, 3], 'bar')];
        const rows: [string, string, string][] = [
            ['hub', '../outside.txt', 'hub/../outside.txt'],
            ['nowhere', 'a.txt', 'nowhere/a.txt'],
            ['', 'a.txt', '/a.txt'],
            ['hub', '.git/config', 'hub/.git/config'],
            ['hub', 'src/.venv/lib/m.py', 'hub/src/.venv/lib/m.py'],
            ['hub', 'node_modules/m/index.js', 'hub/node_modules/m/index.js'],
            ['hub', 'src/node_modules/m.js', 'hub/src/node_modules/m.js']
        ];
        for (const [root, path, named] of rows) {
            const answer = await lspEditPost(w, [
                lspFile('a.txt', 'foo\n', edits),
                lspFile(path, 'foo\n', edits, root)
            ]);
            expect({ path, answer }).toEqual({
                path,
                answer: {
                    status: 400,
                    body: { ok: false, error: 'outside', done: [], failed: named }
                }
            });
        }
        expect(untouched(w)).toEqual(before);
    });

    it("refuses a file under the hub's secrets folder and one under the home folder's .oculus as outside, and writes and keeps nothing (case 30a)", async () => {
        const w = replaceWorld({ 'secrets/a.yml': 'foo\n', 'plain.yml': 'foo\n' });
        const home = join(w.hub, '..', 'home');
        mkdirSync(join(home, '.oculus'), { recursive: true });
        writeFileSync(join(home, '.oculus', 'state.yml'), 'foo\n');
        const roots = [...w.ops.roots, { key: 'home', dir: home }];
        const world: ReplaceWorld = {
            ...w,
            ops: { ...w.ops, roots, hub: w.hub, home }
        };
        const edits = [lspEdit([0, 0], [0, 3], 'bar')];
        for (const [root, path, named] of [
            ['hub', 'secrets/a.yml', 'hub/secrets/a.yml'],
            ['home', '.oculus/state.yml', 'home/.oculus/state.yml']
        ]) {
            const answer = await lspEditPost(world, [
                lspFile('plain.yml', 'foo\n', edits),
                lspFile(path, 'foo\n', edits, root)
            ]);
            expect({ path, answer }).toEqual({
                path,
                answer: {
                    status: 400,
                    body: { ok: false, error: 'outside', done: [], failed: named }
                }
            });
        }
        expect(bytes(w, 'plain.yml').toString()).toBe('foo\n');
        expect(bytes(w, 'secrets/a.yml').toString()).toBe('foo\n');
        expect(readFileSync(join(home, '.oculus', 'state.yml'), 'utf8')).toBe('foo\n');
        expect(records(w)).toEqual([]);
        expect(savesOf(w.ops.history ?? '', join(w.hub, 'secrets/a.yml')).saves).toEqual([]);
    });

    it("refuses `protected` for the machine's local file of the engine root, which it never opens", async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const before = readFileSync(join(w.engine, 'local.yml'), 'utf8');
        const answer = await lspEditPost(w, [
            lspFile('local.yml', before, [lspEdit([1, 0], [1, 6], 'X')], 'engine')
        ]);
        expect(answer.body).toMatchObject({ error: 'protected', failed: 'engine/local.yml' });
        expect(readFileSync(join(w.engine, 'local.yml'), 'utf8')).toBe(before);
    });

    it('refuses the whole edit when the second file is not the text the page read, and writes nothing to either (case 8)', async () => {
        const w = replaceWorld({ 'a.txt': 'foo a\n', 'b.txt': 'b foo\n' });
        const before = untouched(w);
        const answer = await lspEditPost(w, [
            lspFile('a.txt', 'foo a\n', [lspEdit([0, 0], [0, 3], 'bar')]),
            lspFile('b.txt', 'b foo changed\n', [lspEdit([0, 2], [0, 5], 'bar')])
        ]);
        expect(answer).toEqual({
            status: 400,
            body: { ok: false, error: 'changed', done: [], failed: 'hub/b.txt' }
        });
        expect(untouched(w)).toEqual(before);
    });

    it('refuses a file named twice, two ranges of one file that overlap and a range past the end, and writes nothing', async () => {
        const w = replaceWorld({ 'a.txt': 'foo a\n', 'b.txt': 'b foo\n' });
        const before = untouched(w);
        const whole = lspFile('a.txt', 'foo a\n', [lspEdit([0, 0], [0, 3], 'bar')]);
        const overlap = lspFile('a.txt', 'foo a\n', [
            lspEdit([0, 0], [0, 4], 'x'),
            lspEdit([0, 3], [0, 5], 'y')
        ]);
        const past = lspFile('a.txt', 'foo a\n', [lspEdit([4, 0], [4, 1], 'z')]);
        const other = lspFile('b.txt', 'b foo\n', [lspEdit([0, 2], [0, 5], 'bar')]);
        const rows: [string, unknown[], string][] = [
            ['a file named twice', [whole, other, whole], 'not-an-action'],
            ['two ranges that overlap', [other, overlap], 'not-an-action'],
            ['a range past the end', [other, past], 'changed'],
            ['no file', [], 'not-an-action']
        ];
        for (const [name, files, error] of rows) {
            const answer = await lspEditPost(w, files);
            expect({ name, status: answer.status, error: answer.body.error }).toEqual({
                name,
                status: 400,
                error
            });
        }
        expect(untouched(w)).toEqual(before);
    });
});

describe('what an lsp-edit records', () => {
    it('appends one files record naming each file, its kept copy of the kind lsp-edit and the file as it is', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n', 'b.txt': 'foo\n' });
        await lspEditPost(
            w,
            ['a', 'b'].map((name) =>
                lspFile(`${name}.txt`, 'foo\n', [lspEdit([0, 0], [0, 3], 'bar')])
            )
        );
        const all = records(w);
        expect(all).toHaveLength(1);
        expect(all[0]).toMatchObject({ kind: 'files', field: 'lsp-edit', undo: 'file' });
        const [before, after] = [stamps(all[0].before), stamps(all[0].after)];
        expect(before.map((one) => one.path)).toEqual([join(w.hub, 'a.txt'), join(w.hub, 'b.txt')]);
        expect(after.map((one) => one.path)).toEqual(before.map((one) => one.path));
        for (const one of before) expect(one.kept).toEqual(expect.any(String));
        for (const name of ['a.txt', 'b.txt']) {
            expect(savesOf(w.ops.history ?? '', join(w.hub, name)).saves).toMatchObject([
                { kind: 'lsp-edit' }
            ]);
        }
        expect(hashOf(bytes(w, 'a.txt'))).not.toBe(hashOf('foo\n'));
        expect(existsSync(join(w.hub, 'a.txt'))).toBe(true);
    });
});

describe('the bytes an lsp-edit replaces', () => {
    /** `lead`, then one byte that is no text, then a line `foo`. */
    const holding = (lead: number, bad: number): Buffer =>
        Buffer.concat([Buffer.alloc(lead, 0x61), Buffer.from([bad]), Buffer.from('\nfoo\n')]);

    it.each([
        ['a Latin-1 byte after 9,000 bytes of ASCII', holding(9000, 0xe9)],
        ['a NUL byte at byte 10,000', holding(10000, 0)]
    ])('refuses a file holding %s, and leaves its bytes', async (_title, held) => {
        const w = replaceWorld({ 'bin.txt': held });
        const answer = await lspEditPost(w, [
            lspFile('bin.txt', held, [lspEdit([1, 0], [1, 3], 'bar')])
        ]);
        expect(answer.status).toBe(400);
        expect(answer.body).toMatchObject({ ok: false, error: 'binary', failed: 'hub/bin.txt' });
        expect(bytes(w, 'bin.txt')).toEqual(held);
    });
});
