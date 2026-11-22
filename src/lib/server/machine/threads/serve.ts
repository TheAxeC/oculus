// Layer 2, server. The worker's end of a held worker (held.ts): each request of the port is handed
// to the worker's one piece of work, and what it gives, or why it failed, goes back under the
// request's number. The word to end aborts the signal the work was handed, for one that yields, and
// closes the port, after which the thread ends by itself once the work that runs has ended.

import { parentPort } from 'node:worker_threads';
import type { FromWorker, ToWorker } from './held.ts';

/**
 * Answer every request with what `work` gives for it. What a request asks is what the owner's
 * `request` makes, which no check here can know, so it is handed on as it came.
 */
export function serve(work: (ask: never, ended: AbortSignal) => unknown): void {
    const port = parentPort;
    if (port === null) return;
    const ending = new AbortController();

    const answer = async (id: number, ask: never): Promise<FromWorker<unknown>> => {
        try {
            return { id, answer: await work(ask, ending.signal) };
        } catch (error) {
            return { id, error: error instanceof Error ? error.message : String(error) };
        }
    };

    port.on('message', (message: ToWorker<never>) => {
        if ('end' in message) {
            ending.abort();
            port.close();
            return;
        }
        void answer(message.id, message.ask).then((answered) => port.postMessage(answered));
    });
}
