// Layer 2, route tests. POST /api/app-manage, /api/app-add, /api/app-host and /api/app-secrets
// (lib/server/machine/apps/routes/manage.ts and host.ts, which the files of src/routes/api/(apps)/
// call): the write token that guards each, the disable, enable and remove of an app, the add of a
// folder, a frame's call to its host and its secrets under its own app header, the page's reads and
// actions on the tools of a host (decorate, scm, file, terminal) answered with the token and
// refused without it, and the words a refused call is answered with.
//
// The record of the disabled apps, the approvals file and every app folder are synthetic, under the
// system temporary directory, the keyring is in memory and the trash moves a path into a scratch
// folder. What this does NOT cover: the origin guard of src/hooks.server.ts and the page's
// questions (tests/state/system/apps/flows.test.ts).

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect } from 'vitest';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { approveApp } from '../../../src/lib/server/machine/approvals/approvals.ts';
import {
    handleHostPost,
    handleSecretsPost
} from '../../../src/lib/server/machine/apps/routes/host.ts';
import {
    handleAddPost,
    handleManagePost
} from '../../../src/lib/server/machine/apps/routes/manage.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { memoryKeyring, secretsOf } from '../../server/machine/apps/world/hosts-fixture.ts';
import { MANIFEST, PAGE, routeSetup, type RouteSetup } from './apps-fixture.ts';

const TOKEN = 'token';

type Handler = typeof handleManagePost;

/** The language and grammar `notes` contributes, whose grammar file the page reads. */
const NOTES_LANGUAGE = `contributes:
  languages:
    - id: notes
      extensions: [".note"]
  grammars:
    - language: notes
      scopeName: source.notes
      path: notes.tmLanguage.json
`;

/** The apps `notes` (with secrets) and `todo`, and `base` that `todo` depends on, all hosts. */
const FILES = {
    machine: {
        'notes/app.yml': `${MANIFEST}host: host.mjs\nsecrets: true\n${NOTES_LANGUAGE}`,
        'notes/index.html': PAGE,
        'notes/notes.tmLanguage.json': '{"scopeName":"source.notes","patterns":[]}',
        'notes/host.mjs': 'export function activate() {}\n',
        'todo/app.yml':
            'name: todo\ntitle: Todo\nbridge: 1\nhost: host.mjs\nsecrets: true\ndepends: [base]\n',
        'todo/index.html': PAGE,
        'todo/host.mjs': 'export function activate() {}\n',
        'base/app.yml': 'name: base\ntitle: Base\nbridge: 1\nhost: host.mjs\n',
        'base/index.html': PAGE,
        'base/host.mjs': 'export function activate() {}\n'
    },
    roots: {
        one: {
            '.oculus/apps/lab/app.yml': 'name: lab\ntitle: Lab\nbridge: 1\n',
            '.oculus/apps/lab/index.html': PAGE
        }
    }
};

/** A setup with every app approved, an in-memory keyring and a trash that moves into a folder. */
function setup() {
    const ring = memoryKeyring();
    const bin = scratchDir('oculus-trash-');
    const made = routeSetup(FILES);
    for (const app of made.held().apps) {
        approveApp(made.approvals, { hash: app.row.hash, folder: app.row.folder, label: app.id });
    }
    made.options.apps.reread();
    const options: RouteSetup['options'] = {
        ...made.options,
        secrets: secretsOf(ring),
        trash: (path) => {
            renameSync(path, join(bin, basename(path)));
            return Promise.resolve();
        }
    };
    return { ...made, options, ring, bin, state: join(made.fixture.base, 'apps.json') };
}

/** POST a body to a handler, with the token unless `token` is null, and the app header if given. */
function post(
    handler: Handler | typeof handleHostPost,
    made: ReturnType<typeof setup>,
    body: unknown,
    over: { token?: string | null; app?: string } = {}
): Promise<Response> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (over.token !== null) headers[TOKEN_HEADER] = over.token ?? TOKEN;
    if (over.app !== undefined) headers['x-oculus-app'] = over.app;
    return handler(
        new Request('http://localhost:8787/api/x', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        }),
        TOKEN,
        made.options
    );
}

const json = async (answer: Response): Promise<unknown> => [answer.status, await answer.json()];

