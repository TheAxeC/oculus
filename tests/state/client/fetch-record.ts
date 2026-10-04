// Layer 2, client-state test helper. A stubbed `fetch` that records each request it is given and
// answers every one with the same JSON body, for a case that reads what a store sent.

import { vi } from 'vitest';
import { json } from '../../fixtures/client.ts';

/** The URLs and requests the stub was given, newest last; `serving` starts it afresh. */
export let asked: { url: string; init: RequestInit }[] = [];

/** Replace `fetch` with a stub that records its requests in `asked` and answers `body`. */
export function serving(status: number, body: unknown): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
        asked.push({ url, init });
        return Promise.resolve(json(body, status));
    });
}
