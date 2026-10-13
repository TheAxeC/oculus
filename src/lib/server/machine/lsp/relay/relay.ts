// Layer 2, server. The language server relay: the page talks LSP over its one socket on the channel
// `lsp:<language>`, and this holds the servers behind those channels. It is what
// server/root/socket.ts hands every frame of an `lsp:` channel to, and it is made once per server
// context. The class is the relay's public face; the work is in the modules beside it, each over
// the one `RelayState` (relay-state.ts):
//
// - relay-pages.ts: the page sessions, the frames sent to a page, the mapper that turns a server's
//   addresses into the page's, and what a closed socket leaves behind.
// - relay-route.ts: the routing of a page's messages to the server that holds the document they
//   name, and the answers the relay and the entries give themselves.
// - relay-make.ts: the state of a new relay, the preparation of a server for a root and the held
//   server itself.
// - relay-server.ts: the messages a server sends, answered here or forwarded to the page.
// - relay-life.ts: a root no longer served, a changed `lsp` folder, changed settings, and a server
//   that stopped or is gone.
//
// A frame is read only from a socket whose subscription carried the write token, and every frame
// goes to the one socket it is for, in order, never merged. Ids are remapped, so a page's ids and
// each server's own never meet.

import {
    appsChanged,
    reconcile,
    reload,
    schemasChanged,
    settingsChanged,
    stopped,
    gone
} from './relay-life.ts';
import { createState } from './relay-make.ts';
import { removePage } from './relay-pages.ts';
import { inbound } from './relay-route.ts';
import { collectionHeard, fromServer, ready } from './relay-server.ts';
import type { RelayOptions } from './relay-options.ts';
import type { RelayState } from './relay-state.ts';
import type { Sink } from '../../../core/channels.ts';

/** The language server relay of one server context. */
export class Relay {
    readonly #state: RelayState;
    readonly #offApps: ((() => void) | undefined)[];

    constructor(options: RelayOptions) {
        this.#state = createState(options, {
            message: fromServer,
            ready,
            stopped,
            gone,
            schemasChanged
        });
        const feed = options.appServers;
        this.#offApps = [
            feed?.onChange(() => appsChanged(this.#state)),
            feed?.onDiagnostics((heard) => collectionHeard(this.#state, heard))
        ];
    }

    /**
     * The shipped settings changed: a running server that follows a section of them, and would now
     * be answered differently, is told its settings changed and asks again.
     */
    settingsChanged(): void {
        settingsChanged(this.#state);
    }

    /**
     * The socket's answer to whether a sink carried the write token, asked at each message. Until
     * the socket gives it, no sink may write.
     */
    gate(canWrite: (sink: Sink) => boolean): void {
        this.#state.canWrite = canWrite;
    }

    /**
     * One text from a socket. Answers whether it was a frame of an `lsp:` channel, which the
     * terminals then leave alone; a frame from a socket that did not carry the token is read and
     * dropped.
     */
    inbound(sink: Sink, data: string): boolean {
        return inbound(this.#state, sink, data);
    }

    /** A socket closed: its servers wait 60 s for another page to take them over. */
    remove(sink: Sink): void {
        removePage(this.#state, sink);
    }

    /** The served roots changed: the server of a root no longer served ends. */
    reconcile(): void {
        reconcile(this.#state);
    }

    /** A changed `lsp` folder ends every server; one a page has documents open in starts again. */
    reload(): void {
        reload(this.#state);
    }

    /** End every server and wait for them to be gone. */
    async close(): Promise<void> {
        this.#state.unsubscribe?.();
        for (const off of this.#offApps) off?.();
        await Promise.all([...this.#state.helds].map((held) => held.close()));
        this.#state.pages.clear();
    }

    /** The processes of the servers that are running, for a caller that counts them. */
    pids(): number[] {
        return [...this.#state.helds].flatMap((held) => (held.pid === undefined ? [] : [held.pid]));
    }
}

/** Make the relay of one server context. */
export function createRelay(options: RelayOptions): Relay {
    return new Relay(options);
}
