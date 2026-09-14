// Layer 2, client state. The minute the page is in, as one rune.
//
// A board that counts days reads a moment. Reading it once when the view opens is what leaves a
// page open across midnight counting yesterday, so the moment is state and every countdown derived
// from it moves with it. One minute is the finest a day countdown can need and the coarsest a
// reader will not notice.
//
// The interval is started by the views that read it rather than by importing this module, so a
// server render starts no timer and a test drives it with its own clock.

/** How often the held moment moves. */
const MINUTE = 60000;

const held: { now: number } = $state({ now: Date.now() });

/** How many readers are running the clock; the interval lives while at least one is. */
let readers = 0;
let timer: ReturnType<typeof setInterval> | null = null;

/** The moment the page is in, to the minute. Reading it in a $derived redraws that caller. */
export function minuteNow(): number {
    return held.now;
}

/** Run the clock while a view is mounted; the returned call stops it when the last reader goes. */
export function startMinuteClock(): () => void {
    readers += 1;
    if (timer === null) {
        held.now = Date.now();
        timer = setInterval(() => (held.now = Date.now()), MINUTE);
    }
    return () => {
        readers -= 1;
        if (readers > 0 || timer === null) return;
        clearInterval(timer);
        timer = null;
    };
}
