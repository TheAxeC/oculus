// Layer 2, route tests. The local history of a file: the copy POST /api/source keeps before a save
// and GET /api/history lists and reads, over one synthetic root and one history folder under the
// system temporary directory. Both folders are asserted inside it before anything is written, so
// no case writes ~/.oculus/history.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import type { Root } from '../../../src/lib/server/files/workspace/folders.ts';
import { handleHistory, readCopy, savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { handleSource } from '../../../src/lib/server/files/source/source.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { TEXT } from '../../server/text.ts';

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
        () => TEXT,
        list,
        join(one.dir, 'oculus', 'config'),
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

    it.each([
        ['the hub folder', 'lab', '.oculus/local.yml'],
        ['a folder over the hub .oculus, listed beside the hub', 'labdot', 'local.yml']
    ])("never copies a hub's .oculus/local.yml, reached through %s", async (_where, key, path) => {
        const one = fixture();
        const lab = join(one.dir, 'lab');
        mkdirSync(join(lab, '.oculus', 'config'), { recursive: true });
        const own = join(lab, '.oculus', 'local.yml');
        writeFileSync(own, 'port: 8800\n');
        const list: Root[] = [
            { key: 'lab', dir: lab, hub: true },
            { key: 'labdot', dir: join(lab, '.oculus') }
        ];
        const token = mintToken();
        const answer = await handleSource(
            request(token, { root: key, path, content: 'port: 8801\n' }),
            token,
            () => TEXT,
            list,
            join(one.dir, 'oculus', 'config'),
            one.history
        );
        expect(await answer.json()).toEqual({
            ok: true,
            hash: createHash('sha256').update('port: 8801\n').digest('hex')
        });
        expect(readFileSync(own, 'utf8')).toBe('port: 8801\n');
        expect(existsSync(one.history)).toBe(false);
    });

    it.each([
        ['a workspace folder over the oculus config folder', 'cfg', 'local.yml'],
        ['the hub folder that holds the oculus config folder', 'top', 'oculus/config/local.yml']
    ])(
        "never copies oculus's own config/local.yml, reached through %s",
        async (_where, key, path) => {
            const one = fixture();
            const config = join(one.dir, 'oculus', 'config');
            mkdirSync(config, { recursive: true });
            const own = join(config, 'local.yml');
            writeFileSync(own, 'port: 8800\n');
            const list: Root[] = [
                { key: 'top', dir: one.dir, hub: true },
                { key: 'cfg', dir: config }
            ];
            const token = mintToken();
            const answer = await handleSource(
                request(token, { root: key, path, content: 'port: 8801\n' }),
                token,
                () => TEXT,
                list,
                config,
                one.history
            );
            expect(await answer.json()).toEqual({
                ok: true,
                hash: createHash('sha256').update('port: 8801\n').digest('hex')
            });
            expect(readFileSync(own, 'utf8')).toBe('port: 8801\n');
            expect(existsSync(one.history)).toBe(false);
        }
    );
});

describe('GET /api/history', () => {
    it('refuses a path outside the root and a request without its two parameters', () => {
        const one = fixture();
        expect(ask(one, 'root=fixture&path=../x').status).toBe(400);
        expect(ask(one, 'root=nowhere&path=notes.md').status).toBe(400);
        expect(ask(one, 'root=fixture').status).toBe(400);
    });
});
