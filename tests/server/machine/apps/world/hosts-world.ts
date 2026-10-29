// Layer 4, test helper. Machine apps with hosts on disk, read the way the watcher reads them, and
// host processes that are scripted connections in the test's own process: the same JSON-RPC
// framing the runner speaks, none of its node process. A case scripts what each app's host
// answers and reads what the manager asked of it.
//
// Every folder is under the system temporary directory (tests/fixtures/scratch.ts), the keyring
// is in memory and the store is a map, so a case never touches `~/.oculus`, the machine's keyring
// or an app's real store.

import type { TerminalsEnv } from '../../../../../src/lib/server/machine/apps/tools/run/terminals.ts';
import { terminalsDouble } from './terminals-double.ts';
import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';
import { PassThrough } from 'node:stream';
import {
    createMessageConnection,
    ResponseError,
    StreamMessageReader,
    StreamMessageWriter,
    type MessageConnection
} from 'vscode-jsonrpc/node';
import { appsSettings, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import type {
    AppHostRow,
    AppHostsPayload,
    Message
} from '../../../../../src/lib/data/model/index.ts';
import type { AppsSettings } from '../../../../../src/lib/data/sources/config/settings/machine.ts';
import { Hub, type Sink } from '../../../../../src/lib/server/core/channels.ts';
import type { Clock } from '../../../../../src/lib/server/core/files/file-poll.ts';
import type {
    AppHosts,
    HostsOptions
} from '../../../../../src/lib/server/machine/apps/host/manager.ts';
import type { AppsHeld } from '../../../../../src/lib/server/machine/apps/read/held.ts';
import { config, plant, type Fixture } from '../../../../routes/apps/apps-fixture.ts';
import { joinedFor } from '../../../../../src/lib/data/helpers/files/apps/tools/languages.ts';
import { readChanges, type Change } from '../../../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../../../src/lib/server/core/json.ts';
import { undoFiles } from '../../../../../src/lib/server/edit/writes/file-undo.ts';
import type { WriteTarget } from '../../../../../src/lib/server/edit/writes.ts';
import { runOps, type OpsTarget } from '../../../../../src/lib/server/files/fs/ops.ts';
import { diskFs } from '../../../../../src/lib/server/machine/apps/reach/open.ts';
import type { ToolsEnv } from '../../../../../src/lib/server/machine/apps/tools/scope.ts';
import { hostsFixture, memoryKeyring, secretsOf } from './hosts-fixture.ts';

/** The runner and the entry of `vscode-jsonrpc` a real host is started with. */
export const RUNNER = resolve(
    import.meta.dirname,
    '../../../../../src/lib/server/machine/apps/host/runner/host-runner.mjs'
);
const JSONRPC = createRequire(import.meta.url).resolve('vscode-jsonrpc/node');

/** What one app of a world holds: its host file, more manifest keys and more files. */
export type AppSpec = {
    /** The host file's text; null for an app that names no host. */
    host?: string | null;
    keys?: string;
    files?: Record<string, string>;
};

/** What a scripted host answers; a missing member answers `null`. */
export type Script = {
    activate?: (params: Record<string, unknown>) => unknown;
    request?: (params: Record<string, unknown>) => unknown;
    apiCall?: (params: Record<string, unknown>) => unknown;
    /** Called with the keys of a `oculus/storeChanged` notification. */
    storeChanged?: (params: Record<string, unknown>) => void;
    /** Whether the process outlives SIGTERM, which only SIGKILL ends. */
    survive?: boolean;
    /** Called by `oculus/deactivate`; its promise settles it. One that never settles hangs. */
    deactivate?: () => unknown;
};

/** One host process the manager started. */
type Spawned = {
    name: string;
    command: string;
    args: readonly string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    /** The host's end of the connection: it can make requests of oculus. */
    connection: MessageConnection;
    activated: Record<string, unknown>[];
    requests: Record<string, unknown>[];
    notified: Record<string, unknown>[];
    deactivations: number;
    signals: string[];
    /** The host's standard error. */
    stderr: PassThrough;
    /** End the process the way a process ends. */
    end: (code: number | null, signal?: string) => void;
    ended: boolean;
};

/** A clock the test advances by hand. */
type ManualClock = Clock & { advance: (ms: number) => void };

export function manualClock(): ManualClock {
    let at = 0;
    let next = 1;
    const timers = new Map<number, { due: number; run: () => void }>();
    return {
        setTimeout(run, ms) {
            const id = next++;
            timers.set(id, { due: at + ms, run });
            return id;
        },
        clearTimeout(timer) {
            timers.delete(timer as number);
        },
        advance(ms) {
            at += ms;
            for (const [id, held] of [...timers]) {
                if (held.due <= at) {
                    timers.delete(id);
                    held.run();
                }
            }
        }
    };
}

/** The spawn the manager is given: scripted hosts instead of processes. */
function scriptedSpawn(scripts: Record<string, Script>, spawned: Spawned[]): typeof nodeSpawn {
    const spawn = (
        command: string,
        args: readonly string[],
        options: { cwd?: string; env?: NodeJS.ProcessEnv }
    ) => {
        const cwd = options.cwd ?? '';
        const name = basename(cwd);
        const script = scripts[name] ?? {};
        const stdin = new PassThrough();
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        const child = Object.assign(new EventEmitter(), {
            stdin,
            stdout,
            stderr,
            pid: 4000 + spawned.length
        });
        const connection = createMessageConnection(
            new StreamMessageReader(stdin),
            new StreamMessageWriter(stdout)
        );
        const host: Spawned = {
            name,
            command,
            args,
            cwd,
            env: options.env ?? {},
            connection,
            activated: [],
            requests: [],
            notified: [],
            deactivations: 0,
            signals: [],
            stderr,
            ended: false,
            end(code, signal = '') {
                if (host.ended) return;
                host.ended = true;
                connection.dispose();
                stdout.end();
                stderr.end();
                child.emit('exit', code, signal === '' ? null : signal);
                child.emit('close', code, signal === '' ? null : signal);
            }
        };
        const answer = (value: unknown): unknown => value ?? null;
        connection.onRequest('oculus/activate', (params: Record<string, unknown>) => {
            host.activated.push(params);
            return answer(script.activate?.(params));
        });
        connection.onRequest('oculus/request', async (params: Record<string, unknown>) => {
            host.requests.push(params);
            try {
                return answer(await script.request?.(params));
            } catch (error) {
                throw new ResponseError(1, error instanceof Error ? error.message : String(error));
            }
        });
        connection.onRequest('oculus/apiCall', (params: Record<string, unknown>) =>
            answer(script.apiCall?.(params) ?? (params.fn === undefined ? [] : null))
        );
        connection.onNotification('oculus/storeChanged', (params: Record<string, unknown>) => {
            host.notified.push(params);
            script.storeChanged?.(params);
        });
        connection.onRequest('oculus/deactivate', async () => {
            host.deactivations += 1;
            await script.deactivate?.();
            setTimeout(() => host.end(0), 0);
            return null;
        });
        connection.listen();
        stdin.on('finish', () => host.end(0));
        Object.assign(child, {
            kill: (signal: string) => {
                host.signals.push(signal);
                if (!(script.survive === true && signal === 'SIGTERM')) host.end(null, signal);
                return true;
            }
        });
        spawned.push(host);
        return child as unknown as ChildProcessWithoutNullStreams;
    };
    return spawn as unknown as typeof nodeSpawn;
}

/** The apps a world is made of, and the host processes they start. */
export type World = {
    fixture: Fixture;
    hub: Hub;
    hosts: AppHosts;
    spawned: Spawned[];
    clock: ManualClock;
    /** Resolves with the row of the host once a published row says it ended. */
    ended: (id: string) => Promise<AppHostRow>;
    /**
     * Resolves when `accepts` is true: at once when it is, else after the first message the hub
     * carries on `app-hosts`, `app-messages` or `app-tools`, or the first change of the tools,
     * that makes it true.
     */
    until: (accepts: () => boolean) => Promise<void>;
    /** The messages the hub carried, by channel. */
    carried: (channel: string) => Message[];
    held: () => AppsHeld;
    /** The apps read again with only these names approved (all by default). */
    rescan: (approve?: string[]) => AppsHeld;
    /** The store the hosts read and write, by view id. */
    stores: Map<string, Record<string, unknown>>;
    keyring: ReturnType<typeof memoryKeyring>;
    settings: AppsSettings;
    /** Keep the app approved while its files change, as its manifest is now. */
    keep: (name: string) => void;
    /** Write a file of a machine app and read the apps again. */
    edit: (name: string, file: string, body: string) => AppsHeld;
    /** Write the record of the disabled apps and read the apps again. */
    disable: (...ids: string[]) => AppsHeld;
    /** Read the apps for another workspace, as a switch of workspace does. */
    switchWorkspace: (key: string) => AppsHeld;
    /** The changes the writes of the hosts recorded, newest first, as History lists them. */
    changes: () => Change[];
    /** The paths the writes sent to the Trash, which are removed in place of a Trash. */
    trashed: string[];
    /** Take one recorded change back, as the Undo of History does; the answer's error or null. */
    undo: (change: Change) => Promise<string | null>;
};

/**
 * Machine apps `specs` on disk, each approved unless left out of `approve`, with a manager over
 * scripted hosts. `settings` replaces members of the apps limits.
 */
export function world(
    specs: Record<string, AppSpec>,
    scripts: Record<string, Script> = {},
    over: {
        approve?: string[];
        settings?: Partial<AppsSettings>;
        options?: Partial<HostsOptions>;
        roots?: Record<string, Record<string, string>>;
        prefix?: string;
        /** Start the real runner under node instead of a scripted host. */
        real?: boolean;
        /** The terminals env the hosts' terminals and tasks run in; in-memory rows when absent. */
        terminals?: TerminalsEnv;
        /** More roots served, from the base folder of the world; a hub is marked `hub`. */
        more?: (base: string) => { key: string; dir: string; hub?: boolean }[];
        /** The real paths closed to every app (`privateReal`), from the base folder. */
        privateReal?: (base: string) => string[];
        /** The folders `closed_paths` names; `secrets` alone when absent. */
        closedPaths?: string[];
        /** The platform's folder watch the hosts' file watchers use; the real one when absent. */
        watchFolder?: ToolsEnv['watchFolder'];
    } = {}
): World {
    const files: Record<string, string> = {};
    for (const [name, spec] of Object.entries(specs)) {
        const named = spec.host === null ? '' : 'host: host.mjs\n';
        files[`${name}/app.yml`] =
            `name: ${name}\ntitle: ${name}\nbridge: 1\n${named}${spec.keys ?? ''}`;
        files[`${name}/index.html`] = '<!doctype html><title>a</title>\n';
        if (spec.host !== null) {
            files[`${name}/host.mjs`] = spec.host ?? 'export function activate() {}\n';
        }
        for (const [path, body] of Object.entries(spec.files ?? {}))
            files[`${name}/${path}`] = body;
    }
    const fixture = plant({ machine: files, roots: over.roots }, over.prefix);
    fixture.roots.push(...(over.more?.(fixture.base) ?? []));
    const settings: AppsSettings = { ...appsSettings(config), ...over.settings };
    let approved: ReadonlySet<string> = new Set();
    const kept = new Map<string, string>();
    let held = fixture.scan(new Set());
    const names = (list?: string[]): ReadonlySet<string> => {
        const wanted = new Set(list ?? Object.keys(specs));
        return new Set(
            held.apps.filter((one) => wanted.has(one.row.name)).map((one) => one.row.hash)
        );
    };
    approved = names(over.approve);
    held = fixture.scan(approved, kept);
    const hub = new Hub();
    const spawned: Spawned[] = [];
    const clock = manualClock();
    const stores = new Map<string, Record<string, unknown>>();
    const keyring = memoryKeyring();
    const seen = new Map<string, Message[]>();
    const listeners = new Set<(message: Message) => void>();
    const sink: Sink = {
        send: (text) => {
            const message = JSON.parse(text) as Message;
            seen.set(message.channel, [...(seen.get(message.channel) ?? []), message]);
            for (const listener of [...listeners]) listener(message);
            return Promise.resolve();
        },
        close: () => undefined
    };
    hub.subscribe(sink, ['app-hosts', 'app-messages', 'app-tools']);
    const later: { manager?: AppHosts } = {};
    const trashed: string[] = [];
    const writes = fsWrites();
    // The change log waits on a chain of its own, as the process's does, apart from the writes'.
    const changeLog = { file: join(fixture.base, 'changes.jsonl'), keep: 500, writes: fsWrites() };
    const opsTarget = (): OpsTarget => ({
        roots: fixture.roots,
        writes,
        changes: changeLog,
        history: join(fixture.base, 'history')
    });
    const { hosts } = hostsFixture(hub, {
        apps: { held: () => held },
        settings: () => settings,
        roots: () => fixture.roots,
        approved: () => approved,
        store: {
            get: (app) => stores.get(app.id) ?? {},
            update: (app, key, value) => {
                const map = Object.fromEntries(
                    Object.entries(stores.get(app.id) ?? {}).filter(([name]) => name !== key)
                );
                if (value !== undefined) map[key as string] = value;
                stores.set(app.id, map);
                later.manager?.storeChanged([app.id]);
                return Promise.resolve({ ok: true });
            }
        },
        secrets: secretsOf(keyring),
        text: () => textCatalog(config),
        tools: {
            context: () => ({
                roots: fixture.roots,
                configDir: join(fixture.base, 'config'),
                closedPaths: over.closedPaths ?? ['secrets'],
                privateReal: over.privateReal?.(fixture.base) ?? [],
                fs: diskFs
            }),
            maxBytes: () => 1024 * 1024,
            scanEntries: () => 1000,
            languages: () =>
                joinedFor(
                    new Map(),
                    held.apps.map((one) => one.row)
                ),
            ops: (operation, app) =>
                runOps(opsTarget(), operation, {
                    trashReplaced: false,
                    app,
                    trash: (path) => {
                        trashed.push(path);
                        rmSync(path, { recursive: true, force: true });
                        return Promise.resolve();
                    }
                }),
            terminals: over.terminals ?? terminalsDouble(),
            ...(over.watchFolder === undefined ? {} : { watchFolder: over.watchFolder })
        },
        ...(over.real === true
            ? { runner: RUNNER, jsonrpc: JSONRPC }
            : { spawn: scriptedSpawn(scripts, spawned), clock }),
        ...over.options
    });
    later.manager = hosts;
    return {
        fixture,
        hub,
        hosts,
        spawned,
        clock,
        carried: (channel) => seen.get(channel) ?? [],
        until: (accepts) =>
            new Promise((resolve) => {
                const off = hosts.tools.onChange(() => look());
                const look = (): void => {
                    if (!accepts()) return;
                    listeners.delete(look);
                    off();
                    resolve();
                };
                listeners.add(look);
                look();
            }),
        ended: (id) =>
            new Promise((resolve) => {
                const look = (message: Message): void => {
                    if (message.channel !== 'app-hosts') return;
                    const rows = (message.payload as AppHostsPayload).rows;
                    const row = rows.find((one) => one.app === id && one.state === 'ended');
                    if (row === undefined) return;
                    listeners.delete(look);
                    resolve(row);
                };
                const now = seen.get('app-hosts')?.at(-1);
                if (now !== undefined) look(now);
                if (!listeners.has(look)) listeners.add(look);
            }),
        held: () => held,
        rescan(approve) {
            approved = approve === undefined ? approved : names(approve);
            held = fixture.scan(approved, kept);
            hosts.reconcile();
            return held;
        },
        keep(name) {
            const app = held.apps.find((one) => one.row.name === name);
            if (app !== undefined) kept.set(app.id, app.manifestHash);
        },
        edit(name, file, body) {
            writeFileSync(join(fixture.machine, name, file), body);
            held = fixture.scan(approved, kept);
            hosts.reconcile();
            return held;
        },
        stores,
        keyring,
        settings,
        changes: () => readChanges(changeLog),
        trashed,
        undo: async (change) => {
            const done = await undoFiles(
                {
                    files: {
                        roots: () => fixture.roots,
                        config: join(fixture.base, 'config'),
                        history: join(fixture.base, 'history'),
                        writes
                    }
                } as unknown as WriteTarget,
                change,
                {
                    trash: (path) => {
                        trashed.push(path);
                        rmSync(path, { recursive: true, force: true });
                        return Promise.resolve();
                    }
                }
            );
            return 'error' in done ? done.error : null;
        },
        disable(...ids) {
            writeFileSync(
                join(fixture.base, 'apps.json'),
                JSON.stringify({ version: 1, disabled: ids, workspaces: {} })
            );
            held = fixture.scan(approved, kept);
            hosts.reconcile();
            return held;
        },
        switchWorkspace(key) {
            fixture.workspace = key;
            held = fixture.scan(approved, kept);
            hosts.reconcile();
            return held;
        }
    };
}
