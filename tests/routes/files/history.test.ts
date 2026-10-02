// Layer 4, route test. The local history of a file: the copy POST /api/source keeps before a save
// and GET /api/history lists and reads, over one synthetic root and one history folder under the
// system temporary directory. Both folders are asserted inside it before anything is written, so
// no case writes ~/.oculus/history.

import { createHash } from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    unlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { ENGINE_ROOT, engineRoot, type Root } from '../../../src/lib/server/files/files.ts';
import {
    DELETES_KEPT,
    SAVES_KEPT,
    SAVE_MAX_BYTES,
    forgetCopy,
    handleHistory,
    historyFolder,
    keepCopy,
    readCopy,
    savesOf
} from '../../../src/lib/server/files/fs/history.ts';
import { handleSource } from '../../../src/lib/server/files/source.ts';
import { deletesListed, listDeletes } from '../../server/files/history-fixture.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const HOST = '127.0.0.1:8790';

type Fixture = { dir: string; root: Root; history: string; file: string };

/** A root holding notes.md, and a history folder of its own beside it. */
function fixture(): Fixture {
    const dir = scratchDir('oculus-history-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const rootDir = join(dir, 'root');
    mkdirSync(rootDir);
    const file = join(rootDir, 'notes.md');
    writeFileSync(file, 'one\n');
    return { dir, root: { key: 'fixture', dir: rootDir }, history: join(dir, 'history'), file };
}

function request(token: string, body: unknown): Request {
    return new Request(`http://${HOST}/api/source`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            host: HOST,
            'sec-fetch-site': 'same-origin',
            [TOKEN_HEADER]: token
        },
        body: JSON.stringify(body)
    });
}

async function save(one: Fixture, content: string, list: Root[] = [one.root], key = 'fixture') {
    const token = mintToken();
    return handleSource(
        request(token, { root: key, path: 'notes.md', content }),
        token,
        list,
        one.history
    );
}

function ask(one: Fixture, query: string) {
    return handleHistory(new URL(`http://${HOST}/api/history?${query}`), [one.root], one.history);
}

const realOf = (one: Fixture) => realpathSync(one.file);

