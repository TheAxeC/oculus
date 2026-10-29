// Layer 2, route tests. POST /api/primary-key (server/edit/primary-key.ts), the choice of a
// data file's primary key that the finding of a file with none offers. The handler is called with
// a scratch hub as the one served root and a writer with a change log of its own; each write is
// read back as History lists it and taken back by the undo of the Files view, and the file is read
// again by the reader every write of an entry goes through (`readCollection`).
//
// One row per finding (`key_none`, `key_two`, `key_beside`, `key_missing`), the refusal of a
// field the file cannot be found by, and the choices the Findings view offers (`keyChoicesOf`):
// which finding of a file carries one and which fields it offers. What this does NOT cover: the
// drawing of the Findings row and its press, which no test here mounts.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import type { Collection, Finding, PortfolioConfig } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    handlePrimaryKeyPost,
    type PrimaryKeyOptions
} from '../../../src/lib/server/edit/primary-key.ts';
import { readCollection } from '../../../src/lib/server/files/fs/collections.ts';
import { keyChoicesOf } from '../../../src/lib/state/boards/collection/key-choice.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import { WriteLog } from '../write-log.ts';

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';

/** The data file's path in the hub and the hub's configuration file. */
const DATA = '.oculus/data/tasks.yml';
const CONFIG = '.oculus/config.yml';

let hub = '';
const log = new WriteLog('hub', () => hub);
let config: PortfolioConfig | null = null;

beforeEach(() => {
    log.start('oculus-primary-key-');
});

afterEach(() => {
    config = null;
});

/** A hub holding the data file and the hub's collections list, `named` its entry's key if any. */
function plantHub(data: string, named?: string): void {
    const entry = named === undefined ? '' : `, primary_key: ${named}`;
    const listed = `# the hub's settings\ncollections:\n    - { key: tasks, file: ${DATA}${entry} }\n`;
    hub = plantScratch('oculus-pk-hub-', { [DATA]: data, [CONFIG]: listed });
    const merged = loadConfig(engineDir()).config;
    const real = portfolioConfigFrom(merged);
    config = {
        ...real,
        collections: [
            { key: 'tasks', file: DATA, ...(named === undefined ? {} : { primary_key: named }) }
        ]
    };
}

function mine(): PrimaryKeyOptions {
    return {
        hubFor: (root) => (root === 'hub' && config !== null ? { dir: hub, config } : null),
        files: () => log.writer(),
        text: () => loadConfig(engineDir()).config.text as Record<string, string>
    };
}

async function post(field: string): Promise<{ status: number; body: unknown }> {
    const body = { root: 'hub', collection: 'tasks', field };
    const response = await handlePrimaryKeyPost(
        pagePost(`${HOST}/api/primary-key`, body, TOKEN),
        TOKEN,
        mine()
    );
    return { status: response.status, body: await response.json() };
}

/** A file of the hub as it is now. */
const textOf = (path: string): string => readFileSync(join(hub, path), 'utf8');

/** The primary key the reader finds in the file now, and why it has none. */
function keyNow(): unknown {
    if (config === null) return null;
    const merged = { ...config, collections: config.collections.map((one) => ({ ...one })) };
    const listed = /primary_key: (\w+)/.exec(textOf(CONFIG))?.[1];
    merged.collections[0] = {
        key: 'tasks',
        file: DATA,
        ...(listed === undefined ? {} : { primary_key: listed })
    };
    const read = readCollection(hub, merged, 'tasks');
    return read === null ? null : [read.ident, read.fault];
}

const ENTRIES =
    'entries:\n    - { title: One, code: a1, tags: [x] }\n    - { title: Two, code: b2, tags: [y] }\n';