describe('refuses a request without the write token, before it reads or changes anything', () => {
    it.each([
        ['app-manage', handleManagePost, { action: 'disable', view: 'app:notes' }],
        ['app-add', handleAddPost, { path: '/nowhere/notes' }],
        ['app-host', handleHostPost, { action: 'tab' }],
        ['app-host output', handleHostPost, { action: 'output', view: 'app:notes' }],
        ['app-host decorate', handleHostPost, { action: 'decorate', root: 'r', paths: ['a'] }],
        [
            'app-host scm',
            handleHostPost,
            { action: 'scm', app: 'app:notes', id: 'notes.git', op: { kind: 'accept' } }
        ],
        [
            'app-host file',
            handleHostPost,
            { action: 'file', app: 'app:notes', kind: 'grammar', path: 'g.json' }
        ],
        ['app-host terminal', handleHostPost, { action: 'terminal', app: 'app:notes', id: 't' }],
        ['app-secrets', handleSecretsPost, { action: 'get', key: 'token' }]
    ] as [string, Handler, unknown][])(
        '%s answers 403 and leaves the record alone',
        async (_row, handler, body) => {
            const made = setup();
            const answer = await post(handler, made, body, { token: null, app: 'app:notes' });
            expect([answer.status, existsSync(made.state)]).toEqual([403, false]);
        }
    );
});

describe('answers the page what it reads and does on the tools of a host through app-host', () => {
    it.each([
        [
            'decorate',
            { action: 'decorate', root: 'one', paths: ['a'] },
            [200, { ok: true, value: { decorations: { a: null }, pending: [] } }]
        ],
        [
            'scm',
            { action: 'scm', app: 'app:notes', id: 'notes.git', op: { kind: 'accept' } },
            [200, { ok: false, word: 'host_down' }]
        ],
        [
            'file',
            { action: 'file', app: 'app:notes', kind: 'grammar', path: 'notes.tmLanguage.json' },
            [200, { ok: true, value: { scopeName: 'source.notes', patterns: [] } }]
        ],
        [
            'terminal',
            { action: 'terminal', app: 'app:notes', id: 't' },
            [200, { ok: false, word: 'host_down' }]
        ]
    ] as [string, unknown, unknown][])(
        '%s is answered with its own result with the token and 403 without it',
        async (_row, body, expected) => {
            const made = setup();
            const taken = await json(await post(handleHostPost, made, body, { app: 'app:notes' }));
            const refused = await post(handleHostPost, made, body, { token: null });
            expect([taken, refused.status]).toEqual([expected, 403]);
        }
    );
});

describe('disables, enables and removes a machine app through app-manage', () => {
    it('disables machine-wide and per workspace, and enables again, each recorded in the file', async () => {
        const made = setup();
        const off = await json(
            await post(handleManagePost, made, { action: 'disable', view: 'app:notes' })
        );
        const row = made.held().apps.find((one) => one.id === 'app:notes')?.row.disabled;
        const on = await json(
            await post(handleManagePost, made, { action: 'enable', view: 'app:notes' })
        );
        const here = await json(
            await post(handleManagePost, made, {
                action: 'disable',
                view: 'app:notes',
                workspace: true
            })
        );
        expect({
            off,
            row,
            on,
            here,
            file: JSON.parse(readFileSync(made.state, 'utf8')) as unknown
        }).toEqual({
            off: [200, { ok: true }],
            row: true,
            on: [200, { ok: true }],
            here: [200, { ok: true }],
            file: {
                version: 1,
                disabled: [],
                workspaces: { default: { disabled: ['app:notes'], enabled: [] } }
            }
        });
    });

    it('refuses to disable base while todo depends on it, naming todo, and disables both on cascade', async () => {
        const made = setup();
        const refused = await json(
            await post(handleManagePost, made, { action: 'disable', view: 'app:base' })
        );
        const done = await json(
            await post(handleManagePost, made, {
                action: 'disable',
                view: 'app:base',
                cascade: true
            })
        );
        expect([
            refused,
            done,
            (JSON.parse(readFileSync(made.state, 'utf8')) as { disabled: string[] }).disabled
        ]).toEqual([
            [409, { error: 'dependents', dependents: ['Todo'] }],
            [200, { ok: true }],
            ['app:todo', 'app:base']
        ]);
    });

    it('answers an app that is not held with 404 and a root app asked what a removal does with 409', async () => {
        const made = setup();
        const missing = await json(
            await post(handleManagePost, made, { action: 'disable', view: 'app:nonesuch' })
        );
        const root = await json(
            await post(handleManagePost, made, { action: 'inspect', view: 'app:one/lab' })
        );
        expect([missing, root]).toEqual([
            [404, { error: 'missing' }],
            [409, { error: 'root_app' }]
        ]);
    });

    it('says what a removal does, then removes the folder, the store and both secrets, and revokes the approval', async () => {
        const made = setup();
        const notes = made.held().apps.find((one) => one.id === 'app:notes');
        if (notes === undefined) throw new Error('notes is not held');
        const secrets = made.options.secrets;
        await secrets.store(notes, 'one', 'a');
        await secrets.store(notes, 'two', 'b');
        mkdirSync(join(notes.row.storeFile, '..'), { recursive: true });
        writeFileSync(notes.row.storeFile, '{}');
        const inspect = await json(
            await post(handleManagePost, made, { action: 'inspect', view: 'app:notes' })
        );
        const removed = await json(
            await post(handleManagePost, made, { action: 'remove', view: 'app:notes' })
        );
        expect({
            inspect,
            removed,
            folder: existsSync(notes.row.folder),
            store: existsSync(notes.row.storeFile),
            ring: made.ring.entries.size,
            held: made.held().apps.some((one) => one.id === 'app:notes')
        }).toEqual({
            inspect: [200, { ok: true, folder: notes.row.folder, secrets: 2, dependents: [] }],
            removed: [200, { ok: true, secretsKept: false }],
            folder: false,
            store: false,
            ring: 0,
            held: false
        });
    });

    it('removes nothing while the apps that depend on the app are enabled and the reader has not said yes', async () => {
        const made = setup();
        const refused = await json(
            await post(handleManagePost, made, { action: 'remove', view: 'app:base' })
        );
        expect([refused, existsSync(join(made.fixture.machine, 'base'))]).toEqual([
            [409, { error: 'dependents', reason: '', dependents: ['Todo'] }],
            true
        ]);
    });
});

