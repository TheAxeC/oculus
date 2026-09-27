// The pure rules behind the collection view: how a field is drawn, which fields a card draws and in
// what order, what the status facet offers, and what the search and the facet leave. Nothing here
// renders; tests/views/boards/collection/collection.test.ts is the same rules through the markup.

import { describe, expect, it } from 'vitest';
import {
    applyCollectionFilters,
    clearedValue,
    coverage,
    extraRawFields,
    crossLinks,
    drawnFields,
    emptyCollectionState,
    entryStatus,
    entrySubtasks,
    formFields,
    groupProjects,
    hasStatusField,
    hrefOf,
    identityField,
    isHubPath,
    identityValue,
    isPinned,
    kindOf,
    membersByType,
    noFunding,
    parseCollectionState,
    movedOrder,
    pinnedFirst,
    refusedField,
    softwareRows,
    statusFacets,
    statusValues,
    type Entry,
    type Project,
    type SchemaField,
    entryById,
    openSubtaskCount
} from '../../../src/lib/state/boards/collection.ts';
import { parseRawField, rawFieldText } from '../../../src/lib/state/forms/form-values.ts';

const FILE = '/hub/network/events.yml';

function entry(index: number, fields: Record<string, unknown>): Entry {
    const title = typeof fields.title === 'string' ? fields.title : '';
    return { id: title, title, fields, file: FILE, index };
}

const SCHEMA: SchemaField[] = [
    { field: 'title', type: 'text' },
    { field: 'sub', type: 'text', label: 'Subtitle' },
    { field: 'status', type: 'select' },
    { field: 'date', type: 'text' },
    { field: 'meta', type: 'metalist' },
    { field: 'tags', type: 'tags' },
    { field: 'note', type: 'textarea' },
    { field: 'url', type: 'text' }
];

describe('kindOf', () => {
    it('decides by the field name where the hub files agree on one', () => {
        expect(kindOf('sub', 'text')).toBe('sub');
        expect(kindOf('status', 'select')).toBe('status');
        expect(kindOf('related', 'tags')).toBe('chips');
        expect(kindOf('note', 'textarea')).toBe('body');
        expect(kindOf('url', 'text')).toBe('link');
    });

    it('decides by the type otherwise, and draws an unknown type as text', () => {
        expect(kindOf('followup', 'tags')).toBe('chips');
        expect(kindOf('rows', 'metalist')).toBe('meta');
        expect(kindOf('kind', 'text')).toBe('text');
        expect(kindOf('weight', 'slider')).toBe('text');
    });

    it('draws a field whose choices come from the people registry as a person', () => {
        expect(kindOf('person', 'select', 'people')).toBe('person');
        // The rule is the schema's own options_from and not the field's name.
        expect(kindOf('lead', 'select', 'people')).toBe('person');
        expect(kindOf('person', 'select')).toBe('text');
        expect(kindOf('venue_id', 'select', 'venues')).toBe('text');
    });
});

describe('drawnFields, a person field', () => {
    it('carries the person key as its one value, in the schema order', () => {
        const entry = {
            id: 'ecg-paper',
            title: 'The ECG paper',
            fields: { title: 'The ECG paper', person: 'naesens', status: 'active' },
            file: '/hub/network/joint-work.yml',
            index: 0
        };
        const schema = [
            { field: 'title', type: 'text' },
            { field: 'person', type: 'select', optionsFrom: 'people' },
            { field: 'status', type: 'select' }
        ];
        expect(drawnFields(entry, schema).map((one) => [one.field, one.kind, one.values])).toEqual([
            ['person', 'person', ['naesens']],
            ['status', 'status', ['active']]
        ]);
    });
});

