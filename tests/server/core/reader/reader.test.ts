// Layer 4, server test. The configured reader (G136), over the fixture rows of `rows.yml` beside
// this file and the recorded answers of `answers/`, through the literature route's handler
// (lib/server/content/literature/handler.ts), the Recover listing (lib/server/core/reader/
// listing.ts) and the readers of the rows (data/sources/config/settings/rows/). Every request goes
// to a stand-in fetcher (stand-in.ts), which answers the recorded file or the answer a case writes
// and records what it was sent; no request leaves the test.
//
// The expected values of the literature sources are the pages and the requests of `expected/`,
// for the same answers and the same queries: case 1's hits field by field with the answer's total,
// more and cursor, and case 2's addresses, headers and bodies, compared with every header but the
// User-Agent. The User-Agent is checked on its own (case 16): each request of case 1's searches and
// of figshare's listing names oculus and its version.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
    ALL_KEYS,
    ANSWERS,
    KEYS,
    NOW,
    RECORDED,
    ROWS,
    asked,
    compared,
    entryOf,
    optionsOf,
    recorded,
    rowOf,
    setupOf,
    sized,
    standIn,
    type Fetcher,
    type Sent
} from './stand-in.ts';
import { LiteratureDesk, type Clock } from '../../../../src/lib/server/content/literature/desk.ts';
import type { LiteratureOptions } from '../../../../src/lib/server/content/literature/handler.ts';
import { READER_AGENT } from '../../../../src/lib/server/core/reader/agent.ts';
import { listRow } from '../../../../src/lib/server/core/reader/listing.ts';
import type { Account } from '../../../../src/lib/server/core/reader/request.ts';
import { readShellcheck, sourceOf } from '../../../../src/lib/server/machine/runs/lint/readers.ts';
import { lookupOf } from '../../../../src/lib/state/feeds/literature/lookup.ts';
import {
    engineDir,
    linkRows,
    literatureRows,
    loadConfig
} from '../../../../src/lib/data/sources/config.ts';
import { settingFindings } from '../../../../src/lib/data/sources/config/catalogs.ts';
import type { SettingProblem } from '../../../../src/lib/data/sources/config/settings/reader.ts';
import type {
    LinkRow,
    ReaderRow
} from '../../../../src/lib/data/sources/config/settings/rows/grammar.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const EXPECTED = join(HERE, 'expected');

type ExpectedPage = {
    id: string;
    requests: number;
    page: { total: number | null; more: boolean; cursor: string | null; hits: unknown[] };
};

type ExpectedAsk = { id: string; calls: { url: string; headers: Record<string, string> }[] };

const PAGES = JSON.parse(
    readFileSync(join(EXPECTED, 'literature-pages.json'), 'utf8')
) as ExpectedPage[];

const REQUESTS = JSON.parse(readFileSync(join(EXPECTED, 'literature-requests.json'), 'utf8')) as {
    words: ExpectedAsk[];
    doi: ExpectedAsk[];
};

describe('the fixture rows', () => {
    it('read with no problem, eight literature rows, eleven Recover rows and the browser', () => {
        expect(ROWS.problems).toEqual([]);
        expect(ROWS.literature.map((row) => row.key)).toEqual(Object.keys(RECORDED));
        expect(ROWS.recover).toHaveLength(11);
        expect(ROWS.browser?.key).toBe('utbrowser');
    });
});

describe('case 1: each literature source read through its row', () => {
    it.each(PAGES)('reads $id as the adapter did', async (expected) => {
        const { fetcher, sent } = recorded(RECORDED[expected.id]);
        const answer = await asked(
            `source=${expected.id}&q=tensor+decomposition+EEG`,
            optionsOf(fetcher)
        );
        expect(sent).toHaveLength(expected.requests);
        expect(sent.every((one) => one.headers['user-agent'] === READER_AGENT)).toBe(true);
        expect(READER_AGENT).toMatch(/^oculus\/\d+\.\d+\.\d+/);
        expect({
            total: answer.total,
            more: answer.more,
            cursor: answer.cursor,
            hits: answer.hits
        }).toEqual(expected.page);
    });
});

