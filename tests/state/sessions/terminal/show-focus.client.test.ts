// Layer 2, client state test. `terminal.show(preserveFocus)` of an app, on the page's side
// (state/sessions/terminals.svelte.ts `showTerminal`): the terminal is shown in a Terminal tab
// either way, and the keyboard is asked for its grid only when `preserveFocus` is false. The
// grid takes the keyboard when it is asked (views/sessions/terminal/grid/TerminalGrid.svelte).
//
// What this does NOT cover: the grid's own `focus()`, which needs a DOM and the xterm canvas, and
// the suite has neither.

import { describe, expect } from 'vitest';
import { createTerminals } from '../../../../src/lib/state/sessions/terminals.svelte.ts';
import type { TerminalTabs } from '../../../../src/lib/state/sessions/terminal/workbench-shape.ts';
import { it } from '../../../fixtures/scratch.ts';

const ID = 'a1b2c3-shell';
const OTHER = 'd4e5f6-shell';

/** A terminals store over a workbench that holds no tab and records the tabs opened. */
function store() {
    const opened: string[] = [];
    const workbench = {
        tabs: () => [],
        currentPage: () => 'p1',
        activeTab: () => null,
        open: (_page: string, state: { terminals: string[] }) => {
            opened.push(...state.terminals);
            return 't1';
        },
        activate: () => undefined,
        restate: () => undefined,
        switchPage: () => undefined,
        selected: () => null
    } as unknown as TerminalTabs;
    const entities = {
        afterReceive: () => undefined,
        sessions: () => null,
        payloadOf: () => null
    };
    const terminals = createTerminals(entities as never, {} as never, {} as never, workbench);
    return { terminals, opened };
}

describe('showing a terminal for an app', () => {
    it('asks no grid for the keyboard when preserveFocus is true, and the grid of that terminal when it is false', () => {
        const { terminals, opened } = store();
        terminals.showTerminal(ID, '', true);
        const kept = terminals.focusAsked();
        terminals.showTerminal(ID, '', false);
        const asked = terminals.focusAsked();
        terminals.focusTaken(OTHER);
        const stillAsked = terminals.focusAsked();
        terminals.focusTaken(ID);
        const taken = terminals.focusAsked();
        terminals.showTerminal(ID, '', false);
        terminals.showTerminal(OTHER);
        expect([kept, asked, stillAsked, taken, terminals.focusAsked(), opened[0]]).toEqual([
            null,
            ID,
            ID,
            null,
            null,
            ID
        ]);
    });
});