describe('raw form fields', () => {
    it('keeps raw in the schema and renders a map as one line of JSON', () => {
        expect(formFields([{ field: 'retrieval', type: 'raw' }])[0].kind).toBe('raw');
        expect(rawFieldText({ method: 'wget', throttle: true })).toBe(
            '{"method":"wget","throttle":true}'
        );
    });

    it('accepts an empty value or a JSON map of scalars', () => {
        expect(parseRawField('')).toEqual({ ok: true, value: null });
        expect(parseRawField('{"method":"wget","tries":2,"ready":true,"token":null}')).toEqual({
            ok: true,
            value: { method: 'wget', tries: 2, ready: true, token: null }
        });
    });

    it('refuses malformed JSON and anything that is not a map', () => {
        expect(parseRawField('{method}')).toEqual({ ok: false });
        expect(parseRawField('["wget"]')).toEqual({ ok: false });
        expect(parseRawField('"wget"')).toEqual({ ok: false });
        expect(parseRawField('7')).toEqual({ ok: false });
    });

    it('takes a block with a list and a nested map, which is what a real one holds', () => {
        const block = {
            method: 'wget',
            priority_first: ['one', 'two'],
            auth: { kind: 'token', required: true, note: null },
            mirrors: [{ host: 'a', port: 21 }]
        };
        const text = rawFieldText(block);
        expect(text).toBe(JSON.stringify(block));
        expect(parseRawField(text)).toEqual({ ok: true, value: block });
    });
});

describe('drawnFields', () => {
    const one = entry(0, {
        title: 'A talk',
        sub: 'the subtitle',
        status: 'upcoming',
        meta: [{ label: 'Where', value: 'Enschede' }],
        tags: ['core-ml', 'conference'],
        note: 'one line',
        role: 'attend'
    });

    it('draws the schema fields in the schema order, then the ones it does not name', () => {
        expect(drawnFields(one, SCHEMA).map((drawn) => drawn.field)).toEqual([
            'sub',
            'status',
            'meta',
            'tags',
            'note',
            'role'
        ]);
    });

    it('leaves the title to the card and skips a field the entry does not carry', () => {
        const fields = drawnFields(one, SCHEMA).map((drawn) => drawn.field);
        expect(fields).not.toContain('title');
        expect(fields).not.toContain('date');
        expect(fields).not.toContain('url');
    });

    it("takes the file's own words for a field when the schema gives it some", () => {
        const drawn = drawnFields(one, SCHEMA).find((found) => found.field === 'sub');
        expect(drawn?.label).toBe('Subtitle');
        expect(drawn?.values).toEqual(['the subtitle']);
    });

    it('joins each metalist pair into one chip and keeps each tag as its own', () => {
        const found = drawnFields(one, SCHEMA);
        expect(found.find((drawn) => drawn.field === 'meta')?.values).toEqual(['Where: Enschede']);
        expect(found.find((drawn) => drawn.field === 'tags')?.values).toEqual([
            'core-ml',
            'conference'
        ]);
    });

    it('draws every field as text when the file has no schema at all', () => {
        const found = drawnFields(one, undefined);
        // The metalist is the one field that goes: without the schema's word for its type it is a
        // list of maps, and a map has no line of words to draw as text.
        expect(found.map((drawn) => drawn.field)).toEqual([
            'sub',
            'status',
            'tags',
            'note',
            'role'
        ]);
        expect(new Set(found.map((drawn) => drawn.kind))).toEqual(new Set(['text']));
    });

    it('draws a map field as one chip per key, since a map has no line of its own', () => {
        const odd = entry(1, { title: 'Odd', kind: { nested: 'map', empty: {} } });
        expect(drawnFields(odd, SCHEMA)).toEqual([
            { field: 'kind', label: 'kind', kind: 'pairs', values: ['nested: map'] }
        ]);
    });
});

describe('the status facet', () => {
    const entries = [
        entry(0, { title: 'One', status: 'upcoming' }),
        entry(1, { title: 'Two', status: 'completed' }),
        entry(2, { title: 'Three', status: 'upcoming' })
    ];

    it('is only offered where the schema names a status field', () => {
        expect(hasStatusField(SCHEMA)).toBe(true);
        expect(hasStatusField([{ field: 'title', type: 'text' }])).toBe(false);
        expect(hasStatusField(undefined)).toBe(false);
    });

    it('counts each value, in the order the entries first carry it', () => {
        expect(statusValues(entries)).toEqual([
            { value: 'upcoming', count: 2 },
            { value: 'completed', count: 1 }
        ]);
    });

    it('offers nothing where one value or none occurs, since it would split nothing', () => {
        expect(statusValues([entries[0], entries[2]])).toEqual([]);
        expect(statusValues([entry(0, { title: 'None' })])).toEqual([]);
    });

    it("reads an entry's status only when it is a word", () => {
        expect(entryStatus(entries[0])).toBe('upcoming');
        expect(entryStatus(entry(0, { title: 'None', status: 7 }))).toBe(undefined);
    });
});

