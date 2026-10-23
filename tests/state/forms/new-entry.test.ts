// Layer 2, client-state tests. What a new entry is made of: the fields the Add box asks, the
// collection Add writes to, the task `:task-add` makes of a title, and what `addTask` says when the
// title, the key, the collection or the write refuses. The write is a stub that records the call.

import { describe, expect, it } from 'vitest';
import type { Collection, Entry, SchemaField } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { addTask, askFields } from '../../../src/lib/state/forms/new-entry.ts';
import type { WriteAnswer } from '../../../src/lib/state/shared/stores/shapes.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';

/** The config oculus ships, whose `statuses` give a new task its status. */
const ENGINE = loadConfig(engineDir()).config;

setCatalog(textCatalog(ENGINE));

const TASK_SCHEMA: SchemaField[] = [
    { field: 'key', type: 'text' },
    { field: 'title', type: 'text' },
    { field: 'status', type: 'select' }
];

function entry(key: string, root?: string): Entry {
    return {
        id: key,
        title: key,
        fields: { key },
        file: '/hub/.oculus/data/academic/tasks.yml',
        index: 0,
        ...(root === undefined ? {} : { root })
    };
}

function tasks(keys: string[], root?: string): Collection {
    return {
        id: 'tasks',
        title: 'Tasks',
        file: '/hub/.oculus/data/academic/tasks.yml',
        schema: TASK_SCHEMA,
        entries: keys.map((one) => entry(one, root)),
        ...(root === undefined ? {} : { root })
    };
}

describe('askFields', () => {
    it.each([
        ['a collection keyed by its first field', 'tasks', TASK_SCHEMA, ['key']],
        [
            'venues, whose entities are keyed by id',
            'venues',
            [{ field: 'name', type: 'text' }],
            ['name', 'id']
        ],
        ['a file with no schema', 'tasks', undefined, ['title']]
    ])('%s', (_name, collection, schema, fields) => {
        expect(askFields(collection, schema).map((one) => one.field)).toEqual(fields);
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

    it.each([
        ['the primary hub when there is one', [other, own], 'research', 'review'],
        ['the first hub when there is no primary', [other, own], null, 'review-2']
    ])('is %s', async (_name, collections, primary, key) => {
        expect(await made('Review', collections, primary)).toMatchObject({ key });
    });

    it('is none when the primary hub holds no tasks collection', async () => {
        expect(await made('Review', [other], 'research')).toBe(
            t('app.palette.task_add_collection')
        );
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
