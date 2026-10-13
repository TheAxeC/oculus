// Layer 2, server test. The source controls an app's host creates (lib/server/machine/apps/tools/
// scm.ts, routes.ts) over the real runner: a control id starts with the app's name, a second
// control of one id is refused, a resource is placed in a root of the app's scope or carries none,
// and what the reader does (typing, accept, a press, a menu command, the quick diff's original)
// reaches the host only for a command the app declares. These are the source control rows of G49
// and G77.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// Repositories view that draws the control (tests/state/system/apps-tools/).
// @module-tag slow: each case starts a node process.

import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import {
    handleToolsPost,
    toolsShape
} from '../../../../../src/lib/server/machine/apps/tools/routes.ts';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { asRootApp } from '../world/language-app.ts';
import { world } from '../world/hosts-world.ts';

const NOTES = 'app:notes';

const HOST = `
export function activate(oculus) {
  const root = oculus.workspace.workspaceFolders[0].uri;
  const log = [];
  const control = oculus.scm.createSourceControl('notes.git', 'Notes', root);
  const group = control.createResourceGroup('changes', 'Changes');
  group.resourceStates = [
    { resourceUri: oculus.Uri.joinPath(root, 'a.txt'), contextValue: 'file' },
    { resourceUri: oculus.Uri.joinPath(root, 'dir/b.txt'), command: { command: 'notes.open', title: 'Open', arguments: ['b'] } },
    { resourceUri: oculus.Uri.file('/elsewhere/x.txt') },
    { resourceUri: oculus.Uri.joinPath(root, 'secrets/key.txt') }
  ];
  control.count = 4;
  control.inputBox.placeholder = 'Message';
  control.acceptInputCommand = { command: 'notes.accept', title: 'Accept' };
  control.quickDiffProvider = { provideOriginalResource: () => oculus.Uri.joinPath(root, 'orig.txt') };
  oculus.scm.createSourceControl('other.git', 'Other', root);
  let again = '';
  try {
    oculus.scm.createSourceControl('notes.git', 'Again', root);
  } catch (error) {
    again = error.message;
  }
  const record = (name) => (...args) => {
    log.push([name, args.map((one) => (one && one.inputBox ? 'control' : one && one.id ? 'group:' + one.id : one && one.resourceUri ? one.resourceUri.path.split('/').slice(-1)[0] : one && one.path ? one.path.split('/').slice(-1)[0] : one))]);
  };
  oculus.commands.registerCommand('notes.accept', () => log.push(['accept', control.inputBox.value]));
  oculus.commands.registerCommand('notes.open', record('open'));
  oculus.commands.registerCommand('notes.stage', record('stage'));
  oculus.commands.registerCommand('notes.undeclared', record('undeclared'));
  oculus.commands.registerCommand('notes.log', () => ({ value: log }));
  oculus.commands.registerCommand('notes.again', () => ({ value: again }));
}
`;

const KEYS = `activation: [onTab]
contributes:
  commands:
    - command: notes.accept
      title: Accept
    - command: notes.open
      title: Open
    - command: notes.stage
      title: Stage
    - command: notes.log
      title: Log
    - command: notes.again
      title: Again
`;

/** A world with one root of a few files and the app, its host running with the control made. */
async function setup() {
    const w = world(
        { notes: { host: HOST, keys: KEYS } },
        {},
        {
            real: true,
            roots: {
                r: {
                    'a.txt': 'new\n',
                    'orig.txt': 'old\n',
                    'dir/b.txt': 'b\n',
                    'secrets/key.txt': 'k\n'
                }
            }
        }
    );
    await w.hosts.tab(NOTES);
    await w.until(() => (w.hosts.tools.source(NOTES)?.states()[0]?.groups.length ?? 0) > 0);
    const post = async (body: unknown): Promise<unknown> => {
        const read = toolsShape.parse(body);
        return (await handleToolsPost(read, w.hosts.tools)).json();
    };
    const log = async (): Promise<unknown> => {
        const done = await runDeclared(w.hosts.shell, NOTES, 'notes.log', []);
        return done.ok ? (done.value as { value: unknown }).value : done.word;
    };
    const state = () => w.hosts.tools.source(NOTES)?.states()[0];
    return { w, post, log, state };
}