describe('applyCollectionFilters', () => {
    const entries = [
        entry(0, {
            title: 'A talk',
            status: 'upcoming',
            meta: [{ label: 'Where', value: 'Enschede' }]
        }),
        entry(1, { title: 'A visit', status: 'completed', tags: ['travel'] })
    ];

    it('shows everything an untouched instance holds', () => {
        expect(applyCollectionFilters(entries, emptyCollectionState())).toEqual(entries);
    });

    it('keeps the entries of every selected status and no other', () => {
        const found = applyCollectionFilters(entries, {
            search: '',
            statuses: ['completed'],
            hidden: []
        });
        expect(found.map((held) => held.title)).toEqual(['A visit']);
    });

    it('searches inside a list and inside a map, not only the top-level words', () => {
        const state = { search: 'enschede', statuses: [], hidden: [] };
        expect(applyCollectionFilters(entries, state).map((held) => held.title)).toEqual([
            'A talk'
        ]);
        expect(
            applyCollectionFilters(entries, { search: 'travel', statuses: [], hidden: [] }).map(
                (held) => held.title
            )
        ).toEqual(['A visit']);
    });
});

describe('parseCollectionState', () => {
    it('keeps what it is given and replaces what it is not', () => {
        expect(
            parseCollectionState({
                search: 'talk',
                statuses: ['upcoming', 7],
                hidden: ['completed']
            })
        ).toEqual({
            search: 'talk',
            statuses: ['upcoming'],
            hidden: ['completed'],
            more: [],
            adding: false,
            editing: ''
        });
    });

    it('keeps which entries draw their long text whole, and drops an id that is not a string', () => {
        expect(parseCollectionState({ more: ['A talk', 7] }).more).toEqual(['A talk']);
        expect(parseCollectionState({ more: 'A talk' }).more).toEqual([]);
    });

    it('keeps which entry forms are open, and none for a record that names them wrongly', () => {
        expect(parseCollectionState({ adding: true, editing: 'A talk' })).toMatchObject({
            adding: true,
            editing: 'A talk'
        });
        expect(parseCollectionState({ adding: 'yes', editing: 7 })).toMatchObject({
            adding: false,
            editing: ''
        });
    });

    it('falls back to the empty state for anything that is not a map', () => {
        expect(parseCollectionState(undefined)).toEqual(emptyCollectionState());
        expect(parseCollectionState(['talk'])).toEqual(emptyCollectionState());
        expect(parseCollectionState({ search: 7 })).toEqual(emptyCollectionState());
    });
});

describe('isHubPath', () => {
    it('is a path inside the hub for exactly the values hrefOf serves through the hub root', () => {
        const values = [
            'network/a-talk/report.docx',
            'report.docx',
            'https://example.org/report.docx',
            'mailto:someone@example.org',
            '/api/file/cathedra/manual.html',
            ''
        ];
        expect(values.filter((one) => isHubPath(one))).toEqual([
            'network/a-talk/report.docx',
            'report.docx'
        ]);
        for (const one of values.filter((value) => value !== '')) {
            expect(isHubPath(one), one).toBe(hrefOf(one).startsWith('/api/file/hub/'));
        }
    });

    // Revert: drop the `!HOSTED.test(value)` term from isHubPath of data/hub-address.ts, or the
    // HOSTED branch from hrefOf of state/boards/collection.ts; either one turns this red.
    it('reads a host as a web address, and a first segment that merely holds a dot as a path', () => {
        const addresses = [
            'github.com/TheAxeC/x',
            'www.example.org',
            'example.co.uk/a/b',
            'localhost:8790/x'
        ];
        const paths = [
            'README.md',
            'notes.v2/plan.md',
            'projects/active/x',
            'funding/2026-nwo-enw-xs/call.pdf'
        ];
        for (const one of addresses) expect(isHubPath(one), one).toBe(false);
        for (const one of paths) expect(isHubPath(one), one).toBe(true);
        for (const one of [...addresses, ...paths]) {
            expect(isHubPath(one), one).toBe(hrefOf(one).startsWith('/api/file/hub/'));
        }
    });
});

