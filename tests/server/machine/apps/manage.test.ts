// Layer 2, server test. Disabling, enabling, removing and adding a machine app: the record of the
// disabled apps (`~/.oculus/apps.json`), the apps that a change reaches, what a removal does and
// what an addition copies.
//
// Every folder is synthetic, under the system temporary directory, the keyring is in memory and the
// trash is a double that moves the path into a scratch folder, so a case never touches
// `~/.oculus`, the machine's keyring or the real trash. What this does NOT cover: the routes that
// call these (tests/routes/apps/app-manage.test.ts) and the page's questions
// (tests/state/system/apps/flows.test.ts).

import {
    existsSync,
    lstatSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    renameSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    approveApp,
    approvedApps
} from '../../../../src/lib/server/machine/approvals/approvals.ts';
import { addApp } from '../../../../src/lib/server/machine/apps/manage/add.ts';
import { changeEnabled } from '../../../../src/lib/server/machine/apps/manage/enable.ts';
import {
    describeRemoval,
    removeApp
} from '../../../../src/lib/server/machine/apps/manage/remove.ts';
import { appById } from '../../../../src/lib/server/machine/apps/read/held.ts';
import {
    readAppsState,
    standingOf,
    workspaceKey
} from '../../../../src/lib/server/machine/apps/read/state.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { secretsOf } from './hosts-fixture.ts';
import { world, type World } from './hosts-world.ts';

const stateFile = (w: World): string => join(w.fixture.base, 'apps.json');

/** The apps.json of a world as an object, or null when it is not there. */
const stateOf = (w: World): unknown =>
    existsSync(stateFile(w)) ? JSON.parse(readFileSync(stateFile(w), 'utf8')) : null;

describe('keeps the disabled apps in apps.json, machine-wide and per workspace', () => {
    it('reads every app as disabled from a file that does not parse, names the file, refuses a change and leaves it', () => {
        const w = world({ notes: {} });
        writeFileSync(stateFile(w), '{not json');
        const held = w.rescan();
        const row = held.apps[0].row;
        const finding = held.findings.find((one) => one.key === 'apps_state');
        const change = changeEnabled(held, stateFile(w), workspaceKey(''), {
            id: 'app:notes',
            scope: 'machine',
            enabled: true,
            cascade: false
        });
        const off = changeEnabled(held, stateFile(w), workspaceKey(''), {
            id: 'app:notes',
            scope: 'workspace',
            enabled: false,
            cascade: false
        });
        expect({
            disabled: row.disabled,
            named: finding?.message.includes('apps.json'),
            enable: change.ok ? 'ok' : change.error,
            disable: off.ok ? 'ok' : off.error,
            left: readFileSync(stateFile(w), 'utf8')
        }).toEqual({
            disabled: true,
            named: true,
            enable: 'file',
            disable: 'file',
            left: '{not json'
        });
    });

    it('reads the apps as the file says once it is put right', () => {
        const w = world({ notes: {} });
        writeFileSync(stateFile(w), '{not json');
        w.rescan();
        writeFileSync(stateFile(w), JSON.stringify({ version: 1, disabled: [], workspaces: {} }));
        expect(w.rescan().apps[0].row.disabled).toBe(false);
    });

    it('disables in the current workspace only, and enables in a workspace what the machine disabled', () => {
        const w = world({ notes: {} });
        const held = w.held();
        const ask = (scope: 'machine' | 'workspace', enabled: boolean, workspace = 'lab') =>
            changeEnabled(w.held(), stateFile(w), workspace, {
                id: 'app:notes',
                scope,
                enabled,
                cascade: false
            });
        ask('workspace', false);
        const first = readAppsState(stateFile(w));
        const afterWorkspace = ['lab', workspaceKey('')].map(
            (name) => standingOf(first, name, 'app:notes').disabled
        );
        ask('workspace', true);
        ask('machine', false);
        ask('workspace', true);
        const second = readAppsState(stateFile(w));
        const afterMachine = ['lab', workspaceKey('')].map(
            (name) => standingOf(second, name, 'app:notes').disabled
        );
        expect({ held: held.apps.length, afterWorkspace, afterMachine, file: stateOf(w) }).toEqual({
            held: 1,
            afterWorkspace: [true, false],
            afterMachine: [false, true],
            file: {
                version: 1,
                disabled: ['app:notes'],
                workspaces: { lab: { disabled: [], enabled: ['app:notes'] } }
            }
        });
    });
});

