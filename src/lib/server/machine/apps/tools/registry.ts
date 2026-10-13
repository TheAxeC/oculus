// Layer 2, server. What the running hosts have registered with the tools, held for the `app-tools`
// channel and for the modules that serve them: the language servers and providers the relay starts,
// the debug adapters, the task providers, the terminals, the source controls and the file
// decorations. One `AppTools` serves every host. A host that starts is `attach`ed, which makes the
// parts that answer its requests (`oculus/languages/*`, `oculus/workspace/*`, `oculus/stream/*` and
// the rest) and the folders of its scope that the host is told at activation; a host that ends is
// `detach`ed, which ends its streams and everything it registered.
//
// Everything a host registers is judged here before it is held: the app must be approved and
// enabled (`appActive`), and a file the host names must lie inside the folders of the app's scope
// (scope.ts). A stopped host leaves nothing behind: the pages see all of it go in the next payload.

import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { schemaGlob } from '../../../../data/helpers/files/apps/tools/language-kit.ts';
import type { SchemaSet } from '../../../../data/snapshot/schema/set.ts';
import { toolFileValue } from '../read/tool-files/tool-files.ts';
import type {
    AppRequestBody,
    AppToolsHost,
    AppToolsPayload
} from '../../../../data/model/index.ts';
import type { Hub } from '../../../core/channels.ts';
import type {
    AppCarrier,
    AppDebugPort,
    AppSessionInfo,
    DebugControl,
    Resolved,
    ResolveStage
} from '../../debug/app/port.ts';
import { manifestExecutable } from '../../debug/app/resolve.ts';
import { Refused, type HostCall, type HostHandler, type HostNotice } from '../host/connection.ts';
import { DEBUG_COMMAND, type ActivationEvent } from '../read/activation.ts';
import { Published } from '../host/published.ts';
import type { AppsHeld, HeldApp } from '../read/held.ts';
import { debugHost, type DebugHost } from './debug.ts';
import { Decorations, decorationHost, type DecorationHost } from './decorations.ts';
import {
    languageTools,
    type AppServerReg,
    type CollectionDiagnostics,
    type LanguageTools
} from './languages.ts';
import { AppTasks, taskHost, type TaskHost } from './run/tasks.ts';
import type { StreamTerminalSet } from './run/stream-terminals.ts';
import { terminalHost, type TerminalHost } from './run/terminals.ts';
import { scmHost, type ScmHost } from './scm.ts';
import { ToolsScope, type ScopeFolder, type ToolsEnv } from './scope.ts';
import { StreamHub, type AppStream } from './streams.ts';
import { workspaceHandlers } from './workspace/workspace.ts';

/** The event a debug launch raises for the hosts of apps that name it. */
const DEBUG_EVENT: ActivationEvent = { kind: 'onCommand', id: DEBUG_COMMAND };

/** How long a Save All waits for a page to answer before it gives up. */
const SAVE_ALL_MS = 10_000;

/** What the registry asks of the hosts. */
type ToolsHosts = {
    /** A request to the running host of an app; rejects `host_down` when none runs. */
    request(id: string, method: string, params: unknown, call?: HostCall): Promise<unknown>;
    notify(id: string, method: string, params: unknown): void;
    /** A line in the host's output. */
    note(id: string, line: string): void;
    ensure(id: string, event: ActivationEvent): Promise<boolean>;
};

/** What the registry asks of the shell: the requests to the pages. */
type ToolsShell = {
    ask(app: HeldApp, body: AppRequestBody): { id: string; answer: Promise<unknown> };
    withdraw(id: string): void;
    /** The held app with this id when it is approved, enabled and unchanged. */
    active(id: string): HeldApp | undefined;
    /** The approved, enabled apps, in the Views list's order. */
    actives(): HeldApp[];
};

