// The pure rules behind the collection view: how a field is drawn, which fields a card draws and in
// what order, what the status facet offers, and what the search and the facet leave. Nothing here
// renders; tests/views/collection.test.ts is the same rules through the markup.

import { describe, expect, it } from 'vitest';
import {
    applyCollectionFilters,
    coverage,
    crossLinks,
    drawnFields,
    emptyCollectionState,
    entryStatus,
    entrySubtasks,
    formFields,
    hasStatusField,
    hrefOf,
    identityField,
    identityValue,
    inlineMarkdown,
    isPinned,
    kindOf,
    noFunding,
    parseCollectionState,
    pinnedFirst,
    statusFacets,
    statusValues,
    type Entry,
    type Project,
    type SchemaField
} from '../../src/lib/state/collection.ts';

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

    it('draws nothing for a field whose value is a map, having no words for it', () => {
        const odd = entry(1, { title: 'Odd', kind: { nested: 'map' } });
        expect(drawnFields(odd, SCHEMA)).toEqual([]);
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
        ).toEqual({ search: 'talk', statuses: ['upcoming'], hidden: ['completed'] });
    });

    it('falls back to the empty state for anything that is not a map', () => {
        expect(parseCollectionState(undefined)).toEqual(emptyCollectionState());
        expect(parseCollectionState(['talk'])).toEqual(emptyCollectionState());
        expect(parseCollectionState({ search: 7 })).toEqual(emptyCollectionState());
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
        programIds: [],
        domainIds: [],
        collaborators: [],
        docs: [],
        folder: `projects/active/${id}`,
        file: `/hub/projects/active/${id}/project.yml`,
        ...over
    };
}

describe('crossLinks', () => {
    const projects = [
        project('alpha', { type: 'active', short: 'Alpha', fundingIds: ['FAIR'] }),
        project('beta', { type: 'manuscript', fundingIds: ['FAIR'] }),
        project('gamma', { type: 'active', collaborators: ['naesens'] })
    ];

    it("groups the projects a funding scheme's key names, by type with a count", () => {
        const scheme = entry(0, { title: 'FAIR' });
        expect(crossLinks({ ...scheme, id: 'FAIR' }, 'funding', projects)).toEqual([
            { type: 'active', count: 1, members: [{ id: 'alpha', label: 'Alpha' }] },
            { type: 'manuscript', count: 1, members: [{ id: 'beta', label: 'beta' }] }
        ]);
    });

    it("groups the projects a collaborator's key names", () => {
        const who = entry(0, { title: 'Naesens' });
        expect(crossLinks({ ...who, id: 'naesens' }, 'collaborations', projects)).toEqual([
            { type: 'active', count: 1, members: [{ id: 'gamma', label: 'gamma' }] }
        ]);
    });

    it("reads the entry's own related list for every other collection, and skips a dead id", () => {
        const talk = entry(0, { title: 'A talk', related: ['alpha', 'nobody'] });
        expect(crossLinks(talk, 'events', projects)).toEqual([
            { type: 'active', count: 1, members: [{ id: 'alpha', label: 'Alpha' }] }
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
});

describe('inlineMarkdown', () => {
    it('renders one line of Markdown, leaving plain words alone', () => {
        expect(inlineMarkdown('what it **is**')).toBe('what it <strong>is</strong>');
        expect(inlineMarkdown('plain words')).toBe('plain words');
    });
});
