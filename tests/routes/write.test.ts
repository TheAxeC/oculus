// What the /api/write route answers. The route itself is a single line handing the request to
// lib/server/writes.ts with the token ServerContext minted, which is what this calls: handleWrite
// takes a Request, the token and the hub to write in, so every case here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the token actually reaching the page, and Kit
// putting it on the event, which is exercised by the curl in the package's verification.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleWrite } from '../../src/lib/server/writes.ts';
import { mintToken } from '../../src/lib/server/auth.ts';
import { localDate } from '../../src/lib/data/dates.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../src/lib/server/writes.ts';

const MANIFEST = 'id: alpha\ntype: manuscript\ntitle: "A title"\nstatus:\n  line: "the line"\n';

/** A collection file and a career file, at the hub paths config/sources.yml names. */
const TASKS =
    'title: Tasks\nschema:\n  - { field: title, type: text }\n  - { field: meta, type: metalist }\nentries:\n  - title: "Review the draft"\n    status: open\n    subtasks:\n      - { do: read it }\n\n  - title: "Another task"\n    status: open\n';

const VENUES =
    'title: Venues\nschema:\n  - { field: name, type: text }\n  - { field: id, type: text }\nvenues:\n  - name: Existing Venue\n    id: existing\n';

const DATA =
    'title: Data\nschema:\n  - { field: key, type: text }\n  - { field: retrieval, type: raw }\ndatasets:\n  - key: mimic-iv\n    retrieval:\n      method: curl\n';

