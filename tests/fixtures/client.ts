// Layer 4, test helper. One case's own client: every store built fresh, and the context a rendered
// component reads them from. A case builds one in beforeEach, so no state is carried from the case
// before it and no case resets anything by hand. Beside it, the Files view's store over the write
// store and the file browser a case hands it, with no tab, no instance state and no source tab.

import { render } from 'svelte/server';
import { createClientState, type ClientState } from '../../src/lib/state/client/context.ts';
import {
    createExplorer,
    type ExplorerStore
} from '../../src/lib/state/sources/explorer/ops.svelte.ts';
import type { WritesStore } from '../../src/lib/state/shared/stores/shapes.ts';
import type { FsStore } from '../../src/lib/state/sources/fs.svelte.ts';
import type { Move } from '../../src/lib/state/sources/explorer/follow.ts';
import { STATE_KEY } from '../../src/lib/state/client/use.ts';
import { t } from '../../src/lib/state/shared/words/text.ts';
import { TIP_KEY, createTipIds } from '../../src/lib/ui/menu/tip-ids.ts';
import GroupContexts from '../ui/menu/GroupContexts.svelte';

export { createClientState, type ClientState };

/** A fresh client whose ui store is loaded from an empty storage and whose page holds no tab. */
export function emptyClient(): ClientState {
    const client = createClientState();
    client.ui.loadUi({ getItem: () => null, setItem: () => undefined });
    client.layout.apply({ root: { kind: 'pane', tabs: [], active: '' } });
    return client;
}

/** The sentence a refused answer is said in, with the status it came with. */
export const refused = (status: number): string => t('ui.answer_refused', status);

/** The sentence an answer the page could not read is said in, with the status it came with. */
export const unreadable = (status: number): string => t('ui.answer_unreadable', status);

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

/**
 * The Files view's store (state/sources/explorer/ops.svelte.ts) over `writes` and `fs`, in a page
 * with no tab, no instance state and no source tab, telling `moved` each move it makes.
 */
export function explorerOver(
    writes: WritesStore,
    fs: FsStore,
    moved: (moves: Move[]) => void = () => undefined
): ExplorerStore {
    return createExplorer(
        writes,
        fs,
        {
            tabs: () => [],
            restateInstance: () => undefined,
            openView: () => '',
            showFolderInFiles: () => ''
        },
        {
            instanceState: () => undefined,
            setInstanceState: () => undefined,
            clearInstanceState: () => undefined,
            instanceKeys: () => []
        },
        {
            sourceDirty: () => false,
            sourceDraft: () => ({ file: '' }),
            reloadSource: () => Promise.resolve()
        },
        moved
    );
}
