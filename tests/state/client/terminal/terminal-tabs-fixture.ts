// Layer 2, client-state test helper. The Terminal tabs of a case's client, read and opened the way
// the client tests of the terminals store need them: every tab of every page with its state, and a
// tab opened owning some terminals.

import type { ClientState } from '../../../../src/lib/state/client/context.ts';
import { tabsOf } from '../../../../src/lib/state/workbench/layout/instance.ts';

/** Every Terminal tab of every page, with the page and the state it holds. */
export function terminalTabsOf(
    client: ClientState
): { id: string; page: string; state: unknown }[] {
    return client.layout.pages().flatMap((page) =>
        tabsOf(page.workbench.root)
            .filter((tab) => tab.view === 'terminal')
            .map((tab) => ({ id: tab.id, page: page.id, state: tab.state }))
    );
}

/** A Terminal tab on a page owning these terminals, the first shown unless one is named. */
export function openOwning(
    client: ClientState,
    page: string,
    terminals: string[],
    shown: string | null = terminals[0] ?? null
): string {
    return client.layout.openView(
        'terminal',
        { id: `tab-${terminals.join('-')}`, terminals, shown },
        page
    );
}
