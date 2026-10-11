// Layer 4, server test. The reader of the apps folders, for the keys of a host: `host`, `files`,
// `secrets`, `activation` and `depends` read to their row fields and their findings, and the
// approval a root app keeps while its files are edited.
//
// Every folder here is synthetic, under the system temporary directory. What this does NOT cover:
// the watcher that calls the reader (tests/server/root/watch).

import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import { MANIFEST, PAGE, notes, read, words, type Layout, type Row } from './manifest-fixture.ts';

/** The manifest of `notes` with the keys of a host added, and the host file `host.mjs`. */
const hosted = (keys: string, extra: Record<string, string> = {}): Record<string, string> => ({
    ...notes(`${MANIFEST}${keys}`),
    'notes/host.mjs': 'export function activate() {}\n',
    ...extra
});

/** A shown root `hub` holding a folder `projects`, for a machine app that names `files`. */
const HUB: Layout['roots'] = { hub: { 'projects/a.md': 'a\n' } };

type Hosted = [string, Layout, string[], (readonly [string, string])[]];

const refusedHost = (message: string): (readonly [string, string])[] => [['apps[notes]', message]];

/** Rows that read a layout with the keys of a host: the ids offered and the findings. */
const HOSTED: Hosted[] = [
    ['host.mjs with the file present', { machine: hosted('host: host.mjs\n') }, ['app:notes'], []],
    ...['host.ts', '../x.js', '.h/x.js'].map((host): Hosted => [
        `the host ${host}`,
        { machine: hosted(`host: ${host}\n`) },
        [],
        refusedHost(words('host_shape', host))
    ]),
    [
        'a host file that is missing',
        { machine: hosted('host: missing.js\n') },
        [],
        refusedHost(words('host_missing', 'missing.js'))
    ],
    [
        'files naming a folder of a shown root',
        { machine: hosted('files: [hub/projects]\n'), roots: HUB },
        ['app:notes'],
        []
    ],
    ...(
        [
            ['engine', 'files_engine'],
            ['hub/secrets', 'files_closed'],
            ['hub/.git', 'files_shape'],
            ['hub/a//b', 'files_shape']
        ] as const
    ).map(([entry, key]): Hosted => [
        `files naming ${entry}`,
        { machine: hosted(`files: [${entry}]\n`), roots: HUB },
        [],
        refusedHost(words(key, entry))
    ]),
    [
        'files naming a root that is not shown',
        { machine: hosted('files: [nosuchroot/x]\n'), roots: HUB },
        ['app:notes'],
        []
    ],
    [
        'files on a root app',
        {
            roots: {
                hub: {
                    '.oculus/apps/notes/app.yml': `${MANIFEST}files: [hub/x]\n`,
                    '.oculus/apps/notes/index.html': PAGE
                }
            }
        },
        [],
        [['apps[hub/notes]', words('files_root_app')]]
    ],
    ['secrets true', { machine: notes(`${MANIFEST}secrets: true\n`) }, ['app:notes'], []],
    ...['yes', '1'].map((value): Hosted => [
        `secrets ${value}`,
        { machine: notes(`${MANIFEST}secrets: ${value}\n`) },
        [],
        refusedHost(words('secrets_value', value === 'yes' ? 'yes' : '1'))
    ]),
    [
        'two events of a host',
        {
            machine: hosted(
                "activation: [onStartupFinished, 'workspaceContains:**/*.tex']\nhost: host.mjs\n"
            )
        },
        ['app:notes'],
        []
    ],
    [
        'an event no host reads',
        { machine: hosted('host: host.mjs\nactivation: [onBoot]\n') },
        [],
        refusedHost(words('event_unknown', 'onBoot'))
    ],
    [
        'an event with nothing after its colon',
        { machine: hosted("host: host.mjs\nactivation: ['onCommand:']\n") },
        [],
        refusedHost(words('event_empty', 'onCommand:'))
    ],
    [
        'activation without a host',
        { machine: notes(`${MANIFEST}activation: [onTab]\n`) },
        [],
        refusedHost(words('activation_no_host'))
    ],
    [
        'an event written twice',
        { machine: hosted('host: host.mjs\nactivation: [onTab, onTab]\n') },
        [],
        refusedHost(words('list_repeated', 'onTab', 'activation'))
    ],
    [
        'depends naming another app',
        { machine: hosted('host: host.mjs\ndepends: [base]\n') },
        ['app:notes'],
        []
    ],
    [
        'depends naming an app that is not there',
        { machine: hosted('host: host.mjs\ndepends: [absent]\n') },
        ['app:notes'],
        []
    ],
    [
        'depends with an upper-case name',
        { machine: hosted('host: host.mjs\ndepends: [Base]\n') },
        [],
        refusedHost(words('depends_name', 'Base'))
    ],
    [
        'depends naming the app itself',
        { machine: hosted('host: host.mjs\ndepends: [notes]\n') },
        [],
        refusedHost(words('depends_self', 'notes'))
    ],
    [
        'a dependency written twice',
        { machine: hosted('host: host.mjs\ndepends: [base, base]\n') },
        [],
        refusedHost(words('list_repeated', 'base', 'depends'))
    ]
];

