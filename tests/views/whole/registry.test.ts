// The view registry, and the keys the real registrations name.
//
// A registration's label and glyph are read through lookup() from data. Every registration is
// checked here: its label resolves in the text catalog and its glyph resolves in
// config/catalogs/glyphs.yml.
//
// The collection views are the registrations that come from configuration rather than from a module,
// so the keys they are registered under are checked both ways: a key the configuration lists has a
// view, and a key it stops listing has none, in the registry and in the rail order drawn from it.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import type { ViewProps } from '../../../src/lib/views/registry.ts';
import { GROUP_MAX, arrange, railOrder, type NavGroup } from '../../../src/lib/shell/rail/rail.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import type { Component } from 'svelte';
// Importing the route loader registers real views; collections use the keys of sources.yml.
import { registerAll, registerCollections, registerModules } from '../../../src/routes/views.ts';
import { noop } from '../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

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
    it('registers a view and looks it up by id', () => {
        registerView({
            id: 'probe-one',
            label: 'views.status',
            glyph: 'views.status_glyph',
            component,
            group: 'probe',
            order: 0
        });
        expect(viewFor('probe-one')?.label).toBe('views.status');
    });

    it('has nothing for an id nobody registered', () => {
        expect(viewFor('probe-nothing')).toBe(undefined);
    });

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
        expect(() =>
            registerModules(client.registry, {
                '/src/lib/views/other/Partial.svelte': { default: component }
            })
        ).not.toThrow();
        expect(viewFor('Partial')).toBeUndefined();
    });
});

