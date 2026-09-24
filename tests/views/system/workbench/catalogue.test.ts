// Layer 4, view test. The Views catalogue drawn over the application's own registry and config:
// every listed view under its group's heading with the key that opens it, the hub documents after
// a group's views, and a registration's live badge beside its button.
//
// What this does NOT cover: an entry pressed, which opens a view in the page the reader is in and
// is tests/browser/shell/views.spec.ts's.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Catalogue from '../../../../src/lib/views/system/workbench/Catalogue.svelte';
import { collectionKeys } from '../../../../src/lib/data/sources/config.ts';
import { registerAll, registerCollections } from '../../../../src/routes/views.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';
import { catalog, config, configured, words } from './workbench-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = configured();
    registerAll(client.registry);
    registerCollections(client.registry, collectionKeys(config));
});

const instance = { id: 'catalogue-one', view: 'catalogue', state: {} };

function draw(): string {
    return render(Catalogue, { context: clientContext(client), props: { instance } }).body;
}

/** The button carrying one attribute, whole. */
function button(body: string, attribute: string): string {
    return new RegExp(`<button[^>]*${attribute}[\\s\\S]*?</button>`).exec(body)?.[0] ?? '';
}

describe('the Views catalogue', () => {
    it('draws every listed view once as a button, and no unlisted one', () => {
        // revert: src/lib/views/system/workbench/Catalogue.svelte:79 => const listed = $derived(views());
        const body = draw();
        const drawn = [...body.matchAll(/data-view="([^"]+)"/g)].map((found) => found[1]);
        const listed = client.registry
            .views()
            .filter((view) => view.listed !== false)
            .map((view) => view.id);
        expect([...drawn].sort()).toEqual([...listed].sort());
        // The manifest editor and the hub document view are opened for something, so the
        // catalogue offers neither on its own.
        expect(drawn).not.toContain('editor');
        // The same holds for the document view, which a catalogue entry opens with its path.
        expect(drawn).not.toContain('doc');
    });

    it('draws each group under its heading, with its chord letter where it has one', () => {
        // revert: src/lib/views/system/workbench/Catalogue.svelte:177 => <span class="chord">x</span>
        const body = draw();
        for (const label of ['Boards', 'Pillars', 'Sessions', 'Academic life', 'System']) {
            expect(body).toContain(`data-group="${label}"`);
        }
        const sessions = body.slice(body.indexOf('data-group="Sessions"'));
        expect(sessions).toMatch(/class="chord[^"]*">m</);
    });

    it('draws the key that opens an entry beside it, and none past the ninth', () => {
        // revert: src/lib/views/system/workbench/Catalogue.svelte:204 => {#if true}
        const body = draw();
        const focus = body.slice(body.indexOf('data-view="focus"'));
        expect(focus).toMatch(/class="key[^"]*"[^>]*>v1</);
        const pages = body.slice(
            body.indexOf('data-view="pages"'),
            body.indexOf('data-doc="HPC-UTwente-howto.md"')
        );
        expect(pages).not.toMatch(/class="key/);
    });

    it("lists a group's hub documents after its views, as buttons carrying their path", () => {
        // revert: src/lib/views/system/workbench/Catalogue.svelte:240 => dataDoc={entry.label}
        const body = draw();
        expect(button(body, 'data-doc="HPC-UTwente-howto.md"')).toContain('HPC how-to');
        expect(body.indexOf('data-view="history"')).toBeLessThan(
            body.indexOf('data-doc="HPC-UTwente-howto.md"')
        );
    });

    it("draws a registration's toned badge beside its button, and nothing at zero", () => {
        // revert: src/lib/views/system/workbench/Catalogue.svelte:207 => {#if false}
        const status = client.registry.viewFor('status');
        if (status === undefined) throw new Error('the status view is not registered');
        client.registry.registerView({
            ...status,
            id: 'probe-badged',
            group: 'system',
            order: 99,
            badge: () => '3 5',
            badgeTone: () => 'red'
        });
        const body = draw();
        expect(body).toContain('--badge-bg: var(--c-red)');
        expect(body).toMatch(/class="badge[^>]*>(?:<!--[^>]*-->)*3 5</);
    });

    it('names the key in the hover words of an entry a chord reaches', () => {
        // revert: src/lib/views/system/workbench/Catalogue.svelte:86 => return label;
        const body = draw();
        expect(body).toContain(words('workbench.catalogue_key', catalog['views.focus'], 'v1'));
        expect(body).toContain(`${catalog['views.focus']}, key v1`);
    });
});