describe('hrefOf', () => {
    it('keeps an address that has a scheme or starts at the root', () => {
        expect(hrefOf('https://example.org/a')).toBe('https://example.org/a');
        expect(hrefOf('mailto:someone@example.org')).toBe('mailto:someone@example.org');
        expect(hrefOf('/api/file/cathedra/docs/user/manual.html')).toBe(
            '/api/file/cathedra/docs/user/manual.html'
        );
    });

    it('serves a path inside the hub through the hub root, one segment escaped at a time', () => {
        expect(hrefOf('network/fllm-2025/deck.html')).toBe(
            '/api/file/hub/network/fllm-2025/deck.html'
        );
        expect(hrefOf('education/a course/notes.pdf')).toBe(
            '/api/file/hub/education/a%20course/notes.pdf'
        );
    });

    // Revert: drop the `(:[0-9]+)?` group from HOSTED in data/hub-address.ts. A host whose
    // characters all fit a scheme is taken by ADDRESSED before HOSTED is reached; one carrying an
    // underscore is not, so the port is the group's work.
    it('reads a host carrying a port as an address when the host is no scheme', () => {
        expect(isHubPath('my_host.com:8080/x')).toBe(false);
        expect(hrefOf('my_host.com:8080/x')).toBe('https://my_host.com:8080/x');
    });

    // Revert: drop the HOSTED branch from hrefOf of state/boards/collection.ts.
    it('puts https in front of a web address written without a scheme', () => {
        expect(hrefOf('github.com/x')).toBe('https://github.com/x');
        expect(hrefOf('www.example.org')).toBe('https://www.example.org');
        expect(hrefOf('projects/active/x/README.md')).toBe(
            '/api/file/hub/projects/active/x/README.md'
        );
        expect(hrefOf('https://x.y')).toBe('https://x.y');
        expect(hrefOf('/absolute')).toBe('/absolute');
    });
});

describe('identityValue', () => {
    it("reads the schema's first field, which is what a write addresses the entry by", () => {
        const scheme = entry(0, { title: 'A scheme', key: 'FAIR' });
        expect(identityValue(scheme, SCHEMA)).toBe('A scheme');
        expect(identityValue(scheme, [{ field: 'key', type: 'text' }])).toBe('FAIR');
        expect(identityField(undefined)).toBe('title');
    });

    it('falls back to the title when the entry does not carry the identity field', () => {
        expect(identityValue(entry(0, { title: 'A talk' }), [{ field: 'key', type: 'text' }])).toBe(
            'A talk'
        );
    });
});

describe('pinnedFirst', () => {
    const entries = [
        entry(0, { title: 'One' }),
        entry(1, { title: 'Two', pin: true }),
        entry(2, { title: 'Three' }),
        entry(3, { title: 'Four', pin: true })
    ];

    it('floats every pinned entry, keeping file order inside both halves', () => {
        expect(pinnedFirst(entries).map((held) => held.title)).toEqual([
            'Two',
            'Four',
            'One',
            'Three'
        ]);
        expect(isPinned(entries[1])).toBe(true);
        expect(isPinned(entries[0])).toBe(false);
    });

    it('reorders over the file order, so a move made while an entry is pinned keeps the file', () => {
        const order = entries.map((held) => held.title);
        const drawn = pinnedFirst(entries).map((held) => held.title);
        expect(order).not.toEqual(drawn);
        expect(movedOrder(order, order.indexOf('Three'), order.indexOf('One'))).toEqual([
            'Three',
            'One',
            'Two',
            'Four'
        ]);
    });

    it('carries one entry one place, which is what the keyboard reorder asks for', () => {
        expect(movedOrder(['a', 'b', 'c'], 1, 0)).toEqual(['b', 'a', 'c']);
        expect(movedOrder(['a', 'b', 'c'], 1, 2)).toEqual(['a', 'c', 'b']);
    });

    it('moves nothing off either end, and nothing onto its own place', () => {
        expect(movedOrder(['a', 'b', 'c'], 0, -1)).toBe(null);
        expect(movedOrder(['a', 'b', 'c'], 2, 3)).toBe(null);
        expect(movedOrder(['a', 'b', 'c'], 1, 1)).toBe(null);
        expect(movedOrder(['a', 'b', 'c'], -1, 1)).toBe(null);
    });
});

