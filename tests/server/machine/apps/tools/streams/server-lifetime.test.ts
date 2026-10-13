// Layer 4, server test. How long a language server an app registered lives. It is a server of the
// relay like oculus's own: `initialize` is given 30 s to answer, it ends 60 s after the last tab
// of its root and language closed or the page closed, at once when its root stops being served and
// when the app stops acting, and with the oculus server; none is started twice for one page and
// root. These are the app-server rows of G36.
//
// The relay runs on vitest's fake clock. The host is a feed this file writes, and the stream it
// opens for a server is a script in this process that answers `initialize` and `shutdown`, or
// stays silent, so no process runs. What this does NOT cover: the stream over a real host
// (languages.test.ts) and oculus's own servers (tests/server/machine/lsp/lifetime.test.ts).

import { describe, expect } from 'vitest';
import type { Relay } from '../../../../../../src/lib/server/machine/lsp/relay/relay.ts';
import type { AppServerInfo } from '../../../../../../src/lib/server/machine/lsp/adapters/entry.ts';
import type { AppServersFeed } from '../../../../../../src/lib/server/machine/lsp/relay/relay-apps.ts';
import { it } from '../../../../../fixtures/scratch.ts';
import {
    advance,
    close,
    makeRelay,
    open,
    pageFile,
    plantRoot,
    recordingSink,
    relaysMade,
    settle,
    states,
    stubSpawn
} from '../../../lsp/lsp-fixture.ts';

/** What the relay reads of the stream a host opens for a server. */
type AppStreamLike = Awaited<ReturnType<AppServersFeed['open']>>;

const CHANNEL = 'lsp:notes';
const MINUTE = 60_000;

/** The stream a host opens for a server: it answers `initialize` unless told to stay silent. */
class Scripted implements AppStreamLike {
    closed = false;
    readonly received: string[] = [];
    readonly #messages: ((message: Record<string, unknown>) => void | Promise<void>)[] = [];
    readonly #controls: ((body: { end?: boolean; code?: number | null }) => void)[] = [];
    readonly #closes: (() => void)[] = [];
    readonly #silent: boolean;

    constructor(silent: boolean) {
        this.#silent = silent;
    }

