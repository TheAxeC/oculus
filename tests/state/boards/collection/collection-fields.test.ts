// Layer 4, test. The readers of state/boards/collection.ts that take a named field of an entry or a
// value of the merged config: the person, the status, the identity, the pin, the paths, the
// subtasks, the metadata rows, the related list and the select choices. Each row is a value of the
// wrong type or shape and the answer the reader gives it, so a change in how a reader tells a good
// value from a bad one shows here.

import { describe, expect, it } from 'vitest';
import {
    applyCollectionFilters,
    crossLinks,
    drawnFields,
    entryStatus,
    entrySubtasks,
    extraRawFields,
    formFields,
    hubPathsOf,
    identityValue,
    isPinned,
    pinnedFirst,
    statusFacets,
    statusValues,
    type Entry,
    type Project,
    type SchemaField
} from '../../../../src/lib/state/boards/collection.ts';

function entry(id: string, fields: Record<string, unknown>, title = id): Entry {
    return { id, title, fields, file: '', index: 0 };
}

function held(id: string, over: Partial<Project> = {}): Project {
    const base = { id, tier: 'active', type: 'active', title: id, chips: [], fundingIds: [] };
    return { ...base, collaborators: [], ...over } as unknown as Project;
}

/** The ids of the projects a cross-link answer holds, group by group. */
function memberIds(groups: ReturnType<typeof crossLinks>): string[][] {
    return groups.map((group) => group.members.map((member) => member.id));
}

describe('the person of a joint-work entry', () => {
    const projects = [
        held('alpha', { collaborators: ['naesens', 'e1'] }),
        held('beta', { collaborators: [''] })
    ];
    const rows: [string, unknown, string[][]][] = [
        ['a name', 'naesens', [['alpha']]],
        ['a number', 3, [['alpha']]],
        ['null', null, [['alpha']]],
        ['true', true, [['alpha']]],
        ['a list', ['naesens'], [['alpha']]],
        ['nothing', undefined, [['alpha']]],
        ['an empty string', '', [['beta']]]
    ];

    it.each(rows)(
        'names the entry by its own id when the person is %s, else by the person',
        (_, person, expected) => {
            const groups = crossLinks(entry('e1', { person }), 'joint-work', projects, []);
            expect(memberIds(groups)).toStrictEqual(expected);
        }
    );
});

describe('the related list of an entry', () => {
    const projects = [held('alpha'), held('beta'), held('1'), held('true')];
    const rows: [string, unknown, string[][]][] = [
        ['one id as a string', 'alpha', [['alpha']]],
        ['a list of ids and a number', ['alpha', 1, 'beta'], [['1', 'alpha', 'beta']]],
        ['a list of one number', [1], [['1']]],
        ['a list holding true', [true], [['true']]],
        ['true', true, [['true']]],
        ['a list holding null and an id', [null, 'alpha'], [['alpha']]],
        ['a list holding a list of one id', [['alpha']], [['alpha']]],
        ['a list holding a list of two ids', [['alpha', 'beta']], []],
        ['a map', { a: 'alpha' }, []],
        ['null', null, []],
        ['a number', 3, []],
        ['an id no project holds', 'nobody', []]
    ];

    it.each(rows)('reads %s', (_, related, expected) => {
        expect(
            memberIds(crossLinks(entry('x', { related }), 'events', projects, []))
        ).toStrictEqual(expected);
    });
});

