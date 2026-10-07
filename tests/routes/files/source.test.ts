// Layer 2, route tests. The source endpoint against one synthetic root under the system temporary
// directory: the write's authentication, root refusals, its replacement and the neighbour-rename
// result.

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { handleSource } from '../../../src/lib/server/files/source.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { TEXT } from '../../server/text.ts';

const HOST = '127.0.0.1:8790';

function fixture(): { dir: string; root: Root; file: string; outside: string } {
    const dir = scratchDir('oculus-source-');
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

function request(token: string, body: unknown): Request {
    const headers: Record<string, string> = {
        'content-type': 'application/json',
        host: HOST,
        'sec-fetch-site': 'same-origin',
        [TOKEN_HEADER]: token
    };
    return new Request(`http://${HOST}/api/source`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
}

describe('POST /api/source', () => {
    it('requires the current write token', async () => {
        const one = fixture();
        const token = mintToken();
        const body = { root: one.root.key, path: 'notes.md', content: 'after\n' };
        expect(
            (await handleSource(request('stale', body), token, () => TEXT, [one.root])).status
        ).toBe(403);
        expect(readFileSync(one.file, 'utf8')).toBe('before\n');
    });

    it('refuses a path outside the named root', async () => {
        const one = fixture();
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: '../outside.md', content: 'after\n' }),
            token,
            () => TEXT,
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

    it('replaces the complete file through a temporary neighbour and atomic rename', async () => {
        const one = fixture();
        const token = mintToken();
        const inode = statSync(one.file).ino;
        const held = readdirSync(one.root.dir).sort();
        const response = await handleSource(
            request(token, {
                root: one.root.key,
                path: 'notes.md',
                content: 'whole replacement\n'
            }),
            token,
            () => TEXT,
            [one.root]
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
        expect(readFileSync(one.file, 'utf8')).toBe('whole replacement\n');
        expect(statSync(one.file).ino).not.toBe(inode);
        expect(readdirSync(one.root.dir).sort()).toEqual(held);
    });
});