describe('disables the apps that depend on an app when the reader says yes, and stops their hosts', () => {
    const specs = { base: {}, a: { keys: 'depends: [base]\n' } };

    it('refuses to disable base while a depends on it, naming a, and changes nothing', () => {
        const w = world(specs);
        const outcome = changeEnabled(w.held(), stateFile(w), workspaceKey(''), {
            id: 'app:base',
            scope: 'machine',
            enabled: false,
            cascade: false
        });
        expect([outcome, stateOf(w)]).toEqual([
            { ok: false, error: 'dependents', apps: ['a'] },
            null
        ]);
    });

    it('disables both on yes, a first, and ends both hosts', async () => {
        const w = world(specs);
        await w.hosts.tab('app:a');
        const outcome = changeEnabled(w.held(), stateFile(w), workspaceKey(''), {
            id: 'app:base',
            scope: 'machine',
            enabled: false,
            cascade: true
        });
        w.rescan();
        await w.hosts.settled();
        expect({
            outcome,
            disabled: (stateOf(w) as { disabled: string[] }).disabled,
            ended: w.spawned.map((one) => [one.name, one.ended])
        }).toEqual({
            outcome: { ok: true, changed: ['app:a', 'app:base'] },
            disabled: ['app:a', 'app:base'],
            ended: [
                ['base', true],
                ['a', true]
            ]
        });
    });
});

/** A world whose app `notes` holds two secrets and a store file, approved in an approvals file. */
async function removable() {
    const w = world({ notes: { keys: 'secrets: true\n' } });
    const secrets = secretsOf(w.keyring);
    const app = appById(w.held(), 'app:notes');
    if (app === undefined) throw new Error('the app is not held');
    await secrets.store(app, 'one', 'value-one');
    await secrets.store(app, 'two', 'value-two');
    mkdirSync(join(app.row.storeFile, '..'), { recursive: true });
    writeFileSync(app.row.storeFile, '{"a":1}');
    const approvals = join(w.fixture.base, 'approvals.json');
    approveApp(approvals, { hash: app.row.hash, folder: app.row.folder, label: 'notes' });
    const trashed: string[] = [];
    const bin = scratchDir('oculus-trash-');
    const deps = {
        held: w.held,
        hosts: w.hosts,
        secrets,
        trash: (path: string) => {
            trashed.push(path);
            renameSync(path, join(bin, `${trashed.length}-${basename(path)}`));
            return Promise.resolve();
        },
        approvalsFile: approvals,
        stateFile: stateFile(w),
        workspace: workspaceKey(''),
        unkeep: () => undefined
    };
    return { w, app, secrets, deps, trashed, approvals };
}

