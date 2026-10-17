// Layer 2, server. Vite development and preview use one plugin to carry ServerContext into Kit, and
// one more (src/lib/server/root/styles/style-first.ts) compiles a Svelte component before its style
// module is answered. The plugin of src/lib/server/root/styles/pdf-styles.ts keeps PDF.js's
// stylesheet inside the PDF viewer in every mode. Vitest runs started together share
// node_modules/.vite and .svelte-kit, so `noVitestDepsCache` below turns off the one folder in
// node_modules/.vite that two runs cannot write at once, `syncTypesOnce` keeps a run from rewriting
// .svelte-kit/types while another run or svelte-check reads it, and the types lock (`lockTypes`)
// has a vitest start, a `svelte-kit sync` or a build that finds another writing the types wait for
// it. A sync or a build waits for the vitest runs that read the types: a `vitest run` until it
// exits, a vitest in watch mode while a run is in progress and never while it waits for a change. A
// build also says when it has written them (`typesLocked`), which is when npm run test:landing
// starts its readers, and SvelteKit's build workers resolve the config with the kit options alone
// (`kitOptionsOnly`), so no part of a build writes the types after that. The development server is
// not touched by any of them.
//
// The config is a function of the Vite mode. Under the mode `app`, which the desktop host's build
// runs (`vite build --mode app`), SvelteKit writes `.svelte-kit-app/` and the adapter writes
// `build-app/`, and Vite reads that folder's tsconfig, so the build neither writes nor reads a
// folder `npm run build`, `npm run check` or the dev server use. Every other mode writes
// `.svelte-kit/` and `build/`.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import type { Reporter } from 'vitest/node';
import { engineDir, loadMachine } from './src/lib/data/sources/config.ts';
import { dropLock, processRuns, takeLock, type LockWaits } from './src/lib/server/core/json.ts';
import { componentBeforeStyle } from './src/lib/server/root/styles/style-first.ts';
import { scopePdfStyles } from './src/lib/server/root/styles/pdf-styles.ts';
import {
    APP_FOLDERS,
    APP_MODE,
    PLAIN_FOLDERS
} from './src/lib/server/root/process/build-folders.ts';
import { oculusViteServer } from './src/lib/server/root/vite-plugin.ts';
import { openWorkspace } from './src/lib/server/files/workspace/open.ts';
import { defaultStateFolder } from './src/lib/server/files/workspace/state.ts';

/** The port the primary hub of the open workspace names, the default one without a primary. */
function devPort(): number {
    const open = openWorkspace(defaultStateFolder());
    return loadMachine(open.hubs, open.primary).port;
}

/**
 * Vite optimizes a server environment's dependencies into `<cacheDir>/deps_<environment>` by
 * building a temporary folder and renaming folders into place, and two processes that do it at
 * once in one folder fail on the rename. @sveltejs/vite-plugin-svelte lists Svelte's modules as
 * dependencies of every server environment, which includes the environment Vitest names
 * `__vitest__`, whose folder every run of a project shares. Emptying the list with no discovery
 * turns the optimizer off for that environment only (`isDepOptimizationDisabled` in Vite), so no
 * folder is written and a run killed halfway leaves none behind. A hook ordered `post` runs after
 * the Svelte plugin's.
 */
const noVitestDepsCache: Plugin = {
    name: 'oculus:no-vitest-deps-cache',
    configEnvironment: {
        order: 'post',
        handler(name, config) {
            if (name !== '__vitest__') return;
            config.optimizeDeps ??= {};
            config.optimizeDeps.noDiscovery = true;
            config.optimizeDeps.include = [];
        }
    }
};

/**
 * The bare modules that only a web worker imports, for the page's dependencies Vite bundles in
 * development. Vite's scan of the page's imports skips an import with `?worker`, and with it every
 * module the worker imports, so a bare import first asked when the worker starts makes Vite bundle
 * the dependencies again and reload the page; the diff editor's worker
 * (ui/controls/editor/diff/inner-changes.worker.ts) starts at the first diff. Listed, they are
 * bundled when the server starts.
 */
const WORKER_DEPS = [
    'monaco-editor/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer',
    'monaco-editor/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm',
    'monaco-editor/editor/common/core/ranges/offsetRange'
];

const KIT_SERVER_PLUGIN = 'vite-plugin-sveltekit-compile';

/** The SvelteKit plugin whose `config` hook writes the types and that carries the kit options. */
const KIT_SETUP_PLUGIN = 'vite-plugin-sveltekit-setup';

