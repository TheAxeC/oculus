// Layer 2, route tests. What the /api/literature route answers and what it never says (G3). The
// route is a few lines handing the request to lib/server/content/literature/handler.ts with the
// token the server context minted, the primary hub's `literature.sources` and `links` rows and the
// machine's `downloads` rows, which is what this calls with the fixture's rows
// (tests/server/core/reader/rows.yml).
//
// Every case hands the handler a fetcher the test owns, so no source is asked and no key is sent
// anywhere. The secrets here are made up and each one has a shape that is easy to find again in a
// captured line.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { ReaderStop, send } from '../../../src/lib/server/core/reader/call.ts';
import type { Account } from '../../../src/lib/server/core/reader/request.ts';
import { LiteratureDesk } from '../../../src/lib/server/content/literature/desk.ts';
import {
    handleLiterature,
    type LiteratureOptions
} from '../../../src/lib/server/content/literature/handler.ts';
import { fixtureRows } from '../../server/core/reader/rows.ts';

const TOKEN = mintToken();
const HOST = 'http://127.0.0.1:8791';
const ROWS = fixtureRows();

/** Made-up `downloads` rows, one per `auth` entry of the fixture's literature rows. */
const DOWNLOADS: Account[] = [
    { service: 'wos', secret: 'WOSKEY-aaaa-1111' },
    { service: 'scopus', secret: 'SCOPUSKEY-bbbb-2222' },
    { service: 'scopus-insttoken', secret: 'INSTTOKEN-cccc-3333' },
    { service: 'openalex', secret: 'OAKEY-dddd-4444' },
    { service: 'semantic_scholar', secret: 'S2KEY-eeee-5555' },
    { service: 'ncbi', secret: 'NCBIKEY-ffff-6666' }
];

const MAILTO = 'someone@example.org';

const SECRETS = [...DOWNLOADS.map((one) => one.secret), MAILTO];

/** A made-up secret by the `downloads` row that holds it. */
function secretOf(service: string): string {
    return DOWNLOADS.find((one) => one.service === service)?.secret ?? '';
}

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
        rows: ROWS.literature,
        links: ROWS.links,
        downloads: DOWNLOADS,
        mailto: MAILTO,
        settings: { timeoutS: 5, perSource: 25, cacheMin: 30 },
        desk: new LiteratureDesk(),
        fetcher,
        agent: 'oculus/test',
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
 * What `?sources` answers: the rows in the order of `literature.sources`, and for the two whose
 * `auth` entry is required the `downloads` row they need. With the rows held they are available,
 * and with none they are not.
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
            name: 'Web of Science',
            keyed: true,
            available: held,
            key: 'wos',
            help: 'The `secret` is a Web of Science Starter API key, made on developer.clarivate.com.',
            bibtex: null
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
            error: `invalid key ${secretOf('scopus')} ${secretOf('wos')}`,
            code: secretOf('scopus')
        });
        const rows: {
            name: string;
            form: string;
            stub: Stub;
            downloads?: Account[];
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
                stub: { body: `<html>${secretOf('openalex')}</html>` }
            },
            { name: '500', form: 'source=crossref&q=tensor', stub: { status: 500, body: echo } },
            { name: 'the source list', form: 'sources', stub: {}, check: namesKeys(true) },
            {
                name: 'the source list with no row held',
                form: 'sources',
                stub: {},
                downloads: [],
                check: namesKeys(false)
            }
        ];
        const seen: string[] = [];
        for (const row of rows) {
            const lines = captureConsole();
            const { given } = options(row.stub, {
                downloads: row.downloads ?? DOWNLOADS,
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

        // The messages a request of a row stops with: the row's name, the state and the status.
        const scopus = ROWS.literature.find((one) => one.key === 'scopus');
        if (scopus === undefined) throw new Error('the fixture has no scopus row');
        const thrown: string[] = [];
        for (const status of [401, 403, 429, 500]) {
            const { fetcher } = fetcherFor({ status, body: echo });
            const sender = { fetcher, agent: 'oculus/test', timeoutMs: 1000, maxBytes: 1 << 20 };
            const request = {
                url: `https://api.example.org/x?api_key=${secretOf('openalex')}`,
                headers: { 'X-ELS-APIKey': secretOf('scopus') }
            };
            const error = await send(sender, request, scopus).catch((caught: unknown) => caught);
            expect(error).toBeInstanceOf(ReaderStop);
            thrown.push((error as Error).message);
        }
        for (const message of thrown) {
            for (const secret of SECRETS) expect(message).not.toContain(secret);
        }
        expect(thrown).toStrictEqual([
            'Scopus: refused 401',
            'Scopus: refused 403',
            'Scopus: limited 429',
            'Scopus: status 500'
        ]);
        expect(seen.length).toBeGreaterThan(0);
    });
});