/** Case 2's search: every term and choice of the form, page 2. */
const FULL_QUERY = {
    q: 'tensor',
    from: '2020',
    to: '2024',
    type: 'review',
    oa: '1',
    venue: 'Nature "Medicine"',
    author: "O'Brien, J.",
    min_cites: '10',
    page: '2'
};

/** The stand-in of case 2: PubMed's esearch names two ids, every other request fails. */
function askedOnce(): { fetcher: Fetcher; sent: Sent[] } {
    return standIn((sent) =>
        sent.url.includes('esearch.fcgi')
            ? { body: { esearchresult: { count: '9', idlist: ['11', '12'] } } }
            : { status: 500, body: '' }
    );
}

describe('case 2: the requests a row sends, as the adapter sent them', () => {
    const keyed = (fetcher: Fetcher): LiteratureOptions =>
        optionsOf(fetcher, {
            downloads: ALL_KEYS,
            mailto: 'reader@example.org',
            settings: { timeoutS: 5, perSource: 25, cacheMin: 0 }
        });

    it.each(REQUESTS.words)('sends $id the words, the choices and page 2', async (expected) => {
        const { fetcher, sent } = askedOnce();
        const page = expected.id === 'europe_pmc' ? '25|AoE' : FULL_QUERY.page;
        await asked({ ...FULL_QUERY, source: expected.id, page }, keyed(fetcher));
        expect(sent.map(compared)).toEqual(expected.calls.map(compared));
        expect(sent.every((one) => one.method === 'GET')).toBe(true);
    });

    it.each(REQUESTS.doi)('sends $id the DOI lookup', async (expected) => {
        const { fetcher, sent } = askedOnce();
        await asked({ source: expected.id, q: '10.1000/x1' }, keyed(fetcher));
        expect(sent.map(compared)).toEqual(expected.calls.map(compared));
    });
});

/** Case 3's rows: arXiv asked a search it holds no term for, and one it holds. */
const ARXIV_ROWS: { name: string; query: Record<string, string>; asks: [string, string] | null }[] =
    [
        { name: 'with a venue: skipped, no request', query: { venue: 'Nature' }, asks: null },
        { name: 'with the type article: skipped', query: { type: 'article' }, asks: null },
        {
            name: 'with the type preprint: one search',
            query: { type: 'preprint' },
            asks: ['search_query', 'all:tensor']
        },
        {
            name: 'by an arXiv DOI: the paper by its id',
            query: { q: '10.48550/arXiv.2211.13793' },
            asks: ['id_list', '2211.13793']
        }
    ];

describe('case 15: a primary hub with no literature.sources', () => {
    it('lists no source, refuses a search by any source key and sends nothing', async () => {
        const { fetcher, sent } = standIn(() => ({ body: {} }));
        const options = optionsOf(fetcher, { rows: [] });
        expect(await asked('sources', options)).toEqual({ ok: true, sources: [] });
        expect(await asked({ source: 'openalex', q: 'tensor' }, options)).toEqual({
            error: 'source'
        });
        expect(sent).toEqual([]);
    });
});

describe('case 3: arXiv sits out a search it cannot answer', () => {
    it.each(ARXIV_ROWS)('$name', async (row) => {
        const { fetcher, sent } = recorded(['arxiv.body']);
        const answer = await asked(
            { q: 'tensor', ...row.query, source: 'arxiv' },
            optionsOf(fetcher)
        );
        if (row.asks === null) {
            expect(answer).toMatchObject({ source: 'arxiv', state: 'skipped' });
            expect(sent).toEqual([]);
            return;
        }
        expect(sent).toHaveLength(1);
        expect(new URL(sent[0].url).searchParams.get(row.asks[0])).toBe(row.asks[1]);
    });
});

/** A Crossref answer of `count` works, the first numbered from `from`, out of `total`. */
function crossrefPage(count: number, total: number, from = 0): unknown {
    const items = Array.from({ length: count }, (_none, at) => ({
        DOI: `10.1000/w${String(from + at)}`,
        title: [`Work ${String(from + at)}`],
        type: 'journal-article'
    }));
    return { status: 'ok', message: { 'total-results': total, items } };
}

