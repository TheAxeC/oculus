// The source endpoint against one synthetic root under the system temporary directory: what the GET
// says about a file, and the write's authentication, root, mode and content refusals, its
// replacement and the neighbour-rename result.

import {
    chmodSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import {
    handleSource,
    handleSourceInfo,
    isBinaryFile
} from '../../../src/lib/server/files/source.ts';
import { ENGINE_ROOT, engineRoot } from '../../../src/lib/server/files/files.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const HOST = '127.0.0.1:8790';
const temporary: string[] = [];

afterEach(() => {
    for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function fixture(): { dir: string; root: Root; file: string; outside: string } {
    const dir = scratchDir('oculus-source-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    temporary.push(dir);
    const rootDir = join(dir, 'root');
    mkdirSync(rootDir);
    const file = join(rootDir, 'notes.md');
    const outside = join(dir, 'outside.md');
    for (const path of [file, outside]) {
        expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(path, 'before\n');
    }
    return { dir, root: { key: 'fixture', dir: rootDir }, file, outside };
}

function request(token: string, body: unknown, origin = true): Request {
    const headers: Record<string, string> = {
        'content-type': 'application/json',
        host: HOST,
        [TOKEN_HEADER]: token
    };
    if (origin) headers['sec-fetch-site'] = 'same-origin';
    return new Request(`http://${HOST}/api/source`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
}

describe('POST /api/source', () => {
    it('requires the same origin and current write token', async () => {
        const one = fixture();
        const token = mintToken();
        const body = { root: one.root.key, path: 'notes.md', content: 'after\n' };
        expect((await handleSource(request(token, body, false), token, [one.root])).status).toBe(
            403
        );
        expect((await handleSource(request('stale', body), token, [one.root])).status).toBe(403);
        expect(readFileSync(one.file, 'utf8')).toBe('before\n');
    });

    it('refuses a path outside the named root', async () => {
        const one = fixture();
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: '../outside.md', content: 'after\n' }),
            token,
            [one.root]
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            ok: false,
            error: 'the path is outside the named root',
            refused: [{ field: 'path', reason: 'the path is outside the named root' }]
        });
        expect(readFileSync(one.outside, 'utf8')).toBe('before\n');
    });

    it('writes a file of any name whose bytes are text, since no list says which', async () => {
        const one = fixture();
        const file = join(one.root.dir, 'script.py');
        expect(resolve(file).startsWith(resolve(one.root.dir) + sep)).toBe(true);
        writeFileSync(file, 'before\n');
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: 'script.py', content: 'after\n' }),
            token,
            [one.root]
        );
        expect(response.status).toBe(200);
        expect(readFileSync(file, 'utf8')).toBe('after\n');
    });

    it('refuses a file this machine locks with readonly, and writes nothing', async () => {
        const one = fixture();
        chmodSync(one.file, 0o444);
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: 'notes.md', content: 'after\n' }),
            token,
            [one.root]
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            ok: false,
            error: 'readonly',
            refused: [{ field: 'path', reason: 'readonly' }]
        });
        expect(readFileSync(one.file, 'utf8')).toBe('before\n');
    });

    it('refuses a file whose own bytes are not text with binary, and writes nothing', async () => {
        const one = fixture();
        const file = join(one.root.dir, 'data.npz');
        expect(resolve(file).startsWith(resolve(one.root.dir) + sep)).toBe(true);
        const held = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0x02, 0x03]);
        writeFileSync(file, held);
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: 'data.npz', content: 'after\n' }),
            token,
            [one.root]
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            ok: false,
            error: 'binary',
            refused: [{ field: 'path', reason: 'binary' }]
        });
        expect(readFileSync(file)).toEqual(held);
    });

    it('writes a file whose character lies across the end of the rule window', async () => {
        const one = fixture();
        const file = join(one.root.dir, 'long.csv');
        expect(resolve(file).startsWith(resolve(one.root.dir) + sep)).toBe(true);
        // The two bytes of the accented letter fall on either side of byte 8192, which the write
        // must read as a cut of its own window and not as a file that is not UTF-8.
        writeFileSync(file, 'a'.repeat(8191) + '\u00e9' + 'more text after it\n');
        expect(isBinaryFile(file)).toBe(false);
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: 'long.csv', content: 'after\n' }),
            token,
            [one.root]
        );
        expect(response.status).toBe(200);
        expect(readFileSync(file, 'utf8')).toBe('after\n');
    });

    it('writes a file it cannot read, since the mode says the write is allowed', async () => {
        const one = fixture();
        const file = join(one.root.dir, 'blind.md');
        expect(resolve(file).startsWith(resolve(one.root.dir) + sep)).toBe(true);
        writeFileSync(file, 'before\n');
        chmodSync(file, 0o222);
        // Nothing is decided about a file nothing could be read from: the mode allows the write.
        expect(isBinaryFile(file)).toBe(false);
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: 'blind.md', content: 'after\n' }),
            token,
            [one.root]
        );
        expect(response.status).toBe(200);
        chmodSync(file, 0o644);
        expect(readFileSync(file, 'utf8')).toBe('after\n');
    });

    it('answers 404 for a missing file inside an existing root without creating it', async () => {
        const one = fixture();
        const token = mintToken();
        for (const path of ['missing.md', 'missing/folder/notes.md']) {
            const response = await handleSource(
                request(token, { root: one.root.key, path, content: 'after' }),
                token,
                [one.root]
            );
            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ ok: false, error: 'the file is not there' });
        }
        expect(readdirSync(one.root.dir)).toEqual(['notes.md']);
    });

    it('refuses symlink escapes, including a missing child outside the root', async () => {
        const one = fixture();
        const link = join(one.root.dir, 'escaped');
        expect(resolve(link).startsWith(resolve(one.root.dir) + sep)).toBe(true);
        symlinkSync(one.dir, link, 'dir');
        const token = mintToken();
        for (const path of ['escaped/outside.md', 'escaped/missing.md', '../missing.md']) {
            const response = await handleSource(
                request(token, { root: one.root.key, path, content: 'after' }),
                token,
                [one.root]
            );
            expect(response.status).toBe(403);
            expect(await response.json()).toMatchObject({
                refused: [{ field: 'path', reason: 'the path is outside the named root' }]
            });
        }
        expect(readFileSync(one.outside, 'utf8')).toBe('before\n');
    });

    it('replaces the complete file through a temporary neighbour and atomic rename', async () => {
        const one = fixture();
        const token = mintToken();
        const inode = statSync(one.file).ino;
        const response = await handleSource(
            request(token, {
                root: one.root.key,
                path: 'notes.md',
                content: 'whole replacement\n'
            }),
            token,
            [one.root]
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
        expect(readFileSync(one.file, 'utf8')).toBe('whole replacement\n');
        expect(statSync(one.file).ino).not.toBe(inode);
        expect(
            readdirSync(one.root.dir).filter((name) => name.startsWith('.oculus-write-'))
        ).toEqual([]);
    });
});

