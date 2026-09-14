// The workbench rendered to HTML on the server: the rail, both trees, a tab strip over every pane,
// the sashes, the view each pane is showing, and the one pane a maximised workbench draws instead
// of all of them. Two views are registered here rather than the application's own, so what is
// checked is the shell and not what a view happens to draw.
//
// What this does NOT cover: the theme effect, the menus opening, the drags. There is no DOM in this
// suite, so an $effect never runs and a pointer is never pressed; applyTheme is covered on its own
// in tests/ui/theme.test.ts, the drag store is tests/state/drag.test.ts, and the drag itself is
// checked in a browser. The insertion mark below is rendered from a prop, not from a pointer.

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import DropLayer from '../../src/lib/shell/DropLayer.svelte';
import Workbench, { activeLabel, windowTitle } from '../../src/lib/shell/Workbench.svelte';
import Tabs, {
    horizontalWheelDelta,
    insertionIndex,
    tabScrollState
} from '../../src/lib/ui/Tabs.svelte';
import {
    THRESHOLD,
    cancel,
    hover,
    move,
    start,
    type Drop
} from '../../src/lib/state/drag.svelte.ts';
import Alpha from './fixtures/Alpha.svelte';
import Beta from './fixtures/Beta.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { registerView } from '../../src/lib/views/registry.ts';
import { installBadges } from '../state/rail-badges-fixture.ts';
import { message, receive } from '../../src/lib/state/entities.svelte.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import {
    apply,
    closePage,
    currentPage,
    openPage,
    pages,
    switchPage
} from '../../src/lib/state/layout.svelte.ts';
import type { Dock, Layout, Workbench as Bench } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

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

function pane(id: string, view: string, state: unknown = {}): Layout {
    return { kind: 'pane', tabs: [{ id, view, state }], active: id };
}

/** Two panes side by side in the main area, one pane in the panel. */
function bench(dock: Dock): Bench {
    return {
        main: {
            kind: 'split',
            dir: 'row',
            sizes: [0.5, 0.5],
            children: [pane('one', 'alpha'), pane('two', 'beta')]
        },
        panel: pane('three', 'beta'),
        dock,
        panelSize: 0.3
    };
}

function html(dock: Dock, groups: { id: string; label: string }[] = []): string {
    apply(bench(dock));
    return render(Workbench, { props: { groups } }).body;
}

const docked = html('right');

/** Milliseconds the one import of every view is given, which is not what a case is measured on. */
const IMPORT_MS = 60000;

