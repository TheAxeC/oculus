// Layer 3, shell test. What a tab view gives the view it draws: the copy of the client's stores a
// hidden tab asks nothing through, the answer useShown() gives, and the gate the five re-reading
// views share.
//
// The server render runs a view's `$derived` once when its markup reads it, so the cases that
// count requests render a view whose store read is a derived. What this does NOT cover: the
// effects that re-run when a tab is shown, which are tests/shell/panes/tab-scope.client.test.ts.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TabView from '../../../src/lib/shell/panes/TabView.svelte';
import File from '../../../src/lib/views/sources/file/File.svelte';
import Memories from '../../../src/lib/views/personal/memories/Memories.svelte';
import { shownGate } from '../../../src/lib/state/client/use.ts';
import type { Registration } from '../../../src/lib/state/workbench/navigation/registry.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs, t } from '../../../src/lib/state/shared/words/text.ts';
import { clientContext, createClientState, stubFetch } from '../../fixtures/client.ts';
import ShownProbe from './ShownProbe.svelte';

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** A registration over a component; only the component is read by the tab view. */
function registered(component: Registration['component']): Registration {
    return {
        id: 'memories',
        label: 'views.memories',
        glyph: 'views.memories_glyph',
        component,
        group: 'help',
        order: 1
    };
}

const instance: Instance = { id: 'tab-one', view: 'memories', state: {} };

/** Let a scheduled request run. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('shownGate', () => {
    // Revert: in due of shownGate in state/client/use.ts, record the values while hidden, or answer
    // true while hidden.
    it('answers false while hidden and records nothing', () => {
        let shown = false;
        const gate = shownGate(() => shown);
        expect(gate.due(['a'])).toBe(false);
        shown = true;
        expect(gate.due(['a'])).toBe(true);
    });

    // Revert: in due of shownGate in state/client/use.ts, answer true on every call, or compare the
    // values by anything but identity.
    it('answers true once for a set of values, false for the same, true for another', () => {
        const gate = shownGate(() => true);
        expect(gate.due(['a'])).toBe(true);
        expect(gate.due(['a'])).toBe(false);
        expect(gate.due(['b'])).toBe(true);
        expect(gate.due(['b'])).toBe(false);
    });

    // Revert: in clear of shownGate in state/client/use.ts, keep the values recorded.
    it('answers true again after clear, for the values it last recorded', () => {
        const gate = shownGate(() => true);
        gate.due(['b']);
        gate.clear();
        expect(gate.due(['b'])).toBe(true);
    });

    // Revert: in note of shownGate in state/client/use.ts, record nothing.
    it('takes a note of values without answering, so the same values are not due', () => {
        const gate = shownGate(() => true);
        gate.note(['c']);
        expect(gate.due(['c'])).toBe(false);
        expect(gate.due(['d'])).toBe(true);
    });

    // Revert: in due of shownGate in state/client/use.ts, compare only the first value, or
    // compare the arrays by identity.
    it('compares four values one by one by identity', () => {
        const object = { same: 1 };
        const gate = shownGate(() => true);
        expect(gate.due([1, 'two', object, null])).toBe(true);
        expect(gate.due([1, 'two', object, null])).toBe(false);
        expect(gate.due([1, 'two', object, undefined])).toBe(true);
        expect(gate.due([1, 'two', { same: 1 }, undefined])).toBe(true);
        expect(gate.due([1, 'two'])).toBe(true);
    });

    // Revert: in due of shownGate in state/client/use.ts, forget the recorded values at the call
    // that answers false while hidden.
    it('has nothing due after a hidden stretch in which the values did not change', () => {
        let shown = true;
        const gate = shownGate(() => shown);
        expect(gate.due(['a'])).toBe(true);
        shown = false;
        expect(gate.due(['a'])).toBe(false);
        shown = true;
        expect(gate.due(['a'])).toBe(false);
    });
});

describe('a tab view', () => {
    let asked: string[] = [];

    beforeEach(() => {
        vi.stubGlobal('window', {});
        asked = [];
        stubFetch(
            asked,
            () =>
                new Response(JSON.stringify({ images: [] }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                })
        );
    });

    afterEach(() => vi.unstubAllGlobals());

    /** A tab view drawn over a client, hidden or shown. */
    function tab(shown: boolean, client = createClientState()): string {
        return render(TabView, {
            context: clientContext(client),
            props: { instance, registration: registered(Memories), shown }
        }).body;
    }

    // Revert: in TabView, take out the provideTabState call, so the view reads the page's stores.
    it('makes no request for a view that reads the wall while hidden', async () => {
        tab(false);
        await settle();
        expect(asked).toEqual([]);
    });

    // Revert: in TabView, provide a copy whose shown flag is always false.
    it('makes the request for the same view when shown', async () => {
        tab(true);
        await settle();
        expect(asked).toEqual(['/api/memories']);
    });

    // Revert: in provideTabState of state/client/use.ts, provide nothing under SHOWN_KEY.
    it('gives the view the flag it was handed, and useShown answers true with no tab view above it', () => {
        const alone = render(ShownProbe, { props: { instance } }).body;
        expect(alone).toContain('>true<');
        const hidden = render(TabView, {
            context: clientContext(createClientState()),
            props: { instance, registration: registered(ShownProbe), shown: false }
        }).body;
        expect(hidden).toContain('>false<');
        const shown = render(TabView, {
            context: clientContext(createClientState()),
            props: { instance, registration: registered(ShownProbe), shown: true }
        }).body;
        expect(shown).toContain('>true<');
    });

    /** A tab view over a File tab that names a file, or none. */
    function fileTab(shown: boolean, root: string, path: string): string {
        return render(TabView, {
            context: clientContext(createClientState()),
            props: {
                instance: { id: 'file-one', view: 'file', state: { root, path } },
                registration: registered(File),
                shown
            }
        }).body;
    }

    // Revert: in File.svelte, draw file.none for every empty address instead of only for a tab
    // that names no file.
    it('draws the loading line, not "No file chosen", for a File tab that names a file and is hidden', () => {
        const hidden = fileTab(false, 'hub', 'notes/a.png');
        expect(hidden).toContain(t('file.loading'));
        expect(hidden).not.toContain(t('file.none'));
        expect(hidden).not.toContain('<img');
    });

    // Revert: in File.svelte, start the address of a tab drawn shown as the empty one.
    it('draws the picture of a File tab that is shown', () => {
        const shown = fileTab(true, 'hub', 'notes/a.png');
        expect(shown).toContain('<img');
        expect(shown).toContain('a.png');
    });

    // Revert: in File.svelte, draw file.loading for a tab that names no file.
    it('draws "No file chosen" for a File tab that names no file', () => {
        expect(fileTab(true, '', '')).toContain(t('file.none'));
        expect(fileTab(false, 'hub', '')).toContain(t('file.none'));
    });

    // Revert: in provideTabState of state/client/use.ts, take out the test that a client state is
    // provided above, so the wrap is called on undefined. The server render builds the markup when
    // its body is read, so the body is read inside the call that must not throw.
    it('renders with no client state above it', () => {
        expect(
            () =>
                render(TabView, {
                    props: { instance, registration: registered(ShownProbe), shown: false }
                }).body
        ).not.toThrow();
    });
});
