// Layer 4, test helper. A stand-in for one server's page state, for the cases of two or more pages
// over it: the files of a state folder of the case's own, written by the server's own write
// (applyStateWrite of server/files/workspace/page-state/writes.ts) and read by its own read, and
// the `state` channel, whose message each page hears through its entities store as the socket
// hands it. Each page is a client of its own over a transport into the stand-in, as every browser
// tab and app window is a page of one server.
//
// The writes a page sends are applied as they are sent, or, once `hold` was called, kept until
// `deliver` applies them in the order a case names, which is how two saves that cross on their way
// to the server are made. A file that uses the stand-in takes `it` from scratch.ts, which sweeps
// the state folder.

import type {
    PageStateAnswer,
    PageStateRead,
    PageStateWrite
} from '../../src/lib/data/model/index.ts';
import {
    readPageState,
    readStateMap,
    writeStateMap,
    type PageStateFile
} from '../../src/lib/server/files/workspace/page-state/files.ts';
import { applyStateWrite } from '../../src/lib/server/files/workspace/page-state/writes.ts';
import { createClientState, type ClientState } from '../../src/lib/state/client/context.ts';
import type { StateTransport } from '../../src/lib/state/shared/stores/page-state.svelte.ts';
import type { TabMemory } from '../../src/lib/state/workbench/layout/index.ts';
import { scratchDir } from './scratch.ts';

/** One write sent and not yet applied, with the call that answers its page. */
type Pending = { write: PageStateWrite; answer: (answer: PageStateAnswer) => void };

export type StateServer = {
    /** The state folder the files are in. */
    folder: string;
    /**
     * A new page of the server, its page state read from the files as a page's load reads it, and
     * `memory` the browser tab's session storage, none unless the case hands its own.
     */
    page: (memory?: TabMemory) => ClientState;
    /** The page state as GET /api/state answers it. */
    read: () => PageStateRead;
    /** The top map of one file of the state folder. */
    file: (file: PageStateFile) => Record<string, unknown>;
    /** Write a workspace's entry of `layouts.json`, as saves before the case would have. */
    seed: (identity: string, held: { envelope?: unknown; unread?: unknown }) => void;
    /** Every write a page sent, in the order sent. */
    sent: () => PageStateWrite[];
    /** Keep each write sent from now on until `deliver` applies it. */
    hold: () => void;
    /**
     * Apply the writes kept, the one sent `order[0]`-th first, then every write a page sends while
     * they are answered, in the order sent, until none is left; the pages take each answer and each
     * message before the next write is applied.
     */
    deliver: (order: number[]) => Promise<void>;
};

/** Let the answers and messages a write gave land in the pages. */
function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

export function stateServer(): StateServer {
    const folder = scratchDir('oculus-state-');
    const pages: ClientState[] = [];
    const sent: PageStateWrite[] = [];
    const kept: Pending[] = [];
    let holding = false;
    let version = 0;
    const said = {
        unreadable: (file: string) => `unreadable ${file}`,
        unwritable: (file: string, reason: string) => `unwritable ${file}: ${reason}`
    };

    function read(): PageStateRead {
        const { state, findings } = readPageState(folder, (file, reason) => ({
            file,
            key: '',
            message: reason
        }));
        return { ...state, version, findings };
    }

    /** Apply one write, tell every page what it changed, then answer the page that sent it. */
    function apply({ write, answer }: Pending): void {
        const applied = applyStateWrite(folder, write, said);
        if (applied.told !== null) {
            version += 1;
            for (const one of pages) {
                one.entities.receive({ channel: 'state', version, payload: applied.told });
            }
        }
        answer(applied.answer);
    }

    const transport: StateTransport = {
        read: () => Promise.resolve(read()),
        send: (write) =>
            new Promise<PageStateAnswer>((answer) => {
                sent.push(write);
                const pending = { write, answer };
                if (holding) kept.push(pending);
                else apply(pending);
            })
    };

    return {
        folder,
        page: (memory) => {
            const client = createClientState(undefined, null, 'main', null, transport, memory);
            client.pageState.install(read());
            pages.push(client);
            return client;
        },
        read,
        file: (file) => readStateMap(folder, file).map,
        seed: (identity, held) => {
            const map = readStateMap(folder, 'layouts').map;
            map[identity] = held;
            writeStateMap(folder, 'layouts', map);
        },
        sent: () => [...sent],
        hold: () => {
            holding = true;
        },
        deliver: async (order) => {
            const first = kept.splice(0);
            for (const at of order) {
                apply(first[at]);
                await settle();
            }
            for (let next = kept.shift(); next !== undefined; next = kept.shift()) {
                apply(next);
                await settle();
            }
        }
    };
}
