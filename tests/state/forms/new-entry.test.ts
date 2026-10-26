// Layer 2, client-state tests. What a new entry is made of: the fields the Add box asks, the hub a
// task or a person is added to (the one chosen, else the one hub that could take it, else the
// primary when it holds the collection, else none, said by asking which), the task `:task-add`
// makes of a title, and what `addTask` says when the title, the key, the collection or the write
// refuses. The write is a stub that records the call. Each tasks collection carries its hub's name,
// `research` unless another is given.

import { describe, expect, it } from 'vitest';
import type { Collection, Entry, SchemaField } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { addPerson, addTask, askFields } from '../../../src/lib/state/forms/new-entry.ts';
import type { WriteAnswer } from '../../../src/lib/state/shared/stores/shapes.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';

/** The config oculus ships, whose `statuses` give a new task its status. */
const ENGINE = loadConfig(engineDir()).config;

setCatalog(textCatalog(ENGINE));

const TASK_SCHEMA: SchemaField[] = [
    { field: 'key', type: 'text', primary_key: true },
    { field: 'title', type: 'text', display: 1 },
    { field: 'status', type: 'select' }
];

function entry(key: string, root: string): Entry {
    return {
        id: `${root}:${key}`,
        title: key,
        fields: { key },
        file: '/hub/.oculus/data/academic/tasks.yml',
        index: 0,
        root
    };
}

function tasks(keys: string[], root = 'research'): Collection {
    return {
        id: 'tasks',
        title: 'Tasks',
        file: '/hub/.oculus/data/academic/tasks.yml',
        schema: TASK_SCHEMA,
        primary_key: 'key',
        entries: keys.map((one) => entry(one, root)),
        root
    };
}

const VENUE_SCHEMA: SchemaField[] = [
    { field: 'id', type: 'text', primary_key: true },
    { field: 'short', type: 'text', display: 1 },
    { field: 'name', type: 'text', display: 2, required: true },
    { field: 'tier', type: 'select' }
];

describe('askFields', () => {
    it.each([
        ['the primary key of a collection keyed by key', TASK_SCHEMA, 'key', ['key']],
        ['the primary key of venues and their required name', VENUE_SCHEMA, 'id', ['id', 'name']],
        ['the key a file with no schema names', undefined, 'title', ['title']],
        ['only the required fields of a file with no primary key', VENUE_SCHEMA, null, ['name']]
    ])('asks %s (G8)', (_name, schema, primaryKey, fields) => {
        expect(askFields(schema, primaryKey).map((one) => one.field)).toEqual(fields);
    });
});

/** The fields `addTask` hands the write for a title, or the sentence it says instead. */
async function made(
    title: string,
    collections: Collection[],
    primary: string | null = null
): Promise<Record<string, unknown> | string> {
    const written: Record<string, unknown>[] = [];
    const added = await addTask(title, collections, primary, ENGINE, (_collection, one) => {
        written.push(one);
        return Promise.resolve({ ok: true, changed: [], refused: [], id: String(one.key) });
    });
    return written.at(0) ?? added.said;
}

describe('the hub a task is added to', () => {
    const own = tasks([], 'research');
    const other = tasks(['review'], 'second');

    /** The hub the write is given for a title and the key it makes, or the sentence said. */
    async function addedTo(
        collections: Collection[],
        primary: string | null,
        hub?: string
    ): Promise<{ root: string; key: unknown } | string> {
        const written: { root: string; key: unknown }[] = [];
        const added = await addTask(
            'Review',
            collections,
            primary,
            ENGINE,
            (_collection, one, root) => {
                written.push({ root, key: one.key });
                return Promise.resolve({ ok: true, changed: [], refused: [], id: String(one.key) });
            },
            hub
        );
        return written.at(0) ?? added.said;
    }

    it.each([
        [
            'the primary hub when there is one',
            [other, own],
            'research',
            undefined,
            'research',
            'review'
        ],
        [
            'the one hub holding tasks when the primary holds none',
            [other],
            'research',
            undefined,
            'second',
            'review-2'
        ],
        [
            'the hub chosen, the primary not',
            [other, own],
            'research',
            'second',
            'second',
            'review-2'
        ]
    ])('is %s', async (_name, collections, primary, hub, root, key) => {
        expect(await addedTo(collections, primary, hub)).toEqual({ root, key });
    });

    it('is none for a hub chosen that holds no tasks collection, said by its name', async () => {
        expect(await addedTo([other, own], 'research', 'nowhere')).toBe(
            t('app.palette.task_hub_collection', 'nowhere')
        );
    });

    it.each([
        ['there is no primary', null],
        ['the primary holds no tasks collection', 'third']
    ])(
        'is none with two hubs holding tasks when %s, said by asking which (G8)',
        async (_name, primary) => {
            expect(await addedTo([other, own], primary)).toBe(t('app.palette.task_add_which_hub'));
        }
    );
});

