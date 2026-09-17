// The explorer's primitives rendered to HTML on the server: one row of ui/TreeItem.svelte, a section
// of ui/TreeSection.svelte, the tree of ui/TreeView.svelte and the path of ui/Breadcrumb.svelte, with
// the roles, the levels and the stops a screen reader and the browser suite read.
//
// What this does NOT cover: a press, a key, a hover or the focus, none of which a server rendering
// runs, and the sizes a row is drawn at; tests/browser/files.spec.ts and
// tests/browser/repositories.spec.ts press them and measure the row. Each case names
// the change to the primitive that turns it red.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Breadcrumb from '../../src/lib/ui/Breadcrumb.svelte';
import TreeItem from '../../src/lib/ui/TreeItem.svelte';
import TreeSection from '../../src/lib/ui/TreeSection.svelte';
import TreeView from '../../src/lib/ui/TreeView.svelte';
import type { TreeNav } from '../../src/lib/ui/tree-keys.ts';
import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig
} from '../../src/lib/data/sources/config.ts';
import { setAscii, setGlyphs, setIcons } from '../../src/lib/state/text.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState } from '../client.ts';

const { config } = loadConfig(engineDir());
setGlyphs(glyphCatalog(config));
setAscii(asciiCatalog(config));
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

/** A tree whose stop is the row `stop`, as ui/TreeView.svelte hands it to its rows. */
function navAt(stop: string): TreeNav {
    return { tabindex: (id) => (id === stop ? 0 : -1), onkeydown: () => noop };
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
    // Revert: drop `role="tree"` from TreeView.svelte.
    it('is a tree named by its label, and hands its first row the stop while none is asked for', () => {
        const children = createRawSnippet((nav: () => TreeNav) => ({
            render: () =>
                `<p data-first="${String(nav().tabindex('a'))}" data-second="${String(nav().tabindex('b'))}"></p>`
        }));
        const rows = [
            { id: 'a', parent: null },
            { id: 'b', parent: null }
        ];
        const plain = render(TreeView, { context, props: { label: 'Roots', rows, children } }).body;
        const asked = render(TreeView, {
            context,
            props: { label: 'Roots', rows, current: 'b', children }
        }).body;

        expect(plain).toContain('role="tree"');
        expect(plain).toContain('aria-label="Roots"');
        expect(plain).toContain('data-first="0" data-second="-1"');
        expect(asked).toContain('data-first="-1" data-second="0"');
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
