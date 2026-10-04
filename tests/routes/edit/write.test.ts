// Layer 2, route tests. What the /api/write route answers. The route itself is a single line
// handing the request to lib/server/edit/writes.ts with the token ServerContext minted, which is
// what this calls: handleWrite takes a Request, the token and the hub to write in, so every case
// here is one Request object.
//
// The hub is synthetic, under the system temporary directory, and every path written is asserted to
// be inside it first. What this does NOT cover: the token actually reaching the page, and Kit
// putting it on the event.
//
// The cases tagged slow take 100 ms or more; every other case runs in npm test. A hook loads the
// configuration once, since the first load costs more than a later one, so no case pays for it.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import * as readers from '../../../src/lib/server/edit/writes.ts';
import {
    configKeyWrite,
    deckWrite,
    feedFieldWrite,
    handleWrite,
    linkedinIdeaWrite,
    manifestWrite,
    railWrite,
    reorderWrite,
    sessionWrite,
    subtaskAdd,
    subtaskWrite
} from '../../../src/lib/server/edit/writes.ts';
import { localDate } from '../../../src/lib/data/helpers/dates.ts';
import {
    AREA,
    CAREER,
    GOOD,
    MANIFEST,
    TOKEN,
    configTarget,
    deckOf,
    deckTarget,
    manifestOf,
    overridesOf,
    request,
    target,
    warmConfig
} from './write-fixture.ts';
import { it, test } from '../../fixtures/scratch.ts';

test.beforeAll(warmConfig);

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

    it('pins a session to the top of its group through the route, and takes it off', async () => {
        const into = target();
        const pin = { kind: 'session', id: 'sess-1', top: true, title: 'my name' };
        const response = await handleWrite(request(pin), TOKEN, into);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['top', 'title'],
            refused: []
        });
        expect(overridesOf(into)).toEqual({
            sessions: { 'sess-1': { top: true, title: 'my name' } }
        });
        const off = { kind: 'session', id: 'sess-1', top: false };
        expect((await handleWrite(request(off), TOKEN, into)).status).toBe(200);
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { title: 'my name' } } });
        // A top that is no boolean refuses the whole body, the valid title beside it included.
        const wrong = { kind: 'session', id: 'sess-1', top: 'yes', title: 'other' };
        expect((await handleWrite(request(wrong), TOKEN, into)).status).toBe(400);
        expect(overridesOf(into)).toEqual({ sessions: { 'sess-1': { title: 'my name' } } });
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
    'new-idea': { kind: 'new-idea', fields: { title: 'no id' } },
    'config-key': { kind: 'config-key', file: 'behavior.yml', key: 'changes.keep' }
};

describe('the kinds the write endpoint takes', () => {
    for (const [kind, body] of Object.entries(KINDS)) {
        it(`answers 200 for a good ${kind} body`, async () => {
            const into = target();
            const response = await handleWrite(request(body), TOKEN, into);
            expect(response.status).toBe(200);
            const answer = (await response.json()) as { ok: boolean; changed: string[] };
            expect(answer.ok).toBe(true);
            expect(answer.changed.length).toBeGreaterThan(0);
        });
    }

    for (const [kind, body] of Object.entries(MALFORMED)) {
        it(`answers 400 for a malformed ${kind} body`, async () => {
            const into = kind === 'config-key' ? configTarget() : target();
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
        expect(readFileSync(join(into.hub, 'registries/career.yml'), 'utf8')).toBe(CAREER);
    });

    it('carries metalists through entry and new-entry writes', async () => {
        const into = target();
        const fields = { meta: [{ label: 'Owner', value: 'Axel' }] };
        const edited = await handleWrite(
            request({ kind: 'entry', collection: 'tasks', id: 'Review the draft', fields }),
            TOKEN,
            into
        );
        expect(await edited.json()).toEqual({
            ok: true,
            changed: ['meta'],
            refused: [],
            id: 'Review the draft'
        });
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
        expect(await added.json()).toEqual({
            ok: true,
            changed: ['entries'],
            refused: [],
            id: 'Metalist task'
        });
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
        expect(await edited.json()).toEqual({
            ok: true,
            changed: ['retrieval'],
            refused: [],
            id: 'mimic-iv'
        });
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
        expect(await added.json()).toEqual({
            ok: true,
            changed: ['datasets'],
            refused: [],
            id: 'ptb-xl'
        });
        expect(readFileSync(join(into.hub, 'registries', 'data.yml'), 'utf8')).toContain(
            '  - key: ptb-xl\n    retrieval:\n      method: wget'
        );
    });

    it('requires a fresh non-empty id for new venues', { tags: ['slow'] }, async () => {
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
            refused: [],
            id: 'fresh'
        });
        expect(readFileSync(join(fresh.hub, 'registries', 'venues.yml'), 'utf8')).toContain(
            '  - name: Fresh Venue\n    id: fresh'
        );
    });
});