describe('the status of an entry', () => {
    const rows: [string, unknown, string | undefined][] = [
        ['a word', 'ok', 'ok'],
        ['a padded word', ' x ', ' x '],
        ['an empty string', '', undefined],
        ['a number', 3, undefined],
        ['null', null, undefined],
        ['true', true, undefined],
        ['a list', ['a'], undefined],
        ['nothing', undefined, undefined]
    ];

    it.each(rows)('reads %s', (_, status, expected) => {
        expect(entryStatus(entry('x', { status }))).toBe(expected);
    });

    it('offers, counts and filters only the statuses that are words', () => {
        const entries = [
            entry('a', { status: '' }),
            entry('b', { status: 3 }),
            entry('c', { status: 'x' }),
            entry('d', { status: 'y' }),
            entry('e', { status: 'x' }),
            entry('f', {})
        ];
        const counts = [
            { value: 'x', count: 2 },
            { value: 'y', count: 1 }
        ];
        expect(statusValues(entries)).toStrictEqual(counts);
        expect(statusFacets(entries)).toStrictEqual(counts);
        const ids = (statuses: string[], hidden: string[]) =>
            applyCollectionFilters(entries, { search: '', statuses, hidden }).map((one) => one.id);
        expect(ids(['x'], [])).toStrictEqual(['c', 'e']);
        expect(ids([], ['x', ''])).toStrictEqual(['a', 'b', 'd', 'f']);
    });

    it('searches the words inside a list and a map of the fields, whatever else a field holds', () => {
        const entries = [
            entry('a', { status: 3, k: { z: [1, 'needle'] } }),
            entry('b', { k: null })
        ];
        const found = applyCollectionFilters(entries, {
            search: 'NEEDLE',
            statuses: [],
            hidden: []
        });
        expect(found.map((one) => one.id)).toStrictEqual(['a']);
    });
});

describe('the identity value of an entry', () => {
    const schema: SchemaField[] = [{ field: 'title', type: 'text' }];
    const rows: [string, unknown, string][] = [
        ['a word', 'x', 'x'],
        ['an empty string', '', ''],
        ['a number', 3, '3'],
        ['NaN', NaN, 'NaN'],
        ['Infinity', Infinity, 'Infinity'],
        ['null', null, 'Ti'],
        ['true', true, 'Ti'],
        ['a list', ['a'], 'Ti'],
        ['a map', {}, 'Ti'],
        ['nothing', undefined, 'Ti']
    ];

    it.each(rows)('reads %s', (_, title, expected) => {
        expect(identityValue(entry('id1', { title }, 'Ti'), schema)).toBe(expected);
    });

    it('falls back to the id when the title is empty too', () => {
        expect(identityValue(entry('id1', { title: null }, ''), schema)).toBe('id1');
    });
});

describe('the pin of an entry', () => {
    it('floats an entry only for the boolean true', () => {
        for (const [pin, expected] of [
            [true, true],
            ['true', false],
            [1, false],
            [null, false],
            [false, false],
            [undefined, false]
        ] as const) {
            expect(isPinned(entry('x', { pin }))).toBe(expected);
        }
        const entries = [entry('a', {}), entry('b', { pin: true }), entry('c', { pin: 'true' })];
        expect(pinnedFirst(entries).map((one) => one.id)).toStrictEqual(['b', 'a', 'c']);
    });
});

describe('the paths an entry names', () => {
    it('reads a link, a url and a folder only when each is a string, trimmed and once', () => {
        expect(hubPathsOf({ link: 3, url: ['x'], folder: null })).toStrictEqual([]);
        expect(hubPathsOf({ link: { a: 1 }, url: true, folder: 4 })).toStrictEqual([]);
        expect(hubPathsOf({ link: ' a/b ', url: 'a/b', folder: ' c/d ' })).toStrictEqual([
            'a/b',
            'c/d'
        ]);
        expect(
            hubPathsOf({ link: 'https://x.org', url: '/abs', folder: 'https://y' })
        ).toStrictEqual([]);
    });
});

