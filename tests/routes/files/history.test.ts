// Layer 2, route tests. The local history of a file: the copy POST /api/source keeps before a save
// and GET /api/history lists and reads, over one synthetic root and one history folder under the
// system temporary directory. Both folders are asserted inside it before anything is written, so
// no case writes ~/.oculus/history.

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { ENGINE_ROOT, engineRoot, type Root } from '../../../src/lib/server/files/files.ts';
import { handleHistory, readCopy, savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { handleSource } from '../../../src/lib/server/files/source.ts';
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

describe('GET /api/history', () => {
    it('refuses a path outside the root and a request without its two parameters', () => {
        const one = fixture();
        expect(ask(one, 'root=fixture&path=../x').status).toBe(400);
        expect(ask(one, 'root=nowhere&path=notes.md').status).toBe(400);
        expect(ask(one, 'root=fixture').status).toBe(400);
    });
});
