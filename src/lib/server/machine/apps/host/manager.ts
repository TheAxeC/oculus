// Layer 2, server. The hosts of the apps: which app has a host process, when it starts, how it is
// answered and when it stops. One manager per server holds one entry per app that names a `host`.
//
// A host starts at the first activation event its app names (read/activation.ts) and only while
// `plan.ts` lets it run: the app is enabled, its files' hash is in the approvals file, no cycle of
// `depends` holds it and every dependency may run. The hash is taken again right before the process
// is spawned (verify.ts). Before a host starts, the host of each app in its `depends` is started.
// Two activations at once start one process; an activation while the host stops starts one after
// the old process has exited. A host that ends on its own stays ended, with its exit code and
// signal in its row, until the reader presses Restart; stopping it on purpose, or the app ceasing
// to be runnable, clears that.
//
// `reconcile` is called after every read of the apps: it stops each host whose app may no longer
// run (dependents first, the dependency last, a dependent saying which dependency's revoke stopped
// it), fires `onStartupFinished` for each app that became runnable, and looks for the files
// `workspaceContains` names. `close` stops every host. The rows of the hosts are published on the
// `app-hosts` channel, the size of the output a little later than the state, and a host's messages
// to its pages go out on the event channel `app-messages`.

import { spawn as nodeSpawn } from 'node:child_process';
import { env as processEnv } from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import { appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import { languageOf, type LanguageMap } from '../../../../data/helpers/files/languages.ts';
import { createLimiter } from '../../../../data/helpers/run/limiter.ts';
import { ENGINE_ROOT } from '../../../../data/helpers/hub-names.ts';
import type {
    AppHostRow,
    AppHostsPayload,
    AppMessage,
    AppMessagesPayload,
    Message
} from '../../../../data/model/index.ts';
import type { AppsSettings } from '../../../../data/sources/config/settings.ts';
import type { Hub } from '../../../core/channels.ts';
import { systemClock, type Clock, type Timer } from '../../../core/file-poll.ts';
import { words } from '../../../core/words.ts';
import type { Root } from '../../../files/files.ts';
import { declaredEvent, names, type ActivationEvent } from '../read/activation.ts';
import { appById, type AppsHeld, type HeldApp } from '../read/held.ts';
import type { AppSecrets } from '../secrets/secrets.ts';
import { AppShell } from '../shell/registry.ts';
import { shellHandlers, shellNotices } from '../shell/host-calls.ts';
import { Refused } from './connection.ts';
import { changedKeys, hostHandlers, type HostStore } from './handlers.ts';
import { createOutput, type HostOutput } from './output.ts';
import { cyclesOf, judge } from './plan.ts';
import { HostProcess, type HostEnd } from './process.ts';
import { diskList, rootHolds, type List } from './triggers.ts';
import { approvedFiles } from './verify.ts';

/** What a request to a host came to: its answer, or the word it is refused with. */
export type HostResult = { ok: true; value: unknown } | { ok: false; word: string };

/** Milliseconds the output size of the rows waits to be published after it changed. */
const OUTPUT_DELAY_MS = 250;

/** What the manager is made with. */
export type HostsOptions = {
    hub: Hub;
    apps: { held(): AppsHeld };
    settings: () => AppsSettings;
    /** The roots the file browser shows, with their directories written out. */
    roots: () => Root[];
    languages: () => LanguageMap;
    /** The content hashes the approvals file holds. */
    approved: () => ReadonlySet<string>;
    store: HostStore;
    secrets: AppSecrets;
    /** The server's text catalog. */
    text: () => Record<string, string>;
    /** The resolved values of the settings an app declares, by whole key. */
    values: (app: HeldApp) => Record<string, unknown>;
    /** The program the runner is started under, the runner and `vscode-jsonrpc`'s node entry. */
    node: string;
    runner: string;
    jsonrpc: string;
    env?: NodeJS.ProcessEnv;
    spawn?: typeof nodeSpawn;
    clock?: Clock;
    list?: List;
    /**
     * Settles when the server listens. Until then this manager starts no host: a restarted dev
     * server listens only after the hosts of the server before it have stopped.
     */
    after?: Promise<void>;
};

/** One app that names a host. */
type Entry = {
    id: string;
    name: string;
    machine: boolean;
    process: HostProcess | null;
    /** A start in flight, which every activation during it waits on. */
    start: Promise<boolean> | null;
    stopping: Promise<void> | null;
    /** The running process is being stopped on purpose, so its end is not an end of its own. */
    intended: boolean;
    /** How the host ended on its own, until a stop or a restart. */
    ended: HostEnd | null;
    /** The dependency whose revoke stopped the host. */
    stoppedBy: string;
    /** Whether a process of this host has run since the server started. */
    ran: boolean;
    output: HostOutput;
    writes: ReturnType<typeof createLimiter>;
    messages: ReturnType<typeof createLimiter>;
    opens: ReturnType<typeof createLimiter>;
    wrote: Map<string, unknown>;
    snapshot: Record<string, unknown>;
    /** The setting values the host was last told. */
    values: Record<string, unknown>;
};

/** How a stop treats the host's dependents: not at all, or stopped first under a blame. */
type StopOptions = { blame?: string; dependents?: string };

/** The hosts of the apps. */
export class AppHosts {
    #options: HostsOptions;
    #clock: Clock;
    #entries = new Map<string, Entry>();
    #startup = new Set<string>();
    #looked = new Set<string>();
    /** The looks at the roots that have not answered yet. */
    #looking = new Set<Promise<void>>();
    #closed = false;
    /** The server is not listening yet. */
    #holding: Promise<void> | null = null;
    #timer: Timer | null = null;
    #published = '';
    /** What the hosts have registered in the shell, and the questions they ask the reader. */
    readonly shell: AppShell;

    constructor(options: HostsOptions) {
        this.#options = options;
        this.#clock = options.clock ?? systemClock;
        this.shell = new AppShell({
            hub: options.hub,
            apps: options.apps,
            hosts: {
                request: (id, method, params) => this.#link(id).request(method, params),
                notify: (id, method, params) =>
                    this.#entries.get(id)?.process?.notify(method, params),
                ensure: (id, event) => this.activateWhole(id, event)
            }
        });
        if (options.after !== undefined) {
            const release = (): void => {
                this.#holding = null;
                this.reconcile();
            };
            this.#holding = options.after.then(release, release);
        }
        options.hub.merge('app-messages', (held: Message, next: Message) => ({
            ...next,
            payload: {
                messages: [
                    ...(held.payload as AppMessagesPayload).messages,
                    ...(next.payload as AppMessagesPayload).messages
                ]
            }
        }));
    }

    /** Judge every app again after the apps were read. */
    reconcile(): void {
        if (this.#closed || this.#holding !== null) return;
        const held = this.#options.apps.held();
        const cycles = cyclesOf(held);
        const present = new Set<string>();
        for (const app of held.apps) {
            if (app.row.host === '') continue;
            present.add(app.id);
            const verdict = judge(held, app, cycles);
            if (verdict.ok) {
                if (!this.#startup.has(app.id)) {
                    this.#startup.add(app.id);
                    void this.activate(app.id, { kind: 'onStartupFinished' });
                }
                continue;
            }
            this.#startup.delete(app.id);
            const entry = this.#entries.get(app.id);
            if (entry === undefined) continue;
            entry.ended = null;
            if (entry.process === null) continue;
            const lost =
                verdict.cause === 'dependency' && verdict.approval ? verdict.dependency : '';
            void this.#stop(entry, {
                blame: lost,
                dependents: verdict.cause === 'approval' ? app.row.name : ''
            });
        }
        for (const [id, entry] of this.#entries) {
            if (present.has(id)) continue;
            this.#startup.delete(id);
            void this.#stop(entry, { dependents: '' }).then(() => {
                if (!present.has(id) && entry.process === null) this.#entries.delete(id);
                this.#publish(true);
            });
        }
        this.#look(held);
        this.#publish(true);
    }

    /**
     * An activation event happened: start the host of the app when it names the event. A command
     * or a view the app declares is an event of the app whatever its `activation` lists.
     */
    async activate(id: string, event: ActivationEvent): Promise<void> {
        const app = this.#app(id);
        if (app === undefined || app.row.host === '') return;
        if (!names(app.row.activation, event) && !declaredEvent(app.row.contributes, event)) return;
        await this.#ensure(id, event);
    }

    /** Activate for an event, then answer whether the host of the app runs. */
    async activateWhole(id: string, event: ActivationEvent): Promise<boolean> {
        await this.activate(id, event);
        return this.running(id);
    }

    /** Whether the host of the app has a process that has not ended. */
    running(id: string): boolean {
        const process = this.#entries.get(id)?.process;
        return process !== undefined && process !== null && !process.over;
    }

    /** A tab of the app is drawn, for a view of it when it names one. */
    async tab(id: string, view = ''): Promise<void> {
        await this.activate(id, { kind: 'onTab' });
        if (view !== '') await this.activate(id, { kind: 'onView', id: view });
    }

    /** The running host of an app, for a request of the shell; `host_down` when none runs. */
    #link(id: string): HostProcess {
        const process = this.#entries.get(id)?.process;
        if (process === undefined || process === null || process.over) {
            throw new Refused('host_down');
        }
        return process;
    }

    /**
     * Tell the running hosts the settings of their apps that changed, after the configuration or
     * the apps were read again.
     */
    settingsChanged(): void {
        for (const entry of this.#entries.values()) {
            const app = this.#app(entry.id);
            if (app === undefined || entry.process === null) continue;
            const now = this.#options.values(app);
            const keys = changedKeys(entry.values, now);
            if (keys.length === 0) continue;
            entry.values = now;
            this.shell.settingsChanged(entry.id, keys, now);
        }
    }

    /** A source tab of a file of this language opened on a page. */
    language(language: string): void {
        for (const app of this.#options.apps.held().apps) {
            void this.activate(app.id, { kind: 'onLanguage', id: language });
        }
    }

    /** A source tab of this path of a root opened: the language of the file is an event. */
    opened(path: string): void {
        this.language(languageOf(path, this.#options.languages()));
    }

    /** The resolved values of the settings an app declares, by whole key. */
    valuesOf(app: HeldApp): Record<string, unknown> {
        return this.#options.values(app);
    }

    /** One question of the shell to the running host of an app (`oculus/provide`). */
    async provide(id: string, params: unknown): Promise<HostResult> {
        try {
            return { ok: true, value: await this.#link(id).request('oculus/provide', params) };
        } catch (error) {
            return { ok: false, word: error instanceof Refused ? error.word : 'host_down' };
        }
    }

    /** One request of a page to the host of an app. */
    async request(id: string, method: unknown, params: unknown, tab: string): Promise<HostResult> {
        const app = this.#app(id);
        if (app === undefined) return { ok: false, word: 'missing' };
        if (app.row.host === '') return { ok: false, word: 'not_declared' };
        if (app.row.disabled) return { ok: false, word: 'closed' };
        if (typeof method !== 'string' || method === '')
            return { ok: false, word: 'refused:method' };
        if (!(await this.#ensure(id, { kind: 'onTab' }))) return { ok: false, word: 'host_down' };
        const process = this.#entries.get(id)?.process;
        if (process === undefined || process === null) return { ok: false, word: 'host_down' };
        try {
            return {
                ok: true,
                value: await process.request('oculus/request', { method, params, tab })
            };
        } catch (error) {
            return { ok: false, word: error instanceof Refused ? error.word : 'host_down' };
        }
    }

    /**
     * Stop the host of an app. Its dependents keep running unless `dependentsFirst` is set, which
     * stops their hosts first and the host of the app last.
     */
    async stop(id: string, options: { dependentsFirst?: boolean } = {}): Promise<void> {
        const entry = this.#entries.get(id);
        if (entry === undefined) return;
        await this.#stop(entry, options.dependentsFirst === true ? { dependents: '' } : {});
    }

    /** Stop the host, then start it again. */
    async restart(id: string): Promise<boolean> {
        const entry = this.#entries.get(id);
        if (entry === undefined) return false;
        await this.#stop(entry, {});
        entry.ended = null;
        return this.#ensure(id, { kind: 'onTab' });
    }

    /** Tell the running hosts of these apps what changed in their stores. */
    storeChanged(ids: readonly string[]): void {
        for (const id of ids) {
            const entry = this.#entries.get(id);
            const app = this.#app(id);
            if (entry === undefined || app === undefined || entry.process === null) continue;
            const now = this.#options.store.get(app);
            const keys = changedKeys(entry.snapshot, now).filter(
                (key) =>
                    !(entry.wrote.has(key) && isDeepStrictEqual(now[key], entry.wrote.get(key)))
            );
            entry.snapshot = now;
            if (keys.length > 0) entry.process.notify('oculus/storeChanged', { keys });
        }
    }

    /** The rows of the hosts as the Processes view draws them. */
    rows(): AppHostRow[] {
        const held = this.#options.apps.held();
        const cycles = cyclesOf(held);
        const rows: AppHostRow[] = [];
        for (const app of held.apps) {
            if (app.row.host === '') continue;
            const entry = this.#entries.get(app.id);
            const row = this.#rowOf(app, entry, judge(held, app, cycles));
            if (row !== null) rows.push(row);
        }
        return rows.sort((a, b) => a.title.localeCompare(b.title) || a.app.localeCompare(b.app));
    }

    /** The kept output of the host of an app, the oldest line first, or none for an unknown app. */
    output(id: string): string[] {
        return this.#entries.get(id)?.output.lines() ?? [];
    }

    /** Resolves when no look at a root and no start or stop is in flight. */
    async settled(): Promise<void> {
        for (;;) {
            const pending = [
                ...this.#looking,
                ...[...this.#entries.values()].flatMap((entry) => [
                    ...(entry.start === null ? [] : [entry.start]),
                    ...(entry.stopping === null ? [] : [entry.stopping])
                ])
            ];
            if (pending.length === 0) return;
            await Promise.allSettled(pending);
        }
    }

    /** Stop every host, dependents first, and take no more activations. */
    async close(): Promise<void> {
        this.#closed = true;
        if (this.#timer !== null) this.#clock.clearTimeout(this.#timer);
        this.#timer = null;
        await Promise.all(
            [...this.#entries.values()].map((entry) => this.#stop(entry, { dependents: '' }))
        );
        await this.settled();
    }

    #app(id: string): HeldApp | undefined {
        return appById(this.#options.apps.held(), id);
    }

    /** The entry of an app, made when the app first needs one. */
    #entryOf(app: HeldApp): Entry {
        let entry = this.#entries.get(app.id);
        if (entry === undefined) {
            const settings = this.#options.settings;
            entry = {
                id: app.id,
                name: app.row.name,
                machine: app.row.root === '',
                process: null,
                start: null,
                stopping: null,
                intended: false,
                ended: null,
                stoppedBy: '',
                ran: false,
                output: createOutput(() => settings().hostOutputKb),
                writes: createLimiter(() => settings().writesPerMin, 60_000),
                messages: createLimiter(() => settings().messagesPerMin, 60_000),
                opens: createLimiter(() => settings().opensPerMin, 60_000),
                wrote: new Map(),
                snapshot: {},
                values: {}
            };
            this.#entries.set(app.id, entry);
        }
        return entry;
    }

    /** Make sure the host runs: true when it does, false when it cannot. */
    async #ensure(id: string, event: ActivationEvent): Promise<boolean> {
        if (this.#holding !== null) await this.#holding;
        const app = this.#app(id);
        if (app === undefined || this.#closed) return false;
        const entry = this.#entryOf(app);
        for (;;) {
            if (entry.stopping !== null) {
                await entry.stopping;
                continue;
            }
            if (entry.start !== null) return entry.start;
            if (entry.process !== null) return !entry.process.over;
            if (entry.ended !== null) return false;
            break;
        }
        const start = this.#begin(entry, event).finally(() => {
            entry.start = null;
            this.#publish(true);
        });
        entry.start = start;
        return start;
    }

    /** The start of one host: dependencies first, the approval taken again, then the process. */
    async #begin(entry: Entry, event: ActivationEvent): Promise<boolean> {
        const held = (): AppsHeld => this.#options.apps.held();
        const may = (app: HeldApp | undefined): app is HeldApp =>
            app !== undefined && judge(held(), app, cyclesOf(held())).ok;
        if (!may(this.#app(entry.id))) return false;
        for (const name of this.#app(entry.id)?.row.depends ?? []) {
            if (!(await this.#ensure(appViewId('', name), { kind: 'onTab' }))) return false;
        }
        const app = this.#app(entry.id);
        if (this.#closed || !may(app)) return false;
        const settings = this.#options.settings();
        const files = approvedFiles(app, this.#options.approved(), {
            files: settings.maxFiles,
            bytes: settings.maxMb * 1024 * 1024
        });
        if (files === null) return false;
        const text = this.#options.text;
        entry.values = this.#options.values(app);
        const shell = {
            shell: this.shell,
            app: () => this.#app(entry.id),
            messages: entry.messages,
            opens: entry.opens,
            values: this.#options.values
        };
        let process: HostProcess;
        try {
            process = new HostProcess({
                command: this.#options.node,
                args: [
                    this.#options.runner,
                    `${app.row.folder}/${app.row.host}`,
                    this.#options.jsonrpc
                ],
                cwd: app.row.folder,
                env: this.#options.env ?? processEnv,
                files,
                texts: this.#runnerTexts(),
                event,
                output: entry.output,
                name: app.row.name,
                settings: entry.values,
                handlers: { ...hostHandlers(this.#context(entry)), ...shellHandlers(shell) },
                notices: shellNotices(shell),
                stopSeconds: () => this.#options.settings().hostStopSeconds,
                clock: this.#clock,
                spawn: this.#options.spawn,
                changed: () => this.#publish(false),
                streamBroken: (reason) => words(text(), 'server.apps.host_stream_broken', reason),
                ended: (end) => this.#ended(entry, process, end)
            });
        } catch (error) {
            entry.output.note(words(text(), 'server.apps.host_not_started', reason(error)));
            entry.ended = { code: null, signal: '' };
            return false;
        }
        entry.process = process;
        entry.ran = true;
        entry.intended = false;
        entry.ended = null;
        entry.stoppedBy = '';
        this.#publish(true);
        try {
            await process.ready;
        } catch {
            return false;
        }
        entry.snapshot = this.#options.store.get(app);
        return entry.process === process && !process.over;
    }

    /** The process of an entry has ended. */
    #ended(entry: Entry, process: HostProcess, end: HostEnd): void {
        if (entry.process !== process) return;
        entry.process = null;
        this.shell.stopped(entry.id);
        if (entry.intended) {
            entry.intended = false;
        } else {
            entry.ended = end;
            const text = this.#options.text();
            entry.output.note(
                end.code === null
                    ? words(text, 'server.apps.host_ended_signal', end.signal)
                    : words(text, 'server.apps.host_ended_code', end.code)
            );
        }
        this.#publish(true);
    }

    /** Stop the host of an entry, the hosts that depend on it first when asked. */
    #stop(entry: Entry, options: StopOptions): Promise<void> {
        if (entry.stopping !== null) return entry.stopping;
        entry.ended = null;
        const process = entry.process;
        if (process === null) return Promise.resolve();
        entry.intended = true;
        if (options.blame !== undefined && options.blame !== '') entry.stoppedBy = options.blame;
        const stopping = (async () => {
            if (options.dependents !== undefined)
                await this.#stopDependents(entry, options.dependents);
            this.#publish(true);
            await process.stop();
        })().finally(() => {
            entry.stopping = null;
            this.#publish(true);
        });
        entry.stopping = stopping;
        return stopping;
    }

    /** Stop the running hosts of the apps that depend on this one, each under the blame. */
    async #stopDependents(entry: Entry, blame: string): Promise<void> {
        if (!entry.machine) return;
        const stops: Promise<void>[] = [];
        for (const other of this.#entries.values()) {
            const app = this.#app(other.id);
            if (other === entry || other.process === null || app === undefined) continue;
            if (other.intended) {
                stops.push(other.stopping ?? Promise.resolve());
                continue;
            }
            if (app.row.depends.includes(entry.name)) {
                stops.push(this.#stop(other, { blame, dependents: blame }));
            }
        }
        await Promise.all(stops);
    }

    /** What the handlers of one host are made over. */
    #context(entry: Entry): Parameters<typeof hostHandlers>[0] {
        return {
            app: () => this.#app(entry.id),
            store: this.#options.store,
            secrets: this.#options.secrets,
            writes: entry.writes,
            messages: entry.messages,
            wrote: entry.wrote,
            send: (message: AppMessage) => {
                const payload: AppMessagesPayload = { messages: [message] };
                this.#options.hub.send('app-messages', payload);
            },
            names: async (name) => {
                const dependency = await this.#dependency(entry, name);
                return (await dependency.request('oculus/apiCall', {})) as string[];
            },
            call: async (name, fn, args) => {
                const dependency = await this.#dependency(entry, name);
                return dependency.request('oculus/apiCall', { fn, args });
            }
        };
    }

    /** The running host of a dependency of this entry's app, started when it is not running. */
    async #dependency(entry: Entry, name: string): Promise<HostProcess> {
        const app = this.#app(entry.id);
        if (app === undefined || name === '' || !app.row.depends.includes(name)) {
            throw new Refused('not_declared');
        }
        const id = appViewId('', name);
        if (!(await this.#ensure(id, { kind: 'onTab' }))) throw new Refused('host_down');
        const process = this.#entries.get(id)?.process;
        if (process === undefined || process === null) throw new Refused('host_down');
        return process;
    }

    /** The sentences the runner writes to a host's output. */
    #runnerTexts(): Record<string, string> {
        const text = this.#options.text();
        return {
            refused: words(text, 'server.apps.host_refused_import', '{0}', '{1}'),
            noActivate: words(text, 'server.apps.host_no_activate', '{0}'),
            failed: words(text, 'server.apps.host_activate_failed', '{0}'),
            stream: words(text, 'server.apps.host_stream_error', '{0}'),
            listenerFailed: words(text, 'server.apps.host_listener_failed', '{0}'),
            eventFailed: words(text, 'server.apps.host_event_failed', '{0}'),
            deactivateFailed: words(text, 'server.apps.host_deactivate_failed', '{0}'),
            noHandler: words(text, 'server.apps.host_no_handler'),
            noApi: words(text, 'server.apps.host_no_api'),
            noFunction: words(text, 'server.apps.host_no_function', '{0}')
        };
    }

    /** The row of one app's host, or null when it has none to show. */
    #rowOf(
        app: HeldApp,
        entry: Entry | undefined,
        verdict: ReturnType<typeof judge>
    ): AppHostRow | null {
        const base = {
            app: app.id,
            name: app.row.name,
            root: app.row.root,
            title: app.row.title,
            pid: 0,
            started: '',
            code: null as number | null,
            signal: '',
            dependency: '',
            stoppedBy: entry?.stoppedBy ?? '',
            outputBytes: entry?.output.taken() ?? 0
        };
        const process = entry?.process ?? null;
        if (process !== null) {
            const starting = entry?.start !== null && entry?.start !== undefined;
            return {
                ...base,
                pid: process.pid,
                started: process.started,
                state: starting ? 'starting' : 'running',
                waiting: ''
            };
        }
        if (entry?.ended !== null && entry?.ended !== undefined) {
            const { code, signal } = entry.ended;
            return { ...base, state: 'ended', waiting: '', code, signal };
        }
        if (verdict.ok || verdict.cause === 'nohost' || verdict.cause === 'disabled') return null;
        if (verdict.cause === 'approval') {
            const changed = app.row.kept && !app.row.hashApproved;
            return changed || entry?.ran === true
                ? { ...base, state: 'waiting', waiting: 'approval' }
                : null;
        }
        if (verdict.cause === 'cycle') return { ...base, state: 'waiting', waiting: 'cycle' };
        return {
            ...base,
            state: 'waiting',
            waiting: verdict.absent ? 'missing' : 'dependency',
            dependency: verdict.dependency
        };
    }

    /** Look in the roots for the files that `workspaceContains` events name. */
    #look(held: AppsHeld): void {
        const roots = this.#options.roots().filter((root) => root.key !== ENGINE_ROOT);
        const where = roots.map((root) => `${root.key}=${root.dir}`).join('\n');
        for (const app of held.apps) {
            if (app.row.host === '' || !judge(held, app, cyclesOf(held)).ok) continue;
            for (const text of app.row.activation) {
                if (!text.startsWith('workspaceContains:')) continue;
                const glob = text.slice('workspaceContains:'.length);
                const key = `${app.id}|${app.row.hash}|${glob}|${where}`;
                if (this.#looked.has(key)) continue;
                this.#looked.add(key);
                const own =
                    app.row.root === '' ? roots : roots.filter((root) => root.key === app.row.root);
                const looking = this.#hold(app.id, own, glob).finally(() => {
                    this.#looking.delete(looking);
                });
                this.#looking.add(looking);
            }
        }
    }

    /** Whether one of the roots holds a file the glob matches; the host starts when it does. */
    async #hold(id: string, roots: Root[], glob: string): Promise<void> {
        const limit = this.#options.settings().scanEntries;
        for (const root of roots) {
            const found = await rootHolds(root.dir, glob, limit, this.#options.list ?? diskList);
            if (found && !this.#closed) {
                await this.activate(id, { kind: 'workspaceContains', glob });
                return;
            }
        }
    }

    /** Publish the rows: at once when the state moved, a little later when only output did. */
    #publish(now: boolean): void {
        if (this.#closed && this.#timer === null && !now) return;
        if (!now) {
            if (this.#timer !== null) return;
            this.#timer = this.#clock.setTimeout(() => {
                this.#timer = null;
                this.#flush();
            }, OUTPUT_DELAY_MS);
            return;
        }
        if (this.#timer !== null) this.#clock.clearTimeout(this.#timer);
        this.#timer = null;
        this.#flush();
    }

    #flush(): void {
        const payload: AppHostsPayload = { rows: this.rows() };
        const text = JSON.stringify(payload);
        if (text === this.#published) return;
        this.#published = text;
        this.#options.hub.publish('app-hosts', payload);
    }
}

/** The text of a thrown value. */
function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
