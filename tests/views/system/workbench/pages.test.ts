// Layer 4, view test. The Pages view drawn as explorer rows: one treeitem per page in the page
// list's order, the page on screen as the row in force, a rail page's key as the row's detail, a
// page holding unsaved text marked at the row's end, and the controls of each row by their names.
//
// The rule that tells a row's click from the release of a drag it started is run on its own
// (rowPresses of views/system/workbench/row-press.ts).
//
// What this does NOT cover: a control pressed, the row pressed in a browser (the render has no
// DOM, so a row is checked to draw its press and the press itself is seen on screen), the rename
// typed, the close confirmed and a row dragged onto a pane.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Pages from '../../../../src/lib/views/system/workbench/Pages.svelte';
import { rowPresses } from '../../../../src/lib/views/system/workbench/row-press.ts';
import { THRESHOLD } from '../../../../src/lib/state/workbench/drag.svelte.ts';
import { fakeStorage } from '../../../state/workbench/layout/layout-fixture.ts';
import { present } from '../../../fixtures/present.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import { catalog, config, configured } from './workbench-fixture.ts';
import { railPages } from '../../../../src/lib/state/workbench/navigation/rail.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
});

const instance = { id: 'pages-one', view: 'pages', state: {} };

function draw(): string {
    return render(Pages, { context: clientContext(client), props: { instance } }).body;
}

const NODE = { root: { kind: 'pane', view: 'status' } };

describe('the Pages view', () => {
    it('draws one row per page, in the order of the page list', () => {
        client.layout.openPage('Writing');
        client.layout.openRailPage('focus', 'Focus', NODE);
        const body = draw();
        expect([...body.matchAll(/data-page-row="([^"]+)"/g)].map((found) => found[1])).toEqual([
            catalog['ui.page_default'].replace('{0}', '1'),
            'Writing',
            'Focus'
        ]);
    });
});

describe('the Pages view as list rows', () => {
    /** The markup from the row of the page with this name up to the next row, or the end. */
    function treeRow(body: string, name: string): string {
        const at = body.indexOf(`data-page-row="${name}"`);
        if (at < 0) return '';
        const next = body.indexOf('data-page-row=', at + 1);
        return body.slice(at, next < 0 ? undefined : next);
    }

    const first = (): string => catalog['ui.page_default'].replace('{0}', '1');

    it('draws a tree of one treeitem per page, and no list item', () => {
        client.layout.openPage('Writing');
        client.layout.openRailPage('focus', 'Focus', NODE);
        const body = draw();
        expect(body).toContain('role="tree"');
        expect([...body.matchAll(/role="treeitem"/g)]).toHaveLength(3);
        // The rows are treeitems drawn straight into the tree, as the explorers draw theirs.
        expect(body).not.toContain('<li');
    });

    it('marks the page on screen as the current row, and no other', () => {
        client.layout.openPage('Writing');
        const body = draw();
        expect(treeRow(body, 'Writing')).toContain('aria-current="true"');
        // Opening Writing left the first page, so that page is no longer the one on screen.
        expect(treeRow(body, first())).not.toContain('aria-current="true"');
        // The page on screen is named by the row, not by a tag beside it.
        expect(body).not.toContain('class="tag');
    });

    it('draws the rail key as the row detail', () => {
        client.layout.openRailPage('focus', 'Focus', NODE);
        const words = present(catalog['workbench.pages_on_rail'], 'pages_on_rail');
        const focus = treeRow(draw(), 'Focus');
        expect(focus).toMatch(
            new RegExp(`class="detail[^"]*"[^>]*>(<!---->)?${words.replace('{0}', 'focus')}<`)
        );
    });

    it('offers rename, reset and close as the row actions, and no show control', () => {
        // Reset is offered for a page a button of the configured rail carries, so the client is
        // given the real config and the page of its first rail button.
        client = configured();
        client.layout.loadLayout(fakeStorage());
        const button = railPages(config)[0];
        expect(button).toBeDefined();
        client.layout.openRailPage(button.page, 'Railed', button.node);
        const body = draw();
        const railed = treeRow(body, 'Railed');
        const actions = railed.slice(railed.indexOf('class="actions'));
        // Showing a page is the row's own press, so no control of the row says so.
        const labels = [...actions.matchAll(/aria-label="([^"]+)"/g)].map((found) => found[1]);
        expect(labels).toEqual([
            catalog['workbench.pages_rename'],
            catalog['workbench.pages_reset'],
            catalog['workbench.pages_close']
        ]);
        // Reset is a rail page's alone.
        expect(treeRow(body, first())).not.toContain(
            `aria-label="${catalog['workbench.pages_reset']}"`
        );
    });

    it('makes each row a press that names its page', () => {
        client.layout.openPage('Writing');
        expect(treeRow(draw(), 'Writing')).toMatch(/<button[^>]*class="main[^"]*"[^>]*>/);
    });

    it('marks a page holding unsaved text at the row end, by name', () => {
        const held = client.layout.currentPage();
        const tab = client.layout.activeInstance(held.id)?.id ?? '';
        client.ui.registerUnsaved((id) => id === tab);
        client.layout.openPage('Clean');
        const body = draw();
        const words = catalog['workbench.pages_unsaved'];
        const dirty = treeRow(body, first());
        expect(dirty.slice(dirty.indexOf('class="end'))).toContain(`aria-label="${words}"`);
        // Clean holds only the tab it was opened with, which nothing reports as unsaved.
        expect(treeRow(body, 'Clean')).not.toContain(`aria-label="${words}"`);
    });
});

describe('a row press and its click', () => {
    it('audits that a drag past the threshold released over the same row does not show the page', () => {
        const shown: string[] = [];
        const row = rowPresses((id) => shown.push(id));
        row.down({ x: 10, y: 10 });
        row.click('p1', { clientX: 10 + THRESHOLD, clientY: 10, detail: 1 });
        expect(shown).toEqual([]);
    });

    it('audits that a press and a click with no move show the page once', () => {
        const shown: string[] = [];
        const row = rowPresses((id) => shown.push(id));
        row.down({ x: 10, y: 10 });
        row.click('p1', { clientX: 10, clientY: 10, detail: 1 });
        expect(shown).toEqual(['p1']);
    });

    it('audits that a click the keyboard made shows the page, wherever the last press was', () => {
        const shown: string[] = [];
        const row = rowPresses((id) => shown.push(id));
        row.down({ x: 10, y: 10 });
        row.click('p1', { clientX: 400, clientY: 400, detail: 0 });
        expect(shown).toEqual(['p1']);
    });
});