/**
 * The environment variable that names a file a `vite build` writes once SvelteKit has written the
 * generated types (`typesLocked`), which is when npm run test:landing starts the commands that read
 * them.
 */
export const TYPES_WRITTEN = 'OCULUS_TYPES_WRITTEN';

/** The lock file in the kit folder that a process writing SvelteKit's types holds. */
const TYPES_LOCK = 'oculus-types.lock';

/** The start of the name of a reader's mark in the kit folder; the reader's process id follows. */
const READER_MARK = 'oculus-types.read.';

/**
 * How long a writer of the types waits for the vitest runs reading them to end, past which it stops
 * with an error rather than write under them: about the length of a whole run of the suite.
 */
const READERS_WAIT_MS = 15 * 60_000;

/** How long a writer holds the types lock once no run reads them: a generation takes seconds. */
const TYPES_WRITE_MS = 2 * 60_000;

/**
 * How a start waits on the types lock. A writer holds it while it waits for the runs that read the
 * types and while it writes them, so a start waits that long for a holder whose process runs, and
 * says once whom it waits for. A lock is taken over only once its process has ended, never by its
 * age, since a writer that waits for a long run holds a lock that is old and not left.
 */
const TYPES_LOCK_WAITS: LockWaits = {
    retryMs: 50,
    waitMs: READERS_WAIT_MS + TYPES_WRITE_MS,
    staleMs: null,
    tellWait: true
};

/** The pause between two looks at the readers' marks. */
const READERS_RETRY_MS = 200;

/** The process ids of the readers of the kit folder `kit` that still run, this process left out. */
function liveReaders(kit: string): number[] {
    let names: string[];
    try {
        names = readdirSync(kit);
    } catch {
        return [];
    }
    return names.flatMap((name) => {
        if (!name.startsWith(READER_MARK)) return [];
        const pid = Number(name.slice(READER_MARK.length));
        if (pid === process.pid) return [];
        if (Number.isInteger(pid) && pid > 0 && processRuns(pid)) return [pid];
        // A mark whose process ended, killed before it could take its mark away, reads nothing.
        try {
            unlinkSync(join(kit, name));
        } catch {
            // another process took it away first
        }
        return [];
    });
}

/**
 * Wait, holding the types lock, until no vitest run reads the types of the kit folder `kit`, so a
 * writer never rewrites a file under a run that reads it; no run starts reading meanwhile, since a
 * run marks itself a reader under the lock (`readTypes`). A wait past READERS_WAIT_MS is an error.
 */
async function noReaders(kit: string): Promise<void> {
    for (let waited = 0; waited <= READERS_WAIT_MS; waited += READERS_RETRY_MS) {
        const readers = liveReaders(kit);
        if (readers.length === 0) return;
        if (waited === 0) {
            console.error(`svelte-kit types: waiting for the vitest runs ${readers.join(', ')}`);
        }
        await new Promise((resolve) => setTimeout(resolve, READERS_RETRY_MS));
    }
    throw new Error(`the types are still read by ${liveReaders(kit).join(', ')}`);
}

/** The mark in the kit folder `kit` that makes this process a reader of its types. */
function readerMark(kit: string): string {
    return join(kit, `${READER_MARK}${String(process.pid)}`);
}

/**
 * Mark this process a reader of the types of the kit folder `kit`. It is made under the types lock,
 * so a writer that takes the lock after it waits until the mark is gone (`dropMark`): at this
 * process's exit, or, for a vitest in watch mode, at the end of the run in progress.
 */
function readTypes(kit: string): void {
    const mark = readerMark(kit);
    if (!existsSync(mark)) writeFileSync(mark, '');
}

/** Take this process's reader mark in the kit folder `kit` away, gone already or not. */
function dropMark(kit: string): void {
    try {
        unlinkSync(readerMark(kit));
    } catch {
        // gone already
    }
}

/**
 * Write the types of the checkout at `root` again with `svelte-kit sync` in a process of its own,
 * which takes the types lock and waits for the readers as every writer does.
 */
function syncAgain(root: string): Promise<void> {
    const script = join(root, 'node_modules', '@sveltejs', 'kit', 'svelte-kit.js');
    const sync = spawn(process.execPath, [script, 'sync'], { cwd: root, stdio: 'inherit' });
    return new Promise((done, failed) => {
        sync.once('error', failed);
        sync.once('exit', (code) => {
            if (code === 0) done();
            else failed(new Error(`svelte-kit sync ended with ${String(code)}`));
        });
    });
}