describe('statusFacets', () => {
    it('counts every status in the order it first occurs, one value included', () => {
        const entries = [
            entry(0, { title: 'One', status: 'todo' }),
            entry(1, { title: 'Two', status: 'done' }),
            entry(2, { title: 'Three', status: 'todo' })
        ];
        expect(statusFacets(entries)).toEqual([
            { value: 'todo', count: 2 },
            { value: 'done', count: 1 }
        ]);
        expect(statusFacets([entry(0, { title: 'One', status: 'todo' })])).toEqual([
            { value: 'todo', count: 1 }
        ]);
    });

    it('hides the entries of a status the facet bar has switched off', () => {
        const entries = [
            entry(0, { title: 'One', status: 'todo' }),
            entry(1, { title: 'Two', status: 'done' })
        ];
        const state = { search: '', statuses: [], hidden: ['done'] };
        expect(applyCollectionFilters(entries, state).map((held) => held.title)).toEqual(['One']);
    });
});

describe('entrySubtasks', () => {
    it('reads a list of flow maps, keyed by position, and drops a line with no do', () => {
        const held = entry(0, {
            title: 'A task',
            subtasks: [
                { do: 'read it', deadline: '2026-10-01' },
                { do: 'write it', done: true, snooze: '2026-11-01' },
                { note: 'no do line' },
                'a bare line'
            ]
        });
        expect(entrySubtasks(held)).toEqual([
            { key: '0', do: 'read it', done: false, deadline: '2026-10-01' },
            { key: '1', do: 'write it', done: true, snooze: '2026-11-01' },
            { key: '3', do: 'a bare line', done: false }
        ]);
    });

    it('reads a map of keys by its own keys, and an entry with no block as nothing', () => {
        const held = entry(0, { title: 'A task', subtasks: { one: { do: 'read it' } } });
        expect(entrySubtasks(held)).toEqual([{ key: 'one', do: 'read it', done: false }]);
        expect(entrySubtasks(entry(1, { title: 'Another' }))).toEqual([]);
    });
});

/** Projects as the snapshot holds them, with only the fields the joins below read. */
function project(id: string, over: Partial<Project> = {}): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        title: id,
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...over
    };
}

describe('groupProjects', () => {
    it('uses only the supplied dead-outcome vocabulary', () => {
        const projects = [
            project('a', { tier: 'archive', type: 'dropped' }),
            project('b', { tier: 'archive', type: 'custom-paused' })
        ];
        expect(
            groupProjects(projects, ['custom-paused'])[0].members.map((member) => member.id)
        ).toEqual(['a']);
        expect(groupProjects(projects, ['dropped'])[0].members.map((member) => member.id)).toEqual([
            'b'
        ]);
    });

    it('forms work, published and ideas groups, keeps member types and warns for blocked work', () => {
        const groups = groupProjects(
            [
                project('a', {
                    type: 'active',
                    short: '',
                    title: 'Full title',
                    chips: ['blocked']
                }),
                project('b', { tier: 'archive', type: 'published', short: 'B', title: 'Bee' }),
                project('c', { tier: 'ideas', type: 'idea', title: 'Idea' }),
                project('d', { tier: 'archive', type: 'dropped', title: 'Dropped' })
            ],
            ['dropped']
        );
        expect(groups).toEqual([
            {
                type: 'work',
                count: 1,
                members: [{ id: 'a', label: 'Full title', type: 'active' }],
                warn: true
            },
            {
                type: 'published',
                count: 1,
                members: [{ id: 'b', label: 'B', type: 'published' }],
                warn: false
            },
            {
                type: 'ideas',
                count: 1,
                members: [{ id: 'c', label: 'Idea', type: 'idea' }],
                warn: false
            }
        ]);
    });
});

