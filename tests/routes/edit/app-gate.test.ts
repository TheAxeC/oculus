// Layer 2, route tests. What the write endpoint does with a request from an app's frame: the gate
// (lib/server/edit/writes/app-gate.ts) that refuses a write whose matched kind is not the open
// kind its header names, and the endpoint's answer to the writes the gate lets through.
//
// The hub, the apps and the store folder are synthetic, under the system temporary directory.
// What this does NOT cover: the page's own checks before a request is sent
// (tests/state/system/apps/methods.test.ts) and a write kind's own writer beyond one open kind.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { AppsHeld } from '../../../src/lib/server/machine/apps/held.ts';
import { APP_HEADER, KIND_HEADER } from '../../../src/lib/data/helpers/files/apps.ts';
import { gateWrite } from '../../../src/lib/server/edit/writes/app-gate.ts';
import { it } from '../../fixtures/scratch.ts';
import { MANIFEST, notesFiles, PAGE, routeSetup } from '../apps/apps-fixture.ts';
import { changesOf, request, target, TOKEN, warmConfig } from './write-fixture.ts';

beforeAll(warmConfig);

const TODO = 'name: todo\ntitle: Todo\nbridge: 1\nwrites: [radar-add]\n';

/** The held apps of every case: a machine app `notes` and a root app whose key needs escaping. */
function held(): ReturnType<typeof routeSetup> {
    return routeSetup({
        machine: notesFiles(`${MANIFEST}writes: [radar-add]\n`),
        roots: {
            'a/b': { '.oculus/apps/todo/app.yml': TODO, '.oculus/apps/todo/index.html': PAGE },
            'my repo': { '.oculus/apps/todo/app.yml': TODO, '.oculus/apps/todo/index.html': PAGE }
        }
    });
}

const RADAR = {
    kind: 'radar-add',
    fields: {
        title: 'A paper found by the search',
        authors: 'Ada Lovelace',
        year: 2025,
        url: 'https://doi.org/10.1000/abc',
        bucket: 'adjacent',
        relevance: 'med'
    }
};
const DELETE = { kind: 'delete-entry', collection: 'tasks', id: 'x' };
const ENTRY_OF_BOOKMARKS = { kind: 'entry', collection: 'bookmarks', id: 'x', fields: {} };
const UNDO = { kind: 'undo', at: 1 };
const STORE = { store: { seen: ['a'] } };

/** The gate's decision for a body sent under the app header and kind header given. */
function gate(body: unknown, app: string | null, kind: string | null, now: AppsHeld) {
    const headers = new Headers();
    if (app !== null) headers.set(APP_HEADER, app);
    if (kind !== null) headers.set(KIND_HEADER, kind);
    return gateWrite(headers, body, () => now);
}

/** What the gate decided: the id of the app that may write, `refused`, or null for a page's own. */
function decided(body: unknown, app: string | null, kind: string | null): string | null {
    const result = gate(body, app, kind, held().held());
    if ('refused' in result) return 'refused';
    return 'app' in result ? (result.app?.id ?? null) : null;
}

/** A target whose apps are the held ones and whose store folder is the fixture's. */
function appTarget() {
    const apps = held();
    const into = target();
    into.apps = { held: apps.held, data: join(apps.fixture.base, 'data'), maxKb: 256 };
    return { apps, into };
}

/** What the write endpoint answered for a request, and the target it wrote to. */
async function written(body: unknown, headers: Record<string, string>, bare = false) {
    const { apps, into } = appTarget();
    const aimed = bare ? target() : into;
    const response = await handleWrite(request(body, headers), TOKEN, aimed);
    return { apps, into: aimed, response };
}

type Row = [string, () => unknown, unknown];

/** A row for the gate: the app it lets write, or `refused`. */
const gated = (
    label: string,
    body: unknown,
    app: string | null,
    kind: string | null,
    id: string | null
): Row => [
    `${id === 'refused' ? 'refuses' : 'lets through'} ${label}`,
    () => decided(body, app, kind),
    id
];