const CAREER = 'title: Career\nhosts:\n  - { name: "Naesens", status: "warm" }\n';
const RADAR = 'meta: {}\nentries:\n  - title: "Paper"\n';
const LEADS = `meta: {}
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, applied, declined] }
  - { field: date, type: date }
entries:
  - title: "Lead"
`;
const INBOX = 'meta: {}\nentries:\n  - id: "mail-1"\n';

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/write`;

function target(): WriteTarget {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-route-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const folder = join(dir, 'projects', 'manuscripts', 'alpha');
    expect(resolve(folder).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    for (const [path, body] of [
        ['tasks/tasks.yml', TASKS],
        ['registries/venues.yml', VENUES],
        ['registries/data.yml', DATA],
        ['CAREER.yml', CAREER],
        ['feeds/literature-radar.yml', RADAR],
        ['feeds/position-leads.yml', LEADS],
        ['feeds/inbox.yml', INBOX]
    ]) {
        const file = join(dir, path);
        expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(file, '..'), { recursive: true });
        writeFileSync(file, body);
    }
    const linkedin = join(dir, 'theaxec.github.io', '_linkedin');
    expect(resolve(linkedin).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(linkedin, { recursive: true });
    writeFileSync(
        join(linkedin, 'xx-route-idea.md'),
        '---\ntitle: "Route idea"\ncategory: research\ndate: 2026-09-12\n---\n\n'
    );
    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    // The overrides file is inside the same temporary directory, so a session write in this suite
    // can never reach ~/.oculus/sessions.json.
    const overrides = join(dir, 'sessions.json');
    expect(resolve(overrides).startsWith(resolve(dir) + sep)).toBe(true);
    return {
        hub: dir,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] },
        overrides
    };
}

/** What the overrides file holds, or null when nothing has written it yet. */
function overridesOf(into: WriteTarget): unknown {
    const path = into.overrides!;
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
}

/** A request as the page makes it, with whatever headers and body a case wants instead. */
function request(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(URL_, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

const GOOD = { kind: 'manifest', id: 'alpha', fields: { 'status.line': 'a new line' } };

/** An absolute area to pin a session to. It is never opened: the overrides file only names it. */
const AREA = '/hub/projects/manuscripts/alpha';

function manifestOf(into: WriteTarget): string {
    return readFileSync(join(into.hub, 'projects', 'manuscripts', 'alpha', 'project.yml'), 'utf8');
}

describe('the write endpoint', () => {
    it('adds and promotes LinkedIn files through the two write kinds', async () => {
        const into = target();
        const added = await handleWrite(
            request({ kind: 'linkedin-idea', title: 'A fresh idea', category: 'reflection' }),
            TOKEN,
            into
        );
        expect(await added.json()).toEqual({ ok: true, changed: ['file'], refused: [] });
        expect(
            existsSync(join(into.hub, 'theaxec.github.io', '_linkedin', 'xx-a-fresh-idea.md'))
        ).toBe(true);
        const posted = await handleWrite(
            request({ kind: 'linkedin-post', file: 'xx-route-idea.md' }),
            TOKEN,
            into
        );
        expect(await posted.json()).toEqual({ ok: true, changed: ['file'], refused: [] });
        expect(
            existsSync(join(into.hub, 'theaxec.github.io', '_linkedin', '01-route-idea.md'))
        ).toBe(true);
    });

    it('writes a feed field and deletes an allowed feed entry', async () => {
        const into = target();
        const field = await handleWrite(
            request({
                kind: 'feed-field',
                feed: 'radar',
                id: 'Paper',
                field: 'dismissed',
                value: true
            }),
            TOKEN,
            into
        );
        expect(await field.json()).toEqual({ ok: true, changed: ['dismissed'], refused: [] });
        const removal = await handleWrite(
            request({ kind: 'feed-delete', feed: 'leads', id: 'Lead' }),
            TOKEN,
            into
        );
        expect(await removal.json()).toEqual({ ok: true, changed: ['entries'], refused: [] });
    });

    it('adds a lead with defaults and refuses one without a title', async () => {
        const into = target();
        const added = await handleWrite(
            request({ kind: 'lead-add', fields: { title: 'Another lead' } }),
            TOKEN,
            into
        );
        expect(await added.json()).toEqual({ ok: true, changed: ['entries'], refused: [] });
        expect(readFileSync(join(into.hub, 'feeds/position-leads.yml'), 'utf8')).toContain(
            `  - title: Another lead\n    status: open\n    date: ${localDate(Date.now())}`
        );

        const refused = await handleWrite(
            request({ kind: 'lead-add', fields: { title: ' ' } }),
            TOKEN,
            into
        );
        expect(await refused.json()).toEqual({
            ok: true,
            changed: [],
            refused: [{ field: 'title', reason: 'a lead needs a title' }]
        });
    });
    it('refuses a request with no token', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the write token is missing or stale' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('refuses a request with a stale token', async () => {
        const into = target();
        const response = await handleWrite(
            request(GOOD, { 'x-oculus-token': mintToken() }),
            TOKEN,
            into
        );
        expect(response.status).toBe(403);
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('refuses a request from another origin', async () => {
        const into = target();
        const foreign = { origin: 'http://evil.invalid', 'sec-fetch-site': 'cross-site' };
        const response = await handleWrite(request(GOOD, foreign), TOKEN, into);
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'the request did not come from this page' });
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('refuses a request that names no origin at all', async () => {
        const bare = new Request(URL_, {
            method: 'POST',
            headers: { host: HOST, 'x-oculus-token': TOKEN },
            body: JSON.stringify(GOOD)
        });
        expect((await handleWrite(bare, TOKEN, target())).status).toBe(403);
    });

    it('refuses a body that is not JSON, and one that is not a manifest write', async () => {
        const into = target();
        expect((await handleWrite(request('not json'), TOKEN, into)).status).toBe(400);
        expect((await handleWrite(request({ kind: 'other' }), TOKEN, into)).status).toBe(400);
        expect(
            (await handleWrite(request({ kind: 'manifest', id: 'alpha' }), TOKEN, into)).status
        ).toBe(400);
        expect(manifestOf(into)).toBe(MANIFEST);
    });

    it('answers 404 for an id the hub does not hold', async () => {
        const into = target();
        const body = { kind: 'manifest', id: 'nobody', fields: { title: 'x' } };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'no project with the id nobody' });
    });

    it('writes the field and says what changed', async () => {
        const into = target();
        const response = await handleWrite(request(GOOD), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['status.line'], refused: [] });
        expect(manifestOf(into)).toBe(MANIFEST.replace('"the line"', '"a new line"'));
    });

    it('dismisses a session, and brings it back, in the overrides file', async () => {
        const into = target();
        const dismiss = { kind: 'session', id: 'sess-1', hidden: true };
        const response = await handleWrite(request(dismiss), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['hidden'], refused: [] });
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { hidden: true } } });

        const restore = { kind: 'session', id: 'sess-1', hidden: false };
        expect((await handleWrite(request(restore), TOKEN, into)).status).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: {} });
    });

    it('refuses a session write with no token, and writes nothing', async () => {
        const into = target();
        const body = { kind: 'session', id: 'sess-1', hidden: true };
        const response = await handleWrite(request(body, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(overridesOf(into)).toBe(null);
    });

    it('refuses a session write that names no id or no field', async () => {
        const into = target();
        expect((await handleWrite(request({ kind: 'session', id: '' }), TOKEN, into)).status).toBe(
            400
        );
        expect((await handleWrite(request({ kind: 'session', id: 'a' }), TOKEN, into)).status).toBe(
            400
        );
        expect(
            (await handleWrite(request({ kind: 'session', id: 'a', hidden: 'yes' }), TOKEN, into))
                .status
        ).toBe(400);
        expect(
            (await handleWrite(request({ kind: 'session', id: 'a', area: 7 }), TOKEN, into)).status
        ).toBe(400);
        expect(
            (await handleWrite(request({ kind: 'session', id: 'a', title: null }), TOKEN, into))
                .status
        ).toBe(400);
        expect(overridesOf(into)).toBe(null);
    });

    it('pins a session to an area through the route, and unpins it', async () => {
        const into = target();
        const pin = { kind: 'session', id: 'sess-1', area: AREA };
        const response = await handleWrite(request(pin), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['area'], refused: [] });
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { area: AREA } } });

        const unpin = { kind: 'session', id: 'sess-1', area: '' };
        expect((await handleWrite(request(unpin), TOKEN, into)).status).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: {} });
    });

    it('renames a session through the route, and clears the name', async () => {
        const into = target();
        const rename = { kind: 'session', id: 'sess-1', title: 'my name' };
        const response = await handleWrite(request(rename), TOKEN, into);
        expect(await response.json()).toEqual({ ok: true, changed: ['title'], refused: [] });
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { title: 'my name' } } });

        const clear = { kind: 'session', id: 'sess-1', title: '' };
        expect((await handleWrite(request(clear), TOKEN, into)).status).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: {} });
    });

    it('carries a dismissal, a pin and a title in one body', async () => {
        const into = target();
        const body = { kind: 'session', id: 'sess-1', hidden: true, area: AREA, title: 'my name' };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['hidden', 'area', 'title'],
            refused: []
        });
        expect(overridesOf(into)).toEqual({
            sessions: { 'sess-1': { hidden: true, area: AREA, title: 'my name' } }
        });
    });

    it('refuses an area that is not absolute as a refusal, not an error', async () => {
        const into = target();
        const body = { kind: 'session', id: 'sess-1', area: 'projects/alpha' };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: [],
            refused: [{ field: 'area', reason: 'the area must be an absolute path' }]
        });
        expect(overridesOf(into)).toBe(null);
    });

    it('refuses a pin with no token, and writes nothing', async () => {
        const into = target();
        const body = { kind: 'session', id: 'sess-1', area: AREA };
        const response = await handleWrite(request(body, { 'x-oculus-token': '' }), TOKEN, into);
        expect(response.status).toBe(403);
        expect(overridesOf(into)).toBe(null);
    });

    it('carries a refusal back with the fields it did write', async () => {
        const into = target();
        const body = {
            kind: 'manifest',
            id: 'alpha',
            fields: { title: 'Another title', id: 'other' }
        };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['title'],
            refused: [{ field: 'id', reason: 'the field is read-only' }]
        });
    });
});

/** One good body of every kind this route accepts, and what it should answer. */
const KINDS: Record<string, unknown> = {
    entry: {
        kind: 'entry',
        collection: 'tasks',
        id: 'Review the draft',
        fields: { status: 'done' }
    },
    subtask: {
        kind: 'subtask',
        target: { id: 'Review the draft', collection: 'tasks' },
        key: '0',
        action: 'done'
    },
    'subtask-add': { kind: 'subtask-add', target: { id: 'alpha' }, fields: { do: 'write it' } },
    host: { kind: 'host', name: 'Naesens', status: 'candidate' },
    'new-entry': { kind: 'new-entry', collection: 'tasks', fields: { title: 'A new task' } },
    reorder: {
        kind: 'reorder',
        collection: 'tasks',
        order: ['Another task', 'Review the draft']
    },
    'delete-entry': { kind: 'delete-entry', collection: 'tasks', id: 'Review the draft' },
    'lead-add': { kind: 'lead-add', fields: { title: 'A lead' } },
    'linkedin-idea': { kind: 'linkedin-idea', title: 'A LinkedIn idea', category: 'research' },
    'linkedin-post': { kind: 'linkedin-post', file: 'xx-route-idea.md' },
    'new-idea': { kind: 'new-idea', fields: { id: 'a-new-idea', title: 'A new idea' } }
};

/** One malformed body of every kind: the right `kind`, a field of the wrong shape. */
const MALFORMED: Record<string, unknown> = {
    entry: { kind: 'entry', collection: 'tasks', id: 'Review the draft', fields: 'not a map' },
    subtask: { kind: 'subtask', target: { id: 'alpha' }, key: '0', action: 'archive' },
    'subtask-add': { kind: 'subtask-add', target: { id: 'alpha' }, fields: { do: '   ' } },
    host: { kind: 'host', name: 'Naesens', status: 42 },
    'new-entry': { kind: 'new-entry', collection: 42, fields: {} },
    reorder: { kind: 'reorder', collection: 'tasks', order: [42] },
    'delete-entry': { kind: 'delete-entry', collection: 'tasks', id: 42 },
    'lead-add': { kind: 'lead-add', fields: 'not a map' },
    'linkedin-idea': { kind: 'linkedin-idea', title: 42, category: 'research' },
    'linkedin-post': { kind: 'linkedin-post', file: 42 },
    'new-idea': { kind: 'new-idea', fields: { title: 'no id' } }
};

describe('the kinds the write endpoint learned in P1', () => {
    for (const [kind, body] of Object.entries(KINDS)) {
        it(`answers 200 for a good ${kind} body`, async () => {
            const into = target();
            const response = await handleWrite(request(body), TOKEN, into);
            expect(response.status).toBe(200);
            const answer = (await response.json()) as { ok: boolean; changed: string[] };
            expect(answer.ok).toBe(true);
            expect(answer.changed.length).toBeGreaterThan(0);
        });

        it(`refuses a ${kind} body with no token, and writes nothing`, async () => {
            const into = target();
            const before = readFileSync(join(into.hub, 'tasks', 'tasks.yml'), 'utf8');
            const response = await handleWrite(
                request(body, { 'x-oculus-token': '' }),
                TOKEN,
                into
            );
            expect(response.status).toBe(403);
            expect(readFileSync(join(into.hub, 'tasks', 'tasks.yml'), 'utf8')).toBe(before);
            expect(manifestOf(into)).toBe(MANIFEST);
            expect(existsSync(join(into.hub, 'projects', 'ideas'))).toBe(false);
        });
    }

    for (const [kind, body] of Object.entries(MALFORMED)) {
        it(`answers 400 for a malformed ${kind} body`, async () => {
            const into = target();
            const response = await handleWrite(request(body), TOKEN, into);
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: 'the body is not a write this route knows'
            });
        });
    }

    it('answers 404 for a subtask on a project the hub does not hold', async () => {
        const into = target();
        const body = {
            kind: 'subtask',
            target: { id: 'no-such-project' },
            key: '0',
            action: 'done'
        };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'no project with the id no-such-project' });
    });

    it('answers 404 for an entry, a collection and a host the hub does not hold', async () => {
        const into = target();
        const cases: [unknown, string][] = [
            [
                { kind: 'entry', collection: 'tasks', id: 'Nobody', fields: { status: 'done' } },
                'no entry Nobody in tasks'
            ],
            [
                { kind: 'new-entry', collection: 'nonesuch', fields: { title: 'x' } },
                'no collection nonesuch'
            ],
            [{ kind: 'host', name: 'Nobody', status: 'warm' }, 'no host named Nobody'],
            [{ kind: 'reorder', collection: 'nonesuch', order: ['x'] }, 'no collection nonesuch'],
            [
                { kind: 'delete-entry', collection: 'tasks', id: 'Nobody' },
                'no entry Nobody in tasks'
            ]
        ];
        for (const [body, error] of cases) {
            const response = await handleWrite(request(body), TOKEN, into);
            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error });
        }
    });

    it('carries a refusal back for a status outside the career vocabulary', async () => {
        const into = target();
        const body = { kind: 'host', name: 'Naesens', status: 'promoted' };
        const response = await handleWrite(request(body), TOKEN, into);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: [],
            refused: [{ field: 'status', reason: 'promoted is not a career host status' }]
        });
        expect(readFileSync(join(into.hub, 'CAREER.yml'), 'utf8')).toBe(CAREER);
    });

    it('carries metalists through entry and new-entry writes', async () => {
        const into = target();
        const fields = { meta: [{ label: 'Owner', value: 'Axel' }] };
        const edited = await handleWrite(
            request({ kind: 'entry', collection: 'tasks', id: 'Review the draft', fields }),
            TOKEN,
            into
        );
        expect(await edited.json()).toEqual({ ok: true, changed: ['meta'], refused: [] });
        expect(readFileSync(join(into.hub, 'tasks', 'tasks.yml'), 'utf8')).toContain(
            '    meta:\n      - { label: Owner, value: "Axel" }'
        );

        const added = await handleWrite(
            request({
                kind: 'new-entry',
                collection: 'tasks',
                fields: { title: 'Metalist task', ...fields }
            }),
            TOKEN,
            into
        );
        expect(await added.json()).toEqual({ ok: true, changed: ['entries'], refused: [] });
        expect(readFileSync(join(into.hub, 'tasks', 'tasks.yml'), 'utf8')).toContain(
            '  - title: Metalist task\n    meta:\n      - { label: Owner, value: "Axel" }'
        );
    });

    it('carries flat raw maps through entry and new-entry writes', async () => {
        const into = target();
        const fields = { retrieval: { method: 'wget' } };
        const edited = await handleWrite(
            request({ kind: 'entry', collection: 'data', id: 'mimic-iv', fields }),
            TOKEN,
            into
        );
        expect(await edited.json()).toEqual({ ok: true, changed: ['retrieval'], refused: [] });
        expect(readFileSync(join(into.hub, 'registries', 'data.yml'), 'utf8')).toContain(
            '    retrieval:\n      method: wget'
        );

        const added = await handleWrite(
            request({
                kind: 'new-entry',
                collection: 'data',
                fields: { key: 'ptb-xl', ...fields }
            }),
            TOKEN,
            into
        );
        expect(await added.json()).toEqual({ ok: true, changed: ['datasets'], refused: [] });
        expect(readFileSync(join(into.hub, 'registries', 'data.yml'), 'utf8')).toContain(
            '  - key: ptb-xl\n    retrieval:\n      method: wget'
        );
    });

    it('requires a fresh non-empty id for new venues', async () => {
        const missing = target();
        const missingResponse = await handleWrite(
            request({ kind: 'new-entry', collection: 'venues', fields: { name: 'Missing ID' } }),
            TOKEN,
            missing
        );
        expect(await missingResponse.json()).toEqual({
            ok: true,
            changed: [],
            refused: [{ field: 'id', reason: 'a new entry needs a non-empty id' }]
        });

        const duplicate = target();
        const duplicateResponse = await handleWrite(
            request({
                kind: 'new-entry',
                collection: 'venues',
                fields: { name: 'Another Venue', id: 'existing' }
            }),
            TOKEN,
            duplicate
        );
        expect(await duplicateResponse.json()).toEqual({
            ok: true,
            changed: [],
            refused: [{ field: 'id', reason: 'an entry with that id is already in the file' }]
        });

        const fresh = target();
        const freshResponse = await handleWrite(
            request({
                kind: 'new-entry',
                collection: 'venues',
                fields: { name: 'Fresh Venue', id: 'fresh' }
            }),
            TOKEN,
            fresh
        );
        expect(await freshResponse.json()).toEqual({
            ok: true,
            changed: ['venues'],
            refused: []
        });
        expect(readFileSync(join(fresh.hub, 'registries', 'venues.yml'), 'utf8')).toContain(
            '  - name: Fresh Venue\n    id: fresh'
        );
    });
});
