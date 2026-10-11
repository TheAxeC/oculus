// Layer 4, server test. The reader of the apps folders DESIGN.md's "Apps added while oculus runs"
// describes: each folder with an `app.yml` read to its row and its findings, the id and the finding
// key an app is known by, and the approval a row carries.
//
// Every folder here is synthetic, under the system temporary directory. What this does NOT cover:
// the watcher that calls the reader (tests/server/root/watch) and the shipped config's glyph
// vocabulary beyond the names the table uses.
// @module-tag slow: one row writes a folder of 501 files and one of more than 20 MB.

import { chmodSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import { addressKey } from '../../../../src/lib/server/machine/apps/serve/address.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';
import {
    MANIFEST,
    PAGE,
    PORT,
    again,
    catalog,
    found,
    notes,
    offered,
    plain,
    read,
    words,
    type Layout,
    type Row
} from './manifest-fixture.ts';

type Folder = [string, Record<string, string>, string[], (readonly [string, string])[]];

/** Rows that read one machine apps folder: the ids offered and the findings, key and sentence. */
const FOLDERS: Folder[] = [
    ['a valid manifest', notes(MANIFEST), ['app:notes'], []],
    [
        'a stray file, a hidden folder and a folder with no manifest',
        {
            'stray.txt': 'x',
            '.hidden/app.yml': MANIFEST.replace('notes', 'hidden'),
            'empty/index.html': PAGE
        },
        [],
        []
    ],
    [
        'a manifest that does not parse',
        { 'notes/app.yml': 'name: [\n', 'notes/index.html': PAGE },
        [],
        [['apps[notes]', findingText(catalog, 'findings.file.does_not_parse', 'x')]]
    ],
    [
        'a manifest that is a list',
        { 'notes/app.yml': '- a\n', 'notes/index.html': PAGE },
        [],
        [['apps[notes]', findingText(catalog, 'findings.file.not_a_map')]]
    ],
    [
        'no name',
        notes('title: Reading notes\nbridge: 1\n'),
        [],
        [['apps[notes]', words('name_empty')]]
    ],
    [
        'an upper-case name',
        notes('name: Notes\ntitle: Reading notes\nbridge: 1\n'),
        [],
        [['apps[notes]', words('name_shape', 'Notes')]]
    ],
    [
        'a name holding a slash',
        notes('name: a/b\ntitle: Reading notes\nbridge: 1\n'),
        [],
        [['apps[notes]', words('name_shape', 'a/b')]]
    ],
    [
        'a name that starts with a hyphen',
        notes('name: -x\ntitle: Reading notes\nbridge: 1\n'),
        [],
        [['apps[notes]', words('name_shape', '-x')]]
    ],
    [
        'a name that starts with an at sign',
        notes("name: '@x'\ntitle: Reading notes\nbridge: 1\n"),
        [],
        [['apps[notes]', words('name_shape', '@x')]]
    ],
    [
        'a name of 41 characters',
        notes(`name: a${'b'.repeat(40)}\ntitle: Reading notes\nbridge: 1\n`),
        [],
        [['apps[notes]', words('name_shape', `a${'b'.repeat(40)}`)]]
    ],
    [
        'a name that is not the folder name',
        notes('name: todo\ntitle: Reading notes\nbridge: 1\n'),
        [],
        [['apps[notes]', words('name_not_folder', 'todo', 'notes')]]
    ],
    [
        'no title',
        notes('name: notes\nbridge: 1\n'),
        [],
        [['apps[notes]', words('key_missing', 'title')]]
    ],
    [
        'a title of 41 characters',
        notes(`name: notes\ntitle: ${'t'.repeat(41)}\nbridge: 1\n`),
        [],
        [['apps[notes]', words('title_shape')]]
    ],
    [
        'a title holding a tab',
        notes('name: notes\ntitle: "a\\tb"\nbridge: 1\n'),
        [],
        [['apps[notes]', words('title_shape')]]
    ],
    [
        'a description of 201 characters',
        notes(`${MANIFEST}description: ${'d'.repeat(201)}\n`),
        [],
        [['apps[notes]', words('description_shape')]]
    ],
    [
        'a bridge version this oculus does not read',
        notes('name: notes\ntitle: Reading notes\nbridge: 2\n'),
        [],
        [['apps[notes]', words('bridge_unknown', '2')]]
    ],
    [
        'a key this oculus does not read',
        notes(`${MANIFEST}foo: 1\n`),
        [],
        [['apps[notes]', words('key_unknown', 'foo')]]
    ],
    [
        'an entry that climbs out of the folder',
        notes(`${MANIFEST}entry: ../x.html\n`),
        [],
        [['apps[notes]', words('entry_shape', '../x.html')]]
    ],
    [
        'an entry under a dot-led folder',
        notes(`${MANIFEST}entry: .a/index.html\n`),
        [],
        [['apps[notes]', words('entry_shape', '.a/index.html')]]
    ],
    [
        'an entry with an empty segment',
        notes(`${MANIFEST}entry: a//b.html\n`),
        [],
        [['apps[notes]', words('entry_shape', 'a//b.html')]]
    ],
    [
        'an entry that does not end in .html',
        notes(`${MANIFEST}entry: index.htm\n`),
        [],
        [['apps[notes]', words('entry_shape', 'index.htm')]]
    ],
    [
        'an entry that is not a file of the app',
        notes(`${MANIFEST}entry: missing.html\n`),
        [],
        [['apps[notes]', words('entry_missing', 'missing.html')]]
    ],
    [
        'no entry and no index.html',
        { 'notes/app.yml': MANIFEST },
        [],
        [['apps[notes]', words('entry_missing', 'index.html')]]
    ],
    [
        'a channel read twice',
        notes(`${MANIFEST}reads: [portfolio, portfolio]\n`),
        [],
        [['apps[notes]', words('list_repeated', 'portfolio', 'reads')]]
    ],
    [
        'an origin written twice, once with a slash',
        notes(`${MANIFEST}connects: ['https://a.org', 'https://a.org/']\n`),
        [],
        [['apps[notes]', words('list_repeated', 'https://a.org', 'connects')]]
    ],
    [
        'a read of a channel that does not exist',
        notes(`${MANIFEST}reads: [weather]\n`),
        [],
        [['apps[notes]', words('channel_unknown', 'weather')]]
    ],
    [
        'a write that does not exist',
        notes(`${MANIFEST}writes: [frobnicate]\n`),
        [],
        [['apps[notes]', words('write_unknown', 'frobnicate')]]
    ],
    [
        'a read of the apps channel',
        notes(`${MANIFEST}reads: [apps]\n`),
        [],
        [
            [
                'apps[notes]',
                words('channel_closed', 'apps', words('who_every'), words('carries.apps').trim())
            ]
        ]
    ],
    [
        'a read of a terminal channel',
        notes(`${MANIFEST}reads: ['pty:1']\n`),
        [],
        [
            [
                'apps[notes]',
                words('channel_closed', 'pty:1', words('who_every'), words('carries.pty').trim())
            ]
        ]
    ],
    [
        'a read of the processes channel',
        notes(`${MANIFEST}reads: [processes]\n`),
        [],
        [
            [
                'apps[notes]',
                words(
                    'channel_closed',
                    'processes',
                    words('who_every'),
                    words('carries.processes').trim()
                )
            ]
        ]
    ],
    [
        'a read of the app-hosts channel',
        notes(`${MANIFEST}reads: [app-hosts]\n`),
        [],
        [
            [
                'apps[notes]',
                words(
                    'channel_closed',
                    'app-hosts',
                    words('who_every'),
                    words('carries.app_hosts').trim()
                )
            ]
        ]
    ],
    [
        'a read of the app-messages channel',
        notes(`${MANIFEST}reads: [app-messages]\n`),
        [],
        [
            [
                'apps[notes]',
                words(
                    'channel_closed',
                    'app-messages',
                    words('who_every'),
                    words('carries.app_messages').trim()
                )
            ]
        ]
    ],
    ['a machine app reading the inbox', notes(`${MANIFEST}reads: [inbox]\n`), ['app:notes'], []],
    [
        'a write of an undo',
        notes(`${MANIFEST}writes: [undo]\n`),
        [],
        [['apps[notes]', words('write_closed', 'undo')]]
    ],
    [
        'a write of the rail',
        notes(`${MANIFEST}writes: [rail]\n`),
        [],
        [['apps[notes]', words('write_closed', 'rail')]]
    ],
    [
        'a write of a session',
        notes(`${MANIFEST}writes: [session]\n`),
        [],
        [['apps[notes]', words('write_closed', 'session')]]
    ],
    [
        'a write of the app store',
        notes(`${MANIFEST}writes: [app-store]\n`),
        [],
        [['apps[notes]', words('write_closed', 'app-store')]]
    ],
    [
        'a write the implied inputs name',
        notes(`${MANIFEST}writes: [radar-add]\n`),
        ['app:notes'],
        []
    ],
    [
        'an https origin and a localhost origin on another port',
        notes(`${MANIFEST}connects: ['https://api.example.org', 'http://localhost:9000']\n`),
        ['app:notes'],
        []
    ],
    [
        'an origin with a trailing slash',
        notes(`${MANIFEST}connects: ['https://api.example.org/']\n`),
        ['app:notes'],
        []
    ],
    ...[
        'https://u@h.org',
        'https://h.org/p',
        'https://h.org?q=1',
        'https://*.h.org',
        'ftp://h.org',
        'wss://h.org',
        'http://example.org',
        `http://localhost:${PORT}`
    ].map((origin): [string, Record<string, string>, string[], (readonly [string, string])[]] => [
        `the origin ${origin}`,
        notes(`${MANIFEST}connects: ['${origin}']\n`),
        [],
        [['apps[notes]', words('connect_shape', origin)]]
    ]),
    [
        'a glyph that is not in the vocabulary',
        notes(`${MANIFEST}glyph: nonesuch\n`),
        ['app:notes'],
        [['apps[notes]', words('glyph_unknown', 'nonesuch')]]
    ],
    [
        'the reserved glyph',
        notes(`${MANIFEST}glyph: app\n`),
        ['app:notes'],
        [['apps[notes]', words('glyph_unknown', 'app')]]
    ]
];

const oneFolder = ([label, machine, ids, findings]: Folder): Row => [
    label,
    () => ({
        ids: offered({ machine }),
        findings: found({ machine }).map(([key, message]) => [key, plain(message)])
    }),
    { ids, findings: findings.map(([key, message]) => [key, plain(message)]) }
];

const TWO = {
    'repo/.oculus/apps/notes/app.yml': MANIFEST,
    'repo/.oculus/apps/notes/index.html': PAGE
};

const ROWS: Row[] = [
    ...FOLDERS.map(oneFolder),
    [
        'a glyph that is not offered and no glyph, both drawn as the default glyph',
        () => {
            const unknown = read({ machine: notes(`${MANIFEST}glyph: nonesuch\n`) }).scanned;
            const none = read({ machine: notes(MANIFEST) }).scanned;
            return [unknown.apps[0].row.glyph, none.apps[0].row.glyph];
        },
        ['app_view', 'app_view']
    ],
    [
        'a valid manifest as the first row, unapproved and with no key',
        () => {
            const { name, root, title, approved, key, entry, reads, writes, connects } = read({
                machine: notes(MANIFEST)
            }).scanned.apps[0].row;
            return { name, root, title, approved, key, entry, reads, writes, connects };
        },
        {
            name: 'notes',
            root: '',
            title: 'Reading notes',
            approved: false,
            key: '',
            entry: 'index.html',
            reads: [],
            writes: [],
            connects: []
        }
    ],
    [
        'a folder of 501 files, and one of more than 20 MB',
        () => {
            const many: Record<string, string> = { ...notes(MANIFEST) };
            for (let index = 0; index < 501; index += 1) many[`notes/f${index}.txt`] = 'x';
            const heavy = { ...notes(MANIFEST), 'notes/big.bin': 'x'.repeat(21 * 1024 * 1024) };
            return {
                many: [offered({ machine: many }), found({ machine: many }).map(([key]) => key)],
                heavy: offered({ machine: heavy })
            };
        },
        { many: [[], ['apps[notes]']], heavy: [] }
    ],
    [
        'a name two folders both claim',
        () => {
            const machine = {
                'a/app.yml': 'name: a\ntitle: A\nbridge: 1\n',
                'a/index.html': PAGE,
                'b/app.yml': 'name: a\ntitle: A\nbridge: 1\n',
                'b/index.html': PAGE
            };
            return [offered({ machine }), found({ machine })];
        },
        [['app:a'], [['apps[b]', words('name_not_folder', 'a', 'b')]]]
    ],
    [
        'a symbolic link and a dot-led file, which the files and the hash ignore',
        () => {
            const first = read({ machine: { ...notes(MANIFEST), 'notes/.env': 'one' } });
            const machine = join(first.base, 'machine');
            symlinkSync('/etc/hosts', join(machine, 'notes', 'hosts-link'));
            writeFileSync(join(machine, 'notes', '.env'), 'two');
            const second = again(first.base, machine, []);
            const sameHash = second.apps[0].row.hash === first.scanned.apps[0].row.hash;
            writeFileSync(join(machine, 'notes', 'index.html'), `${PAGE}changed`);
            const editedHash = again(first.base, machine, []).apps[0].row.hash;
            return {
                files: second.apps[0].files.map((one) => one.path),
                sameHash,
                editedHashDiffers: editedHash !== first.scanned.apps[0].row.hash
            };
        },
        { files: ['app.yml', 'index.html'], sameHash: true, editedHashDiffers: true }
    ],
    [
        'an apps folder that is a link out of its root',
        () => {
            const base = plantScratch(
                'oculus-apps-outside-',
                {
                    'outside/notes/app.yml': MANIFEST,
                    'outside/notes/index.html': PAGE,
                    'root/keep.txt': 'x'
                },
                ['root/.oculus']
            );
            symlinkSync(join(base, 'outside'), join(base, 'root', '.oculus', 'apps'));
            const scanned = again(base, null, [{ key: 'repo', dir: join(base, 'root') }]);
            return [scanned.apps, scanned.findings.map((one) => one.key)];
        },
        [[], ['apps[repo/]']]
    ],
    [
        'one folder reached through two roots',
        () => {
            const base = plantScratch('oculus-apps-twice-', TWO);
            symlinkSync(join(base, 'repo'), join(base, 'repo-link'));
            const scanned = again(base, null, [
                { key: 'one', dir: join(base, 'repo') },
                { key: 'two', dir: join(base, 'repo-link') }
            ]);
            return [scanned.apps.map((one) => one.id), scanned.findings.map((one) => one.key)];
        },
        [['app:one/notes'], ['apps[two/]']]
    ],
    [
        'the hub apps folder, which is the machine folder by default',
        () => {
            const base = plantScratch('oculus-apps-hub-', {
                'hub/.oculus/apps/notes/app.yml': MANIFEST,
                'hub/.oculus/apps/notes/index.html': PAGE
            });
            const scanned = again(base, join(base, 'hub', '.oculus', 'apps'), [
                { key: 'hub', dir: join(base, 'hub') }
            ]);
            return [scanned.apps.map((one) => one.id), scanned.findings.map((one) => one.key)];
        },
        [['app:notes'], []]
    ],
    [
        'an apps_dir that is a root apps folder',
        () => {
            const base = plantScratch('oculus-apps-dir-', TWO);
            const scanned = again(base, join(base, 'repo', '.oculus', 'apps'), [
                { key: 'one', dir: join(base, 'repo') }
            ]);
            return [scanned.apps.map((one) => one.id), scanned.findings.map((one) => one.key)];
        },
        [['app:notes'], ['apps[one/]']]
    ],
    [
        'three folders named notes, one approved by its hash',
        () => {
            const layout: Layout = {
                machine: notes(MANIFEST),
                roots: {
                    cathedra: {
                        '.oculus/apps/notes/app.yml': MANIFEST,
                        '.oculus/apps/notes/index.html': PAGE
                    },
                    ordo: {
                        '.oculus/apps/notes/app.yml': MANIFEST,
                        '.oculus/apps/notes/index.html': PAGE
                    }
                }
            };
            const first = read(layout);
            const hashes = first.scanned.apps.map((one) => one.row.hash);
            const second = again(
                first.base,
                join(first.base, 'machine'),
                ['cathedra', 'ordo'].map((key) => ({ key, dir: join(first.base, 'roots', key) })),
                new Set([hashes[1]])
            );
            return {
                ids: first.scanned.apps.map((one) => one.id),
                hashes: new Set(hashes).size,
                approved: second.apps.map((one) => one.row.approved),
                findings: first.scanned.findings
            };
        },
        {
            ids: ['app:notes', 'app:cathedra/notes', 'app:ordo/notes'],
            hashes: 3,
            approved: [false, true, false],
            findings: []
        }
    ],
    [
        'an approved row, whose address key comes from its id and hash',
        () => {
            const first = read({ machine: notes(MANIFEST) });
            const hash = first.scanned.apps[0].row.hash;
            const approved = again(first.base, join(first.base, 'machine'), [], new Set([hash]));
            const key = approved.apps[0].row.key;
            return [key === addressKey('secret', 'app:notes', hash), /^[0-9a-f]{32}$/.test(key)];
        },
        [true, true]
    ],
    [
        'a root app reading the inbox, with the sentence naming a root app',
        () => {
            const layout: Layout = {
                roots: {
                    hub: {
                        '.oculus/apps/todo/app.yml':
                            'name: todo\ntitle: Todo\nbridge: 1\nreads: [inbox]\n',
                        '.oculus/apps/todo/index.html': PAGE
                    }
                }
            };
            return [offered(layout), found(layout)];
        },
        [
            [],
            [
                [
                    'apps[hub/todo]',
                    words(
                        'channel_closed',
                        'inbox',
                        words('who_root'),
                        words('carries.inbox').trim()
                    )
                ]
            ]
        ]
    ],
    [
        'an app named focus, which no built-in view takes',
        () =>
            offered({
                machine: {
                    'focus/app.yml': 'name: focus\ntitle: Focus\nbridge: 1\n',
                    'focus/index.html': PAGE
                }
            }),
        ['app:focus']
    ],
    [
        'a manifest that cannot be read',
        () => {
            const first = read({ machine: notes(MANIFEST) });
            const file = join(first.base, 'machine', 'notes', 'app.yml');
            chmodSync(file, 0o000);
            const second = again(first.base, join(first.base, 'machine'), []);
            chmodSync(file, 0o644);
            return [
                second.apps,
                second.findings.map((one) => one.key),
                second.findings[0].message.includes('does not parse')
            ];
        },
        [[], ['apps[notes]'], true]
    ],
    [
        'a root key holding a slash',
        () => {
            const layout: Layout = {
                roots: {
                    'a/b': {
                        '.oculus/apps/todo/app.yml': 'name: todo\ntitle: Todo\nbridge: 1\n',
                        '.oculus/apps/todo/index.html': PAGE,
                        '.oculus/apps/bad/app.yml': 'name: [\n'
                    }
                }
            };
            return [offered(layout), found(layout).map(([key]) => key)];
        },
        [['app:a/b/todo'], ['apps[a/b/bad]']]
    ],
    [
        'a root key holding a space',
        () => {
            const layout: Layout = {
                roots: {
                    'my repo': {
                        '.oculus/apps/todo/app.yml': 'name: todo\ntitle: Todo\nbridge: 1\n',
                        '.oculus/apps/todo/index.html': PAGE
                    }
                }
            };
            return offered(layout);
        },
        ['app:my repo/todo']
    ],
    [
        'the engine folder, which is no root of apps',
        () => {
            const base = plantScratch('oculus-apps-engine-', {
                'cfg/.oculus/apps/x/app.yml': 'name: x\ntitle: X\nbridge: 1\n',
                'cfg/.oculus/apps/x/index.html': PAGE
            });
            const scanned = again(base, null, [{ key: 'engine', dir: join(base, 'cfg') }]);
            return [scanned.apps, scanned.findings];
        },
        [[], []]
    ],
    [
        'an apps_dir that is a file',
        () => {
            const base = plantScratch('oculus-apps-file-', { machine: 'not a folder' });
            const scanned = again(base, join(base, 'machine'), []);
            return {
                apps: scanned.apps,
                findings: scanned.findings.map((one) => [
                    one.file.replace(base, ''),
                    one.key,
                    one.message.replace(base, '')
                ])
            };
        },
        {
            apps: [],
            findings: [['/local.yml', 'apps_dir', words('apps_dir_not_folder', '/machine')]]
        }
    ]
];

describe('reads each apps folder to its rows and its findings', () => {
    it.each(ROWS)('%s', (_row, observe, expected) => {
        expect(observe()).toEqual(expected);
    });
});