describe('the subtasks of an entry', () => {
    const subtasksOf = (subtasks: unknown) => entrySubtasks(entry('x', { subtasks }));

    it('reads a list item by item: a string, or a map by its do, deadline, snooze and done', () => {
        const list = [
            'str',
            { do: 'm', deadline: '2026-09-20', done: true },
            { do: 'n', done: 'true' },
            3,
            { do: 3 },
            null,
            ['x'],
            { do: 'o', deadline: 3, snooze: 4 },
            { do: 'p', snooze: true },
            { do: ['a', 'b'], deadline: ['d'] },
            { do: [] },
            { do: [1, true] },
            { do: '  ' },
            '  ',
            { do: { a: 1 } },
            { do: true, deadline: false }
        ];
        expect(subtasksOf(list)).toStrictEqual([
            { key: '0', do: 'str', done: false },
            { key: '1', do: 'm', done: true, deadline: '2026-09-20' },
            { key: '2', do: 'n', done: false },
            { key: '4', do: '3', done: false },
            { key: '7', do: 'o', done: false, deadline: '3', snooze: '4' },
            { key: '8', do: 'p', done: false, snooze: 'true' },
            { key: '9', do: 'a | b', done: false, deadline: 'd' },
            { key: '11', do: '1 | true', done: false },
            { key: '15', do: 'true', done: false, deadline: 'false' }
        ]);
    });

    it('reads a map by its own keys, an own key named __proto__ included', () => {
        const map = {
            one: 'x',
            two: { do: 'y' },
            three: 3,
            four: null,
            five: { do: 4, done: true }
        };
        expect(subtasksOf(map)).toStrictEqual([
            { key: 'one', do: 'x', done: false },
            { key: 'two', do: 'y', done: false },
            { key: 'five', do: '4', done: true }
        ]);
        const proto: unknown = JSON.parse('{"__proto__":{"do":"p"},"a":"b"}');
        expect(subtasksOf(proto)).toStrictEqual([
            { key: '__proto__', do: 'p', done: false },
            { key: 'a', do: 'b', done: false }
        ]);
    });

    it('holds no line for a block that is a string, a number, a boolean, null or absent', () => {
        for (const block of ['x', 3, true, null, undefined]) {
            expect(subtasksOf(block)).toStrictEqual([]);
        }
    });

    it('gives a line the keys it has: deadline and snooze only when they have a line of words', () => {
        const [line] = subtasksOf([{ do: 'a', deadline: '2026-09-20' }]);
        expect(Object.keys(line)).toStrictEqual(['key', 'do', 'done', 'deadline']);
    });
});

describe('the select choices read from the config', () => {
    const choices = (optionsFrom: string | undefined, config: Record<string, unknown>) =>
        formFields([{ field: 'f', type: 'select', optionsFrom }], config)[0].options;

    it('are the strings of a list and the key of each row not marked unassignable', () => {
        const rows = [
            'a',
            { key: 3 },
            { key: 'b', assignable: false },
            { key: 'c' },
            { key: 'd', assignable: 'no' },
            { key: 'e', assignable: true },
            null,
            3,
            [],
            ['x'],
            { key: '' },
            { key: 'f', assignable: null }
        ];
        expect(choices('k', { k: rows })).toStrictEqual(['a', 'c', 'd', 'e', '', 'f']);
    });

    it('are none when the value is no list, absent, or named by an inherited key', () => {
        for (const value of [{ a: 1 }, 'x', 3, null, undefined, true]) {
            expect(choices('k', { k: value })).toStrictEqual([]);
        }
        expect(choices('k', {})).toStrictEqual([]);
        expect(choices('__proto__', { k: ['a'] })).toStrictEqual([]);
    });

    it('read the config under the key the schema names, an own key named __proto__ included', () => {
        const config: unknown = JSON.parse('{"__proto__":["p"]}');
        expect(choices('__proto__', config as Record<string, unknown>)).toStrictEqual(['p']);
        expect(choices(undefined, { '': ['z'] })).toStrictEqual(['z']);
    });

    it('give way to the options the schema lists, an empty list included', () => {
        const schema: SchemaField[] = [
            { field: 'f', type: 'select', optionsFrom: 'k', options: [] }
        ];
        expect(formFields(schema, { k: ['a'] })[0].options).toStrictEqual([]);
    });
});

describe('the map fields an entry carries beyond its schema', () => {
    it('are offered as raw controls only when they are maps the schema does not name', () => {
        const fields = { title: 't', a: { b: 1 }, c: [], d: null, e: 'x', f: {}, g: [1] };
        const schema: SchemaField[] = [{ field: 'f', type: 'raw' }];
        expect(extraRawFields(entry('x', fields), schema).map((one) => one.field)).toStrictEqual([
            'a'
        ]);
    });
});

