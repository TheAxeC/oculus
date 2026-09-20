// The workbench rendered to HTML on the server: the rail, the page's tree, a tab strip over every
// pane, the sashes, the strip a collapsed child is drawn as, the view each pane is showing, and the
// one pane a maximised workbench draws instead of all of them. Two views are registered here rather
// than the application's own, so what is checked is the shell and not what a view happens to draw.
//
// What this does NOT cover: the theme effect, the menus opening, the drags. There is no DOM in this
// suite, so an $effect never runs and a pointer is never pressed; applyTheme is covered on its own
// in tests/ui/theme.test.ts, the drag store is tests/state/drag.test.ts, and the drag itself is
// checked in a browser. The insertion mark below is rendered from a prop, not from a pointer.

import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import DropLayer from '../../src/lib/shell/DropLayer.svelte';
import Workbench from '../../src/lib/shell/Workbench.svelte';
import { activeLabel, windowTitle } from '../../src/lib/shell/workbench-title.ts';
import Tabs from '../../src/lib/ui/Tabs.svelte';
import {
    horizontalWheelDelta,
    insertionIndex,
    tabScrollState
} from '../../src/lib/ui/tab-strip.ts';
import { THRESHOLD, type Drop } from '../../src/lib/state/drag.svelte.ts';
import Alpha from './fixtures/Alpha.svelte';
import Beta from './fixtures/Beta.svelte';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { glyph, setCatalog, setGlyphs, setIcons, t } from '../../src/lib/state/text.ts';
import { installBadges } from '../state/rail-badges-fixture.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import type { Layout, Workbench as Bench } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';
import { present } from '../present.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let cancel: ClientState['drag']['cancel'];
let hover: ClientState['drag']['hover'];
let move: ClientState['drag']['move'];
let start: ClientState['drag']['start'];
let registerView: ClientState['registry']['registerView'];
let message: ClientState['entities']['message'];
let receive: ClientState['entities']['receive'];
let apply: ClientState['layout']['apply'];
let closePage: ClientState['layout']['closePage'];
let currentPage: ClientState['layout']['currentPage'];
let openPage: ClientState['layout']['openPage'];
let pages: ClientState['layout']['pages'];
let switchPage: ClientState['layout']['switchPage'];