describe('the real registrations', () => {
    /** The views the application registers, which is what the rail and the tabs draw. */
    function real() {
        return views().filter((view) => !view.id.startsWith('probe-'));
    }

    it('registers every view id the application has', () => {
        expect(
            real()
                .map((view) => view.id)
                .sort()
        ).toEqual(
            [
                'radar',
                'leads',
                'inbox',
                'linkedin',
                'hpc',
                'usage',
                'status',
                'findings',
                'help',
                'config',
                'audit',
                'memories',
                'calendar',
                'history',
                'doc',
                'gallery',
                'venues',
                'data',
                'pillars',
                'domains',
                'map',
                'present',
                'slides',
                'focus',
                'projects',
                'archive',
                'coauthor',
                'project',
                'person',
                'editor',
                'deposit',
                'document',
                'files',
                'file',
                'repositories',
                'repositories-diff',
                'search',
                'note',
                'source',
                'session-list',
                'session-detail',
                'terminal',
                'transcript',
                'timeline',
                'changes',
                'agents',
                'statements',
                'funding',
                'events',
                'education',
                'applications',
                'joint-work',
                'tasks',
                'code'
            ].sort()
        );
    });

    it('gives every view its exact group and order', () => {
        const expected: Record<string, { group: string; order: number }> = {
            agents: { group: 'sessions', order: 6 },
            applications: { group: 'academic', order: 3 },
            audit: { group: 'system', order: 7 },
            calendar: { group: 'personal', order: 1 },
            archive: { group: 'boards', order: 3 },
            changes: { group: 'sessions', order: 5 },
            coauthor: { group: 'boards', order: 2 },
            code: { group: 'sources', order: 2 },
            'joint-work': { group: 'academic', order: 4 },
            config: { group: 'system', order: 6 },
            data: { group: 'sources', order: 1 },
            deposit: { group: '', order: 0 },
            doc: { group: '', order: 0 },
            document: { group: '', order: 0 },
            domains: { group: 'structure', order: 1 },
            editor: { group: '', order: 0 },
            file: { group: '', order: 0 },
            files: { group: 'sources', order: 4 },
            education: { group: 'academic', order: 2 },
            events: { group: 'academic', order: 1 },
            findings: { group: 'system', order: 1 },
            focus: { group: 'boards', order: 0 },
            funding: { group: 'academic', order: 0 },
            gallery: { group: 'system', order: 2 },
            help: { group: 'system', order: 5 },
            history: { group: 'system', order: 8 },
            hpc: { group: 'system', order: 3 },
            inbox: { group: 'feeds', order: 2 },
            leads: { group: 'feeds', order: 1 },
            linkedin: { group: 'feeds', order: 3 },
            map: { group: 'structure', order: 2 },
            memories: { group: 'personal', order: 0 },
            note: { group: '', order: 0 },
            person: { group: '', order: 0 },
            present: { group: 'academic', order: 6 },
            pillars: { group: 'structure', order: 0 },
            project: { group: '', order: 0 },
            projects: { group: 'boards', order: 1 },
            radar: { group: 'feeds', order: 0 },
            repositories: { group: 'sources', order: 5 },
            'repositories-diff': { group: '', order: 0 },
            search: { group: 'sources', order: 6 },
            'session-detail': { group: 'sessions', order: 1 },
            'session-list': { group: 'sessions', order: 0 },
            slides: { group: '', order: 0 },
            source: { group: '', order: 0 },
            statements: { group: 'sources', order: 3 },
            status: { group: 'system', order: 0 },
            tasks: { group: 'academic', order: 5 },
            terminal: { group: 'sessions', order: 2 },
            timeline: { group: 'sessions', order: 4 },
            transcript: { group: 'sessions', order: 3 },
            usage: { group: 'system', order: 4 },
            venues: { group: 'sources', order: 0 }
        };
        expect(
            Object.fromEntries(
                real().map((view) => [view.id, { group: view.group, order: view.order }])
            )
        ).toEqual(expected);
    });

    it('registers Data directly and excludes it from generic collections', () => {
        expect(viewFor('data')).toMatchObject({
            id: 'data',
            label: 'views.data',
            glyph: 'views.data_glyph'
        });
        // Data is registered as a view of its own, so the generic collection list does not carry it
        expect(COLLECTIONS).not.toContain('data');
    });

    it('registers Lit Watch directly with its catalog label and glyph', () => {
        expect(viewFor('radar')).toMatchObject({
            id: 'radar',
            label: 'views.radar',
            glyph: 'views.radar_glyph'
        });
    });

    it('registers Position Leads directly with its catalog label and glyph', () => {
        expect(viewFor('leads')).toMatchObject({
            id: 'leads',
            label: 'views.leads',
            glyph: 'views.leads_glyph'
        });
    });

    it('registers Inbox directly with its catalog label and glyph', () => {
        expect(viewFor('inbox')).toMatchObject({
            id: 'inbox',
            label: 'views.inbox',
            glyph: 'views.inbox_glyph'
        });
    });

    it('registers LinkedIn directly with its catalog label and glyph', () => {
        expect(viewFor('linkedin')).toMatchObject({
            id: 'linkedin',
            label: 'views.linkedin',
            glyph: 'views.linkedin_glyph'
        });
    });

    it('registers the manual, the configuration and a hub document with their catalog keys', () => {
        expect(viewFor('help')).toMatchObject({
            id: 'help',
            label: 'views.help',
            glyph: 'views.help_glyph',
            group: 'system'
        });
        expect(viewFor('config')).toMatchObject({
            id: 'config',
            label: 'views.config',
            glyph: 'views.config_glyph',
            group: 'system'
        });
        // A hub document is opened for one path, so it is not offered bare in the rail.
        expect(viewFor('doc')).toMatchObject({
            id: 'doc',
            label: 'views.doc',
            glyph: 'views.doc_glyph',
            listed: false
        });
    });

    it('registers the slide catalog as an unlisted view opened from the deck', () => {
        expect(viewFor('slides')).toMatchObject({
            id: 'slides',
            label: 'views.slides',
            glyph: 'views.slides_glyph',
            listed: false
        });
    });

    it('registers the source editor as an unlisted file view', () => {
        expect(viewFor('source')).toMatchObject({
            id: 'source',
            label: 'views.source',
            glyph: 'views.source_glyph',
            listed: false
        });
    });

    it('registers the one collection component under every collection key of sources.yml', () => {
        expect(COLLECTIONS).toEqual([
            'statements',
            'funding',
            'events',
            'education',
            'applications',
            'joint-work',
            'tasks',
            'code'
        ]);
        const collections = real().filter((view) => COLLECTIONS.includes(view.id));
        expect(collections.map((view) => view.id)).toEqual(COLLECTIONS);
        expect(new Set(collections.map((view) => view.component)).size).toBe(1);
        expect(collections.every((view) => view.listed !== false)).toBe(true);
    });

    it('registers Venues directly with its catalog label and venue glyph', () => {
        expect(viewFor('venues')).toMatchObject({
            id: 'venues',
            label: 'views.venues',
            glyph: 'views.venues_glyph'
        });
        // Venues is registered as a view of its own, so the generic collection list does not carry it
        expect(COLLECTIONS).not.toContain('venues');
    });

    it('registers Pillars, Domains and Map directly with their catalog keys', () => {
        expect(viewFor('pillars')).toMatchObject({
            label: 'views.pillars',
            glyph: 'views.pillars_glyph'
        });
        expect(viewFor('domains')).toMatchObject({
            label: 'views.domains',
            glyph: 'views.domains_glyph'
        });
        expect(viewFor('map')).toMatchObject({ label: 'views.map', glyph: 'views.map_glyph' });
        // Pillars is registered as a view of its own, so the generic collection list does not carry it
        expect(COLLECTIONS).not.toContain('pillars');
        // and Domains is too
        expect(COLLECTIONS).not.toContain('domains');
    });

    it('registers the Pillars view under that id alone, so a layout saved under the old one is an unknown view', () => {
        expect(viewFor('programs')).toBeUndefined();
    });

    it('keeps a collection in its first position when it is registered again', () => {
        const before = real().map((view) => view.id);
        registerCollections(client.registry, COLLECTIONS);
        expect(real().map((view) => view.id)).toEqual(before);
    });

    it('registers the one board component under all three of its ids', () => {
        const board = real().filter((view) =>
            ['projects', 'archive', 'coauthor'].includes(view.id)
        );
        expect(new Set(board.map((view) => view.component)).size).toBe(1);
        expect(board.every((view) => typeof view.badge === 'function')).toBe(true);
    });

    it('registers every configured rail count and its urgency tone', () => {
        for (const id of ['leads', 'inbox']) {
            expect(typeof viewFor(id)?.badge).toBe('function');
            expect(typeof viewFor(id)?.badgeTone).toBe('function');
        }
        // LinkedIn's badge is a mark rather than a count, so it registers a glyph name instead.
        expect(typeof viewFor('linkedin')?.badgeGlyph).toBe('function');
        expect(viewFor('linkedin')?.badge).toBe(undefined);
        expect(typeof viewFor('linkedin')?.badgeTone).toBe('function');
        expect(viewFor('leads')?.badgeTone?.(client)).toBe('amber');
        expect(viewFor('inbox')?.badgeTone?.(client)).toBe('red');
        expect(viewFor('linkedin')?.badgeTone?.(client)).toBe('red');
        expect(viewFor('applications')?.badgeTone?.(client)).toBe('green');
        for (const key of COLLECTIONS) {
            expect(typeof viewFor(key)?.badge).toBe('function');
            expect(typeof viewFor(key)?.badgeTone).toBe('function');
        }
        expect(typeof viewFor('hpc')?.badge).toBe('function');
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
     * The rail draws the listed registrations in order, so a dropped view leaves this list. With no
     * group configured every registration is drawn directly, which is the whole of the rail.
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

    it('gives every view of the rail a glyph of its own, the collections apart', () => {
        // The collections share the folder glyph by design; every other view is told apart by its
        // glyph alone when the rail draws no label, so two views with one glyph read as one.
        // The probes this file registers borrow real glyph keys and are not the application's.
        const own = views().filter(
            (registration) =>
                !COLLECTIONS.includes(registration.id) && !registration.id.startsWith('probe')
        );
        const seen = new Map<string, string[]>();
        for (const registration of own) {
            const name = catalog[registration.glyph] ?? registration.glyph;
            seen.set(name, [...(seen.get(name) ?? []), registration.id]);
        }
        const shared = [...seen].filter(([, ids]) => ids.length > 1);
        expect(shared).toEqual([]);
    });

    it('gives every flyout group a glyph no view inside it carries', () => {
        // The opener of a group and the entries in its list are drawn together, so a group wearing
        // one of its own views' marks reads as that view rather than as the group.
        const raw = loadConfig(engineDir()).config.nav_groups as Record<
            string,
            Omit<NavGroup, 'id'>
        >;
        const groups = Object.entries(raw).map(([id, group]) => ({ id, ...group }));
        const sections = arrange(
            views().filter((view) => view.listed !== false),
            groups
        );
        // Only a flyout draws a group glyph: a small group is a heading over one button per view,
        // and shell/rail/ActivityRail.svelte reads section.glyph nowhere else.
        const clashes = sections
            .filter((section) => section.items.length > GROUP_MAX)
            .filter((section) => section.glyph !== undefined)
            .filter((section) =>
                section.items.some((view) => (catalog[view.glyph] ?? view.glyph) === section.glyph)
            )
            .map((section) => `${section.label}: ${section.glyph}`);
        expect(clashes).toEqual([]);
    });

    it('gives the Agents and Changes views a glyph of their own in the rail', () => {
        const of = (key: string): string => glyphs[catalog[key]];
        expect(of('sessions.agents_glyph')).toBeDefined();
        expect(of('sessions.changes_glyph')).toBeDefined();
        expect(of('sessions.agents_glyph')).not.toBe(of('views.joint-work_glyph'));
        expect(of('sessions.changes_glyph')).not.toBe(of('views.code_glyph'));
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