describe('the hub a person is added to', () => {
    const PEOPLE_SCHEMA: SchemaField[] = [
        { field: 'key', type: 'text', primary_key: true },
        { field: 'name', type: 'text', display: 1 }
    ];
    const people = (root: string): Collection => ({
        id: 'people',
        title: 'People',
        file: '/hub/.oculus/data/academic/people.yml',
        schema: PEOPLE_SCHEMA,
        primary_key: 'key',
        entries: [],
        root
    });

    /** The hub the write is given for a person, or the sentence said. */
    async function addedTo(collections: Collection[], hub: string | null): Promise<string> {
        const written: string[] = [];
        const added = await addPerson('Ada Lovelace', collections, hub, (_c, one, root) => {
            written.push(root);
            return Promise.resolve({
                ok: true,
                changed: [],
                refused: [],
                id: `${root}:${String(one.key)}`
            });
        });
        return written.at(0) ?? added.said;
    }

    it.each([
        ['the hub named', [people('research'), people('second')], 'second', 'second'],
        ['the one hub holding people when none is named', [people('second')], null, 'second']
    ])('is %s (G8)', async (_name, collections, hub, root) => {
        expect(await addedTo(collections, hub)).toBe(root);
    });

    it('is none with two hubs holding people and none named, said by asking which (G8)', async () => {
        expect(await addedTo([people('research'), people('second')], null)).toBe(
            t('editor.add_person_which_hub')
        );
    });

    it('writes the key under the primary key and the name under the display (G8)', async () => {
        const written: Record<string, unknown>[] = [];
        await addPerson(' Ada Lovelace ', [people('research')], 'research', (_c, one) => {
            written.push(one);
            return Promise.resolve({ ok: true, changed: [], refused: [], id: 'research:x' });
        });
        expect(written).toEqual([{ key: 'ada-lovelace', name: 'Ada Lovelace' }]);
    });
});

describe('the task a title makes', () => {
    it.each([
        [
            'words joined by hyphens',
            'Review the RAW-PLS rebuttal',
            [],
            'review-the-raw-pls-rebuttal'
        ],
        ['accents taken off', 'Caf\u00e9 meeting', [], 'cafe-meeting'],
        [
            'a held key gets -2',
            'Review the RAW-PLS rebuttal',
            ['review-the-raw-pls-rebuttal'],
            'review-the-raw-pls-rebuttal-2'
        ],
        ['a key held twice gets -3', 'Review', ['review', 'review-2'], 'review-3']
    ])('%s', async (_name, title, held, key) => {
        expect(await made(title, [tasks(held)])).toEqual({ key, title, status: 'todo' });
    });

    it('is written under the primary key and the display the schema flags (G8)', async () => {
        const home: Collection = {
            ...tasks(['review']),
            schema: [
                { field: 'slug', type: 'text', primary_key: true },
                { field: 'label', type: 'text', display: 1 },
                { field: 'status', type: 'select' }
            ],
            primary_key: 'slug'
        };
        expect(await made('Review', [home])).toEqual({
            slug: 'review-2',
            label: 'Review',
            status: 'todo'
        });
    });

    it('is cut to 80 characters with no trailing hyphen', async () => {
        const key = ((await made(`${'word '.repeat(60)}end`, [tasks([])])) as { key: string }).key;
        expect(key.length).toBeLessThanOrEqual(80);
        expect(key.endsWith('-')).toBe(false);
    });

    it('keeps a clashing key inside 80 characters with its suffix', async () => {
        const long = 'a'.repeat(200);
        const first = ((await made(long, [tasks([])])) as { key: string }).key;
        const second = ((await made(long, [tasks([first])])) as { key: string }).key;
        expect(second.length).toBeLessThanOrEqual(80);
        expect(second.endsWith('-2')).toBe(true);
    });
});

describe('addTask', () => {
    const answered = (over: Partial<WriteAnswer>): WriteAnswer => ({
        ok: true,
        changed: [],
        refused: [],
        ...over
    });

    it('writes the task to the tasks collection of its hub and gives back its id and title', async () => {
        const calls: [string, Record<string, unknown>, string][] = [];
        const added = await addTask(
            'Review it',
            [tasks([], 'research')],
            null,
            ENGINE,
            (collection, fields, root) => {
                calls.push([collection, fields, root]);
                return Promise.resolve(answered({ id: 'research:review-it' }));
            }
        );
        expect(calls).toEqual([
            ['tasks', { key: 'review-it', title: 'Review it', status: 'todo' }, 'research']
        ]);
        expect(added).toEqual({ id: 'research:review-it', label: 'Review it', said: '' });
    });

    it.each([
        ['an empty title', '', [tasks([])], 'app.palette.task_add_title'],
        ['no key', '\u65e5\u672c', [tasks([])], 'app.palette.task_add_key'],
        ['no tasks collection', 'Review', [], 'app.palette.task_add_collection']
    ])('says why it writes nothing for %s', async (_name, title, collections, words) => {
        const calls: string[] = [];
        const added = await addTask(title, collections, null, ENGINE, (collection) => {
            calls.push(collection);
            return Promise.resolve(answered({}));
        });
        expect(calls).toEqual([]);
        expect(added).toEqual({ id: '', label: '', said: t(words) });
    });

    it('says the refusal of the write', async () => {
        const added = await addTask('Review it', [tasks([])], null, ENGINE, () =>
            Promise.resolve(answered({ ok: false, error: 'the file does not parse' }))
        );
        expect(added).toEqual({ id: '', label: '', said: 'the file does not parse' });
    });

    it('says the reason of a refused field', async () => {
        const added = await addTask('Review it', [tasks([])], null, ENGINE, () =>
            Promise.resolve(
                answered({
                    refused: [{ field: 'key', reason: 'an entry with that key is in the file' }]
                })
            )
        );
        expect(added.said).toBe('an entry with that key is in the file');
    });
});