describe('adds an app from a folder through app-add', () => {
    it('copies the folder as an unapproved app and refuses a folder with no app.yml', async () => {
        const made = setup();
        const from = scratchDir('oculus-add-from-');
        mkdirSync(join(from, 'tasks'));
        writeFileSync(join(from, 'tasks', 'app.yml'), 'name: tasks\ntitle: Tasks\nbridge: 1\n');
        writeFileSync(join(from, 'tasks', 'index.html'), PAGE);
        mkdirSync(join(from, 'empty'));
        const added = await json(await post(handleAddPost, made, { path: join(from, 'tasks') }));
        const refused = await json(await post(handleAddPost, made, { path: join(from, 'empty') }));
        const app = made.held().apps.find((one) => one.id === 'app:tasks');
        expect([added, refused, app?.row.approved]).toEqual([
            [200, { ok: true, name: 'tasks' }],
            [409, { error: 'no_manifest' }],
            false
        ]);
    });
});

describe("answers a frame's call to its host and its secrets under its own app header", () => {
    it('answers the secrets of the app in the header alone, and none of another app', async () => {
        const made = setup();
        const store = (app: string, key: string, value: string) =>
            post(handleSecretsPost, made, { action: 'store', key, value }, { app });
        await store('app:notes', 'token', 'of-notes');
        await store('app:todo', 'token', 'of-todo');
        const get = async (app: string) =>
            json(await post(handleSecretsPost, made, { action: 'get', key: 'token' }, { app }));
        expect([await get('app:notes'), await get('app:todo'), await get('app:base')]).toEqual([
            [200, { ok: true, value: 'of-notes' }],
            [200, { ok: true, value: 'of-todo' }],
            [200, { ok: false, word: 'not_declared' }]
        ]);
    });

    it('answers a header that names no app with 404, and an app that is disabled with closed', async () => {
        const made = setup();
        await post(handleManagePost, made, { action: 'disable', view: 'app:notes' });
        const body = { action: 'get', key: 'token' };
        expect([
            await json(await post(handleSecretsPost, made, body, { app: 'app:nonesuch' })),
            await json(await post(handleSecretsPost, made, body, { app: 'app:notes' })),
            await json(
                await post(
                    handleHostPost,
                    made,
                    { action: 'request', method: 'ping', params: null, tab: 't' },
                    { app: 'app:notes' }
                )
            )
        ]).toEqual([
            [404, { error: 'missing' }],
            [200, { ok: false, word: 'closed' }],
            [200, { ok: false, word: 'closed' }]
        ]);
    });

    it('answers not_declared to a host request of an app with no host', async () => {
        const made = setup();
        const answer = await post(
            handleHostPost,
            made,
            { action: 'request', method: 'ping', params: null, tab: 't' },
            { app: 'app:one/lab' }
        );
        expect(await json(answer)).toEqual([200, { ok: false, word: 'not_declared' }]);
    });

    it('stops and restarts a host by the view in the body and answers a view it does not hold with 404', async () => {
        const made = setup();
        const stopped = await json(
            await post(handleHostPost, made, { action: 'stop', view: 'app:notes' })
        );
        const missing = await json(
            await post(handleHostPost, made, { action: 'restart', view: 'app:nonesuch' })
        );
        expect([stopped, missing]).toEqual([
            [200, { ok: true }],
            [404, { error: 'missing' }]
        ]);
    });
});