/** A WoS answer of `count` documents out of `total`. */
function wosPage(count: number, total: number): unknown {
    const hits = Array.from({ length: count }, (_none, at) => ({
        uid: `WOS:${String(at).padStart(15, '0')}`,
        title: `Document ${String(at)}`
    }));
    return { metadata: { total, page: 1, limit: count }, hits };
}

/** A Europe PMC answer of `count` results out of `total`, naming the next cursor. */
function europePage(count: number, total: number, next: string): unknown {
    const result = Array.from({ length: count }, (_none, at) => ({
        id: String(1000 + at),
        source: 'MED',
        title: `Article ${String(at)}`
    }));
    return { hitCount: total, nextCursorMark: next, resultList: { result } };
}

/**
 * Case 5's sources asked page 1 and then page 2 by the cursor page 1 answers: the records a page
 * asks for, the answer of each page, and the parameters each page sends.
 */
const PAGED: {
    name: string;
    id: string;
    perSource: number;
    answer: (page: number) => unknown;
    cursor: string;
    sends: [string, string][][];
}[] = [
    {
        name: "Crossref's offset",
        id: 'crossref',
        perSource: 25,
        answer: (page) => crossrefPage(25, 100, page * 25),
        cursor: '25',
        sends: [
            [
                ['offset', '0'],
                ['rows', '25']
            ],
            [
                ['offset', '25'],
                ['rows', '25']
            ]
        ]
    },
    {
        name: "WoS's page from 1, its size capped at the row's max of 50",
        id: 'wos',
        perSource: 100,
        answer: () => wosPage(50, 200),
        cursor: '1',
        sends: [
            [
                ['page', '1'],
                ['limit', '50']
            ],
            [
                ['page', '2'],
                ['limit', '50']
            ]
        ]
    },
    {
        name: "Europe PMC's cursor, the nextCursorMark of page 1",
        id: 'europe_pmc',
        perSource: 25,
        answer: (page) => europePage(25, 100, `AoE${String(page + 2)}`),
        cursor: '25|AoE2',
        sends: [[['cursorMark', '*']], [['cursorMark', 'AoE2']]]
    }
];

