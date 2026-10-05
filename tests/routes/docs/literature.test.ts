// Layer 2, route tests. What the /api/literature route answers and what it never says. The route is
// a few lines handing the request to lib/server/content/literature/handler.ts with the token the
// server context minted, which is what this calls.
//
// Every case hands the handler a fetcher the test owns, so no source is asked and no key is sent
// anywhere. The keys here are made up and each one has a shape that is easy to find again in a
// captured line.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { callFor, SourceStop } from '../../../src/lib/server/content/literature/ask.ts';
import { LiteratureDesk } from '../../../src/lib/server/content/literature/desk.ts';
import {
    handleLiterature,
    type LiteratureOptions
} from '../../../src/lib/server/content/literature/handler.ts';

const TOKEN = mintToken();
const HOST = 'http://127.0.0.1:8791';

/** Made-up keys, one per field of local.yml's `literature:` map that holds a secret. */
const KEYS = {
    wosKey: 'WOSKEY-aaaa-1111',
    scopusKey: 'SCOPUSKEY-bbbb-2222',
    scopusInsttoken: 'INSTTOKEN-cccc-3333',
    openalexKey: 'OAKEY-dddd-4444',
    semanticScholarKey: 'S2KEY-eeee-5555',
    ncbiKey: 'NCBIKEY-ffff-6666',
    mailto: 'someone@example.org'
};

const SECRETS = Object.values(KEYS);

/** What a stubbed source does with a request: the status, the body and the time it takes. */
type Stub = { status?: number; body?: string; headers?: Record<string, string>; hang?: boolean };

/** A fetcher that answers each address with the stub given, and records the calls it got. */
function fetcherFor(stub: Stub): { fetcher: typeof fetch; calls: string[] } {
    const calls: string[] = [];
    const fetcher: typeof fetch = (input, init) => {
        calls.push(input instanceof Request ? input.url : String(input));
        if (stub.hang === true) {
            return new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('aborted', 'AbortError'));
                });
            });
        }
        return Promise.resolve(
            new Response(stub.body ?? '{}', {
                status: stub.status ?? 200,
                headers: stub.headers ?? {}
            })
        );
    };
    return { fetcher, calls };
}

function options(stub: Stub = {}, over: Partial<LiteratureOptions> = {}) {
    const { fetcher, calls } = fetcherFor(stub);
    const given: LiteratureOptions = {
        token: TOKEN,
        keys: KEYS,
        settings: { timeoutS: 5, perSource: 25, cacheMin: 30 },
        desk: new LiteratureDesk(),
        fetcher,
        ...over
    };
    return { given, calls };
}

/** A GET of the route, with the token unless it is told otherwise. */
function get(query: string, token: string | null = TOKEN): Request {
    return new Request(`${HOST}/api/literature?${query}`, {
        headers: token === null ? {} : { 'x-oculus-token': token }
    });
}

/** Every console line a case produces, kept apart from the output of the run. */
function captureConsole(): string[] {
    const lines: string[] = [];
    for (const name of ['log', 'warn', 'error', 'info', 'debug'] as const) {
        vi.spyOn(console, name).mockImplementation((...args: unknown[]) => {
            lines.push(args.map(String).join(' '));
        });
    }
    return lines;
}

afterEach(() => {
    vi.restoreAllMocks();
});

const OPENALEX_OK = JSON.stringify({
    meta: { count: 1 },
    results: [
        { id: 'https://openalex.org/W1', display_name: 'A paper', doi: 'https://doi.org/10.1000/x' }
    ]
});

/**
 * What `?sources` answers: the eight sources in the route's order, and for the two keyed ones the
 * name of the key they need. With the keys held they are available, and with none they are not.
 */
function namesKeys(held: boolean): (body: string) => void {
    return (body) => {
        const { sources } = JSON.parse(body) as {
            sources: { id: string; keyed: boolean; available: boolean; key: string | null }[];
        };
        expect(sources.map((one) => one.id)).toStrictEqual([
            'openalex',
            'semantic_scholar',
            'crossref',
            'pubmed',
            'europe_pmc',
            'arxiv',
            'wos',
            'scopus'
        ]);
        expect(sources.find((one) => one.id === 'wos')).toStrictEqual({
            id: 'wos',
            keyed: true,
            available: held,
            key: 'wos_key'
        });
        expect(sources.filter((one) => !one.available).map((one) => one.id)).toStrictEqual(
            held ? [] : ['wos', 'scopus']
        );
    };
}