const scm = (id: string, op: unknown) => ({ action: 'scm', app: NOTES, id, op });

describe('the source control an app creates', () => {
    it('is held under an id that starts with the app name and refused under another id or twice', async () => {
        const s = await setup();
        const ids = s.w.hosts.tools
            .source(NOTES)
            ?.states()
            .map((one) => one.id);
        const output = s.w.hosts.output(NOTES).join('\n');
        const again = await runDeclared(s.w.hosts.shell, NOTES, 'notes.again', []);
        await s.w.hosts.close();
        expect([ids, output.includes('not_declared'), again.ok && again.value]).toEqual([
            ['notes.git'],
            true,
            { value: 'refused:registered' }
        ]);
    }, 60000);

    it('places a resource of the scope in its root and path, and gives one outside or in a closed folder none', async () => {
        const s = await setup();
        const rows = (s.state()?.groups[0].resources ?? []).map((one) => `${one.root}:${one.path}`);
        const counted = [s.state()?.count, s.state()?.input.placeholder, s.state()?.label];
        await s.w.hosts.close();
        expect([rows, counted]).toEqual([
            ['r:a.txt', 'r:dir/b.txt', ':', ':'],
            [4, 'Message', 'Notes']
        ]);
    }, 60000);
});

describe('what the reader does with a source control', () => {
    it('types into the box, runs the accept command and a row command, and opens a row with none', async () => {
        const s = await setup();
        const typed = await s.post(scm('notes.git', { kind: 'input', value: 'fix it' }));
        const accepted = await s.post(scm('notes.git', { kind: 'accept' }));
        const withCommand = await s.post(
            scm('notes.git', {
                kind: 'pressed',
                group: 'changes',
                uri: s.state()?.groups[0].resources[1].uri
            })
        );
        const without = await s.post(
            scm('notes.git', {
                kind: 'pressed',
                group: 'changes',
                uri: s.state()?.groups[0].resources[0].uri
            })
        );
        const log = await s.log();
        await s.w.hosts.close();
        expect([typed, accepted, withCommand, without, log]).toEqual([
            { ok: true, value: null },
            { ok: true, value: null },
            { ok: true, value: { open: false } },
            { ok: true, value: { open: true } },
            [
                ['accept', 'fix it'],
                ['open', ['b']]
            ]
        ]);
    }, 60000);

    it('runs a menu command on the control, a group, rows and a change with the arguments VS Code gives it', async () => {
        const s = await setup();
        const rows = s.state()?.groups[0].resources ?? [];
        const run = (scope: string, extra: Record<string, unknown> = {}) =>
            s.post(scm('notes.git', { kind: 'execute', command: 'notes.stage', scope, ...extra }));
        await run('sourceControl');
        await run('group', { group: 'changes' });
        await run('resource', { group: 'changes', resources: [rows[0].uri, rows[1].uri] });
        await run('change', {
            change: {
                root: 'r',
                path: 'a.txt',
                changes: [
                    {
                        originalStartLineNumber: 1,
                        originalEndLineNumber: 1,
                        modifiedStartLineNumber: 1,
                        modifiedEndLineNumber: 1
                    }
                ],
                index: 0
            }
        });
        const log = await s.log();
        await s.w.hosts.close();
        expect(log).toEqual([
            ['stage', ['control']],
            ['stage', ['group:changes']],
            ['stage', ['a.txt', 'b.txt']],
            ['stage', ['a.txt', [expect.any(Object)], 0]]
        ]);
    }, 60000);

    it('refuses a command the app does not declare, a change with no file, a missing control and an app that does not act', async () => {
        const s = await setup();
        const undeclared = await s.post(
            scm('notes.git', {
                kind: 'execute',
                command: 'notes.undeclared',
                scope: 'sourceControl'
            })
        );
        const noChange = await s.post(
            scm('notes.git', { kind: 'execute', command: 'notes.stage', scope: 'change' })
        );
        const strayChange = await s.post(
            scm('notes.git', {
                kind: 'execute',
                command: 'notes.stage',
                scope: 'change',
                change: { root: 'nowhere', path: 'a.txt', changes: [], index: 0 }
            })
        );
        const missing = await s.post(scm('notes.nope', { kind: 'accept' }));
        const stranger = await s.post({
            action: 'scm',
            app: 'app:nobody',
            id: 'notes.git',
            op: { kind: 'accept' }
        });
        const log = await s.log();
        await s.w.hosts.close();
        expect([undeclared, noChange, strayChange, missing, stranger, log]).toEqual([
            { ok: false, word: 'not_declared' },
            { ok: false, word: 'outside' },
            { ok: false, word: 'outside' },
            { ok: false, word: 'missing' },
            { ok: false, word: 'closed' },
            []
        ]);
    }, 60000);

    it('answers the original of a file from a file of the scope, and null for one outside it', async () => {
        const s = await setup();
        const original = await s.post(
            scm('notes.git', { kind: 'original', root: 'r', path: 'a.txt' })
        );
        writeFileSync(join(s.w.fixture.roots[0].dir, 'orig.txt'), 'older\n');
        const again = await s.post(
            scm('notes.git', { kind: 'original', root: 'r', path: 'a.txt' })
        );
        const none = await s.post(
            scm('notes.git', { kind: 'original', root: 'nowhere', path: 'a.txt' })
        );
        await s.w.hosts.close();
        expect([original, again, none]).toEqual([
            { ok: true, value: 'old\n' },
            { ok: true, value: 'older\n' },
            { ok: true, value: null }
        ]);
    }, 60000);

    it('drops the control with its host', async () => {
        const s = await setup();
        await s.w.hosts.stop(NOTES);
        const left = s.w.hosts.tools.source(NOTES)?.states().length ?? 0;
        await s.w.hosts.close();
        expect(left).toBe(0);
    }, 60000);
});