/** A reporter that says it is the one `watchReading` makes, carrying the kit folder it marks. */
type TypesReading = Reporter & { readsTypes: string };

/**
 * The reporter that has a vitest in watch mode read the types of the kit folder `kit` only while a
 * run is in progress: a run's start takes the reader mark under the types lock and its end takes it
 * away, so a `svelte-kit sync` or a build started beside an idle watcher waits for no run, and one
 * started during a run waits for that run. A start that took the lock over from a writer that ended
 * while it wrote has the types written again first (`syncAgain`), since they may be half written.
 */
function watchReading(kit: string, root: string): TypesReading {
    return {
        readsTypes: kit,
        async onTestRunStart() {
            let taken = await lockTypes(kit);
            if (taken.tookOver) {
                taken.drop();
                await syncAgain(root);
                taken = await lockTypes(kit);
            }
            try {
                readTypes(kit);
            } finally {
                taken.drop();
            }
        },
        onTestRunEnd() {
            dropMark(kit);
        }
    };
}

/**
 * Take the types lock of the kit folder `kit`, waiting while another process holds it, and answer
 * what drops it and whether it was taken over from a process that ended while it held it, which
 * may have left the types half written. SvelteKit writes the types with truncating writes, one
 * file after another, so a second writer started beside the first finds files empty or half
 * written; with the lock, the second starts only after the first has written every file. A lock
 * that cannot be taken is an error, since writing beside another writer is what the lock prevents.
 */
async function lockTypes(kit: string): Promise<{ drop: () => void; tookOver: boolean }> {
    mkdirSync(kit, { recursive: true });
    const lock = join(kit, TYPES_LOCK);
    const taken = await takeLock(lock, TYPES_LOCK_WAITS, 'svelte-kit types');
    if (!taken.ok) throw new Error(`the types lock was not taken: ${taken.reason}`);
    // Dropped once only: a second drop would remove a lock another process has taken since.
    let held = true;
    const drop = (): void => {
        if (held) dropLock(lock);
        held = false;
    };
    return { drop, tookOver: taken.tookOver };
}

/**
 * Take the types lock of the kit folder `kit` to write the types: once it is held, wait until no
 * vitest run reads them (`noReaders`), and answer what drops the lock. A wait that fails drops it.
 */
async function lockToWrite(kit: string): Promise<() => void> {
    const { drop } = await lockTypes(kit);
    try {
        await noReaders(kit);
    } catch (error) {
        drop();
        throw error;
    }
    return drop;
}

/**
 * Whether this process is `svelte-kit sync`. Its command line runs SvelteKit's `svelte-kit` script
 * (node_modules/.bin/svelte-kit, which names @sveltejs/kit/svelte-kit.js) with `sync`, and it loads
 * this config to read the kit options before it writes the types, with no hook of this config run
 * after the write, so the process holds the types lock from the load to its exit.
 */
function kitSyncRun(argv: readonly string[]): boolean {
    const script = basename(argv[1] ?? '');
    return (script === 'svelte-kit' || script === 'svelte-kit.js') && argv[2] === 'sync';
}

/**
 * The plugin that has a process writing SvelteKit's types take the types lock of the kit folder
 * `kitDir` while it writes them. SvelteKit writes them (`sync.all`) in the `config` hook of its
 * setup plugin, which runs in the order `pre`; this hook runs in that order too, and this plugin
 * comes before SvelteKit's, so the lock is taken before that write, and once it holds the lock it
 * waits until no vitest run reads the types (`lockToWrite`). A `svelte-kit sync` writes
 * them again after it has resolved this config, so it holds the lock from this hook to its exit.
 * A `vite build` writes them in that hook only, so it holds the lock from this hook to
 * `configResolved`, which runs once every `config` hook has run, and then writes the file the
 * variable TYPES_WRITTEN names, when it names one: that is how npm run test:landing knows the types
 * are written. The build's other passes write no types: its client build is SvelteKit's
 * secondary build, which skips the write, and its workers resolve this config without SvelteKit's
 * hooks (`kitOptionsOnly`). A vitest start or the development server does nothing here. The folder
 * is resolved from the working folder, as SvelteKit resolves its output folder.
 */
