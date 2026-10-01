// The explorer's primitives rendered to HTML on the server: one row of ui/tree/TreeItem.svelte, a
// section of ui/tree/TreeSection.svelte, the tree of ui/tree/TreeView.svelte and the path of
// ui/tabs/Breadcrumb.svelte, with the roles, the levels and the stops a screen reader reads.
//
// What this does NOT cover: a press, a key, a hover or the focus, none of which a server rendering
// runs, and the sizes a row is drawn at. Each case names the change to the primitive that turns it
// red.

import { readFileSync } from 'node:fs';
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

describe('the count of a row drawn as a badge', () => {
    const counted = { label: 'Changes', heading: true, count: 3, onclick: noop };

    it('audits that draws a count as plain text in the number font when the row is given no badge', () => {
        const { body } = render(TreeItem, { context, props: counted });

        expect(body).toContain('class="count');
        expect(body).toContain('>3</span>');
        expect(body).not.toContain('badge');
    });

    // Revert: leave the badge rule of TreeItem.svelte without its own font, so it takes the number
    // font of the plain count.
    it('audits that draws a badge in the interface font with tabular figures and a plain count in the number font', () => {
        const source = readFileSync('src/lib/ui/tree/TreeItem.svelte', 'utf8');
        const rule = (selector: string): string => {
            const at = source.indexOf(`${selector} {`);
            return at < 0 ? '' : source.slice(at, source.indexOf('}', at));
        };

        expect(rule('    .count.badge,\n    .item.selected .count.badge')).toContain(
            'font-family: var(--font-ui)'
        );
        expect(rule('    .count.badge,\n    .item.selected .count.badge')).toContain(
            'font-variant-numeric: tabular-nums'
        );
        // the plain count's own rule follows a blank line; the shared rule above it does not
        expect(rule('\n\n    .count,\n    .end')).toContain('font-family: var(--font-num)');
    });

    it('draws the count as a pill when the row is given the badge', () => {
        const { body } = render(TreeItem, { context, props: { ...counted, badge: true } });

        expect(body).toMatch(/class="count[^"]*\bbadge\b[^"]*"[^>]*>3<\/span>/);
    });

    it('carries the words of the count as its hover words', () => {
        const { body } = render(TreeItem, {
            context,
            props: { ...counted, badge: true, countTitle: '3 changes' }
        });

        expect(body).toMatch(/class="count[^"]*"[^>]*title="3 changes"/);
        expect(render(TreeItem, { context, props: counted }).body).not.toContain('title="3');
    });

    it('draws a section head with the badge it is given', () => {
        const rows = markup('<li role="none">one</li>');
        const { body } = render(TreeSection, {
            context,
            props: {
                label: 'Notes',
                id: 'head',
                count: 2,
                badge: true,
                ontoggle: noop,
                open: true,
                children: rows
            }
        });

        expect(body).toMatch(/class="count[^"]*\bbadge\b[^"]*"[^>]*>2<\/span>/);
    });
});

describe('the parts of a row beyond its name', () => {
    it('draws the end before the controls when the row is trailing, and after the count otherwise', () => {
        const end = markup('<span data-tail>pills</span>');
        const props = { label: 'commit', onclick: noop, actions: control, count: 1, end };
        const plain = render(TreeItem, { context, props }).body;
        const trailing = render(TreeItem, { context, props: { ...props, trailing: true } }).body;

        expect(plain.indexOf('data-tail')).toBeGreaterThan(plain.indexOf('class="actions'));
        expect(trailing.indexOf('data-tail')).toBeLessThan(trailing.indexOf('class="actions'));
    });

    it('draws a strong row with no check, and a row in force with its check', () => {
        const strong = render(TreeItem, {
            context,
            props: { label: 'HEAD commit', strong: true, onclick: noop }
        }).body;
        const current = render(TreeItem, {
            context,
            props: { label: 'main', current: true, onclick: noop }
        }).body;

        expect(itemTag(strong)).toContain('strong');
        expect(strong).not.toContain('class="mark');
        expect(itemTag(current)).not.toContain('strong');
        expect(current).toContain('class="mark');
    });

    it('draws a struck row and the style of its name', () => {
        const { body } = render(TreeItem, {
            context,
            props: {
                label: 'gone.txt',
                struck: true,
                nameStyle: '--tone-txt: var(--c-scm-deleted-txt)',
                onclick: noop
            }
        });

        expect(itemTag(body)).toContain('struck');
        expect(body).toMatch(
            /class="name[^"]*"[^>]*style="--tone-txt: var\(--c-scm-deleted-txt\)"/
        );
        expect(
            itemTag(render(TreeItem, { context, props: { label: 'kept.txt' } }).body)
        ).not.toContain('struck');
    });

    it('lets the controls of a yielding row give way before the name', () => {
        const { body } = render(TreeItem, {
            context,
            props: {
                label: 'hub',
                onclick: noop,
                actions: control,
                yielding: true,
                showActions: true
            }
        });

        expect(body).toMatch(/class="actions[^"]*\byielding\b/);
        expect(body).toMatch(/class="actions[^"]*\bshown\b/);
    });
});

describe('the look of a row, read from the source', () => {
    const source = readFileSync('src/lib/ui/tree/TreeItem.svelte', 'utf8');
    const rule = (selector: string): string => {
        const at = source.indexOf(`${selector} {`);
        return at < 0 ? '' : source.slice(at, source.indexOf('}', at));
    };

    it('audits that draws a heading row in capitals, not small capitals, at weight 700 in the ink', () => {
        const heading = rule('.heading .main');

        expect(heading).toContain('text-transform: uppercase');
        expect(heading).toContain('font-weight: 700');
        expect(source).not.toContain('small-caps');
        expect(rule('.heading:not(.selected) .main')).toBe('');
    });

    it('audits that draws the detail, the count and the end at the small size, as every tree view does', () => {
        expect(rule('.detail,\n    .count,\n    .end')).toContain('font-size: var(--fs-sm)');
    });

    it('audits that sets its own background as `--row-bg` in each state, the values a graph row repeats for its lanes', () => {
        expect(source).toContain('--row-bg: var(--panel)');
        expect(source).toContain('--row-bg: var(--chip)');
        expect(source).toContain('--row-bg: var(--accent-bg)');
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