describe('crossLinks', () => {
    const projects = [
        project('alpha', { type: 'active', short: 'Alpha', fundingIds: ['FAIR'] }),
        project('beta', { type: 'manuscript', fundingIds: ['FAIR'] }),
        project('gamma', { type: 'active', collaborators: ['naesens'] })
    ];

    it("groups the projects a funding scheme's key names, by type with a count", () => {
        const scheme = entry(0, { title: 'FAIR' });
        expect(crossLinks({ ...scheme, id: 'FAIR' }, 'funding', projects, [])).toEqual([
            {
                type: 'work',
                count: 2,
                members: [
                    { id: 'alpha', label: 'Alpha', type: 'active' },
                    { id: 'beta', label: 'beta', type: 'manuscript' }
                ],
                warn: false
            }
        ]);
    });

    it("groups the projects a joint-work entry's person names", () => {
        const who = entry(0, { title: 'A shared paper', person: 'naesens' });
        expect(crossLinks({ ...who, id: 'naesens-paper' }, 'joint-work', projects, [])).toEqual([
            {
                type: 'work',
                count: 1,
                members: [{ id: 'gamma', label: 'gamma', type: 'active' }],
                warn: false
            }
        ]);
    });

    it("reads the entry's own related list for every other collection, and skips a dead id", () => {
        const talk = entry(0, { title: 'A talk', related: ['alpha', 'nobody'] });
        expect(crossLinks(talk, 'events', projects, [])).toEqual([
            {
                type: 'work',
                count: 1,
                members: [{ id: 'alpha', label: 'Alpha', type: 'active' }],
                warn: false
            }
        ]);
    });
});

describe('formFields', () => {
    it("draws one control per schema field, in the file's order, by the file's own type", () => {
        expect(formFields(SCHEMA).map((field) => [field.field, field.kind])).toEqual([
            ['title', 'text'],
            ['sub', 'text'],
            ['status', 'select'],
            ['date', 'text'],
            ['meta', 'metalist'],
            ['tags', 'tags'],
            ['note', 'textarea'],
            ['url', 'text']
        ]);
        expect(formFields(undefined)).toEqual([]);
    });

    it('carries the label, the options, the help and required, and draws a type it knows not as text', () => {
        const schema: SchemaField[] = [
            {
                field: 'status',
                type: 'select',
                label: 'State',
                options: ['todo', 'done'],
                required: true,
                help: 'what it is now'
            },
            { field: 'weight', type: 'slider' }
        ];
        expect(formFields(schema)).toEqual([
            {
                field: 'status',
                label: 'State',
                kind: 'select',
                options: ['todo', 'done'],
                required: true,
                help: 'what it is now'
            },
            { field: 'weight', label: 'weight', kind: 'text', options: [], required: false }
        ]);
    });

    it('resolves optionsFrom over a list of strings when inline options are absent', () => {
        const schema: SchemaField[] = [
            { field: 'category', type: 'select', optionsFrom: 'venue_categories' }
        ];
        expect(
            formFields(schema, { venue_categories: ['journal', 'conference'] })[0].options
        ).toEqual(['journal', 'conference']);
    });

    it('resolves optionsFrom over keyed maps and leaves out unassignable rows', () => {
        const schema: SchemaField[] = [
            { field: 'tier', type: 'select', optionsFrom: 'venue_tiers' },
            { field: 'fixed', type: 'select', options: ['own'], optionsFrom: 'venue_tiers' }
        ];
        const config = {
            venue_tiers: [
                { key: 'flagship', label: 'flagship' },
                { key: 'unrated', assignable: false },
                { label: 'missing key' }
            ]
        };
        expect(formFields(schema, config).map((field) => field.options)).toEqual([
            ['flagship'],
            ['own']
        ]);
    });
});