describe('removes a machine app with its store and its secrets, after the reader says yes', () => {
    it('counts the secrets for the question and changes nothing until yes', async () => {
        const { w, app, secrets, trashed, approvals } = await removable();
        const question = await describeRemoval(w.held(), app, secrets);
        expect({
            question: [question.secrets, question.dependents],
            kept: [existsSync(app.row.folder), approvedApps(approvals).size, trashed.length]
        }).toEqual({ question: [2, []], kept: [true, 1, 0] });
    });

    it('moves the folder and the store file to the trash, deletes both secrets and revokes the approval', async () => {
        const { w, app, deps, trashed, approvals } = await removable();
        await w.hosts.tab('app:notes');
        const outcome = await removeApp(app, false, deps);
        expect({
            outcome,
            trashed: trashed.map((path) => path === app.row.folder || path === app.row.storeFile),
            folder: existsSync(app.row.folder),
            secrets: [...w.keyring.entries.keys()].length,
            approved: approvedApps(approvals).size,
            hostEnded: w.spawned[0].ended
        }).toEqual({
            outcome: { ok: true, secretsKept: false },
            trashed: [true, true],
            folder: false,
            secrets: 0,
            approved: 0,
            hostEnded: true
        });
    });

    it('goes ahead when the keyring cannot be read, the question saying the secrets could not be counted', async () => {
        const { w, app, deps, trashed, approvals } = await removable();
        const broken = secretsOf({
            ...w.keyring,
            accounts: () => Promise.reject(new Error('no keyring')),
            remove: () => Promise.reject(new Error('no keyring'))
        });
        const question = await describeRemoval(w.held(), app, broken);
        const outcome = await removeApp(app, false, { ...deps, secrets: broken });
        expect({
            counted: question.secrets,
            outcome,
            trashed: trashed.length,
            approved: approvedApps(approvals).size,
            ringKept: w.keyring.entries.size
        }).toEqual({
            counted: null,
            outcome: { ok: true, secretsKept: true },
            trashed: 2,
            approved: 0,
            ringKept: 2
        });
    });

    it('names the apps that depend on it and refuses until they are disabled with yes', async () => {
        const w = world({ base: {}, a: { keys: 'depends: [base]\n' } });
        const base = appById(w.held(), 'app:base');
        if (base === undefined) throw new Error('the app is not held');
        const bin = scratchDir('oculus-trash-');
        const deps = {
            held: w.held,
            hosts: w.hosts,
            secrets: secretsOf(w.keyring),
            trash: (path: string) => {
                renameSync(path, join(bin, basename(path)));
                return Promise.resolve();
            },
            approvalsFile: join(w.fixture.base, 'approvals.json'),
            stateFile: stateFile(w),
            workspace: workspaceKey(''),
            unkeep: () => undefined
        };
        const question = await describeRemoval(w.held(), base, secretsOf(w.keyring));
        const refused = await removeApp(base, false, deps);
        const done = await removeApp(base, true, deps);
        expect({
            question: question.dependents,
            refused,
            done,
            disabled: (stateOf(w) as { disabled: string[] }).disabled
        }).toEqual({
            question: ['a'],
            refused: { ok: false, error: 'dependents' },
            done: { ok: true, secretsKept: false },
            disabled: ['app:a']
        });
    });

    it('stops the host of an app that depends on it first and its own host last', async () => {
        const stops: string[] = [];
        const w = world(
            { base: {}, a: { keys: 'depends: [base]\n' } },
            {
                base: { deactivate: () => stops.push('base') },
                a: { deactivate: () => stops.push('a') }
            }
        );
        await w.hosts.tab('app:a');
        const base = appById(w.held(), 'app:base');
        if (base === undefined) throw new Error('the app is not held');
        const bin = scratchDir('oculus-trash-');
        const done = await removeApp(base, true, {
            held: w.held,
            hosts: w.hosts,
            secrets: secretsOf(w.keyring),
            trash: (path: string) => {
                stops.push('trash');
                renameSync(path, join(bin, basename(path)));
                return Promise.resolve();
            },
            approvalsFile: join(w.fixture.base, 'approvals.json'),
            stateFile: stateFile(w),
            workspace: workspaceKey(''),
            unkeep: () => undefined
        });
        expect({ done: done.ok, stops }).toEqual({ done: true, stops: ['a', 'base', 'trash'] });
    });

    it('refuses a root app, and a file apps.json that does not read, changing nothing', async () => {
        const root = world(
            {},
            {},
            {
                roots: {
                    hub: {
                        '.oculus/apps/todo/app.yml': 'name: todo\ntitle: Todo\nbridge: 1\n',
                        '.oculus/apps/todo/index.html': '<p>'
                    }
                }
            }
        );
        const todo = appById(root.held(), 'app:hub/todo');
        const { app, deps, w } = await removable();
        writeFileSync(stateFile(w), '{not json');
        const unread = await removeApp(app, false, deps);
        const rooted = todo === undefined ? null : await removeApp(todo, false, deps);
        expect([rooted, unread.ok ? 'ok' : unread.error, existsSync(app.row.folder)]).toEqual([
            { ok: false, error: 'root_app' },
            'file',
            true
        ]);
    });
});