    sendMessage(message: unknown): void {
        const sent = message as { id?: number; method?: string };
        this.received.push(sent.method ?? 'response');
        if (sent.method === 'initialize' && !this.#silent) {
            this.#say({ jsonrpc: '2.0', id: sent.id, result: { capabilities: {} } });
        } else if (sent.method === 'shutdown') {
            this.#say({ jsonrpc: '2.0', id: sent.id, result: null });
        } else if (sent.method === 'exit') {
            for (const listener of this.#controls) listener({ end: true, code: 0 });
            this.close();
        }
    }

    onMessage(listener: (message: Record<string, unknown>) => void | Promise<void>): void {
        this.#messages.push(listener);
    }

    onStderr(): void {
        // The scripted server writes no standard error.
    }

    onControl(listener: (body: { end?: boolean; code?: number | null }) => void): void {
        this.#controls.push(listener);
    }

    onClose(listener: () => void): void {
        this.#closes.push(listener);
    }

    backpressure(): void {
        // The scripted server holds nothing back.
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        for (const listener of this.#closes) listener();
    }

    #say(message: Record<string, unknown>): void {
        for (const listener of this.#messages) void listener(message);
    }
}

const INFO: AppServerInfo = {
    app: 'app:one',
    root: '',
    id: 's1',
    name: 'one',
    selector: [{ language: 'notes', pattern: '' }],
    sections: [],
    initializationOptions: null
};

type World = {
    relay: Relay;
    streams: Scripted[];
    page: ReturnType<typeof recordingSink>;
    served: { key: string; dir: string }[];
    /** The servers the host has registered; empty when the app stops acting. */
    registered: AppServerInfo[];
    changed: () => void;
};

/** A relay over a feed of one registered server whose stream is silent when `silent` is set. */
function world(silent = false): World {
    const dir = plantRoot(['a.note', 'b.note']);
    const served = [{ key: 'repo', dir }];
    const streams: Scripted[] = [];
    const registered = [INFO];
    const listeners = new Set<() => void>();
    const feed: AppServersFeed = {
        servers: () => registered,
        open: () => {
            const stream = new Scripted(silent);
            streams.push(stream);
            return Promise.resolve(stream);
        },
        configuration: () => null,
        languages: () => new Map(),
        onChange: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        collections: () => [],
        onDiagnostics: () => () => undefined
    };
    const relay = makeRelay({ roots: () => served, spawn: stubSpawn().spawn, appServers: feed });
    const changed = (): void => {
        for (const listener of [...listeners]) listener();
    };
    return { relay, streams, page: recordingSink(), served, registered, changed };
}

const made = relaysMade();

/** A world with `a.note` open on its page, the server's stream open. */
async function opened(silent = false): Promise<World> {
    const w = world(silent);
    made.push(w.relay);
    open(w.relay, w.page.sink, CHANNEL, pageFile('repo', 'a.note'), 'notes');
    await settle();
    return w;
}

describe('the server of an app that does not answer initialize', () => {
    it('is waited for 30 s, not 29.999 s, and then ended with the page told no_answer', async () => {
        const { streams, page } = await opened(true);
        await advance(29_999);
        const early = [streams[0].closed, states(page).at(-1)];
        await advance(1);
        expect([early, streams[0].closed, states(page).at(-1)]).toEqual([
            [false, 'starting'],
            true,
            'failed:no_answer'
        ]);
    });
});

describe('the server of an app that answers', () => {
    it('ends 60 s after the last tab of its root and language closed, and not at 59.999 s', async () => {
        const { relay, streams, page } = await opened();
        close(relay, page.sink, CHANNEL, pageFile('repo', 'a.note'));
        await advance(MINUTE - 1);
        const early = streams[0].closed;
        await advance(1);
        expect([streams.length, early, streams[0].closed]).toEqual([1, false, true]);
    });

    it('is kept by a tab reopened at 30 s, and not ended while another tab of its root stays open', async () => {
        const { relay, streams, page } = await opened();
        open(relay, page.sink, CHANNEL, pageFile('repo', 'b.note'), 'notes');
        close(relay, page.sink, CHANNEL, pageFile('repo', 'a.note'));
        await advance(MINUTE * 2);
        const second = [streams.length, streams[0].closed];
        close(relay, page.sink, CHANNEL, pageFile('repo', 'b.note'));
        await advance(30_000);
        open(relay, page.sink, CHANNEL, pageFile('repo', 'a.note'), 'notes');
        await advance(MINUTE * 3);
        expect([second, streams.length, streams[0].closed]).toEqual([[1, false], 1, false]);
    });

    it('ends 60 s after the page closed, and is started again by a tab opened at 70 s', async () => {
        const w = await opened();
        w.relay.remove(w.page.sink);
        await advance(MINUTE - 1);
        const early = w.streams[0].closed;
        await advance(11_000);
        const again = recordingSink();
        open(w.relay, again.sink, CHANNEL, pageFile('repo', 'a.note'), 'notes');
        await advance(0);
        expect([early, w.streams[0].closed, w.streams.length, w.streams[1].closed]).toEqual([
            false,
            true,
            2,
            false
        ]);
    });

    it('is started once for the tabs of one page and root, and once for each page', async () => {
        const w = await opened();
        open(w.relay, w.page.sink, CHANNEL, pageFile('repo', 'b.note'), 'notes');
        open(w.relay, w.page.sink, CHANNEL, pageFile('repo', 'a.note'), 'notes');
        await advance(MINUTE);
        const onePage = w.streams.length;
        const second = recordingSink();
        open(w.relay, second.sink, CHANNEL, pageFile('repo', 'a.note'), 'notes');
        await advance(0);
        expect([onePage, w.streams.length]).toEqual([1, 2]);
    });

    it('ends at once when its root stops being served, and the page is told root_gone', async () => {
        const w = await opened();
        w.served.splice(0);
        w.relay.reconcile();
        await settle();
        expect([w.streams[0].closed, states(w.page).at(-1)]).toEqual([true, 'failed:root_gone']);
    });

    it('ends at once when the app stops acting and registers no server, and with the oculus server', async () => {
        const gone = await opened();
        gone.registered.splice(0);
        gone.changed();
        await settle();
        const withApp = gone.streams[0].closed;
        const w = await opened();
        const closing = w.relay.close();
        await settle();
        await closing;
        expect([withApp, w.streams[0].closed]).toEqual([true, true]);
    });
});
