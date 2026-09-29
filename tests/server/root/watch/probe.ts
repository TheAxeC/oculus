// Layer 4, test helper. What a case over a watcher needs of the channel bus and of the clock: a
// sink that records what was published, the two waits a real file event is watched for, the file
// system's watches taken into the case's own hand, and the run of events every watcher's debounce
// is held to on fake timers.
//
// A watcher case waits on the operating system rather than on a promise of its own, so it polls:
// the wait is how long a failure takes and not how long a pass takes. A debounce case holds the
// watches instead, so no event reaches the watcher but the ones the case fires.

import type * as Fs from 'node:fs';
import { expect, vi } from 'vitest';
import type { Message } from '../../../../src/lib/data/model/index.ts';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import { noop } from '../../../fixtures/doubles.ts';

/** A subscriber that keeps every message it is sent, in the order the hub sent them. */
export function recording(): { sink: Sink; got: Message[] } {
    const got: Message[] = [];
    return {
        got,
        sink: {
            send: (text: string) => {
                got.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
}

export function sleep(ms: number): Promise<void> {
    return new Promise((done) => setTimeout(done, ms));
}

/** Wait until the condition holds, or until the time is up and the assertion after it fails. */
export async function until(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(20);
}

/** A listener a watch was opened with, whatever it is handed. */
type Listener = (...args: unknown[]) => void;

/**
 * Whether the file system's watches are held, and the listener each held one was opened with, by
 * the path it was opened on. A test file hoists one with vi.hoisted and hands it to heldWatches.
 */
export type HeldWatches = { held: boolean; listeners: Map<string, Listener> };

/**
 * The file system as it is, but for `watch`, `watchFile` and `unwatchFile` while `state.held` is
 * set: a watch is then opened on nothing, its listener is kept under its path, and the handle it
 * answers closes nothing. A test file mocks node:fs with this, so its cases over real events run
 * as they did and a debounce case fires the listener itself.
 */
export function heldWatches(actual: typeof Fs, state: HeldWatches): typeof Fs {
    const hold = (path: unknown, args: unknown[]): void => {
        state.listeners.set(String(path), args.at(-1) as Listener);
    };
    const watch = (path: Fs.PathLike, ...args: unknown[]): unknown => {
        if (!state.held) return (actual.watch as (...all: unknown[]) => unknown)(path, ...args);
        hold(path, args);
        return { close: noop };
    };
    const watchFile = (path: Fs.PathLike, ...args: unknown[]): unknown => {
        if (!state.held) return (actual.watchFile as (...all: unknown[]) => unknown)(path, ...args);
        hold(path, args);
        return { ref: noop, unref: noop };
    };
    const unwatchFile = (path: Fs.PathLike, ...args: unknown[]): void => {
        if (!state.held) (actual.unwatchFile as (...all: unknown[]) => void)(path, ...args);
    };
    return { ...actual, watch, watchFile, unwatchFile } as typeof Fs;
}

/**
 * The debounce every watcher keeps, on fake timers: three events inside the wait make one rebuild
 * once the wait has passed since the last of them, one event after that makes one more after the
 * full wait, and an event followed by the close makes none, however long the clock then runs.
 * `count` answers how many rebuilds have run, read once what the start published has been sent;
 * the caller installs the fake timers.
 */
export async function holdsDebounce(
    event: () => void,
    wait: number,
    count: () => number,
    close: () => void
): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
    const start = count();
    event();
    await vi.advanceTimersByTimeAsync(wait / 2);
    event();
    await vi.advanceTimersByTimeAsync(wait / 2);
    event();
    await vi.advanceTimersByTimeAsync(wait - 1);
    expect(count()).toBe(start);
    await vi.advanceTimersByTimeAsync(1);
    expect(count()).toBe(start + 1);
    event();
    await vi.advanceTimersByTimeAsync(wait - 1);
    expect(count()).toBe(start + 1);
    await vi.advanceTimersByTimeAsync(1);
    expect(count()).toBe(start + 2);
    event();
    close();
    await vi.advanceTimersByTimeAsync(wait * 4);
    expect(count()).toBe(start + 2);
}
