// Layer 2, server. The language servers apps register (`oculus.languages.registerLanguageServer`
// and the providers of an app's host), as the relay holds them. Each registered server is a
// registry entry of its own, made when the app registers it and ended when the host stops or
// unregisters it, so every behaviour a shipped server has is the held server's: the 30 s bound on
// `initialize`, the 60 s grace, Restart, the output of stderr and the restart after an exit.
//
// A server's process is the stream its host opens. The entry's launch names the pseudo program
// `oculus-app`; the spawn of the relay answers it with a `Child` made over the stream
// (`streamChild`), so the held server and its process are the shipped ones.
//
// A language is served by oculus's own entry (when it has one) and by every app entry whose
// selector names it, oculus's first and then the apps in the Views list's order. The relay opens
// each document on every one of them (relay-route.ts) and joins their answers (relay-join.ts).

import { PassThrough } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { globTest } from '../../../../data/helpers/search/glob.ts';
import { selectorLanguages } from '../../../../data/helpers/files/apps/tools/languages.ts';
import type { LanguageMap } from '../../../../data/helpers/files/languages.ts';
import type { LspRpc } from '../../../../data/model/index.ts';
import type { Sink } from '../../../core/channels.ts';
import type { Page } from '../held/held.ts';
import type { Child, Spawn } from '../held/process.ts';
import type { Adapter, Prepared, RootEnv, ServerEntry, Setup } from '../servers.ts';
import type { AppServerInfo } from '../adapters/entry.ts';
import { isMachineFile } from '../../../files/workspace/machine-file.ts';
import { isPrivateFile } from '../adapters/yaml/private-file.ts';
import type { RelayState } from './relay-state.ts';

/** The program name an app server's launch carries; the relay's spawn answers it. */
const APP_PROGRAM = 'oculus-app';

/** How many times a server of an app that exits on its own is started again in three minutes. */
const APP_RESTARTS = 4;

/** The end code a host reports for a program it could not start. */
const NOT_FOUND = -2;

/** What the relay reads of the stream a host opens for a server. */
type AppStreamLike = {
    sendMessage(message: unknown): void;
    onMessage(listener: (message: Record<string, unknown>) => void | Promise<void>): void;
    onStderr(listener: (text: string) => void): void;
    onControl(listener: (body: { end?: boolean; code?: number | null }) => void): void;
    onClose(listener: () => void): void;
    /** The source oculus reads from is paused while the host has granted no credit. */
    backpressure(pause: () => void, resume: () => void): void;
    readonly closed: boolean;
    close(): void;
};

/** The diagnostics an app's collection holds for a file. */
export type CollectionHeard = {
    app: string;
    collection: string;
    /** The file's URI. */
    uri: string;
    diagnostics: Record<string, unknown>[];
};

/** What the relay asks of the apps' hosts. */
export type AppServersFeed = {
    /** The servers the running hosts of acting apps registered, apps in the Views list's order. */
    servers(): AppServerInfo[];
    /** Ask the host to start a server for a folder (a file URI); the stream it opens. */
    open(server: AppServerInfo, root: string): Promise<AppStreamLike>;
    /** The answer to one section of `workspace/configuration` for a server of an app. */
    configuration(app: string, section: string): unknown;
    /** The joined language map, which names the language of a selector's pattern. */
    languages(): LanguageMap;
    /** Hear that the servers changed. */
    onChange(listener: () => void): () => void;
    /** The diagnostics the apps' collections hold, by file URI. */
    collections(): CollectionHeard[];
    /** Hear the diagnostics an app's collection is given. */
    onDiagnostics(listener: (heard: CollectionHeard) => void): () => void;
};

/** The incremental text synchronisation, `TextDocumentSyncKind.Incremental`. */
const INCREMENTAL = 2;

/** The registration an entry was made for, or undefined for a shipped entry. */
export function appInfo(entry: ServerEntry): AppServerInfo | undefined {
    return entry.app;
}

/** The entry id of a server an app registered. */
function appEntryId(info: AppServerInfo): string {
    return `${info.app}#${info.id}`;
}

/** The languages a server's selector names. */
function languagesOf(info: AppServerInfo, map: LanguageMap): string[] {
    return selectorLanguages(info.selector, map);
}

