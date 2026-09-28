// Layer 4, view test. The Views catalogue drawn over the application's own registry and config:
// every listed view under its group's heading with the key that opens it, the hub documents after
// a group's views, and a registration's live badge beside its button.
//
// What this does NOT cover: an entry pressed, which opens a view in the page the reader is in.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Catalogue from '../../../../src/lib/views/system/workbench/Catalogue.svelte';
import { collectionKeys } from '../../../../src/lib/data/sources/config.ts';
import { registerAll, registerCollections } from '../../../../src/routes/views.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';
import { catalog, config, configured, words } from './workbench-fixture.ts';
import { SHIPPED_RAIL_LABELS } from '../../../shell/rail/shipped-rail.ts';

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
        const body = draw();
        const headings = [...body.matchAll(/data-group="([^"]+)"/g)].map((found) => found[1]);
        // One heading per rail page, and the Help group, which is no page, after System.
        const system = SHIPPED_RAIL_LABELS.indexOf('System') + 1;
        expect(headings).toEqual([
            ...SHIPPED_RAIL_LABELS.slice(0, system),
            'Help',
            ...SHIPPED_RAIL_LABELS.slice(system)
        ]);
        const sessions = body.slice(body.indexOf('data-group="Sessions"'));
        expect(sessions).toMatch(/class="chord[^"]*">m</);
    });

    it('draws a key beside every entry of every group, System y1 to y6 and Help h1 to h5', () => {
        const body = draw();
        const focus = body.slice(body.indexOf('data-view="focus"'));
        expect(focus).toMatch(/class="key[^"]*"[^>]*>f1</);
        const starts = [...body.matchAll(/data-group="([^"]+)"/g)];
        const keysOf = new Map<string, string[]>();
        starts.forEach((found, index) => {
            const section = body.slice(found.index, starts[index + 1]?.index ?? body.length);
            const entries = [...section.matchAll(/data-(?:view|doc)="[^"]+"/g)].length;
            const keys = [...section.matchAll(/class="key[^"]*"[^>]*>([^<]+)</g)].map(
                (one) => one[1]
            );
            // Every entry of the group carries its key.
            expect([found[1], keys.length]).toEqual([found[1], entries]);
            keysOf.set(found[1], keys);
        });
        expect(keysOf.get('System')).toEqual(['y1', 'y2', 'y3', 'y4', 'y5', 'y6']);
        expect(keysOf.get('Help')).toEqual(['h1', 'h2', 'h3', 'h4', 'h5']);
    });

    it("lists a group's hub documents after its views, as buttons carrying their path", () => {
        const body = draw();
        expect(button(body, 'data-doc="docs/HPC-UTwente-howto.md"')).toContain('HPC how-to');
        expect(body.indexOf('data-view="history"')).toBeLessThan(
            body.indexOf('data-doc="docs/HPC-UTwente-howto.md"')
        );
    });

    it("draws a registration's toned badge beside its button, and nothing at zero", () => {
        const status = client.registry.viewFor('status');
        if (status === undefined) throw new Error('the status view is not registered');
        client.registry.registerView({
            ...status,
            id: 'probe-badged',
            group: 'info',
            order: 99,
            badge: () => '3 5',
            badgeTone: () => 'red'
        });
        const body = draw();
        expect(body).toContain('--badge-bg: var(--c-red)');
        expect(body).toMatch(/class="badge[^>]*>(?:<!--[^>]*-->)*3 5</);
    });

    it('names the key in the hover words of an entry a chord reaches', () => {
        const body = draw();
        expect(body).toContain(words('workbench.catalogue_key', catalog['views.focus'], 'f1'));
        expect(body).toContain(`${catalog['views.focus']}, key f1`);
    });
});
