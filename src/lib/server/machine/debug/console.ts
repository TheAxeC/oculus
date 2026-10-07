// Layer 2, server. The debug console one session keeps and the channel it is published on.
//
// The console is the program's output in order and the console's own lines (the launch, each
// expression typed and its result, the end of the session). Each line has an absolute number,
// counted from 0 at the session's first line and never used twice in the session. At most
// CONSOLE_MAX lines are held; past that the oldest go, and `first` says the number of the oldest
// held, which is also how many were dropped.
//
// The `debug-console` channel carries appends, `{ session, start, lines }`, at most one each
// COALESCE_MS, so a program that prints in a loop is not one message a line. A page that is behind
// is sent the appends joined into one by `mergeAppends`, which the hub is told to use, so it gets
// every line late rather than only the newest. A page that cannot continue from the append it was
// sent (it joined late, or the session changed) reads the whole console by `snapshot`.

import type { Message } from '../../../data/model/index.ts';
import {
    DEBUG_CONSOLE_MAX,
    type DebugConsole,
    type DebugConsoleLine
} from '../../../data/model/index.ts';
import { debugAppendShape } from '../../../data/shapes/shapes.ts';
import type { Hub } from '../../core/channels.ts';

/** The channel the console's appends go out on. */
const CONSOLE_CHANNEL = 'debug-console';

/** The most lines a session's console holds. */
const CONSOLE_MAX = DEBUG_CONSOLE_MAX;

/** How long lines are gathered into one append. */
const COALESCE_MS = 100;

/**
 * The hub's merge for the channel: an append and the next one of the same session that continues
 * it are one append, cut to the last CONSOLE_MAX lines; any other next message replaces the held.
 */
function mergeAppends(held: Message, next: Message): Message {
    const before = debugAppendShape.safeParse(held.payload);
    const after = debugAppendShape.safeParse(next.payload);
    if (!before.success || !after.success) return next;
    const a = before.data;
    const b = after.data;
    if (a.session !== b.session || b.start !== a.start + a.lines.length) return next;
    const lines = [...a.lines, ...b.lines];
    const dropped = Math.max(0, lines.length - CONSOLE_MAX);
    return {
        channel: next.channel,
        version: next.version,
        payload: { session: a.session, start: a.start + dropped, lines: lines.slice(dropped) }
    };
}

/** The console of the current session and its publishing. */
export class ConsoleStore {
    #hub: Hub;
    #session = 0;
    /** The absolute number of the first held line. */
    #first = 0;
    #lines: DebugConsoleLine[] = [];
    /** The absolute number of the first line not yet published. */
    #published = 0;
    #timer: ReturnType<typeof setTimeout> | null = null;

    constructor(hub: Hub) {
        this.#hub = hub;
        hub.merge(CONSOLE_CHANNEL, mergeAppends);
    }

    /** Begin the console of a new session: empty, from line 0. */
    reset(session: number): void {
        this.#cancel();
        this.#session = session;
        this.#first = 0;
        this.#lines = [];
        this.#published = 0;
    }

    /** Add lines at the end; they are published within COALESCE_MS. */
    add(lines: DebugConsoleLine[]): void {
        if (lines.length === 0) return;
        this.#lines.push(...lines);
        const over = this.#lines.length - CONSOLE_MAX;
        if (over > 0) {
            this.#lines.splice(0, over);
            this.#first += over;
        }
        this.#timer ??= setTimeout(() => this.flush(), COALESCE_MS);
        if (typeof this.#timer === 'object') this.#timer.unref();
    }

    /** Publish the lines not published yet now. */
    flush(): void {
        this.#cancel();
        const start = Math.max(this.#published, this.#first);
        const lines = this.#lines.slice(start - this.#first);
        this.#published = this.#first + this.#lines.length;
        if (lines.length === 0) return;
        this.#hub.publish(CONSOLE_CHANNEL, { session: this.#session, start, lines });
    }

    /** The whole console as held. */
    snapshot(): DebugConsole {
        return { session: this.#session, first: this.#first, lines: [...this.#lines] };
    }

    /** Stop the timer and take the hub's merge off the channel. */
    close(): void {
        this.#cancel();
        this.#hub.merge(CONSOLE_CHANNEL, null);
    }

    #cancel(): void {
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = null;
    }
}
