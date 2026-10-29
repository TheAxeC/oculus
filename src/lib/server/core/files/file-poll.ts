// Layer 2, server. One small file polled on a clock: a stat each tick, and a call when what the
// stat says has moved since the newest read of the file. The git watcher reads the saved workspaces
// file this way and the mail poller its triage notes, which is why it sits in server/core, the
// folder under both server/root and server/accounts.
//
// A file is polled rather than watched. A darwin fs.watch over a directory is an FSEvents stream
// that registers asynchronously, and under a load of file events a write landing while it registers
// is never delivered: a note or a root written just as the server starts would then stay off the
// page until something else moved. A stat compared on a timer reads a write made at any moment at
// the next tick, and one small file costs a stat per tick and no native handle.
//
// The tick runs on a clock the caller passes rather than on node's watchFile, which
// root/watch/bookmarks.ts polls through: a clock the caller holds cannot drive watchFile, and the
// clock is what lets a case say exactly when a tick runs.

import { statSync } from 'node:fs';

/** Milliseconds between two stats of a polled file. */
export const POLL = 500;

/** What a clock's `setTimeout` gives back: a handle its own `clearTimeout` understands. */
export type Timer = ReturnType<typeof setTimeout> | number;

/**
 * A `setTimeout` and the `clearTimeout` that undoes it, in wall-clock milliseconds. A caller that
 * has to know when a window closes or a tick comes passes its own pair and runs it itself.
 */
export type Clock = {
    setTimeout(run: () => void, ms: number): Timer;
    clearTimeout(timer: Timer): void;
};

/** The globals, which is what the server runs on. */
export const systemClock: Clock = {
    setTimeout: (run, ms) => setTimeout(run, ms),
    clearTimeout: (timer) => clearTimeout(timer)
};

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * What a stat says of a file's content: its inode, size and both times, which an atomic replace, an
 * append and an in-place write each move. A missing file and one the stat refuses are values too,
 * so the file appearing, going and coming back are changes like any other. No file is `absent`.
 */
function signature(file: string | null): string {
    if (file === null) return 'absent';
    try {
        const stat = statSync(file, { throwIfNoEntry: false });
        if (stat === undefined) return 'absent';
        return `${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
    } catch (error) {
        return `unreadable:${reason(error)}`;
    }
}

/** A running poll of one file. */
export type FilePoll = {
    /**
     * Say that the file is being read now. The signature is taken before the read, so a write
     * between the two is a change the next tick sees rather than one the read already covers.
     */
    reading(): void;
    close(): void;
};

/**
 * Stat the file once a tick and call `changed` when its signature moved since the newest
 * `reading()`, which `changed` is expected to call before it reads. Until the first `reading()`
 * every signature is a change, so a file nothing has read yet is read at the first tick. A tick
 * whose `changed` closed the poll schedules no next one. The file is a path, or a function that
 * names the path at each tick and answers null when no file is meant any more, so a poll follows
 * a place that is resolved again at every tick.
 */
export function pollFile(
    file: string | (() => string | null),
    options: { clock: Clock; every: number },
    changed: () => void
): FilePoll {
    const { clock, every } = options;
    const place = (): string | null => (typeof file === 'function' ? file() : file);
    let seen = '';
    let timer: Timer | null = null;
    let closed = false;
    const tick = (): void => {
        if (closed) return;
        timer = clock.setTimeout(() => {
            timer = null;
            if (closed) return;
            if (signature(place()) !== seen) changed();
            tick();
        }, every);
    };
    tick();
    return {
        reading(): void {
            seen = signature(place());
        },
        close(): void {
            closed = true;
            if (timer !== null) clock.clearTimeout(timer);
            timer = null;
        }
    };
}
