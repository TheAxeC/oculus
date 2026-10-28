// Layer 2, route tests. The folders closed to every app: the machine's state folder, a hub's
// `secrets` folder and a state folder `local.yml` places elsewhere. The set is one function of the
// machine's values (reach/private.ts); a manifest whose `files:` entry lies in one is refused, and
// a file of one is `closed` to `fs`, to `open({ file })` and to a custom editor's document,
// whatever root covers it and whether the path reaches it through a link. These are the rows of
// G49 for the private folders.
//
// Every folder is synthetic, under the system temporary directory, with the roots standing in for
// `~/.oculus` and the placed state. `closed_paths` is empty here, so only the private folders can
// close a path. What this does NOT cover: the page's own check before it asks (tests/state).

import { realpathSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { appById } from '../../../src/lib/server/machine/apps/read/held.ts';
import { checkOpen, diskFs } from '../../../src/lib/server/machine/apps/reach/open.ts';
import { closedToApps } from '../../../src/lib/server/machine/apps/reach/private.ts';
import { handleDocumentGet } from '../../../src/lib/server/machine/apps/routes/document.ts';
import { serveApp } from '../../../src/lib/server/machine/apps/serve/serve.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { approveAll, notesFiles, PORT, routeSetup, serveInput } from './apps-fixture.ts';

const EDITOR =
    'contributes:\n  customEditors:\n    - viewType: notes.edit\n      displayName: Edit\n      selector:\n        - filenamePattern: "*.json"\n      entry: index.html\n';

const ROOTS = {
    /** Stands for `~/.oculus`. */
    st: { 'approvals.json': '{"secret":1}', 'calendar/c.ics': 'x' },
    /** A home folder holding the state folder and an ordinary folder. */
    home: { 'oculus-state/approvals.json': '{}', 'notes/a.md': 'a' },
    /** A hub holding a `secrets` folder and an ordinary folder. */
    hub: { 'secrets/k.json': '{"key":1}', 'projects/a.md': 'a' },
    /** A folder holding the state `local.yml` places outside `~/.oculus`. */
    histparent: { 'history/f.json': '{}' },
    /** A root holding an ordinary file and, planted below, a link into the state. */
    one: { 'x.json': '{}' }
};

/** The real paths closed to every app in these cases. */
const closed = (base: string): string[] =>
    [
        join(base, 'roots', 'st'),
        join(base, 'roots', 'home', 'oculus-state'),
        join(base, 'roots', 'hub', 'secrets'),
        join(base, 'roots', 'histparent', 'history')
    ].map((path) => realpathSync(path));

/** A world: the app `notes` with a custom editor and these keys, approved, over the roots above. */
function world(keys = 'files: [home, hub, histparent, one]\n') {
    const setup = routeSetup(
        {
            machine: notesFiles(`name: notes\ntitle: Notes\nbridge: 1\n${keys}${EDITOR}`),
            roots: ROOTS,
            privateFolders: closed
        },
        { closedPaths: () => [] }
    );
    approveAll(setup);
    symlinkSync(
        join(setup.fixture.base, 'roots', 'st', 'approvals.json'),
        join(setup.fixture.base, 'roots', 'one', 'link.json')
    );
    return setup;
}

/** What `open({ file })` answers for the app `notes`. */
function opened(setup: ReturnType<typeof world>, root: string, path: string): string {
    const app = appById(setup.held(), 'app:notes');
    if (app === undefined) throw new Error('the app is not held');
    return checkOpen(
        { app, root, path },
        {
            roots: setup.fixture.roots,
            configDir: join(setup.fixture.base, 'engine'),
            closedPaths: [],
            privateReal: closed(setup.fixture.base),
            fs: diskFs
        }
    );
}

/** What a custom editor's `document.read` answers for a file: the route's JSON. */
async function documentRead(setup: ReturnType<typeof world>, root: string, path: string) {
    const query = new URLSearchParams({ app: 'app:notes', root, path });
    const response = handleDocumentGet(
        new Request(`http://localhost:${PORT}/api/app-document?${query.toString()}`),
        setup.options
    );
    return (await response.json()) as { ok: boolean; word?: string };
}

/** What `fs.readFile` answers: the status and body of the `.fs` address. */
async function fsRead(setup: ReturnType<typeof world>, root: string, path: string) {
    const app = appById(setup.held(), 'app:notes');
    if (app === undefined) throw new Error('the app is not held');
    const answer = serveApp({
        ...serveInput(
            new Request(`http://localhost:${PORT}/apps/notes/${app.row.key}/.fs/${root}/${path}`),
            setup.held()
        ),
        reach: () => ({
            roots: setup.fixture.roots,
            configDir: join(setup.fixture.base, 'engine'),
            closedPaths: [],
            privateReal: closed(setup.fixture.base),
            fs: diskFs,
            scanEntries: 100
        })
    });
    return [answer.status, await answer.text()];
}

type Row = [string, () => unknown, unknown];

/** Where a closed file lies: the label, the root, the path, and whether an app may name it. */
const PLACES: [string, string, string, boolean][] = [
    ['a root over the state folder', 'st', 'approvals.json', false],
    ['a folder of the state folder', 'st', 'calendar/c.ics', false],
    [
        'the state folder inside a root over the home folder',
        'home',
        'oculus-state/approvals.json',
        true
    ],
    ['the hub secrets folder through a root over the hub', 'hub', 'secrets/k.json', true],
    [
        'the placed history folder through a root over its parent',
        'histparent',
        'history/f.json',
        true
    ],
    ['a link of another root into the state folder', 'one', 'link.json', true]
];

const CLOSED_ROWS: Row[] = PLACES.flatMap(([label, root, path, declarable]): Row[] => [
    [`open of ${label}`, () => opened(world(), root, path), 'closed'],
    [
        `a custom editor's read of ${label}`,
        async () => (await documentRead(world(), root, path)).word,
        'closed'
    ],
    ...(declarable
        ? ([
              [`fs.readFile of ${label}`, () => fsRead(world(), root, path), [403, 'closed']]
          ] as Row[])
        : [])
]);

const OPEN_ROWS: Row[] = [
    [
        'fs.readFile of an ordinary file of a root over the home folder',
        async () => (await fsRead(world(), 'home', 'notes/a.md'))[0],
        200
    ],
    [
        'an ordinary file of a root over the home folder is not closed',
        () => opened(world(), 'home', 'notes/a.md'),
        'ok'
    ],
    [
        'an ordinary file of a root over the hub is not closed',
        () => opened(world(), 'hub', 'projects/a.md'),
        'ok'
    ],
    [
        'a custom editor reads the ordinary file it was opened on',
        async () => (await documentRead(world(), 'one', 'x.json')).ok,
        true
    ]
];

/** The ids of the apps a manifest with these `files` entries is offered as. */
const offeredFor = (entry: string): string[] =>
    routeSetup({
        machine: notesFiles(`name: notes\ntitle: Notes\nbridge: 1\nfiles: [${entry}]\n`),
        roots: ROOTS,
        privateFolders: closed
    })
        .held()
        .apps.map((one) => one.id);

const FILES_ROWS: Row[] = [
    ['a root over the state folder', () => offeredFor('st'), []],
    ['a folder below the state folder', () => offeredFor('st/calendar'), []],
    [
        'a root over a home folder that holds the state folder',
        () => offeredFor('home'),
        ['app:notes']
    ],
    [
        'a folder of that home folder beside the state folder',
        () => offeredFor('home/notes'),
        ['app:notes']
    ]
];

describe('the folders closed to every app', () => {
    it("are the state folder, the hub secrets, the hub local.yml and each state file local.yml or the hub's config.yml places elsewhere", () => {
        const base = plantScratch('oculus-private-', {
            'home/.oculus/approvals.json': '{}',
            'hub/secrets/k': 'k',
            'hub/.oculus/local.yml': 'port: 1\n',
            'placed/history/f.json': '{}',
            'placed/marks.yml': 'entries: []\n'
        });
        const local = {
            port: 1,
            claudeBin: '',
            riteDapBin: '',
            accounts: [],
            calendars: [],
            mail: [],
            downloads: [],
            clusters: [],
            self: '',
            history: join(base, 'placed', 'history')
        };
        const set = closedToApps({
            home: join(base, 'home'),
            local,
            perOculus: {
                bookmarks: join(base, 'placed', 'marks.yml'),
                schedules: null,
                appsDir: null
            },
            roots: [{ key: 'hub', dir: join(base, 'hub'), hub: true }]
        });
        const real = (path: string) => realpathSync(join(base, path));
        expect(set.sort()).toEqual(
            [
                real('home/.oculus'),
                real('hub/secrets'),
                real('hub/.oculus/local.yml'),
                real('placed/history'),
                real('placed/marks.yml')
            ].sort()
        );
    });
});

describe('a file of a closed folder', () => {
    it.each(CLOSED_ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});

describe('a file that is not in a closed folder', () => {
    it.each(OPEN_ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});

describe('a files entry', () => {
    it.each(FILES_ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