/** What the registry is made over. */
export type ToolsOptions = {
    hub: Hub;
    apps: { held(): AppsHeld };
    hosts: ToolsHosts;
    shell: ToolsShell;
    env: ToolsEnv;
    /** The server's text catalog. */
    text: () => Record<string, string>;
    /** The resolved values of the settings an app declares, by whole key. */
    values: (app: HeldApp) => Record<string, unknown>;
};

/** What a part of the tools of one host is given. */
export type HostTools = {
    /** The app's view id. */
    readonly id: string;
    readonly scope: ToolsScope;
    readonly streams: StreamHub;
    /**
     * The app as the server holds it now; refuses `host_down` once it is gone, `closed` when
     * disabled.
     */
    app(): HeldApp;
    request(method: string, params: unknown, call?: HostCall): Promise<unknown>;
    notify(method: string, params: unknown): void;
    /** Write a line to the host's output. */
    note(line: string): void;
    /** The server's text catalog, which `words` reads a sentence from. */
    catalog(): Record<string, string>;
    /** What the host holds moved: the payload is made again. */
    changed(): void;
    /** A scheme the host serves text for was registered or dropped. */
    schemes(scheme: string, add: boolean): void;
    /** Save every tab with unsaved text; whether all saved. */
    saveAll(): Promise<boolean>;
    /** A request to the pages, taken by the one that has the focus. */
    ask(body: AppRequestBody): { id: string; answer: Promise<unknown> };
};

/** The parts of one attached host. */
type Attached = {
    host: HostTools;
    languages: LanguageTools;
    terminals: TerminalHost;
    tasks: TaskHost;
    decorations: DecorationHost;
    scm: ScmHost;
    debug: DebugHost;
    schemes: Set<string>;
    stops: (() => void)[];
    /** The folders of the app's scope now, as the host was last told them. */
    folders: () => { uri: string; name: string }[];
    told: string;
};

/** What an attach gives the manager: the handlers of the host's requests and notifications. */
export type Attachment = {
    handlers: Record<string, HostHandler>;
    notices: Record<string, HostNotice>;
    /** The folders of the app's scope, as the activation tells the host. */
    folders(): ScopeFolder[];
    streams: StreamHub;
};

/** The registry of the tools of every running host. */
export class AppTools {
    readonly scope: ToolsScope;
    /** The file decorations of the hosts, joined. */
    readonly decorations: Decorations;
    /** The tasks of the hosts and their runs. */
    readonly tasks: AppTasks;
    #control: DebugControl | undefined;
    #options: ToolsOptions;
    #hosts = new Map<string, Attached>();
    #listeners = new Set<() => void>();
    #diagnostics = new Set<(heard: CollectionDiagnostics) => void>();
    readonly #published: Published;

    constructor(options: ToolsOptions) {
        this.#options = options;
        this.#published = new Published(options.hub, 'app-tools');
        this.scope = new ToolsScope(options.env);
        this.decorations = new Decorations({
            hosts: () =>
                this.actives().flatMap((app) => {
                    const attached = this.#hosts.get(app.id);
                    return attached === undefined
                        ? []
                        : [{ app: app.id, host: attached.decorations, tools: attached.host }];
                }),
            place: (app, uri) => {
                const held = this.active(app);
                return held === undefined ? null : this.scope.place(held, uri);
            },
            uriOf: (app, root, path) => {
                const held = this.active(app);
                return held === undefined ? null : this.scope.uriFor(held, root, path);
            },
            changed: () => this.#changed()
        });
        this.tasks = new AppTasks({
            actives: () => this.actives(),
            host: (app) => {
                const attached = this.#hosts.get(app);
                return attached === undefined
                    ? undefined
                    : { tools: attached.host, tasks: attached.tasks };
            },
            activate: (app, event) => options.hosts.ensure(app, event),
            terminals: () => options.env.terminals,
            scope: this.scope,
            catalog: () => options.text()
        });
        options.env.terminals.onChange(() => this.#sweep());
        this.#publish();
    }

    /** The terminals the hosts hold as streams. */
    get streams(): StreamTerminalSet {
        return this.#options.env.terminals.streams;
    }

    /** Give the hosts the control of the debug client's session. */
    attachDebug(control: DebugControl): void {
        this.#control = control;
    }

    /** The terminals of an app that does not act any more end: tmux's are killed, streams close. */
    #sweep(): void {
        const env = this.#options.env.terminals;
        for (const one of env.list()) {
            if (one.kind !== 'app' || this.active(one.app) !== undefined) continue;
            if (!env.streams.close(one.id)) void env.stop(one.id).catch(() => undefined);
        }
    }

