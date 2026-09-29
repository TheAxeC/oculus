// The explorer's primitives rendered to HTML on the server: one row of ui/tree/TreeItem.svelte, a
// section of ui/tree/TreeSection.svelte, the tree of ui/tree/TreeView.svelte and the path of
// ui/tabs/Breadcrumb.svelte, with the roles, the levels and the stops a screen reader reads.
//
// What this does NOT cover: a press, a key, a hover or the focus, none of which a server rendering
// runs, and the sizes a row is drawn at. Each case names the change to the primitive that turns it
// red.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Breadcrumb from '../../../src/lib/ui/tabs/Breadcrumb.svelte';
import TreeItem from '../../../src/lib/ui/tree/TreeItem.svelte';
import TreeSection from '../../../src/lib/ui/tree/TreeSection.svelte';
import TreeHarness from './TreeHarness.svelte';
import type { TreeNav } from '../../../src/lib/ui/tree/tree-keys.ts';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig
} from '../../../src/lib/data/sources/config.ts';
import { setGlyphs, setIcons } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setGlyphs(glyphCatalog(config));
setIcons(iconSet(config));

/** The context a rendering is given, which is where the tooltip inside a row draws its ids from. */
const context = clientContext(createClientState());

/** A snippet drawing a fixed piece of markup, standing in for a caller's detail. */
function markup(html: string): ReturnType<typeof createRawSnippet> {
    return createRawSnippet(() => ({ render: () => html }));
}

/** A snippet drawing one control with the tabindex the row hands it. */
const control = createRawSnippet((reach: () => number) => ({
    render: () => `<button type="button" tabindex="${String(reach())}">star</button>`
}));

/**
 * A tree whose stop is the row `stop`, handing each row the stop's tabindex as
 * ui/tree/TreeView.svelte's machine does, and nothing of its level or open state, so a row's own
 * `level` and `expanded` are what it draws.
 */
function navAt(stop: string): TreeNav {
    return {
        row: (id) => ({ role: 'treeitem', tabindex: id === stop ? 0 : -1 }),
        list: () => noop,
        focus: noop,
        kept: () => [stop]
    };
}

/** The opening tag of the row element, the treeitem when the row is one. */
function itemTag(body: string): string {
    const at = body.indexOf('class="item');
    return body.slice(body.lastIndexOf('<', at), body.indexOf('>', at) + 1);
}

describe('one explorer row', () => {
    // Revert: drop `role` and `aria-level` from the row element in TreeItem.svelte.
    it('is a treeitem with its level, its open state and its selection when it is in a tree', () => {
        const { body } = render(TreeItem, {
            context,
            props: {
                label: 'code',
                glyph: 'folder',
                id: 'hub:code',
                nav: navAt('hub:code'),
                level: 2,
                depth: 1,
                expanded: true,
                selected: true,
                onclick: noop
            }
        });
        const tag = itemTag(body);

        expect(tag).toContain('role="treeitem"');
        expect(tag).toContain('aria-level="2"');
        expect(tag).toContain('aria-expanded="true"');
        expect(tag).toContain('aria-selected="true"');
        expect(tag).toContain('aria-label="code"');
        expect(tag).toContain('tabindex="0"');
        // The button is the pointer's target and is no stop of its own.
        expect(body.slice(body.indexOf('<button'))).toContain('tabindex="-1"');
    });

    // Revert: give the row `tabindex={0}` whatever the tree's stop is.
    it('takes the stop only when it is the tree stop', () => {
        const { body } = render(TreeItem, {
            context,
            props: { label: 'run.py', id: 'run', nav: navAt('other'), level: 3, onclick: noop }
        });

        expect(itemTag(body)).toContain('tabindex="-1"');
    });

    // Revert: hand the actions `0` whatever `inside` says.
    it('keeps its controls out of the focus order until the focus is inside the row', () => {
        const { body } = render(TreeItem, {
            context,
            props: {
                label: 'README.md',
                id: 'r',
                nav: navAt('r'),
                level: 2,
                onclick: noop,
                actions: control
            }
        });

        expect(body).toContain('<button type="button" tabindex="-1">star</button>');
        expect(body.indexOf('class="actions')).toBeGreaterThan(body.indexOf('</button>'));
    });

    // Revert: build `guides` from `depth + 1`.
    it('draws one indent guide per level and an arrow only on a row that opens', () => {
        const folder = render(TreeItem, {
            context,
            props: { label: 'lib', depth: 2, expanded: false, onclick: noop }
        }).body;
        const file = render(TreeItem, {
            context,
            props: { label: 'run.py', depth: 3, onclick: noop }
        }).body;

        expect(folder.split('class="guide').length - 1).toBe(2);
        expect(file.split('class="guide').length - 1).toBe(3);
        expect(folder).toContain('twisty');
        expect(folder).toContain('<svg');
        expect(file).not.toContain('<svg');
    });

    // Revert: take the button branch whatever `onclick` is, in TreeItem.svelte.
    it('draws a row with nothing to press as text', () => {
        const { body } = render(TreeItem, {
            context,
            props: { label: 'Add the thing', detail: markup('<span>aaaaaaa</span>') }
        });

        expect(body).not.toContain('<button');
        expect(body).toContain('Add the thing');
        expect(body).toContain('aaaaaaa');
    });

    // Revert: draw `current` with the `selected` class in TreeItem.svelte.
    it('draws the row in force as a bold name with a check, and not as a selection', () => {
        const { body } = render(TreeItem, {
            context,
            props: { label: 'main', current: true, onclick: noop }
        });
        const tag = itemTag(body);

        expect(tag).toContain('current');
        expect(tag).not.toContain('selected');
        expect(tag).toContain('aria-current="true"');
        expect(body).toContain('class="mark');
    });

    // Revert: draw the count before the controls in TreeItem.svelte.
    it('draws its count at the right edge, after the button and the controls', () => {
        const { body } = render(TreeItem, {
            context,
            props: {
                label: 'Bookmarks',
                heading: true,
                count: 4,
                expanded: true,
                onclick: noop,
                actions: control
            }
        });

        expect(body).toContain('>4</span>');
        expect(body.indexOf('class="count')).toBeGreaterThan(body.indexOf('class="actions'));
    });
});