describe('case 5: the paging a row names', () => {
    it.each(PAGED)('asks page 2 by $name', async (row) => {
        const first = standIn(() => ({ body: row.answer(0) }));
        const page1 = await asked(
            { source: row.id, q: 'tensor' },
            sized(first.fetcher, row.perSource)
        );
        expect(page1).toMatchObject({ state: 'ok', more: true, cursor: row.cursor });
        const second = standIn(() => ({ body: row.answer(1) }));
        const page2 = { source: row.id, q: 'tensor', page: row.cursor };
        await asked(page2, sized(second.fetcher, row.perSource));
        const sent = [first.sent, second.sent].map((one, page) => {
            const params = new URL(one[0].url).searchParams;
            return row.sends[page].map(([name]) => [name, params.get(name)]);
        });
        expect(sent).toEqual(row.sends);
    });

    it('ends the paging on a page shorter than asked, whatever count the answer states', async () => {
        const { fetcher, sent } = standIn(() => ({ body: crossrefPage(2, 100) }));
        const answer = await asked({ source: 'crossref', q: 'tensor' }, sized(fetcher, 25));
        expect(answer).toMatchObject({ state: 'ok', more: false, cursor: null, total: 100 });
        expect(answer.hits).toHaveLength(2);
        expect(sent).toHaveLength(1);
    });

    it("follows DANDI's next address, and stops where the answer names none", async () => {
        const top = 'https://api.dandiarchive.org/api/dandisets/000001/versions/draft/assets/';
        const next = `${top}?page=2&page_size=100`;
        const { fetcher, sent } = standIn((one) => {
            if (one.url.startsWith(`${top}?page=2`)) {
                return {
                    body: { results: [{ asset_id: 'a2', path: 'sub/b.nwb', size: 2 }], next: null }
                };
            }
            if (one.url.startsWith(`${top}?`)) {
                return {
                    body: { results: [{ asset_id: 'a1', path: 'sub/a.nwb', size: 1 }], next }
                };
            }
            return { body: { digest: { 'dandi:sha2-256': 'a'.repeat(64) } } };
        });
        const listed = await listRow(
            rowOf('dandi'),
            entryOf({ dandiset: '000001', version: 'draft' }),
            setupOf(fetcher)
        );
        expect(Array.isArray(listed) ? listed.map((one) => one.name) : listed).toEqual([
            'a.nwb',
            'b.nwb'
        ]);
        expect(sent.slice(0, 2).map((one) => one.url)).toEqual([`${top}?page_size=100`, next]);
    });

    it("follows Hugging Face's Link header to the next page", async () => {
        const top =
            'https://huggingface.co/api/datasets/org/set/tree/main?recursive=true&limit=100';
        const next = `${top}&cursor=Zm9v`;
        const file = (path: string): unknown => ({
            type: 'file',
            path,
            size: 3,
            lfs: { oid: 'b'.repeat(64) }
        });
        const { fetcher, sent } = standIn((one) =>
            one.url === top
                ? { headers: { link: `<${next}>; rel="next"` }, body: [file('a.csv')] }
                : { body: [file('b.csv')] }
        );
        const listed = await listRow(
            rowOf('huggingface'),
            entryOf({ repo: 'org/set' }),
            setupOf(fetcher)
        );
        expect(Array.isArray(listed) ? listed.map((one) => one.name) : listed).toEqual([
            'a.csv',
            'b.csv'
        ]);
        expect(sent.map((one) => one.url)).toEqual([top, next]);
    });

    it("sends Synapse's nextPageToken in the body of the next children request", async () => {
        const handles = (name: string): unknown => ({
            list: [
                {
                    concreteType: 'org.sagebionetworks.repo.model.file.S3FileHandle',
                    fileName: name,
                    contentSize: 4,
                    contentMd5: 'c'.repeat(32)
                }
            ]
        });
        const fileOf = (id: string, name: string): unknown => ({
            id,
            name,
            type: 'org.sagebionetworks.repo.model.FileEntity'
        });
        const { fetcher, sent } = standIn((one) => {
            if (one.url.endsWith('/entity/children')) {
                const asked = JSON.parse(one.body ?? '{}') as { nextPageToken?: string };
                return asked.nextPageToken === 'tok2'
                    ? { body: { page: [fileOf('syn3', 'b.csv')] } }
                    : { body: { page: [fileOf('syn2', 'a.csv')], nextPageToken: 'tok2' } };
            }
            if (one.url.endsWith('/syn2/filehandles')) return { body: handles('a.csv') };
            if (one.url.endsWith('/syn3/filehandles')) return { body: handles('b.csv') };
            return { body: { id: 'syn1', concreteType: 'org.sagebionetworks.repo.model.Project' } };
        });
        const listed = await listRow(
            rowOf('synapse'),
            entryOf({ ids: ['syn1'] }),
            setupOf(fetcher, [{ service: 'synapse', secret: 'syn-token' }])
        );
        expect(Array.isArray(listed) ? listed.map((one) => one.name) : listed).toEqual([
            'a.csv',
            'b.csv'
        ]);
        const bodies = sent
            .filter((one) => one.url.endsWith('/entity/children'))
            .map((one) => [one.method, JSON.parse(one.body ?? '{}') as unknown]);
        expect(bodies).toEqual([
            ['POST', { parentId: 'syn1', includeTypes: ['file', 'folder'] }],
            ['POST', { parentId: 'syn1', includeTypes: ['file', 'folder'], nextPageToken: 'tok2' }]
        ]);
    });
});