beforeEach(() => {
    client = createClientState();
    ({ cancel, hover, move, start } = client.drag);
    ({ registerView } = client.registry);
    ({ message, receive } = client.entities);
    ({ apply, closePage, currentPage, openPage, pages, switchPage } = client.layout);
    installFixture();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    registerView({
        id: 'alpha',
        label: 'views.status',
        glyph: 'views.status_glyph',
        component: Alpha,
        group: 'probe',
        order: 0
    });
    registerView({
        id: 'beta',
        label: 'views.findings',
        glyph: 'views.findings_glyph',
        component: Beta,
        group: 'probe',
        order: 1
    });
}

function pane(id: string, view: string, state: unknown = {}): Layout {
    return { kind: 'pane', tabs: [{ id, view, state }], active: id };
}

/** Two panes side by side, and a third under the second of them: three panes in one tree. */
function bench(folded?: number[]): Bench {
    const inner: Layout = {
        kind: 'split',
        dir: 'col',
        sizes: [0.7, 0.3],
        children: [pane('two', 'beta'), pane('three', 'beta')]
    };
    const root: Layout = {
        kind: 'split',
        dir: 'row',
        sizes: [0.5, 0.5],
        children: [pane('one', 'alpha'), inner]
    };
    return { root: folded === undefined ? root : { ...root, folded } };
}

function html(folded?: number[], groups: { id: string; label: string }[] = []): string {
    apply(bench(folded));
    return render(Workbench, { context: clientContext(client), props: { groups } }).body;
}

let whole: string;
beforeEach(() => {
    whole = html();
});

/** Milliseconds the one import of every view is given, which is not what a case is measured on. */
const IMPORT_MS = 60000;

describe('the workbench', () => {
    it('uses the instance label for the active main tab title', () => {
        const label = activeLabel(client.registry, {
            id: 'pinned',
            view: 'alpha',
            state: { label: 'Pinned session' }
        });
        expect(label).toBe('Pinned session');
        expect(windowTitle(0, label)).toBe('axel@research: ~/Pinned session');
    });

    it('uses the registered label when the instance has no nonempty label', () => {
        for (const state of [null, {}, { label: '' }, { label: 3 }]) {
            expect(activeLabel(client.registry, { id: 'one', view: 'alpha', state })).toBe(
                'Status'
            );
        }
    });

    it('names an unknown view and handles an empty main tree', () => {
        expect(activeLabel(client.registry, { id: 'unknown', view: 'from-2027', state: {} })).toBe(
            'Unknown view: from-2027'
        );
        expect(activeLabel(client.registry, null)).toBe('oculus');
    });

    it('names a view id that was renamed the same way, so a saved tab says what it holds', () => {
        expect(activeLabel(client.registry, { id: 'held', view: 'programs', state: {} })).toBe(
            'Unknown view: programs'
        );
    });

    it('builds the active main tab title with the configured host and a leading waiting count', () => {
        expect(windowTitle(0, 'Status')).toBe('axel@research: ~/Status');
        expect(windowTitle(2, 'Status')).toBe('oculus (2 waiting) | axel@research: ~/Status');
    });

    it('draws one rail button per registered view', () => {
        const rail = [...whole.matchAll(/data-view="([^"]*)"/g)].map((match) => match[1]);
        expect(rail).toEqual(['alpha', 'beta']);
    });

    it('includes the catalog-backed keyboard sheet in the workbench markup', () => {
        const source = readFileSync('src/lib/shell/Workbench.svelte', 'utf8');
        expect(source).toContain("title={t('app.keys.title')}");
        expect(source).toContain("hint={t('app.keys.hint')}");
        expect(source).toContain("rows={t('app.keys.rows')}");
        expect(source).toContain('<KeySheet');
    });

    // Four strips, not three: the page strip over the whole area is drawn with the same primitive,
    // and the one page it draws is one more tab.
    it('draws a tab strip over every pane of the tree', () => {
        expect([...whole.matchAll(/role="tablist"/g)]).toHaveLength(4);
        expect([...whole.matchAll(/role="tab"/g)]).toHaveLength(4);
    });

    it('carries every pane path on its own element, which is how a key reaches its tabs', () => {
        const paths = [...whole.matchAll(/data-pane-path="([^"]*)"/g)].map((match) => match[1]);
        expect(paths).toEqual(['0', '1.0', '1.1']);
    });

    it('draws the page strip above the area, and the current page in it', () => {
        expect(whole.indexOf('aria-label="Pages"')).toBeLessThan(whole.indexOf('class="area'));
        expect(whole).toContain('Page 1');
    });

    it('draws the tree of the page on screen and nothing of the page beside it', () => {
        const first = currentPage().id;
        apply(bench());
        openPage('Page 2');
        expect(
            render(Workbench, { context: clientContext(client), props: { groups: [] } }).body
        ).not.toContain('data-alpha="one"');
        switchPage(first);
        expect(
            render(Workbench, { context: clientContext(client), props: { groups: [] } }).body
        ).toContain('data-alpha="one"');
        closePage(pages()[1].id);
    });

    it('labels each tab from the registry', () => {
        expect(whole).toContain('Status');
        expect(whole).toContain('Findings');
    });

    it('uses an instance label on the tab and keeps the view name in its tooltip', () => {
        apply({ root: pane('pinned', 'alpha', { session: 'one', label: 'Pinned session' }) });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        expect(body).toMatch(/Pinned session.*class="bubble[^"]*"[^>]*>Status</s);
    });

    it('mounts the active instance of every pane', () => {
        expect(whole).toContain('data-alpha="one"');
        expect(whole).toContain('data-beta="two"');
        expect(whole).toContain('data-beta="three"');
    });

    it('puts a sash between the children of every split', () => {
        expect([...whole.matchAll(/role="separator"/g)]).toHaveLength(2);
    });

    it('gives every child of a split its own share of the space', () => {
        expect(whole).toContain('flex: 0.5 1 0');
        expect(whole).toContain('flex: 0.7 1 0');
        expect(whole).toContain('flex: 0.3 1 0');
    });

    it('draws a folded pane as a strip with its expand control and the name of its tab', () => {
        const collapsed = html([0]);
        expect(collapsed).toContain('data-fold');
        expect(collapsed).toMatch(/data-fold-label[^>]*>Status</);
        expect(collapsed).toContain('aria-label="Expand pane"');
        // The pane itself is not drawn, and neither is the sash that separated it.
        expect(collapsed).not.toContain('data-alpha="one"');
        expect(collapsed).toContain('data-beta="two"');
        expect([...collapsed.matchAll(/role="separator"/g)]).toHaveLength(1);
        expect([...collapsed.matchAll(/role="tablist"/g)]).toHaveLength(3);
    });

    it('draws a folded split as the strip with its control alone: it has no one tab to name', () => {
        const collapsed = html([1]);
        expect(collapsed).toContain('aria-label="Expand pane"');
        expect(collapsed).not.toContain('data-fold-label');
        expect(collapsed).not.toContain('data-beta="two"');
        expect(collapsed).not.toContain('data-beta="three"');
        expect([...collapsed.matchAll(/role="separator"/g)]).toHaveLength(0);
        expect([...collapsed.matchAll(/role="tablist"/g)]).toHaveLength(2);
    });

    it('groups a rail button under a group that names it, and leaves the rest ungrouped', () => {
        const grouped = html(undefined, [{ id: 'probe', label: 'Portfolio' }]);
        expect(grouped).toContain('Portfolio');
        expect([...grouped.matchAll(/data-view="([^"]*)"/g)].map((match) => match[1])).toEqual([
            'alpha',
            'beta'
        ]);
    });

    it('draws no heading for a group no registered view belongs to', () => {
        const grouped = html(undefined, [{ id: 'nothing', label: 'Nothing here' }]);
        expect(grouped).not.toContain('Nothing here');
    });

    // A Menu draws its opener and nothing else until it is opened, so the items behind it (close,
    // maximise, the fold and the two splits) are not in this HTML. They are checked in the
    // browser, where the menu can be opened.
    it('puts a pane menu at the right of every tab strip', () => {
        expect([...whole.matchAll(/aria-label="Pane"/g)]).toHaveLength(3);
        // The three pane menus, the page strip's, and the theme menu at the foot of the rail.
        expect([...whole.matchAll(/aria-haspopup="menu"/g)]).toHaveLength(5);
    });

    // Revert: take the ToolButton out of PaneView.svelte's paneMenu snippet, or give it no tabindex.
    it("draws the pane header's split button beside every pane menu, out of the focus order", () => {
        const splits = [
            ...whole.matchAll(/<button[^>]*aria-label="Split tab to the right"[^>]*>/g)
        ];
        expect(splits).toHaveLength(3);
        for (const one of splits) expect(one[0]).toContain('tabindex="-1"');
        for (const path of ['0', '1.0', '1.1']) {
            const pane = whole.slice(whole.indexOf(`data-pane-path="${path}"`));
            expect(pane.indexOf('Split tab to the right')).toBeLessThan(
                pane.indexOf('aria-label="Pane"')
            );
        }
    });

    // Revert: point PaneView.svelte's menu at `ui.pane_menu_glyph`, or its button at another glyph.
    it('draws the split button with the split glyph and the pane menu opener with the more glyph', () => {
        const button = (label: string): string => {
            const at = whole.indexOf(`aria-label="${label}"`);
            return whole.slice(at, whole.indexOf('</button>', at));
        };
        expect(button('Split tab to the right')).toContain(glyph('split_right'));
        expect(button('Pane')).toContain(glyph('more'));
        expect(button('Pane')).not.toContain(glyph('list'));
    });

    // Revert: drop `dirty: unsaved(instance.id)` from PaneView.svelte's tabs.
    it('marks the pane tab the ui store answers unsaved for, and names it so', () => {
        client.ui.registerUnsaved((id) => id === 'two');
        const body = html();
        const panes = body.slice(body.indexOf('class="area'));
        const marked = [...panes.matchAll(/<div class="tab[^"]*dirty[^"]*"[^>]*>/g)];
        expect(marked).toHaveLength(1);
        const two = panes.slice(
            panes.indexOf('data-pane-path="1.0"'),
            panes.indexOf('data-pane-path="1.1"')
        );
        expect(two).toMatch(/class="tab[^"]*dirty/);
        expect(two).toContain(`aria-label="${t('ui.tab_unsaved', 'Findings')}"`);
    });

    // Revert: set `dirty` to false in PageStrip.svelte's tabOf.
    it('marks the page holding that tab in the page strip, and names it so', () => {
        const clean = html();
        const strip = (body: string): string =>
            body.slice(body.indexOf('aria-label="Pages"'), body.indexOf('class="area'));
        expect(strip(clean)).not.toMatch(/class="tab[^"]*dirty/);
        client.ui.registerUnsaved((id) => id === 'two');
        const marked = strip(html());
        expect(marked).toMatch(/class="tab[^"]*dirty/);
        expect(marked).toContain(`aria-label="${t('ui.tab_unsaved', 'Page 1')}"`);
    });

    // Revert: drop `focused={activePane}` from PaneView.svelte's Tabs.
    it("draws the active pane's strip focused and every other pane's strip unfocused", () => {
        const strips = (body: string): string[] =>
            ['0', '1.0', '1.1'].map((path) => {
                const pane = body.slice(body.indexOf(`data-pane-path="${path}"`));
                return (
                    /<div class="(strip[^"]*)"/.exec(pane)?.[1].replace(/\s*svelte-\S+/g, '') ?? ''
                );
            });
        expect(strips(whole)).toEqual(['strip', 'strip unfocused', 'strip unfocused']);
        client.layout.activateInstance('three');
        const moved = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        expect(strips(moved)).toEqual(['strip unfocused', 'strip unfocused', 'strip']);
    });

    // A pinned instance is one whose state carries a session and a label.
    // Revert: draw `registrationLabel(found)` as every tab's label in PaneView.svelte.
    it("draws a pinned instance's tab under the label its state carries, with no mark of its own", () => {
        apply({ root: pane('pinned', 'alpha', { session: 'one', label: 'Pinned session' }) });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        const panes = body.slice(body.indexOf('class="area'));
        const start = panes.indexOf('<div class="tab ');
        const tab = panes.slice(start, panes.indexOf('</button>', start));
        expect(tab).toContain('>Pinned session</span>');
        expect(/^<div class="([^"]*)"/.exec(tab)?.[1].replace(/\s*svelte-\S+/g, '')).toBe(
            'tab current'
        );
        expect(tab).toContain('class="glyph');
    });
});

