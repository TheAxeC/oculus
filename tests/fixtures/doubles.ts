// Layer 4, test helper. The inert callback a case hands to a component, a fixture or a double when
// it asserts nothing about the call, the stand-in for the words function, the write request a page
// sends, the entries of a hand-built folder listing, a clock the case moves by hand, a terminal
// driver that runs no tmux, the git credentials of a server signed in nowhere, and a language
// server channel that is open and takes what is sent. They exist once here so a case says "nothing
// happens on this callback" in one word rather than writing an empty function at every prop, every
// route test posts the same page request, and every listing is built from the same two entries.

import type { Clock } from '../../src/lib/server/core/files/file-poll.ts';
import { gitCredentials, type GitCredentials } from '../../src/lib/server/core/git/credentials.ts';
import type { FsEntry } from '../../src/lib/state/sources/fs.ts';
import type { TerminalDriver } from '../../src/lib/server/machine/pty/channel.ts';
import type { LspPort } from '../../src/lib/ui/controls/editor/kit/lsp/services.ts';

/** A callback whose call the case does not read. */
export const noop = (): void => undefined;

/**
 * A stand-in for the words function: a key answers `@key`, with its arguments after it in
 * parentheses, so a case reads which key and which arguments a sentence was made from.
 */
export const keyWords = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

/** A POST as the page sends one: JSON, from the page's own origin, carrying the write token. */
export function pagePost(url: string, body: unknown, token: string): Request {
    return new Request(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

/** A file of one byte as a folder listing holds it. */
export function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 1 };
}

/** A folder as a folder listing holds it. */
export function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}

/** A clock that runs a scheduled call only when the test says so. */
export function manualClock(): Clock & { due: () => number; tick: () => void } {
    const scheduled = new Map<number, () => void>();
    let next = 1;
    return {
        setTimeout: (run) => {
            const id = next++;
            scheduled.set(id, run);
            return id;
        },
        clearTimeout: (timer) => {
            scheduled.delete(timer as number);
        },
        due: () => scheduled.size,
        tick: () => {
            const running = [...scheduled.values()];
            scheduled.clear();
            for (const run of running) run();
        }
    };
}

/**
 * A terminal driver that runs no tmux: every command and read answers nothing, and no server runs.
 */
export function idleDriver(): TerminalDriver {
    return {
        run: () => Promise.resolve(''),
        read: () => Promise.resolve(''),
        onOutput: noop,
        onChange: noop,
        attached: noop,
        live: () => false,
        serverRuns: () => Promise.resolve(false),
        close: noop
    };
}

/**
 * The git credentials of a server with no `sign_in` row: the real `gitCredentials` over no rows, so
 * every git and terminal it is handed starts with no credential pairs and nothing is read.
 */
export function noCredentials(): GitCredentials {
    return gitCredentials(() => []);
}

/**
 * A language server channel for an editor's transport: open, taking every message sent, and handing
 * the transport each payload the case gives `answer` as the server's message.
 */
export function openPort(): { port: LspPort; answer: (payload: Record<string, unknown>) => void } {
    let hear: (payload: Record<string, unknown>) => void = () => undefined;
    const port: LspPort = {
        state: { value: 'open', onChange: () => () => undefined },
        send: () => true,
        listen: (fn) => {
            hear = fn;
            return () => undefined;
        }
    };
    return { port, answer: (payload) => hear(payload) };
}
