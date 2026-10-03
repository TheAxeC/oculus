// Layer 2, client state tests. The pinned tab, the open position and the order tabs were used in:
// pinning and unpinning, a drag that pins or unpins, the pin kept across a float, a page move and a
// split, a new tab opening to the right of the active one, and a closed tab handing the pane to the
// tab used before it.

import { beforeEach, describe, expect, it } from 'vitest';
import { panes, type Instance } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { emptyClient, type ClientState } from '../../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = emptyClient();
});

/** One file's state, which is what the file browser hands a source tab. */
function file(path: string): Record<string, string> {
    return { root: 'hub', path, label: path };
}

/** The tabs of the page's first pane, in the order the strip draws them. */
function tabs(): Instance[] {
    return panes(client.layout.layout())[0].pane.tabs;
}

/** The ids of the page's first pane, in the order the strip draws them. */
function order(): string[] {
    return tabs().map((tab) => tab.id);
}

/** Open four source tabs, a to d, and answer their ids. */
function four(): string[] {
    return ['a', 'b', 'c', 'd'].map((name) => client.layout.openView('source', file(name)));
}

describe('pinning a tab', () => {
    // Revert: leave pinTab out of the store.
    it('puts the third of four tabs first', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(c);

        expect(order()).toEqual([c, a, b, d]);
        expect(tabs()[0].pinned).toBe(true);
    });

    it('keeps the pinned tabs in the order they were pinned in', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(c);
        client.layout.pinTab(b);

        expect(order()).toEqual([c, b, a, d]);
    });

    it('clears the preview mark of a preview tab it pins', () => {
        const kept = client.layout.openView('source', file('a'));
        const preview = client.layout.openView('source', file('b'), undefined, { preview: true });
        client.layout.pinTab(preview);

        expect(order()).toEqual([preview, kept]);
        expect(tabs()[0].preview).toBeUndefined();
        expect(tabs()[0].pinned).toBe(true);
    });

    it('puts an unpinned tab first among the unpinned tabs', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(a);
        client.layout.pinTab(c);
        client.layout.unpinTab(a);

        expect(order()).toEqual([c, a, b, d]);
        expect(tabs().map((tab) => tab.pinned)).toEqual([true, undefined, undefined, undefined]);
    });

    it('changes nothing for a tab that is already pinned, one that is not, and an id no page holds', () => {
        const [a] = four();
        client.layout.pinTab(a);
        const pinned = client.layout.layout();
        client.layout.pinTab(a);
        client.layout.unpinTab('no-such-instance');
        expect(client.layout.layout()).toEqual(pinned);

        client.layout.unpinTab(a);
        const free = client.layout.layout();
        client.layout.unpinTab(a);
        expect(client.layout.layout()).toEqual(free);
    });
});

describe('a drag in the strip', () => {
    // Revert: leave the pin out of the drop in insertInstance and moveInstance.
    it('pins an unpinned tab dropped into the pinned run', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(a);
        client.layout.pinTab(b);
        client.layout.transferInstance(d, [], 1);

        expect(order()).toEqual([a, d, b, c]);
        expect(tabs().map((tab) => tab.pinned)).toEqual([true, true, true, undefined]);
    });

    it('leaves an unpinned tab dropped after the pinned run unpinned', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(a);
        client.layout.transferInstance(d, [], 1);

        expect(order()).toEqual([a, d, b, c]);
        expect(tabs().map((tab) => tab.pinned)).toEqual([true, undefined, undefined, undefined]);
    });

    it('unpins a pinned tab dragged past the end of the run', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(a);
        client.layout.pinTab(b);
        client.layout.transferInstance(a, [], 3);

        expect(order()).toEqual([b, c, d, a]);
        expect(tabs().map((tab) => tab.pinned)).toEqual([true, undefined, undefined, undefined]);
    });

    it('keeps a pinned tab pinned when it is dragged within the run', () => {
        const [a, b, c] = four();
        client.layout.pinTab(a);
        client.layout.pinTab(b);
        client.layout.transferInstance(b, [], 0);

        expect(order().slice(0, 2)).toEqual([b, a]);
        expect(tabs().map((tab) => tab.pinned)).toEqual([true, true, undefined, undefined]);
        expect(order()[2]).toBe(c);
    });
});

