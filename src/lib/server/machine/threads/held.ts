// Layer 2, server. A worker thread a watcher holds for work that would keep the server's one thread
// from its requests: the sessions scan (scan-worker.ts) and the usage fold (usage/fold-worker.ts).
// The worker's end of the port is serve.ts.
//
// At most one request runs and one waits. A request asked while one runs waits for it, and every
// later one joins the waiting one, whose kind is then the two joined by the owner's rule, so asks
// that never stop cost one run at a time and the run after the last ask reads what it asked for.
// What goes to the worker is made as its request starts, so a run that waited carries what holds
// then.
//
// The worker is started by the first request and never keeps the process up. One that dies fails
// the request it had, and the next request starts another. `close` ends it and no answer is told
// after it: the worker is told to end rather than terminated, since a thread stopped inside a file
// write leaves the write's temporary file behind, and a reader that yields between its reads stops
// at the next one.

import { Worker } from 'node:worker_threads';

/** What a message to the worker holds: one request, or the word to end. */
export type ToWorker<Ask> = { id: number; ask: Ask } | { end: true };

/** What a message of the worker holds: the answer to one request, or why it failed. */
export type FromWorker<Answer> = { id: number; answer: Answer } | { id: number; error: string };

export type HeldWorkerOptions<Kind, Ask, Answer> = {
    /** The worker file. */
    file: string;
    /** What one request asks of the worker, made as the request starts. */
    request: (kind: Kind) => Ask;
    /** The kind a waiting request has once another joins it. */
    join: (waiting: Kind, next: Kind) => Kind;
    answered: (answer: Answer, kind: Kind) => void;
    /** A request failed: the worker's reason, its death, or an error of `answered`. */
    failed: (why: string, kind: Kind) => void;
};

/** A request and the promise of its end, whichever way it ends. */
type Run<Kind> = { id: number; kind: Kind; ended: PromiseWithResolvers<void> };

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export class HeldWorker<Kind, Ask, Answer> {
    #options: HeldWorkerOptions<Kind, Ask, Answer>;
    #worker: Worker | null = null;
    #running: Run<Kind> | null = null;
    #waiting: Run<Kind> | null = null;
    #next = 1;
    #closed = false;

    constructor(options: HeldWorkerOptions<Kind, Ask, Answer>) {
        this.#options = options;
    }

    /** Run a request now or after the one that runs; settles once it has ended, and at `close`. */
    ask(kind: Kind): Promise<void> {
        if (this.#closed) return Promise.resolve();
        if (this.#waiting !== null) {
            this.#waiting.kind = this.#options.join(this.#waiting.kind, kind);
            return this.#waiting.ended.promise;
        }
        const run: Run<Kind> = { id: this.#next++, kind, ended: Promise.withResolvers() };
        if (this.#running === null) this.#start(run);
        else this.#waiting = run;
        return run.ended.promise;
    }

    /** End the worker; nothing is told of the requests it had. */
    close(): void {
        this.#closed = true;
        const worker = this.#worker;
        this.#worker = null;
        worker?.postMessage({ end: true } satisfies ToWorker<Ask>);
        for (const run of [this.#running, this.#waiting]) run?.ended.resolve();
        this.#running = null;
        this.#waiting = null;
    }

    #start(run: Run<Kind>): void {
        this.#running = run;
        try {
            const worker = this.#worker ?? this.#open();
            const message: ToWorker<Ask> = { id: run.id, ask: this.#options.request(run.kind) };
            worker.postMessage(message);
        } catch (error) {
            this.#end(run, () => this.#options.failed(reason(error), run.kind));
        }
    }

    #open(): Worker {
        const worker = new Worker(this.#options.file);
        this.#worker = worker;
        worker.on('message', (message: FromWorker<Answer>) => {
            if (this.#worker === worker) this.#heard(message);
        });
        worker.on('messageerror', (error) => this.#lost(worker, error.message));
        worker.on('error', (error) => this.#lost(worker, reason(error)));
        worker.on('exit', () => this.#lost(worker, 'the worker thread ended'));
        // A listener for messages has the worker keep the process up, so this comes after it.
        worker.unref();
        return worker;
    }

    #heard(message: FromWorker<Answer>): void {
        const run = this.#running;
        if (run?.id !== message.id) return;
        this.#end(run, () => {
            if ('error' in message) this.#options.failed(message.error, run.kind);
            else this.#options.answered(message.answer, run.kind);
        });
    }

    /** The worker is gone or cannot be read: its request fails, and the next one starts another. */
    #lost(worker: Worker, why: string): void {
        if (this.#worker !== worker) return;
        this.#worker = null;
        void worker.terminate();
        const run = this.#running;
        if (run !== null) this.#end(run, () => this.#options.failed(why, run.kind));
    }

    /**
     * Tell the end of the running request and start the one that waits. A request asked while the
     * end is told waits like any other, and a `close` in it leaves nothing to start.
     */
    #end(run: Run<Kind>, tell: () => void): void {
        try {
            tell();
        } catch (error) {
            this.#options.failed(reason(error), run.kind);
        }
        if (this.#running !== run) return;
        this.#running = null;
        run.ended.resolve();
        const next = this.#waiting;
        this.#waiting = null;
        if (next !== null) this.#start(next);
    }
}