describe('a maximised pane', () => {
    /** The workbench of the tests above with one of its panes maximised. */
    function zoomed(path: number[]): string {
        apply({ ...bench(), focus: { path } });
        return render(Workbench, { context: clientContext(client), props: { groups: [] } }).body;
    }

    let one: string;
    beforeEach(() => {
        one = zoomed([1, 0]);
    });

    it('draws the focused pane and no other', () => {
        expect(one).toContain('data-beta="two"');
        expect(one).not.toContain('data-alpha="one"');
        expect(one).not.toContain('data-beta="three"');
        expect([...one.matchAll(/role="tablist"/g)]).toHaveLength(2);
    });

    it('draws no sash at all, since no split is shown', () => {
        expect([...one.matchAll(/role="separator"/g)]).toHaveLength(0);
    });

    it('carries the pane menu of the one pane it draws', () => {
        expect([...one.matchAll(/aria-label="Pane"/g)]).toHaveLength(1);
    });

    it('draws a pane deeper in the tree the same way', () => {
        const deeper = zoomed([1, 1]);
        expect(deeper).toContain('data-beta="three"');
        expect(deeper).not.toContain('data-alpha="one"');
    });

    it('draws the whole workbench again when the focus names no pane', () => {
        // [0, 0] is inside a pane, which is no node at all, and the arrangement is drawn whole.
        const stale = zoomed([0, 0]);
        expect([...stale.matchAll(/role="tablist"/g)]).toHaveLength(4);
    });
});