describe('the copy a save keeps', () => {
    it('keeps the file as it was, under a folder named by the hash of its real path', async () => {
        const one = fixture();
        const answer = await save(one, 'two\n');
        expect(await answer.json()).toEqual({ ok: true });
        expect(readFileSync(one.file, 'utf8')).toBe('two\n');
        const real = realOf(one);
        const folder = join(
            one.history,
            createHash('sha256').update(real).digest('hex').slice(0, 16)
        );
        expect(historyFolder(one.history, real)).toBe(folder);
        const entries = JSON.parse(readFileSync(join(folder, 'entries.json'), 'utf8')) as {
            path: string;
            saves: { id: string; at: number; size: number; kind: string }[];
        };
        expect(entries.path).toBe(real);
        expect(entries.saves).toHaveLength(1);
        expect(entries.saves[0]).toMatchObject({ size: 4, kind: 'save' });
        expect(entries.saves[0].id).toMatch(/^\d{8}T\d{9}$/);
        expect(readFileSync(join(folder, entries.saves[0].id), 'utf8')).toBe('one\n');
        expect(readdirSync(folder).sort()).toEqual(['entries.json', entries.saves[0].id].sort());
    });

    it('keeps a copy before the write, so the copy is the text the save replaced', async () => {
        const one = fixture();
        await save(one, 'two\n');
        await save(one, 'three\n');
        const real = realOf(one);
        const saves = savesOf(one.history, real).saves;
        expect(saves.map((s) => readCopy(one.history, real, s.id)?.toString())).toEqual([
            'one\n',
            'two\n'
        ]);
    });

    it('gives a second copy in the same millisecond another id', () => {
        const one = fixture();
        const first = keepCopy(one.history, one.file, 'save', 1_700_000_000_123);
        const second = keepCopy(one.history, one.file, 'save', 1_700_000_000_123);
        expect(first.ok && first.kept?.id).toBe('20231114T221320123');
        expect(second.ok && second.kept?.id).toBe('20231114T221320123-2');
    });

    it('keeps the newest 50 copies of kind save and removes the older ones', () => {
        const one = fixture();
        for (let at = 0; at < SAVES_KEPT + 3; at += 1) {
            keepCopy(one.history, one.file, 'save', 1_700_000_000_000 + at * 1000);
        }
        const real = realOf(one);
        const saves = savesOf(one.history, real).saves;
        expect(saves).toHaveLength(SAVES_KEPT);
        expect(saves[0].at).toBe(1_700_000_000_000 + 3 * 1000);
        expect(readdirSync(historyFolder(one.history, real))).toHaveLength(SAVES_KEPT + 1);
    });

    it('does not count a copy of kind delete among the 50', () => {
        const one = fixture();
        keepCopy(one.history, one.file, 'delete', 1_700_000_000_000);
        for (let at = 1; at <= SAVES_KEPT + 2; at += 1) {
            keepCopy(one.history, one.file, 'save', 1_700_000_000_000 + at * 1000);
        }
        const saves = savesOf(one.history, realOf(one)).saves;
        expect(saves.filter((s) => s.kind === 'delete')).toHaveLength(1);
        expect(saves.filter((s) => s.kind === 'save')).toHaveLength(SAVES_KEPT);
    });

    it('keeps the newest 50 copies of kind delete over all files and removes the oldest', () => {
        const one = fixture();
        const dir = join(one.dir, 'root');
        const [first, last] = [join(dir, 'first.md'), join(dir, 'last.md')];
        writeFileSync(first, 'first\n');
        writeFileSync(last, 'last\n');
        keepCopy(one.history, first, 'delete', 1_700_000_000_000);
        listDeletes(one.history, DELETES_KEPT - 1, 1_700_000_001_000);
        keepCopy(one.history, last, 'delete', 1_700_000_100_000);
        // The 51st delete has been added: the first file's copy is gone, the other 50 remain.
        expect(savesOf(one.history, realpathSync(first)).saves).toEqual([]);
        expect(existsSync(historyFolder(one.history, realpathSync(first)))).toBe(false);
        expect(savesOf(one.history, realpathSync(last)).saves).toHaveLength(1);
        const listed = deletesListed(one.history);
        expect(listed).toHaveLength(DELETES_KEPT);
        expect(listed.at(-1)?.at).toBe(1_700_000_100_000);
    });

    it('reads the index of delete copies on a delete and no folder it does not list', () => {
        const one = fixture();
        const dir = join(one.dir, 'root');
        writeFileSync(join(dir, 'first.md'), 'first\n');
        keepCopy(one.history, join(dir, 'first.md'), 'delete', 1_700_000_000_000);
        // A folder the index does not list, holding more delete copies than are kept.
        const unlisted = join(one.history, '0'.repeat(16));
        mkdirSync(unlisted);
        const saves = Array.from({ length: DELETES_KEPT + 5 }, (_, n) => ({
            id: `20231114T22${String(n).padStart(2, '0')}20000`,
            at: 1_600_000_000_000 + n,
            size: 1,
            kind: 'delete'
        }));
        const text = `${JSON.stringify({ path: '/gone.md', saves })}\n`;
        writeFileSync(join(unlisted, 'entries.json'), text);
        writeFileSync(join(dir, 'second.md'), 'second\n');
        keepCopy(one.history, join(dir, 'second.md'), 'delete', 1_700_000_001_000);
        expect(readFileSync(join(unlisted, 'entries.json'), 'utf8')).toBe(text);
        expect(deletesListed(one.history)).toHaveLength(2);
    });

    it('builds the index of delete copies again from the folders when it is gone', () => {
        const one = fixture();
        const dir = join(one.dir, 'root');
        const [first, last] = [join(dir, 'first.md'), join(dir, 'last.md')];
        writeFileSync(first, 'first\n');
        writeFileSync(last, 'last\n');
        keepCopy(one.history, first, 'delete', 1_700_000_000_000);
        // 49 later delete copies written as folders, with no index naming them.
        for (let n = 0; n < DELETES_KEPT - 1; n += 1) {
            const folder = join(one.history, `${n}`.padStart(16, 'a'));
            const id = `20231114T221321${String(n).padStart(3, '0')}`;
            const saves = [{ id, at: 1_700_000_001_000 + n, size: 1, kind: 'delete' }];
            mkdirSync(folder);
            writeFileSync(join(folder, id), 'x');
            writeFileSync(join(folder, 'entries.json'), JSON.stringify({ path: `/d${n}`, saves }));
        }
        unlinkSync(join(one.history, 'deletes.json'));
        keepCopy(one.history, last, 'delete', 1_700_000_100_000);
        expect(savesOf(one.history, realpathSync(first)).saves).toEqual([]);
        expect(savesOf(one.history, realpathSync(last)).saves).toHaveLength(1);
        const listed = deletesListed(one.history);
        expect(listed).toHaveLength(DELETES_KEPT);
        expect(listed[0].at).toBe(1_700_000_001_000);
    });

    it('takes a forgotten delete copy out of the index', () => {
        const one = fixture();
        const kept = keepCopy(one.history, one.file, 'delete', 1_700_000_000_000);
        if (!kept.ok || kept.kept === null) throw new Error('no copy kept');
        forgetCopy(one.history, realOf(one), kept.kept.id);
        expect(deletesListed(one.history)).toEqual([]);
    });

    it('makes no copy of a file over 256 KB and still saves it', async () => {
        const one = fixture();
        writeFileSync(one.file, 'x'.repeat(SAVE_MAX_BYTES + 1));
        const answer = await save(one, 'small\n');
        expect(await answer.json()).toEqual({ ok: true });
        expect(readFileSync(one.file, 'utf8')).toBe('small\n');
        expect(existsSync(one.history)).toBe(false);
    });

    it('makes a copy of a file of exactly 256 KB', () => {
        const one = fixture();
        writeFileSync(one.file, 'x'.repeat(SAVE_MAX_BYTES));
        const kept = keepCopy(one.history, one.file, 'save');
        expect(kept.ok && kept.kept?.size).toBe(SAVE_MAX_BYTES);
    });

    it('makes no copy for a save that is refused', async () => {
        const one = fixture();
        const token = mintToken();
        const outside = await handleSource(
            request(token, { root: 'fixture', path: '../x.md', content: 'x' }),
            token,
            [one.root],
            one.history
        );
        const stale = await handleSource(
            request('stale', { root: 'fixture', path: 'notes.md', content: 'x' }),
            token,
            [one.root],
            one.history
        );
        expect([outside.status, stale.status]).toEqual([403, 403]);
        expect(existsSync(one.history)).toBe(false);
    });

    it('says a copy failed and still writes the file', async () => {
        const one = fixture();
        // A file where the history folder should be: the copy cannot be made.
        writeFileSync(one.history, 'not a folder');
        const answer = await save(one, 'two\n');
        expect(answer.status).toBe(200);
        const body = (await answer.json()) as { ok: boolean; refused: { field: string }[] };
        expect(body.ok).toBe(true);
        expect(body.refused.map((r) => r.field)).toEqual(['history']);
        expect(readFileSync(one.file, 'utf8')).toBe('two\n');
    });

    it('never copies the machine own config/local.yml', async () => {
        const one = fixture();
        const engine = join(one.dir, 'engine');
        mkdirSync(join(engine, 'config'), { recursive: true });
        const own = join(engine, 'config', 'local.yml');
        writeFileSync(own, 'hub: /elsewhere\n');
        const token = mintToken();
        const answer = await handleSource(
            request(token, { root: ENGINE_ROOT, path: 'local.yml', content: 'hub: /srv/x\n' }),
            token,
            [engineRoot(engine)],
            one.history
        );
        expect(await answer.json()).toEqual({ ok: true });
        expect(readFileSync(own, 'utf8')).toBe('hub: /srv/x\n');
        expect(existsSync(one.history)).toBe(false);
    });
});