describe('the fields a card draws, values of the wrong type', () => {
    const drawn = (fields: Record<string, unknown>, schema?: SchemaField[]) =>
        drawnFields(entry('x', fields), schema);
    const meta: SchemaField[] = [{ field: 'meta', type: 'metalist' }];
    const tags: SchemaField[] = [{ field: 'tags', type: 'tags' }];

    it('joins a metadata row by its label and value, whatever the types of the two', () => {
        const rows = [
            3,
            null,
            { label: 3, value: 'v' },
            { label: 'l' },
            { value: 4 },
            {},
            [],
            ['x'],
            { label: 'a', value: 'b' },
            { label: ['a', 'b'], value: true }
        ];
        expect(drawn({ meta: rows }, meta)).toStrictEqual([
            {
                field: 'meta',
                label: 'meta',
                kind: 'meta',
                values: ['3', '3: v', 'l', '4', 'x', 'a: b', 'a | b: true']
            }
        ]);
    });

    it('draws a metadata field that is a string as one chip and one that is a map as its pairs', () => {
        expect(drawn({ meta: 'x' }, meta)[0]).toStrictEqual({
            field: 'meta',
            label: 'meta',
            kind: 'meta',
            values: ['x']
        });
        expect(drawn({ meta: { label: 'l', value: 'v' } }, meta)[0]).toStrictEqual({
            field: 'meta',
            label: 'meta',
            kind: 'pairs',
            values: ['label: l', 'value: v']
        });
    });

    it('draws tags as one chip per word, and a map of tags as one chip per key with words', () => {
        const chips = (value: unknown) => drawn({ tags: value }, tags)[0];
        expect(chips('a').values).toStrictEqual(['a']);
        expect(chips([1, 'a', null, { a: 1 }, ['x', 'y'], true]).values).toStrictEqual([
            '1',
            'a',
            'x | y',
            'true'
        ]);
        expect(chips({ a: 'x', b: ['y', 2], c: { d: 1 }, e: null, f: '' })).toStrictEqual({
            field: 'tags',
            label: 'tags',
            kind: 'pairs',
            values: ['a: x', 'b: y | 2']
        });
    });

    it('draws a field the schema does not name as text, or as pairs when it is a map', () => {
        const fields = {
            a: 3,
            b: NaN,
            c: true,
            d: null,
            e: ['x', ['y']],
            f: { k: 'v', k2: [1, 'z'], k3: {}, k4: null, k5: '' },
            g: '',
            h: [],
            i: [null]
        };
        expect(drawn(fields)).toStrictEqual([
            { field: 'a', label: 'a', kind: 'text', values: ['3'] },
            { field: 'b', label: 'b', kind: 'text', values: ['NaN'] },
            { field: 'c', label: 'c', kind: 'text', values: ['true'] },
            { field: 'e', label: 'e', kind: 'text', values: ['x | y'] },
            { field: 'f', label: 'f', kind: 'pairs', values: ['k: v', 'k2: 1 | z'] }
        ]);
    });

    it('draws the schema fields by name and type whatever type the value has', () => {
        const schema: SchemaField[] = [
            { field: 'sub', type: 'text', label: 'S' },
            { field: 'status', type: 'select' },
            { field: 'tags', type: 'tags' },
            { field: 'note', type: 'textarea' },
            { field: 'link', type: 'text' }
        ];
        const fields = { status: 3, sub: ['a'], tags: 'q', note: 4, link: { u: 'x' } };
        expect(drawn(fields, schema)).toStrictEqual([
            { field: 'sub', label: 'S', kind: 'sub', values: ['a'] },
            { field: 'status', label: 'status', kind: 'status', values: ['3'] },
            { field: 'tags', label: 'tags', kind: 'chips', values: ['q'] },
            { field: 'note', label: 'note', kind: 'body', values: ['4'] },
            { field: 'link', label: 'link', kind: 'pairs', values: ['u: x'] }
        ]);
    });
});
