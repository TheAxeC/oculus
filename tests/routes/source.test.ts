// The whole-file source write against one synthetic root under the system temporary directory:
// authentication, root and extension refusals, replacement, and the neighbour-rename result.

import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../src/lib/server/auth.ts';
import { handleSource } from '../../src/lib/server/source.ts';
import type { Root } from '../../src/lib/server/files.ts';

const EDITABLE = ['.md', '.yml'];
const HOST = '127.0.0.1:8790';
const temporary: string[] = [];

afterEach(() => {
    for (const dir of temporary.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function fixture(): { dir: string; root: Root; file: string; outside: string } {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-source-'));
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
        expect(
            (await handleSource(request(token, body, false), token, [one.root], EDITABLE)).status
        ).toBe(403);
        expect(
            (await handleSource(request('stale', body), token, [one.root], EDITABLE)).status
        ).toBe(403);
        expect(readFileSync(one.file, 'utf8')).toBe('before\n');
    });

    it('refuses a path outside the named root', async () => {
        const one = fixture();
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: '../outside.md', content: 'after\n' }),
            token,
            [one.root],
            EDITABLE
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            ok: false,
            error: 'the path is outside the named root',
            refused: [{ field: 'path', reason: 'the path is outside the named root' }]
        });
        expect(readFileSync(one.outside, 'utf8')).toBe('before\n');
    });

    it('refuses an extension outside the configured editable list', async () => {
        const one = fixture();
        const file = join(one.root.dir, 'program.py');
        expect(resolve(file).startsWith(resolve(one.root.dir) + sep)).toBe(true);
        writeFileSync(file, 'before\n');
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: 'program.py', content: 'after\n' }),
            token,
            [one.root],
            EDITABLE
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            ok: false,
            error: 'the extension is not editable',
            refused: [{ field: 'path', reason: 'the extension is not editable' }]
        });
        expect(readFileSync(file, 'utf8')).toBe('before\n');
    });

    it('answers 404 for a missing file inside an existing root without creating it', async () => {
        const one = fixture();
        const token = mintToken();
        for (const path of ['missing.md', 'missing/folder/notes.md']) {
            const response = await handleSource(
                request(token, { root: one.root.key, path, content: 'after' }),
                token,
                [one.root],
                EDITABLE
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
                [one.root],
                EDITABLE
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
            [one.root],
            EDITABLE
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
