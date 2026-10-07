// Layer 2, client state. The page's end of the language servers: the channel of each language on
// the page socket, the state of each server, the choices a root offers, the refusals of a choice
// and the output of a server's log.
//
// A language's channel is `lsp:<language>` (DESIGN.md, "The socket"). The messages on it are the
// protocol's JSON-RPC messages, which the editor's client reads through its port, and the relay's
// own, told apart by their `oculus` field, which this store reads: `state` (a server starting,
// indexing, ready, not found or failed, with the code that says why), `choices` (the interpreters,
// compile databases and Svelte configuration a root offers and the one in force), `refused` (a
// choice that was not written) and `output` (a server's log lines). The port hands the client every
// message, the relay's own included, and the client ignores those.
//
// The channel `lsp:workspace` is the page's own and has no language: the page tells the relay which
// files its tabs hold open, whatever their language (`publishTabs`), and asks which of some files
// another page holds open (`askHeld`), since an edit a server asks for is made in a tab where one
// holds the file and is written to disk only where no page does (edits.ts).
//
// A library file, which a language server named outside every served root in an answer to a
// request of this page (DESIGN.md, "The language servers"), has an address `oculus-lib:` the relay
// minted for this connection alone. The editor kit tells the store each address with the root of
// the document the request was made for and the channel's language (`named`), and the store reads
// the file over the channel on request (`readLibrary`). The relay forgets every address with the
// connection, so the store forgets them when the page socket is no longer open: an address the
// store does not hold is one the page can no longer read.
//
// A port is open when the page socket is open and its subscription carries the token the server
// holds (`socket.admitted`): a frame written before is refused, and a client that sent its
// `initialize` into a refusal would wait for ever. The store keeps one listener per language on the
// socket, made when the language's port is first asked for, so the states are read whether or not a
// client is listening.

import type {
    LspApproval,
    LspCode,
    LspConfig,
    LspDatabase,
    LspInterpreter,
    LspPlace,
    LspReadRefusal,
    LspRefusal,
    LspState,
    LspToPage,
    LspToServer
} from '../../../../data/model/index.ts';
import { SvelteMap } from 'svelte/reactivity';
import { WORKSPACE_LANGUAGE } from '../../../../data/prose/lsp-servers.ts';
import type { SocketStore } from '../../../shared/stores/shapes.ts';

/** A message of the relay about one root's server. */
type HeldAnswer = Extract<LspToPage, { oculus: 'held_answer' }>;
type RootMessage = Exclude<LspToPage, HeldAnswer>;

/** The state of a port: the page socket as a language server client sees it. */
type LspLinkState = 'open' | 'connecting' | 'closed';

/** The page's end of one language's channel, as the editor's language server client reads it. */
type LspLink = {
    readonly state: {
        readonly value: LspLinkState;
        onChange: (fn: (value: LspLinkState) => void) => () => void;
    };
    send: (payload: Record<string, unknown>) => boolean;
    listen: (fn: (payload: Record<string, unknown>) => void) => () => void;
};

/** What the page knows of one root's server for one language. */
type ServerView = {
    state: LspState;
    /** Why the server is `not_found` or `failed`. */
    code: LspCode | null;
    /** The program that was not found, for the code `not_found`. */
    program: string;
    /** The files indexed and the files to index, while `indexing`. */
    done: number;
    total: number;
};

/**
 * The choices one root offers for one language: each list and choice is empty for a server that
 * asks for none of that kind.
 */
export type ChoicesView = {
    root: string;
    interpreters: LspInterpreter[];
    /** The path of the interpreter in force, null when there is none. */
    interpreter: string | null;
    databases: LspDatabase[];
    /** The key of the database in force, null when there is none. */
    database: string | null;
    findings: { file: string; field: string; message: string }[];
    /** The Svelte and Vite configuration the server would run, null for a server with none. */
    config: LspConfig | null;
};

/** One choice made from a picker: an interpreter, or a compile database by its key. */
type LspChoice = { interpreter: string } | { database: string };

/**
 * How a choice or an approval ended: the relay answered with the choices in force (`chosen`), it
 * refused to write it (the refusal's code), or nothing was sent or answered (`unsent`).
 */
export type LspAnswer = 'chosen' | 'unsent' | LspRefusal;

/** What the page may read of a library file: the root and the language its address was named in. */
type LibraryFile = { root: string; language: string };

/** How the read of a library file ended: its text, or the code that says why it was not read. */
type LibraryRead = { text: string } | { code: LspReadRefusal | 'unsent' };

/** The milliseconds an answer to a choice is waited for. */
const ANSWER_MS = 10_000;

