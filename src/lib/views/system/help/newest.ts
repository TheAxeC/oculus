// Layer 3, view helper. The answer of the newest question a component asked, and no other.
//
// Diagram.svelte fetches its drawing when its name is set and again when the name changes, and the
// view can close while a fetch is out. Stopping a question aborts the work behind it through the
// signal it was handed, so a fetch no one waits for any more is cancelled rather than read to its
// end, and an answer that lands anyway, from work that took no notice of the signal, is dropped
// here: a slow answer for an earlier name never overwrites the drawing of the name shown now. It is
// a module of its own so the rule is proven by a unit case without a browser; the component hands
// each question's stop to its effect's cleanup.

/**
 * Ask one question: `work` is started with the signal its stop aborts, and the function returned
 * is that stop, which also keeps its answer from being taken.
 */
export type Ask<T> = (work: (signal: AbortSignal) => Promise<T>) => () => void;

/** A way of asking whose answers reach `take` only while their question is the current one. */
export function newestAnswer<T>(take: (answer: T) => void): Ask<T> {
    return (work) => {
        const stop = new AbortController();
        void work(stop.signal).then((answer) => {
            if (!stop.signal.aborted) take(answer);
        });
        return () => {
            stop.abort();
        };
    };
}