/**
 * The catalog those two projects and that order make, which is what a save must name. The archived
 * project's slide is in it, unticked by default, so a reader can put it on the deck.
 */
const CATALOG = ['title', 'framing:engine', 'alpha', 'gamma', 'closing'];

describe('the deck write', () => {
    it('writes both lists into the deck file and keeps every other byte of it', async () => {
        const into = deckTarget();
        const order = ['title', 'alpha', 'framing:engine', 'gamma', 'closing'];
        const response = await handleWrite(
            request({ kind: 'deck', selection: ['title', 'alpha'], order }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['deck'], refused: [] });
        const written = deckOf(into);
        const deck = (parse(written) as { deck: Record<string, unknown> }).deck;
        expect(deck.selection).toEqual(['title', 'alpha']);
        expect(deck.slide_order).toEqual(order);
        expect(written).toContain("    # the deck's own slides, in the order it shows them\n");
        expect(written).toContain("        engine: { title: 'The common engine' }\n");
    });

    it('saves the selection in the order the reader left the deck in', async () => {
        const into = deckTarget();
        await handleWrite(
            request({
                kind: 'deck',
                selection: ['closing', 'title'],
                order: ['closing', 'framing:engine', 'gamma', 'alpha', 'title']
            }),
            TOKEN,
            into
        );
        const deck = (parse(deckOf(into)) as { deck: Record<string, unknown> }).deck;
        expect(deck.selection).toEqual(['closing', 'title']);
    });

    it(
        'refuses an empty selection, a key it does not know and a repeated key',
        { tags: ['slow'] },
        async () => {
            for (const selection of [[], ['title', 'nobody'], ['title', 'title']]) {
                const into = deckTarget();
                const before = deckOf(into);
                const response = await handleWrite(
                    request({ kind: 'deck', selection, order: CATALOG }),
                    TOKEN,
                    into
                );
                expect(response.status).toBe(400);
                expect(await response.json()).toEqual({ error: 'invalid' });
                expect(deckOf(into)).toBe(before);
            }
        }
    );

    it(
        'refuses an order that is not a permutation of the catalog',
        { tags: ['slow'] },
        async () => {
            for (const order of [
                ['title', 'alpha'],
                ['title', 'framing:engine', 'alpha', 'gamma', 'nobody'],
                ['title', 'title', 'alpha', 'gamma', 'closing']
            ]) {
                const into = deckTarget();
                const before = deckOf(into);
                const response = await handleWrite(
                    request({ kind: 'deck', selection: ['title'], order }),
                    TOKEN,
                    into
                );
                expect(response.status).toBe(400);
                expect(await response.json()).toEqual({ error: 'invalid_order' });
                expect(deckOf(into)).toBe(before);
            }
        }
    );

    it('saves a selection naming an archived project, and the file holds it', async () => {
        const into = deckTarget();
        const response = await handleWrite(
            request({ kind: 'deck', selection: ['title', 'gamma'], order: CATALOG }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, changed: ['deck'], refused: [] });
        const deck = (parse(deckOf(into)) as { deck: Record<string, unknown> }).deck;
        expect(deck.selection).toEqual(['title', 'gamma']);
        expect(deck.slide_order).toEqual(CATALOG);
    });

    it('refuses a deck file that is not there, and says which refusal it was', async () => {
        const into = deckTarget();
        rmSync(into.config.deckFile);
        const response = await handleWrite(
            request({ kind: 'deck', selection: ['title'], order: CATALOG }),
            TOKEN,
            into
        );
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
        expect(existsSync(into.config.deckFile)).toBe(false);
    });

    it('refuses a deck file whose map the line edit cannot keep, and writes nothing', async () => {
        const into = deckTarget();
        const flow = 'deck: { order: [{ slide: title }] }\n';
        writeFileSync(into.config.deckFile, flow);
        const response = await handleWrite(
            request({ kind: 'deck', selection: ['title'], order: CATALOG }),
            TOKEN,
            into
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'invalid' });
        expect(deckOf(into)).toBe(flow);
    });

    it(
        'does not know a body whose two lists are not lists of words',
        { tags: ['slow'] },
        async () => {
            for (const body of [
                { kind: 'deck', selection: 'title', order: CATALOG },
                { kind: 'deck', selection: ['title'], order: [1, 2] },
                { kind: 'deck', selection: [''], order: CATALOG },
                { kind: 'deck', order: CATALOG }
            ]) {
                const response = await handleWrite(request(body), TOKEN, deckTarget());
                expect(response.status).toBe(400);
                expect(await response.json()).toEqual({
                    error: 'the body is not a write this route knows'
                });
            }
        }
    );

    it('writes nothing when the file already holds exactly those two lists', async () => {
        const into = deckTarget();
        const body = { kind: 'deck', selection: ['title'], order: CATALOG };
        await handleWrite(request(body), TOKEN, into);
        const written = deckOf(into);
        const again = await handleWrite(request(body), TOKEN, into);
        expect(await again.json()).toEqual({ ok: true, changed: [], refused: [] });
        expect(deckOf(into)).toBe(written);
    });
});

