// Layer 2, route tests. What the /api/write route answers. The route itself is a single line
// handing the request to lib/server/edit/writes.ts with the token ServerContext minted, which is
// what this calls: handleWrite takes a Request, the token and the hub to write in, so every case
// here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the token actually reaching the page, and Kit
// putting it on the event.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no case
// pays for it.

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { GOOD, MANIFEST, TOKEN, manifestOf, request, target, warmConfig } from './write-fixture.ts';
import { it, test } from '../../fixtures/scratch.ts';

test.beforeAll(warmConfig);

describe('the write endpoint', () => {
    it('refuses a request with no token', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the write token is missing or stale' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('answers a session write over an overrides file it cannot read with the refusal', async () => {
        const into = target();
        const path = into.overrides ?? '';
        writeFileSync(path, '{"sessions": ');
        const response = await handleWrite(
            request({ kind: 'session', id: 'sess-1', hidden: true }),
            TOKEN,
            into
        );
        const body = (await response.json()) as { changed: string[]; refused: unknown[] };
        expect(body.changed).toEqual([]);
        expect(body.refused).toEqual([
            { field: 'hidden', reason: `${basename(path)} is not JSON: ${path}` }
        ]);
        expect(readFileSync(path, 'utf8')).toBe('{"sessions": ');
    });
});