describe('the literature route', () => {
    it('refuses a request without the write token, before any source is asked', async () => {
        const forms = [
            'sources',
            'source=openalex&q=tensor',
            'bibtex&doi=10.1000%2Fx',
            'source=wos&q=tensor'
        ];
        for (const form of forms) {
            for (const token of [null, '', 'not-the-token']) {
                const { given, calls } = options({ body: OPENALEX_OK });
                const response = await handleLiterature(get(form, token), given);
                expect(response.status, `${form} ${String(token)}`).toBe(403);
                expect(await response.json()).toStrictEqual({ error: 'token' });
                expect(calls, `${form} ${String(token)}`).toStrictEqual([]);
            }
        }
    });

    it('never answers a key, in a hit, a failure line or the source list', async () => {
        const echo = JSON.stringify({
            error: `invalid key ${KEYS.scopusKey} ${KEYS.wosKey}`,
            code: KEYS.scopusKey
        });
        const rows: {
            name: string;
            form: string;
            stub: Stub;
            keys?: typeof KEYS | Record<string, never>;
            check?: (body: string) => void;
        }[] = [
            { name: 'ok', form: 'source=openalex&q=tensor', stub: { body: OPENALEX_OK } },
            {
                name: '401 echoing the key',
                form: 'source=scopus&q=tensor',
                stub: { status: 401, body: echo }
            },
            {
                name: '403 echoing the key',
                form: 'source=wos&q=tensor',
                stub: { status: 403, body: echo }
            },
            {
                name: '429',
                form: 'source=semantic_scholar&q=tensor',
                stub: { status: 429, headers: { 'retry-after': '7' }, body: echo }
            },
            { name: 'timeout', form: 'source=pubmed&q=tensor', stub: { hang: true } },
            {
                name: 'an answer that does not read',
                form: 'source=openalex&q=tensor',
                stub: { body: `<html>${KEYS.openalexKey}</html>` }
            },
            { name: '500', form: 'source=crossref&q=tensor', stub: { status: 500, body: echo } },
            { name: 'the source list', form: 'sources', stub: {}, check: namesKeys(true) },
            {
                name: 'the source list with no key held',
                form: 'sources',
                stub: {},
                keys: {},
                check: namesKeys(false)
            }
        ];
        const seen: string[] = [];
        for (const row of rows) {
            const lines = captureConsole();
            const { given } = options(row.stub, {
                keys: row.keys ?? KEYS,
                settings: {
                    timeoutS: row.stub.hang === true ? 0.05 : 5,
                    perSource: 25,
                    cacheMin: 0
                }
            });
            const response = await handleLiterature(get(row.form), given);
            const body = await response.text();
            seen.push(body, ...lines);
            row.check?.(body);
            for (const secret of SECRETS) {
                expect(body, `${row.name}: ${secret}`).not.toContain(secret);
                expect(lines.join('\n'), `${row.name}: ${secret}`).not.toContain(secret);
            }
            vi.restoreAllMocks();
        }

        // The messages an adapter's request throws: the source, the status and a plain code.
        const thrown: string[] = [];
        for (const status of [401, 403, 429, 500]) {
            const { fetcher } = fetcherFor({ status, body: echo });
            const call = callFor('scopus', fetcher, 1000, new AbortController().signal, SECRETS);
            const error = await call(`https://api.example.org/x?api_key=${KEYS.openalexKey}`, {
                'X-ELS-APIKey': KEYS.scopusKey
            }).catch((caught: unknown) => caught);
            expect(error).toBeInstanceOf(SourceStop);
            thrown.push((error as Error).message);
        }
        for (const message of thrown) {
            for (const secret of SECRETS) expect(message).not.toContain(secret);
        }
        expect(thrown).toStrictEqual(['scopus: 401', 'scopus: 403', 'scopus: 429', 'scopus: 500']);
        expect(seen.length).toBeGreaterThan(0);
    });
});