const hostRow = ([label, layout, ids, findings]: Hosted): Row => [
    label,
    () => ({
        ids: read(layout).scanned.apps.map((one) => one.id),
        findings: read(layout).scanned.findings.map((one) => [one.key, one.message])
    }),
    { ids, findings: findings.map(([key, message]) => [key, message]) }
];

const HOST_ROWS: Row[] = [
    ...HOSTED.map(hostRow),
    [
        'the row of a host app carries its host, folders, secrets, events and dependencies',
        () => {
            const row = read({
                machine: hosted(
                    'host: host.mjs\nfiles: [hub/projects]\nsecrets: true\nactivation: [onStartupFinished]\ndepends: [base]\n'
                ),
                roots: HUB
            }).scanned.apps[0].row;
            return [row.host, row.readFolders, row.secrets, row.activation, row.depends];
        },
        ['host.mjs', ['hub/projects'], true, ['onStartupFinished'], ['base']]
    ],
    [
        'a host without activation is activated by a tab',
        () => read({ machine: hosted('host: host.mjs\n') }).scanned.apps[0].row.activation,
        ['onTab']
    ],
    [
        'a root key holding a slash, with files naming a folder under it',
        () => {
            const layout: Layout = {
                machine: hosted('files: [my/repo/src]\n'),
                roots: { 'my/repo': { 'src/a.ts': 'a\n' } }
            };
            return read(layout).scanned.apps.map((one) => [one.id, one.row.readFolders]);
        },
        [['app:notes', ['my/repo/src']]]
    ]
];

/** A root app `notes` of the root `one`, with the given manifest and page. */
const rootApp = (manifest: string, page: string): Layout => ({
    roots: {
        one: { '.oculus/apps/notes/app.yml': manifest, '.oculus/apps/notes/index.html': page }
    }
});

const KEPT_ROWS: Row[] = [
    [
        'stays approved when a file other than app.yml changes, and is asked again when app.yml changes',
        () => {
            const first = read(rootApp(MANIFEST, PAGE)).scanned.apps[0];
            const keptAt = (): Map<string, string> =>
                new Map([['app:one/notes', first.manifestHash]]);
            const page = read(rootApp(MANIFEST, `${PAGE}<p>edited</p>\n`), new Set(), keptAt());
            const manifest = read(
                rootApp(`${MANIFEST}description: edited\n`, PAGE),
                new Set(),
                keptAt()
            );
            const one = (held: ReturnType<typeof read>) => held.scanned.apps[0].row;
            return [
                [one(page).approved, one(page).kept],
                [one(manifest).approved, one(manifest).kept]
            ];
        },
        [
            [true, true],
            [false, false]
        ]
    ]
];

describe('reads the keys of a host in a manifest', () => {
    it.each(HOST_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});

describe('keeps a root app approved while its files are edited', () => {
    it.each(KEPT_ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});
