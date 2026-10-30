// Layer 4, route tests. What the two Zenodo actions of POST /api/deposit send: the review copy For
// review uploads (G141), what Publish and a new version send and what a press that is cancelled or
// fails leaves (G142), and where the Zenodo token goes (G76), driven through
// lib/server/git/deposit/deposit-routes.ts over a fixture hub in a scratch folder. The Recover
// route's own file, src/routes/api/(machine)/recover/+server.ts, answers the Recover row of G76.
//
// The hub's settings file lays `deposit.zenodo.address` at the fake Zenodo of
// tests/fixtures/hubs/zenodo-answers.ts, which answers each call in Zenodo's documented shape and
// keeps every call; the hub, its token and the press are tests/fixtures/hubs/zenodo-world.ts's.
// No git process runs here; the copy made by the real git is
// tests/server/git/deposit-compare.test.ts's. No request leaves the process.

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { strToU8, zipSync, zlibSync } from 'fflate';
import { afterEach, describe, expect, vi } from 'vitest';
import type { MirrorState } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { createRunningGit } from '../../../src/lib/server/core/git/running.ts';
import type { Account } from '../../../src/lib/server/core/reader/request.ts';
import { handleDepositState } from '../../../src/lib/server/git/deposit/deposit-routes.ts';
import { localDeps } from '../../../src/lib/server/machine/runs/recover/local.ts';
import { GET as recoverGet } from '../../../src/routes/api/(machine)/recover/+server.ts';
import {
    ZENODO_ADDRESS,
    ZENODO_SITE,
    fakeZenodo,
    type FakeZenodo,
    type ZenodoSetup
} from '../../fixtures/hubs/zenodo-answers.ts';
import {
    CREATORS,
    FUNDING,
    HOST,
    PROJECT,
    TOKEN,
    ZENODO_TOKEN,
    codeBlock,
    credited,
    depositOptions,
    filesUnder,
    fixture,
    press,
    said,
    today,
    withLab,
    type Fixture,
    type ManifestSetup,
    type Pressed
} from '../../fixtures/hubs/zenodo-world.ts';
import { it } from '../../fixtures/scratch.ts';

/** The name a Cancel of the fixture's project is registered under, as the route keys a deposit. */
const RUN = `deposit:${PROJECT}`;

/** The term with an o-umlaut, the letter made from its code point so the file stays ASCII. */
const UMLAUT_TERM = `Quillm${String.fromCharCode(0xf6)}re`;

/** The body of the first call of this method whose path ends so. */
function bodyOf(zenodo: FakeZenodo, method: string, ending: string): unknown {
    return zenodo.calls.find((one) => one.method === method && one.path.endsWith(ending))?.body;
}

/** A PDF of one page whose content stream is deflated and holds `words`. */
function pdfHolding(words: string): Uint8Array {
    const stream = zlibSync(strToU8(`BT (${words}) Tj ET`));
    const head = strToU8(
        `%PDF-1.4\n1 0 obj\n<< /Length ${String(stream.length)} /Filter /FlateDecode >>\nstream\n`
    );
    const tail = strToU8('\nendstream\nendobj\n%%EOF\n');
    return Uint8Array.from([...head, ...stream, ...tail]);
}

/** A Word file whose document part holds `words`, deflated. */
function docxHolding(words: string): Uint8Array {
    return zipSync({ 'word/document.xml': strToU8(`<w:t>${words}</w:t>`) }, { level: 9 });
}

/** One row of the review copy: the files and manifest it starts from and what is checked. */
type Row = {
    name: string;
    files: Record<string, string | Uint8Array>;
    setup?: ManifestSetup;
    check: (pressed: Pressed, zenodo: FakeZenodo) => void;
};

/** A row refused by a sentence of the catalog before any request. */
function refused(key: string, ...args: (string | number)[]): Row['check'] {
    return (pressed, zenodo) => {
        expect(pressed.body.error).toBe(said(key, ...args));
        expect(pressed.status).toBe(400);
        expect(zenodo.calls).toEqual([]);
    };
}

/** A row whose upload holds these entries among its own, each with this text. */
function uploaded(zip: string, entries: Record<string, string>): Row['check'] {
    return (pressed, zenodo) => {
        expect(pressed.body.error).toBeUndefined();
        const held = zenodo.uploads();
        expect(Object.keys(held)).toEqual([zip]);
        for (const [name, text] of Object.entries(entries)) expect(held[zip][name]).toBe(text);
    };
}

