// Layer 2, route tests. GET /api/app-store (lib/server/machine/apps/routes/routes.ts
// `handleStoreGet`, which src/routes/api/(apps)/app-store/+server.ts calls): the version and the
// value of one held app's store, and the 400 or 404 for every other request. The 405 for a verb
// other than GET is SvelteKit's, since the route module exports no other verb, so no case reaches
// it here.
//
// Every store file is under the system temporary directory. What this does NOT cover: the origin
// guard that refuses the opaque origin of an app's frame before this runs (src/hooks.server.ts).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { handleStoreGet } from '../../../src/lib/server/machine/apps/routes/routes.ts';
import { it } from '../../fixtures/scratch.ts';
import { notesFiles, routeSetup } from './apps-fixture.ts';

/** The answer to a request for the route's address over a setup that holds `notes`. */
function ask(query: string, method = 'GET', store?: string) {
    const setup = routeSetup({ machine: notesFiles() });
    if (store !== undefined) {
        mkdirSync(join(setup.fixture.base, 'data'), { recursive: true });
        writeFileSync(join(setup.fixture.base, 'data', 'notes.json'), store);
        setup.options.apps.reread();
    }
    return handleStoreGet(
        new Request(`http://localhost:8787/api/app-store${query}`, { method }),
        setup.options
    );
}

const NOTES = '?view=app%3Anotes';

describe("answers a held row's store, and 400 or 404 for every other request", () => {
    it.each([
        {
            row: 'a held row, with its version and value',
            query: NOTES,
            store: '{"seen":["a","b"]}',
            expected: { status: 200, cache: 'no-store', value: { seen: ['a', 'b'] }, version: true }
        },
        {
            row: 'an app with no store file, with a null value and an empty version',
            query: NOTES,
            store: undefined,
            expected: { status: 200, cache: 'no-store', value: null, version: false }
        },
        {
            row: 'a store file that does not parse, with a null value',
            query: NOTES,
            store: '{not json',
            expected: { status: 200, cache: 'no-store', value: null, version: true }
        },
        {
            row: 'a store file over the limit, with a null value',
            query: NOTES,
            store: JSON.stringify({ text: 'x'.repeat(300 * 1024) }),
            expected: { status: 200, cache: 'no-store', value: null, version: true }
        },
        { row: 'no view', query: '', store: undefined, expected: { status: 400 } },
        { row: 'an empty view', query: '?view=', store: undefined, expected: { status: 400 } },
        {
            row: 'a view given twice',
            query: `${NOTES}&view=app%3Anotes`,
            store: undefined,
            expected: { status: 400 }
        },
        {
            row: 'a view no row names',
            query: '?view=app%3Anonesuch',
            store: undefined,
            expected: { status: 404 }
        }
    ])('answers $row', async ({ query, store, expected }) => {
        const answer = ask(query, 'GET', store);
        if (expected.status !== 200) {
            expect({ status: answer.status }).toEqual(expected);
            return;
        }
        const body = (await answer.json()) as { version: string; value: unknown };
        expect({
            status: answer.status,
            cache: answer.headers.get('cache-control'),
            value: body.value,
            version: /^[0-9a-f]{16}$/.test(body.version)
        }).toEqual(expected);
        if (!expected.version) expect(body.version).toBe('');
    });
});
