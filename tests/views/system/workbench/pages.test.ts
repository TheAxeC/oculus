// Layer 4, view test. The Pages view drawn: one row per page in the page list's order, the page on
// screen marked, a rail page carrying its key, a page holding unsaved text saying so, and the
// controls of each row by their names.
//
// What this does NOT cover: a control pressed, the rename typed, the close confirmed and a row
// dragged onto a pane, which are tests/browser/workbench/pages.spec.ts's and nested.spec.ts's.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Pages from '../../../../src/lib/views/system/workbench/Pages.svelte';
import { fakeStorage } from '../../../state/workbench/layout/layout-fixture.ts';
import { present } from '../../../fixtures/present.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import { catalog } from './workbench-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
});

const instance = { id: 'pages-one', view: 'pages', state: {} };

function draw(): string {
    return render(Pages, { context: clientContext(client), props: { instance } }).body;
}

/** The markup of the row of the page with this name. */
function row(body: string, name: string): string {
    const at = body.indexOf(`data-page-row="${name}"`);
    return at < 0 ? '' : body.slice(at, body.indexOf('</li>', at));
}

const NODE = { root: { kind: 'pane', view: 'status' } };

describe('the Pages view', () => {
    it('draws one row per page, in the order of the page list', () => {
        // revert: src/lib/views/system/workbench/Pages.svelte:170 => {#each shown.slice(0, 1) as page, at (page.id)}
        client.layout.openPage('Writing');
        client.layout.openRailPage('focus', 'Focus', NODE);
        const body = draw();
        expect([...body.matchAll(/data-page-row="([^"]+)"/g)].map((found) => found[1])).toEqual([
            catalog['ui.page_default'].replace('{0}', '1'),
            'Writing',
            'Focus'
        ]);
    });

    it('marks the page on screen, and no other', () => {
        // revert: src/lib/views/system/workbench/Pages.svelte:183 => {#if true}
        client.layout.openPage('Writing');
        const body = draw();
        const shown = present(catalog['workbench.pages_current'], 'pages_current');
        expect(row(body, 'Writing')).toContain(`>${shown}<`);
        // The first page was left when Writing was opened, so it is not the one on screen.
        expect(row(body, catalog['ui.page_default'].replace('{0}', '1'))).not.toContain(
            `>${shown}<`
        );
    });

    it('names the rail key a rail page is tied to', () => {
        // revert: src/lib/views/system/workbench/Pages.svelte:186 => {#if false}
        client.layout.openRailPage('focus', 'Focus', NODE);
        const words = present(catalog['workbench.pages_on_rail'], 'pages_on_rail');
        expect(row(draw(), 'Focus')).toContain(words.replace('{0}', 'focus'));
    });

    it('says a page holds unsaved text, and says nothing of a page that does not', () => {
        // revert: src/lib/views/system/workbench/Pages.svelte:191 => {#if false}
        const held = client.layout.currentPage();
        const tab = client.layout.activeInstance(held.id)?.id ?? '';
        client.ui.registerUnsaved((id) => id === tab);
        client.layout.openPage('Clean');
        const body = draw();
        const words = present(catalog['workbench.pages_unsaved'], 'pages_unsaved');
        expect(row(body, catalog['ui.page_default'].replace('{0}', '1'))).toContain(words);
        // Clean holds only the tab it was opened with, which nothing reports as unsaved.
        expect(row(body, 'Clean')).not.toContain(words);
    });

    it('offers show, rename and close on every row, show held back on the page on screen', () => {
        // revert: src/lib/views/system/workbench/Pages.svelte:215 => disabled={false}
        client.layout.openPage('Writing');
        const body = draw();
        const shown = row(body, 'Writing');
        for (const key of [
            'workbench.pages_open',
            'workbench.pages_rename',
            'workbench.pages_close'
        ]) {
            expect(shown).toContain(`aria-label="${catalog[key]}"`);
        }
        expect(shown).toMatch(
            new RegExp(`<button[^>]*aria-label="${catalog['workbench.pages_open']}"[^>]*disabled`)
        );
        expect(body).toContain(catalog['ui.page_new']);
    });
});