describe('a source control of a root app in a workspace of two roots', () => {
    it('sees the folder of its own root only and places a resource of the other root nowhere', async () => {
        const app = {
            keys: 'activation: [onTab]\ncontributes:\n  commands:\n    - command: mine.add\n      title: Add\n    - command: mine.folders\n      title: Folders\n',
            host: `
export function activate(oculus) {
  const folders = oculus.workspace.workspaceFolders;
  const control = oculus.scm.createSourceControl('mine.sc', 'Mine', folders[0].uri);
  const group = control.createResourceGroup('g', 'G');
  group.resourceStates = [{ resourceUri: oculus.Uri.joinPath(folders[0].uri, 'a.txt') }];
  oculus.commands.registerCommand('mine.add', (path) => {
    group.resourceStates = [...group.resourceStates, { resourceUri: oculus.Uri.file(path) }];
    return { value: true };
  });
  oculus.commands.registerCommand('mine.folders', () => ({ value: folders.map((one) => one.uri.fsPath) }));
}
`
        };
        const w = world(
            {},
            {},
            {
                real: true,
                approve: ['mine'],
                roots: { r: { 'a.txt': 'a\n', ...asRootApp('mine', app) }, s: { 'b.txt': 'b\n' } }
            }
        );
        const id = w.held().apps[0].id;
        await w.hosts.tab(id);
        const other = join(w.fixture.roots[1].dir, 'b.txt');
        await w.until(() => (w.hosts.tools.source(id)?.states()[0]?.groups.length ?? 0) > 0);
        await runDeclared(w.hosts.shell, id, 'mine.add', [other]);
        await w.until(
            () => (w.hosts.tools.source(id)?.states()[0]?.groups[0].resources ?? []).length === 2
        );
        const rows = (w.hosts.tools.source(id)?.states()[0]?.groups[0].resources ?? []).map(
            (one) => `${one.root}:${one.path}`
        );
        const folders = await runDeclared(w.hosts.shell, id, 'mine.folders', []);
        await w.hosts.close();
        expect([rows, folders.ok && (folders.value as { value: string[] }).value.length]).toEqual([
            ['r:a.txt', ':'],
            1
        ]);
    }, 60000);
});