describe('case 6: requests built from the records of another', () => {
    it("joins PubMed's esearch ids by commas into one efetch", async () => {
        const { fetcher, sent } = standIn((one) =>
            one.url.includes('esearch.fcgi')
                ? { body: { esearchresult: { count: '3', idlist: ['11', '12', '13'] } } }
                : { body: readFileSync(join(ANSWERS, 'pubmed-efetch.body'), 'utf8') }
        );
        await asked({ source: 'pubmed', q: 'tensor' }, optionsOf(fetcher));
        expect(sent).toHaveLength(2);
        expect(new URL(sent[1].url).searchParams.get('id')).toBe('11,12,13');
    });

    it('asks figshare one article per record of the collection', async () => {
        const collection = 'https://api.figshare.com/v2/collections/77/articles';
        const { fetcher, sent } = standIn((one) => {
            if (one.url.startsWith(collection)) return { body: [{ id: 10 }, { id: 11 }] };
            const id = one.url.split('/').pop() ?? '';
            return {
                body: {
                    id: Number(id),
                    files: [
                        {
                            name: `f${id}.csv`,
                            size: 5,
                            computed_md5: 'd'.repeat(32),
                            download_url: `https://ndownloader.figshare.com/files/${id}`
                        }
                    ]
                }
            };
        });
        const listed = await listRow(
            rowOf('figshare'),
            entryOf({ collection: '77' }),
            setupOf(fetcher)
        );
        expect(Array.isArray(listed) ? listed.map((one) => one.name) : listed).toEqual([
            'f10.csv',
            'f11.csv'
        ]);
        expect(sent.map((one) => one.url)).toEqual([
            `${collection}?page=1&page_size=100`,
            'https://api.figshare.com/v2/articles/10',
            'https://api.figshare.com/v2/articles/11'
        ]);
        expect(sent.map((one) => one.headers['user-agent'])).toEqual([
            READER_AGENT,
            READER_AGENT,
            READER_AGENT
        ]);
    });

    it('follows Synapse folders eight levels down, asks nothing of the ninth and refuses', async () => {
        const { fetcher, sent } = standIn((one) => {
            if (!one.url.endsWith('/entity/children')) {
                return {
                    body: { id: 'syn0', concreteType: 'org.sagebionetworks.repo.model.Project' }
                };
            }
            const parent = Number(
                (JSON.parse(one.body ?? '{}') as { parentId: string }).parentId.slice(3)
            );
            const id = `syn${String(parent + 1)}`;
            return {
                body: {
                    page: [
                        {
                            id,
                            name: `d${String(parent + 1)}`,
                            type: 'org.sagebionetworks.repo.model.Folder'
                        }
                    ]
                }
            };
        });
        const listed = await listRow(
            rowOf('synapse'),
            entryOf({ ids: ['syn0'] }),
            setupOf(fetcher, [{ service: 'synapse', secret: 'syn-token' }])
        );
        expect(listed).toEqual({ refused: 'answer', source: 'synapse', label: 'Synapse' });
        const parents = sent
            .filter((one) => one.url.endsWith('/entity/children'))
            .map((one) => (JSON.parse(one.body ?? '{}') as { parentId: string }).parentId);
        expect(parents).toEqual(Array.from({ length: 9 }, (_none, at) => `syn${String(at)}`));
    });
});

/** A clock that never moves on its own: a sleep is recorded and moves it by its length. */
function stillClock(): { clock: Clock; slept: number[] } {
    let now = NOW;
    const slept: number[] = [];
    return {
        clock: {
            now: () => now,
            sleep: (ms) => {
                slept.push(ms);
                now += ms;
                return Promise.resolve();
            }
        },
        slept
    };
}

/** The gap of each row before a second request, without a `downloads` row for its optional key. */
const GAPS: { id: string; gap: number; downloads: Account[] }[] = [
    { id: 'openalex', gap: 0, downloads: KEYS },
    { id: 'semantic_scholar', gap: 1000, downloads: KEYS },
    { id: 'crossref', gap: 1000, downloads: KEYS },
    { id: 'pubmed', gap: 340, downloads: KEYS },
    { id: 'pubmed', gap: 100, downloads: [...KEYS, { service: 'ncbi', secret: 'ncbi-secret' }] },
    { id: 'europe_pmc', gap: 0, downloads: KEYS },
    { id: 'arxiv', gap: 3000, downloads: KEYS },
    { id: 'wos', gap: 0, downloads: KEYS },
    { id: 'scopus', gap: 0, downloads: KEYS }
];

/** Case 7's 429 rows: the headers of the answer and the wait the source states. */
const LIMITS: { name: string; id: string; headers: Record<string, string>; wait?: number }[] = [
    {
        name: 'Retry-After 7: limited, wait_s 7',
        id: 'crossref',
        headers: { 'retry-after': '7' },
        wait: 7
    },
    {
        name: "OpenAlex's reset with none remaining: wait_s the seconds to the reset",
        id: 'openalex',
        headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '30' },
        wait: 30
    },
    {
        name: "OpenAlex's reset with requests remaining: limited with no wait",
        id: 'openalex',
        headers: { 'x-ratelimit-remaining': '4', 'x-ratelimit-reset': '30' }
    },
    {
        name: "OpenAlex's Retry-After, a header its row does not read: no wait",
        id: 'openalex',
        headers: { 'retry-after': '7' }
    }
];

