// Layer 2, client state tests. What a pane's close and a page's close forget: every tab they take
// away loses its source draft, its manifest edits and its entry form drafts, in memory and in the
// storage the ui store writes to, as a tab's own close loses them. A page one of the closed page's
// leaves shows is still in the strip, and its tabs keep what they hold.
//
// Nothing here touches localStorage or the DOM: both stores take the storage they are given. What
// the pane menu does in Chrome is tests/browser/workbench/unsaved-forms.spec.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { formKey, formsKey } from '../../../../src/lib/state/forms/form-drafts.svelte.ts';
import type { Layout } from '../../../../src/lib/state/workbench/layout/index.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { UI_KEY } from '../../../../src/lib/state/workbench/ui.svelte.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { bench, fakeStorage, pane, split } from './layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;
let uiStorage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
    client = createClientState();
    uiStorage = fakeStorage();
    client.ui.loadUi(uiStorage);
    client.layout.loadLayout(fakeStorage());
});

afterEach(() => vi.unstubAllGlobals());

/** A leaf showing another page. */
function shown(page: string): Layout {
    return { kind: 'page', page };
}

/**
 * Give one tab what a reader leaves in it: text typed into a source draft or an edit typed into the
 * manifest editor, which both live under the instance id, and a value typed into an entry form,
 * which lives beside it.
 */
function hold(id: string, manifest = false): void {
    if (manifest) client.manifestDraft.editManifest(id, 'probe', 'status.line', `typed in ${id}`);
    else client.source.editSourceDraft(id, `typed in ${id}`);
    client.formDrafts.setFormField(id, formKey('tasks', null), 'title', {
        value: `typed in ${id}`,
        kind: 'text',
        base: ''
    });
}

/** The instance records the ui store last wrote to its storage, by key. */
function written(): string[] {
    const raw = uiStorage.held[UI_KEY] as string | undefined;
    if (raw === undefined) return [];
    const held = JSON.parse(raw) as { instances?: Record<string, unknown> };
    return Object.keys(held.instances ?? {});
}

/** Both records of each tab named, in memory and in storage, are gone. */
function expectForgotten(ids: string[]): void {
    for (const id of ids) {
        expect(client.ui.instanceState(id)).toBeUndefined();
        expect(client.ui.instanceState(formsKey(id))).toBeUndefined();
        expect(written()).not.toContain(id);
        expect(written()).not.toContain(formsKey(id));
    }
}

/** Both records of each tab named are still held, in memory and in storage. */
function expectKept(ids: string[]): void {
    for (const id of ids) {
        expect(client.ui.instanceState(id)).toBeDefined();
        expect(client.ui.instanceState(formsKey(id))).toBeDefined();
        expect(written()).toEqual(expect.arrayContaining([id, formsKey(id)]));
    }
}

describe("a pane's close", () => {
    it('forgets every tab of the pane and keeps the tabs of the pane beside it', () => {
        // Revert: drop `forgetTabs(pane.tabs)` from closePane in
        // state/workbench/layout/instances.ts.
        client.layout.apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])])));
        hold('a');
        hold('b', true);
        hold('c');
        expectKept(['a', 'b', 'c']);

        client.layout.closePane([0]);

        expectForgotten(['a', 'b']);
        expectKept(['c']);
    });

    it('forgets a tab whose source read was in flight, and the read landing after writes nothing back', async () => {
        // Revert: drop `forgetTabs(pane.tabs)` from closePane in
        // state/workbench/layout/instances.ts, which turns the first half red; drop the
        // `sourceDraft(id).file !== file` return from loadSourceDraft in
        // state/sessions/source.svelte.ts, which turns the second half red.
        const { promise: body, resolve: release } = Promise.withResolvers<string>();
        vi.stubGlobal('fetch', (url: string) =>
            url.startsWith('/api/source')
                ? Promise.resolve(
                      new Response(JSON.stringify({ ok: true, readonly: false }), {
                          headers: { 'content-type': 'application/json' }
                      })
                  )
                : body.then((text) => new Response(text))
        );
        client.layout.apply(bench(split('row', [0.5, 0.5], [pane(['a']), pane(['c'])])));
        const read = client.source.loadSourceDraft('a', 'hub', 'a.py');
        expect(client.ui.instanceState('a')).toBeDefined();

        client.layout.closePane([0]);
        expect(client.ui.instanceState('a')).toBeUndefined();
        release('print("a")\n');
        await read;

        expect(client.ui.instanceState('a')).toBeUndefined();
        expect(written()).not.toContain('a');
    });
});

describe("a page's close", () => {
    /**
     * Two pages: the first holds panes at every depth of splits and a leaf showing the second, and
     * the second holds one pane of its own. Every tab holds a draft.
     */
    function twoPages(): { first: string; second: string } {
        const first = client.layout.currentPage().id;
        client.layout.openPage('Page 2');
        const second = client.layout.currentPage().id;
        client.layout.apply(bench(pane(['x', 'y'])), second);
        client.layout.apply(
            bench(
                split(
                    'row',
                    [0.5, 0.5],
                    [
                        pane(['a']),
                        split(
                            'col',
                            [0.5, 0.5],
                            [
                                split('row', [0.5, 0.5], [pane(['b', 'c']), shown(second)]),
                                pane(['d'])
                            ]
                        )
                    ]
                )
            ),
            first
        );
        for (const id of ['a', 'b', 'c', 'd', 'x', 'y']) hold(id, id === 'c');
        return { first, second };
    }

    it('forgets every tab of its own tree and keeps the tabs of the page its leaf shows', () => {
        // Revert: drop `forgetTabs(tabsOf(closing.workbench.root))` from closePage, which turns the
        // forgotten half red; have closePage also forget the tabs of each page its leaves name,
        // which turns the kept half red.
        const { first, second } = twoPages();
        expectKept(['a', 'b', 'c', 'd', 'x', 'y']);

        client.layout.closePage(first);

        expect(client.layout.pages().map((page) => page.id)).toEqual([second]);
        expectForgotten(['a', 'b', 'c', 'd']);
        expectKept(['x', 'y']);
    });

    it('closing the page another page shows forgets its tabs and keeps the showing page', () => {
        // Revert: drop `forgetTabs(tabsOf(closing.workbench.root))` from closePage.
        const { first, second } = twoPages();

        client.layout.closePage(second);

        expect(client.layout.pages().map((page) => page.id)).toEqual([first]);
        expectForgotten(['x', 'y']);
        expectKept(['a', 'b', 'c', 'd']);
    });

    it('closing the only page forgets its tabs as it leaves a fresh default page', () => {
        // Revert: return from closePage straight after it saves the fresh default page.
        client.layout.apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])])));
        hold('a');
        hold('b', true);
        hold('c');

        client.layout.closePage(client.layout.currentPage().id);

        expect(client.layout.pages()).toHaveLength(1);
        expectForgotten(['a', 'b', 'c']);
    });
});
