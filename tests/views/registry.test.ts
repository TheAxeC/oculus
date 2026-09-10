// The view registry, and the keys the real registrations name.
//
// The second half is the gate tests/keys.test.ts cannot give these two keys: a registration's label
// and glyph are read at the call site through lookup(), with a key that comes from data rather than
// from a literal, so the key test cannot see them. Here every registration is checked instead: its
// label resolves in config/text.yml, and its glyph key resolves to a name config/glyphs.yml holds.

import { describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { registerView, viewFor, views, type ViewProps } from '../../src/lib/views/registry.ts';
import type { Component } from 'svelte';
// Importing the barrel is what registers the real views, exactly as the page does it.
import '../../src/routes/views.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const glyphs = glyphCatalog(config);

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
            'status',
            'findings',
            'gallery',
            'projects',
            'archive',
            'coauthor',
            'project',
            'editor',
            'session-list',
            'session-detail',
            'terminal',
            'timeline',
            'changes',
            'agents'
        ]);
    });

    it('registers the one board component under all three of its ids', () => {
        const board = real().filter((view) =>
            ['projects', 'archive', 'coauthor'].includes(view.id)
        );
        expect(new Set(board.map((view) => view.component)).size).toBe(1);
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
