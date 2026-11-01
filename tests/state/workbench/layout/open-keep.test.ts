// Layer 2, client-state tests. A repeat open of a tab that is already open, through each path of
// state/workbench/layout/open/opening.ts that restates a found tab: with `keep` the tab takes the
// given fields over the state it holds, so a Session tab keeps its closed sections and their order;
// without it the given state replaces what the tab holds.
//
// The page is the real client state over a server that admits every save. What this does NOT
// cover: which callers pass `keep`, which is read at the call.

import { describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import type { OpenOptions } from '../../../../src/lib/state/workbench/layout/open/opening.ts';
import type { Float, Instance } from '../../../../src/lib/state/workbench/layout/index.ts';
import {
    admittedPage,
    floating,
    heldPages,
    openSaved,
    pageAround,
    pane
} from './layout-fixture.ts';

const VIEW = 'session-detail';

/** What a Session tab holds once its reader closed a section and moved another. */
const ARRANGED = {
    session: 'one',
    label: 'Old title',
    closed: ['timeline'],
    sections: ['agents', 'details', 'changes', 'timeline']
};

const ASKED = { session: 'one', label: 'New title' };

/** One tab of the Session view holding `state`. */
function tab(state: unknown): Instance {
    return { id: 'tab', view: VIEW, state };
}

/** A page holding the tab in its pane, beside a tab of another view that is the active one. */
function onPage(state: unknown) {
    const other = pane(['other']);
    if (other.kind !== 'pane') throw new Error('the fixture draws one pane');
    const root = { ...other, tabs: [...other.tabs, tab(state)] };
    return heldPages([pageAround('main', root)]);
}

/** A page with no tab of the view, and a float holding it. */
function inFloat(state: unknown) {
    const float: Float = {
        ...floating('float', ['tab']),
        pane: { kind: 'pane', tabs: [tab(state)], active: 'tab' }
    };
    return heldPages([pageAround('main', pane(['other']))], [float]);
}

/** Open the tab a second time, and answer the state it holds then. */
function repeated(pages: ReturnType<typeof onPage>, state: unknown, options: OpenOptions): unknown {
    const client = admittedPage();
    openSaved(client, pages);
    client.layout.openView(VIEW, state, 'main', options);
    return client.layout.instanceLayoutState('tab');
}

describe('a repeat open of a tab already open', () => {
    it.each([
        { path: 'a tab of the pane', where: onPage, options: {} },
        { path: 'a tab of the documents', where: onPage, options: { document: true } },
        { path: 'a held tab', where: onPage, options: { held: true } },
        { path: 'a tab of a float', where: inFloat, options: {} }
    ])('$path: holds the arrangement with keep and replaces it without', (row) => {
        const kept = repeated(row.where(ARRANGED), ASKED, { ...row.options, keep: true });
        expect(kept).toEqual({ ...ARRANGED, ...ASKED });
        expect(repeated(row.where(ARRANGED), ASKED, row.options)).toEqual(ASKED);
    });

    it('holds the arrangement through openBeside with keep', () => {
        const client = admittedPage();
        openSaved(client, onPage(ARRANGED));
        client.layout.openBeside(VIEW, ASKED, 'main', undefined, { keep: true });
        expect(client.layout.instanceLayoutState('tab')).toEqual({ ...ARRANGED, ...ASKED });
    });
});