describe('the workbench', () => {
    it('uses the instance label for the active main tab title', () => {
        const label = activeLabel({
            id: 'pinned',
            view: 'alpha',
            state: { label: 'Pinned session' }
        });
        expect(label).toBe('Pinned session');
        expect(windowTitle(0, label)).toBe('axel@research: ~/Pinned session');
    });

    it('uses the registered label when the instance has no nonempty label', () => {
        for (const state of [null, {}, { label: '' }, { label: 3 }]) {
            expect(activeLabel({ id: 'one', view: 'alpha', state })).toBe('Status');
        }
    });

    it('names an unknown view and handles an empty main tree', () => {
        expect(activeLabel({ id: 'unknown', view: 'from-2027', state: {} })).toBe(
            'Unknown view: from-2027'
        );
        expect(activeLabel(null)).toBe('oculus');
    });

    it('builds the active main tab title with the configured host and a leading waiting count', () => {
        expect(windowTitle(0, 'Status')).toBe('axel@research: ~/Status');
        expect(windowTitle(2, 'Status')).toBe('oculus (2 waiting) | axel@research: ~/Status');
    });

    it('draws one rail button per registered view', () => {
        const rail = [...docked.matchAll(/data-view="([^"]*)"/g)].map((match) => match[1]);
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
    it('draws a tab strip over every pane of both trees', () => {
        expect([...docked.matchAll(/role="tablist"/g)]).toHaveLength(4);
        expect([...docked.matchAll(/role="tab"/g)]).toHaveLength(4);
    });

    it('draws the page strip above the area, and the current page in it', () => {
        expect(docked.indexOf('aria-label="Pages"')).toBeLessThan(docked.indexOf('class="area'));
        expect(docked).toContain('Page 1');
    });

    it('draws the trees of the page on screen and nothing of the page beside it', () => {
        const first = currentPage().id;
        apply(bench('right'));
        openPage('Page 2');
        expect(render(Workbench, { props: { groups: [] } }).body).not.toContain('data-alpha="one"');
        switchPage(first);
        expect(render(Workbench, { props: { groups: [] } }).body).toContain('data-alpha="one"');
        closePage(pages()[1].id);
    });

    it('labels each tab from the registry', () => {
        expect(docked).toContain('Status');
        expect(docked).toContain('Findings');
    });

    it('uses an instance label on the tab and keeps the view name in its tooltip', () => {
        apply({
            main: pane('pinned', 'alpha', { session: 'one', label: 'Pinned session' }),
            panel: pane('panel', 'beta'),
            dock: 'right',
            panelSize: 0.3
        });
        const body = render(Workbench, { props: { groups: [] } }).body;
        expect(body).toMatch(/Pinned session.*class="bubble[^"]*"[^>]*>Status</s);
    });

    it('mounts the active instance of every pane', () => {
        expect(docked).toContain('data-alpha="one"');
        expect(docked).toContain('data-beta="two"');
        expect(docked).toContain('data-beta="three"');
    });

    it('puts a sash inside the split and one between the main area and the panel', () => {
        expect([...docked.matchAll(/role="separator"/g)]).toHaveLength(2);
    });

    it('gives the panel its share of the window and the main area the rest', () => {
        expect(docked).toContain('flex: 0.3 1 0');
        expect(docked).toContain('flex: 0.7 1 0');
    });

    it('lays the panel out beside the main area, and below it when it is docked at the bottom', () => {
        expect(docked).toMatch(/class="area row/);
        expect(html('bottom')).toMatch(/class="area col/);
    });

    it('draws no panel and no second sash when the panel is hidden', () => {
        const hidden = html('hidden');
        expect(hidden).not.toContain('data-beta="three"');
        expect([...hidden.matchAll(/role="separator"/g)]).toHaveLength(1);
        expect([...hidden.matchAll(/role="tablist"/g)]).toHaveLength(3);
    });

    it('groups a rail button under a group that names it, and leaves the rest ungrouped', () => {
        const grouped = html('right', [{ id: 'probe', label: 'Portfolio' }]);
        expect(grouped).toContain('Portfolio');
        expect([...grouped.matchAll(/data-view="([^"]*)"/g)].map((match) => match[1])).toEqual([
            'alpha',
            'beta'
        ]);
    });

    it('draws no heading for a group no registered view belongs to', () => {
        const grouped = html('right', [{ id: 'nothing', label: 'Nothing here' }]);
        expect(grouped).not.toContain('Nothing here');
    });

    // A Menu draws its opener and nothing else until it is opened, so the items behind it (close,
    // maximise, the two moves and the two splits) are not in this HTML. They are checked in the
    // browser, where the menu can be opened.
    it('puts a pane menu at the right of every tab strip', () => {
        expect([...docked.matchAll(/aria-label="Pane"/g)]).toHaveLength(3);
        expect([...docked.matchAll(/aria-haspopup="menu"/g)]).toHaveLength(6);
    });
});

describe('a maximised pane', () => {
    /** The workbench of the tests above with one of the two main panes maximised. */
    function zoomed(path: number[], target: 'main' | 'panel'): string {
        apply({ ...bench('right'), focus: { target, path } });
        return render(Workbench, { props: { groups: [] } }).body;
    }

    const one = zoomed([1], 'main');

    it('draws the focused pane and no other', () => {
        expect(one).toContain('data-beta="two"');
        expect(one).not.toContain('data-alpha="one"');
        expect(one).not.toContain('data-beta="three"');
        expect([...one.matchAll(/role="tablist"/g)]).toHaveLength(2);
    });

    it('draws neither sash: no split is shown and the panel is not beside it', () => {
        expect([...one.matchAll(/role="separator"/g)]).toHaveLength(0);
    });

    it('carries the pane menu of the one pane it draws', () => {
        expect([...one.matchAll(/aria-label="Pane"/g)]).toHaveLength(1);
    });

    it('draws a maximised pane of the panel the same way', () => {
        const panel = zoomed([], 'panel');
        expect(panel).toContain('data-beta="three"');
        expect(panel).not.toContain('data-alpha="one"');
    });

    it('draws the whole workbench again when the focus names no pane', () => {
        // [0, 0] is inside a pane, which is no node at all, and the arrangement is drawn whole.
        const stale = zoomed([0, 0], 'main');
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
        start('one', 'main', 'Status', { x: 0, y: 0 });
        move({ x: THRESHOLD, y: 0 });
        if (drop !== null) hover(drop, body);
        const html = render(DropLayer, { props: {} }).body;
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
            style(layer({ kind: 'edge', target: 'main', path: [], edge }));
        expect(at('left')).toBe('left: 100px; top: 50px; width: 200px; height: 200px');
        expect(at('right')).toBe('left: 300px; top: 50px; width: 200px; height: 200px');
        expect(at('top')).toBe('left: 100px; top: 50px; width: 400px; height: 100px');
        expect(at('bottom')).toBe('left: 100px; top: 150px; width: 400px; height: 100px');
    });

    it('covers the whole body for a drop in the middle of it', () => {
        expect(style(layer({ kind: 'centre', target: 'main', path: [] }))).toBe(
            'left: 100px; top: 50px; width: 400px; height: 200px'
        );
    });

    it('draws no rectangle for a drop on a strip, which draws its own mark', () => {
        expect(style(layer({ kind: 'strip', target: 'main', path: [], index: 0 }))).toBe('');
    });

    it('draws nothing at all when no drag is in progress', () => {
        cancel();
        expect(render(DropLayer, { props: {} }).body).not.toContain('Moving');
    });
});

describe('the insertion mark', () => {
    function strip(dropIndex: number | null): string {
        return render(Tabs, {
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

    it('draws an aria-hidden badge and split cells without changing the tab name', () => {
        const body = render(Tabs, {
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
    beforeAll(async () => {
        await import('../../src/routes/views.ts');
    }, IMPORT_MS);

    it('mounts status and findings with nothing yet delivered on either channel', () => {
        apply({
            main: pane('m', 'status'),
            panel: pane('p', 'findings'),
            dock: 'right',
            panelSize: 0.3
        });
        const body = render(Workbench, { props: { groups: [] } }).body;
        expect(body).toContain('Waiting for the first snapshot');
        expect(body).toContain('No findings');
    });

    it('shows a saved view no registration knows as an unknown view, with an empty body', () => {
        apply({
            main: pane('m', 'from-2027'),
            panel: pane('p', 'findings'),
            dock: 'hidden',
            panelSize: 0.3
        });
        const body = render(Workbench, { props: { groups: [] } }).body;
        expect(body).toContain('Unknown view: from-2027');
        expect(body).not.toContain('data-alpha');
    });

    /** The pane tab's button, excluding the activity rail and the mounted view body. */
    function tabOf(body: string, label: string): string {
        const found = [...body.matchAll(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g)]
            .map(([button]) => button)
            .find((button) => button.includes(`>${label}</span>`));
        expect(found).toBeDefined();
        return found!;
    }

    it.each([false, true])(
        'renders a registered board badge and cells through Workbench (empty: %s)',
        (empty) => {
            installBadges(config, empty);
            setVocab(config);
            apply({
                main: pane('q6', 'projects'),
                panel: pane('p', 'findings'),
                dock: 'hidden',
                panelSize: 0.3
            });
            const tab = tabOf(render(Workbench, { props: { groups: [] } }).body, 'Projects');
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
                main: {
                    kind: 'pane',
                    tabs: [
                        { id: 'q6-hpc', view: 'hpc', state: {} },
                        { id: 'a', view: 'alpha', state: {} }
                    ],
                    active: 'a'
                },
                panel: pane('p', 'findings'),
                dock: 'hidden',
                panelSize: 0.3
            });
            const body = render(Workbench, { props: { groups: [] } }).body;
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
