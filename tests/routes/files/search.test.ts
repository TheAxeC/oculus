// What the /api/search route answers. The route itself is a few lines handing the request to
// lib/server/files/search-routes.ts with the token ServerContext minted, which is what this calls.
//
// Nothing here runs ripgrep: the handler takes its runner as an option, so every case hands it a
// stub the test owns, the roots are names rather than directories, and no file is read anywhere.
// What the binary does with a well-formed query is tests/server/files/search.test.ts.

import { describe, expect, it } from 'vitest';
import {
    handleSearch,
    type SearchRouteOptions
} from '../../../src/lib/server/files/search-routes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import type { RunOutcome } from '../../../src/lib/server/files/search.ts';

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';

/** The two roots every case may name. They are names: nothing opens them. */
const ROOTS = [
    { key: 'hub', dir: '/hub' },
    { key: 'engine', dir: '/engine' }
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

    it('answers a request from this page carrying the token', async () => {
        const response = await handleSearch(request('q=needle'), TOKEN, options());
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
    });
});

describe('the answer', () => {
    it('carries the files, the hits, the total, the cap word and the time', async () => {
        const response = await handleSearch(request('q=needle&root=hub'), TOKEN, options());
        expect(await response.json()).toEqual({
            ok: true,
            files: [
                {
                    root: 'hub',
                    path: 'src/a.ts',
                    hits: [{ line: 12, column: 5, length: 6, text: 'the needle here', at: 4 }]
                }
            ],
            total: 1,
            truncated: false,
            ms: 0,
            failed: []
        });
        expect(ran).toEqual(['/hub']);
    });

    it('runs every root when the query names none', async () => {
        await handleSearch(request('q=needle'), TOKEN, options());
        expect(ran).toEqual(['/hub', '/engine']);
    });

    it('says the answer was cut when the run reached the cap', async () => {
        const many = [BEGIN, MATCH, MATCH, END].join('\n');
        const response = await handleSearch(
            request('q=needle&max=1'),
            TOKEN,
            options({ stdout: many })
        );
        const body = (await response.json()) as { total: number; truncated: boolean };
        expect(body).toMatchObject({ total: 1, truncated: true });
    });

    it('names a root whose search failed while another answered', async () => {
        const response = await handleSearch(request('q=needle'), TOKEN, {
            roots: ROOTS,
            cap: 500,
            timeout: 10000,
            now: () => 0,
            run: (dir, _args, _timeout, onLine) => {
                if (dir === '/hub') {
                    return Promise.resolve({
                        code: 2,
                        stderr: 'rg: no such file',
                        timedOut: false,
                        stopped: false
                    });
                }
                for (const line of STREAM.split('\n')) onLine(line);
                return Promise.resolve({
                    code: 0,
                    stderr: '',
                    timedOut: false,
                    stopped: false
                });
            }
        });
        const body = (await response.json()) as {
            total: number;
            failed: { root: string; reason: string }[];
        };
        expect(body.total).toBe(1);
        expect(body.failed).toEqual([{ root: 'hub', reason: 'rg: no such file' }]);
    });
});

describe('what is refused', () => {
    it('refuses an empty pattern with 400 and starts nothing', async () => {
        const response = await handleSearch(request('q='), TOKEN, options());
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'empty' });
        expect(ran).toEqual([]);
    });

    it('refuses a pattern past the bound with 400', async () => {
        const response = await handleSearch(request(`q=${'x'.repeat(1001)}`), TOKEN, options());
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'too_long' });
    });

    it('refuses a root outside the served list with 400 and starts nothing', async () => {
        const response = await handleSearch(request('q=needle&root=elsewhere'), TOKEN, options());
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'unknown_root' });
        expect(ran).toEqual([]);
    });

    it('answers 400 with the word and the one-line reason for a regex ripgrep would not read', async () => {
        const response = await handleSearch(
            request('q=fo(&regex=1&root=hub'),
            TOKEN,
            options({
                code: 2,
                stdout: '',
                stderr: 'rg: regex parse error:\nerror: unclosed group\n'
            })
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'pattern',
            reason: 'error: unclosed group'
        });
    });

    it('answers 400 with the word timed_out for a run that ran out of time', async () => {
        const response = await handleSearch(
            request('q=needle&root=hub'),
            TOKEN,
            options({ code: undefined, stdout: '', timedOut: true })
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'timed_out' });
    });
});