function typesLocked(kitDir: string): Plugin {
    let held: (() => void) | null = null;
    return {
        name: 'oculus-types-lock',
        enforce: 'pre',
        config: {
            order: 'pre',
            async handler(_, env) {
                if (kitSyncRun(process.argv)) {
                    process.once('exit', await lockToWrite(resolve(kitDir)));
                    return;
                }
                if (env.command !== 'build') return;
                held = await lockToWrite(resolve(kitDir));
                process.once('exit', held);
            }
        },
        configResolved() {
            if (held === null) return;
            held();
            held = null;
            const written = process.env[TYPES_WRITTEN];
            if (written !== undefined && written !== '') writeFileSync(written, '');
        }
    };
}

/**
 * The plugins of a SvelteKit build worker: a plugin that carries the kit options of SvelteKit's
 * setup plugin and nothing else. SvelteKit runs the analysis, the prerendering and the fallback
 * page of a build in worker threads whose environment holds SVELTEKIT_FORK
 * (node_modules/@sveltejs/kit/src/utils/fork.js), and each worker resolves this config only to
 * read the kit options off the plugin named `vite-plugin-sveltekit-setup`
 * (`load_config_from_vite`, node_modules/@sveltejs/kit/src/core/config/index.js:180). Resolved
 * with SvelteKit's own plugins, the setup plugin's `config` hook would rewrite every generated
 * type file in each worker while the build goes on, after the build has said the types are
 * written.
 */
async function kitOptionsOnly(pending: Promise<Plugin[]>): Promise<Plugin[]> {
    const plugins = await pending;
    const setup = plugins.find((plugin) => plugin.name === KIT_SETUP_PLUGIN);
    if (setup?.api?.options === undefined) {
        throw new Error(`${KIT_SETUP_PLUGIN} carries no kit options`);
    }
    return [{ name: KIT_SETUP_PLUGIN, api: { options: setup.api.options } }];
}

/**
 * SvelteKit's `configureServer` (the plugin named above) runs `sync.init` and `sync.create`, which
 * rewrite .svelte-kit with truncating writes and delete the files of routes that are gone, and
 * every vitest start creates a Vite server and so runs it. Another vitest start or `svelte-check`
 * reading `.svelte-kit/types` meanwhile finds a file empty or missing. A server that has the
 * `__vitest__` environment skips that hook while `non-ambient.d.ts`, the last file `sync.create`
 * writes, exists in the kit folder `kitDir`, so a vitest run never writes the types once they
 * exist; `svelte-kit sync` (which `npm run test:quick` runs before it starts vitest), `vite build`
 * (which npm run test:landing runs before it starts vitest) and the development server write them.
 * On a checkout without them the hook runs once, which is how a lone `npx vitest run` gets its
 * types; `npx svelte-kit sync` refreshes them after the routes change. A vitest server reads
 * whether the types exist under the types lock and holds it while the hook writes them, so of two
 * vitest starts, or a vitest start and a `svelte-kit sync` or a build, on a checkout without the
 * types, the second waits until the first has written them all and then finds them. A lock taken
 * over from a process that ended while it held it (a sync killed halfway) has the hook write the
 * types again, since they may be half written. Each vitest run then marks itself a reader of the
 * types under the lock (`readTypes`), and a sync or a build that writes them waits for every reader
 * to end (`lockToWrite`), so no run reads a file a writer has truncated. A `vitest run` is a reader
 * until it exits. A vitest in watch mode is one only while a run is in progress (`watchReading`,
 * added to the reporters by `configureVitest`, once for the projects that share the run), since a
 * watcher that waits for a change reads nothing and never exits. The development server and the
 * build do not have the environment and are not changed.
 */
async function syncTypesOnce(pending: Promise<Plugin[]>, kitDir: string): Promise<Plugin[]> {
    const plugins = await pending;
    const found = plugins.find((plugin) => plugin.name === KIT_SERVER_PLUGIN);
    const original = found?.configureServer;
    if (found === undefined || typeof original !== 'function') {
        throw new Error(`${KIT_SERVER_PLUGIN} has no configureServer function to wrap`);
    }
    const wrapped: Plugin = {
        ...found,
        async configureServer(server) {
            if (!('__vitest__' in server.environments)) return original.call(this, server);
            const kit = join(server.config.root, kitDir);
            const taken = await lockTypes(kit);
            process.once('exit', () => dropMark(kit));
            try {
                if (!taken.tookOver && existsSync(join(kit, 'non-ambient.d.ts'))) {
                    readTypes(kit);
                    return;
                }
                // The types are missing, or a process that ended while it held the lock may have
                // left them half written: they are written again, once no other run reads them.
                await noReaders(kit);
                const answer = await original.call(this, server);
                readTypes(kit);
                return answer;
            } finally {
                taken.drop();
            }
        },
        configureVitest({ vitest }) {
            if (!vitest.config.watch) return;
            const reporters = vitest.config.reporters;
            if (reporters.some((reporter) => 'readsTypes' in reporter)) return;
            const root = vitest.config.root;
            reporters.push(watchReading(join(root, kitDir), root));
        }
    };
    return plugins.map((plugin) => (plugin === found ? wrapped : plugin));
}

