// Layer 4, test helper. One case's own client: every store built fresh, and the context a rendered
// component reads them from. A case builds one in beforeEach, so no state is carried from the case
// before it and no case resets anything by hand.

import { createClientState, type ClientState } from '../src/lib/state/context.ts';
import { STATE_KEY } from '../src/lib/state/use.ts';
import { TIP_KEY } from '../src/lib/ui/tip-ids.ts';

export { createClientState, type ClientState };

/** What render() and mount() are handed so the component under test reads this case's stores. */
export function clientContext(client: ClientState): Map<unknown, unknown> {
    return new Map<unknown, unknown>([
        [STATE_KEY, client],
        [TIP_KEY, client.tipIds]
    ]);
}
