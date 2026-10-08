// Layer 2, server (the desktop host). What the app does when its standard output or error is a pipe
// whose reader has gone: a write to it fails with EPIPE, which Node raises as an `error` event of
// the stream, and with no listener Electron shows that as an uncaught exception. The app has
// nothing to say to a reader that is not there, so the write is dropped and the app goes on. Any
// other error of those streams is raised again from the listener, which is an uncaught exception as
// it is without one.

/** Whether an error is the failure of a write to a pipe nobody reads. */
function closedPipe(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'EPIPE';
}

/** The writes this guard has dropped. */
export type OutputGuard = { dropped: () => number };

/**
 * Drop the EPIPE of each stream and raise every other error as it would be raised without a
 * listener. It is called once, before the app writes a line; the default streams are the main
 * process's own.
 */
export function guardOutput(
    streams: readonly NodeJS.WritableStream[] = [process.stdout, process.stderr]
): OutputGuard {
    let count = 0;
    for (const stream of streams) {
        stream.on('error', (error: Error) => {
            if (!closedPipe(error)) throw error;
            count += 1;
        });
    }
    return { dropped: () => count };
}

/** Run a write, and drop its failure when it is a write to a pipe nobody reads. */
export function dropClosed(write: () => void): void {
    try {
        write();
    } catch (error) {
        if (!closedPipe(error)) throw error;
    }
}
