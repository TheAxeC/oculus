// Layer 2, client-state test helper. The wait a case makes for something it expects to arrive (a
// message on a socket, a request, an announcement of a cache) that fails with a message of its own
// when a defect keeps it from arriving, rather than running to the test timeout.

import { clearTimeout as clearBound, setTimeout as startBound } from 'node:timers';

/** How long a wait for something a case expects to arrive runs before it fails. */
const ARRIVAL_BOUND_MS = 1000;

/**
 * Resolves when the `wake` that `register` is handed is called. After one second it rejects with
 * what was awaited and what `arrived` says, and runs the cleanup `register` returned. The bound
 * runs on node's own timer, which fake timers leave alone.
 */
export function arrival(
    awaited: string,
    arrived: () => string,
    register: (wake: () => void) => () => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        let cleanup = (): void => undefined;
        const bound = startBound(() => {
            cleanup();
            reject(
                new Error(
                    `timed out after ${ARRIVAL_BOUND_MS} ms waiting for ${awaited}; ${arrived()}`
                )
            );
        }, ARRIVAL_BOUND_MS);
        cleanup = register(() => {
            clearBound(bound);
            resolve();
        });
    });
}
