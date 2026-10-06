// Layer 2, server test. The `app-store` write kind (lib/server/edit/writes/app-store.ts): an app's
// one JSON value, written to the file its held row names inside the folder the store module was
// given, recorded with byte sizes, and kept in the undo folder for the undo.
//
// The store module's folder is a temporary one in every case and the resolved path is asserted
// inside it before any write; a case never reaches `~/.oculus`. What this does NOT cover: the
// endpoint's gate for the app header (tests/routes/edit/app-gate.test.ts) and the undo of a store
// write (tests/routes/edit/undo/undo.test.ts).

import { existsSync, mkdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { beforeAll, describe, expect, vi } from 'vitest';
import type { HeldApp } from '../../../src/lib/server/machine/apps/held.ts';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { writeAppStore } from '../../../src/lib/server/edit/writes/app-store.ts';
import { readChanges } from '../../../src/lib/server/core/changes.ts';
import { it } from '../../fixtures/scratch.ts';
import { present } from '../../fixtures/present.ts';
import { MANIFEST, notesFiles, PAGE, routeSetup } from '../../routes/apps/apps-fixture.ts';
import { request, target, TOKEN, warmConfig } from '../../routes/edit/write-fixture.ts';

beforeAll(warmConfig);

const TODO = 'name: todo\ntitle: Todo\nbridge: 1\n';

/** A machine app `notes`, a root app `todo` in the root `repo`, and a target that holds them. */
function world() {
    const setup = routeSetup({
        machine: notesFiles(MANIFEST),
        roots: {
            repo: { '.oculus/apps/todo/app.yml': TODO, '.oculus/apps/todo/index.html': PAGE }
        }
    });
    const data = join(setup.fixture.base, 'data');
    const into: WriteTarget = target();
    into.apps = { held: setup.held, data, maxKb: 256 };
    into.changes = { ...present(into.changes, 'the change log'), undoDir: join(data, '.undo') };
    const app = (id: string): HeldApp =>
        present(
            setup.held().apps.find((one) => one.id === id),
            id
        );
    return { setup, data, into, app };
}

/** Every path written is asserted to be inside the folder the case gave the store module. */
function inside(path: string, folder: string): void {
    expect(resolve(path).startsWith(resolve(folder) + sep)).toBe(true);
}

const STORE_HEADERS = { 'x-oculus-app': 'app:notes', 'x-oculus-write-kind': 'app-store' };

type Row = [string, () => unknown, unknown];

const ROWS: Row[] = [
    [
        'the first write, which makes the folder and the file private to the machine',
        () => {
            const { data, into, app } = world();
            const notes = app('app:notes');
            const before = existsSync(data);
            inside(notes.row.storeFile, data);
            const outcome = writeAppStore(into, notes, { seen: ['a', 'b'] });
            return [
                before,
                'error' in outcome,
                JSON.parse(readFileSync(notes.row.storeFile, 'utf8')) as unknown,
                statSync(notes.row.storeFile).mode & 0o777
            ];
        },
        [false, false, { seen: ['a', 'b'] }, 0o600]
    ],
    [
        'a store that changed, which tells the apps watcher, and one that did not',
        () => {
            const { into, app } = world();
            const told = vi.fn();
            present(into.apps, 'the apps of the target').stored = told;
            writeAppStore(into, app('app:notes'), { seen: ['a'] });
            const first = told.mock.calls.length;
            writeAppStore(into, app('app:notes'), { seen: ['a'] });
            const same = told.mock.calls.length;
            writeAppStore(into, app('app:notes'), { seen: ['b'] });
            return [first, same, told.mock.calls.length];
        },
        [1, 1, 2]
    ],
    [
        'one record naming the app, the field store, byte sizes and both values',
        () => {
            const { into, app } = world();
            const notes = app('app:notes');
            const outcome = writeAppStore(into, notes, { seen: ['a', 'b'] }) as {
                records: { file: string }[];
            };
            const { file, ...record } = outcome.records[0];
            return { ...outcome, records: [record], filed: file === notes.row.storeFile };
        },
        {
            filed: true,
            found: true,
            changed: ['store'],
            refused: [],
            records: [
                {
                    key: 'app:notes',
                    field: 'store',
                    before: 0,
                    after: Buffer.byteLength('{"seen":["a","b"]}'),
                    undo: 'field',
                    kept: { before: null, after: { seen: ['a', 'b'] } }
                }
            ]
        }
    ],
    [
        'a write through the endpoint, recorded with the sizes and kept in the undo folder',
        async () => {
            const { data, into } = world();
            const response = await handleWrite(
                request({ store: { seen: ['a', 'b'] } }, STORE_HEADERS),
                TOKEN,
                into
            );
            const [change] = readChanges(present(into.changes, 'the change log'));
            const kept = join(data, '.undo', `${change.at}.json`);
            inside(kept, data);
            return {
                status: response.status,
                recorded: [change.kind, change.key, change.field, change.app],
                sizes: [change.before, change.after],
                kept: JSON.parse(readFileSync(kept, 'utf8')) as unknown
            };
        },
        {
            status: 200,
            recorded: ['app-store', 'app:notes', 'store', 'app:notes'],
            sizes: [0, Buffer.byteLength('{"seen":["a","b"]}')],
            kept: { before: null, after: { seen: ['a', 'b'] } }
        }
    ],
    [
        'a value equal to the file with its keys in another order, which writes and records nothing',
        () => {
            const { into, app } = world();
            const notes = app('app:notes');
            writeAppStore(into, notes, { a: 1, b: { c: 2, d: 3 } });
            const before = statSync(notes.row.storeFile);
            const outcome = writeAppStore(into, notes, { b: { d: 3, c: 2 }, a: 1 });
            return [
                outcome,
                statSync(notes.row.storeFile).mtimeMs === before.mtimeMs,
                readFileSync(notes.row.storeFile, 'utf8')
            ];
        },
        [{ found: true, changed: [], refused: [] }, true, '{"a":1,"b":{"c":2,"d":3}}']
    ],
    [
        'a value over the limit, refused too_large with no file made',
        () => {
            const { into, app } = world();
            const notes = app('app:notes');
            const outcome = writeAppStore(into, notes, 'x'.repeat(257 * 1024));
            return [outcome, existsSync(notes.row.storeFile)];
        },
        [
            {
                found: true,
                changed: [],
                refused: [{ field: 'store', reason: 'too_large' }]
            },
            false
        ]
    ],
    ...(
        [
            ['a file that does not parse', '{not json'],
            ['a file over the limit', JSON.stringify({ text: 'x'.repeat(300 * 1024) })]
        ] as [string, string][]
    ).map(([label, text]): Row => [
        `${label}, which holds no value to compare, so the write goes ahead`,
        () => {
            const { into, app } = world();
            const notes = app('app:notes');
            mkdirSync(dirname(notes.row.storeFile), { recursive: true });
            writeFileSync(notes.row.storeFile, text);
            const outcome = writeAppStore(into, notes, { fresh: true }) as { changed: string[] };
            return [
                outcome.changed,
                JSON.parse(readFileSync(notes.row.storeFile, 'utf8')) as unknown
            ];
        },
        [['store'], { fresh: true }]
    ]),
    [
        'a store folder that is a link out of the base, refused outside with nothing written',
        () => {
            const { setup, into, app } = world();
            const todo = app('app:repo/todo');
            const outside = join(setup.fixture.base, 'outside');
            mkdirSync(outside, { recursive: true });
            mkdirSync(join(todo.rootDir, '.oculus'), { recursive: true });
            symlinkSync(outside, join(todo.rootDir, '.oculus', 'app-data'));
            const outcome = writeAppStore(into, todo, { n: 1 }) as {
                changed: string[];
                refused: unknown[];
            };
            return [outcome.changed, outcome.refused, existsSync(join(outside, 'todo.json'))];
        },
        [[], [{ field: 'store', reason: 'outside' }], false]
    ],
    [
        'a root app store inside the root, and a machine app store inside the data folder',
        () => {
            const { data, into, app } = world();
            const todo = app('app:repo/todo');
            const notes = app('app:notes');
            const written = [
                (writeAppStore(into, todo, { n: 1 }) as { changed: string[] }).changed,
                (writeAppStore(into, notes, { n: 2 }) as { changed: string[] }).changed
            ];
            inside(todo.row.storeFile, todo.rootDir);
            inside(notes.row.storeFile, data);
            return [
                written,
                todo.row.storeFile === join(todo.rootDir, '.oculus', 'app-data', 'todo.json')
            ];
        },
        [[['store'], ['store']], true]
    ],
    [
        'a target that holds no apps, answered unwritable',
        () => writeAppStore(target(), world().app('app:notes'), { n: 1 }),
        { error: 'unwritable' }
    ]
];

describe('writes the store of an app as the app-store kind', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