    /** The app with this id when the shell finds it approved, enabled and unchanged. */
    active(id: string): HeldApp | undefined {
        return this.#options.shell.active(id);
    }

    /** The apps the shell finds approved, enabled and unchanged. */
    actives(): HeldApp[] {
        return this.#options.shell.actives();
    }

    /** Make the parts that serve a host that is starting. */
    attach(id: string, app: () => HeldApp | undefined): Attachment {
        const options = this.#options;
        const streams = new StreamHub({
            note: (line) => options.hosts.note(id, line),
            catalog: () => options.text(),
            notify: (method, params) => options.hosts.notify(id, method, params)
        });
        const schemes = new Set<string>();
        const host: HostTools = {
            id,
            scope: this.scope,
            streams,
            app: () => {
                const held = app();
                if (held === undefined) throw new Refused('host_down');
                if (!appActive(held.row)) throw new Refused('closed');
                return held;
            },
            request: (method, params, call) => options.hosts.request(id, method, params, call),
            notify: (method, params) => options.hosts.notify(id, method, params),
            note: (line) => options.hosts.note(id, line),
            catalog: () => options.text(),
            changed: () => this.#changed(),
            schemes: (scheme, add) => {
                if (add) schemes.add(scheme);
                else schemes.delete(scheme);
                this.#changed();
            },
            saveAll: () => this.#saveAll(host),
            ask: (body) => options.shell.ask(host.app(), body)
        };
        const languages = languageTools(host, (heard) => {
            for (const listener of this.#diagnostics) listener(heard);
        });
        const workspace = workspaceHandlers(host);
        const terminals = terminalHost(host, options.env.terminals);
        const tasks = taskHost(host, () => this.tasks);
        const decorations = decorationHost(host, (uris, all) =>
            this.decorations.changed(id, uris, all)
        );
        const scm = scmHost(host);
        const debug = debugHost(host, () => this.#control);
        const foldersNow = (): { uri: string; name: string }[] => {
            const held = app();
            return held === undefined
                ? []
                : this.scope.folders(held).map(({ uri, name }) => ({ uri, name }));
        };
        const attached: Attached = {
            host,
            languages,
            terminals,
            tasks,
            decorations,
            scm,
            debug,
            schemes,
            stops: [
                () => workspace.stop(),
                () => terminals.stop(),
                () => tasks.stop(),
                () => decorations.stop(),
                () => scm.stop(),
                () => debug.stop()
            ],
            folders: foldersNow,
            told: JSON.stringify(foldersNow())
        };
        this.#hosts.set(id, attached);
        return {
            handlers: {
                ...streams.handlers(),
                ...languages.handlers,
                ...workspace.handlers,
                ...terminals.handlers,
                ...tasks.handlers,
                ...decorations.handlers,
                ...scm.handlers,
                ...debug.handlers
            },
            notices: {
                ...streams.notices(),
                ...languages.notices,
                ...decorations.notices,
                ...scm.notices
            },
            folders: () => {
                const held = app();
                return held === undefined ? [] : this.scope.folders(held);
            },
            streams
        };
    }

    /** The host of an app ended: its streams close and everything it registered goes. */
    detach(id: string): void {
        const attached = this.#hosts.get(id);
        if (attached === undefined) return;
        this.#hosts.delete(id);
        attached.host.streams.closeAll();
        attached.languages.stop();
        attached.terminals.stopped();
        for (const stop of attached.stops) stop();
        this.decorations.reset();
        this.#changed();
    }

    /** The language servers the running hosts registered, the apps in the Views list's order. */
    servers(): AppServerReg[] {
        const order = this.actives().map((app) => app.id);
        return order.flatMap((id) => this.#hosts.get(id)?.languages.servers() ?? []);
    }

    /** Ask the host of a server to start it for a folder; the stream it opens. */
    open(server: AppServerReg, root: string) {
        const attached = this.#hosts.get(server.app);
        if (attached === undefined) return Promise.reject(new Refused('host_down'));
        return attached.languages.open(server.id, root);
    }

    /** Make a host start (an activation event) before a server is asked of it. */
    async ensure(app: string): Promise<boolean> {
        return this.#options.hosts.ensure(app, { kind: 'onTab' });
    }

    /** The source controls the running hosts hold. */
    sources() {
        return [...this.#hosts.values()].flatMap((one) => one.scm.states());
    }

    /** The source control of an app's host, or undefined. */
    source(app: string): ScmHost | undefined {
        return this.#hosts.get(app)?.scm;
    }

    /** The terminals part of an app's host, or undefined. */
    terminalsOf(app: string): TerminalHost | undefined {
        return this.#hosts.get(app)?.terminals;
    }

    /** The debuggers of the apps as the debug client reaches them. */
    debugPort(): AppDebugPort {
        const owner = (type: string): HeldApp | undefined =>
            this.actives().find((app) =>
                app.row.contributes.debuggers.some((one) => one.type === type)
            );
        const hostOf = (type: string): DebugHost | undefined => {
            const app = owner(type);
            return app === undefined ? undefined : this.#hosts.get(app.id)?.debug;
        };
        return {
            debuggers: () =>
                this.actives().flatMap((app) =>
                    app.row.contributes.debuggers.map((one) => ({
                        app: app.id,
                        appTitle: app.row.title,
                        debugger: one
                    }))
                ),
            activate: async (type) => {
                const app = owner(type);
                return app === undefined ? false : this.#options.hosts.ensure(app.id, DEBUG_EVENT);
            },
            open: async (type, session: AppSessionInfo, cwd) => {
                const app = owner(type);
                const host = hostOf(type);
                const declared = app?.row.contributes.debuggers.find((one) => one.type === type);
                if (app === undefined || host === undefined || declared === undefined) {
                    throw new Refused('host_down');
                }
                const executable = manifestExecutable(declared, app.row.folder, process.execPath);
                return carrierOf(await host.open(type, session, executable, cwd));
            },
            configurations: async (type, folder) =>
                (await hostOf(type)?.configurations(type, folder)) ?? [],
            resolve: async (
                type,
                folder,
                configuration,
                stage: ResolveStage
            ): Promise<Resolved> => {
                const host = hostOf(type);
                return host === undefined
                    ? { configuration }
                    : host.resolve(type, folder, configuration, stage);
            },
            tell: (type, event) => hostOf(type)?.tell(event),
            broadcast: (event) => {
                for (const attached of this.#hosts.values()) {
                    if (attached.debug.registrations().length > 0) attached.debug.tell(event);
                }
            }
        };
    }

    /** Hear that the servers or the other registrations changed. */
    onChange(listener: () => void): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    /** Hear the diagnostics a collection of a host is given. */
    onDiagnostics(listener: (heard: CollectionDiagnostics) => void): () => void {
        this.#diagnostics.add(listener);
        return () => this.#diagnostics.delete(listener);
    }

    /** The answer to one section of `workspace/configuration` for a server of an app. */
    configuration(app: string, section: string): unknown {
        const held = this.active(app);
        if (held === undefined) return null;
        const values = this.#options.values(held);
        if (Object.hasOwn(values, section)) return values[section];
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
            if (!key.startsWith(`${section}.`)) continue;
            const path = key.slice(section.length + 1).split('.');
            let into = out;
            for (const part of path.slice(0, -1)) {
                const next = into[part];
                into =
                    typeof next === 'object' && next !== null
                        ? (next as Record<string, unknown>)
                        : (into[part] = {});
            }
            into[path.at(-1) ?? ''] = value;
        }
        return out;
    }

    /**
     * The JSON schemas the acting apps bring (`jsonValidation`) as a set the YAML server is given:
     * a rule for each schema whose globs name the files it governs, anywhere in a root.
     */
    schemas(): SchemaSet {
        const set: SchemaSet = { rules: [], texts: {} };
        for (const app of this.actives()) {
            for (const validation of app.row.contributes.jsonValidation) {
                const value = toolFileValue(
                    app.row.folder,
                    app.row.contributes,
                    'schema',
                    validation.url
                );
                if (value === null) continue;
                const name = `app-${set.rules.length}`;
                set.texts[name] = JSON.stringify(value);
                set.rules.push({ name, every: validation.fileMatch.map(schemaGlob) });
            }
        }
        return set;
    }

    /** The joined language map, which names the language of a selector's pattern. */
    languages() {
        return this.scope.env.languages();
    }

    /** Publish again and tell the listeners: the apps that act changed. */
    refresh(): void {
        this.#sweep();
        this.#tellFolders();
        this.#changed();
    }

    /** Tell each host whose workspace folders changed since it was last told. */
    #tellFolders(): void {
        for (const attached of this.#hosts.values()) {
            const folders = attached.folders();
            const text = JSON.stringify(folders);
            if (text === attached.told) continue;
            attached.told = text;
            attached.host.notify('oculus/workspace/foldersChanged', { folders });
        }
    }

    /** The diagnostics the collections of the running hosts hold. */
    collections(): CollectionDiagnostics[] {
        const out: CollectionDiagnostics[] = [];
        for (const [app, attached] of this.#hosts) {
            for (const [collection, files] of attached.languages.collections()) {
                for (const [uri, diagnostics] of files)
                    out.push({ app, collection, uri, diagnostics });
            }
        }
        return out;
    }

    /** The payload of the `app-tools` channel. */
    payload(): AppToolsPayload {
        const hosts: AppToolsHost[] = [...this.#hosts]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([app, attached]) => {
                const host: AppToolsHost = {
                    app,
                    servers: [],
                    providers: null,
                    collections: [],
                    debuggers: attached.debug.registrations(),
                    taskTypes: attached.tasks.types(),
                    sources: attached.scm.states(),
                    decorations: attached.decorations.registered(),
                    contentSchemes: [...attached.schemes]
                };
                attached.languages.fill(host);
                return host;
            });
        return { hosts, decorations: this.decorations.changes() };
    }

    async #saveAll(host: HostTools): Promise<boolean> {
        const asked = this.#options.shell.ask(host.app(), { kind: 'saveAll' });
        const timer = setTimeout(() => this.#options.shell.withdraw(asked.id), SAVE_ALL_MS);
        timer.unref();
        try {
            return (await asked.answer) === true;
        } finally {
            clearTimeout(timer);
        }
    }

    #changed(): void {
        this.#publish();
        for (const listener of [...this.#listeners]) listener();
    }

    #publish(): void {
        this.#published.send(this.payload());
    }
}

/** An adapter's stream as the debug client's carrier of messages. */
function carrierOf(stream: AppStream): AppCarrier {
    let code: number | null = null;
    stream.onControl((body) => {
        if (body.end === true) code = body.code ?? 0;
    });
    return {
        send: (message) => stream.sendMessage(message),
        onMessage: (listener) => stream.onMessage(listener),
        onStderr: (listener) => stream.onStderr(listener),
        onClose: (listener) => stream.onClose(() => listener(code)),
        close: () => stream.close()
    };
}
