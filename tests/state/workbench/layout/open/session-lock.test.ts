// Layer 2, client-state tests. pinInstance and unpinInstance: the first pin wins, a second view's
// pin to the same session activates the first, and the unpin clears the state in place.

import { beforeEach, describe, expect, it } from 'vitest';
import { emptyClient, type ClientState } from '../../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = emptyClient();
});

describe('pinInstance and unpinInstance', () => {
    it('lock a view to a session and clear it in place', () => {
        const id = client.layout.openView('status');
        client.layout.pinInstance(id, 's1', 'Session one');
        expect(client.layout.instanceLayoutState(id)).toEqual({
            session: 's1',
            label: 'Session one'
        });

        client.layout.unpinInstance(id);
        expect(client.layout.instanceLayoutState(id)).toEqual({});
    });

    it('activate the pane already locked to the session rather than lock a second one', () => {
        const first = client.layout.openView('source', { root: 'hub', path: 'a.md' });
        client.layout.pinInstance(first, 's1', 'Session one');
        const other = client.layout.openView('source', { root: 'hub', path: 'b.md' });
        client.layout.pinInstance(other, 's1', 'Session one');

        expect(client.layout.activeInstance()?.id).toBe(first);
        expect(client.layout.instanceLayoutState(other)).not.toEqual({
            session: 's1',
            label: 'Session one'
        });
    });
});
