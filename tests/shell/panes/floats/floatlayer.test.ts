// Layer 3, shell test. The float layer in the workbench rendered to HTML on the server: a docked
// float's strip with its sash, a free float, the pane each holds with the float's id as its page,
// the border token, the layer staying drawn on every page and while a page pane is maximised, and
// the page's tree left as it was.
//
// What this does NOT cover: a float moving, resizing or docking under a pointer, and the grid
// the body lays the strips in. There is no DOM in this suite, so no $effect runs and interactjs is
// never attached; the arithmetic of those gestures is float-geometry.test.ts, and the gestures
// themselves are seen at the look.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Workbench from '../../../../src/lib/shell/Workbench.svelte';
import DropLayer from '../../../../src/lib/shell/panes/DropLayer.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { THRESHOLD } from '../../../../src/lib/state/workbench/drag.svelte.ts';
import { serialiseLayout } from '../../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import {
    fakeStorage,
    floating,
    heldPages,
    pageAround,
    split
} from '../../../state/workbench/layout/layout-fixture.ts';
import { BASE_DEPTH } from '../../../../src/lib/shell/panes/floats/float-geometry.ts';
import Alpha from '../../fixtures/Alpha.svelte';
import Beta from '../../fixtures/Beta.svelte';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

let client: ClientState;

/** A page of two panes, a float docked on the right and a free float, each holding one tab. */
function held() {
    const page = (id: string, view: string) => ({
        kind: 'pane' as const,
        tabs: [{ id, view, state: {} }],
        active: id
    });
    const dock = {
        id: 'dock',
        pane: page('docked-tab', 'beta'),
        place: { kind: 'dock', edge: 'right', size: 0.3 } as const
    };
    const free = {
        id: 'free',
        pane: page('free-tab', 'beta'),
        place: { kind: 'free', x: 0.1, y: 0.2, w: 0.3, h: 0.4 } as const
    };
    const root = split('row', [0.5, 0.5], [page('one', 'alpha'), page('two', 'alpha')]);
    return heldPages(
        [pageAround('main', root), pageAround('other', page('o', 'alpha'))],
        [dock, free]
    );
}

beforeEach(() => {
    client = createClientState();
    for (const [id, component, order] of [
        ['alpha', Alpha, 0],
        ['beta', Beta, 1]
    ] as const) {
        client.registry.registerView({
            id,
            label: 'views.status',
            glyph: 'views.status_glyph',
            component,
            group: 'probe',
            order
        });
    }
    client.layout.loadLayout(fakeStorage(serialiseLayout(held())));
});

function body(): string {
    return render(Workbench, { context: clientContext(client), props: {} }).body;
}