const ROWS: Row[] = [
    {
        name: 'refuses a binary file holding a term, naming it, before any request',
        files: { 'data.bin': Uint8Array.from([0, 1, ...strToU8('xxquillmorexx'), 0]) },
        check: refused('server.zenodo.term_in_bytes', 'data.bin')
    },
    {
        name: 'sends the title and the description with the terms replaced',
        files: {},
        setup: {
            title: 'The Quillmore pipeline',
            code: { description: 'Code of the Northbridge Institute.' }
        },
        check: (pressed, zenodo) => {
            expect(pressed.body.error).toBeUndefined();
            const created = bodyOf(zenodo, 'POST', '/api/records') as {
                metadata: { title: string; description: string };
            };
            expect([created.metadata.title, created.metadata.description]).toEqual([
                'The Anonymous pipeline',
                'Code of the an institute.'
            ]);
        }
    },
    {
        name: 'replaces a term written in any case',
        files: { 'notes.txt': 'quillmore QUILLMORE Quillmore\n' },
        check: uploaded('alpha.zip', { 'notes.txt': 'Anonymous Anonymous Anonymous\n' })
    },
    {
        name: 'refuses a finding of the deposit scan, naming the file, before any request',
        files: { '.env': 'KEY=1\n' },
        check: refused('server.zenodo.scan_found', '.env')
    },
    {
        name: 'refuses a row with an empty term, naming the row, before any request',
        files: {},
        setup: { anonymize: [{ term: 'Quillmore' }, { term: '' }] },
        check: refused('server.zenodo.term_empty', 2)
    },
    {
        name: 'matches a term holding pattern characters as its letters',
        files: { 'a.txt': 'uses C++ (X) and C (X)\n' },
        setup: { anonymize: [{ term: 'C++ (X)' }] },
        check: uploaded('alpha.zip', { 'a.txt': 'uses Anonymous and C (X)\n' })
    },
    {
        name: 'replaces the longer of two terms first, the shorter listed first',
        files: { 'b.txt': 'Northbridge Institute\n' },
        setup: {
            anonymize: [
                { term: 'Northbridge' },
                { term: 'Northbridge Institute', as: 'an institute' }
            ]
        },
        check: uploaded('alpha.zip', { 'b.txt': 'an institute\n' })
    },
    {
        name: 'replaces the longer of two terms first, the longer listed first',
        files: { 'b.txt': 'Northbridge Institute\n' },
        setup: {
            anonymize: [
                { term: 'Northbridge Institute', as: 'an institute' },
                { term: 'Northbridge' }
            ]
        },
        check: uploaded('alpha.zip', { 'b.txt': 'an institute\n' })
    },
    {
        name: 'replaces a term in the name of a folder',
        files: { 'quillmore/run.py': 'print(1)\n' },
        check: uploaded('alpha.zip', { 'Anonymous/run.py': 'print(1)\n' })
    },
    {
        name: "replaces a term in the repository's name, which names the zip",
        files: {},
        setup: { code: { repo: 'quillmore-tools' } },
        check: uploaded('Anonymous-tools.zip', { 'README.md': '# The tools\n' })
    },
    {
        name: 'refuses two paths that become one, naming both, before any request',
        files: { 'Quillmore.py': 'a = 1\n', 'Anonymous.py': 'b = 2\n' },
        check: refused('server.zenodo.collision', 'Anonymous.py', 'Quillmore.py')
    },
    {
        name: 'refuses a Latin-1 file holding a term in its one-byte form, naming it',
        files: { 'latin.txt': Uint8Array.from(Buffer.from(`a ${UMLAUT_TERM} b\n`, 'latin1')) },
        setup: { anonymize: [{ term: UMLAUT_TERM }] },
        check: refused('server.zenodo.term_in_bytes', 'latin.txt')
    },
    {
        name: 'refuses a Word file whose deflated part holds a term, naming it',
        files: { 'paper.docx': docxHolding('quillmore') },
        check: refused('server.zenodo.term_in_bytes', 'paper.docx')
    },
    {
        name: 'refuses a PDF whose deflated stream holds a term, naming it',
        files: { 'paper.pdf': pdfHolding('quillmore') },
        check: refused('server.zenodo.term_in_bytes', 'paper.pdf')
    },
    {
        name: 'refuses a file of a compressed form it cannot read, naming it',
        files: { 'archive.7z': Uint8Array.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c, 0, 4]) },
        check: refused('server.zenodo.compressed_unread', 'archive.7z')
    }
];

