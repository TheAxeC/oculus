// Layer 2, client state. The page's end of the language servers: the channel of each language on
// the page socket, the state of each server, the choices a root offers, the refusals of a choice
// and the output of a server's log.
//
// A language's channel is `lsp:<language>` (DESIGN.md, "The socket"). The messages on it are the
// protocol's JSON-RPC messages, which the editor's client reads through its port, and the relay's
// own, told apart by their `oculus` field, which this store reads: `state` (a server starting,
// indexing, ready, not found or failed, with the code that says why), `choices` (the interpreters
// and compile databases a root offers and the one in force), `refused` (a choice that was not
// written) and `output` (a server's log lines). The port hands the client every message, the
// relay's own included, and the client ignores those.
//
// A port is open when the page socket is open and its subscription carries the token the server
// holds (`socket.admitted`): a frame written before is refused, and a client that sent its
// `initialize` into a refusal would wait for ever. The store keeps one listener per language on the
// socket, made when the language's port is first asked for, so the states are read whether or not a
// client is listening.

import type {
    LspCode,
    LspDatabase,
    LspInterpreter,
    LspRefusal,
    LspState,
    LspToPage,
    LspToServer
} from '../../../../data/model/index.ts';
import type { SocketStore } from '../../../shared/stores/shapes.ts';

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

/** The choices one root offers for one language. */
export type ChoicesView = Extract<LspToPage, { oculus: 'choices' }>;

/** One choice made from a picker: an interpreter, or a compile database by its key. */
type LspChoice = { interpreter: string } | { database: string };

/**
 * How a choice or an approval ended: the relay answered with the choices in force (`chosen`), it
 * refused to write it (the refusal's code), or nothing was sent or answered (`unsent`).
 */
export type LspAnswer = 'chosen' | 'unsent' | LspRefusal;

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
    /** Approve a repository's own interpreter on this machine. */
    approve: (root: string, language: string, interpreter: string) => Promise<LspAnswer>;
    /** End a root's server and start it again on its next request. */
    restart: (root: string, language: string) => boolean;
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

/** The channel a language's messages are on. */
function channelOf(language: string): string {
    return `lsp:${language}`;
}

export function createLsp(socket: SocketStore): LspStore {
    const held: Held = $state({ servers: {}, choices: {}, refusals: {}, lines: {} });
    const links = new Map<string, LspLink>();
    /** The choices and approvals waiting for the relay's answer, by key. */
    const waiting = new Map<string, ((answer: LspAnswer) => void)[]>();
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
    function read(language: string, message: LspToPage): void {
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
            held.choices[key] = message;
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by root and language
            delete held.refusals[key];
            answered(key, 'chosen');
        } else if (message.oculus === 'refused') {
            held.refusals[key] = message.code;
            answered(key, message.code);
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

    /** Whether a payload is one of the relay's own messages. */
    function isOculus(payload: unknown): payload is LspToPage {
        if (typeof payload !== 'object' || payload === null) return false;
        const one = payload as Record<string, unknown>;
        return typeof one.oculus === 'string' && typeof one.root === 'string';
    }

    function link(language: string): LspLink {
        const made = links.get(language);
        if (made !== undefined) return made;
        let last = linkState();
        const channel = channelOf(language);
        socket.listen(channel, (message) => {
            if (isOculus(message.payload)) read(language, message.payload);
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

    // A log being watched is asked for again once the socket is admitted after a drop.
    socket.onLink(() => {
        if (linkState() !== 'open') return;
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
        approve: (root, language, interpreter) =>
            ask(language, root, { oculus: 'approve', root, interpreter }),
        restart: (root, language) => write(language, root, { oculus: 'restart', root }),
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
