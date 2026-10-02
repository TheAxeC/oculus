// Layer 3, view test. What a press on the Files tab writes into the tab's own state
// (views/sources/files/control/tab-actions.ts): an answer that lands after the tab it was sent from
// was closed, a folder pressed while a filter draws the tree, and the toggles a tab flips.
//
// The client is a fresh one; nothing reaches a server. What this does NOT cover: the presses
// themselves, which no server rendering runs.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tabActions } from '../../../../../src/lib/views/sources/files/control/tab-actions.ts';
import {
    filesViewOf,
    type FilesView,
    type TreeRow
} from '../../../../../src/lib/state/sources/fs.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';

let client: ClientState;
let filtering = false;

function actions(id: string) {
    return tabActions({
        client,
        id: () => id,
        view: () => filesViewOf(client.ui.instanceState(id)),
        listed: () => ({ hidden: false, ignored: false }),
        rows: () => [],
        shownRoots: () => [],
        top: () => null,
        filtering: () => filtering
    });
}

const stateOf = (id: string): FilesView => filesViewOf(client.ui.instanceState(id));

beforeEach(() => {
    vi.stubGlobal('window', {});
    client = createClientState();
    filtering = false;
});

describe('an answer that lands after the tab was switched away from or closed', () => {
    // Revert: drop the `instanceState(owner) === undefined` test from answerAt.
    it('audits that writes the line into the tab it was sent from while that tab is open', () => {
        client.ui.setInstanceState('one', {});
        client.ui.setInstanceState('two', {});

        actions('two').answerAt('one', { note: 'added 1' });

        expect(stateOf('one').note).toBe('added 1');
        expect(stateOf('two').note).toBe('');
    });

    // Revert: drop the `instanceState(owner) === undefined` test from answerAt.
    it('audits that writes nothing, and gives the closed tab no record back, once it was closed', () => {
        client.ui.setInstanceState('two', {});

        actions('two').answerAt('closed', { note: 'added 1' });

        expect(client.ui.instanceState('closed')).toBeUndefined();
        expect(stateOf('two').note).toBe('');
    });
});

describe('a folder pressed while a filter draws the tree', () => {
    const row = { root: 'hub', path: 'a', open: false } as TreeRow;

    // Revert: drop the `filtering` return from toggle.
    it('audits that writes nothing, so clearing the filter gives back the folders that were open', () => {
        client.ui.setInstanceState('one', {});
        filtering = true;
        actions('one').toggle(row);

        expect(stateOf('one').expanded).toEqual([]);

        filtering = false;
        actions('one').toggle(row);

        expect(stateOf('one').expanded).toEqual(['hub:a']);
    });
});

describe('the toggles a tab flips', () => {
    // Revert: write the nesting flip to the shared listing instead of the tab.
    it('audits that keeps file nesting per tab', () => {
        client.ui.setInstanceState('one', {});
        client.ui.setInstanceState('two', {});

        actions('one').flip('nesting');

        expect(stateOf('one').nesting).toBe(true);
        expect(stateOf('two').nesting).toBe(false);
    });
});