/** A folder `name` holding these files under a scratch folder, and an apps folder beside it. */
function source(name: string, files: Record<string, string>) {
    const base = scratchDir('oculus-add-');
    const folder = join(base, 'chosen', name);
    for (const [path, body] of Object.entries(files)) {
        mkdirSync(join(folder, path, '..'), { recursive: true });
        writeFileSync(join(folder, path), body);
    }
    return { base, folder, apps: join(base, 'apps') };
}

const LIMITS = { files: 500, bytes: 20 * 1024 * 1024 };
const MANIFEST = 'name: notes\ntitle: Notes\nbridge: 1\n';

const tree = (folder: string): string[] => (existsSync(folder) ? readdirSync(folder).sort() : []);

describe('adds an app by copying a folder that holds app.yml into the apps folder', () => {
    it('copies app.yml and index.html and leaves out a dot-led file and a link', () => {
        const s = source('notes', { 'app.yml': MANIFEST, 'index.html': '<p>', '.env': 'secret=1' });
        symlinkSync(join(s.base, 'chosen'), join(s.folder, 'loop'));
        const outcome = addApp(s.folder, s.apps, LIMITS);
        expect([outcome, tree(join(s.apps, 'notes')), tree(s.apps)]).toEqual([
            { ok: true, name: 'notes' },
            ['app.yml', 'index.html'],
            ['notes']
        ]);
    });

    it.each([
        ['a folder with no app.yml', 'notes', { 'index.html': '<p>' }, 'no_manifest'],
        ['a name in capitals', 'Notes', { 'app.yml': MANIFEST }, 'name'],
        ['a file that is not a folder', 'notes', null, 'not_folder']
    ] as [string, string, Record<string, string> | null, string][])(
        'refuses %s with %s and copies nothing',
        (_row, name, files, word) => {
            const s = source(name, files ?? { 'x.txt': 'x' });
            const chosen = files === null ? join(s.folder, 'x.txt') : s.folder;
            const outcome = addApp(chosen, s.apps, LIMITS);
            expect([outcome, tree(s.apps).filter((one) => !one.startsWith('.'))]).toEqual([
                { ok: false, error: word },
                []
            ]);
        }
    );

    it('refuses a name that a machine app, a refused folder or a file already holds', () => {
        const answers = ['an app', 'a refused folder', 'a file'].map((_, at) => {
            const s = source('notes', { 'app.yml': MANIFEST });
            mkdirSync(s.apps, { recursive: true });
            if (at === 0) mkdirSync(join(s.apps, 'notes'));
            if (at === 1) mkdirSync(join(s.apps, 'notes', 'sub'), { recursive: true });
            if (at === 2) writeFileSync(join(s.apps, 'notes'), 'x');
            return [addApp(s.folder, s.apps, LIMITS), lstatSync(join(s.apps, 'notes')).isFile()];
        });
        expect(answers).toEqual([
            [{ ok: false, error: 'exists' }, false],
            [{ ok: false, error: 'exists' }, false],
            [{ ok: false, error: 'exists' }, true]
        ]);
    });

    it('refuses a folder inside the apps folder, one that holds it, and one over the limits', () => {
        const s = source('notes', { 'app.yml': MANIFEST, 'big.txt': 'x'.repeat(2048) });
        const inside = join(s.apps, 'inner');
        mkdirSync(inside, { recursive: true });
        writeFileSync(join(inside, 'app.yml'), MANIFEST);
        const inner = addApp(inside, s.apps, LIMITS);
        const holds = addApp(s.folder, join(s.folder, 'apps-here'), LIMITS);
        const large = addApp(s.folder, s.apps, { files: 500, bytes: 1024 });
        expect([inner, holds, large]).toEqual([
            { ok: false, error: 'inside' },
            { ok: false, error: 'holds' },
            { ok: false, error: 'too_large' }
        ]);
    });
});
