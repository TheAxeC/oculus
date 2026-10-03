// Layer 4, test helper. What the Search tab's tests share: the client state they run in, the fetch
// stub that records what a request carried, the answer of the endpoint they stub, and the answer
// the replace tests work over: two files, `a.ts` with two hits on one line and `b.ts` with one, and
// the query it was found by.

import { vi } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** A client state with the configuration received and the write token set, for one case. */
export function searchClient(): ClientState {
    const client = createClientState();
    client.ui.loadUi({ getItem: () => null, setItem: noop });
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: textCatalog(config), findings: [] }
    });
    client.writes.setToken('token-one');
    return client;
}

/** The answer a stubbed endpoint gives to a search. */
export const ANSWER = {
    ok: true,
    files: [
        { root: 'hub', path: 'a.ts', hits: [{ line: 3, column: 1, length: 2, text: 'ab', at: 0 }] }
    ],
    total: 1,
    truncated: false,
    ms: 5,
    failed: [{ root: 'engine', reason: 'rg: no such file' }]
};

/** A fetch of this case's own, recording the address and the headers each request carried. */
export function stub(body: unknown, ok = true): { calls: { url: string; token: string }[] } {
    const calls: { url: string; token: string }[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        calls.push({ url, token: headers['x-oculus-token'] ?? '' });
        return Promise.resolve({
            ok,
            status: ok ? 200 : 400,
            json: () => Promise.resolve(body)
        } as Response);
    });
    return { calls };
}

export const FILES = [
    {
        root: 'hub',
        path: 'a.ts',
        hits: [
            { line: 1, column: 1, length: 3, text: 'foo foo', at: 0 },
            { line: 1, column: 5, length: 3, text: 'foo foo', at: 4 }
        ]
    },
    { root: 'hub', path: 'b.ts', hits: [{ line: 2, column: 1, length: 3, text: 'foo', at: 0 }] }
];
export const [A, B] = FILES;
export const RAN = { q: 'foo', word: false, case: false, regex: false, under: '' };
