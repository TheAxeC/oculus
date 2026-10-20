// Layer 2, route tests. GET /api/app-open (lib/server/machine/apps/routes/routes.ts
// `handleOpenGet`, which src/routes/api/(apps)/app-open/+server.ts calls): whether an app may have
// a file of a root opened, answered `ok`, `closed` or `missing` in the order of the checks.
//
// Every root is synthetic, under the system temporary directory, and the machine's own config
// folder stands in as a folder of the `hub` root. What this does NOT cover: the origin guard
// (src/hooks.server.ts) and the tab the page opens for an `ok` answer.

import { symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { appById } from '../../../src/lib/server/machine/apps/read/held.ts';
import { checkOpen, diskFs, type OpenFs } from '../../../src/lib/server/machine/apps/reach/open.ts';
import { handleOpenGet } from '../../../src/lib/server/machine/apps/routes/routes.ts';
import { present } from '../../fixtures/present.ts';
import { it } from '../../fixtures/scratch.ts';
import { notesFiles, PAGE, routeSetup } from './apps-fixture.ts';

const TODO = 'name: todo\ntitle: Todo\nbridge: 1\n';

/** The roots of every case: a hub with hidden, closed and ordinary files, and two more roots. */
function world(over: { closedPaths?: () => readonly string[] | null } = {}) {
    const reads: string[] = [];
    const fs: OpenFs = {
        realPath: (path) => {
            reads.push(`realPath ${path}`);
            return diskFs.realPath(path);
        },
        linkTarget: (path) => {
            reads.push(`linkTarget ${path}`);
            return diskFs.linkTarget(path);
        },
        isFile: (path) => {
            reads.push(`isFile ${path}`);
            return diskFs.isFile(path);
        }
    };
    const setup = routeSetup(
        {
            machine: notesFiles(),
            roots: {
                hub: {
                    'README.md': 'readme',
                    'notes.v2.md': 'v2',
                    '.env': 'x',
                    'a/secrets/b': 'b',
                    'secrets/a.txt': 'a',
                    'secrets-notes.md': 'n',
                    '.secrets/key': 'k',
                    '%2Eenv': 'literal',
                    '.ssh/id_ed25519': 'k',
                    '.oculus/approvals.json': '{}',
                    'a/.git/config': 'c',
                    'data.bin': '\u0000\u0001\u0002binary',
                    'letter.docx': 'PK\u0003\u0004',
                    'paper.pdf': '%PDF-1.4',
                    'A.PDF': '%PDF-1.4',
                    'tools/oculus/config/options/local.yml': 'secret: yes',
                    '.oculus/apps/todo/app.yml': TODO,
                    '.oculus/apps/todo/index.html': PAGE
                },
                'game-engine': { 'x.txt': 'x' },
                other: { 'y.txt': 'y' }
            }
        },
        { fs, ...over }
    );
    setup.options.configDir = join(setup.fixture.base, 'roots', 'hub', 'tools', 'oculus', 'config');
    const hub = join(setup.fixture.base, 'roots', 'hub');
    writeFileSync(join(setup.fixture.base, 'outside.txt'), 'outside');
    symlinkSync(join(hub, '.secrets'), join(hub, 'creds'));
    symlinkSync(join(setup.fixture.base, 'outside.txt'), join(hub, 'out-existing'));
    symlinkSync(join(setup.fixture.base, 'no-such-file'), join(hub, 'out-missing'));
    setup.options.apps.reread();
    return { setup, reads };
}

/** The answer of the route for an app, a root and a path, at a page when one is given. */
async function answer(
    app: string,
    root: string,
    path: string,
    context = world(),
    page?: string
): Promise<string> {
    const query = new URLSearchParams({ app, root, path });
    if (page !== undefined) query.set('page', page);
    const response = handleOpenGet(
        new Request(`http://localhost:8787/api/app-open?${query.toString()}`),
        context.setup.options
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as { result: string }).result;
}

type Row = [string, () => unknown, unknown];

/** A row that asks the route about one file of one root, for one app. */
const ask = ([label, app, root, path, result]: [string, string, string, string, string]): Row => [
    `${label}, answered ${result}`,
    () => answer(app, root, path),
    result
];

/** A row that asks for the route's answer to a request the route refuses. */
const status = (label: string, query: string, expected: number): Row => [
    `${label}, answered ${expected}`,
    () =>
        handleOpenGet(
            new Request(`http://localhost:8787/api/app-open${query}`),
            world().setup.options
        ).status,
    expected
];

const FILES: [string, string, string, string, string][] = [
    ['an ordinary file of a shown root', 'app:notes', 'hub', 'README.md', 'ok'],
    ['a dotted name that does not start with a dot', 'app:notes', 'hub', 'notes.v2.md', 'ok'],
    ['a file that does not exist', 'app:notes', 'hub', 'nonesuch.md', 'missing'],
    ['a literal percent escape in a name', 'app:notes', 'hub', '%2Eenv', 'ok'],
    ['a dot file', 'app:notes', 'hub', '.env', 'closed'],
    ['a key under a dot folder', 'app:notes', 'hub', '.ssh/id_ed25519', 'closed'],
    ['the approvals file of the hub', 'app:notes', 'hub', '.oculus/approvals.json', 'closed'],
    ['a dot folder below the top', 'app:notes', 'hub', 'a/.git/config', 'closed'],
    ['an absolute path', 'app:notes', 'hub', '/etc/hosts', 'closed'],
    ['a binary file', 'app:notes', 'hub', 'data.bin', 'ok'],
    ['a Word file', 'app:notes', 'hub', 'letter.docx', 'ok'],
    ['an empty segment', 'app:notes', 'hub', 'a//x', 'closed'],
    ['a backslash', 'app:notes', 'hub', 'a\\b', 'closed'],
    [
        'a root named engine, which no workspace folder is',
        'app:notes',
        'engine',
        'x.yml',
        'missing'
    ],
    ['a root whose key holds the word engine', 'app:notes', 'game-engine', 'x.txt', 'ok'],
    [
        'the local options file of the config folder',
        'app:notes',
        'hub',
        'tools/oculus/config/options/local.yml',
        'closed'
    ],
    [
        'that file spelt in capitals',
        'app:notes',
        'hub',
        'TOOLS/OCULUS/CONFIG/OPTIONS/local.yml',
        'closed'
    ],
    ['a closed folder', 'app:notes', 'hub', 'secrets/a.txt', 'closed'],
    ['a closed folder spelt in capitals', 'app:notes', 'hub', 'SECRETS/a.txt', 'closed'],
    ['a name that only starts like a closed folder', 'app:notes', 'hub', 'secrets-notes.md', 'ok'],
    ['a closed folder name below the top', 'app:notes', 'hub', 'a/secrets/b', 'ok'],
    ['a link into a dot folder', 'app:notes', 'hub', 'creds/key', 'closed'],
    ['a link to a file outside the root', 'app:notes', 'hub', 'out-existing', 'closed'],
    ['a link to an outside file that is absent', 'app:notes', 'hub', 'out-missing', 'closed'],
    ['a root that is not shown, for a machine app', 'app:notes', 'nonesuch', 'x', 'missing'],
    ['a dot file of a root that is not shown', 'app:notes', 'nonesuch', '.env', 'closed'],
    ['its own root, for a root app', 'app:hub/todo', 'hub', 'README.md', 'ok'],
    ['another shown root, for a root app', 'app:hub/todo', 'other', 'y.txt', 'closed'],
    ['a root that is not shown, for a root app', 'app:hub/todo', 'nonesuch', 'x', 'closed']
];

/** A row that asks the route about a file of the hub at a page, written as the query holds it. */
const paged = ([label, path, page, result]: [string, string, string, string]): Row => [
    `${label}, answered ${result}`,
    () => answer('app:notes', 'hub', path, world(), page),
    result
];

const PAGES: [string, string, string, string][] = [
    ['a PDF at page 3', 'paper.pdf', '3', 'ok'],
    ['a PDF at page 0', 'paper.pdf', '0', 'closed'],
    ['a PDF at page 2.5', 'paper.pdf', '2.5', 'closed'],
    ['a PDF at page -1', 'paper.pdf', '-1', 'closed'],
    ['a PDF at a page that is no number', 'paper.pdf', 'three', 'closed'],
    ['a Markdown file at a page', 'README.md', '2', 'closed'],
    ['A.PDF at page 2', 'A.PDF', '2', 'ok']
];

const ROWS: Row[] = [
    ...FILES.map(ask),
    ...PAGES.map(paged),
    status('a page given twice', '?app=app%3Anotes&root=hub&path=paper.pdf&page=2&page=3', 400),
    [
        'a path in the config folder, closed with no stat, real path or read of it',
        async () => {
            const context = world();
            const result = await answer(
                'app:notes',
                'hub',
                'tools/oculus/config/options/local.yml',
                context
            );
            return [
                result,
                context.reads.filter((read) => read.endsWith('local.yml')),
                context.reads.length > 0
            ];
        },
        ['closed', [], true]
    ],
    [
        'every file target while closed_paths is absent, answered closed',
        async () => {
            const context = world({ closedPaths: () => null });
            return [
                await answer('app:notes', 'hub', 'README.md', context),
                await answer('app:notes', 'hub', 'nonesuch.md', context)
            ];
        },
        ['closed', 'closed']
    ],
    [
        'an empty path, closed before the disk is read',
        () => {
            const context = world();
            const app = present(appById(context.setup.held(), 'app:notes'), 'the app notes');
            const result = checkOpen(
                { app, root: 'hub', path: '' },
                {
                    roots: context.setup.fixture.roots,
                    configDir: context.setup.options.configDir,
                    closedPaths: ['secrets'],
                    privateReal: [],
                    fs: context.setup.options.fs
                }
            );
            return [result, context.reads];
        },
        ['closed', []]
    ],
    status('an app that is absent', '?root=hub&path=README.md', 400),
    status('an empty root', '?app=app%3Anotes&root=&path=README.md', 400),
    status('a root given twice', '?app=app%3Anotes&root=hub&root=hub&path=README.md', 400),
    status('an app no row names', '?app=app%3Anonesuch&root=hub&path=README.md', 404)
];

describe('answers closed, missing or ok in the order of the checks, and reads no hidden file first', () => {
    it.each(ROWS)('%s', async (_row, observe, expected) => {
        expect(await observe()).toEqual(expected);
    });
});
