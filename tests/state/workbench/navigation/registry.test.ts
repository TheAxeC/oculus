// Layer 2, client-state tests. The view registry, and the keys the real registrations name.
//
// A registration's label and glyph are read through lookup() from data. Every registration is
// checked here: its label resolves in the text catalog and its glyph resolves in
// config/catalogs/glyphs.yml.
//
// The collection views are the registrations that come from configuration rather than from a
// module, so the keys they are registered under are checked both ways: a key the configuration
// lists has a view, and a key it stops listing has none, in the registry and in the catalogue
// order drawn from it.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import type { ViewProps } from '../../../../src/lib/state/workbench/navigation/registry.ts';
import { railOrder } from '../../../../src/lib/state/workbench/navigation/catalogue.ts';
import type { Instance } from '../../../../src/lib/state/workbench/layout/index.ts';
import type { Component } from 'svelte';
// Importing the route loader registers real views; collections use the keys of sources.yml.
import { registerAll, registerCollections, registerModules } from '../../../../src/routes/views.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;
let registerView: ClientState['registry']['registerView'];
let viewFor: ClientState['registry']['viewFor'];
let views: ClientState['registry']['views'];
let apply: ClientState['layout']['apply'];
let layout: ClientState['layout']['layout'];

beforeEach(() => {
    client = createClientState();
    ({ registerView, viewFor, views } = client.registry);
    registerAll(client.registry);
    registerCollections(client.registry, COLLECTIONS);
    ({ apply, layout } = client.layout);
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);

const COLLECTIONS = collectionKeys(config);

/** A stand-in for a view component; the registry stores it and never calls it. */
const component = noop as unknown as Component<ViewProps>;

/** The registrations this file makes, told apart from the application's own. */
function probes() {
    return views().filter((view) => view.id.startsWith('probe-'));
}

describe('the view registry', () => {
    it('lists registrations in registration order', () => {
        registerView({
            id: 'probe-one',
            label: 'views.status',
            glyph: 'views.status_glyph',
            component,
            group: 'probe',
            order: 0
        });
        registerView({
            id: 'probe-two',
            label: 'views.findings',
            glyph: 'views.findings_glyph',
            component,
            group: 'probe',
            order: 1
        });
        expect(probes().map((view) => view.id)).toEqual(['probe-one', 'probe-two']);
    });

    it('replaces an earlier registration of the same id, in its place', () => {
        registerView({
            id: 'probe-one',
            label: 'views.status',
            glyph: 'views.status_glyph',
            component,
            group: 'probe',
            order: 0
        });
        registerView({
            id: 'probe-two',
            label: 'views.findings',
            glyph: 'views.findings_glyph',
            component,
            group: 'probe',
            order: 1
        });
        registerView({
            id: 'probe-one',
            label: 'views.findings',
            glyph: 'views.findings_glyph',
            component,
            group: 'probe',
            order: 0
        });
        expect(probes().map((view) => view.id)).toEqual(['probe-one', 'probe-two']);
        expect(viewFor('probe-one')?.label).toBe('views.findings');
    });

    it('discovers a registered module at any nesting depth', () => {
        registerModules(client.registry, {
            '/src/lib/views/other/deep/Nested.svelte': {
                default: component,
                registration: {
                    id: 'probe-nested',
                    label: 'views.status',
                    glyph: 'views.status_glyph',
                    group: 'probe',
                    order: 2
                }
            }
        });
        expect(viewFor('probe-nested')?.component).toBe(component);
    });

    it('ignores a partial without registration metadata', () => {
        const before = views().length;
        expect(() =>
            registerModules(client.registry, {
                '/src/lib/views/other/Partial.svelte': { default: component }
            })
        ).not.toThrow();
        expect(viewFor('Partial')).toBeUndefined();
        // A partial registers nothing at all, under its own name or under none.
        expect(views()).toHaveLength(before);
    });
});

describe('the real registrations', () => {
    /** The views the application registers, which is what the catalogue and the tabs draw. */
    function real() {
        return views().filter((view) => !view.id.startsWith('probe-'));
    }

    it('registers the one collection component under every collection key of sources.yml', () => {
        const collections = real().filter((view) => COLLECTIONS.includes(view.id));
        expect(collections.map((view) => view.id)).toEqual(COLLECTIONS);
        expect(new Set(collections.map((view) => view.component)).size).toBe(1);
        expect(collections.every((view) => view.listed !== false)).toBe(true);
    });

    it('keeps a collection in its first position when it is registered again', () => {
        const before = real().map((view) => view.id);
        registerCollections(client.registry, COLLECTIONS);
        expect(real().map((view) => view.id)).toEqual(before);
    });

    it('names a label key the text catalog holds', () => {
        const missing = real().filter((view) => !(view.label in catalog));
        expect(missing.map((view) => `${view.id}: ${view.label}`)).toEqual([]);
    });

    it('names a glyph key whose value is a name config/catalogs/glyphs.yml holds', () => {
        const missing = real().filter(
            (view) => !(view.glyph in catalog) || !(catalog[view.glyph] in glyphs)
        );
        expect(missing.map((view) => `${view.id}: ${view.glyph}`)).toEqual([]);
    });

    /**
     * The catalogue lists the listed registrations in order, so a dropped view leaves this list.
     * With no group configured every registration is counted directly, which is the whole of it.
     */
    function railIds(): string[] {
        return railOrder(
            views().filter((view) => view.listed !== false),
            []
        ).direct;
    }

    it('drops the collections whose keys a later call no longer lists', () => {
        const [kept, ...dropped] = COLLECTIONS;
        registerCollections(client.registry, [kept]);

        expect(viewFor(kept)).toBeDefined();
        expect(dropped.filter((key) => viewFor(key) !== undefined)).toEqual([]);
        expect(railIds()).toContain(kept);
        expect(railIds().filter((id) => dropped.includes(id))).toEqual([]);

        registerCollections(client.registry, COLLECTIONS);
        expect(COLLECTIONS.filter((key) => viewFor(key) === undefined)).toEqual([]);
        expect(COLLECTIONS.filter((key) => !railIds().includes(key))).toEqual([]);
    });

    it('closes the tabs open on a collection it drops, so no tab is left with no body', () => {
        const [kept, dropped] = COLLECTIONS;
        const held: Instance = { id: 'dropped-tab', view: dropped, state: {} };
        const other: Instance = { id: 'kept-tab', view: kept, state: {} };
        apply({ root: { kind: 'pane', tabs: [other, held], active: held.id } });

        registerCollections(client.registry, [kept]);
        const tabs = layout();
        expect(tabs.kind === 'pane' ? tabs.tabs.map((tab) => tab.view) : []).toEqual([kept]);
    });
});