describe('the review copy For review sends', () => {
    it('sends one anonymised zip, an Anonymous creator, restricted files and a share link, and writes the DOI, the link and the Zenodo status', async () => {
        const at = fixture(
            { 'quillmore_tools.py': 'QUILLMORE lab\nNorthbridge Institute\n' },
            { code: { status: 'deposited', url: 'https://example.org/alpha', date: '2026-01-02' } }
        );
        const zenodo = fakeZenodo();
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(pressed.status).toBe(200);
        const zips = zenodo.uploads();
        expect(Object.keys(zips)).toEqual(['alpha.zip']);
        expect(Object.keys(zips['alpha.zip']).sort()).toEqual([
            '.gitignore',
            'Anonymous_tools.py',
            'README.md'
        ]);
        expect(zips['alpha.zip']['Anonymous_tools.py']).toBe('Anonymous lab\nan institute\n');
        const created = bodyOf(zenodo, 'POST', '/api/records') as {
            access: unknown;
            metadata: { creators: unknown; resource_type: unknown; publication_date: string };
        };
        expect(created.metadata.creators).toEqual([
            { person_or_org: { type: 'organizational', name: 'Anonymous' } }
        ]);
        expect(created.metadata.resource_type).toEqual({ id: 'software' });
        expect(created.metadata.publication_date).toBe(today());
        expect(created.access).toEqual({ record: 'public', files: 'restricted' });
        expect(bodyOf(zenodo, 'POST', '/access/links')).toEqual({ permission: 'view' });
        const record = zenodo.calls.find((one) => one.method === 'GET');
        const id = record?.path.split('/').at(-1) ?? '';
        expect(codeBlock(at)).toMatchObject({
            status: 'deposited',
            url: 'https://example.org/alpha',
            date: '2026-01-02',
            doi: '10.5281/zenodo.102',
            review_link: `${ZENODO_SITE}/records/${id}?token=share-${id}`,
            zenodo_status: 'review-anon',
            zenodo_date: today()
        });
    });

    for (const row of ROWS) {
        it(row.name, async () => {
            const at = fixture(row.files, row.setup);
            const zenodo = fakeZenodo();
            row.check(await press(at, 'zenodoReview', zenodo), zenodo);
        });
    }
});

