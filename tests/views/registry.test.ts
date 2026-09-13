// The view registry, and the keys the real registrations name.
//
// The second half is the gate tests/keys.test.ts cannot give these two keys: a registration's label
// and glyph are read at the call site through lookup(), with a key that comes from data rather than
// from a literal, so the key test cannot see them. Here every registration is checked instead: its
// label resolves in config/text.yml, and its glyph key resolves to a name config/glyphs.yml holds.

import { describe, expect, it } from 'vitest';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { registerView, viewFor, views, type ViewProps } from '../../src/lib/views/registry.ts';
import type { Component } from 'svelte';
// Importing the barrel is what registers the real views, exactly as the page does it, and the
// collections are registered from the keys of sources.yml the way the page registers them.
import { registerCollections } from '../../src/routes/views.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);

const COLLECTIONS = collectionKeys(config);
registerCollections(COLLECTIONS);

/** A stand-in for a view component; the registry stores it and never calls it. */
const component = (() => {}) as unknown as Component<ViewProps>;

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
            component
        });
        expect(viewFor('probe-one')?.label).toBe('views.status');
    });

    it('has nothing for an id nobody registered', () => {
        expect(viewFor('probe-nothing')).toBe(undefined);
    });

    it('lists registrations in registration order', () => {
        registerView({
            id: 'probe-two',
            label: 'views.findings',
            glyph: 'views.findings_glyph',
            component
        });
        expect(probes().map((view) => view.id)).toEqual(['probe-one', 'probe-two']);
    });

    it('replaces an earlier registration of the same id, in its place', () => {
        registerView({
            id: 'probe-one',
            label: 'views.findings',
            glyph: 'views.findings_glyph',
            component
        });
        expect(probes().map((view) => view.id)).toEqual(['probe-one', 'probe-two']);
        expect(viewFor('probe-one')?.label).toBe('views.findings');
    });
});

describe('the real registrations', () => {
    /** The views the application registers, which is what the rail and the tabs draw. */
    function real() {
        return views().filter((view) => !view.id.startsWith('probe-'));
    }

    it('registers every view the application has, in registration order', () => {
        expect(real().map((view) => view.id)).toEqual([
            'radar',
            'leads',
            'inbox',
            'linkedin',
            'hpc',
            'usage',
            'status',
            'findings',
            'gallery',
            'venues',
            'data',
            'programs',
            'domains',
            'map',
            'focus',
            'projects',
            'archive',
            'coauthor',
            'project',
            'editor',
            'deposit',
            'document',
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
            'collaborations',
            'tasks',
            'code'
        ]);
    });

    it('registers Data directly and excludes it from generic collections', () => {
        expect(viewFor('data')).toMatchObject({
            id: 'data',
            label: 'views.data',
            glyph: 'views.data_glyph'
        });
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
            'collaborations',
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
        expect(COLLECTIONS).not.toContain('venues');
    });

    it('registers Programs, Domains and Map directly with their catalog keys', () => {
        expect(viewFor('programs')).toMatchObject({
            label: 'views.programs',
            glyph: 'views.programs_glyph'
        });
        expect(viewFor('domains')).toMatchObject({
            label: 'views.domains',
            glyph: 'views.domains_glyph'
        });
        expect(viewFor('map')).toMatchObject({ label: 'views.map', glyph: 'views.map_glyph' });
        expect(COLLECTIONS).not.toContain('programs');
        expect(COLLECTIONS).not.toContain('domains');
    });

    it('keeps a collection in its first position when it is registered again', () => {
        const before = real().map((view) => view.id);
        registerCollections(COLLECTIONS);
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
        for (const id of ['leads', 'inbox', 'linkedin']) {
            expect(typeof viewFor(id)?.badge).toBe('function');
            expect(typeof viewFor(id)?.badgeTone).toBe('function');
        }
        expect(viewFor('leads')?.badgeTone?.()).toBe('amber');
        expect(viewFor('inbox')?.badgeTone?.()).toBe('red');
        expect(viewFor('linkedin')?.badgeTone?.()).toBe('red');
        expect(viewFor('applications')?.badgeTone?.()).toBe('green');
        for (const key of COLLECTIONS) {
            expect(typeof viewFor(key)?.badge).toBe('function');
            expect(typeof viewFor(key)?.badgeTone).toBe('function');
        }
        expect(typeof viewFor('hpc')?.badge).toBe('function');
    });

    it('names a label key config/text.yml holds', () => {
        const missing = real().filter((view) => !(view.label in catalog));
        expect(missing.map((view) => `${view.id}: ${view.label}`)).toEqual([]);
    });

    it('names a glyph key whose value is a name config/glyphs.yml holds', () => {
        const missing = real().filter(
            (view) => !(view.glyph in catalog) || !(catalog[view.glyph] in glyphs)
        );
        expect(missing.map((view) => `${view.id}: ${view.glyph}`)).toEqual([]);
    });
});