/** Whether a server's selector selects a document of this language at this real path. */
export function selects(info: AppServerInfo, language: string, real: string): boolean {
    return info.selector.some((item) => {
        if (item.language !== '' && item.language !== '*' && item.language !== language) {
            return false;
        }
        if (item.pattern === '') return item.language !== '';
        return globTest(item.pattern)(real);
    });
}

/** The adapter of an app server: it has no choices, approvals or settings of its own. */
function appAdapter(info: AppServerInfo): Adapter {
    const none = { choice: {}, note: info.name, apply: 'configuration' as const };
    const adapter: Adapter = {
        prepare: (entry: ServerEntry, env: RootEnv): Prepared => {
            const setup: Setup = {
                root: env.root,
                interpreter: null,
                interpreterPrefixes: [],
                databaseFolder: null,
                fallbackFlags: []
            };
            const launch = entry.launch(setup);
            return launch === null
                ? {
                      ok: false,
                      state: 'not_found',
                      code: 'not_found',
                      program: info.name,
                      note: info.name
                  }
                : { ok: true, setup, launch };
        },
        choices: () => ({}),
        choose: () => none,
        approve: () => ({ ok: false, apply: null }),
        revoke: () => ({ ok: false, apply: null }),
        settings: (_env: RootEnv, setup: Setup) => setup
    };
    return adapter;
}

/** The registry entry of one registered server. */
function appEntry(info: AppServerInfo, feed: AppServersFeed): ServerEntry {
    const options = (info.initializationOptions ?? {}) as Record<string, unknown>;
    return {
        id: appEntryId(info),
        app: info,
        languages: languagesOf(info, feed.languages()),
        program: info.name,
        source: info.name,
        adapter: appAdapter(info),
        launch: (setup) => ({
            command: APP_PROGRAM,
            args: [info.app, info.id],
            cwd: setup.root,
            program: info.name
        }),
        initializationOptions: () =>
            typeof options === 'object' && !Array.isArray(options) ? options : {},
        configuration: (section) =>
            section === undefined ? null : feed.configuration(info.app, section),
        capabilities: () => ({ textDocumentSync: INCREMENTAL }),
        commands: [],
        restarts: APP_RESTARTS,
        refuses: (real, roots) =>
            isMachineFile(
                real,
                roots.map((root) => ({ dir: root.real, hub: root.hub }))
            ) || isPrivateFile(real, roots)
    };
}

/** The entries of the registered servers, kept stable while a server stays registered. */
export class AppEntries {
    readonly #feed: AppServersFeed;
    #made = new Map<string, { text: string; entry: ServerEntry }>();

    constructor(feed: AppServersFeed) {
        this.#feed = feed;
    }

