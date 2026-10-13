// Layer 2, server test. The workspace API of an app's host (lib/server/machine/apps/tools/
// workspace/workspace.ts, workspace/writes.ts and scope.ts) over the real runner: `workspace.fs`,
// `findFiles`, `applyEdit` and the file watchers reach the folders of the app's scope and nothing
// else. A file outside every folder is refused `outside`, a closed or private place `closed`,
// whichever way the host names it. Every write of the host (a file's bytes, a folder made, a
// delete, a rename, a copy, the file operations of an edit) goes through the writer of the Files
// view: it is listed in History, its Undo puts the files back, and a tab that holds the file sees
// the new bytes. A folder whose tree holds a private folder is not copied, moved or deleted. A glob
// is read the same way in a document selector, in `findFiles` and in a file watcher. These are the
// workspace rows of G2 and G77.
//
// Every folder is synthetic, under the system temporary directory. The platform's folder watch is
// replaced by one the case fires itself. What this does NOT cover: the platform's own watch events
// (tests/server/machine/lsp covers the watch of a root), the pages' side of a saved document, and
// a workspace of more than one root with a root app (tools-roots.test.ts). A file whose name starts
// with a dot is closed to apps, so the equal reading of a glob over such a file is read in the
// selector alone.
// @module-tag slow: each case starts a node process.

