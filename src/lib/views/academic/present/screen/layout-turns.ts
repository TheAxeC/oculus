// Layer 3, Present partial. The queue that gives the Overview's tiles their turns. Mounting a
// tile's slide and laying it out each measure the page synchronously, and a deck of a hundred
// tiles doing that in one task holds the page for minutes, so each of them is a job on this queue,
// which runs a time budget's worth of jobs per animation frame and yields between frames. A queue
// is made from its inputs (the frame source, the clock and the time budget) and holds its own
// state, so each Overview has one of its own and a run of the queue can be stepped by hand.
//
// Jobs run in the order they were asked. A job already waiting is not queued twice and keeps its
// place, so an image that loads late does not push its tile behind the others; a job asked again
// once its turn has come goes to the back. At least one job runs per frame, so a slow job cannot
// stall the queue. A job that throws is reported on the console and the rest run. While the tab is
// hidden the page's frames stop and the jobs wait in the queue until it is shown again. A job
// dropped before its turn runs nothing, and a queue left with no job holds no frame.

import { getContext, setContext } from 'svelte';

/** One piece of a tile's work. */
type Job = () => void;

/** What a queue takes from the page. */
type Inputs = {
    /** Ask for a function to run at the next frame, and cancel that by the handle it gave. */
    frames: { request: (run: () => void) => number; cancel: (handle: number) => void };
    /** The time now, in milliseconds. */
    now: () => number;
    /** How long the jobs of one frame may take, in milliseconds. */
    budget: number;
};

/** A queue of tile work, which the Overview makes and its tiles and their slides ask. */
export type LayoutTurns = {
    /** Give a job its turn, unless it is already waiting for one. */
    ask: (job: Job) => void;
    /** Take a job out of the queue: it does not run, and it leaves nothing waiting. */
    drop: (job: Job) => void;
};

/** Make a queue that runs its jobs a budget's worth per frame. */
export function createLayoutTurns({ frames, now, budget }: Inputs): LayoutTurns {
    /** The jobs waiting, in the order they were asked; a Set holds a job once, in its place. */
    const waiting = new Set<Job>();
    /** The handle of the frame requested, null for none. */
    let frame: number | null = null;
    /** Whether a frame's jobs are running, whose end asks for the next frame itself. */
    let running = false;

    function schedule(): void {
        if (frame === null && !running && waiting.size > 0) frame = frames.request(run);
    }

    function run(): void {
        frame = null;
        running = true;
        const started = now();
        // A job asked while this runs joins the Set's end and this loop reaches it.
        for (const job of waiting) {
            waiting.delete(job);
            try {
                job();
            } catch (error) {
                console.error(error);
            }
            if (now() - started >= budget) break;
        }
        running = false;
        schedule();
    }

    return {
        ask(job) {
            waiting.add(job);
            schedule();
        },
        drop(job) {
            waiting.delete(job);
            if (waiting.size > 0 || frame === null) return;
            frames.cancel(frame);
            frame = null;
        }
    };
}

/** The context key of the queue of an Overview. */
const TURNS = Symbol('layout-turns');

/** Hand an Overview's queue to the tiles drawn inside it, those of its groups included. */
export function provideLayoutTurns(turns: LayoutTurns): void {
    setContext(TURNS, turns);
}

/** The queue of the Overview a tile is drawn in; a tile is only ever drawn inside an Overview. */
export function layoutTurns(): LayoutTurns {
    return getContext<LayoutTurns>(TURNS);
}
