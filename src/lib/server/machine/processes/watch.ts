// Layer 2, server. The Processes watcher publishes one complete payload per read on the `processes`
// channel. It reads every ten seconds while the hub has a subscriber on the channel and not at all
// while it has none; the first subscriber after none starts a read at once, and the hub's replay of
// the last payload serves a later page. A failed read publishes the rows of the last good read
// under the catalog's sentence for the failure. One read runs at a time, and a read whose child was
// killed ends only when that child has closed, so one `ps` child exists at most; a read begun under
// an older pattern list is dropped, and close() ends the read in flight, kills its child and leaves
// nothing published and no timer.

import type { ProcessesPayload } from '../../../data/model/index.ts';
import type { ProcessesSettings } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import { failureLine, ReadFailure } from './failure.ts';
import { readProcesses, type ReadDeps } from './read.ts';

/** Milliseconds between two reads while a page is open. */
const READ_MS = 10000;

const CHANNEL = 'processes';

export type ProcessesOptions = {
    patterns: string[];
    deps: ReadDeps;
    /** The text catalog the failure sentences are worded from. */
    text: Record<string, string>;
};

export type ProcessesWatcher = {
    /** Take a new pattern list: a changed list drops what the old one read and reads at once. */
    set(settings: ProcessesSettings): void;
    /** Take the text catalog the next failure is worded from. */
    setText(text: Record<string, string>): void;
    close(): void;
};

type Held = Pick<ProcessesPayload, 'rows' | 'agents' | 'projects' | 'updated'>;

/** What is held before a first good read; built per use, so no read shares its rows. */
function nothing(): Held {
    return { rows: [], agents: 0, projects: 0, updated: '' };
}

export function watchProcesses(hub: Hub, options: ProcessesOptions): ProcessesWatcher {
    let patterns = [...options.patterns];
    let text = options.text;
    let held: Held = nothing();
    let closed = false;
    /** Read through a call, so a check before an await never stands in for the one after it. */
    const stopped = (): boolean => closed;
    let reading = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const controller = new AbortController();

    const run = async (): Promise<void> => {
        if (stopped() || reading) return;
        reading = true;
        const began = patterns;
        let ended: Promise<void> = Promise.resolve();
        try {
            const read = await readProcesses(options.deps, began, controller.signal);
            if (stopped() || began !== patterns) return;
            held = { ...read, updated: new Date().toISOString() };
            hub.publish(CHANNEL, { status: 'ok', ...held } satisfies ProcessesPayload);
        } catch (error) {
            if (error instanceof ReadFailure) ended = error.ended;
            if (stopped() || began !== patterns) return;
            hub.publish(CHANNEL, {
                status: 'failed',
                ...held,
                error: failureLine(error, text)
            } satisfies ProcessesPayload);
        } finally {
            await ended;
            reading = false;
            if (!stopped() && began !== patterns && hub.hasSubscriber(CHANNEL)) void run();
        }
    };

    const stop = (): void => {
        if (timer !== null) clearInterval(timer);
        timer = null;
    };
    const tick = (): void => {
        if (hub.hasSubscriber(CHANNEL)) void run();
        else stop();
    };
    const off = hub.onFirstSubscriber(CHANNEL, () => {
        if (stopped()) return;
        stop();
        timer = setInterval(tick, READ_MS);
        timer.unref();
        void run();
    });

    return {
        set(settings): void {
            if (stopped() || settings.patterns.join('\n') === patterns.join('\n')) return;
            patterns = [...settings.patterns];
            held = nothing();
            if (hub.hasSubscriber(CHANNEL)) void run();
        },
        setText(next): void {
            text = next;
        },
        close(): void {
            closed = true;
            off();
            stop();
            controller.abort();
        }
    };
}
