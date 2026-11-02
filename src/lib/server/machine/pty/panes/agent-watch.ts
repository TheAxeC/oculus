// Layer 2, server. The process table the terminal list reads its agents from. tmux says nothing
// when `claude` is typed in a shell, so a timer of its own reads the table while a page is
// subscribed to anything, one `ps` at a time. A list refresh uses the last answer and runs no `ps`,
// and a read that fails leaves the last answer standing. The first read starts at construction, so
// the first list a server publishes waits for it and a page is never told of a by-hand terminal's
// absence only because the table had not been read.
//
// Each tick after the first also lists the panes, one tmux call: the notices a control client reads
// name no new pane and no resize (driver.ts, `CHANGE_EVENTS`), and the list poll rests while one is
// open. The list and the table are handed on together for the caller to compare with what it took
// last. A tick holds its turn through both, so no second `ps` or list starts while one is out.

import { ReadFailure } from '../../processes/failure.ts';
import { readTable } from '../../processes/ps.ts';
import type { Entry } from '../../processes/table.ts';

export type AgentWatchOptions = {
    /** One read of the table; `ps` when absent. Aborting the signal ends the run. */
    table?: (signal: AbortSignal) => Promise<Entry[]>;
    /** One list of the panes, the call a refresh makes. */
    list: () => Promise<string>;
    /** Milliseconds between two reads while a page is subscribed; 0 reads nothing at all. */
    poll: number;
    /**
     * Called when a tick other than the first answers, with the table before it, its own, and its
     * list, null for a list that failed.
     */
    answered: (before: readonly Entry[], after: readonly Entry[], list: string | null) => void;
};

export class AgentWatch {
    #read: (signal: AbortSignal) => Promise<Entry[]>;
    #list: () => Promise<string>;
    #poll: number;
    #answered: AgentWatchOptions['answered'];
    #table: Entry[] = [];
    /** True while a tick is out: the next one then starts no second child. */
    #reading = false;
    #settled: boolean;
    #first = Promise.withResolvers<undefined>();
    #timer: ReturnType<typeof setInterval> | null = null;
    #stop = new AbortController();

    constructor(options: AgentWatchOptions) {
        this.#read = options.table ?? ((signal) => readTable({ signal }));
        this.#list = options.list;
        this.#poll = options.poll;
        this.#answered = options.answered;
        this.#settled = this.#poll <= 0;
        if (!this.#settled) void this.#tick();
    }

    /** The last table read, empty before the first answer. */
    table(): readonly Entry[] {
        return this.#table;
    }

    /** Settles when the first read has, at once when it already did. */
    async settled(): Promise<void> {
        if (!this.#settled) await this.#first.promise;
    }

    /** Whether a page is subscribed: the timer runs while one is, and the first starts a read. */
    watched(pages: boolean): void {
        if (this.#poll <= 0 || this.#stop.signal.aborted || pages === (this.#timer !== null)) {
            return;
        }
        if (!pages) {
            this.#disarm();
            return;
        }
        this.#timer = setInterval(() => void this.#tick(), this.#poll);
        if (typeof this.#timer === 'object') this.#timer.unref();
        void this.#tick();
    }

    close(): void {
        this.#disarm();
        this.#stop.abort();
        this.#settle();
    }

    #disarm(): void {
        if (this.#timer !== null) clearInterval(this.#timer);
        this.#timer = null;
    }

    #settle(): void {
        this.#settled = true;
        this.#first.resolve(undefined);
    }

    /** Whether the watch closed, read afresh since a read's await may span the close. */
    #closed(): boolean {
        return this.#stop.signal.aborted;
    }

    async #tick(): Promise<void> {
        if (this.#reading || this.#closed()) return;
        this.#reading = true;
        const before = this.#table;
        try {
            this.#table = await this.#read(this.#stop.signal);
        } catch (error) {
            // A killed child may outlast its failure, and no second one starts before it has gone.
            if (error instanceof ReadFailure) await error.ended;
        }
        const first = !this.#settled;
        this.#settle();
        // The first list is the caller's own first read, which waits for this one to settle.
        if (first || this.#closed()) {
            this.#reading = false;
            return;
        }
        const list = await this.#list().catch(() => null);
        this.#reading = false;
        if (!this.#closed()) this.#answered(before, this.#table, list);
    }
}