describe('case 7: a 429 and the pacing of a row', () => {
    it.each(LIMITS)('$name, no wait and no retry', async (row) => {
        const { fetcher, sent } = standIn(() => ({ status: 429, headers: row.headers, body: '' }));
        const answer = await asked({ source: row.id, q: 'tensor' }, optionsOf(fetcher));
        expect(answer).toEqual({
            ok: true,
            source: row.id,
            state: 'limited',
            status: 429,
            ...(row.wait === undefined ? {} : { wait_s: row.wait })
        });
        expect(sent).toHaveLength(1);
    });

    it.each(GAPS)('keeps $gap ms between two requests of $id', async (row) => {
        const { clock, slept } = stillClock();
        const { fetcher, sent } = recorded(RECORDED[row.id]);
        const options = optionsOf(fetcher, {
            desk: new LiteratureDesk(clock),
            downloads: row.downloads
        });
        await asked({ source: row.id, q: 'tensor' }, options);
        await asked({ source: row.id, q: 'tensor' }, options);
        expect(sent.length).toBeGreaterThan(1);
        expect(slept).toEqual(row.gap === 0 ? [] : Array<number>(sent.length - 1).fill(row.gap));
    });
});

/** A hub's rows read from a `literature.sources` and `links` the case writes. */
function readOwn(
    sources: unknown[],
    links: unknown[] = []
): { rows: ReaderRow[]; linked: LinkRow[]; problems: SettingProblem[] } {
    const problems: SettingProblem[] = [];
    const config = { literature: { sources }, links };
    return { rows: literatureRows(config, problems), linked: linkRows(config, problems), problems };
}

describe('case 12: a value reaches its request encoded in its one part', () => {
    it("puts a Zenodo record of ../12 in the row's path as one encoded segment", async () => {
        const { fetcher, sent } = standIn(() => ({ body: { files: [] } }));
        await listRow(rowOf('zenodo'), entryOf({ record: '../12' }), setupOf(fetcher));
        expect(sent).toHaveLength(1);
        const url = new URL(sent[0].url);
        expect([url.host, url.pathname]).toEqual(['zenodo.org', '/api/records/..%2F12']);
    });

    it('sends the words a&b#c d as the one parameter they are', async () => {
        const { fetcher, sent } = standIn(() => ({ body: crossrefPage(0, 0) }));
        await asked({ source: 'crossref', q: 'a&b#c d' }, optionsOf(fetcher));
        const url = new URL(sent[0].url);
        expect(`${url.origin}${url.pathname}`).toBe('https://api.crossref.org/works');
        expect(url.searchParams.get('query.bibliographic')).toBe('a&b#c d');
        expect(url.hash).toBe('');
    });

    it("keeps a DOI holding ? in the lookup's path", async () => {
        const { fetcher, sent } = standIn(() => ({ status: 404, body: '' }));
        await asked({ source: 'crossref', q: '10.1000/x?y=1' }, optionsOf(fetcher));
        const url = new URL(sent[0].url);
        expect([url.host, url.pathname]).toEqual(['api.crossref.org', '/works/10.1000/x%3Fy%3D1']);
        expect(url.searchParams.has('y')).toBe(false);
    });

    it('reads no row whose address is http:, and names the row in the finding', () => {
        const own = readOwn([
            {
                key: 'plain',
                name: 'Plain',
                format: 'json',
                address: 'http://example.org/works',
                records: 'items'
            }
        ]);
        expect(own.rows).toEqual([]);
        expect(own.problems).toEqual([
            {
                key: 'literature.sources',
                where: 'row',
                issue: { kind: 'https', row: 'plain', at: 'address' }
            }
        ]);
    });
});