export type LspStore = {
    /** The channel of a language, made the first time it is asked for. */
    link: (language: string) => LspLink;
    /** What the page knows of a root's server for a language, or null before it said anything. */
    server: (root: string, language: string) => ServerView | null;
    /** The choices a root last offered for a language, or null before it did. */
    choices: (root: string, language: string) => ChoicesView | null;
    /** Why the last choice was not written, or null. */
    refused: (root: string, language: string) => LspRefusal | null;
    /** Ask the relay for a root's choices; they arrive as a `choices` message. */
    askChoices: (root: string, language: string) => boolean;
    /** Make a choice for a root; the relay answers with the choices in force, or a refusal. */
    choose: (root: string, language: string, choice: LspChoice) => Promise<LspAnswer>;
    /**
     * Approve what a repository would run on this machine: its interpreter or its configuration.
     */
    approve: (root: string, language: string, approval: LspApproval) => Promise<LspAnswer>;
    /** Take back the approval of a repository's configuration. */
    revoke: (root: string, language: string) => Promise<LspAnswer>;
    /**
     * Tell the relay which files this page's tabs hold open; sent again after a reconnect and
     * whenever the set changes.
     */
    publishTabs: (files: LspPlace[]) => void;
    /**
     * Which of the files another page holds open in a tab, or null when the relay did not answer,
     * in which case an edit that names them is not made.
     */
    askHeld: (files: LspPlace[]) => Promise<LspPlace[] | null>;
    /** End a root's server and start it again on its next request. */
    restart: (root: string, language: string) => boolean;
    /** Record a library file a server named, under the root and language of the request. */
    named: (address: string, root: string, language: string) => void;
    /**
     * What the page knows of a library address, or null for one it was not given on this
     * connection.
     */
    library: (address: string) => LibraryFile | null;
    /** Read a library file the page was given; the read of an unknown address is `unsent`. */
    readLibrary: (address: string) => Promise<LibraryRead>;
    /** The lines of a server's log the page last heard, empty before any. */
    output: (root: string, language: string) => readonly string[];
    /**
     * Ask the relay for a server's log lines and keep asking after a reconnect; the call it
     * returns tells the relay to stop and forgets the lines.
     */
    watchOutput: (root: string, language: string) => () => void;
};

/** What the store keeps by a root and language. */
type Held = {
    servers: Record<string, ServerView>;
    choices: Record<string, ChoicesView>;
    refusals: Record<string, LspRefusal>;
    lines: Record<string, readonly string[]>;
};

/** The key of a root and a language. */
function keyOf(root: string, language: string): string {
    return JSON.stringify([language, root]);
}

/** The language of the channel that holds the page's own messages. */
const WORKSPACE = WORKSPACE_LANGUAGE;

/** The channel a language's messages are on. */
function channelOf(language: string): string {
    return `lsp:${language}`;
}