describe('the config-key body', () => {
    const GOOD_BODY = { kind: 'config-key', file: 'behavior.yml', key: 'changes.keep', value: 300 };

    it('is read as the file, the key and the value, whatever the value is', () => {
        expect(configKeyWrite(GOOD_BODY)).toEqual(GOOD_BODY);
        expect(configKeyWrite({ ...GOOD_BODY, value: null })).toEqual({
            ...GOOD_BODY,
            value: null
        });
        expect(configKeyWrite({ ...GOOD_BODY, value: [1] })).toEqual({ ...GOOD_BODY, value: [1] });
    });

    it('is not a write when the value is missing, the file or the key is empty or not a string', () => {
        const { value: _value, ...without } = GOOD_BODY;
        for (const body of [
            without,
            { ...GOOD_BODY, file: '' },
            { ...GOOD_BODY, file: 7 },
            { ...GOOD_BODY, key: '' },
            { ...GOOD_BODY, key: ['changes', 'keep'] },
            { ...GOOD_BODY, key: undefined },
            { ...GOOD_BODY, kind: 'config_key' },
            'config-key',
            null
        ]) {
            expect(configKeyWrite(body)).toBeNull();
        }
    });
});

describe('the body readers', () => {
    const target = { id: 'a' };

    it('answers the body fields map itself, an own __proto__ key included', () => {
        const held = JSON.parse('{"__proto__":{"x":1},"title":"t"}') as Record<string, unknown>;
        const write = manifestWrite({ kind: 'manifest', id: 'a', fields: held });
        expect(write?.fields).toBe(held);
        expect(Object.hasOwn(write?.fields ?? {}, '__proto__')).toBe(true);
    });

    it('reads a session body into the keys it names and refuses a wrong field', () => {
        const hidden = sessionWrite({ kind: 'session', id: 'a', hidden: true });
        expect(hidden).toStrictEqual({ kind: 'session', id: 'a', hidden: true });
        expect(sessionWrite({ kind: 'session', id: 'a' })).toBeNull();
        expect(sessionWrite({ kind: 'session', id: 'a', hidden: 'yes' })).toBeNull();
        expect(sessionWrite({ kind: 'session', id: 'a', hidden: null })).toBeNull();
        expect(sessionWrite({ kind: 'session', id: 'a', title: 3 })).toBeNull();
        expect(sessionWrite({ kind: 'session', id: 'a', title: '' })).toStrictEqual({
            kind: 'session',
            id: 'a',
            title: ''
        });
        const extra = sessionWrite({ kind: 'session', id: 'a', top: false, extra: 1 });
        expect(extra).toStrictEqual({ kind: 'session', id: 'a', top: false });
        expect(Object.keys(extra ?? {})).toEqual(['kind', 'id', 'top']);
    });

    it('reads a subtask body: a target without a collection key, and the refusals', () => {
        const base = { kind: 'subtask', target, key: 'k', action: 'done' };
        expect(subtaskWrite(base)).toStrictEqual({
            kind: 'subtask',
            target: { id: 'a' },
            key: 'k',
            action: 'done'
        });
        expect(Object.keys(subtaskWrite(base)?.target ?? {})).toEqual(['id']);
        for (const wrong of [
            { target: { id: 'a', collection: '' } },
            { target: { id: 'a', collection: null } },
            { action: 'toString' },
            { value: 3 },
            { value: null },
            { target: [] }
        ]) {
            expect(subtaskWrite({ ...base, ...wrong })).toBeNull();
        }
        expect(subtaskWrite({ ...base, value: '' })).toStrictEqual({
            kind: 'subtask',
            target: { id: 'a' },
            key: 'k',
            action: 'done',
            value: ''
        });
    });

    it('answers a subtask add its fields map itself and refuses a blank or non-text do', () => {
        const fields = { do: 'x', after: 'y' };
        expect(subtaskAdd({ kind: 'subtask-add', target, fields })?.fields).toBe(fields);
        for (const bad of ['  ', 3]) {
            expect(subtaskAdd({ kind: 'subtask-add', target, fields: { do: bad } })).toBeNull();
        }
    });

    it('answers a reorder its order itself and refuses an empty or non-text item', () => {
        const order: string[] = [];
        expect(reorderWrite({ kind: 'reorder', collection: 'c', order })?.order).toBe(order);
        expect(reorderWrite({ kind: 'reorder', collection: 'c', order: ['a', ''] })).toBeNull();
        expect(reorderWrite({ kind: 'reorder', collection: 'c', order: ['a', 1] })).toBeNull();
    });

    it('reads a feed field value as typeof does: null, text, a boolean and every number', () => {
        const body = { kind: 'feed-field', feed: 'radar', id: 'i', field: 'f' };
        for (const value of [null, 0, NaN, Infinity, -Infinity, false, 'x']) {
            expect(feedFieldWrite({ ...body, value })).toStrictEqual({ ...body, value });
        }
        expect(feedFieldWrite({ ...body, value: {} })).toBeNull();
        expect(feedFieldWrite({ ...body, value: [] })).toBeNull();
        expect(feedFieldWrite(body)).toBeNull();
    });

    it('reads a LinkedIn idea: no category is the empty one, a null one is refused', () => {
        const idea = linkedinIdeaWrite({ kind: 'linkedin-idea', title: 't' });
        expect(idea).toStrictEqual({ kind: 'linkedin-idea', title: 't', category: '' });
        expect(linkedinIdeaWrite({ kind: 'linkedin-idea', title: 't', category: null })).toBeNull();
        expect(linkedinIdeaWrite({ kind: 'linkedin-idea', title: '' })?.title).toBe('');
    });

    it('reads a deck body whose selection is empty and refuses a non-text key', () => {
        const order = ['a', 'b'];
        const selection: string[] = [];
        expect(deckWrite({ kind: 'deck', selection, order })).toStrictEqual({
            kind: 'deck',
            selection: [],
            order: ['a', 'b']
        });
        expect(deckWrite({ kind: 'deck', selection: ['a', 1], order })).toBeNull();
    });

    it('reads a rail body into rows of exactly three keys', () => {
        const row = { label: 'L', glyph: 'g', page: 'p', extra: 1 };
        const write = railWrite({ kind: 'rail', rail: [row] });
        expect(write).toStrictEqual({
            kind: 'rail',
            rail: [{ label: 'L', glyph: 'g', page: 'p' }]
        });
        expect(Object.keys(write?.rail[0] ?? {})).toEqual(['label', 'glyph', 'page']);
        expect(railWrite({ kind: 'rail', rail: [[]] })).toBeNull();
        expect(railWrite({ kind: 'rail', rail: [null] })).toBeNull();
        expect(railWrite({ kind: 'rail', rail: {} })).toBeNull();
        expect(railWrite({ kind: 'rail', rail: [] })).toStrictEqual({ kind: 'rail', rail: [] });
    });

    it('reads a config-key body by an own value key, even an undefined one', () => {
        const body = { kind: 'config-key', file: 'f', key: 'k' };
        expect(configKeyWrite({ ...body, value: undefined })).toStrictEqual({
            ...body,
            value: undefined
        });
        expect(configKeyWrite(body)).toBeNull();
        const inherited = '{"__proto__":{"value":1},"kind":"config-key","file":"f","key":"k"}';
        expect(configKeyWrite(JSON.parse(inherited))).toBeNull();
    });

    it('refuses a kind that sits only under an own __proto__ key, and a body of no map', () => {
        const names = (
            'auditMuteWrite configKeyWrite deckWrite deleteEntryWrite entryWrite feedDeleteWrite ' +
            'feedFieldWrite hostWrite leadAddWrite linkedinIdeaWrite linkedinPostWrite ' +
            'manifestWrite newEntry newIdea railWrite reorderWrite sessionWrite subtaskAdd ' +
            'subtaskWrite undoWrite'
        ).split(' ');
        for (const name of names) {
            const read = (readers as unknown as Record<string, (body: unknown) => unknown>)[name];
            for (const body of [null, [], 'text', 7, JSON.parse('{"__proto__":{"kind":"x"}}')]) {
                expect(read(body)).toBeNull();
            }
        }
    });
});
