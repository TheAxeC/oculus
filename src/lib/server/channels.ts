// Layer 2, server. The channel protocol with no socket in it: what has been published, who is
// subscribed, and which message each subscriber is owed. Keeping the socket out is what lets the
// backpressure rule be tested by resolving a promise by hand rather than by stalling a real TCP
// connection.
//
// The rule DESIGN.md names is latest only: if a page falls behind, the server keeps only the newest
// payload per channel for it. A sink whose previous send has not completed therefore gets nothing
// queued; the message is held as that channel's pending message, overwriting whatever was pending
// for the same channel, and goes out when the send completes. A slow page sees the newest state and
// never a backlog.

import type { Message } from '../data/model.ts';

/** A client, as this module needs it: something a text can be sent to and that can be closed. */
export type Sink = {
    /** Resolves when the text has been written out, which is the backpressure signal. */
    send(text: string): Promise<void>;
    close(): void;
};

type Subscriber = {
    channels: Set<string>;
    /** True while a send is in flight. */
    sending: boolean;
    /** The newest unsent message per channel, at most one entry per channel. */
    pending: Map<string, Message>;
};

export class Hub {
    /** The current message of every channel that has one. */
    #latest = new Map<string, Message>();
    #subscribers = new Map<Sink, Subscriber>();

    /** The channel's version: 0 before anything is published on it. */
    version(channel: string): number {
        return this.#latest.get(channel)?.version ?? 0;
    }

    /**
     * The version the next publish on this channel will carry. A payload that holds its own version
     * (the snapshot does) is built with this, so the two cannot disagree.
     */
    nextVersion(channel: string): number {
        return this.version(channel) + 1;
    }

    /** The current message of a channel, for a caller that needs it without subscribing. */
    latest(channel: string): Message | undefined {
        return this.#latest.get(channel);
    }

    /** How many sinks are subscribed; the socket layer has no register of its own. */
    get size(): number {
        return this.#subscribers.size;
    }

    /**
     * Add channels to a sink's subscription and send it the current message of each named channel
     * that has one. A sink that subscribes twice keeps the channels of both calls.
     */
    subscribe(sink: Sink, channels: string[]): void {
        let subscriber = this.#subscribers.get(sink);
        if (subscriber === undefined) {
            subscriber = { channels: new Set(), sending: false, pending: new Map() };
            this.#subscribers.set(sink, subscriber);
        }
        for (const channel of channels) subscriber.channels.add(channel);
        for (const channel of channels) {
            const message = this.#latest.get(channel);
            if (message !== undefined) this.#deliver(sink, subscriber, message);
        }
    }

    /** Store a payload as the channel's current message and send it to that channel's subscribers. */
    publish(channel: string, payload: unknown): number {
        const message: Message = { channel, version: this.nextVersion(channel), payload };
        this.#latest.set(channel, message);
        for (const [sink, subscriber] of this.#subscribers) {
            if (subscriber.channels.has(channel)) this.#deliver(sink, subscriber, message);
        }
        return message.version;
    }

    /** Forget a sink. Called when its socket closes; a send in flight for it is then dropped. */
    remove(sink: Sink): void {
        this.#subscribers.delete(sink);
    }

    #deliver(sink: Sink, subscriber: Subscriber, message: Message): void {
        if (subscriber.sending) {
            subscriber.pending.set(message.channel, message);
            return;
        }
        subscriber.sending = true;
        void this.#drain(sink, subscriber, message);
    }

    /** Send one message, then whatever piled up while it was in flight, newest per channel. */
    async #drain(sink: Sink, subscriber: Subscriber, first: Message): Promise<void> {
        let message: Message | undefined = first;
        while (message !== undefined) {
            try {
                await sink.send(JSON.stringify(message));
            } catch (error) {
                // The connection is broken; the socket layer will close it. Nothing is retried,
                // since a reconnecting page subscribes again and gets the current message then.
                const reason = error instanceof Error ? error.message : String(error);
                console.error(`socket: send on channel ${message.channel} failed: ${reason}`);
                subscriber.pending.clear();
                subscriber.sending = false;
                this.remove(sink);
                return;
            }
            // The sink may have been removed while the send was in flight.
            if (this.#subscribers.get(sink) !== subscriber) {
                subscriber.pending.clear();
                subscriber.sending = false;
                return;
            }
            const next = subscriber.pending.keys().next();
            if (next.done === true) {
                message = undefined;
            } else {
                message = subscriber.pending.get(next.value);
                subscriber.pending.delete(next.value);
            }
        }
        subscriber.sending = false;
    }
}
