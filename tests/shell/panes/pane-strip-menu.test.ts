// Layer 3, shell test. The right-click menu of a pane's strip and of an empty pane's body, built by
// shell/panes/pane-view.ts's stripMenu, and the edge each of its four splits hands splitInstance.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menu opened by a right-click on the strip or the body, the palette
// it opens and the terminal it starts, which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import { stripEdge, stripMenu, stripPicked } from '../../../src/lib/shell/panes/pane-view.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

describe('the pane strip menu', () => {
    // Revert: drop the Close group from stripMenu.
    it('offers a pane holding a tab on a page of two panes every item', () => {
        expect(stripMenu({ holdsTab: true, panes: 2 }, words).map((item) => item.label)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_split_up',
            '@ui.strip_split_down',
            '@ui.strip_split_left',
            '@ui.strip_split_right',
            '@ui.strip_close',
            '@ui.strip_new_terminal'
        ]);
    });

    // Revert: offer the splits in stripMenu whatever `holdsTab` says.
    it('offers an empty pane alone on its page Open File and New Terminal', () => {
        expect(stripMenu({ holdsTab: false, panes: 1 }, words).map((item) => item.label)).toEqual([
            '@ui.strip_open_file',
            '@ui.strip_new_terminal'
        ]);
    });
});

describe('the edge a split takes', () => {
    // Revert: map 'split-up' to 'bottom' in STRIP_SPLITS.
    it('splits left on the left edge and up on the top edge', () => {
        const items = stripMenu({ holdsTab: true, panes: 1 }, words);
        const edges = items.map((item) => stripEdge(item.id));
        expect(edges).toEqual([null, 'top', 'bottom', 'left', 'right', null]);
    });

    // Revert: pass `pane.path` as [] to splitInstance in stripPicked.
    it('hands splitInstance the active tab, the pane, the edge and the page', () => {
        const calls: unknown[][] = [];
        const deps = {
            splitInstance: (...args: unknown[]) => calls.push(args),
            openPalette: () => undefined,
            close: () => undefined,
            newTerminalIn: () => undefined
        };
        const items = stripMenu({ holdsTab: true, panes: 1 }, words);
        const left = items.find((item) => item.label === '@ui.strip_split_left');
        const up = items.find((item) => item.label === '@ui.strip_split_up');
        stripPicked(left?.id ?? '', { active: 'tab-1', path: [0], page: 'p' }, deps);
        stripPicked(up?.id ?? '', { active: 'tab-1', path: [0], page: 'p' }, deps);
        expect(calls).toEqual([
            ['tab-1', [0], 'left', 'p'],
            ['tab-1', [0], 'top', 'p']
        ]);
    });
});

describe('what the strip menu runs', () => {
    // Revert: call deps.newTerminalIn(pane.page, []) in stripPicked, so the pane's path is lost.
    it('opens the palette empty, closes through the pane close and starts a terminal in the pane it was picked on', () => {
        const calls: string[] = [];
        const deps = {
            splitInstance: () => calls.push('split'),
            openPalette: (prefill: string) => calls.push(`palette:${prefill}`),
            close: () => calls.push('close'),
            newTerminalIn: (page: string, path: number[]) =>
                calls.push(`new:${page}:${path.join('.')}`)
        };
        const items = stripMenu({ holdsTab: true, panes: 2 }, words);
        const id = (label: string): string => items.find((item) => item.label === label)?.id ?? '';
        const pane = { active: 'tab-1', path: [1], page: 'p' };
        stripPicked(id('@ui.strip_open_file'), pane, deps);
        stripPicked(id('@ui.strip_close'), pane, deps);
        stripPicked(id('@ui.strip_new_terminal'), pane, deps);
        expect(calls).toEqual(['palette:', 'close', 'new:p:1']);
    });
});