describe('the choice of a data file primary key', () => {
    it('marks the field picked in a schema that flags none (key_none), every other line kept, one write listed and undone', async () => {
        const data = `# the tasks\nschema:\n    - { field: title, type: text }\n    - { field: tags, type: tags }\n${ENTRIES}`;
        plantHub(data);
        const answered = await post('title');
        const after = textOf(DATA);
        const key = keyNow();
        const listed = log.listed().map((one) => one.field);
        await log.undoAll();
        expect([answered.status, answered.body]).toEqual([200, { written: [DATA] }]);
        expect(after).toBe(
            data.replace(
                '{ field: title, type: text }',
                '{ field: title, type: text, primary_key: true }'
            )
        );
        expect([key, listed]).toEqual([['title', null], ['set-primary-key']]);
        expect(textOf(DATA)).toBe(data);
    });

    it('leaves the mark on the field picked alone in a schema that flags two (key_two)', async () => {
        const data = `schema:\n    - { field: title, type: text, primary_key: true }\n    - { field: code, type: text, primary_key: true }\n${ENTRIES}`;
        plantHub(data);
        const answered = await post('code');
        expect([answered.status, textOf(DATA), keyNow()]).toEqual([
            200,
            data.replace(
                '{ field: title, type: text, primary_key: true }',
                '{ field: title, type: text }'
            ),
            ['code', null]
        ]);
    });

    it('marks the field picked and takes the collections entry key out of config.yml (key_beside), two writes, each listed and undone', async () => {
        const data = `schema:\n    - { field: title, type: text, primary_key: true }\n    - { field: code, type: text }\n${ENTRIES}`;
        plantHub(data, 'code');
        const listedBefore = textOf(CONFIG);
        const answered = await post('code');
        const [dataAfter, configAfter, key] = [textOf(DATA), textOf(CONFIG), keyNow()];
        const listed = log.listed().map((one) => one.field);
        await log.undoAll();
        expect([answered.status, answered.body]).toEqual([200, { written: [DATA, CONFIG] }]);
        expect(dataAfter).toBe(
            data
                .replace(
                    '{ field: title, type: text, primary_key: true }',
                    '{ field: title, type: text }'
                )
                .replace(
                    '{ field: code, type: text }',
                    '{ field: code, type: text, primary_key: true }'
                )
        );
        expect(configAfter).toBe(listedBefore.replace(', primary_key: code', ''));
        expect([key, listed]).toEqual([
            ['code', null],
            ['set-primary-key', 'set-primary-key']
        ]);
        expect([textOf(DATA), textOf(CONFIG)]).toEqual([data, listedBefore]);
    });

    it('names the key on the collections entry of a file with no schema (key_missing), and adds no schema', async () => {
        plantHub(ENTRIES);
        const listedBefore = textOf(CONFIG);
        const answered = await post('code');
        expect([answered.status, answered.body]).toEqual([200, { written: [CONFIG] }]);
        expect([textOf(DATA), textOf(CONFIG), keyNow()]).toEqual([
            ENTRIES,
            listedBefore.replace(`file: ${DATA} }`, `file: ${DATA}, primary_key: code }`),
            ['code', null]
        ]);
    });

    it('refuses a list field and a field the schema does not describe, and writes nothing', async () => {
        const data = `schema:\n    - { field: title, type: text }\n    - { field: tags, type: tags }\n${ENTRIES}`;
        plantHub(data);
        const listedBefore = textOf(CONFIG);
        const refused = [await post('tags'), await post('code')];
        expect(refused.map((one) => one.status)).toEqual([400, 400]);
        expect(refused.map((one) => (one.body as { error: string }).error)).toEqual([
            expect.stringContaining('The field tags is not one the file can be found by'),
            expect.stringContaining('The field code is not one the file can be found by')
        ]);
        expect([textOf(DATA), textOf(CONFIG), log.listed()]).toEqual([data, listedBefore, []]);
    });

    it('refuses a POST without the token and one naming a root no hub of the workspace is, writing nothing (G1, G2)', async () => {
        const data = `schema:\n    - { field: title, type: text }\n${ENTRIES}`;
        plantHub(data);
        const listedBefore = textOf(CONFIG);
        const body = { root: 'hub', collection: 'tasks', field: 'title' };
        const untokened = await handlePrimaryKeyPost(
            pagePost(`${HOST}/api/primary-key`, body, ''),
            TOKEN,
            mine()
        );
        const elsewhere = await handlePrimaryKeyPost(
            pagePost(`${HOST}/api/primary-key`, { ...body, root: 'elsewhere' }, TOKEN),
            TOKEN,
            mine()
        );
        expect([untokened.status, elsewhere.status]).toEqual([403, 404]);
        expect([textOf(DATA), textOf(CONFIG), log.listed()]).toEqual([data, listedBefore, []]);
    });
});

/** A collection of the hub `hub` as the merged snapshot carries it, with its entries' fields. */
function held(file: string, fault: Collection['key_fault'], fields: Record<string, unknown>[]) {
    const schema = [
        { field: 'title', type: 'text' },
        { field: 'tags', type: 'tags' },
        { field: 'meta', type: 'text' }
    ];
    return {
        id: 'hub:tasks',
        root: 'hub',
        file,
        ...(fault?.cause === 'missing' ? {} : { schema }),
        entries: fields.map((one, index) => ({ id: String(index), fields: one })),
        key_fault: fault
    } as unknown as Collection;
}

describe('the choices the Findings view offers', () => {
    it('offers a file its choice once, on its first finding of the key, with no list or map field', () => {
        const fields = [
            { title: 'One', tags: ['x'], meta: { a: 1 } },
            { title: 'Two', tags: [], meta: null }
        ];
        const unkeyed = held('/hub/a.yml', { cause: 'none' }, fields);
        const bare = held('/hub/b.yml', { cause: 'missing' }, [{ code: 'a1', list: [1] }]);
        const unread = held('/hub/c.yml', { cause: 'unread' }, fields);
        const found: Finding[] = [
            { file: '/hub/a.yml', key: 'schema[0].type', message: 'a row' },
            { file: '/hub/a.yml', key: 'schema', message: 'no key' },
            { file: '/hub/a.yml', key: 'schema', message: 'no field to display' },
            { file: '/hub/b.yml', key: 'schema', message: 'a schema finding on a file with none' },
            { file: '/hub/b.yml', key: '', message: 'no schema and no key' },
            { file: '/hub/c.yml', key: 'schema', message: 'a key the reader does not read' }
        ];
        const offered = keyChoicesOf(found, [unkeyed, bare, unread]);
        expect([...offered]).toEqual([
            [1, { root: 'hub', collection: 'tasks', fields: ['title'] }],
            [4, { root: 'hub', collection: 'tasks', fields: ['code'] }]
        ]);
    });
});
