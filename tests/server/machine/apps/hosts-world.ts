// Layer 4, test helper. Machine apps with hosts on disk, read the way the watcher reads them, and
// host processes that are scripted connections in the test's own process: the same JSON-RPC
// framing the runner speaks, none of its node process. A case scripts what each app's host
// answers and reads what the manager asked of it.
//
// Every folder is under the system temporary directory (tests/fixtures/scratch.ts), the keyring
// is in memory and the store is a map, so a case never touches `~/.oculus`, the machine's keyring
// or an app's real store.

import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { writeFileSync } from 'node:fs';
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
import { appsSettings, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { AppHostRow, AppHostsPayload, Message } from '../../../../src/lib/data/model/index.ts';
import type { AppsSettings } from '../../../../src/lib/data/sources/config/settings.ts';
import { Hub, type Sink } from '../../../../src/lib/server/core/channels.ts';
import type { Clock } from '../../../../src/lib/server/core/file-poll.ts';
import type {
    AppHosts,
    HostsOptions
} from '../../../../src/lib/server/machine/apps/host/manager.ts';
import type { AppsHeld } from '../../../../src/lib/server/machine/apps/read/held.ts';
import { config, plant, type Fixture } from '../../../routes/apps/apps-fixture.ts';
import { hostsFixture, memoryKeyring, secretsOf } from './hosts-fixture.ts';

/** The runner and the entry of `vscode-jsonrpc` a real host is started with. */
export const RUNNER = resolve(
    import.meta.dirname,
    '../../../../src/lib/server/machine/apps/host/host-runner.mjs'
);
export const JSONRPC = createRequire(import.meta.url).resolve('vscode-jsonrpc/node');

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
export type Spawned = {
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
export type ManualClock = Clock & { advance: (ms: number) => void };

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
    hub.subscribe(sink, ['app-hosts', 'app-messages']);
    const later: { manager?: AppHosts } = {};
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
        ended: (id) =>
            new Promise((resolve) => {
                const look = (message: Message): void => {
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