describe('a pinned tab that moves', () => {
    // Revert: rebuild the tab without its pin in floats.ts's kept.
    it('keeps its pin when it is floated', () => {
        const [a, b] = four();
        client.layout.pinTab(a);
        client.layout.floatTab(a, { x: 0.2, y: 0.2 });

        const floated = client.layout.floats()[0].pane.tabs;
        expect(floated.map((tab) => tab.id)).toEqual([a]);
        expect(floated[0].pinned).toBe(true);
        expect(order()).toContain(b);
    });

    // Revert: drop the pin in the page move.
    it('keeps its pin and stands in the pinned run of the page it moves to', () => {
        const home = client.layout.currentPage().id;
        client.layout.openPage('second');
        const second = client.layout.currentPage().id;
        client.layout.switchPage(home);
        const [a] = four();
        client.layout.pinTab(a);
        client.layout.moveInstanceToPage(a, second);

        const there = panes(client.layout.layout(second))[0].pane.tabs;
        expect(there.length).toBeGreaterThan(1);
        expect(there[0].id).toBe(a);
        expect(there[0].pinned).toBe(true);
    });

    it('keeps its pin when it is split to an edge, and is the first tab of the new pane', () => {
        const [a] = four();
        client.layout.pinTab(a);
        client.layout.splitInstance(a, [], 'right');

        const split = panes(client.layout.layout()).map(({ pane }) => pane.tabs);
        const moved = split.find((tabs) => tabs.some((tab) => tab.id === a));
        expect(moved?.[0].id).toBe(a);
        expect(moved?.[0].pinned).toBe(true);
    });
});

describe('a new tab', () => {
    // Revert: append the instance in openInstance.
    it('opens to the right of the active tab', () => {
        const [a, b, c, d] = four();
        client.layout.activateInstance(b);
        const opened = client.layout.openView('source', file('e'));

        expect(order()).toEqual([a, b, opened, c, d]);
    });

    it('opens after the pinned run when the active tab is a pinned one', () => {
        const [a, b, c, d] = four();
        client.layout.pinTab(a);
        client.layout.pinTab(b);
        client.layout.activateInstance(a);
        const opened = client.layout.openView('source', file('e'));

        expect(order()).toEqual([a, b, opened, c, d]);
    });

    it('opens at the end of a pane whose active tab is the last', () => {
        const [a, b, c, d] = four();
        const opened = client.layout.openView('source', file('e'));

        expect(order()).toEqual([a, b, c, d, opened]);
    });
});

describe('closing the active tab', () => {
    // Revert: take the neighbour in removeTab whatever the pane showed before. The neighbours
    // here (b, d) are not the tab used before, so the neighbour rule fails this case.
    it('activates the tab used before it even when that is not a neighbour of it', () => {
        const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((name) =>
            client.layout.openView('source', file(name))
        );
        client.layout.activateInstance(d);
        client.layout.activateInstance(a);
        client.layout.activateInstance(c);

        client.layout.closeInstance(c);
        expect(panes(client.layout.layout())[0].pane.active).toBe(a);
        client.layout.closeInstance(a);
        expect(panes(client.layout.layout())[0].pane.active).toBe(d);
        expect(order()).toEqual([b, d]);
    });

    it('activates the neighbour when the pane showed no other tab before', () => {
        const [a, b, c] = ['a', 'b', 'c'].map((name) =>
            client.layout.openView('source', file(name))
        );
        client.layout.transferInstance(b, [], 0);
        client.layout.closeInstance(b);
        expect(panes(client.layout.layout())[0].pane.active).not.toBe(b);
        expect([a, c]).toContain(panes(client.layout.layout())[0].pane.active);
    });

    it('leaves the active tab alone when a tab that is not active is closed', () => {
        const [a, b, c] = ['a', 'b', 'c'].map((name) =>
            client.layout.openView('source', file(name))
        );
        client.layout.activateInstance(b);
        client.layout.closeInstance(a);
        expect(panes(client.layout.layout())[0].pane.active).toBe(b);
        expect(order()).toEqual([b, c]);
    });
});
