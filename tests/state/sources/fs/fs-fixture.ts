// Layer 2, client-state test helper. What the file browser store tests share: a client state over a
// page stand-in, the fetch stub that records the addresses it was asked for and answers what a case
// gives it, and the answers a case builds.
//
// `storeHooks()` hands a test file the one object it reads its case from: the client state and the
// addresses asked for are set on it before each case, and the fetch stub is set up through it.

import { afterEach, beforeEach, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

// A case that opens a tab or says a refusal reads the words out of the catalog, as the page does.
setCatalog(textCatalog(loadConfig(engineDir()).config));

/** One case's store: its client state, the addresses the stub was asked for, and the stub. */
export type StoreCase = {
    client: ClientState;
    /** The addresses the stub was asked for, in order. */
    asked: string[];
    /** A page's fetch: the stub records the address and answers what `answer` gives back. */
    serving: (answer: (url: string) => Response | Promise<Response>) => void;
};

/**
 * Register the hooks that give each case a fresh client state and a page to ask from, and hand
 * back the object the case reads them from.
 */
export function storeHooks(): StoreCase {
    const store: StoreCase = {
        client: createClientState(),
        asked: [],
        serving(answer) {
            store.asked = [];
            vi.stubGlobal('fetch', (url: string) => {
                store.asked.push(url);
                return Promise.resolve(answer(url));
            });
        }
    };

    beforeEach(() => {
        // The store asks for nothing where there is no page; a case that wants a request has one.
        vi.stubGlobal('window', {});
        store.client = createClientState();
        store.asked = [];
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    return store;
}

export { settle } from '../../../fixtures/client.ts';

/** A promise a case resolves by hand, so one answer can be made to land late. */
export function deferred(): { promise: Promise<Response>; land: (answer: Response) => void } {
    let settle: (answer: Response) => void = () => undefined;
    const promise = new Promise<Response>((done) => {
        settle = done;
    });
    return {
        promise,
        land: (answer: Response) => {
            settle(answer);
        }
    };
}

/** A folder listing of these file names, one byte each. */
export function listingOf(names: string[]): Response {
    const entries = names.map((name) => ({ name, kind: 'file', size: 1, mtime: 1 }));
    return new Response(JSON.stringify({ entries }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}

/** One JSON answer, which is what every read but a file's bytes comes back as. */
export function answering(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}
