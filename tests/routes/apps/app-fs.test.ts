// Layer 2, route tests. What /apps/<name>/<key>/.fs, .dir and .stat answer: the bytes, names and
// stat of a root's files for an app that may read them, and the refusal word or the empty 404
// for everything else. The route is the lines of src/routes/apps/ that hand the request to
// serveApp (lib/server/machine/apps/serve/serve.ts), which is what this calls.
//
// Every folder is synthetic, under the system temporary directory, and `closed_paths` is the
// shipped default. What this does NOT cover: the page's own check before it asks for an address
// (tests/state/system/apps/methods.test.ts) and the frame fetching the address.

import { symlinkSync, truncateSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { appOf } from '../../../src/lib/server/machine/apps/read/held.ts';
import { diskFs } from '../../../src/lib/server/machine/apps/reach/open.ts';
import { serveApp } from '../../../src/lib/server/machine/apps/serve/serve.ts';
import { it } from '../../fixtures/scratch.ts';
import { approvedHeld, notesFiles, PAGE, plant, PORT, serveInput } from './apps-fixture.ts';

const ORIGIN = `http://localhost:${PORT}`;

const app = (keys: string): Record<string, string> =>
    notesFiles(`name: notes\ntitle: Notes\nbridge: 1\n${keys}`);

const HUB = {
    'projects/a/README.md': 'hello',
    'projects/.env': 'secret=1',
    'projects/sub/b.txt': 'b',
    'feeds/x.yml': 'x: 1',
    'secrets/k': 'key',
    'a.txt': 'a',
    '.env': 'e'
};

const TODO = {
    '.oculus/apps/todo/app.yml': 'name: todo\ntitle: Todo\nbridge: 1\n',
    '.oculus/apps/todo/index.html': PAGE,
    'src/x.ts': 'let x = 1;\n'
};

/** A world: the app `notes` with these keys, a root `hub` and a root app in the root `one`. */
function world(keys: string, over: { approve?: boolean } = {}) {
    const fixture = plant({
        machine: app(keys),
        roots: { hub: HUB, one: TODO, two: { 'y.txt': 'y' } }
    });
    outside(fixture.roots.find((one) => one.key === 'hub')?.dir ?? '', fixture.base);
    const held = over.approve === false ? fixture.scan(new Set()) : approvedHeld(fixture);
    const reach = () => ({
        roots: fixture.roots,
        configDir: join(fixture.base, 'engine'),
        closedPaths: ['secrets'],
        privateReal: [],
        fs: diskFs,
        scanEntries: 100
    });
    const key = appOf(held, '', 'notes')?.row.key ?? '';
    const todoKey = appOf(held, 'one', 'todo')?.row.key ?? '';
    const ask = (path: string, init: RequestInit = {}) =>
        serveApp({ ...serveInput(new Request(`${ORIGIN}${path}`, init), held), reach });
    return { fixture, held, key, todoKey, ask };
}

/** A file outside the root, and a link to it from inside the root's `projects`. */
function outside(hub: string, base: string): void {
    writeFileSync(join(base, 'outside.txt'), 'outside');
    symlinkSync(join(base, 'outside.txt'), join(hub, 'projects', 'link.txt'));
}

/** An answer as a row compares it: status and body. */
const plain = async (answer: Response) => [answer.status, await answer.text()];

type Row = [string, () => unknown, unknown];

const READ = '.fs/hub/projects';

const ROWS: Row[] = [
    [
        'a file inside a declared folder, with its bytes and the headers that keep it from being drawn',
        async () => {
            const w = world('files: [hub/projects]\n');
            const answer = w.ask(`/apps/notes/${w.key}/${READ}/a/README.md`);
            return {
                status: answer.status,
                body: await answer.text(),
                type: answer.headers.get('content-type'),
                nosniff: answer.headers.get('x-content-type-options'),
                disposition: answer.headers.get('content-disposition'),
                sandboxed: answer.headers.get('content-security-policy')?.startsWith('sandbox'),
                cache: answer.headers.get('cache-control')
            };
        },
        {
            status: 200,
            body: 'hello',
            type: 'application/octet-stream',
            nosniff: 'nosniff',
            disposition: 'attachment',
            sandboxed: true,
            cache: 'no-store'
        }
    ],
    ...(
        [
            [
                'a file outside the declared folders',
                'files: [hub/projects]\n',
                '.fs/hub/feeds/x.yml',
                [403, 'not_declared']
            ],
            [
                'an escaped dot segment that climbs out of the declared folder',
                'files: [hub/projects]\n',
                `${READ}/%2e%2e/secrets/k`,
                [403, 'not_declared']
            ],
            [
                'a path under a dot-led folder',
                'files: [hub/projects]\n',
                `${READ}/.git/config`,
                [403, 'closed']
            ],
            ['a dot-led file', 'files: [hub/projects]\n', `${READ}/.env`, [403, 'closed']],
            [
                'a path of a folder closed_paths names',
                'files: [hub]\n',
                '.fs/hub/secrets/k',
                [403, 'closed']
            ],
            [
                'a link inside the folder to a file outside the root',
                'files: [hub/projects]\n',
                `${READ}/link.txt`,
                [403, 'closed']
            ],
            ['the engine root', 'files: [hub]\n', '.fs/engine/x', [403, 'closed']],
            [
                'a file that is not there',
                'files: [hub/projects]\n',
                `${READ}/a/none.md`,
                [404, 'missing']
            ],
            [
                'a root that is not shown',
                'files: [nosuchroot/x]\n',
                '.fs/nosuchroot/x/a',
                [404, 'missing']
            ]
        ] as [string, string, string, [number, string]][]
    ).map(([label, keys, path, expected]): Row => [
        `${label}, refused ${expected[1]} as plain text`,
        async () => {
            const w = world(keys);
            return plain(w.ask(`/apps/notes/${w.key}/${path}`));
        },
        expected
    ]),
    [
        'a root app reading its own root, and the root of another',
        async () => {
            const w = world('files: [hub/projects]\n');
            const own = await plain(w.ask(`/apps/@one/todo/${w.todoKey}/.fs/one/src/x.ts`));
            const other = await plain(w.ask(`/apps/@one/todo/${w.todoKey}/.fs/two/y.txt`));
            return [own, other];
        },
        [
            [200, 'let x = 1;\n'],
            [403, 'closed']
        ]
    ],
    [
        'a listing of a folder, which leaves out a dot-led name and a folder closed_paths names',
        async () => {
            const w = world('files: [hub]\n');
            const answer = w.ask(`/apps/notes/${w.key}/.dir/hub`);
            const names = (await answer.json()) as [string, number][];
            return [answer.status, answer.headers.get('content-type'), names.sort()];
        },
        [
            200,
            'application/json',
            [
                ['a.txt', 1],
                ['feeds', 2],
                ['projects', 2]
            ]
        ]
    ],
    [
        'a listing of a folder over apps.scan_entries, which answers the names it read first',
        async () => {
            const w = world('files: [hub]\n');
            const small = serveApp({
                ...serveInput(
                    new Request(`${ORIGIN}/apps/notes/${w.key}/.dir/hub/projects`),
                    w.held
                ),
                reach: () => ({
                    roots: w.fixture.roots,
                    configDir: join(w.fixture.base, 'engine'),
                    closedPaths: ['secrets'],
                    privateReal: [],
                    fs: diskFs,
                    scanEntries: 2
                })
            });
            return ((await small.json()) as unknown[]).length;
        },
        2
    ],
    [
        'a stat of a file and of a folder, with the type, the times and the size',
        async () => {
            const w = world('files: [hub]\n');
            const file = (await w.ask(`/apps/notes/${w.key}/.stat/hub/a.txt`).json()) as Record<
                string,
                number
            >;
            const folder = (await w
                .ask(`/apps/notes/${w.key}/.stat/hub/projects`)
                .json()) as Record<string, number>;
            return [file.type, file.size, typeof file.mtime, folder.type];
        },
        [1, 1, 'number', 2]
    ],
    [
        'a file of 300 MB, answered as a stream with its length and no buffer made of it',
        () => {
            const w = world('files: [hub]\n');
            const big = join(
                w.fixture.roots.find((one) => one.key === 'hub')?.dir ?? '',
                'big.bin'
            );
            const size = 300 * 1024 * 1024;
            writeFileSync(big, '');
            truncateSync(big, size);
            const answer = w.ask(`/apps/notes/${w.key}/.fs/hub/big.bin`);
            const reader = answer.body?.getReader();
            return reader?.read().then(async (first) => {
                await reader.cancel();
                const chunk = first.value?.length ?? 0;
                return [
                    answer.status,
                    answer.headers.get('content-length'),
                    chunk > 0 && chunk < size / 4
                ];
            });
        },
        [200, String(300 * 1024 * 1024), true]
    ],
    ...(
        [
            [
                'a wrong key',
                (w: ReturnType<typeof world>) =>
                    `/apps/notes/${'0'.repeat(w.key.length)}/${READ}/a/README.md`,
                false
            ],
            [
                'a dot-led root key',
                (w: ReturnType<typeof world>) => `/apps/notes/${w.key}/.fs/.hub/projects`,
                false
            ],
            ['no root key', (w: ReturnType<typeof world>) => `/apps/notes/${w.key}/.fs`, false],
            [
                'a read with no path',
                (w: ReturnType<typeof world>) => `/apps/notes/${w.key}/.fs/hub`,
                false
            ],
            [
                'an app that is not approved',
                (w: ReturnType<typeof world>) => `/apps/notes/${w.key}/${READ}/a/README.md`,
                true
            ]
        ] as [string, (w: ReturnType<typeof world>) => string, boolean][]
    ).map(([label, path, unapproved]): Row => [
        `${label}, with the empty 404`,
        async () => {
            const w = world('files: [hub/projects]\n', { approve: !unapproved });
            const answer = w.ask(path(w));
            return [answer.status, await answer.text(), [...answer.headers]];
        },
        [404, '', []]
    ]),
    [
        'an app that is disabled, with the empty 404 even under its key',
        async () => {
            const w = world('files: [hub/projects]\n');
            writeFileSync(
                join(w.fixture.base, 'apps.json'),
                JSON.stringify({ version: 1, disabled: ['app:notes'], workspaces: {} })
            );
            const held = w.fixture.scan(new Set(w.held.apps.map((one) => one.row.hash)));
            const answer = serveApp({
                ...serveInput(
                    new Request(`${ORIGIN}/apps/notes/${w.key}/${READ}/a/README.md`),
                    held
                ),
                reach: () => ({
                    roots: w.fixture.roots,
                    configDir: '',
                    closedPaths: ['secrets'],
                    privateReal: [],
                    fs: diskFs,
                    scanEntries: 100
                })
            });
            return [answer.status, await answer.text()];
        },
        [404, '']
    ]
];

describe('answers a read of a root only for an app that may read it, and an empty 404 otherwise', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