describe('case 13: an answer the row does not fit', () => {
    it('leaves out a field the answer does not hold, and the hit stands', async () => {
        const { fetcher } = standIn(() => ({ body: crossrefPage(1, 1) }));
        const answer = await asked({ source: 'crossref', q: 'tensor' }, optionsOf(fetcher));
        const hits = answer.hits as Record<string, unknown>[];
        expect(hits).toHaveLength(1);
        expect(hits[0]).toMatchObject({ title: 'Work 0', doi: '10.1000/w0' });
        expect('venue' in hits[0]).toBe(false);
    });

    it('fails a search whose records are no list', async () => {
        const { fetcher } = standIn(() => ({ body: { status: 'ok', message: { items: {} } } }));
        const answer = await asked({ source: 'crossref', q: 'tensor' }, optionsOf(fetcher));
        expect(answer).toEqual({ ok: true, source: 'crossref', state: 'failed' });
    });

    it('refuses a listing whose records are no list, naming the row', async () => {
        const { fetcher } = standIn(() => ({ body: { files: { key: 'a.csv' } } }));
        const listed = await listRow(rowOf('zenodo'), entryOf({ record: '12' }), setupOf(fetcher));
        expect(listed).toEqual({ refused: 'answer', source: 'zenodo', label: 'Zenodo' });
    });
});

describe('case 14 and case 26: the addresses the links rows build', () => {
    const noDoi = ROWS.links.filter((row) => row.key !== 'doi');

    it("builds a Crossref hit's url from the doi row, and none with no doi row", async () => {
        const linked = standIn(() => ({ body: crossrefPage(1, 1) }));
        const withRow = await asked({ source: 'crossref', q: 'tensor' }, optionsOf(linked.fetcher));
        expect((withRow.hits as Record<string, unknown>[])[0].url).toBe(
            'https://doi.org/10.1000/w0'
        );
        const bare = standIn(() => ({ body: crossrefPage(1, 1) }));
        const without = await asked(
            { source: 'crossref', q: 'tensor' },
            optionsOf(bare.fetcher, { links: noDoi })
        );
        expect('url' in (without.hits as Record<string, unknown>[])[0]).toBe(false);
    });

    it('reads no links row whose address is not https:', () => {
        const own = readOwn([], [{ key: 'doi', address: 'http://doi.org/{id|path}' }]);
        expect(own.linked).toEqual([]);
        expect(own.problems).toEqual([
            { key: 'links', where: 'row', issue: { kind: 'https', row: 'doi', at: 'address' } }
        ]);
    });

    it("links ShellCheck's SC2086 to the shellcheck row's address", () => {
        const stdout = JSON.stringify({
            comments: [
                {
                    line: 1,
                    endLine: 1,
                    column: 6,
                    endColumn: 8,
                    level: 'info',
                    code: 2086,
                    message: 'Double quote to prevent globbing and word splitting.'
                }
            ]
        });
        const rows = readShellcheck(stdout, sourceOf('echo $1\n'), ROWS.links);
        expect(rows?.map((one) => one.href)).toEqual(['https://www.shellcheck.net/wiki/SC2086']);
        const unlinked = readShellcheck(stdout, sourceOf('echo $1\n'), []);
        expect(unlinked?.map((one) => 'href' in one)).toEqual([false]);
    });

    it("gives the page's lookup the address the doi row builds, and none with no doi row", () => {
        expect(lookupOf('10.1000/x1', ROWS.links)).toMatchObject({
            by: 'doi',
            url: 'https://doi.org/10.1000/x1'
        });
        expect(lookupOf('10.1000/x1', noDoi)).toEqual({
            by: 'doi',
            id: '10.1000/x1',
            q: '10.1000/x1'
        });
    });

    it('keeps PMC in the url of a Europe PMC hit whose source is PMC', async () => {
        const { fetcher } = standIn(() => ({
            body: {
                hitCount: 1,
                resultList: { result: [{ id: 'PMC123', source: 'PMC', title: 'An article' }] }
            }
        }));
        const answer = await asked({ source: 'europe_pmc', q: 'tensor' }, optionsOf(fetcher));
        expect((answer.hits as Record<string, unknown>[])[0].url).toBe(
            'https://europepmc.org/article/PMC/PMC123'
        );
    });
});