export default defineConfig(({ mode }) => {
    const app = mode === APP_MODE;
    const folders = app ? APP_FOLDERS : PLAIN_FOLDERS;
    // SvelteKit's analyse worker loads this config again with no mode of its own and takes the Vite
    // mode from `process.env.MODE` (node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:42
    // calls load_config, which reads it at src/core/config/index.js:192), and the worker is
    // started with a copy of this process's environment. Setting it here is what lets the worker
    // find the output of the app's build.
    if (app) process.env.MODE = mode;
    const development = oculusViteServer(engineDir(), { out: folders.adapter });
    const kit = sveltekit({
        outDir: folders.kit,
        compilerOptions: {
            runes: ({ filename }) =>
                filename.split(/[/\\]/).includes('node_modules') ? undefined : true
        },
        adapter: development.adapter
    });

    return {
        // Vite reads the tsconfig SvelteKit generated for this build, so the app's build reads no
        // file under `.svelte-kit/`.
        ...(app ? { tsconfig: `${folders.kit}/tsconfig.json` } : {}),
        plugins:
            process.env.SVELTEKIT_FORK === 'true'
                ? [kitOptionsOnly(kit)]
                : [
                      typesLocked(folders.kit),
                      componentBeforeStyle(),
                      scopePdfStyles(),
                      syncTypesOnce(kit, folders.kit),
                      development.plugin,
                      noVitestDepsCache
                  ],
        optimizeDeps: { include: WORKER_DEPS },
        server: {
            host: '127.0.0.1',
            port: devPort(),
            strictPort: true
        },
        test: {
            // A test tagged slow starts a process, waits on a real timer, opens a socket or takes
            // 100 ms or more in a run of its own. `// @module-tag slow` in a file's head comment
            // tags the whole file, and `{ tags: ['slow'] }` tags a test or a describe. npm test
            // leaves tagged tests out and npm run test:slow runs them. The tree checks under
            // tests/checks, tagged or not, are left out of both and run by npm run test:checks with
            // no time limit, since a finding of theirs is a defect in the tree.
            tags: [
                {
                    name: 'slow',
                    description:
                        'Left out of npm test; npm run test:slow runs it, except under tests/checks.'
                }
            ],
            expect: { requireAssertions: true },
            // seti-ui's .less files are read as text (`?raw`) by ui/display/file-icons.ts. Vitest
            // empties every stylesheet it does not process, a file read as text included, so these
            // are listed.
            css: { include: [/seti-ui\/.*\.less/] },
            // Four workers, not one per core: two or three worktrees run this suite at once beside
            // the machine's own sessions, and a suite that takes every core makes the timed cases
            // of the others miss their limits under the load.
            maxWorkers: 4,
            // Three projects, each with its own files, so no list is merged into another's. A file
            // named *.client.test.ts runs in Svelte's client runtime, where effects and their
            // teardowns run (tests/ui/frame/client-runtime.ts), with Svelte inlined so it is
            // resolved with the browser's conditions rather than loaded as Node loads its server
            // build. A file named *.dom.test.ts runs in jsdom, a document in node, so a library that
            // needs one (DOMPurify, which ui/html.ts sanitises with) runs as in the page. Every
            // other file runs in node against the server build, which renders a component to a
            // string.
            projects: [
                {
                    extends: true,
                    test: {
                        name: 'unit',
                        environment: 'node',
                        include: [
                            'tests/**/*.test.ts',
                            '!tests/**/*.client.test.ts',
                            '!tests/**/*.dom.test.ts'
                        ]
                    }
                },
                {
                    extends: true,
                    test: {
                        name: 'dom',
                        environment: 'jsdom',
                        include: ['tests/**/*.dom.test.ts']
                    }
                },
                {
                    extends: true,
                    resolve: { conditions: ['browser'] },
                    test: {
                        name: 'client',
                        environment: './tests/ui/frame/client-runtime.ts',
                        include: ['tests/**/*.client.test.ts'],
                        server: { deps: { inline: [/svelte/] } }
                    }
                }
            ]
        }
    };
});