describe('a section of rows', () => {
    // Revert: drop `open &&` from the list's condition in TreeSection.svelte.
    it('draws its head as a level-one treeitem always, and its group only while it is open', () => {
        const rows = markup('<li role="none" data-listed>one</li>');
        const props = { label: 'Notes', id: 'head', count: 1, ontoggle: noop, children: rows };
        const open = render(TreeSection, { context, props: { ...props, open: true } }).body;
        const shut = render(TreeSection, { context, props: { ...props, open: false } }).body;

        expect(itemTag(open)).toContain('aria-level="1"');
        expect(itemTag(open)).toContain('aria-expanded="true"');
        expect(open).toContain('role="group"');
        expect(open).toContain('data-listed');
        expect(itemTag(shut)).toContain('aria-expanded="false"');
        expect(shut).not.toContain('role="group"');
        expect(shut).not.toContain('data-listed');
    });
});

describe('the tree', () => {
    /** Rows `a` open over `a/b`, and `c` closed, as a caller hands them. */
    const ROWS = [
        { id: 'a', parent: null, open: true, label: 'alpha' },
        { id: 'a/b', parent: 'a', label: 'beta' },
        { id: 'c', parent: null, open: false, label: 'gamma' }
    ];

    /** The one attribute `name` of an opening tag, or null when the tag has none. */
    function attr(tag: string, name: string): string | null {
        const found = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
        return found === null ? null : found[1];
    }

    /** The opening tag of every row element a rendering of the rows draws, in order. */
    function tags(current?: string): string[] {
        const { body } = render(TreeHarness, { context, props: { rows: ROWS, current } });
        return body
            .split('<div')
            .map((one) => `<div${one.slice(0, one.indexOf('>') + 1)}`)
            .filter((tag) => tag.includes(' class="item'));
    }

    // Revert: drop `role="tree"` from TreeView.svelte, or `aria-label={label}` with it.
    it('is a tree named by its label', () => {
        const { body } = render(TreeHarness, { context, props: { rows: ROWS } });

        expect(body).toContain('role="tree"');
        expect(body).toContain('aria-label="Harness"');
    });

    // Revert: spread TreeItem's own `level` over the tree's in TreeItem.svelte.
    it('draws each row as a treeitem at the level its parent gives it, whatever level the row was handed', () => {
        const drawn = tags();

        expect(drawn.map((tag) => attr(tag, 'role'))).toEqual(['treeitem', 'treeitem', 'treeitem']);
        expect(drawn.map((tag) => attr(tag, 'aria-level'))).toEqual(['1', '2', '1']);
        expect(attr(drawn[0], 'aria-expanded')).toBe('true');
    });

    // Revert: give every row's `aria-expanded` from `open ?? false` in the tree.
    it('says a closed row is closed, and says nothing of a row that does not open', () => {
        const drawn = tags();

        expect(attr(drawn[2], 'aria-expanded')).toBe('false');
        expect(attr(drawn[1], 'aria-expanded')).toBeNull();
    });

    // Revert: hand the machine `current` as its focused value whether or not it is drawn.
    it('gives exactly one row the stop: the current one while it is drawn, else the first', () => {
        const stops = (current?: string): (string | null)[] =>
            tags(current).map((tag) => attr(tag, 'tabindex'));

        expect(stops()).toEqual(['0', '-1', '-1']);
        expect(stops('c')).toEqual(['-1', '-1', '0']);
        expect(stops('a/b')).toEqual(['-1', '0', '-1']);
        expect(stops('gone')).toEqual(['0', '-1', '-1']);
        expect(stops('')).toEqual(['0', '-1', '-1']);
    });

    // Revert: return [] from `kept` in TreeView.svelte's nav, or fall back to the last row for the
    // stop rather than the first.
    it('keeps drawn the row holding the stop: the current one while it is drawn, else the first', () => {
        const kept = (current?: string): string | undefined => {
            const { body } = render(TreeHarness, { context, props: { rows: ROWS, current } });
            return /data-kept="([^"]*)"/.exec(body)?.[1];
        };

        expect(kept()).toBe('a');
        expect(kept('c')).toBe('c');
        expect(kept('a/b')).toBe('a/b');
        expect(kept('gone')).toBe('a');
    });
});

describe('the breadcrumb', () => {
    // Revert: mark the first segment as the current one instead of the last.
    it('draws one control per segment in order, the last named as the current location', () => {
        const { body } = render(Breadcrumb, {
            context,
            props: {
                label: 'Path',
                segments: [
                    { id: 'hub:', label: 'hub' },
                    { id: 'hub:code', label: 'code' },
                    { id: 'hub:code/run.py', label: 'run.py' }
                ],
                onselect: noop
            }
        });

        expect(body).toContain('aria-label="Path"');
        expect(body.split('<button').length - 1).toBe(3);
        expect(body.indexOf('>hub')).toBeLessThan(body.indexOf('>code'));
        expect(body.split('aria-current="location"').length - 1).toBe(1);
        const current = body.lastIndexOf('<button');
        expect(body.slice(current)).toContain('aria-current="location"');
        // One arrow between each two segments, and none before the first.
        expect(body.split('class="sep').length - 1).toBe(2);
    });
});
