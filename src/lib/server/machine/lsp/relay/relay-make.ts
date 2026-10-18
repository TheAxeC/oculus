// Layer 2, server. The making of a held server for the relay: the state of a new relay with the
// host a held server calls back into, the config folder and the environment of a root an adapter
// reads, the preparation of an entry's launch for a root, the `initialize` request a server is
// given from the capabilities its page sent, and the held server itself.

import { configDir } from '../../../../data/sources/config/folder.ts';
import type { LspRpc } from '../../../../data/model/index.ts';
import { Held, type Page } from '../held/held.ts';
import { spawnChild } from '../held/process.ts';
import {
    createServers,
    initializeParams,
    type Prepared,
    type RootEnv,
    type ServerEntry,
    type Setup
} from '../servers.ts';
import type { ServedRoot } from '../uris.ts';
import { AppEntries, appSpawn } from './relay-apps.ts';
import { appendedOutput, channelsOf, publishState, rootsOf } from './relay-pages.ts';
import type { RelayOptions } from './relay-options.ts';
import type { RelayState } from './relay-state.ts';

/** What the held servers call back into, made by the relay from its other modules. */
export type ServerCalls = {
    message(state: RelayState, held: Held, message: LspRpc): void;
    ready(state: RelayState, held: Held): void;
    stopped(state: RelayState, held: Held): void;
    gone(state: RelayState, held: Held): void;
    schemasChanged(state: RelayState): void;
};

/** What an adapter knows of the machine and of the root a server is made for. */
export function envOf(state: RelayState, root: ServedRoot): RootEnv {
    return {
        root: root.real,
        lsp: state.options.lspFolder(),
        approvals: state.options.approvals(),
        env: state.options.env ?? process.env,
        run: state.options.run,
        exists: state.options.exists
    };
}

/** An entry's launch for the root of a held server, or why it cannot be had. */
async function prepare(state: RelayState, held: Held): Promise<Prepared> {
    return await held.entry.adapter.prepare(held.entry, envOf(state, held.root));
}

/** The state of a new relay, with the host its held servers call back into. */
export function createState(options: RelayOptions, calls: ServerCalls): RelayState {
    const servers =
        options.servers ??
        createServers({
            oculus: options.oculus,
            node: options.node,
            latex: options.latex,
            markdown: options.markdown
        });
    const state: RelayState = {
        options,
        servers,
        apps:
            options.appServers === undefined
                ? undefined
                : new AppEntries(options.appServers, configDir(options.oculus)),
        appFeed: options.appServers,
        spawn: appSpawn(() => state, options.spawn ?? spawnChild),
        now: options.now ?? Date.now,
        pages: new Map(),
        helds: new Set(),
        orphans: new Set(),
        ending: new WeakSet(),
        pending: new Map(),
        asks: new Map(),
        next: 0,
        served: null,
        host: undefined as never,
        library: { roots: () => rootsOf(state), rules: options.library },
        canWrite: () => false,
        holding: new Map(),
        unsubscribe: undefined
    };
    const feed = options.schemas;
    state.host = {
        spawn: state.spawn,
        roots: () => rootsOf(state),
        initialize: (held, setup) => initializeFor(state, held, setup),
        prepare: (held) => prepare(state, held),
        changed: (held) => publishState(state, held),
        appended: (held, lines) => appendedOutput(state, held, lines),
        message: (held, message) => calls.message(state, held, message),
        watchFolder: options.watchFolder,
        schemas: feed === undefined ? undefined : () => feed.current(),
        ready: (held) => calls.ready(state, held),
        stopped: (held) => calls.stopped(state, held),
        gone: (held) => calls.gone(state, held)
    };
    state.unsubscribe = feed?.subscribe(() => calls.schemasChanged(state));
    return state;
}

/** The `initialize` request a server is given: the page's capabilities with what it needs. */
function initializeFor(state: RelayState, held: Held, setup: Setup): Record<string, unknown> {
    const page = held.owner as Page | null;
    const caps =
        (page === null ? [] : [...page.sessions])
            .filter(([channel]) => page !== null && channelsOf(page, held.entry).includes(channel))
            .map(([, session]) => session.capabilities)
            .find((one) => Object.keys(one).length > 0) ?? {};
    return initializeParams(held.entry, held.root.real, caps, setup);
}

/** A held server of an entry over a root, kept by its page under `key`. */
export function makeHeld(
    state: RelayState,
    page: Page,
    entry: ServerEntry,
    root: ServedRoot,
    key: string
): Held {
    const held = new Held(entry, root, page, state.host, state.now);
    page.helds.set(key, held);
    state.helds.add(held);
    return held;
}
