// What the /api/write route answers. The route itself is a single line handing the request to
// lib/server/writes.ts with the token hooks.server.ts minted, which is what this calls: handleWrite
// takes a Request, the token and the hub to write in, so every case here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the token actually reaching the page, and Kit
// putting it on the event, which is exercised by the curl in the package's verification.

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleWrite } from '../../src/lib/server/writes.ts';
import { mintToken } from '../../src/lib/server/auth.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../src/lib/server/writes.ts';

const MANIFEST = 'id: alpha\ntype: manuscript\ntitle: "A title"\nstatus:\n  line: "the line"\n';

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/write`;

function target(): WriteTarget {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-route-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    return {
        hub: dir,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] }
    };
}

/** A request as the page makes it, with whatever headers and body a case wants instead. */
function request(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(URL_, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

const GOOD = { kind: 'manifest', id: 'alpha', fields: { 'status.line': 'a new line' } };

function manifestOf(into: WriteTarget): string {
    return readFileSync(join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml'), 'utf8');
}

describe('the write endpoint', () => {
    it('refuses a request with no token', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the write token is missing or stale' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('refuses a request with a stale token', async () => {
        const into = target();
        const response = await handleWrite(
            request(GOOD, { 'x-oculus-token': mintToken() }),
            TOKEN,
            into
        );
        expect(response.status).toBe(403);
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('refuses a request from another origin', async () => {
        const into = target();
        const foreign = { origin: 'http://evil.invalid', 'sec-fetch-site': 'cross-site' };
        const response = await handleWrite(request(GOOD, foreign), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the request did not come from this page' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('refuses a request that names no origin at all', async () => {
        const bare = new Request(URL_, {
            method: 'POST',
            headers: { host: HOST, 'x-oculus-token': TOKEN },
            body: JSON.stringify(GOOD)
        });
        expect((await handleWrite(bare, TOKEN, target())).status).toBe(403);
    });

    it('refuses a body that is not JSON, and one that is not a manifest write', async () => {
        const into = target();
        expect((await handleWrite(request('not json'), TOKEN, into)).status).toBe(400);
        expect((await handleWrite(request({ kind: 'other' }), TOKEN, into)).status).toBe(400);
        expect(
            (await handleWrite(request({ kind: 'manifest', id: 'alpha' }), TOKEN, into)).status
        ).toBe(400);
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('answers 404 for an id the hub does not hold', async () => {
        const into = target();
        const body = { kind: 'manifest', id: 'nobody', fields: { title: 'x' } };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'no project with the id nobody' });
    });

    it('writes the field and says what changed', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['status.line'], refused: [] });
        expect(manifestOf(into)).toBe(MANIFEST.replace('"the line"', '"a new line"'));
    });

    it('carries a refusal back with the fields it did write', async () => {
        const into = target();
        const body = {
            kind: 'manifest',
            id: 'alpha',
            fields: { title: 'Another title', id: 'other' }
        };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['title'],
            refused: [{ field: 'id', reason: 'the field is read-only' }]
        });
    });
});
