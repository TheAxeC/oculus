// Layer 4, test helper. What the commands store suites share: a `fetch` that records each request,
// and the commands store over stubbed collaborators.

import { vi } from 'vitest';
import type { AppProblemMatcher } from '../../../../src/lib/data/model/index.ts';
import { createCommands } from '../../../../src/lib/state/sessions/terminal/commands.svelte.ts';

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

/**
 * The commands store over stubs: the terminals it lists are `listed()`, the problem matchers of the
 * acting apps are `matchers()`, and the entities, queries, notices and roots answer nothing.
 */
export function stubbedCommands(
    listed: () => unknown[],
    matchers: () => AppProblemMatcher[] = () => []
) {
    const terminals = { terminals: listed, adopt: () => undefined, subscribed: () => true };
    const entities = { afterReceive: () => undefined, payloadOf: () => null, config: () => null };
    const commands = createCommands({
        entities,
        writes: {},
        queries: { entries: () => [], mark: () => undefined, hold: () => undefined },
        notices: { post: () => undefined },
        terminals,
        onScreen: () => null,
        focusedSource: () => null,
        gitRoots: () => [],
        served: () => [],
        matchers,
        openFile: () => true
    } as never);
    return { terminals, entities, commands };
}
