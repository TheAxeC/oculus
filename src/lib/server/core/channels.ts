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
//
// That rule is right for a state channel, where the newest payload is the whole truth, and wrong
// for a byte stream, where an overwritten message is output the terminal never shows again. A
// channel may therefore name how two of its messages combine, which is what the `pty:` channels do:
// their held chunk and the next one are concatenated rather than replaced, so a page that falls
// behind sees every byte, late, rather than a hole. The `files` channel also registers a merge: its
// newest root and its bookmark-change marker are independent facts in one payload. The
// `debug-console` channel registers one too: its held append and the next append of the same
// session are joined into one, so a page that falls behind gets every console line, late.

import type { Message } from '../../data/model/index.ts';

/** How a channel's held message and its next one combine when a sink is behind. */
export type Merge = (held: Message, next: Message) => Message;

/** A client, as this module needs it: something a text can be sent to and that can be closed. */
export type Sink = {
    /** Resolves when the text has been written out, which is the backpressure signal. */
    send(text: string): Promise<void>;
    close(): void;
    /**
     * Stop reading what the client sends, and read it again: a socket's own pause, which a consumer
     * of the client's messages that cannot take more asks for. A sink with none is never held.
     */
    pause?(): void;
    resume?(): void;
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
    #merges = new Map<string, Merge>();
    /** The callbacks per channel for the change from no subscriber to one. */
    #firstListeners = new Map<string, Set<() => void>>();
    /** The version of the last message `send` made per channel, which keeps no latest message. */
    #sentVersions = new Map<string, number>();
    /**
     * The callers waiting for a channel's held-back messages to go out, with the channel each waits
     * on.
     */
    #waiters: { channel: string; resolve: () => void }[] = [];

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

    /** Whether at least one sink is subscribed to the channel. */
    hasSubscriber(channel: string): boolean {
        for (const subscriber of this.#subscribers.values()) {
            if (subscriber.channels.has(channel)) return true;
        }
        return false;
    }

    /**
     * Call a function each time the channel goes from no subscriber to one: once at that change,
     * not for a second sink and not for a repeated subscribe message of a sink that already holds
     * the channel. It runs after the first subscriber was sent the channel's current message.
     * Returns the function that takes the listener off.
     */
    onFirstSubscriber(channel: string, listener: () => void): () => void {
        const listeners = this.#firstListeners.get(channel) ?? new Set<() => void>();
        listeners.add(listener);
        this.#firstListeners.set(channel, listeners);
        return () => {
            listeners.delete(listener);
        };
    }

    /**
     * Add channels to a sink's subscription and send it the current message of each named channel
     * that has one. A sink that subscribes twice keeps the channels of both calls.
     *
     * `replay` is false for a `pty:` terminal channel: its current message is the previous chunk of
     * pane output, which the scrollback server/machine/pty/channel.ts sends already holds, so
     * replaying it would print the same bytes twice. Every other caller wants the state channel's
     * latest, which is the default.
     */
    subscribe(sink: Sink, channels: string[], replay = true): void {
        let subscriber = this.#subscribers.get(sink);
        if (subscriber === undefined) {
            subscriber = { channels: new Set(), sending: false, pending: new Map() };
            this.#subscribers.set(sink, subscriber);
        }
        const gained = [...new Set(channels)].filter((channel) => !this.hasSubscriber(channel));
        for (const channel of channels) subscriber.channels.add(channel);
        if (replay) {
            for (const channel of channels) {
                const message = this.#latest.get(channel);
                if (message !== undefined) this.#deliver(sink, subscriber, message);
            }
        }
        for (const channel of gained) this.#announceFirst(channel);
    }

    #announceFirst(channel: string): void {
        for (const listener of [...(this.#firstListeners.get(channel) ?? [])]) {
            try {
                listener();
            } catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                console.error(`socket: first subscriber of ${channel} failed: ${reason}`);
            }
        }
    }

    /**
     * Say how two messages of one channel combine for a sink that is behind. Null restores the
     * default, which is that the newer message replaces the older one.
     */
    merge(channel: string, merge: Merge | null): void {
        if (merge === null) this.#merges.delete(channel);
        else this.#merges.set(channel, merge);
    }

    /**
     * Store a payload as the channel's current message and send it to that channel's subscribers.
     */
    publish(channel: string, payload: unknown): number {
        const message: Message = { channel, version: this.nextVersion(channel), payload };
        this.#latest.set(channel, message);
        for (const [sink, subscriber] of this.#subscribers) {
            if (subscriber.channels.has(channel)) this.#deliver(sink, subscriber, message);
        }
        return message.version;
    }

    /**
     * Send a payload to the channel's subscribers once and keep nothing of it: it is an event, not
     * a state, so a page that subscribes later is not told and `latest` stays as it was. A page
     * that is behind is sent the newest event only, as with any channel.
     */
    send(channel: string, payload: unknown): number {
        const version = (this.#sentVersions.get(channel) ?? 0) + 1;
        this.#sentVersions.set(channel, version);
        const message: Message = { channel, version, payload };
        for (const [sink, subscriber] of this.#subscribers) {
            if (subscriber.channels.has(channel)) this.#deliver(sink, subscriber, message);
        }
        return version;
    }

    /**
     * Resolves when no sink subscribed to the channel is holding a message back for it, which is
     * when every page has taken what was published. A source of a byte stream waits on it before it
     * takes more, so a page that does not read holds the source and not the server's memory.
     */
    backlog(channel: string): Promise<void> {
        if (!this.#held(channel)) return Promise.resolve();
        return new Promise((resolve) => this.#waiters.push({ channel, resolve }));
    }

    #held(channel: string): boolean {
        for (const subscriber of this.#subscribers.values()) {
            if (subscriber.channels.has(channel) && subscriber.pending.has(channel)) return true;
        }
        return false;
    }

    /** Release the callers whose channel has no held-back message any more. */
    #released(): void {
        if (this.#waiters.length === 0) return;
        const waiting = this.#waiters;
        this.#waiters = [];
        for (const wait of waiting) {
            if (this.#held(wait.channel)) this.#waiters.push(wait);
            else wait.resolve();
        }
    }

    /** Forget a sink. Called when its socket closes; a send in flight for it is then dropped. */
    remove(sink: Sink): void {
        this.#subscribers.delete(sink);
        this.#released();
    }

    /**
     * Take channels off one sink's subscription, with whatever message was held back for it on
     * them. A sink that holds none of them is left as it is.
     */
    unsubscribe(sink: Sink, channels: string[]): void {
        const subscriber = this.#subscribers.get(sink);
        if (subscriber === undefined) return;
        for (const channel of channels) {
            subscriber.channels.delete(channel);
            subscriber.pending.delete(channel);
        }
        this.#released();
    }

    /**
     * Forget a channel's current message, for a channel whose publisher has stopped: a sink that
     * subscribes later is handed nothing in place of a message that stopped being true.
     */
    forget(channel: string): void {
        this.#latest.delete(channel);
    }

    #deliver(sink: Sink, subscriber: Subscriber, message: Message): void {
        if (subscriber.sending) {
            const held = subscriber.pending.get(message.channel);
            const merge = this.#merges.get(message.channel);
            const next = held === undefined || merge === undefined ? message : merge(held, message);
            subscriber.pending.set(message.channel, next);
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
            this.#released();
        }
        subscriber.sending = false;
    }
}
