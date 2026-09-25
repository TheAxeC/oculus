// Layer 2, server. What a stop signal does to the process: close the server objects once, then
// exit.
//
// The Node entry owns watchers, a control-client timer and open sockets, none of which a bare
// process exit gives a chance to let go of: a tmux control client left behind keeps reading, and an
// fs watch left open holds its handle until the process is reaped. The handler therefore runs the
// same close the `close` event runs and exits when it is done.
//
// A second signal while the close is running exits at once, which is what an impatient second
// Ctrl-C means: the close is already past the point where waiting for it buys anything.

/** The part of `process` this module uses, so a test drives it without sending a real signal. */
export type SignalTarget = {
    on(signal: string, handler: () => void): void;
    exit(code: number): void;
};

/** The signals that stop the process: a terminal's Ctrl-C and a service manager's stop. */
export const SIGNALS = ['SIGINT', 'SIGTERM'];

/** The exit code of a stop that was asked for, which is not a failure. */
const ASKED = 0;

/**
 * Close on the first stop signal and exit when the close calls back; exit at once on a second one.
 * `close` is given the callback rather than a promise because the http server's own close takes
 * one.
 */
export function onShutdown(target: SignalTarget, close: (done: () => void) => void): void {
    let closing = false;
    const stop = (): void => {
        if (closing) {
            target.exit(ASKED);
            return;
        }
        closing = true;
        try {
            close(() => target.exit(ASKED));
        } catch (error) {
            console.error(`shutdown: ${error instanceof Error ? error.message : String(error)}`);
            target.exit(ASKED);
        }
    };
    for (const signal of SIGNALS) target.on(signal, stop);
}