describe('GET /api/source', () => {
    /** The GET as the page makes it, which carries no body and no token. */
    function ask(root: string, path: string, origin = true): { request: Request; url: URL } {
        const address = new URL(
            `http://${HOST}/api/source?root=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`
        );
        const headers: Record<string, string> = { host: HOST };
        if (origin) headers['sec-fetch-site'] = 'same-origin';
        return { request: new Request(address, { headers }), url: address };
    }

    it('says a writable file is not read-only and a file of mode 0444 is', async () => {
        const one = fixture();
        const open = ask(one.root.key, 'notes.md');
        expect(await handleSourceInfo(open.request, open.url, [one.root]).json()).toEqual({
            ok: true,
            readonly: false
        });

        chmodSync(one.file, 0o444);
        const locked = ask(one.root.key, 'notes.md');
        expect(await handleSourceInfo(locked.request, locked.url, [one.root]).json()).toEqual({
            ok: true,
            readonly: true
        });
    });

    it('answers 404 for a file that is not there and refuses a path outside the root', () => {
        const one = fixture();
        const missing = ask(one.root.key, 'missing.md');
        expect(handleSourceInfo(missing.request, missing.url, [one.root]).status).toBe(404);
        const outside = ask(one.root.key, '../outside.md');
        expect(handleSourceInfo(outside.request, outside.url, [one.root]).status).toBe(403);
    });

    it('requires the same origin and both of its two parameters', () => {
        const one = fixture();
        const other = ask(one.root.key, 'notes.md', false);
        expect(handleSourceInfo(other.request, other.url, [one.root]).status).toBe(403);
        const bare = ask('', '');
        expect(handleSourceInfo(bare.request, bare.url, [one.root]).status).toBe(400);
    });
});