describe('the float layer drawn', () => {
    it('draws each float once, the docked one as a strip and the free one over the area', () => {
        const html = body();
        expect([...html.matchAll(/data-float="([^"]*)"/g)].map((match) => match[1])).toEqual(
            expect.arrayContaining(['dock', 'free'])
        );
        expect([...html.matchAll(/data-float="/g)]).toHaveLength(2);
        expect(html).toMatch(/data-float="dock"[^>]*data-float-place="right"/);
        expect(html).toMatch(/data-float="free"[^>]*data-float-place="free"/);
    });

    it('draws the pane of each float with the float id as its page, and its view', () => {
        const html = body();
        const pages = [...html.matchAll(/data-pane-page="([^"]*)"/g)].map((match) => match[1]);
        expect(pages).toContain('dock');
        expect(pages).toContain('free');
        expect(html).toContain('data-beta="docked-tab"');
        expect(html).toContain('data-beta="free-tab"');
    });

    it('draws the float border as the theme token on both floats', () => {
        const html = body();
        expect([...html.matchAll(/border: 1px solid var\(--float-border\)/g)]).toHaveLength(2);
    });

    it('puts a sash on the docked float and none on the free one', () => {
        const html = body();
        const docked = html.slice(
            html.indexOf('data-float="dock"'),
            html.indexOf('data-float="free"')
        );
        expect(docked).toContain('role="separator"');
        expect(html.slice(html.indexOf('data-float="free"'))).not.toContain('role="separator"');
    });

    it('leaves the page tree as it was: its two panes, and no float among them', () => {
        const html = body();
        expect(
            [...html.matchAll(/data-pane-path="([^"]*)"/g)].filter(
                (m) => m[1] === '0' || m[1] === '1'
            )
        ).toHaveLength(2);
        expect(html).toContain('data-alpha="one"');
        expect(html).toContain('data-alpha="two"');
    });

    it('draws nothing of a float when the layout holds none', () => {
        client.layout.loadLayout(
            fakeStorage(
                serialiseLayout(
                    heldPages([
                        pageAround(
                            'main',
                            split(
                                'row',
                                [0.5, 0.5],
                                [floating('a', ['a']).pane, floating('b', ['b']).pane]
                            )
                        )
                    ])
                )
            )
        );
        expect(body()).not.toContain('data-float=');
    });
});

describe('a float drawn the same way whatever its place', () => {
    /** The markup of one float, from its element to the next float's or the end. */
    function segment(html: string, id: string): string {
        const start = html.indexOf(`data-float="${id}"`);
        const next = html.indexOf('data-float="', start + 1);
        return html.slice(start, next === -1 ? undefined : next);
    }

    // A server render cannot show a mount. What keeps a PaneView mounted when a float docks or
    // frees is that the one keyed block draws every float as the same element holding the same
    // fill, so the two states differ in a class, a style and a sash. These cases read that shape.
    it('draws a docked and a free float as one element with the pane in one fill', () => {
        const html = body();
        expect(html).toMatch(/<div class="float dock right[^"]*"[^>]*data-float="dock"/);
        expect(html).toMatch(/<div class="float free[^"]*"[^>]*data-float="free"/);
        for (const id of ['dock', 'free']) {
            const one = segment(html, id);
            expect(one.indexOf('class="fill')).toBeGreaterThan(-1);
            expect(one.indexOf('class="fill')).toBeLessThan(one.indexOf(`data-pane-page="${id}"`));
        }
    });

    it('draws a float freed from a dock in the same element, with its class and no sash', () => {
        client.layout.freeFloat('dock');
        const html = body();
        const one = segment(html, 'dock');
        expect(html).toMatch(/<div class="float free[^"]*"[^>]*data-float="dock"/);
        expect(one).toContain('data-float-place="free"');
        expect(one).not.toContain('role="separator"');
        expect(one.indexOf('class="fill')).toBeLessThan(one.indexOf('data-pane-page="dock"'));
    });

    it('draws a free float docked in the same element, with its class and a sash', () => {
        client.layout.dockFloat('free', 'bottom');
        const html = body();
        const one = segment(html, 'free');
        expect(html).toMatch(/<div class="float dock bottom[^"]*"[^>]*data-float="free"/);
        expect(one).toContain('role="separator"');
        expect(one.indexOf('class="fill')).toBeLessThan(one.indexOf('data-pane-page="free"'));
    });
});

describe('the float layer on every page', () => {
    it('still draws both floats after a switch to another page', () => {
        client.layout.switchPage('other');
        const html = body();
        expect(html).not.toContain('data-alpha="one"');
        expect(html).toContain('data-alpha="o"');
        expect(html).toContain('data-float="dock"');
        expect(html).toContain('data-float="free"');
    });

    it('still draws both floats while a pane of the page is maximised', () => {
        client.layout.maximisePane([0]);
        const html = body();
        expect(
            [...html.matchAll(/data-pane-path="([^"]*)"/g)].filter((m) => m[1] === '1')
        ).toHaveLength(0);
        expect(html).toContain('data-float="dock"');
        expect(html).toContain('data-float="free"');
    });
});

describe('the drag layer over the floats', () => {
    /** The z-index the drag layer is drawn with while a tab of the page is dragged. */
    function depth(): number | null {
        client.drag.cancel();
        client.drag.start('one', 'Status', { x: 0, y: 0 });
        client.drag.move({ x: THRESHOLD, y: 0 });
        const html = render(DropLayer, { context: clientContext(client), props: {} }).body;
        client.drag.cancel();
        const found = /class="layer[^"]*" aria-hidden="true" style="z-index: (\d+)"/.exec(html);
        return found === null ? null : Number(found[1]);
    }

    it('is one above the front of the free floats there are, and a docked float is not counted', () => {
        expect(depth()).toBe(BASE_DEPTH + 1);
        client.layout.floatTab('two', { x: 0.1, y: 0.1 });
        expect(depth()).toBe(BASE_DEPTH + 2);
    });

    it('is above the float drawn last, which is the front of the free ones', () => {
        client.layout.floatTab('two', { x: 0.1, y: 0.1 });
        const html = body();
        const depths = [
            ...html.matchAll(/data-float-place="free"[^>]*style="[^"]*z-index: (\d+)"/g)
        ];
        expect(depths).toHaveLength(2);
        expect(depth()).toBeGreaterThan(Math.max(...depths.map((one) => Number(one[1]))));
    });
});
