// Layer 2, client state. The page's end of the bridge to one app's frame, on penpal.
//
// The messenger is the window the page holds: `frame.contentWindow`. Penpal accepts a message only
// from that window (its source check), so a second frame, another tab or the page's own window
// cannot reach the methods however it spells its message. A sandboxed frame has the opaque origin
// `null`, so the origin list is `*`; the source check is what holds the connection to this frame.
//
// The frame is told of changes with at most one call in flight per channel: a payload that arrives
// while a call is out replaces the one queued behind it, so a slow app is told the newest state
// once and never a backlog. `destroy` ends the connection; a call that settles afterwards replies
// nothing, since the messenger is gone.

import { WindowMessenger, connect } from 'penpal';
import type { Message } from '../../../data/model/index.ts';
import type { Methods, Theme } from './methods.ts';

/** What the page calls in the frame. */
type Remote = {
    onChannel: (channel: string, version: number, payload: unknown) => unknown;
    onTheme: (theme: Theme) => unknown;
    onStore: (value: unknown) => unknown;
};

export type FrameLink = {
    /** Tell the frame a channel changed. */
    deliver: (message: Message) => void;
    /** Tell the frame the theme changed. */
    theme: (theme: Theme) => void;
    /** Tell the frame its store holds this value now. */
    store: (value: unknown) => void;
    /** End the connection. */
    destroy: () => void;
};

export type FrameOptions = {
    frame: HTMLIFrameElement;
    methods: Methods;
    /** Seconds the handshake may take before `failed` is called. */
    timeoutS: number;
    /** The handshake did not complete in time. */
    failed: () => void;
    /** The handshake completed. */
    connected: () => void;
};

/** A link call that does nothing. */
function noop(): void {
    return undefined;
}

/** Connect the page's methods to the frame and return what the page calls in it. */
export function connectFrame(options: FrameOptions): FrameLink {
    const { frame, methods } = options;
    let remote: Remote | null = null;
    let destroyed = false;
    const inflight = new Set<string>();
    const queued = new Map<string, Message>();

    const target = frame.contentWindow;
    if (target === null) {
        // A frame outside the document has no window to talk to; it is drawn as failed to load.
        options.failed();
        return { deliver: noop, theme: noop, store: noop, destroy: noop };
    }
    const messenger = new WindowMessenger({
        remoteWindow: target,
        allowedOrigins: ['*']
    });
    const connection = connect<Remote>({
        messenger,
        methods,
        timeout: options.timeoutS * 1000
    });
    connection.promise.then(
        (proxy) => {
            if (destroyed) return;
            remote = proxy;
            options.connected();
        },
        () => {
            if (!destroyed) options.failed();
        }
    );

    function call(channel: string, message: Message): void {
        if (remote === null || destroyed) return;
        inflight.add(channel);
        const done = (): void => {
            inflight.delete(channel);
            const next = queued.get(channel);
            queued.delete(channel);
            if (next !== undefined && !destroyed) call(channel, next);
        };
        Promise.resolve(remote.onChannel(channel, message.version, message.payload)).then(
            done,
            done
        );
    }

    return {
        deliver(message: Message): void {
            if (remote === null || destroyed) return;
            if (inflight.has(message.channel)) {
                queued.set(message.channel, message);
                return;
            }
            call(message.channel, message);
        },
        theme(theme: Theme): void {
            if (remote === null || destroyed) return;
            Promise.resolve(remote.onTheme(theme)).catch(() => undefined);
        },
        store(value: unknown): void {
            if (remote === null || destroyed) return;
            Promise.resolve(remote.onStore(value)).catch(() => undefined);
        },
        destroy(): void {
            destroyed = true;
            queued.clear();
            connection.destroy();
        }
    };
}
