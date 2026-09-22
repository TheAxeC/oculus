// The page strip rendered to HTML on the server: one tab per page, the current one marked, the
// shortcut in each tab's tooltip, and the opener of the menu that makes, renames and opens pages.
//
// What this does NOT cover: the menu opening, the rename box and the confirm. There is no DOM in
// this suite, so no menu is clicked and no $effect runs; a closed Menu renders its opener and no
// list, and the rename box is drawn only after the menu has been picked from. Those are the
// browser's check.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PageStrip from '../../../src/lib/shell/panes/PageStrip.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { pageInstanceIds } from '../../../src/lib/shell/panes/page-strip.ts';
import { closeQuestion } from '../../../src/lib/shell/closing.ts';
import type { Page } from '../../../src/lib/state/workbench/layout/index.ts';
import { bench, fakeStorage, pane, split } from '../../state/workbench/layout/layout-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let loadLayout: ClientState['layout']['loadLayout'];
let movePage: ClientState['layout']['movePage'];
let openPage: ClientState['layout']['openPage'];
let renamePage: ClientState['layout']['renamePage'];
let pages: ClientState['layout']['pages'];

beforeEach(() => {
    client = createClientState();
    ({ loadLayout, movePage, openPage, renamePage, pages } = client.layout);
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** Two pages, the second one current, which is what the strip is asked to draw. */
function strip(reorder = false): string {
    loadLayout(fakeStorage());
    renamePage(pages()[0].id, 'Reading');
    openPage('Runs');
    if (reorder) movePage(pages()[1].id, 0);
    return render(PageStrip, {
        context: clientContext(client),
        props: { arrangements: [{ name: 'sessions', label: 'Sessions', node: null }] }
    }).body;
}

let body: string;
beforeEach(() => {
    body = strip();
});

describe('the page strip', () => {
    it('draws one tab per page, naming each of them', () => {
        expect([...body.matchAll(/role="tab"/g)]).toHaveLength(2);
        expect(body).toContain('Reading');
        expect(body).toContain('Runs');
    });

    it('gives every page tab a drag handle', () => {
        expect([...body.matchAll(/data-drag-handle=""/g)]).toHaveLength(2);
    });

    it('draws pages in the order held by the layout store', () => {
        const moved = strip(true);
        expect(moved.indexOf('Runs')).toBeLessThan(moved.indexOf('Reading'));
    });

    it('marks the page on screen and no other', () => {
        expect([...body.matchAll(/aria-selected="true"/g)]).toHaveLength(1);
        // Runs is the second tab, so everything from the mark on names it and not the first page.
        const selected = body.slice(body.indexOf('aria-selected="true"'));
        expect(selected).toContain('Runs');
        expect(selected).not.toContain('Reading');
    });

    it('names the shortcut that reaches each page', () => {
        expect(body).toContain('Reading - press 1');
        expect(body).toContain('Runs - press 2');
    });

    it('puts the page menu at the right of the strip', () => {
        expect([...body.matchAll(/aria-haspopup="menu"/g)]).toHaveLength(1);
        expect(body).toContain('aria-label="Page"');
    });

    it('is the strip of pages, for anything reading the page by its regions', () => {
        expect(body).toContain('aria-label="Pages"');
    });
});

// What a page's close asks, which is the pane's own rule over every instance the page holds rather
// than over the count alone: a page of one saved tab goes at once and a page of one unsaved tab does
// not. The press itself is the browser's check; the words each answer draws are the component's.
describe("the question a page's close asks", () => {
    const page = (root: ReturnType<typeof pane>): Page => ({
        id: 'p1',
        label: 'Reading',
        workbench: bench(root)
    });

    it("lists every instance of every pane of the page, in the tree's own order", () => {
        expect(pageInstanceIds(page(pane(['a', 'b'])))).toEqual(['a', 'b']);
        expect(
            pageInstanceIds(page(split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])])))
        ).toEqual(['a', 'b', 'c']);
        expect(pageInstanceIds(page(pane([])))).toEqual([]);
    });

    it('goes at once for one tab with nothing unsaved in it', () => {
        const ids = pageInstanceIds(page(pane(['a'])));
        expect(closeQuestion(ids, () => false)).toBe('none');
    });

    it('asks about the text for one tab holding an unsaved edit', () => {
        const ids = pageInstanceIds(page(pane(['a'])));
        expect(closeQuestion(ids, (id) => id === 'a')).toBe('dirty');
    });

    it("asks the page's own question once it holds more than one tab", () => {
        const ids = pageInstanceIds(page(split('row', [0.5, 0.5], [pane(['a']), pane(['b'])])));
        expect(closeQuestion(ids, () => false)).toBe('many');
        expect(closeQuestion(ids, (id) => id === 'b')).toBe('many');
    });
});
