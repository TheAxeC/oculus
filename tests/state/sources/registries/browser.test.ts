// Layer 2, state tests. The journal browser (G137): the browser route's handler
// (lib/server/content/literature/browser.ts) over the fixture's `venues.browser` row
// (tests/server/core/reader/rows.yml), asked as the page asks it (state/sources/registries/
// browser.ts), with a stand-in fetcher the test owns that answers the recorded pages of the UT
// browser (tests/server/core/reader/answers/browser/) and records every request. No request leaves
// the test.
//
// The guarded entry G137 is this file: the list of browsers and the opening of the view ask no
// browser; one search press is one request, with the row's words parameter, the filter and the
// sort picked, the paging parameters and a User-Agent naming oculus; the recorded page reads into
// each hit's title, ISSNs, publisher, fee and open-access status; Read from the browser asks by a
// venue's first ISSN, then by the next while no hit answers, writes the fee and the open-access
// status of the one hit and nothing for no hit or several; a venue with no ISSN, or of a hub with
// no browser, has its press off with the reason; with no browser the list is empty.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { Venue } from '../../../../src/lib/data/model/index.ts';
import { mintToken } from '../../../../src/lib/server/core/auth.ts';
import { READER_AGENT } from '../../../../src/lib/server/core/reader/agent.ts';
import { LiteratureDesk } from '../../../../src/lib/server/content/literature/desk.ts';
import {
    handleBrowser,
    type HubBrowser
} from '../../../../src/lib/server/content/literature/browser.ts';
import {
    BROWSER_LIST_URL,
    browserList,
    browserRead,
    readBlocked,
    readFromBrowser,
    searchUrl,
    type BrowserSearch
} from '../../../../src/lib/state/sources/registries/browser.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { fixtureRows } from '../../../server/core/reader/rows.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const TOKEN = mintToken();
const HOST = 'http://127.0.0.1:8791';
const ANSWERS = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'server',
    'core',
    'reader',
    'answers',
    'browser'
);
const WORDS_PAGE = readFileSync(join(ANSWERS, 'words.body'), 'utf8');
const ISSN_PAGE = readFileSync(join(ANSWERS, 'issn.body'), 'utf8');

