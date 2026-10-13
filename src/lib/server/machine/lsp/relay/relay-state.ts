// Layer 2, server. What one relay holds, in a single object that the relay's modules each read and
// change: the pages (one per socket) and, below them, the language servers there are, the requests
// of pages and of servers that wait for an answer, the served roots remembered for a second, and
// the host a held server calls back into. The modules are split by what they do with it: the page
// sessions (relay-pages.ts), the routing of a page's messages (relay-route.ts), the making of a
// held server (relay-make.ts), the messages of a server to its page (relay-server.ts) and the life
// of a held server (relay-life.ts). The state is made once per relay, so two relays share nothing.

import type { Sink } from '../../../core/channels.ts';
import type { LibraryContext } from '../library/pages.ts';
import { Library } from '../library/tokens.ts';
import type { Held, HeldHost, Page, Pending, Ask } from '../held/held.ts';
import type { Spawn } from '../held/process.ts';
import type { Servers } from '../servers.ts';
import type { ServedRoot } from '../uris.ts';
import type { AppEntries, AppServersFeed } from './relay-apps.ts';
import type { RelayOptions } from './relay-options.ts';

/** JSON-RPC error codes the relay answers with. */
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const REQUEST_CANCELLED = -32800;

/** How long the served roots are remembered between two messages. */
export const ROOTS_MS = 1000;

/** The state of one relay. */
export type RelayState = {
    options: RelayOptions;
    servers: Servers;
    /** The entries of the servers apps registered, when the apps' hosts feed any. */
    apps: AppEntries | undefined;
    appFeed: AppServersFeed | undefined;
    spawn: Spawn;
    now: () => number;
    pages: Map<Sink, Page>;
    /** Every server there is, whoever holds it. */
    helds: Set<Held>;
    /** The servers whose page closed and that wait to be taken over or to end. */
    orphans: Set<Held>;
    pending: Map<number, Pending>;
    asks: Map<string, Ask>;
    /** The last id this relay gave a request it made of a server or of a page. */
    next: number;
    served: { at: number; roots: ServedRoot[] } | null;
    /** What a held server calls back into; set once the relay has made it. */
    host: HeldHost;
    library: LibraryContext;
    /** Whether a sink carried the write token; until the socket gives it, none did. */
    canWrite: (sink: Sink) => boolean;
    /** How many streams of app servers out of credit hold each page's socket paused. */
    holding: Map<Sink, number>;
    unsubscribe: (() => void) | undefined;
};

/** A new empty page for a socket. */
export function emptyPage(sink: Sink): Page {
    return {
        sink,
        sessions: new Map(),
        helds: new Map(),
        docs: new Map(),
        opened: new Map(),
        outputs: new Map(),
        stranded: new Map(),
        library: new Library(),
        tabs: new Set(),
        joined: new Map(),
        registered: new Map()
    };
}
