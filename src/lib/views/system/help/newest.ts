// Layer 3, view helper. The answer of the newest question a component asked, and no other.
//
// Diagram.svelte fetches its drawing when its name is set and again when the name changes, and the
// view can close while a fetch is out. An answer that lands after its question was replaced, or
// after the view closed, is dropped here, so a slow answer for an earlier name never overwrites the
// drawing of the name shown now. It is a module of its own so the rule is proven by a unit case
// without a browser: the component only hands each question's stop to its effect's cleanup.

/** Ask one question; the function it returns stops that question's answer from being taken. */
export type Ask<T> = (work: Promise<T>) => () => void;

/** A way of asking whose answers reach `take` only while their question is the current one. */
export function newestAnswer<T>(take: (answer: T) => void): Ask<T> {
    return (work) => {
        let current = true;
        void work.then((answer) => {
            if (current) take(answer);
        });
        return () => {
            current = false;
        };
    };
}
