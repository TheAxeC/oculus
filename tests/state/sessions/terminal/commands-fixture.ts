// Layer 4, test helper. What the commands store suites share: a `fetch` that records each request.

import { vi } from 'vitest';

/** One request the stubbed `fetch` was handed. */
export type Asked = { url: string; method: string; body: Record<string, unknown> | null };

/** Replace `fetch` with a stub that records each request in `asked` and answers as `answer`. */
export function serveInto(
    asked: Asked[],
    answer: (call: Asked) => Response | Promise<Response>
): void {
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        const call = {
            url,
            method: init?.method ?? 'GET',
            body:
                typeof init?.body === 'string'
                    ? (JSON.parse(init.body) as Record<string, unknown>)
                    : null
        };
        asked.push(call);
        return Promise.resolve(answer(call));
    });
}