export function createLsp(socket: SocketStore): LspStore {
    const held: Held = $state({ servers: {}, choices: {}, refusals: {}, lines: {} });
    const links = new Map<string, LspLink>();
    /** The choices and approvals waiting for the relay's answer, by key. */
    const waiting = new Map<string, ((answer: LspAnswer) => void)[]>();
    /** The reads of library files waiting for the relay's answer, by language, root and address. */
    const reading = new Map<string, ((read: LibraryRead) => void)[]>();
    /** The library files named to this connection, by address. */
    const libraries = new SvelteMap<string, LibraryFile>();
    /** The root and language of every log being watched, by key, with the number watching. */
    const watched = new Map<string, { root: string; language: string; count: number }>();

    function linkState(): LspLinkState {
        const status = socket.status();
        if (status !== 'open') return status;
        return socket.admitted() ? 'open' : 'connecting';
    }

    function write(language: string, root: string, message: LspToServer): boolean {
        return socket.send({ channel: channelOf(language), payload: message });
    }

    /** Read one of the relay's own messages. */
    function read(language: string, message: RootMessage): void {
        const key = keyOf(message.root, language);
        if (message.oculus === 'state') {
            held.servers[key] = {
                state: message.state,
                code: message.code ?? null,
                program: message.program ?? '',
                done: message.done ?? 0,
                total: message.total ?? 0
            };
            // A server that starts has read its root's settings again, so the choices kept from
            // before may be out of date; the status item asks for them again.
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by root and language
            if (message.state === 'starting') delete held.choices[key];
        } else if (message.oculus === 'choices') {
            held.choices[key] = {
                root: message.root,
                interpreters: message.interpreters ?? [],
                interpreter: message.interpreter ?? null,
                databases: message.databases ?? [],
                database: message.database ?? null,
                findings: message.findings ?? [],
                config: message.config ?? null
            };
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by root and language
            delete held.refusals[key];
            answered(key, 'chosen');
        } else if (message.oculus === 'refused') {
            held.refusals[key] = message.code;
            answered(key, message.code);
        } else if (message.oculus === 'file') {
            const waits = reading.get(JSON.stringify([language, message.root, message.uri])) ?? [];
            reading.delete(JSON.stringify([language, message.root, message.uri]));
            const read: LibraryRead =
                'text' in message ? { text: message.text } : { code: message.code };
            for (const resolve of waits) resolve(read);
        } else if (message.oculus === 'output') {
            held.lines[key] = message.append
                ? [...(held.lines[key] ?? []), ...message.lines]
                : message.lines;
        }
    }

    /** Tell everything waiting for a root's answer how it ended. */
    function answered(key: string, answer: LspAnswer): void {
        const ones = waiting.get(key) ?? [];
        waiting.delete(key);
        for (const resolve of ones) resolve(answer);
    }

    /** Send a message that changes a root's choices, and wait for the relay's answer to it. */
    function ask(language: string, root: string, message: LspToServer): Promise<LspAnswer> {
        const key = keyOf(root, language);
        return new Promise<LspAnswer>((resolve) => {
            if (!write(language, root, message)) {
                resolve('unsent');
                return;
            }
            const later = setTimeout(() => answered(key, 'unsent'), ANSWER_MS);
            waiting.set(key, [
                ...(waiting.get(key) ?? []),
                (answer) => {
                    clearTimeout(later);
                    resolve(answer);
                }
            ]);
        });
    }

    /** Whether a payload is one of the relay's own messages about a root. */
    function isOculus(payload: unknown): payload is RootMessage {
        if (typeof payload !== 'object' || payload === null) return false;
        const one = payload as Record<string, unknown>;
        return typeof one.oculus === 'string' && typeof one.root === 'string';
    }

    /** Whether a payload is the relay's answer to a question about the files other pages hold. */
    function isHeldAnswer(payload: unknown): payload is HeldAnswer {
        if (typeof payload !== 'object' || payload === null) return false;
        const one = payload as Record<string, unknown>;
        return (
            one.oculus === 'held_answer' && typeof one.id === 'number' && Array.isArray(one.files)
        );
    }

    /** The files the page last told the relay its tabs hold, and the questions about others'. */
    let tabs: LspPlace[] = [];
    let questions = 0;
    const asking = new Map<number, (files: LspPlace[] | null) => void>();

    function publishTabs(files: LspPlace[]): void {
        link(WORKSPACE);
        tabs = files;
        if (linkState() === 'open') send(WORKSPACE, { oculus: 'held', files });
    }

    /** Send a message of the channel no language is on. */
    function send(language: string, payload: LspToServer): boolean {
        return socket.send({ channel: channelOf(language), payload });
    }

    function askHeld(files: LspPlace[]): Promise<LspPlace[] | null> {
        if (files.length === 0) return Promise.resolve([]);
        link(WORKSPACE);
        questions += 1;
        const id = questions;
        return new Promise((resolve) => {
            const later = setTimeout(() => {
                asking.delete(id);
                resolve(null);
            }, ANSWER_MS);
            asking.set(id, (answer) => {
                clearTimeout(later);
                resolve(answer);
            });
            if (!send(WORKSPACE, { oculus: 'held_ask', id, files })) {
                asking.delete(id);
                clearTimeout(later);
                resolve(null);
            }
        });
    }

    function link(language: string): LspLink {
        const made = links.get(language);
        if (made !== undefined) return made;
        let last = linkState();
        const channel = channelOf(language);
        socket.listen(channel, (message) => {
            const payload: unknown = message.payload;
            if (isOculus(payload)) read(language, payload);
            else if (isHeldAnswer(payload)) {
                const resolve = asking.get(payload.id);
                asking.delete(payload.id);
                resolve?.(payload.files);
            }
        });
        const own: LspLink = {
            state: {
                get value() {
                    return linkState();
                },
                onChange: (fn) =>
                    socket.onLink(() => {
                        const next = linkState();
                        if (next === last) return;
                        last = next;
                        fn(next);
                    })
            },
            send: (payload) => socket.send({ channel, payload }),
            // The client hears every message of the channel through its own listener, which
            // `socket.listen` takes beside this store's.
            listen: (fn) =>
                socket.listen(channel, (message) => {
                    const payload = message.payload;
                    if (typeof payload === 'object' && payload !== null) {
                        fn(payload as Record<string, unknown>);
                    }
                })
        };
        links.set(language, own);
        return own;
    }

    /** Forget every library address and fail the reads waiting for one. */
    function forgetLibraries(): void {
        libraries.clear();
        for (const waits of reading.values()) {
            for (const resolve of waits) resolve({ code: 'unsent' });
        }
        reading.clear();
    }

    // A log being watched is asked for again once the socket is admitted after a drop.
    socket.onLink(() => {
        if (socket.status() !== 'open') forgetLibraries();
        if (linkState() !== 'open') return;
        if (tabs.length > 0) send(WORKSPACE, { oculus: 'held', files: tabs });
        for (const one of watched.values()) {
            write(one.language, one.root, { oculus: 'output', root: one.root });
        }
    });

    function server(root: string, language: string): ServerView | null {
        return held.servers[keyOf(root, language)] ?? null;
    }

    function choices(root: string, language: string): ChoicesView | null {
        return held.choices[keyOf(root, language)] ?? null;
    }

    function refused(root: string, language: string): LspRefusal | null {
        return held.refusals[keyOf(root, language)] ?? null;
    }

    function output(root: string, language: string): readonly string[] {
        return held.lines[keyOf(root, language)] ?? [];
    }

    function readLibrary(address: string): Promise<LibraryRead> {
        const file = libraries.get(address);
        if (file === undefined) return Promise.resolve({ code: 'unsent' });
        const key = JSON.stringify([file.language, file.root, address]);
        return new Promise<LibraryRead>((resolve) => {
            if (
                !write(file.language, file.root, { oculus: 'read', root: file.root, uri: address })
            ) {
                resolve({ code: 'unsent' });
                return;
            }
            const answer = (read: LibraryRead): void => {
                clearTimeout(later);
                resolve(read);
            };
            const later = setTimeout(() => {
                reading.set(
                    key,
                    (reading.get(key) ?? []).filter((one) => one !== answer)
                );
                resolve({ code: 'unsent' });
            }, ANSWER_MS);
            reading.set(key, [...(reading.get(key) ?? []), answer]);
        });
    }

    function watchOutput(root: string, language: string): () => void {
        const key = keyOf(root, language);
        const one = watched.get(key) ?? { root, language, count: 0 };
        one.count += 1;
        watched.set(key, one);
        if (one.count === 1) write(language, root, { oculus: 'output', root });
        let stopped = false;
        return () => {
            if (stopped) return;
            stopped = true;
            one.count -= 1;
            if (one.count > 0) return;
            watched.delete(key);
            write(language, root, { oculus: 'output_off', root });
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by root and language
            delete held.lines[key];
        };
    }

    return {
        link,
        server,
        choices,
        refused,
        askChoices: (root, language) => write(language, root, { oculus: 'choices', root }),
        choose: (root, language, choice) =>
            ask(language, root, { oculus: 'choose', root, ...choice }),
        approve: (root, language, approval) =>
            ask(language, root, { oculus: 'approve', root, approval }),
        revoke: (root, language) =>
            ask(language, root, { oculus: 'revoke', root, approval: { kind: 'config' } }),
        publishTabs,
        askHeld,
        restart: (root, language) => write(language, root, { oculus: 'restart', root }),
        named: (address, root, language) => {
            const known = libraries.get(address);
            if (known?.root === root && known.language === language) return;
            libraries.set(address, { root, language });
        },
        library: (address) => libraries.get(address) ?? null,
        readLibrary,
        output,
        watchOutput
    };
}

/** A picker's interpreter list with the one in force first, as the status item reads it. */
export function interpreterInForce(view: ChoicesView | null): LspInterpreter | null {
    if (view === null) return null;
    return view.interpreters.find((one) => one.path === view.interpreter) ?? null;
}

/** The compile database in force, or null when there is none. */
export function databaseInForce(view: ChoicesView | null): LspDatabase | null {
    if (view === null) return null;
    return view.databases.find((one) => one.key === view.database) ?? null;
}

/** A finding of a repository's `.oculus/cpp.yml` as one line: the file, the key, what is wrong. */
export function findingLine(finding: ChoicesView['findings'][number]): string {
    const file =
        finding.file
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? finding.file;
    return [file, finding.field, finding.message].filter((part) => part !== '').join(' ');
}

/**
 * An interpreter as the status bar and the picker name it: `3.13.4 (.venv)`, or the version alone.
 */
export function interpreterLabel(one: LspInterpreter): string {
    return one.venv === null ? one.version : `${one.version} (${one.venv})`;
}