describe('the Zenodo token', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    /** Every line the console is given from here to the end of the case. */
    function consoleLines(): string[] {
        const logged: string[] = [];
        for (const kind of ['log', 'info', 'warn', 'error', 'debug'] as const) {
            vi.spyOn(console, kind).mockImplementation((...args: unknown[]) => {
                logged.push(args.map((one) => String(one)).join(' '));
            });
        }
        return logged;
    }

    it('is in no answer, log line or sentence when the upload is refused, and the draft is deleted', async () => {
        const at = fixture({ 'tools.py': 'Quillmore\n' });
        const before = readFileSync(at.manifest, 'utf8');
        const logged = consoleLines();
        const refusing: ZenodoSetup = {
            status: (method, path) =>
                method === 'PUT' && path.endsWith('/content') ? 403 : undefined
        };
        const zenodo = fakeZenodo(refusing);
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.status).toBe(400);
        expect(pressed.body.error).toBe(
            said('server.zenodo.failed_draft', said('server.zenodo.call_upload', 'alpha.zip'), 403)
        );
        expect(zenodo.calls.map((one) => `${one.method} ${one.path}`)).toContain(
            'DELETE /api/records/101/draft'
        );
        expect(readFileSync(at.manifest, 'utf8')).toBe(before);
        expect(JSON.stringify(pressed.body)).not.toContain(ZENODO_TOKEN);
        expect(logged.filter((line) => line.includes(ZENODO_TOKEN))).toEqual([]);
        rmSync(at.dir, { recursive: true, force: true });
    });

    it('is in no answer, log line or History record of a For review that wrote the manifest', async () => {
        const at = fixture({ 'tools.py': 'Quillmore\n' });
        const logged = consoleLines();
        const pressed = await press(at, 'zenodoReview', fakeZenodo());
        expect(pressed.body.error).toBeUndefined();
        expect(codeBlock(at).zenodo_status).toBe('review-anon');
        expect(JSON.stringify(pressed.body)).not.toContain(ZENODO_TOKEN);
        expect(logged.filter((line) => line.includes(ZENODO_TOKEN))).toEqual([]);
        const history = join(at.dir, 'history');
        const records = filesUnder(history);
        expect(records).toContain('changes.jsonl');
        expect(readFileSync(join(history, 'changes.jsonl'), 'utf8')).toContain('zenodo_status');
        for (const file of records) {
            expect(readFileSync(join(history, file), 'utf8')).not.toContain(ZENODO_TOKEN);
        }
    });

    it('goes as Bearer in the Authorization header to the deposit address alone', async () => {
        const at = fixture({});
        const zenodo = fakeZenodo();
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(zenodo.stray).toEqual([]);
        expect(zenodo.calls.length).toBeGreaterThan(0);
        for (const call of zenodo.calls) {
            expect(call.headers.authorization).toBe(`Bearer ${ZENODO_TOKEN}`);
        }
    });

    /** The fixture's Recover row `zenodo`, which reads its records under the `downloads` row. */
    function recoverRow(row: string): string[] {
        return [
            'recover:',
            '    sources:',
            '        - key: zenodo',
            '          name: Zenodo',
            '          format: json',
            `          address: ${ZENODO_ADDRESS}/records/{record}`,
            `          auth: [{ header: Authorization, row: ${row} }]`,
            '          records: files',
            '          fields: { name: key, size: size, url: links.self }',
            '          pick: { field: files }'
        ];
    }

    /** A GET of the Recover route's plan for the dataset `rec` of the fixture's primary hub. */
    async function recoverRead(at: Fixture, rows: Account[]): Promise<Record<string, string>[]> {
        const sent: Record<string, string>[] = [];
        vi.stubGlobal('fetch', (_address: string, init?: RequestInit) => {
            sent.push(Object.fromEntries(new Headers(init?.headers).entries()));
            return Promise.resolve(Response.json({ files: [] }));
        });
        const channels = new Hub();
        const retrieval = [{ kind: 'zenodo', record: '777' }];
        const dataset = {
            id: 'rec',
            name: 'A dataset',
            retrieval,
            path: '~/data/rec',
            recover: true
        };
        channels.publish('portfolio', { entities: { datasets: { 'hub:rec': dataset } } });
        const others = at.into.hubs ?? [];
        const locals = {
            server: {
                token: TOKEN,
                hub: channels,
                workspace: {
                    open: () => ({
                        primary: 'hub',
                        hubs: others.map((one) => ({ name: one.key, dir: one.hub }))
                    })
                },
                local: { downloads: rows },
                configCache: {
                    hub: (dir: string) => ({
                        config: others.find((one) => one.hub === dir)?.config.merged
                    })
                },
                recover: {
                    local: localDeps(join(at.dir, 'home'), new Map()),
                    version: () => 0,
                    changed: () => undefined
                }
            },
            config: () => ({ config: at.into.config.merged })
        };
        const request = new Request(`http://${HOST}/api/recover?target=mac&hub=hub&key=rec`);
        const response = await (recoverGet as unknown as (event: object) => Promise<Response>)({
            request,
            locals
        });
        expect(response.status).toBe(200);
        return sent;
    }

    it('is not sent by the Recover route, whose Recover row names auth on its downloads row', async () => {
        const at = fixture({}, { settings: recoverRow('zenodo') });
        const rows = [
            { service: 'zenodo', secret: ZENODO_TOKEN },
            { service: 'synapse', secret: 'fixture-synapse' }
        ];
        const sent = await recoverRead(at, rows);
        expect(sent.length).toBeGreaterThan(0);
        for (const headers of sent) expect(headers.authorization).toBeUndefined();
    });

    it('is not sent by the Recover route when another hub of the workspace reads it from the row', async () => {
        const at = withLab(
            { settings: recoverRow('lab-zenodo') },
            { settings: ['        auth: [{ header: Authorization, row: lab-zenodo }]'] }
        );
        const sent = await recoverRead(at, [{ service: 'lab-zenodo', secret: ZENODO_TOKEN }]);
        expect(sent.length).toBeGreaterThan(0);
        for (const headers of sent) expect(headers.authorization).toBeUndefined();
    });

    it('keeps the shipped auth and time limit under a hub that lays only the address', async () => {
        const at = fixture({});
        const shipped = loadConfig(engineDir()).config.deposit as { zenodo: object };
        expect(at.into.config.merged.deposit).toEqual({
            zenodo: { ...shipped.zenodo, address: ZENODO_ADDRESS }
        });
        const zenodo = fakeZenodo();
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(
            zenodo.calls.every((one) => one.headers.authorization === `Bearer ${ZENODO_TOKEN}`)
        ).toBe(true);
    });
});

