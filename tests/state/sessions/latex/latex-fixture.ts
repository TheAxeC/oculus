// The doubles the LaTeX store's tests share: the folder a case reads, the answer the server gives
// for it, and `fetch` stubs that answer by address, one of which holds a terminal start until the
// case lets it through.

import { afterEach, beforeEach, vi } from 'vitest';
import { createClientState, json, type ClientState } from '../../../fixtures/client.ts';

/** Gives each case a new client state and takes the `fetch` stub off after it. */
export function eachClient(held: (client: ClientState) => void): void {
    beforeEach(() => held(createClientState()));
    afterEach(() => vi.unstubAllGlobals());
}

export const DOCS = { root: 'docs', path: 'proposal' } as const;

/** The request the store sends for the folder DOCS names, as the router records it. */
export const ASKED_DOCS = 'GET /api/latex?root=docs&path=proposal';

/**
 * One folder answer: main.tex built at `at`, with the issues given, every path against the root.
 */
export function folderAnswer(
    at: number | null,
    errors: { file: string; line: number | null; message: string }[] = [],
    warnings: { file: string; line: number | null; message: string }[] = []
): unknown {
    const main = {
        main: 'main.tex',
        program: 'xelatex',
        pdfPath: 'proposal/main.pdf',
        pdf: at,
        log: at,
        errors,
        warnings
    };
    return { root: 'docs', path: 'proposal', mains: [main] };
}

/** Every request a router stub answered, as `METHOD url body`. */
export type Requests = { asked: string[]; built: unknown[] };

/**
 * A fetch stub that answers by address. `routes` maps a GET address (as the store builds it) to a
 * function giving its answer; a POST to the terminal route answers a started terminal and records
 * its body; any other address answers 404, the terminal route's GET included unless routed.
 */
export function router(routes: Record<string, () => Response | Promise<Response>>): Requests {
    const seen: Requests = { asked: [], built: [] };
    vi.stubGlobal('fetch', (url: string, init?: { method?: string; body?: string }) => {
        seen.asked.push(`${init?.method ?? 'GET'} ${url}`);
        if (url === '/api/terminal' && init?.method === 'POST') {
            seen.built.push(JSON.parse(init.body ?? 'null'));
            return Promise.resolve(json({ ok: true, terminal: { id: `t${seen.built.length}` } }));
        }
        const route = routes[url] as (() => Response | Promise<Response>) | undefined;
        return Promise.resolve(route === undefined ? json({ error: 'no route' }, 404) : route());
    });
    return seen;
}

/** Hand the client a configuration whose `latex.auto_build` is the value given. */
export function configure(client: ClientState, auto: unknown): void {
    const config = { latex: { auto_build: auto } };
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: {}, findings: [] }
    });
}

/**
 * A router whose terminal route answers a POST when the case says so. Each POST waits in `posts`
 * until `answer` gives it a response, so a case can look at the store while the request is out.
 */
export function gated(routes: Record<string, () => Response | Promise<Response>>): {
    asked: string[];
    posts: { body: unknown; answer: (response: Response) => void }[];
} {
    const seen = {
        asked: [] as string[],
        posts: [] as { body: unknown; answer: (response: Response) => void }[]
    };
    vi.stubGlobal('fetch', (url: string, init?: { method?: string; body?: string }) => {
        seen.asked.push(`${init?.method ?? 'GET'} ${url}`);
        if (url === '/api/terminal' && init?.method === 'POST') {
            return new Promise<Response>((resolve) => {
                seen.posts.push({ body: JSON.parse(init.body ?? 'null'), answer: resolve });
            });
        }
        const route = routes[url] as (() => Response | Promise<Response>) | undefined;
        return Promise.resolve(route === undefined ? json({ error: 'no route' }, 404) : route());
    });
    return seen;
}
