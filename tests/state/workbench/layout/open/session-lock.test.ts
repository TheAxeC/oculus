// Layer 2, client state tests. The session pin of a pane under its new name: the catalog words are
// the lock and unlock labels asserted below, and pinInstance and unpinInstance keep their
// behaviour (the first pin wins, a second view's pin to the same session activates the first, and
// the unpin clears the state in place).

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { emptyClient, type ClientState } from '../../../../fixtures/client.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

let client: ClientState;

beforeEach(() => {
    client = emptyClient();
});

describe('the words of the session lock', () => {
    // An audit of the catalog. Revert: put the old words back in session-list.yml.
    it('read Lock to this session and Unlock from this session', () => {
        expect(catalog['sessions.pin_pane']).toBe('Lock to this session');
        expect(catalog['sessions.unpin_pane']).toBe('Unlock from this session');
    });

    it('leave the scoring pin of a session, which is another control, as it was', () => {
        expect(catalog['sessions.pin_label']).toBe('Pin');
    });
});

describe('pinInstance and unpinInstance', () => {
    // A preserved behaviour, run on the unchanged tree too.
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