describe('case 24 and case 25: Copy BibTeX by id, and lookups that find nothing', () => {
    it('asks Semantic Scholar for the entry of a paper known by its id', async () => {
        const entry = '@article{Cong2015,\n title = {Tensor decomposition}\n}\n';
        const { fetcher, sent } = standIn(() => ({ body: { citationStyles: { bibtex: entry } } }));
        const id = '9f2a31c4e0b8d7a6f5e4c3b2a1908f7e6d5c4b3a';
        const answer = await asked(
            { bibtex: '1', source: 'semantic_scholar', id },
            optionsOf(fetcher, { downloads: ALL_KEYS })
        );
        expect(answer).toMatchObject({ ok: true, bibtex: entry.trim() });
        expect(sent.map(compared)).toEqual([
            compared({
                url: `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=citationStyles`,
                headers: { 'x-api-key': 's2-secret' }
            })
        ]);
    });

    it('reads a DOI lookup answered 404 as no hit, not a failure', async () => {
        const { fetcher } = standIn(() => ({ status: 404, body: '' }));
        const answer = await asked(
            { source: 'semantic_scholar', q: '10.1000/x1' },
            optionsOf(fetcher)
        );
        expect(answer).toMatchObject({ state: 'ok', hits: [], more: false });
    });

    it("reads Scopus's one error entry as no hits", async () => {
        const { fetcher } = standIn(() => ({
            body: {
                'search-results': {
                    'opensearch:totalResults': '0',
                    entry: [{ '@_fa': 'true', error: 'Result set was empty' }]
                }
            }
        }));
        const answer = await asked({ source: 'scopus', q: 'tensor' }, optionsOf(fetcher));
        expect(answer).toMatchObject({ state: 'ok', hits: [] });
    });
});

/** The findings of a hub whose `.oculus/config.yml` holds the text given. */
function hubFindings(text: string): { file: string; key: string; message: string }[] {
    const hub = scratchDir('oculus-reader-rows-');
    const engine = engineDir();
    const loaded = loadConfig(engine, {
        hub,
        instead: { layer: 'hub', name: '.oculus/config.yml', text }
    });
    return [
        ...loaded.findings,
        ...settingFindings({ engine, hub, from: loaded.from }, loaded.config)
    ].map((one) => ({ file: one.file, key: one.key, message: one.message }));
}

/** Case 20's and case 27's rows: the text of a hub's settings and what its finding names. */
const ROW_FINDINGS: { name: string; text: string; names: string[] }[] = [
    {
        name: 'a key the reader does not know',
        text: 'literature:\n  sources:\n    - { key: mine, name: Mine, format: json, adress: "https://example.org/works", records: items }\n',
        names: ['mine', 'adress']
    },
    {
        name: 'a json row with no records',
        text: 'literature:\n  sources:\n    - { key: mine, name: Mine, format: json, address: "https://example.org/works" }\n',
        names: ['mine', 'records']
    },
    {
        name: 'an empty key',
        text: 'literature:\n  sources:\n    - { key: "", name: Mine, format: json, address: "https://example.org/works", records: items }\n',
        names: ['empty key']
    },
    {
        name: 'two rows of one key',
        text: 'literature:\n  sources:\n    - { key: mine, name: Mine, format: json, address: "https://example.org/a", records: items }\n    - { key: mine, name: Again, format: json, address: "https://example.org/b", records: items }\n',
        names: ['mine', 'earlier row']
    },
    {
        name: 'a links key twice',
        text: 'links:\n  - { key: doi, address: "https://doi.org/{id|path}" }\n  - { key: doi, address: "https://dx.doi.org/{id|path}" }\n',
        names: ['doi', 'earlier row']
    }
];

describe("case 20 and case 27: a row the reader cannot read is a finding of the hub's config.yml", () => {
    it.each(ROW_FINDINGS)('names $name', (row) => {
        const findings = hubFindings(row.text);
        expect(findings).toHaveLength(1);
        expect(findings[0].file.endsWith(join('.oculus', 'config.yml'))).toBe(true);
        for (const word of row.names) expect(findings[0].message).toContain(word);
    });

    it("reads the fixture rows with no finding as a hub's config.yml", () => {
        expect(hubFindings(readFileSync(join(HERE, 'rows.yml'), 'utf8'))).toEqual([]);
    });
});