const ROWS: Row[] = [
    gated('an open kind named by its header', RADAR, 'app:notes', 'radar-add', 'app:notes'),
    gated('its own store', STORE, 'app:notes', 'app-store', 'app:notes'),
    gated(
        'a root key holding a slash, escaped',
        RADAR,
        'app:a%2Fb/todo',
        'radar-add',
        'app:a/b/todo'
    ),
    gated(
        'a root key holding a space, escaped',
        RADAR,
        'app:my%20repo/todo',
        'radar-add',
        'app:my repo/todo'
    ),
    gated('a body of the page with no app header', RADAR, null, null, null),
    gated(
        'a body of another kind than the header names',
        DELETE,
        'app:notes',
        'radar-add',
        'refused'
    ),
    gated('a closed kind named truthfully', UNDO, 'app:notes', 'undo', 'refused'),
    gated(
        'an entry write naming the bookmarks collection',
        ENTRY_OF_BOOKMARKS,
        'app:notes',
        'entry',
        'refused'
    ),
    gated('a body that no kind reads', { nothing: 1 }, 'app:notes', 'radar-add', 'refused'),
    gated('a store write with no app header', STORE, null, null, 'refused'),
    gated('an app header naming no held row', RADAR, 'app:nonesuch', 'radar-add', 'refused'),
    gated(
        'an app header holding a malformed escape',
        RADAR,
        'app:%E0%A4%A/todo',
        'radar-add',
        'refused'
    ),
    [
        'refuses every app header when the target holds no apps',
        () => {
            const headers = new Headers({ [APP_HEADER]: 'app:notes', [KIND_HEADER]: 'radar-add' });
            return gateWrite(headers, RADAR, undefined);
        },
        { refused: true }
    ],
    [
        'the endpoint writes an open kind and records the view id of the app that sent it',
        async () => {
            const { into, response } = await written(RADAR, {
                [APP_HEADER]: 'app:notes',
                [KIND_HEADER]: 'radar-add'
            });
            return {
                status: response.status,
                feed: readFileSync(
                    join(into.hub, 'feeds', 'literature-radar.yml'),
                    'utf8'
                ).includes('A paper found by the search'),
                recorded: [changesOf(into)[0].kind, changesOf(into)[0].app]
            };
        },
        { status: 200, feed: true, recorded: ['radar-add', 'app:notes'] }
    ],
    [
        'the endpoint records a root app by its view id with the root key unescaped',
        async () => {
            const { into } = await written(RADAR, {
                [APP_HEADER]: 'app:a%2Fb/todo',
                [KIND_HEADER]: 'radar-add'
            });
            return changesOf(into)[0].app;
        },
        'app:a/b/todo'
    ],
    [
        'the endpoint writes a store as the app store and records it under the app',
        async () => {
            const { apps, into, response } = await written(STORE, {
                [APP_HEADER]: 'app:notes',
                [KIND_HEADER]: 'app-store'
            });
            const file =
                apps.held().apps.find((one) => one.id === 'app:notes')?.row.storeFile ?? '';
            return {
                status: response.status,
                stored: JSON.parse(readFileSync(file, 'utf8')) as unknown,
                recorded: [changesOf(into)[0].kind, changesOf(into)[0].app]
            };
        },
        { status: 200, stored: STORE.store, recorded: ['app-store', 'app:notes'] }
    ],
    [
        'the endpoint answers 403 kind for a body of another kind than its header and writes nothing',
        async () => {
            const { into, response } = await written(DELETE, {
                [KIND_HEADER]: 'radar-add',
                [APP_HEADER]: 'app:notes'
            });
            return [response.status, (await response.json()) as unknown, changesOf(into)];
        },
        [403, { error: 'kind' }, []]
    ],
    [
        'the endpoint answers 403 kind to an app header from a target that holds no apps',
        async () => {
            const { response } = await written(
                RADAR,
                { [APP_HEADER]: 'app:notes', [KIND_HEADER]: 'radar-add' },
                true
            );
            return response.status;
        },
        403
    ]
];

describe('refuses a write whose matched kind is not the open kind its header names', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