/** The recorded words page with its rows of records taken out: an answer of no hit. */
const EMPTY_PAGE = WORDS_PAGE.replace(
    /(<table id="records"[^>]*>[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/,
    '$1$2'
);

const ROW = fixtureRows().browser;

/** One request the stand-in fetcher got: its address and its headers. */
type Sent = { url: URL; headers: Headers };

/**
 * The route's handler over the fixture's browser in the hub `main`, with a stand-in fetcher that
 * answers each request with the page `answer` picks for its address and records it.
 */
function routeOf(answer: (url: URL) => string, browsers = true) {
    const sent: Sent[] = [];
    const fetcher: typeof fetch = (input, init) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        sent.push({ url, headers: new Headers(init?.headers) });
        return Promise.resolve(
            new Response(answer(url), { status: 200, headers: { 'content-type': 'text/html' } })
        );
    };
    const held: HubBrowser[] = ROW === null || !browsers ? [] : [{ hub: 'main', row: ROW }];
    const desk = new LiteratureDesk();
    /** What the page's routeBody answers for an address of the route. */
    const ask = async (address: string): Promise<unknown> => {
        const request = new Request(`${HOST}${address}`, {
            headers: { 'x-oculus-token': TOKEN }
        });
        const response = await handleBrowser(request, {
            token: TOKEN,
            browsers: () => held,
            downloads: [],
            timeoutS: 5,
            desk,
            fetcher,
            agent: READER_AGENT
        });
        return response.json();
    };
    return { sent, ask };
}

/** A venue of the hub `main` with the ISSNs given, whose hub names the browser. */
function venueOf(issn: string[] | undefined, browsable = true): Venue {
    return {
        id: 'main:neuroimage',
        root: 'main',
        name: 'NeuroImage',
        themes: [],
        ...(issn === undefined ? {} : { issn }),
        ...(browsable ? { browsable: true as const } : {})
    };
}

/** The search of the view: words, the first filter with a value, the first sort, size 50. */
const SEARCH: BrowserSearch = {
    hub: 'main',
    words: 'neuroimage',
    filter: 0,
    value: 'gold',
    sort: 0,
    size: 50
};

/** The fields of the fixture's NeuroImage record as the recorded page holds them. */
const NEUROIMAGE = {
    title: 'NeuroImage',
    issn: ['1053-8119', '1095-9572'],
    publisher: 'Elsevier',
    fee: '100% APC discount for UT authors',
    open_access: 'Full Open Access. All articles in this journal are Open Access'
};

describe('the journal browser', () => {
    it('reads the fixture row with its query by ISSN, its filters, sorts and sizes', () => {
        expect(ROW).not.toBeNull();
        expect(ROW?.query?.issn).toBeDefined();
    });

    it('lists the browser, twice, with no request to it', async () => {
        const { sent, ask } = routeOf(() => WORDS_PAGE);
        const first = browserList(await ask(BROWSER_LIST_URL));
        const again = browserList(await ask(BROWSER_LIST_URL));
        expect(first).toEqual(again);
        expect(first).toEqual([
            {
                hub: 'main',
                name: 'UT Journal Browser',
                filters: ['Open access status', 'JCR quartile'],
                sorts: ['CiteScore', 'SNIP', 'SJR', 'Title, A to Z', 'Title, Z to A'],
                sizes: [20, 50, 100]
            }
        ]);
        expect(sent).toEqual([]);
    });

    it('lists no browser for hubs that name none, and asks nothing', async () => {
        const { sent, ask } = routeOf(() => WORDS_PAGE, false);
        expect(browserList(await ask(BROWSER_LIST_URL))).toEqual([]);
        expect(sent).toEqual([]);
    });

    it('sends one request per search press, with the words, the choices, the paging and oculus named', async () => {
        const { sent, ask } = routeOf(() => WORDS_PAGE);
        await ask(searchUrl(SEARCH));
        expect(sent).toHaveLength(1);
        const [{ url, headers }] = sent;
        expect(`${url.origin}${url.pathname}`).toBe(ROW?.address);
        expect([...url.searchParams]).toEqual([
            ['title', 'neuroimage'],
            ['wq_flt', 'journal/oa-status'],
            ['wq_val', 'gold'],
            ['wq_srt_desc', 'citescore'],
            ['wq_ofs', '0'],
            ['wq_max', '50']
        ]);
        expect(headers.get('user-agent')).toBe(READER_AGENT);
        expect(READER_AGENT).toMatch(/^oculus\/\d+\.\d+\.\d+/);
    });

    it('reads each hit of the recorded page: title, ISSNs, publisher, fee and open-access status', async () => {
        const { ask } = routeOf(() => WORDS_PAGE);
        const read = browserRead(await ask(searchUrl(SEARCH)));
        expect(read).toEqual({
            state: 'ok',
            total: 4,
            cursor: null,
            hits: [
                NEUROIMAGE,
                { ...NEUROIMAGE, title: 'NeuroImage: Clinical', issn: ['2213-1582'] },
                { ...NEUROIMAGE, title: 'Neuroimage: Reports', issn: ['2666-9560'] },
                { ...NEUROIMAGE, title: 'NeuroImage Stroke', issn: ['3117-5740'] }
            ]
        });
    });
});

describe('Read from the browser', () => {
    it('asks once by the ISSN and writes the fee and open-access status of the one hit', async () => {
        const { sent, ask } = routeOf(() => ISSN_PAGE);
        const outcome = await readFromBrowser(venueOf(['1053-8119']), ask);
        expect(outcome).toEqual({
            write: { fee: NEUROIMAGE.fee, open_access: NEUROIMAGE.open_access },
            issn: '1053-8119'
        });
        expect(sent.map(({ url }) => [...url.searchParams])).toEqual([
            [
                ['q', '1053-8119'],
                ['wq_fld', 'q'],
                ['wq_ofs', '0'],
                ['wq_max', '20']
            ]
        ]);
    });

    it('writes nothing for an ISSN with no hit, and says so', async () => {
        const { sent, ask } = routeOf(() => EMPTY_PAGE);
        const outcome = await readFromBrowser(venueOf(['1053-8119']), ask);
        expect(outcome).toEqual({
            none: t('venue_browser.read_no_hit', '1053-8119'),
            asked: ['1053-8119']
        });
        expect(sent).toHaveLength(1);
    });

    it('writes nothing for an ISSN with several hits, and says so', async () => {
        const { ask } = routeOf(() => WORDS_PAGE);
        const outcome = await readFromBrowser(venueOf(['1053-8119']), ask);
        expect(outcome).toEqual({
            none: t('venue_browser.read_several', '1053-8119', 4),
            asked: ['1053-8119']
        });
    });

    it('asks by the next ISSN when the first gives no hit, and names the one that answered', async () => {
        const { sent, ask } = routeOf((url) =>
            url.searchParams.get('q') === '1095-9572' ? ISSN_PAGE : EMPTY_PAGE
        );
        const outcome = await readFromBrowser(venueOf(['1053-8119', '1095-9572']), ask);
        expect(outcome).toEqual({
            write: { fee: NEUROIMAGE.fee, open_access: NEUROIMAGE.open_access },
            issn: '1095-9572'
        });
        expect(sent.map(({ url }) => url.searchParams.get('q'))).toEqual([
            '1053-8119',
            '1095-9572'
        ]);
    });

    it('is off with its reason for a venue with no ISSN and for a hub with no browser', () => {
        expect(readBlocked(venueOf(['1053-8119']))).toBe('');
        expect(readBlocked(venueOf(undefined))).toBe(t('venue_browser.read_no_issn'));
        expect(readBlocked(venueOf(['1053-8119'], false))).toBe(t('venue_browser.read_no_browser'));
    });
});