describe('the hub a press reads', () => {
    it("reaches the address of the project's own hub alone for a project of a second hub", async () => {
        const at = withLab({ address: 'https://elsewhere.example/api' }, {});
        const zenodo = fakeZenodo();
        const pressed = await press(at, 'zenodoReview', zenodo, { id: 'lab:alpha' });
        expect(pressed.body.error).toBeUndefined();
        expect(zenodo.stray).toEqual([]);
        expect(zenodo.calls.length).toBeGreaterThan(0);
        expect(codeBlock(at).zenodo_status).toBe('review-anon');
    });

    it("answers the token's readiness of the GET from the project's own hub", async () => {
        const auth = ['        auth: [{ header: Authorization, row: lab-zenodo }]'];
        const at = withLab({}, { settings: auth });
        const rows = [{ service: 'lab-zenodo', secret: ZENODO_TOKEN }];
        const ready = async (id: string): Promise<unknown> => {
            const asked = new Request(`http://${HOST}/api/deposit?id=${id}`);
            const response = await handleDepositState(asked, {
                idsFor: () => [id],
                stateFor: () => Promise.resolve({} as MirrorState),
                deposit: depositOptions(at, rows)
            });
            return response.json();
        };
        expect(await ready('lab:alpha')).toMatchObject({ zenodo: { ready: true } });
        expect(await ready(PROJECT)).toMatchObject({ zenodo: { ready: false } });
    });
});

/** A concept `199` of a Zenodo record `200`, the DOI a manifest holds for it. */
const CONCEPT = '199';
const RECORD = '200';
const CONCEPT_DOI = `10.5281/zenodo.${CONCEPT}`;

/** The published review copy of that concept. */
const REVIEW_COPY = {
    concept: CONCEPT,
    record: RECORD,
    creators: ['Anonymous'],
    restricted: true
};

/** The calls of a fake as `METHOD path`, the `/api/records` of each left out. */
function callsOf(zenodo: FakeZenodo): string[] {
    return zenodo.calls.map((one) => `${one.method} ${one.path.replace('/api/records', '')}`);
}

/** Whether a call is the publish of a draft. */
function publishing(method: string, path: string): boolean {
    return method === 'POST' && path.endsWith('/actions/publish');
}

/** How a call fails in a row: a status it answers, or no answer. */
const FAILURES: { name: string; how: number | 'none' }[] = [
    { name: 'answers 502', how: 502 },
    { name: 'gets no answer', how: 'none' }
];

