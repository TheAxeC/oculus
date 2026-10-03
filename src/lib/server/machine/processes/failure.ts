// Layer 2, server. Why a read of the Processes view failed, as a value the read carries and the
// catalog words. The `ps` run and the read raise a ReadFailure with the cause; the watcher turns it
// into the sentence the view shows, so no sentence of oculus's own and no message of the system or
// of a library reaches the reader.

import { words } from '../../core/words.ts';

/** The causes a read fails for. */
type FailureReason = 'timeout' | 'start' | 'status' | 'output' | 'empty' | 'cancelled';

/** A failed read, with its cause and the one figure the cause's sentence names, if any. */
export class ReadFailure extends Error {
    readonly reason: FailureReason;
    readonly detail: string | number;
    /**
     * Settles when the child the failed read killed has closed, so the watcher starts no other
     * child before it; a failure with no child settles at once.
     */
    ended: Promise<void> = Promise.resolve();

    constructor(reason: FailureReason, detail: string | number = '') {
        super(`the processes could not be read: ${reason}`);
        this.reason = reason;
        this.detail = detail;
    }
}

/** The catalog's sentence for a failure; an error that is no ReadFailure gets the general one. */
export function failureLine(error: unknown, text: Record<string, string>): string {
    if (!(error instanceof ReadFailure)) return words(text, 'processes.failed_other');
    switch (error.reason) {
        case 'timeout':
            return words(text, 'processes.failed_timeout', error.detail);
        case 'start':
            return words(text, 'processes.failed_start');
        case 'status':
            return words(text, 'processes.failed_status', error.detail);
        case 'output':
            return words(text, 'processes.failed_output');
        case 'empty':
            return words(text, 'processes.failed_empty');
        case 'cancelled':
            return words(text, 'processes.failed_cancelled');
    }
}
