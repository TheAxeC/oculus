// What server/files/search.ts does with a query and with a request for names: which roots it runs
// over.

import { describe, expect } from 'vitest';
import { runNames, runSearch, type RunOutcome } from '../../../src/lib/server/files/search.ts';
import { emptyQuery, type SearchQuery } from '../../../src/lib/data/helpers/search/query.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { it } from '../../fixtures/scratch.ts';

const ROOTS: Root[] = [
    { key: 'hub', dir: '/hub' },
    { key: 'engine', dir: '/engine' }
];

/** The milliseconds every case gives one root, standing in for `search.timeout_s`. */
const TIMEOUT = 10000;

function query(changes: Partial<SearchQuery> = {}): SearchQuery {
    return { ...emptyQuery(500), q: 'needle', ...changes };
}

/** A run that answers nothing at all, so the fold sees an empty stream. */
function quiet(): RunOutcome {
    return { code: 1, stderr: '', timedOut: false, stopped: false };
}

describe('what the process is given', () => {
    it('refuses a root outside the served list before any process starts', async () => {
        let started = 0;
        const outcome = await runSearch(ROOTS, query({ root: 'elsewhere' }), {
            run: () => {
                started += 1;
                return Promise.resolve(quiet());
            },
            timeout: TIMEOUT
        });
        expect(outcome).toEqual({ ok: false, refused: 'unknown_root' });
        expect(started).toBe(0);
    });

    it('refuses a names list for a root outside the served list before any process starts', async () => {
        for (const root of ['elsewhere', '']) {
            let started = 0;
            const outcome = await runNames(ROOTS, root, {
                run: () => {
                    started += 1;
                    return Promise.resolve(quiet());
                },
                timeout: TIMEOUT,
                max: 100,
                withheld: []
            });
            expect(outcome).toEqual({ ok: false, refused: 'unknown_root' });
            expect(started).toBe(0);
        }
    });
});