describe('a config file of the engine', () => {
    /** An engine directory with its config folder, which is what the `engine` root serves. */
    function engineFixture(): { engine: string; file: string } {
        const dir = scratchDir('oculus-source-engine-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        temporary.push(dir);
        const folder = join(dir, 'config');
        mkdirSync(folder);
        const file = join(folder, 'layout.yml');
        expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(file, 'nav_groups: {}\n');
        writeFileSync(join(folder, 'local.yml'), 'hub: /elsewhere\n');
        writeFileSync(join(dir, 'local.yml'), 'hub: /above\n');
        return { engine: dir, file };
    }

    it('is written into the config folder through the engine root', async () => {
        const one = engineFixture();
        const token = mintToken();
        const body = {
            root: ENGINE_ROOT,
            path: 'layout.yml',
            content: 'nav_groups:\n  boards: { label: "Boards" }\n'
        };
        const answer = await handleSource(request(token, body), token, [engineRoot(one.engine)]);

        expect(answer.status).toBe(200);
        expect(await answer.json()).toEqual({ ok: true });
        expect(readFileSync(one.file, 'utf8')).toBe(body.content);
    });

    it('writes the machine own file of that folder like any other', async () => {
        const one = engineFixture();
        const token = mintToken();
        const body = { root: ENGINE_ROOT, path: 'local.yml', content: 'hub: /srv/research-hub\n' };
        const answer = await handleSource(request(token, body), token, [engineRoot(one.engine)]);

        expect(answer.status).toBe(200);
        expect(await answer.json()).toEqual({ ok: true });
        expect(readFileSync(join(one.engine, 'config', 'local.yml'), 'utf8')).toBe(body.content);
    });

    it('refuses a machine own file the next read would throw over, and writes nothing', async () => {
        const one = engineFixture();
        const own = join(one.engine, 'config', 'local.yml');
        const before = readFileSync(own, 'utf8');
        const token = mintToken();
        const answer = await handleSource(
            request(token, { root: ENGINE_ROOT, path: 'local.yml', content: 'port: eight\n' }),
            token,
            [engineRoot(one.engine)]
        );

        expect(answer.status).toBe(400);
        expect(await answer.json()).toEqual({
            ok: false,
            error: 'local.yml: port must be an integer'
        });
        expect(readFileSync(own, 'utf8')).toBe(before);
    });

    it('checks that one file, so the same text saved into a tracked file is written', async () => {
        const one = engineFixture();
        const token = mintToken();
        const answer = await handleSource(
            request(token, { root: ENGINE_ROOT, path: 'layout.yml', content: 'port: eight\n' }),
            token,
            [engineRoot(one.engine)]
        );

        expect(answer.status).toBe(200);
        expect(readFileSync(one.file, 'utf8')).toBe('port: eight\n');
    });

    it('refuses a path that climbs above that folder', async () => {
        const one = engineFixture();
        const token = mintToken();
        const answer = await handleSource(
            request(token, { root: ENGINE_ROOT, path: '../local.yml', content: 'hub: /taken\n' }),
            token,
            [engineRoot(one.engine)]
        );

        expect(answer.status).toBe(403);
        expect(readFileSync(join(one.engine, 'local.yml'), 'utf8')).toBe('hub: /above\n');
    });
});
