// The workbench rendered to HTML on the server: the rail, both trees, a tab strip over every pane,
// the sashes, and the view each pane is showing. Two views are registered here rather than the
// application's own, so what is checked is the shell and not what a view happens to draw.
//
// What this does NOT cover: the theme effect, the menus opening, the drags. There is no DOM in this
// suite, so an $effect never runs and a pointer is never pressed; applyTheme is covered on its own
// in tests/ui/theme.test.ts, and the interactions are checked in a browser.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Workbench from '../../src/lib/shell/Workbench.svelte';
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