// The layer is rendered from the drag store, so a drag driven by its own calls is enough to draw
// one. What is checked is the rectangle it puts over the pane body, which is where a drop on an
// edge says the new pane would go.
describe('the drop layer', () => {
    const body = { x: 100, y: 50, width: 400, height: 200 };

    function layer(drop: Drop | null): string {
        cancel();
        start('one', 'Status', { x: 0, y: 0 });
        move({ x: THRESHOLD, y: 0 });
        if (drop !== null) hover(drop, body);
        const html = render(DropLayer, { context: clientContext(client), props: {} }).body;
        cancel();
        return html;
    }

    function style(html: string): string {
        return /class="target[^"]*" style="([^"]*)"/.exec(html)?.[1] ?? '';
    }

    it('draws the ghost beside the pointer, with the tab it is carrying', () => {
        expect(layer(null)).toContain('Moving Status');
    });

    it('covers the half of the body a new pane would take, on each edge', () => {
        const at = (edge: 'left' | 'right' | 'top' | 'bottom') =>
            style(layer({ kind: 'edge', path: [], edge }));
        expect(at('left')).toBe('left: 100px; top: 50px; width: 200px; height: 200px');
        expect(at('right')).toBe('left: 300px; top: 50px; width: 200px; height: 200px');
        expect(at('top')).toBe('left: 100px; top: 50px; width: 400px; height: 100px');
        expect(at('bottom')).toBe('left: 100px; top: 150px; width: 400px; height: 100px');
    });

    it('covers the whole body for a drop in the middle of it', () => {
        expect(style(layer({ kind: 'centre', path: [] }))).toBe(
            'left: 100px; top: 50px; width: 400px; height: 200px'
        );
    });

    it('draws no rectangle for a drop on a strip, which draws its own mark', () => {
        expect(style(layer({ kind: 'strip', path: [], index: 0 }))).toBe('');
    });

    it('draws nothing at all when no drag is in progress', () => {
        cancel();
        expect(render(DropLayer, { context: clientContext(client), props: {} }).body).not.toContain(
            'Moving'
        );
    });
});

describe('the insertion mark', () => {
    function strip(dropIndex: number | null): string {
        return render(Tabs, {
            context: clientContext(client),
            props: {
                tabs: [
                    { id: 'one', label: 'One' },
                    { id: 'two', label: 'Two' }
                ],
                active: 'one',
                onselect: noop,
                onclose: noop,
                dropIndex
            }
        }).body;
    }

    /** The mark carries svelte's scoping class beside its own, so the class list is matched. */
    const MARK = /class="mark[^"]*"/g;

    it('is drawn where a dropped tab would land, and nowhere when nothing is hovered', () => {
        expect([...strip(0).matchAll(MARK)]).toHaveLength(1);
        expect([...strip(null).matchAll(MARK)]).toHaveLength(0);
    });

    it('is drawn at the end of the strip for an index past the last tab', () => {
        const end = strip(2);
        expect(end.search(MARK)).toBeGreaterThan(end.indexOf('Two'));
        const front = strip(0);
        expect(front.search(MARK)).toBeLessThan(front.indexOf('One'));
    });

    it('lands before the tab whose middle the pointer has not passed', () => {
        const midpoints = [20, 60, 100];
        expect(insertionIndex(midpoints, 0)).toBe(0);
        expect(insertionIndex(midpoints, 19)).toBe(0);
        expect(insertionIndex(midpoints, 21)).toBe(1);
        expect(insertionIndex(midpoints, 99)).toBe(2);
        expect(insertionIndex(midpoints, 400)).toBe(3);
        expect(insertionIndex([], 400)).toBe(0);
    });

    it('draws both overflow controls hidden until the client measures the strip', () => {
        const body = strip(null);
        expect(body).toContain('aria-label="Scroll tabs left"');
        expect(body).toContain('aria-label="Scroll tabs right"');
        expect([...body.matchAll(/class="scroll-control[^"]*" hidden/g)]).toHaveLength(2);
    });

    it('derives overflow edges and horizontal wheel travel from browser measurements', () => {
        expect(tabScrollState(300, 100, 0)).toEqual({
            overflowing: true,
            atStart: true,
            atEnd: false
        });
        expect(tabScrollState(300, 100, 100)).toEqual({
            overflowing: true,
            atStart: false,
            atEnd: false
        });
        expect(tabScrollState(300, 100, 200)).toEqual({
            overflowing: true,
            atStart: false,
            atEnd: true
        });
        expect(tabScrollState(100, 100, 0).overflowing).toBe(false);
        expect(horizontalWheelDelta(2, 20)).toBe(20);
        expect(horizontalWheelDelta(-30, 4)).toBe(-30);
    });

    it('hides controls when shrinking tabs fit the width available without controls', () => {
        // A 210 px strip has a 170 px viewport while its two controls take 40 px.
        expect(tabScrollState(190, 170, 0, 210).overflowing).toBe(false);
        expect(tabScrollState(230, 170, 0, 210).overflowing).toBe(true);
    });

    it('draws a badge that is a mark as an icon inside the tab badge', () => {
        setIcons(iconSet(config));
        try {
            const body = render(Tabs, {
                context: clientContext(client),
                props: {
                    tabs: [{ id: 'one', label: 'One', badgeGlyph: 'bang', badgeTone: 'red' }],
                    active: 'one',
                    onselect: noop,
                    onclose: noop
                }
            }).body;
            const at = body.indexOf('class="tab-badge');
            expect(at).toBeGreaterThan(-1);
            const badge = body.slice(
                body.lastIndexOf('<span', at),
                body.indexOf('</span>', body.indexOf('</svg>', at)) + 7
            );
            expect(badge).toContain('<svg');
            expect(badge.replace(/<[^>]*>/g, '').trim()).toBe('');
        } finally {
            setIcons({});
        }
    });

    it('draws an aria-hidden badge and split cells without changing the tab name', () => {
        const body = render(Tabs, {
            context: clientContext(client),
            props: {
                tabs: [
                    {
                        id: 'one',
                        label: 'One',
                        badge: '3',
                        badgeTone: 'red',
                        badgeTitle: 'active: 2 | idea: 1',
                        cells: [
                            { count: 2, color: 'green', label: 'active' },
                            { count: 1, color: 'violet', label: 'idea' }
                        ]
                    }
                ],
                active: 'one',
                onselect: noop,
                onclose: noop
            }
        }).body;
        expect(body).toMatch(/class="tab-badge[^>]*aria-hidden="true"/);
        expect(body).toMatch(/class="cells[^>]*aria-hidden="true"/);
        expect(body).toContain('--tab-badge-bg: var(--c-red)');
        expect(body).toContain('--cell-bg: var(--c-green)');
        expect(body).toContain('--cell-bg: var(--c-violet)');
        expect(body).toContain('title="active: 2 | idea: 1"');
        expect(body).toContain('role="tab" aria-selected="true"');
    });
});

// The two the application registers, mounted through the same shell with the real catalog and the
// real glyph vocabulary: a label key, a glyph key or a glyph name that did not resolve would throw
// here. The registrations arrive by importing the route loader in this block's own setup rather than
// in a case, so that the rail above still sees only the two views this file registered and no case
// is timed against the cost of compiling every view.
describe('the views the application registers', () => {
    // Every view of the application is compiled here, which on a loaded machine is slower than the
    // per-case timeout the assertions are measured against.
    let registerAll: (registry: ClientState['registry']) => void;

    beforeAll(async () => {
        ({ registerAll } = await import('../../src/routes/views.ts'));
    }, IMPORT_MS);

    beforeEach(() => {
        registerAll(client.registry);
    });

    it('mounts status and findings with nothing yet delivered on either channel', () => {
        apply({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [pane('m', 'status'), pane('p', 'findings')]
            }
        });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        expect(body).toContain('Waiting for the first snapshot');
        expect(body).toContain('No findings');
    });

    it('shows a saved view no registration knows as an unknown view, with an empty body', () => {
        apply({ root: pane('m', 'from-2027') });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        expect(body).toContain('Unknown view: from-2027');
        expect(body).not.toContain('data-alpha');
    });

    /** The pane tab's button, excluding the activity rail and the mounted view body. */
    function tabOf(body: string, label: string): string {
        const found = [...body.matchAll(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g)]
            .map(([button]) => button)
            .find((button) => button.includes(`>${label}</span>`));
        expect(found).toBeDefined();
        return present(found, `tab ${label}`);
    }

    it.each([false, true])(
        'renders a registered board badge and cells through Workbench (empty: %s)',
        (empty) => {
            installBadges(client, config, empty);
            setVocab(config);
            apply({ root: pane('q6', 'projects') });
            const tab = tabOf(
                render(Workbench, { context: clientContext(client), props: { groups: [] } }).body,
                'Projects'
            );
            expect(tab).toMatch(
                new RegExp(
                    `class="tab-badge[^>]*aria-hidden="true"[^>]*>\\s*${empty ? '0' : '2'}\\s*</span>`
                )
            );
            expect(tab).toMatch(/class="cells[^>]*aria-hidden="true"/);
            expect(tab).toContain(
                `title="active: ${empty ? 0 : 1} | manuscript: 0 | idea: ${empty ? 0 : 1}"`
            );
            expect([...tab.matchAll(/class="cell\s/g)]).toHaveLength(3);
            for (const tone of ['green', 'amber', 'violet']) {
                expect(tab).toContain(`--cell-bg: var(--c-${tone})`);
                expect(tab).toContain(`--cell-fg: var(--on-c-${tone})`);
            }
            const accessible = tab
                .replace(/<span class="cells[\s\S]*<\/span>/, '')
                .replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            expect(accessible).toBe('Projects');
        }
    );

    it('renders HPC cells without a pane count pill and hides both when the queue is empty', () => {
        for (const total of [3, 0]) {
            receive({
                channel: 'hpc',
                version: (message('hpc')?.version ?? 0) + 1,
                payload: { status: 'ok', total, running: total ? 2 : 0, pending: total ? 1 : 0 }
            });
            apply({
                root: {
                    kind: 'pane',
                    tabs: [
                        { id: 'q6-hpc', view: 'hpc', state: {} },
                        { id: 'a', view: 'alpha', state: {} }
                    ],
                    active: 'a'
                }
            });
            const body = render(Workbench, {
                context: clientContext(client),
                props: { groups: [] }
            }).body;
            const tab = tabOf(body, 'Live HPC');
            expect(tab).not.toContain('class="tab-badge');
            if (total) {
                expect(tab).toContain('title="running: 2 | pending: 1"');
                expect([...tab.matchAll(/class="cell\s/g)]).toHaveLength(2);
                expect(body).toMatch(
                    /class="badge[^>]*title="running: 2 \| pending: 1"[^>]*>\s*2 1\s*</
                );
            } else {
                expect(tab).not.toContain('class="cells');
            }
        }
    });
});

// A page shown at a spot of another page's tree. The leaf draws that page's own workbench, so its
// panes are the nested page's panes: each carries the page it belongs to beside its path in it,
// which is the pair every store call the pane makes is named by.
describe('a page shown inside another', () => {
    /** Two children side by side, the shape both pages take in these cases. */
    function split(first: Layout, second: Layout): Layout {
        return { kind: 'split', dir: 'row', sizes: [0.5, 0.5], children: [first, second] };
    }

    /** Page 2 holding one pane, shown inside page 1 beside a pane of its own. */
    function nested(): { host: string; shown: string; body: string } {
        const host = currentPage().id;
        apply(bench());
        openPage('Page 2');
        const shown = currentPage().id;
        apply({ root: pane('four', 'beta') });
        switchPage(host);
        apply({
            root: {
                kind: 'split',
                dir: 'row',
                sizes: [0.5, 0.5],
                children: [pane('one', 'alpha'), { kind: 'page', page: shown }]
            }
        });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        return { host, shown, body };
    }

    it('names the page in the leaf header, over the tree of that page', () => {
        const { shown, body } = nested();
        expect(body).toContain(`data-page-leaf="${shown}"`);
        expect(/data-page-leaf-label[^>]*>([^<]*)</.exec(body)?.[1]).toBe('Page 2');
        expect(body).toContain('aria-label="Stop showing this page here"');
    });

    it('carries the page of every pane beside its path in the tree of that page', () => {
        const { host, shown, body } = nested();
        const drawn = [
            ...body.matchAll(/data-pane-path="([^"]*)"\s+data-pane-page="([^"]*)"/g)
        ].map((match) => [match[1], match[2]]);
        expect(drawn).toEqual([
            ['0', host],
            ['', shown]
        ]);
    });

    it('names the page in the strip when the leaf showing it is folded', () => {
        const { shown } = nested();
        const root = currentPage().workbench.root;
        apply({ root: root.kind === 'split' ? { ...root, folded: [1] } : root });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        expect(body).not.toContain(`data-page-leaf="${shown}"`);
        expect(/data-fold-label[^>]*>([^<]*)</.exec(body)?.[1]).toBe('Page 2');
    });

    it('marks the drop in the one pane whose page and path the drop names', () => {
        const { host, shown } = nested();
        // Both pages hold a pane at [0], so only the page in the drop tells the two apart.
        apply({ root: split(pane('four', 'beta'), pane('five', 'beta')) }, shown);
        apply({
            root: split(pane('one', 'alpha'), { kind: 'page', page: shown })
        });
        cancel();
        start('one', 'Status', { x: 0, y: 0 });
        move({ x: THRESHOLD, y: 0 });
        hover({ kind: 'strip', path: [0], index: 1, page: shown });
        const body = render(Workbench, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        cancel();
        const marks = [...body.matchAll(/class="mark[^"]*"/g)];
        expect(marks).toHaveLength(1);
        // The mark sits in the nested page's first pane, which is the one the drop named.
        expect(body.indexOf('data-page-leaf')).toBeLessThan(marks[0].index);
        expect(host).not.toBe(shown);
    });

    // Answer with the active instance of the page the strip is on and the pane inside the leaf
    // never draws its strip focused, wherever the reader is.
    // revert: src/lib/state/layout.svelte.ts:417 => return instances.activeInstance();
    it('draws the strip of the one pane the rail opens into, on whichever page the reader is in', () => {
        const { host, shown } = nested();
        /** The strip class of the pane the named page draws, the host's first and the leaf's after it. */
        const strips = (body: string): string[] =>
            [host, shown].map((id) => {
                const pane = body.slice(body.indexOf(`data-pane-page="${id}"`));
                return (
                    /<div class="(strip[^"]*)"/.exec(pane)?.[1].replace(/\s*svelte-\S+/g, '') ?? ''
                );
            });
        const drawn = (): string =>
            render(Workbench, { context: clientContext(client), props: { groups: [] } }).body;

        // The reader is in the page the strip is on, so its own active pane is the one marked.
        expect(strips(drawn())).toEqual(['strip', 'strip unfocused']);
        // A press inside the page drawn at the leaf moves where a view lands, and the mark with it.
        client.layout.touchPane(shown);
        expect(strips(drawn())).toEqual(['strip unfocused', 'strip']);
    });

    it('draws the tabs of both pages at once, the ones of the nested page among them', () => {
        const { body } = nested();
        expect(body).toContain('Status');
        expect(body).toContain('Findings');
    });
});
