// The pure rules behind the collection view: how a field is drawn, which fields a card draws and in
// what order, what the status facet offers, and what the search and the facet leave. Nothing here
// renders; tests/views/collection.test.ts is the same rules through the markup.

import { describe, expect, it } from 'vitest';
import {
    applyCollectionFilters,
    drawnFields,
    emptyCollectionState,
    entryStatus,
    hasStatusField,
    hrefOf,
    kindOf,
    parseCollectionState,
    statusValues,
    type Entry,
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
        const found = applyCollectionFilters(entries, { search: '', statuses: ['completed'] });
        expect(found.map((held) => held.title)).toEqual(['A visit']);
    });

    it('searches inside a list and inside a map, not only the top-level words', () => {
        const state = { search: 'enschede', statuses: [] };
        expect(applyCollectionFilters(entries, state).map((held) => held.title)).toEqual([
            'A talk'
        ]);
        expect(
            applyCollectionFilters(entries, { search: 'travel', statuses: [] }).map(
                (held) => held.title
            )
        ).toEqual(['A visit']);
    });
});

describe('parseCollectionState', () => {
    it('keeps what it is given and replaces what it is not', () => {
        expect(parseCollectionState({ search: 'talk', statuses: ['upcoming', 7] })).toEqual({
            search: 'talk',
            statuses: ['upcoming']
        });
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
