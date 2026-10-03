// Layer 4, test helper. One case's own client: every store built fresh, and the context a rendered
// component reads them from. A case builds one in beforeEach, so no state is carried from the case
// before it and no case resets anything by hand.

import { render } from 'svelte/server';
import { vi } from 'vitest';
import type { Terminal } from '../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../src/lib/state/client/context.ts';
import { STATE_KEY } from '../../src/lib/state/client/use.ts';
import { TIP_KEY, createTipIds } from '../../src/lib/ui/menu/tip-ids.ts';
import GroupContexts from '../ui/menu/GroupContexts.svelte';

export { createClientState, type ClientState };

/** Hands the client a `sessions` payload that holds these terminals and no session records. */
export function holdTerminals(client: ClientState, terminals: Terminal[]): void {
    client.entities.receive({
        channel: 'sessions',
        version: 1,
        payload: { records: [], workspaces: [], terminals }
    });
}

/**
 * The contexts the page's one tooltip group gives what it wraps, drawn fresh for each caller: every
 * tooltip is refused outside the group, and the page's layout draws every control inside it.
 */
function tooltipGroup(): Map<unknown, unknown> {
    let held = new Map<unknown, unknown>();
    // The render runs when its body is read, which is when the group hands its contexts over.
    const drawn = render(GroupContexts, {
        props: {
            onheld: (contexts: Map<unknown, unknown>) => {
                held = contexts;
            }
        }
    }).body;
    if (held.size === 0) throw new Error(`the tooltip group handed over no context: ${drawn}`);
    return held;
}

/**
 * What render() and mount() are handed so the component under test reads this case's stores, with
 * a tooltip counter of its own, as the page root provides one beside the client, under the
 * page's one tooltip group, as the page's layout draws it.
 */
export function clientContext(client: ClientState): Map<unknown, unknown> {
    return new Map<unknown, unknown>([
        ...tooltipGroup(),
        [STATE_KEY, client],
        [TIP_KEY, createTipIds()]
    ]);
}

/** A JSON answer as a stubbed `fetch` returns it. */
export function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** Let the requests a store scheduled run and their answers land. */
export async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Replace `fetch` with a stub that records each address in `asked` and answers as `answer`. */
export function stubFetch(
    asked: string[],
    answer: (url: string) => Response | Promise<Response>
): void {
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return Promise.resolve(answer(url));
    });
}

/**
 * Replace `fetch` with a stub whose answers wait for the returned release, so a case can act while
 * a request is out. Every request records its address in `asked` and answers `answer` once
 * released.
 */
export function stubGated(
    asked: string[],
    answer: (url: string) => Response
): { release: () => void } {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    vi.stubGlobal('fetch', async (url: string) => {
        asked.push(url);
        await gate;
        return answer(url);
    });
    return { release: () => release() };
}

/**
 * Replace `fetch` with a stub whose next request stays out until the returned `land` is called with
 * its answer. Every request records its address in `asked`.
 */
export function stubHeld(asked: string[]): { land: (answer: Response) => void } {
    let land: (answer: Response) => void = () => undefined;
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        return new Promise<Response>((done) => {
            land = done;
        });
    });
    return { land: (answer) => land(answer) };
}
