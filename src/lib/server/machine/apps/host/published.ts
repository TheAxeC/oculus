// Layer 2, server. The last payload one registry published to a channel, so a change that leaves
// the payload as it was is not sent again.

import type { Hub } from '../../../core/channels.ts';

/** A channel's payload as the registry last sent it. */
export class Published {
    #last = '';
    readonly #hub: Hub;
    readonly #channel: string;

    constructor(hub: Hub, channel: string) {
        this.#hub = hub;
        this.#channel = channel;
    }

    /** Send the payload unless it is the one sent last. */
    send(payload: unknown): void {
        const text = JSON.stringify(payload);
        if (text === this.#last) return;
        this.#last = text;
        this.#hub.publish(this.#channel, payload);
    }
}