describe('noFunding and coverage', () => {
    const projects = [
        project('alpha', { type: 'active', fundingIds: ['FAIR'] }),
        project('beta', { type: 'manuscript' }),
        project('gamma', { type: 'active', fundingIds: ['gone'] }),
        project('delta', { type: 'idea' }),
        project('epsilon', { type: 'archive' })
    ];

    it('counts the live projects no scheme of the file covers', () => {
        expect(noFunding(projects, ['FAIR']).map((held) => held.id)).toEqual(['beta', 'gamma']);
    });

    it('groups the projects by what their manifest says about their code', () => {
        const held = [
            project('one', { type: 'active', codeAvailability: { status: 'deposited' } }),
            project('two', { type: 'manuscript', codeAvailability: { status: 'review-anon' } }),
            project('three', { type: 'active', codeAvailability: { status: 'none' } }),
            project('four', { type: 'active' }),
            project('five', { type: 'idea' })
        ];
        expect(coverage(held).map((group) => [group.group, group.count])).toEqual([
            ['deposited', 1],
            ['review-anon', 1],
            ['none', 2]
        ]);
        expect(coverage(held)[0].members).toEqual([{ id: 'one', label: 'one' }]);
    });

    it('leaves an archived project of a dead type out of the coverage entirely', () => {
        const held = [
            project('one', { type: 'active', codeAvailability: { status: 'deposited' } }),
            project('dead', { tier: 'archive', type: 'no-go' }),
            project('kept', { tier: 'archive', type: 'published' })
        ];
        expect(coverage(held, ['no-go']).map((group) => [group.group, group.count])).toEqual([
            ['deposited', 1],
            ['review-anon', 0],
            ['none', 1]
        ]);
        expect(coverage(held, []).map((group) => group.count)).toEqual([1, 0, 2]);
    });
});

describe('softwareRows', () => {
    const tools = [
        project('zeta-kit', {
            tier: 'software',
            type: 'software',
            title: 'Zeta kit',
            codeAvailability: { status: 'deposited' },
            relatedIds: ['paper', 'gone']
        }),
        project('alpha-kit', {
            tier: 'software',
            type: 'software',
            title: 'Alpha kit',
            relatedIds: []
        }),
        project('paper', { type: 'manuscript', short: 'Paper', title: 'The long paper title' }),
        project('idea', { type: 'idea' })
    ];

    it('lists the software tier by title, with its deposit state and the papers it names', () => {
        expect(softwareRows(tools)).toEqual([
            { id: 'alpha-kit', label: 'Alpha kit', type: 'software', code: '', papers: [] },
            {
                id: 'zeta-kit',
                label: 'Zeta kit',
                type: 'software',
                code: 'deposited',
                papers: [{ id: 'paper', label: 'Paper' }]
            }
        ]);
    });

    it('lists no project of another tier, and nothing at all for a hub with no software', () => {
        expect(softwareRows([project('one', { type: 'active', relatedIds: ['paper'] })])).toEqual(
            []
        );
        expect(softwareRows([])).toEqual([]);
    });
});

