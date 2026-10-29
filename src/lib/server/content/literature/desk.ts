// Layer 2, server. The pacing of the literature sources and the cache of their answers: one object
// the server context holds, handed to the handler, so no module keeps either as state of its own.
//
// Each source is a lane, named by its row's key. One request of a lane is in flight at a time, and
// two requests start at least the lane's gap apart; a request waiting its turn leaves the lane when
// its page aborts, and the next one takes its place. The cache keeps answers that came back `ok`,
// at most CACHE_MAX, the oldest dropped first, each for the minutes the setting gives; a setting of
// 0 keeps nothing.

import type { SourceHits } from '../../../data/model/index.ts';

/** The most answers the cache holds. */
const CACHE_MAX = 200;

/** Time, injectable so a run can be measured and a test can be fast. */
export type Clock = {
    now: () => number;
    sleep: (ms: number, signal: AbortSignal) => Promise<void>;
};

/** The system clock. */
const SYSTEM: Clock = {
    now: () => Date.now(),
    sleep: (ms, signal) =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                signal.removeEventListener('abort', stop);
                resolve();
            }, ms);
            const stop = (): void => {
                clearTimeout(timer);
                reject(reasonOf(signal));
            };
            signal.addEventListener('abort', stop, { once: true });
        })
};

/** What an aborted signal says: its reason when that is an error, else a plain one. */
function reasonOf(signal: AbortSignal): Error {
    return signal.reason instanceof Error ? signal.reason : new Error('aborted');
}

/** Resolves when `turn` does, or rejects with the signal's reason once the signal aborts. */
function turnOrAbort(turn: Promise<void>, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const stop = (): void => reject(reasonOf(signal));
        if (signal.aborted) {
            stop();
            return;
        }
        signal.addEventListener('abort', stop, { once: true });
        void turn.then(() => {
            signal.removeEventListener('abort', stop);
            resolve();
        });
    });
}

/** A source's lane: the tail of its queue and the start of its latest request. */
type Lane = { tail: Promise<void>; started: number };

export class LiteratureDesk {
    private readonly lanes = new Map<string, Lane>();
    private readonly answers = new Map<string, { at: number; answer: SourceHits }>();
    private readonly clock: Clock;

    constructor(clock: Clock = SYSTEM) {
        this.clock = clock;
    }

    /**
     * Run `task` as the next request of `source`'s lane: after the request before it ended, and at
     * least `gapMs` after that one started. A signal that aborts while it waits, for the request
     * before it or for the gap, ends the wait at once with the signal's reason. The lane goes on in
     * order: the requests after an aborted one still wait for the request that is in flight.
     */
    async run<T>(
        source: string,
        gapMs: number,
        signal: AbortSignal,
        task: () => Promise<T>
    ): Promise<T> {
        const lane = this.lanes.get(source) ?? { tail: Promise.resolve(), started: -Infinity };
        this.lanes.set(source, lane);
        const turn = lane.tail;
        let release = (): void => undefined;
        lane.tail = new Promise<void>((resolve) => {
            release = resolve;
        });
        let owned = false;
        try {
            await turnOrAbort(turn, signal);
            owned = true;
            // A timer can fire a millisecond before the clock reads the wait as over, so the wait
            // is measured again until the clock agrees.
            for (let wait = lane.started + gapMs - this.clock.now(); wait > 0;) {
                await this.clock.sleep(wait, signal);
                wait = lane.started + gapMs - this.clock.now();
            }
            signal.throwIfAborted();
            // The task runs to its first wait before the start is read, so the request it sends
            // has left by the time the next one is measured from it.
            const running = task();
            lane.started = this.clock.now();
            return await running;
        } finally {
            if (owned) release();
            else void turn.then(release);
        }
    }

    /** The answer kept under `key`, or undefined when none is kept or it is over `minutes` old. */
    kept(key: string, minutes: number): SourceHits | undefined {
        const held = this.answers.get(key);
        if (held === undefined) return undefined;
        if (this.clock.now() - held.at > minutes * 60_000) {
            this.answers.delete(key);
            return undefined;
        }
        return held.answer;
    }

    /** Keep an answer under `key`; with 0 minutes nothing is kept. */
    keep(key: string, answer: SourceHits, minutes: number): void {
        if (minutes <= 0) return;
        this.answers.delete(key);
        this.answers.set(key, { at: this.clock.now(), answer });
        while (this.answers.size > CACHE_MAX) {
            const oldest = this.answers.keys().next();
            if (oldest.done) break;
            this.answers.delete(oldest.value);
        }
    }

    /** How many answers are kept. */
    get size(): number {
        return this.answers.size;
    }
}
