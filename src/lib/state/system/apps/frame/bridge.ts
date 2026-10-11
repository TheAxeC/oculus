// Layer 2, client state. The page's end of the bridge to one app's frame, on penpal.
//
// The messenger is the window the page holds: `frame.contentWindow`. Penpal accepts a message only
// from that window (its source check), so a second frame, another tab or the page's own window
// cannot reach the methods however it spells its message. A sandboxed frame has the opaque origin
// `null`, so the origin list is `*`; the source check is what holds the connection to this frame.
//
// A message from the app's host goes to the frame as `onHost(method, params)`, one call per message
// in the order the host sent them. The page also calls `onCommand(id, args)` for a command the
// frame registered, `onVisibility(visible)` for a view's frame shown or hidden, `onSettings(keys)`
// for a change of the app's settings, `onSave()` and `onRevert()` for a custom editor's document,
// and `onCancel(id)` for a progress the reader cancelled.
//
// The frame is told of changes with at most one call in flight per channel: a payload that arrives
// while a call is out replaces the one queued behind it, so a slow app is told the newest state
// once and never a backlog. `destroy` ends the connection; a call that settles afterwards replies
// nothing, since the messenger is gone.

import { WindowMessenger, connect } from 'penpal';
import type { Message } from '../../../../data/model/index.ts';
import type { Methods, Theme } from './methods.ts';

/** What the page calls in the frame. */
type Remote = {
    onChannel: (channel: string, version: number, payload: unknown) => unknown;
    onTheme: (theme: Theme) => unknown;
    onStore: (value: unknown) => unknown;
    onHost: (method: string, params: unknown) => unknown;
    onCommand: (id: string, args: unknown[]) => unknown;
    onVisibility: (visible: boolean) => unknown;
    onSettings: (keys: string[]) => unknown;
    onSave: () => unknown;
    onRevert: () => unknown;
    onCancel: (id: string) => unknown;
};

export type FrameLink = {
    /** Tell the frame a channel changed. */
    deliver: (message: Message) => void;
    /** Tell the frame the theme changed. */
    theme: (theme: Theme) => void;
    /** Tell the frame its store holds this value now. */
    store: (value: unknown) => void;
    /** Tell the frame its host sent it a message. */
    host: (method: string, params: unknown) => void;
    /** Run a command the frame registered; what its handler answered. */
    command: (id: string, args: unknown[]) => Promise<unknown>;
    /** Tell the frame its view was shown or hidden. */
    visibility: (visible: boolean) => void;
    /** Tell the frame which settings of its app changed. */
    settings: (keys: string[]) => void;
    /** Ask a custom editor's frame to save its document, or to revert it. */
    save: () => Promise<unknown>;
    revert: () => Promise<unknown>;
    /** Tell the frame the reader cancelled the progress `id`. */
    cancel: (id: string) => void;
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
        const none = (): Promise<unknown> => Promise.resolve(undefined);
        return {
            deliver: noop,
            theme: noop,
            store: noop,
            host: noop,
            command: none,
            visibility: noop,
            settings: noop,
            save: none,
            revert: none,
            cancel: noop,
            destroy: noop
        };
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
        host(method: string, params: unknown): void {
            if (remote === null || destroyed) return;
            Promise.resolve(remote.onHost(method, params)).catch(() => undefined);
        },
        command(id: string, args: unknown[]): Promise<unknown> {
            if (remote === null || destroyed) return Promise.resolve(undefined);
            return Promise.resolve(remote.onCommand(id, args));
        },
        visibility(visible: boolean): void {
            if (remote === null || destroyed) return;
            Promise.resolve(remote.onVisibility(visible)).catch(() => undefined);
        },
        settings(keys: string[]): void {
            if (remote === null || destroyed) return;
            Promise.resolve(remote.onSettings(keys)).catch(() => undefined);
        },
        save(): Promise<unknown> {
            if (remote === null || destroyed) return Promise.resolve(undefined);
            return Promise.resolve(remote.onSave());
        },
        revert(): Promise<unknown> {
            if (remote === null || destroyed) return Promise.resolve(undefined);
            return Promise.resolve(remote.onRevert());
        },
        cancel(id: string): void {
            if (remote === null || destroyed) return;
            Promise.resolve(remote.onCancel(id)).catch(() => undefined);
        },
        destroy(): void {
            destroyed = true;
            queued.clear();
            connection.destroy();
        }
    };
}