describe('restoring a copy', () => {
    // Revert: keep no copy when a save writes text that came out of the history.
    it('writes the copy back, and the history gains the text it replaced', async () => {
        const one = fixture();
        await save(one, 'two\n');
        await save(one, 'three\n');
        const [oldest] = savesOf(one.history, realOf(one)).saves;
        const before = (
            (await await ask(one, 'root=fixture&path=notes.md').json()) as { saves: unknown[] }
        ).saves.length;
        const asked = (await ask(one, `root=fixture&path=notes.md&id=${oldest.id}`).json()) as {
            content: string;
        };

        await save(one, asked.content);

        expect(asked.content).toBe('one\n');
        expect(readFileSync(one.file, 'utf8')).toBe('one\n');
        const saves = savesOf(one.history, realOf(one)).saves;
        expect(saves).toHaveLength(before + 1);
        expect(readCopy(one.history, realOf(one), saves[saves.length - 1].id)?.toString()).toBe(
            'three\n'
        );
    });
});

describe('GET /api/history', () => {
    it('lists the copies of a file newest first', async () => {
        const one = fixture();
        await save(one, 'two\n');
        await save(one, 'three\n');
        const body = (await ask(one, 'root=fixture&path=notes.md').json()) as {
            ok: boolean;
            saves: { at: number; kind: string }[];
        };
        expect(body.ok).toBe(true);
        expect(body.saves).toHaveLength(2);
        expect(body.saves[0].at).toBeGreaterThanOrEqual(body.saves[1].at);
    });

    it('lists nothing for a file with no copies', async () => {
        const one = fixture();
        expect(await ask(one, 'root=fixture&path=notes.md').json()).toEqual({
            ok: true,
            saves: []
        });
    });

    it('answers the text of one copy by an id the file lists', async () => {
        const one = fixture();
        await save(one, 'two\n');
        const [first] = savesOf(one.history, realOf(one)).saves;
        const body: unknown = await ask(one, `root=fixture&path=notes.md&id=${first.id}`).json();
        expect(body).toEqual({ ok: true, id: first.id, content: 'one\n' });
    });

    it('refuses an id that names a path and an id the file does not list', async () => {
        const one = fixture();
        await save(one, 'two\n');
        writeFileSync(join(one.dir, 'x'), 'secret');
        for (const id of ['../x', '..%2Fx', '20000101T000000000', '']) {
            const answer = ask(one, `root=fixture&path=notes.md&id=${id}`);
            expect(answer.status).toBe(400);
            expect(await answer.json()).toEqual({ ok: false, error: 'no-such-save' });
        }
    });

    it('refuses a path outside the root and a request without its two parameters', () => {
        const one = fixture();
        expect(ask(one, 'root=fixture&path=../x').status).toBe(400);
        expect(ask(one, 'root=nowhere&path=notes.md').status).toBe(400);
        expect(ask(one, 'root=fixture').status).toBe(400);
    });

    it('lists the copies of a file that is gone', async () => {
        const one = fixture();
        keepCopy(one.history, one.file, 'delete');
        unlinkSync(one.file);
        const body = (await ask(one, 'root=fixture&path=notes.md').json()) as {
            saves: { kind: string }[];
        };
        expect(body.saves.map((s) => s.kind)).toEqual(['delete']);
    });
});
