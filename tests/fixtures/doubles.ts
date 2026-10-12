// Layer 4, test helper. The inert callbacks a case hands to a component, a fixture or a double when
// it asserts nothing about the call, the stand-in for the words function, the write request a page
// sends, the entries of a hand-built folder listing, and the child process a case drives in place
// of `ps`. They exist once here so a case says "nothing happens on this callback" in one word
// rather than writing an empty function at every prop, every route test posts the same page
// request, every listing is built from the same two entries, and every test of the process table
// drives the same child.

import { EventEmitter } from 'node:events';
import type { Clock } from '../../src/lib/server/core/file-poll.ts';
import type { FsEntry } from '../../src/lib/state/sources/fs.ts';

/** A callback whose call the case does not read. */
export const noop = (): void => undefined;

/** The same where the caller awaits what the callback returns. */
export const noopAsync = (): Promise<void> => Promise.resolve();

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

/**
 * A child process the case drives: it writes to its standard output, ends with a status or a
 * signal, and records the signal it was killed with.
 */
export class ChildDouble extends EventEmitter {
    readonly stdout = new EventEmitter() as EventEmitter & { setEncoding: (value: 'utf8') => void };
    readonly kills: string[] = [];

    constructor() {
        super();
        this.stdout.setEncoding = () => undefined;
    }

    kill(signal: 'SIGKILL'): boolean {
        this.kills.push(signal);
        return true;
    }

    write(text: string): void {
        this.stdout.emit('data', text);
    }

    end(code: number | null, signal: string | null = null): void {
        this.emit('close', code, signal);
    }
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