    /** Every registered server's entry, apps in the Views list's order. */
    all(): ServerEntry[] {
        const seen = new Set<string>();
        const out: ServerEntry[] = [];
        for (const info of this.#feed.servers()) {
            const id = appEntryId(info);
            seen.add(id);
            const text = JSON.stringify([info, this.#feed.languages().size]);
            let held = this.#made.get(id);
            if (held?.text !== text) {
                const entry = appEntry(info, this.#feed);
                held = { text, entry };
                this.#made.set(id, held);
            }
            out.push(held.entry);
        }
        for (const id of [...this.#made.keys()]) if (!seen.has(id)) this.#made.delete(id);
        return out;
    }

    /** The entries that serve a language. */
    serving(language: string): ServerEntry[] {
        return this.all().filter((entry) => entry.languages.includes(language));
    }

    /** The entry with this id, if its server is still registered. */
    byId(id: string): ServerEntry | undefined {
        return this.all().find((entry) => entry.id === id);
    }
}

/** The entries that serve a language: the shipped one first, then the apps'. */
export function entriesFor(state: RelayState, language: string): ServerEntry[] {
    const own = state.servers.forLanguage(language);
    const apps = state.apps?.serving(language) ?? [];
    return own === undefined ? apps : [own, ...apps];
}

/**
 * A `Child` over the stream a host opens for a server of an app. `hold` is told true when the
 * stream has no credit, so the page's messages to the server stop at their source, and false when
 * credit returns or the stream ends.
 */
function streamChild(open: () => Promise<AppStreamLike>, hold: (full: boolean) => void): Child {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const listeners = {
        exit: [] as ((code: number | null, signal: NodeJS.Signals | null) => void)[],
        error: [] as ((error: NodeJS.ErrnoException) => void)[]
    };
    let ended = false;
    let stream: AppStreamLike | null = null;
    const queue: unknown[] = [];
    const finish = (code: number | null): void => {
        if (ended) return;
        ended = true;
        hold(false);
        stdout.end();
        stderr.end();
        for (const listener of listeners.exit) listener(code, null);
    };
    const fail = (code: string): void => {
        if (ended) return;
        ended = true;
        hold(false);
        stdout.end();
        stderr.end();
        const error: NodeJS.ErrnoException = Object.assign(new Error(code), { code });
        for (const listener of listeners.error) listener(error);
    };
    const reader = new StreamMessageReader(stdin);
    reader.onError(() => undefined);
    reader.listen((message) => {
        if (stream === null) queue.push(message);
        else stream.sendMessage(message);
    });
    const writer = new StreamMessageWriter(stdout);
    open().then(
        (opened) => {
            if (ended) {
                opened.close();
                return;
            }
            stream = opened;
            // While the host's credit is out, the messages already sent wait in stdin and the
            // sockets of the pages that send to the server are paused, so nothing more arrives.
            opened.backpressure(
                () => {
                    stdin.pause();
                    hold(true);
                },
                () => {
                    stdin.resume();
                    hold(false);
                }
            );
            opened.onMessage(async (message) => {
                if (!ended) await writer.write(message as LspRpc).catch(() => undefined);
            });
            opened.onStderr((text) => {
                if (!ended) stderr.write(text);
            });
            opened.onControl((body) => {
                if (body.end !== true) return;
                if (body.code === NOT_FOUND) fail('ENOENT');
                else finish(body.code ?? null);
            });
            opened.onClose(() => finish(null));
            for (const message of queue.splice(0)) opened.sendMessage(message);
        },
        () => fail('EHOST')
    );
    return {
        pid: undefined,
        stdin: stdin,
        stdout: stdout,
        stderr: stderr,
        kill() {
            stream?.close();
            finish(null);
            return true;
        },
        on(event: string, listener: never) {
            if (event === 'exit') listeners.exit.push(listener);
            else listeners.error.push(listener);
            return undefined;
        }
    };
}

/** The spawn of the relay with the apps' pseudo program added to the shipped one. */
export function appSpawn(state: () => RelayState, shipped: Spawn): Spawn {
    return (command, args, options) => {
        if (command !== APP_PROGRAM) return shipped(command, args, options);
        const current = state();
        const info = current.apps
            ?.all()
            .map((entry) => entry.app)
            .find((one) => one?.app === args[0] && one.id === args[1]);
        let paused: Sink[] = [];
        const hold = (full: boolean): void => {
            for (const sink of paused) holdSink(current, sink, -1);
            paused = full && info !== undefined ? pagesSendingTo(current, info) : [];
            for (const sink of paused) holdSink(current, sink, 1);
        };
        return streamChild(() => {
            if (info === undefined || current.appFeed === undefined) {
                return Promise.reject(new Error('the server is not registered'));
            }
            return current.appFeed.open(info, pathToFileURL(options.cwd).toString());
        }, hold);
    };
}

/** The sockets of the pages that hold a server of this app's registration. */
function pagesSendingTo(state: RelayState, info: AppServerInfo): Sink[] {
    const sends = (page: Page): boolean =>
        [...page.helds.values()].some(
            (held) => held.entry.app?.app === info.app && held.entry.app.id === info.id
        );
    return [...state.pages.values()].filter(sends).map((page) => page.sink);
}

/** One more or one fewer stream holding a page's socket: paused at the first, resumed at none. */
function holdSink(state: RelayState, sink: Sink, by: 1 | -1): void {
    const before = state.holding.get(sink) ?? 0;
    const after = Math.max(0, before + by);
    if (after === 0) state.holding.delete(sink);
    else state.holding.set(sink, after);
    if (before === 0 && after > 0) sink.pause?.();
    if (before > 0 && after === 0) sink.resume?.();
}
