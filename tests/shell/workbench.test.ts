// The workbench rendered to HTML on the server: the rail, both trees, a tab strip over every pane,
// the sashes, the view each pane is showing, and the one pane a maximised workbench draws instead
// of all of them. Two views are registered here rather than the application's own, so what is
// checked is the shell and not what a view happens to draw.
//
// What this does NOT cover: the theme effect, the menus opening, the drags. There is no DOM in this
// suite, so an $effect never runs and a pointer is never pressed; applyTheme is covered on its own
// in tests/ui/theme.test.ts, the drag store is tests/state/drag.test.ts, and the drag itself is
// checked in a browser. The insertion mark below is rendered from a prop, not from a pointer.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import DropLayer from '../../src/lib/shell/DropLayer.svelte';
import Workbench from '../../src/lib/shell/Workbench.svelte';
import Tabs, { insertionIndex } from '../../src/lib/ui/Tabs.svelte';
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
import { apply } from '../../src/lib/state/layout.svelte.ts';
import type { Dock, Layout, Workbench as Bench } from '../../src/lib/state/layout.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

registerView({ id: 'alpha', label: 'views.status', glyph: 'views.status_glyph', component: Alpha });
registerView({
    id: 'beta',
    label: 'views.findings',
    glyph: 'views.findings_glyph',
    component: Beta
});

function pane(id: string, view: string): Layout {
    return { kind: 'pane', tabs: [{ id, view, state: {} }], active: id };
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

function html(dock: Dock, groups: { label: string; keys: string[] }[] = []): string {
    apply(bench(dock));
    return render(Workbench, { props: { groups } }).body;
}

const docked = html('right');

describe('the workbench', () => {
    it('draws one rail button per registered view', () => {
        const rail = [...docked.matchAll(/data-view="([^"]*)"/g)].map((match) => match[1]);
        expect(rail).toEqual(['alpha', 'beta']);
    });

    it('draws a tab strip over every pane of both trees', () => {
        expect([...docked.matchAll(/role="tablist"/g)]).toHaveLength(3);
        expect([...docked.matchAll(/role="tab"/g)]).toHaveLength(3);
    });

    it('labels each tab from the registry', () => {
        expect(docked).toContain('Status');
        expect(docked).toContain('Findings');
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
        expect([...hidden.matchAll(/role="tablist"/g)]).toHaveLength(2);
    });

    it('groups a rail button under a group that names it, and leaves the rest ungrouped', () => {
        const grouped = html('right', [{ label: 'Portfolio', keys: ['alpha'] }]);
        expect(grouped).toContain('Portfolio');
        expect([...grouped.matchAll(/data-view="([^"]*)"/g)].map((match) => match[1])).toEqual([
            'alpha',
            'beta'
        ]);
    });

    it('draws no heading for a group no registered view belongs to', () => {
        const grouped = html('right', [{ label: 'Nothing here', keys: ['sessions'] }]);
        expect(grouped).not.toContain('Nothing here');
    });

    // A Menu draws its opener and nothing else until it is opened, so the items behind it (close,
    // maximise, the two moves and the two splits) are not in this HTML. They are checked in the
    // browser, where the menu can be opened.
    it('puts a pane menu at the right of every tab strip', () => {
        expect([...docked.matchAll(/aria-label="Pane"/g)]).toHaveLength(3);
        expect([...docked.matchAll(/aria-haspopup="menu"/g)]).toHaveLength(5);
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
        expect([...one.matchAll(/role="tablist"/g)]).toHaveLength(1);
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
        expect([...stale.matchAll(/role="tablist"/g)]).toHaveLength(3);
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
        return html.match(/class="target[^"]*" style="([^"]*)"/)?.[1] ?? '';
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
                onselect: () => {},
                onclose: () => {},
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
});

// The two the application registers, mounted through the same shell with the real catalog and the
// real glyph vocabulary: a label key, a glyph key or a glyph name that did not resolve would throw
// here. The registrations arrive by importing the page's barrel, and it is imported inside the test
// so that the rail above still sees only the two views this file registered.
describe('the views the application registers', () => {
    it('mounts status and findings with nothing yet delivered on either channel', async () => {
        await import('../../src/routes/views.ts');
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
});
