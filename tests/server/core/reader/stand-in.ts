// Layer 4, test helper. What the reader's test (reader.test.ts beside this file) asks the reader
// through: a stand-in fetcher that answers each request with what the case writes, or with the
// recorded answers of `answers/literature/`, and records what it was sent; the literature route's
// options over the fixture rows of `rows.yml`; and the setup of a reading outside the route. Both
// send as the app does, with the User-Agent `READER_AGENT` (lib/server/core/reader/agent.ts).
//
// A recorded answer is a `.body` file, the body a service sent with its characters outside ASCII
// written as JSON escapes or HTML entities, which the formatter does not rewrite.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureRows } from './rows.ts';
import { mintToken } from '../../../../src/lib/server/core/auth.ts';
import { LiteratureDesk } from '../../../../src/lib/server/content/literature/desk.ts';
import {
    handleLiterature,
    type LiteratureOptions
} from '../../../../src/lib/server/content/literature/handler.ts';
import { READER_AGENT } from '../../../../src/lib/server/core/reader/agent.ts';
import type { Setup } from '../../../../src/lib/server/core/reader/reader.ts';
import type { Account } from '../../../../src/lib/server/core/reader/request.ts';
import type { ReaderRow } from '../../../../src/lib/data/sources/config/settings/rows/grammar.ts';

/** The folder of the recorded answers of the literature sources. */
export const ANSWERS = join(dirname(fileURLToPath(import.meta.url)), 'answers', 'literature');

/** The time the route is asked at. */
export const NOW = Date.parse('2026-10-28T12:00:00Z');

/** The fixture rows, read once. */
export const ROWS = fixtureRows();

const TOKEN = mintToken();
const HOST = 'http://127.0.0.1:8791';

/** The recorded answers of each row's requests, in the order the requests are sent. */
export const RECORDED: Record<string, string[]> = {
    openalex: ['openalex.body'],
    semantic_scholar: ['semantic-scholar.body'],
    crossref: ['crossref.body'],
    pubmed: ['pubmed-esearch.body', 'pubmed-efetch.body'],
    europe_pmc: ['europepmc.body'],
    arxiv: ['arxiv.body'],
    wos: ['wos.body'],
    scopus: ['scopus.body']
};

/** The `downloads` rows the two sources whose key is required are asked with. */
export const KEYS: Account[] = [
    { service: 'wos', secret: 'wos-secret' },
    { service: 'scopus', secret: 'scopus-secret' }
];

/** A `downloads` row for every `auth` entry of the literature rows. */
export const ALL_KEYS: Account[] = [
    { service: 'openalex', secret: 'oa-secret' },
    { service: 'semantic_scholar', secret: 's2-secret' },
    { service: 'ncbi', secret: 'ncbi-secret' },
    ...KEYS,
    { service: 'scopus-insttoken', secret: 'scopus-token' }
];

/** One request the stand-in fetcher got. */
export type Sent = { url: string; method: string; headers: Record<string, string>; body?: string };

/** What the stand-in answers one request with; an object body is sent as JSON. */
type Answer = { status?: number; headers?: Record<string, string>; body?: unknown };

/** A fetcher as the route and the reader take one. */
export type Fetcher = typeof fetch;

/** A fetcher that answers each request with what `answer` gives for it, and records it. */
export function standIn(answer: (sent: Sent, at: number) => Answer): {
    fetcher: Fetcher;
    sent: Sent[];
} {
    const sent: Sent[] = [];
    const fetcher: Fetcher = (input, init) => {
        const one: Sent = {
            url: input instanceof Request ? input.url : String(input),
            method: init?.method ?? 'GET',
            headers: Object.fromEntries(new Headers(init?.headers)),
            ...(typeof init?.body === 'string' ? { body: init.body } : {})
        };
        sent.push(one);
        const given = answer(one, sent.length - 1);
        const body =
            typeof given.body === 'string' ? given.body : JSON.stringify(given.body ?? null);
        return Promise.resolve(
            new Response(body, { status: given.status ?? 200, headers: given.headers ?? {} })
        );
    };
    return { fetcher, sent };
}

/** A fetcher that answers the files given in turn, the first again after the last. */
export function recorded(files: string[]): { fetcher: Fetcher; sent: Sent[] } {
    return standIn((_sent, at) => ({
        body: readFileSync(join(ANSWERS, files[at % files.length]), 'utf8')
    }));
}

/** The handler's options over the fixture rows, the fetcher and the settings given. */
export function optionsOf(
    fetcher: Fetcher,
    over: Partial<LiteratureOptions> = {}
): LiteratureOptions {
    return {
        token: TOKEN,
        rows: ROWS.literature,
        links: ROWS.links,
        downloads: KEYS,
        settings: { timeoutS: 5, perSource: 3, cacheMin: 0 },
        desk: new LiteratureDesk(),
        fetcher,
        agent: READER_AGENT,
        now: () => NOW,
        ...over
    };
}

/** The handler's options asking `perSource` records of a page. */
export function sized(fetcher: Fetcher, perSource: number): LiteratureOptions {
    return optionsOf(fetcher, { settings: { timeoutS: 5, perSource, cacheMin: 0 } });
}

/** What the route answers for a query. */
export async function asked(
    query: string | Record<string, string>,
    options: LiteratureOptions
): Promise<Record<string, unknown>> {
    const search = typeof query === 'string' ? query : new URLSearchParams(query).toString();
    const request = new Request(`${HOST}/api/literature?${search}`, {
        headers: { 'x-oculus-token': TOKEN }
    });
    return (await (await handleLiterature(request, options)).json()) as Record<string, unknown>;
}

/** The setup of a reading outside the route, with the `downloads` rows given. */
export function setupOf(fetcher: Fetcher, downloads: readonly Account[] = []): Setup {
    return {
        sender: { fetcher, agent: READER_AGENT, timeoutMs: 5000, maxBytes: 5 * 1024 * 1024 },
        downloads,
        links: ROWS.links
    };
}

/** The fixture row of a key, of `literature.sources` or `recover.sources`. */
export function rowOf(key: string): ReaderRow {
    const row = [...ROWS.literature, ...ROWS.recover].find((one) => one.key === key);
    if (row === undefined) throw new Error(`no fixture row ${key}`);
    return row;
}

/** An entry's lookup over a map of its fields. */
export function entryOf(fields: Record<string, unknown>): (name: string) => unknown {
    return (name) => fields[name];
}

/**
 * A request as two senders are compared: its address, its parameters by name (a name's values in
 * the order they were sent, since a query's order of names tells the service nothing), its headers
 * but the User-Agent, and its body.
 */
export function compared(call: {
    url: string;
    headers: Record<string, string>;
    body?: string;
}): unknown {
    const url = new URL(call.url);
    const headers = Object.entries(call.headers).filter(([name]) => name !== 'user-agent');
    return {
        at: `${url.origin}${url.pathname}`,
        params: [...url.searchParams].sort(([one], [other]) => one.localeCompare(other)),
        headers: Object.fromEntries(headers),
        body: call.body ?? null
    };
}
