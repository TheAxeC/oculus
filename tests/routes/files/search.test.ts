// Layer 2, route tests. What the /api/search route answers. The route itself is a few lines handing
// the request to lib/server/files/search/search-routes.ts with the token ServerContext minted,
// which is what this calls.
//
// Nothing here runs ripgrep: the handler takes its runner as an option, so every case hands it a
// stub the test owns, the roots are names rather than directories, and no file is read anywhere.
// What the binary does with a well-formed query is tests/server/files/search.test.ts.

import { describe, expect, it } from 'vitest';
import {
    handleSearch,
    type SearchRouteOptions
} from '../../../src/lib/server/files/search/search-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { RunOutcome } from '../../../src/lib/server/files/search/search.ts';

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';

/** The two roots every case may name. They are names: nothing opens them. */
const ROOTS = [
    { key: 'hub', dir: '/hub' },
    { key: 'notes', dir: '/notes' }
];

/** The records of one `rg --json` stream over one file. */
const BEGIN = JSON.stringify({ type: 'begin', data: { path: { text: './src/a.ts' } } });

const MATCH = JSON.stringify({
    type: 'match',
    data: {
        path: { text: './src/a.ts' },
        lines: { text: 'the needle here\n' },
        line_number: 12,
        submatches: [{ match: { text: 'needle' }, start: 4, end: 10 }]
    }
});

const END = JSON.stringify({
    type: 'end',
    data: { path: { text: './src/a.ts' }, stats: { matched_lines: 1 } }
});

/** One stream over one file with one match. */
const STREAM = [BEGIN, MATCH, END].join('\n');

/** What ran, so a case can assert that a refusal refused before the process. */
let ran: string[] = [];

function options(answer: Partial<RunOutcome> & { stdout?: string } = {}): SearchRouteOptions {
    ran = [];
    const { stdout = STREAM, ...rest } = answer;
    return {
        roots: ROOTS,
        cap: 500,
        maxNames: 100,
        timeout: 10000,
        now: () => 0,
        run: (dir, _args, _timeout, onLine) => {
            ran.push(dir);
            let stopped = false;
            for (const line of stdout.split('\n')) {
                if (!onLine(line)) {
                    stopped = true;
                    break;
                }
            }
            return Promise.resolve({
                code: 0,
                stderr: '',
                timedOut: false,
                stopped,
                ...rest
            });
        }
    };
}

/** A request as the page makes it, with whatever query and headers a case wants instead. */
function request(query: string, headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/search?${query}`, {
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': TOKEN,
            ...headers
        }
    });
}

describe('the gates', () => {
    it('refuses a request without the write token', async () => {
        const response = await handleSearch(
            request('q=needle', { 'x-oculus-token': 'stale' }),
            TOKEN,
            options()
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'token' });
        expect(ran).toEqual([]);
    });
});