describe('the fields a form offers and what it refuses', () => {
    const schema: SchemaField[] = [
        { field: 'title', type: 'text' },
        { field: 'status', type: 'select', options: ['open', 'done'] },
        { field: 'date', type: 'date' }
    ];

    it('offers a map field the schema does not name as a raw block, so a nested one is editable', () => {
        const held = entry(1, {
            title: 'Set',
            retrieval: { method: 'wget', notes: 'a note' },
            size: '2 GB'
        });
        expect(extraRawFields(held, schema).map((field) => [field.field, field.kind])).toEqual([
            ['retrieval', 'raw']
        ]);
    });

    it('offers nothing for a form that adds an entry, there being no nested block yet', () => {
        expect(extraRawFields(null, schema)).toEqual([]);
    });

    it('writes the empty string for a control the reader cleared, and nothing for an untouched one', () => {
        expect(clearedValue(true, true)).toBe('');
        expect(clearedValue(false, true)).toBe(null);
        expect(clearedValue(true, false)).toBe(null);
        expect(clearedValue(false, false)).toBe(null);
    });

    it('names the first control whose value does not fit its own kind', () => {
        const fields = formFields(schema);
        expect(refusedField(fields, () => '')).toBe(null);
        expect(refusedField(fields, (field) => (field === 'status' ? 'open' : '2026-09-14'))).toBe(
            null
        );
        expect(refusedField(fields, (field) => (field === 'status' ? 'invented' : ''))).toBe(
            'status'
        );
        expect(refusedField(fields, (field) => (field === 'date' ? 'last week' : ''))).toBe('date');
    });

    /**
     * One line per kind, on whether the control can hand the form a value that does not fit it.
     * `text` and `textarea`: any string fits, so nothing is refusable. `select`: the control offers
     * the schema's options, but a file whose options list changed under a saved draft can still
     * carry a word that is not one, so a word off the list is refused. `date`: the box takes typed
     * text on a browser with no date picker, so anything that is not an ISO day is refused.
     * `checkbox`: the form writes `true` or nothing for it (EntryForm's saveable), so a value that
     * is not a boolean cannot arise and there is nothing to refuse. `tags`, `metalist` and `raw`
     * are not single-value controls: the form builds their shape itself, and `raw` has its own
     * refusal in parseRawField.
     */
    it('refuses nothing for a kind whose control cannot produce a value that does not fit', () => {
        const kinds: SchemaField[] = [
            { field: 'title', type: 'text' },
            { field: 'note', type: 'textarea' },
            { field: 'done', type: 'checkbox' }
        ];
        const fields = formFields(kinds);
        expect(refusedField(fields, () => 'anything at all')).toBe(null);
        expect(refusedField(fields, (field) => (field === 'done' ? true : ''))).toBe(null);
        expect(refusedField(fields, (field) => (field === 'done' ? null : ''))).toBe(null);
    });
});

describe('the members of one cross-link group', () => {
    // revert: src/lib/state/boards/collection.ts "if (found === undefined) held.set(member.type, [member]);" => if (found === undefined || found !== undefined) held.set(member.type, [member]);
    it('nest under their own project type, one row per type, in the members own order', () => {
        expect(
            membersByType({
                type: 'work',
                count: 3,
                members: [
                    { id: 'a', label: 'A', type: 'active' },
                    { id: 'b', label: 'B', type: 'manuscript' },
                    { id: 'c', label: 'C', type: 'active' }
                ],
                warn: false
            })
        ).toEqual([
            {
                type: 'active',
                members: [
                    { id: 'a', label: 'A', type: 'active' },
                    { id: 'c', label: 'C', type: 'active' }
                ]
            },
            { type: 'manuscript', members: [{ id: 'b', label: 'B', type: 'manuscript' }] }
        ]);
    });

    // revert: src/lib/state/boards/collection.ts "if (found === undefined) held.set(member.type, [member]);" => if (found === undefined) held.set(`${member.type}${held.size}`, [member]);
    it('is one row for a group whose members are all of one type', () => {
        const group = {
            type: 'work' as const,
            count: 1,
            members: [{ id: 'alpha', label: 'ALPHA', type: 'active' }],
            warn: true
        };
        expect(membersByType(group).map((kind) => kind.type)).toEqual(['active']);
    });
});

describe('an entry and the subtasks of a collection', () => {
    // revert: src/lib/state/boards/collection.ts "return collection?.entries.find((entry) => entry.id === id) ?? null;" => return collection?.entries[0] ?? null;
    it('find an entry by its id, and nothing for an id or a collection that is not there', () => {
        const entries = [{ id: 'a' }, { id: 'b' }] as Entry[];
        expect(entryById({ entries }, 'b')).toBe(entries[1]);
        expect(entryById({ entries }, 'c')).toBeNull();
        expect(entryById(null, 'a')).toBeNull();
    });

    // revert: src/lib/state/boards/collection.ts "return subtasks.filter((one) => !one.done).length;" => return subtasks.length;
    it('count the subtasks not done yet', () => {
        expect(openSubtaskCount([{ done: true }, { done: false }, { done: false }])).toBe(2);
        expect(openSubtaskCount([])).toBe(0);
    });
});
