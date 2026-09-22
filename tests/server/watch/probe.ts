// Layer 4, test helper. What a case over a watcher needs of the channel bus and of the clock: a
// sink that records what was published, and the two waits a real file event is watched for.
//
// A watcher case waits on the operating system rather than on a promise of its own, so it polls:
// the wait is how long a failure takes and not how long a pass takes.

import type { Message } from '../../../src/lib/data/model.ts';
import type { Sink } from '../../../src/lib/server/core/channels.ts';
import { noop } from '../../fixtures/doubles.ts';

/** A subscriber that keeps every message it is sent, in the order the hub sent them. */
export function recording(): { sink: Sink; got: Message[] } {
    const got: Message[] = [];
    return {
        got,
        sink: {
            send: (text: string) => {
                got.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
}

export function sleep(ms: number): Promise<void> {
    return new Promise((done) => setTimeout(done, ms));
}

/** Wait until the condition holds, or until the time is up and the assertion after it fails. */
export async function until(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(20);
}