describe('what Publish and a new version send, and what a press that stops leaves', () => {
    it('sends Publish with the creators of the team, their family names, the funding, the real files and public access, and writes the DOI', async () => {
        const at = credited({ 'quillmore_tools.py': 'Quillmore\n' });
        const zenodo = fakeZenodo();
        const pressed = await press(at, 'zenodoPublish', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(pressed.body.output).toBe(said('server.zenodo.published', '10.5281/zenodo.102'));
        const created = bodyOf(zenodo, 'POST', '/api/records') as {
            access: unknown;
            metadata: { creators: unknown; funding: unknown };
        };
        expect(created.metadata.creators).toEqual(CREATORS);
        expect(created.metadata.funding).toEqual(FUNDING);
        expect(created.access).toEqual({ record: 'public', files: 'public' });
        expect(zenodo.uploads()['alpha.zip']['quillmore_tools.py']).toBe('Quillmore\n');
        expect(callsOf(zenodo).filter((one) => one.endsWith('/access/links'))).toEqual([]);
        const code = codeBlock(at);
        expect(code).toMatchObject({
            doi: '10.5281/zenodo.102',
            zenodo_status: 'deposited',
            zenodo_date: today()
        });
        expect(code.review_link).toBeUndefined();
    });

    it('makes a new version of a review record, keeping its DOI, with a share link when review_link is empty', async () => {
        const at = fixture(
            { 'tools.py': 'Quillmore\n' },
            { code: { doi: CONCEPT_DOI, zenodo_status: 'review-anon' } }
        );
        const zenodo = fakeZenodo({ seed: REVIEW_COPY });
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(callsOf(zenodo).slice(0, 6)).toEqual([
            'GET /199',
            'GET /200',
            'GET /200/versions/latest',
            'GET /200',
            'POST /200/versions',
            'PUT /201/draft'
        ]);
        const sent = bodyOf(zenodo, 'PUT', '/201/draft') as { access: unknown };
        expect(sent.access).toEqual({ record: 'public', files: 'restricted' });
        expect(zenodo.uploads()['alpha.zip']['tools.py']).toBe('Anonymous\n');
        expect(codeBlock(at)).toMatchObject({
            doi: CONCEPT_DOI,
            review_link: `${ZENODO_SITE}/records/201?token=share-201`,
            zenodo_status: 'review-anon',
            zenodo_date: today()
        });
    });

    it('makes no share link for a new version of a review record whose review_link is set', async () => {
        const held = 'https://zenodo.example/records/200?token=held';
        const at = fixture(
            {},
            { code: { doi: CONCEPT_DOI, zenodo_status: 'review-anon', review_link: held } }
        );
        const zenodo = fakeZenodo({ seed: REVIEW_COPY });
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(callsOf(zenodo).filter((one) => one.endsWith('/access/links'))).toEqual([]);
        expect(codeBlock(at).review_link).toBe(held);
    });

    it('makes a new version of a published record for Publish over zenodo_status deposited', async () => {
        const at = credited({}, { doi: CONCEPT_DOI, zenodo_status: 'deposited' });
        const zenodo = fakeZenodo({ seed: { concept: CONCEPT, record: RECORD } });
        const pressed = await press(at, 'zenodoPublish', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(callsOf(zenodo)).toContain('POST /200/versions');
        const sent = bodyOf(zenodo, 'PUT', '/201/draft') as {
            access: unknown;
            metadata: { creators: unknown };
        };
        expect(sent.metadata.creators).toEqual(CREATORS);
        expect(sent.access).toEqual({ record: 'public', files: 'public' });
        expect(codeBlock(at)).toMatchObject({
            doi: CONCEPT_DOI,
            zenodo_status: 'deposited',
            zenodo_date: today()
        });
    });

    it('refuses For review of a published deposit, naming its DOI, before any request', async () => {
        const at = fixture({}, { code: { doi: CONCEPT_DOI, zenodo_status: 'deposited' } });
        const zenodo = fakeZenodo();
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBe(said('server.zenodo.deposited', CONCEPT_DOI));
        expect(zenodo.calls).toEqual([]);
    });

    it('refuses a version DOI, naming the concept DOI, before any draft', async () => {
        const version = `10.5281/zenodo.${RECORD}`;
        const at = fixture({}, { code: { doi: version, zenodo_status: 'review-anon' } });
        const zenodo = fakeZenodo({ seed: REVIEW_COPY });
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBe(
            said('server.zenodo.doi_not_concept', version, CONCEPT_DOI)
        );
        expect(callsOf(zenodo)).toEqual(['GET /200']);
    });

    it('deletes the draft and writes nothing when Cancel ends the upload', async () => {
        const at = fixture({});
        const before = readFileSync(at.manifest, 'utf8');
        const running = createRunningGit();
        const zenodo = fakeZenodo({
            hold: (method, path) => method === 'PUT' && path.endsWith('/content'),
            held: () => {
                running.cancel(RUN);
            }
        });
        const pressed = await press(at, 'zenodoReview', zenodo, { running });
        expect(pressed.body.error).toBe(
            said('server.zenodo.cancelled_draft', said('server.zenodo.call_upload', 'alpha.zip'))
        );
        expect(callsOf(zenodo).at(-1)).toBe('DELETE /101/draft');
        expect(readFileSync(at.manifest, 'utf8')).toBe(before);
    });

    it('names the draft when Zenodo refuses to delete it', async () => {
        const at = fixture({});
        const zenodo = fakeZenodo({
            status: (method, path) => {
                if (method === 'DELETE') return 500;
                return path.endsWith('/content') ? 403 : undefined;
            }
        });
        const pressed = await press(at, 'zenodoReview', zenodo);
        expect(pressed.body.error).toBe(
            said(
                'server.zenodo.draft_kept',
                said(
                    'server.zenodo.failed_none',
                    said('server.zenodo.call_upload', 'alpha.zip'),
                    403
                ),
                '101'
            )
        );
    });

    it('still writes the DOI and the share link when Cancel comes after the publish was sent', async () => {
        const at = fixture({});
        const running = createRunningGit();
        const zenodo: FakeZenodo = fakeZenodo({
            hold: publishing,
            held: () => {
                running.cancel(RUN);
                zenodo.release();
            }
        });
        const pressed = await press(at, 'zenodoReview', zenodo, { running });
        expect(pressed.body.error).toBeUndefined();
        expect(callsOf(zenodo)).not.toContain('DELETE /101/draft');
        expect(callsOf(zenodo).at(-1)).toBe('POST /101/access/links');
        expect(codeBlock(at)).toMatchObject({
            doi: '10.5281/zenodo.102',
            zenodo_status: 'review-anon',
            review_link: `${ZENODO_SITE}/records/101?token=share-101`
        });
    });

    for (const { name, how } of FAILURES) {
        it(`writes the DOI and deletes nothing when the publish ${name} after Zenodo published`, async () => {
            const at = fixture({});
            const zenodo = fakeZenodo({
                after: (method, path) => (publishing(method, path) ? how : undefined)
            });
            const pressed = await press(at, 'zenodoReview', zenodo);
            expect(pressed.body.error).toBeUndefined();
            expect(pressed.body.output).toBe(said('server.zenodo.reviewed', '10.5281/zenodo.102'));
            expect(callsOf(zenodo)).not.toContain('DELETE /101/draft');
            expect(codeBlock(at)).toMatchObject({
                doi: '10.5281/zenodo.102',
                zenodo_status: 'review-anon',
                zenodo_date: today()
            });
        });

        it(`deletes the draft and writes nothing when the publish ${name} and the draft is not published`, async () => {
            const at = fixture({});
            const before = readFileSync(at.manifest, 'utf8');
            const zenodo = fakeZenodo({
                status: (method, path) => (publishing(method, path) ? how : undefined)
            });
            const pressed = await press(at, 'zenodoReview', zenodo);
            const call = said('server.zenodo.call_publish');
            expect(pressed.body.error).toBe(
                how === 'none'
                    ? said('server.zenodo.unanswered_draft', call)
                    : said('server.zenodo.failed_draft', call, how)
            );
            expect(callsOf(zenodo).slice(-2)).toEqual(['GET /101/draft', 'DELETE /101/draft']);
            expect(readFileSync(at.manifest, 'utf8')).toBe(before);
        });

        it(`deletes nothing and writes nothing when the publish ${name} and neither the draft nor the record reads`, async () => {
            const at = fixture({});
            const before = readFileSync(at.manifest, 'utf8');
            const zenodo = fakeZenodo({
                status: (method, path) => {
                    if (publishing(method, path)) return how;
                    return method === 'GET' ? 500 : undefined;
                }
            });
            const pressed = await press(at, 'zenodoReview', zenodo);
            const page = `${ZENODO_SITE}/records/101`;
            expect(pressed.body.error).toBe(said('server.zenodo.publish_unknown', page));
            expect(callsOf(zenodo).slice(-2)).toEqual(['GET /101/draft', 'GET /101']);
            expect(readFileSync(at.manifest, 'utf8')).toBe(before);
        });

        it(`writes nothing and names the page when the read after the publish ${name}`, async () => {
            const at = fixture({});
            const before = readFileSync(at.manifest, 'utf8');
            const reading = (method: string, path: string): number | 'none' | undefined =>
                method === 'GET' && path.endsWith('/records/101') ? how : undefined;
            const zenodo = fakeZenodo({ status: reading });
            const pressed = await press(at, 'zenodoReview', zenodo);
            const page = `${ZENODO_SITE}/records/101`;
            const call = said('server.zenodo.call_read', '101');
            expect(pressed.body.error).toBe(
                how === 'none'
                    ? said('server.zenodo.unanswered_unread', page, call)
                    : said('server.zenodo.failed_unread', page, call, how)
            );
            expect(pressed.body.error).toContain(page);
            expect(callsOf(zenodo)).not.toContain('DELETE /101/draft');
            expect(readFileSync(at.manifest, 'utf8')).toBe(before);
        });

        it(`keeps the DOI written when the share link ${name}`, async () => {
            const at = fixture({});
            const zenodo = fakeZenodo({
                status: (method, path) => (path.endsWith('/access/links') ? how : undefined)
            });
            const pressed = await press(at, 'zenodoReview', zenodo);
            const doi = '10.5281/zenodo.102';
            const call = said('server.zenodo.call_link');
            expect(pressed.body.error).toBe(
                how === 'none'
                    ? said('server.zenodo.unanswered_published', doi, call)
                    : said('server.zenodo.failed_published', doi, call, how)
            );
            expect(codeBlock(at)).toMatchObject({ doi, zenodo_status: 'review-anon' });
            expect(codeBlock(at).review_link).toBeUndefined();
        });
    }

    const UNMARKED: { named: string; state: Record<string, string> }[] = [
        { named: 'empty', state: {} },
        { named: 'none', state: { zenodo_status: 'none' } }
    ];

    for (const { named, state } of UNMARKED) {
        it(`makes a new version of a review copy whose DOI has zenodo_status ${named}`, async () => {
            const at = fixture({}, { code: { doi: CONCEPT_DOI, ...state } });
            const zenodo = fakeZenodo({ seed: REVIEW_COPY });
            const pressed = await press(at, 'zenodoReview', zenodo);
            expect(pressed.body.error).toBeUndefined();
            expect(callsOf(zenodo)).toContain('POST /200/versions');
            expect(codeBlock(at)).toMatchObject({
                doi: CONCEPT_DOI,
                zenodo_status: 'review-anon',
                review_link: `${ZENODO_SITE}/records/201?token=share-201`
            });
        });
    }

    const PUBLISHED: { name: string; seed: Partial<typeof REVIEW_COPY> }[] = [
        { name: 'its own authors and open files', seed: {} },
        { name: 'its own authors and restricted files', seed: { restricted: true } },
        { name: 'Anonymous and open files', seed: { creators: ['Anonymous'] } },
        {
            name: 'Anonymous among two creators',
            seed: { creators: ['Anonymous', 'Rivera, Ana'], restricted: true }
        }
    ];

    for (const { name, seed } of PUBLISHED) {
        it(`refuses a DOI with no Zenodo status of a record with ${name}, with no call after the read`, async () => {
            const at = fixture({}, { code: { doi: CONCEPT_DOI } });
            const before = readFileSync(at.manifest, 'utf8');
            const zenodo = fakeZenodo({ seed: { concept: CONCEPT, record: RECORD, ...seed } });
            const pressed = await press(at, 'zenodoReview', zenodo);
            expect(pressed.status).toBe(400);
            expect(pressed.body.error).toBe(said('server.zenodo.doi_published', CONCEPT_DOI));
            expect(callsOf(zenodo)).toEqual([
                'GET /199',
                'GET /200',
                'GET /200/versions/latest',
                'GET /200'
            ]);
            expect(readFileSync(at.manifest, 'utf8')).toBe(before);
        });
    }

    it('writes the published status of a new version with no read after its publish', async () => {
        const at = credited({}, { doi: CONCEPT_DOI, zenodo_status: 'review-anon' });
        const zenodo = fakeZenodo({
            seed: REVIEW_COPY,
            status: (method, path) =>
                method === 'GET' && path.endsWith('/records/201') ? 500 : undefined
        });
        const pressed = await press(at, 'zenodoPublish', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(codeBlock(at)).toMatchObject({ doi: CONCEPT_DOI, zenodo_status: 'deposited' });
    });

    it('leaves Publish of a DOI with no Zenodo status a new version of the record', async () => {
        const at = credited({}, { doi: CONCEPT_DOI });
        const zenodo = fakeZenodo({ seed: { concept: CONCEPT, record: RECORD } });
        const pressed = await press(at, 'zenodoPublish', zenodo);
        expect(pressed.body.error).toBeUndefined();
        expect(callsOf(zenodo)).toContain('POST /200/versions');
        expect(codeBlock(at)).toMatchObject({ doi: CONCEPT_DOI, zenodo_status: 'deposited' });
    });
});