import { EventEmitter } from 'node:events';
import {
    existsSync,
    lstatSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    symlinkSync,
    watch,
    writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { describe, expect } from 'vitest';
import type { Sink } from '../../../../../src/lib/server/core/channels.ts';
import { createOpenFiles } from '../../../../../src/lib/server/files/fs/open-files.ts';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import type { AppServerInfo } from '../../../../../src/lib/server/machine/lsp/adapters/entry.ts';
import { selects as relaySelects } from '../../../../../src/lib/server/machine/lsp/relay/relay-apps.ts';
import { manualClock } from '../../../../fixtures/doubles.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { world, type World } from '../world/hosts-world.ts';

const NOTES = 'app:notes';

const HOST = `
export function activate(oculus) {
  const events = [];
  const waiting = [];
  const note = (event) => {
    events.push(event);
    for (const wait of waiting.splice(0)) wait();
  };
  const U = oculus.Uri;
  const ops = {
    read: async (p) => Buffer.from(await oculus.workspace.fs.readFile(U.file(p))).toString('utf8'),
    write: async (p, text) => oculus.workspace.fs.writeFile(U.file(p), Buffer.from(text, 'utf8')),
    stat: async (p) => (await oculus.workspace.fs.stat(U.file(p))).type,
    list: async (p) => (await oculus.workspace.fs.readDirectory(U.file(p))).map((one) => one[0]),
    mkdir: async (p) => oculus.workspace.fs.createDirectory(U.file(p)),
    remove: async (p) => oculus.workspace.fs.delete(U.file(p)),
    removeAll: async (p) => oculus.workspace.fs.delete(U.file(p), { recursive: true }),
    removeToTrash: async (p) => oculus.workspace.fs.delete(U.file(p), { useTrash: true }),
    rename: async (p, q) => oculus.workspace.fs.rename(U.file(p), U.file(q)),
    copy: async (p, q) => oculus.workspace.fs.copy(U.file(p), U.file(q)),
    find: async (glob, exclude) =>
      (await oculus.workspace.findFiles(glob, exclude === 'null' ? null : exclude === 'default' ? undefined : exclude))
        .map((u) => u.fsPath),
    edit: async (p, text) => {
      const edit = new oculus.WorkspaceEdit();
      edit.replace(U.file(p), new oculus.Range(0, 0, 0, 5), text);
      return oculus.workspace.applyEdit(edit);
    },
    editTwo: async (p, q, text) => {
      const edit = new oculus.WorkspaceEdit();
      edit.replace(U.file(p), new oculus.Range(0, 0, 0, 5), text);
      edit.replace(U.file(q), new oculus.Range(0, 0, 0, 5), text);
      return oculus.workspace.applyEdit(edit);
    },
    createAndEdit: async (p, q, text) => {
      const edit = new oculus.WorkspaceEdit();
      edit.replace(U.file(p), new oculus.Range(0, 0, 0, 5), text);
      edit.createFile(U.file(q));
      return oculus.workspace.applyEdit(edit);
    },
    watch: async (glob, tag) => {
      const watcher = oculus.workspace.createFileSystemWatcher(glob);
      watcher.onDidCreate((u) => note(['create', u.fsPath, tag ?? '']));
      watcher.onDidChange((u) => note(['change', u.fsPath, tag ?? '']));
      return true;
    },
    events: async () => events,
    eventsAt: async (count) => {
      while (events.length < count) await new Promise((resolve) => waiting.push(resolve));
      return events;
    },
    folders: async () => (oculus.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath),
    watchFolders: async () => {
      oculus.workspace.onDidChangeWorkspaceFolders((e) => {
        note(['folders', e.added.map((f) => f.name).join(','), e.removed.map((f) => f.name).join(',')]);
      });
      return true;
    }
  };
  oculus.commands.registerCommand('notes.do', async (op, ...args) => {
    try {
      return { value: (await ops[op](...args)) ?? null };
    } catch (error) {
      return { error: error.code ?? 'Error', message: String(error.message) };
    }
  });
}
`;

const KEYS =
    'activation: [onTab]\ncontributes:\n  commands:\n    - command: notes.do\n      title: Do\n';

/** What a call of `notes.do` answered: its value, or the error code and message it threw. */
type Answer = { value?: unknown; error?: string; message?: string };

/** The platform's folder watch, replaced by one whose callbacks the case fires itself. */
function firedWatch(): { watch: typeof watch; fire: (event: string, name: string) => void } {
    const callbacks: ((event: string, name: string) => void)[] = [];
    const fake = ((_path: string, _options: unknown, callback: (e: string, n: string) => void) => {
        callbacks.push(callback);
        return Object.assign(new EventEmitter(), { close: () => undefined });
    }) as unknown as typeof watch;
    return {
        watch: fake,
        fire: (event, name) => {
            for (const callback of callbacks) callback(event, name);
        }
    };
}

/** A world with one root `r` holding a few files, and a folder outside it. */
function setup(over: Parameters<typeof world>[2] = {}): {
    w: World;
    root: string;
    outside: string;
    call: (...a: unknown[]) => Promise<Answer>;
} {
    const w = world(
        { notes: { host: HOST, keys: KEYS } },
        {},
        {
            real: true,
            roots: {
                r: {
                    'a.txt': 'hello world\n',
                    'dir/b.txt': 'bee\n',
                    'secrets/key.txt': 'key\n',
                    '.hidden/x.txt': 'x\n'
                }
            },
            ...over
        }
    );
    const root = realpathSync(w.fixture.roots[0].dir);
    const outside = join(dirname(root), 'outside');
    mkdirSync(outside, { recursive: true });
    writeFileSync(join(outside, 'o.txt'), 'out\n');
    symlinkSync(outside, join(root, 'link'));
    const call = async (...args: unknown[]): Promise<Answer> => {
        const done = await runDeclared(w.hosts.shell, NOTES, 'notes.do', args);
        return done.ok ? (done.value as Answer) : { error: done.word };
    };
    return { w, root, outside, call };
}

describe('the files a host reads and writes', () => {
    it('reads a file of the scope and refuses one outside every folder, one in a closed folder and one through a link out', async () => {
        const { w, root, outside, call } = setup();
        const rows = [
            await call('read', join(root, 'a.txt')),
            await call('read', join(outside, 'o.txt')),
            await call('read', join(root, 'secrets/key.txt')),
            await call('read', join(root, 'link/o.txt')),
            await call('read', join(root, 'missing.txt'))
        ];
        await w.hosts.close();
        expect(
            rows.map((one) => one.value ?? `${one.error}: ${one.message?.split(':')[0]}`)
        ).toEqual([
            'hello world\n',
            'NoPermissions: outside',
            'NoPermissions: closed',
            'NoPermissions: outside',
            'FileNotFound: missing'
        ]);
    });

    it("writes a file of the scope in place, lists the write in History with the app's id and the old bytes, and writes none outside", async () => {
        const { w, root, outside, call } = setup();
        const wrote = await call('write', join(root, 'a.txt'), 'changed\n');
        const listed = w.changes().map((one) => [one.field, one.app]);
        const refused = [
            await call('write', join(outside, 'o.txt'), 'x'),
            await call('write', join(root, 'secrets/key.txt'), 'x'),
            await call('write', join(root, 'link/new.txt'), 'x')
        ];
        const undone = await w.undo(w.changes()[0]);
        await w.hosts.close();
        expect([
            wrote.value,
            listed,
            refused.map((one) => one.error),
            readFileSync(join(outside, 'o.txt'), 'utf8'),
            existsSync(join(outside, 'new.txt')),
            undone,
            readFileSync(join(root, 'a.txt'), 'utf8'),
            w.trashed
        ]).toEqual([
            null,
            [['write-file', 'app:notes']],
            ['NoPermissions', 'NoPermissions', 'NoPermissions'],
            'out\n',
            false,
            null,
            'hello world\n',
            []
        ]);
    });

    it('is followed by a tab that holds the file written, which reads the new bytes at its next poll', async () => {
        const { w, root, call } = setup();
        const hashes: string[] = [];
        const page: Sink = {
            send: (text) => {
                hashes.push(
                    (JSON.parse(text) as { payload: { hash: string | null } }).payload.hash ?? ''
                );
                return Promise.resolve();
            },
            close: () => undefined
        };
        const clock = manualClock();
        const files = createOpenFiles({
            hub: w.hub,
            roots: () => w.fixture.roots,
            clock,
            every: 500
        });
        w.hub.subscribe(page, ['source:r/a.txt']);
        files.subscribed(page, ['source:r/a.txt']);
        clock.tick();
        const before = hashes.at(-1);
        await call('write', join(root, 'a.txt'), 'changed\n');
        clock.tick();
        const after = hashes.at(-1);
        files.close();
        await w.hosts.close();
        const sha = (text: string): string => createHash('sha256').update(text).digest('hex');
        expect([before, after]).toEqual([sha('hello world\n'), sha('changed\n')]);
    });

    it('lists a folder without hidden or closed names, and finds files by glob in the folders of the scope only', async () => {
        const { w, root, call } = setup();
        const listed = await call('list', root);
        const found = await call('find', '**/*.txt');
        await w.hosts.close();
        expect([
            [...(listed.value as string[])].sort(),
            (found.value as string[]).map((one) => one.slice(root.length + 1)).sort()
        ]).toEqual([
            ['a.txt', 'dir'],
            ['a.txt', 'dir/b.txt']
        ]);
    });

    it('creates a folder and deletes a file inside the scope, and refuses both in a closed folder', async () => {
        const { w, root, call } = setup();
        const made = await call('mkdir', join(root, 'new/inner'));
        const gone = await call('remove', join(root, 'dir/b.txt'));
        const closed = [
            await call('mkdir', join(root, 'secrets/new')),
            await call('remove', join(root, 'secrets/key.txt'))
        ];
        await w.hosts.close();
        expect([
            made.value,
            existsSync(join(root, 'new/inner')),
            gone.value,
            existsSync(join(root, 'dir/b.txt')),
            closed.map((one) => one.error),
            existsSync(join(root, 'secrets/key.txt'))
        ]).toEqual([null, true, null, false, ['NoPermissions', 'NoPermissions'], true]);
    });

    it('tells the host its workspace folders', async () => {
        const { w, root, call } = setup();
        const folders = await call('folders');
        await w.hosts.close();
        expect(folders.value).toEqual([root]);
    });
});

describe('the workspace folders of a host', () => {
    it('are told to the host when a folder joins or leaves the workspace, once for each change', async () => {
        const { w, root, call } = setup();
        await call('watchFolders');
        const dir = join(dirname(root), 'second');
        mkdirSync(dir, { recursive: true });
        w.fixture.roots.push({ key: 'second', dir });
        w.hosts.reconcile();
        w.hosts.reconcile();
        const joined = await call('folders');
        w.fixture.roots.pop();
        w.hosts.reconcile();
        const events = (await call('eventsAt', 2)).value as string[][];
        const left = await call('folders');
        await w.hosts.close();
        expect([
            (joined.value as string[]).length,
            events.map((one) => one.slice(0, 3)),
            (left.value as string[]).length
        ]).toEqual([
            2,
            [
                ['folders', 'second', ''],
                ['folders', '', 'second']
            ],
            1
        ]);
    });
});

describe('a WorkspaceEdit', () => {
    it('edits a file of the scope, and applies nothing when one of its files is outside or closed', async () => {
        const { w, root, outside, call } = setup();
        const one = await call('edit', join(root, 'a.txt'), 'HELLO');
        const closed = await call('edit', join(root, 'secrets/key.txt'), 'KEY!!');
        const mixed = await call(
            'editTwo',
            join(root, 'dir/b.txt'),
            join(outside, 'o.txt'),
            'XXXXX'
        );
        await w.hosts.close();
        expect([
            one.value,
            readFileSync(join(root, 'a.txt'), 'utf8'),
            closed.value,
            readFileSync(join(root, 'secrets/key.txt'), 'utf8'),
            mixed.value,
            readFileSync(join(root, 'dir/b.txt'), 'utf8'),
            readFileSync(join(outside, 'o.txt'), 'utf8')
        ]).toEqual([true, 'HELLO world\n', false, 'key\n', false, 'bee\n', 'out\n']);
    });

    it('writes no text when a file operation of the same edit is refused', async () => {
        const { w, root, call } = setup();
        const done = await call(
            'createAndEdit',
            join(root, 'a.txt'),
            join(root, 'secrets/new.txt'),
            'HELLO'
        );
        await w.hosts.close();
        expect([
            done.value,
            readFileSync(join(root, 'a.txt'), 'utf8'),
            existsSync(join(root, 'secrets/new.txt'))
        ]).toEqual([false, 'hello world\n', false]);
    });
});

describe('a file system watcher', () => {
    it('tells the host of a file created in the scope that its glob matches', async () => {
        const fired = firedWatch();
        const { w, root, call } = setup({ watchFolder: fired.watch });
        await call('watch', '**/*.md');
        writeFileSync(join(root, 'dir/new.md'), 'x\n');
        fired.fire('rename', 'dir/new.md');
        const events = (await call('eventsAt', 1)).value as [string, string][];
        await w.hosts.close();
        expect(events.map((one) => [one[0], one[1].slice(-10)])).toEqual([
            ['create', 'dir/new.md']
        ]);
    });
});

const PROVIDERS = resolve(
    import.meta.dirname,
    '../../../../../src/lib/server/machine/apps/host/runner/tools/languages/providers.mjs'
);

/**
 * The paths each glob's document selector selects in the runner, which a node process answers
 * since the runner is plain JavaScript that tsc does not read from a test.
 */
function runnerSelected(globs: string[], paths: string[]): string[][] {
    const script = `
import { filtersOf, selects } from ${JSON.stringify(pathToFileURL(PROVIDERS).href)};
const [globs, paths] = JSON.parse(process.argv[1]);
process.stdout.write(JSON.stringify(globs.map((glob) => paths.filter((path) => selects(
  filtersOf({ language: 'x', pattern: glob }),
  { languageId: 'x', uri: { scheme: 'file', path } }
)))));
`;
    const out = execFileSync(
        process.execPath,
        ['--input-type=module', '-e', script, JSON.stringify([globs, paths])],
        { encoding: 'utf8' }
    );
    return JSON.parse(out) as string[][];
}

/** Every name under a folder, with the text of each file, in order. */
function snapshot(root: string): [string, string | null][] {
    return readdirSync(root, { recursive: true, encoding: 'utf8' })
        .sort()
        .map((name) => {
            const full = join(root, name);
            return [name, lstatSync(full).isFile() ? readFileSync(full, 'utf8') : null];
        });
}

describe('the writes of a host in History', () => {
    const ROWS: [string, string[], string[]][] = [
        ['mkdir', ['new/inner'], ['create']],
        ['remove', ['dir/b.txt'], ['delete']],
        ['removeAll', ['empty'], ['delete']],
        ['removeToTrash', ['a.txt'], ['trash']],
        ['rename', ['a.txt', 'c.txt'], ['rename']],
        ['rename', ['dir', 'other'], ['rename']],
        ['copy', ['a.txt', 'copy.txt'], ['rename', 'copy']],
        ['copy', ['dir', 'dir-copy'], ['rename', 'copy']]
    ];

    it.each(ROWS)(
        'lists %s of %j in History as %j, and Undo puts the files back as they were',
        async (op, args, fields) => {
            const { w, root, call } = setup();
            // An undone delete of a folder makes the folder again and none of what it held.
            mkdirSync(join(root, 'empty'));
            const first = snapshot(root);
            const done = await call(op, ...args.map((one) => join(root, one)));
            const listed = w.changes().map((one) => one.field);
            const changed = JSON.stringify(snapshot(root)) !== JSON.stringify(first);
            const undone: (string | null)[] = [];
            for (const change of w.changes()) undone.push(await w.undo(change));
            await w.hosts.close();
            expect([done.error, listed, changed, undone, snapshot(root)]).toEqual([
                undefined,
                fields,
                true,
                fields.map(() => null),
                first
            ]);
        }
    );
});

describe('a folder that holds a hub', () => {
    it('is refused closed when copied, renamed or deleted whole, and the hub is untouched', async () => {
        const { w, root, call } = setup({
            roots: {
                r: {
                    'group/hub/a.txt': 'hub\n',
                    'group/hub/secrets/key.txt': 'key\n',
                    'group/other.txt': 'other\n'
                }
            },
            more: (base) => [{ key: 'hub', dir: join(base, 'roots/r/group/hub'), hub: true }],
            privateReal: (base) => [realpathSync(join(base, 'roots/r/group/hub/secrets'))]
        });
        const group = join(root, 'group');
        const rows = [
            await call('copy', group, join(root, 'copied')),
            await call('rename', group, join(root, 'moved')),
            await call('removeAll', group),
            await call('remove', group)
        ];
        const ordinary = await call('copy', join(root, 'group/other.txt'), join(root, 'o.txt'));
        await w.hosts.close();
        expect([
            rows.map((one) => `${one.error}: ${one.message?.split(':')[0]}`),
            existsSync(join(root, 'group/hub/secrets/key.txt')),
            existsSync(join(root, 'copied')),
            existsSync(join(root, 'moved')),
            ordinary.value,
            w.changes().map((one) => one.field)
        ]).toEqual([
            Array(4).fill('NoPermissions: closed'),
            true,
            false,
            false,
            null,
            ['rename', 'copy']
        ]);
    });
});

describe('a root inside the folder of another root', () => {
    it("keeps closed what the outer root's closed_paths names, to a read through the inner root and to a delete of a folder holding it", async () => {
        const { w, root, call } = setup({
            roots: {
                r: {
                    'group/sub/private/k.txt': 'k\n',
                    'group/sub/open.txt': 'o\n'
                }
            },
            more: (base) => [{ key: 'inner', dir: join(base, 'roots/r/group') }],
            closedPaths: ['secrets', 'group/sub/private']
        });
        const rows = [
            await call('read', join(root, 'group/sub/private/k.txt')),
            await call('removeAll', join(root, 'group/sub'))
        ];
        const open = await call('read', join(root, 'group/sub/open.txt'));
        await w.hosts.close();
        expect([
            rows.map((one) => `${one.error}: ${one.message?.split(':')[0]}`),
            existsSync(join(root, 'group/sub/private/k.txt')),
            open.value
        ]).toEqual([['NoPermissions: closed', 'NoPermissions: closed'], true, 'o\n']);
    });
});

describe('findFiles exclude', () => {
    it('leaves out node_modules and what the Files view hides when undefined, nothing when null, and what a glob matches when it is one', async () => {
        const { w, root, call } = setup({
            roots: {
                r: {
                    'a.md': 'a\n',
                    'dir/n.md': 'n\n',
                    'node_modules/p/x.md': 'x\n',
                    '__pycache__/y.md': 'y\n',
                    '.hidden/z.md': 'z\n'
                }
            }
        });
        const found = async (exclude: string): Promise<string[]> =>
            ((await call('find', '**/*.md', exclude)).value as string[])
                .map((one) => one.slice(root.length + 1))
                .sort();
        const rows = [
            await found('default'),
            await found('null'),
            await found('**/dir/**'),
            await found('**/*_modules/**')
        ];
        await w.hosts.close();
        expect(rows).toEqual([
            ['a.md', 'dir/n.md'],
            ['__pycache__/y.md', 'a.md', 'dir/n.md', 'node_modules/p/x.md'],
            ['__pycache__/y.md', 'a.md', 'node_modules/p/x.md'],
            ['__pycache__/y.md', 'a.md', 'dir/n.md']
        ]);
    });
});

describe('a glob', () => {
    const FILES = [
        'a.d.ts',
        'dir/b.d.ts',
        'a.md',
        'dir/c.txt',
        'src/test.js',
        'src/a/b/test.js',
        'lib/test.js',
        'dir/d.js'
    ];
    const GLOBS: Record<string, string[]> = {
        '**/*.d.ts': ['a.d.ts', 'dir/b.d.ts'],
        '**/*.{md,txt}': ['a.md', 'dir/c.txt'],
        '**/src/**/test.js': ['src/a/b/test.js', 'src/test.js']
    };

    it('selects the same files in a document selector, in findFiles and in a file watcher', async () => {
        const fired = firedWatch();
        const { w, root, call } = setup({
            roots: { r: Object.fromEntries(FILES.map((one) => [one, 'x\n'])) },
            watchFolder: fired.watch
        });
        const globs = Object.keys(GLOBS);
        for (const glob of globs) await call('watch', glob, glob);
        for (const file of FILES) fired.fire('rename', file);
        const total = Object.values(GLOBS).reduce((sum, list) => sum + list.length, 0);
        const events = (await call('eventsAt', total)).value as [string, string, string][];
        const watched = (glob: string): string[] =>
            events
                .filter((one) => one[2] === glob)
                .map((one) => one[1].slice(root.length + 1))
                .sort();
        const found = async (glob: string): Promise<string[]> =>
            ((await call('find', glob, 'default')).value as string[])
                .map((one) => one.slice(root.length + 1))
                .sort();
        const runner = runnerSelected(
            globs,
            FILES.map((file) => join(root, file))
        );
        const inRunner = (glob: string): string[] =>
            runner[globs.indexOf(glob)].map((path) => path.slice(root.length + 1)).sort();
        const inRelay = (glob: string): string[] => {
            const info = {
                selector: [{ language: 'x', pattern: glob }]
            } as unknown as AppServerInfo;
            return FILES.filter((file) => relaySelects(info, 'x', join(root, file))).sort();
        };
        const rows: Record<string, string[][]> = {};
        for (const glob of globs) {
            rows[glob] = [watched(glob), await found(glob), inRunner(glob), inRelay(glob)];
        }
        await w.hosts.close();
        expect(rows).toEqual(
            Object.fromEntries(
                Object.entries(GLOBS).map(([glob, list]) => [glob, Array(4).fill(list)])
            )
        );
    });

    it('selects a file whose name starts with a dot in a selector, as every glob of oculus does', () => {
        const paths = ['/r/.hidden/x.md', '/r/dir/.draft.md'];
        const [deep, named] = runnerSelected(['**/*.md', '*.md'], paths);
        expect([deep, named]).toEqual([paths, paths]);
    });
});
