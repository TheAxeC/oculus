// Layer 2, route tests. What the /api/memories route accepts: one added.
// The route itself hands the request to lib/server/content/memories.ts, which is what this reads.
//
// Nothing here reads the hub's own .oculus/memories folder or machine-local config: every case
// builds its own directory under the system temporary directory and asserts each write stays inside
// it, so no case can write into the checkout. This does not cover the browser drawing the wall.

import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { add } from '../../../src/lib/server/content/memories.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import { TEXT } from '../../server/text.ts';

const TOKEN = mintToken();

/**
 * A directory holding the named files inside the system temporary directory: each one byte, or the
 * bytes `held` names for it.
 */
function pictures(names: string[], held: Record<string, Uint8Array> = {}): string {
    const dir = scratchDir('oculus-memories-');
    for (const name of names) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, held[name] ?? 'x');
    }
    return dir;
}

/** One POST of the wall's own page, carrying the process token. */
function request(body: unknown, token = TOKEN): Request {
    return pagePost('http://127.0.0.1:8790/api/memories', body, token);
}

/** One pixel of PNG, as base64, which is what an upload carries. */
const PIXEL =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('the endpoint of an upload', () => {
    it('refuses a request without the token, and writes nothing', async () => {
        const dir = pictures([]);
        const response = await add(
            dir,
            request({ name: 'one.png', data: PIXEL }, 'stale'),
            TOKEN,
            () => TEXT
        );
        expect(response.status).toBe(403);
        expect(existsSync(join(dir, 'one.png'))).toBe(false);
    });

    it('answers the catalog sentence and writes nothing when no hub holds a photo wall', async () => {
        const response = await add(
            null,
            request({ name: 'one.png', data: PIXEL }),
            TOKEN,
            () => TEXT
        );
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: words(TEXT, 'server.memories.no_wall') });
    });
});
