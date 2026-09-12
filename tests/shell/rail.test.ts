// The rail's grouping: what arrange() puts where, and which groups are drawn as one button with a
// list rather than as a heading over one button per view.
//
// The catalog and the glyphs are the real config, so the words checked here are config/text.yml's.
// The registrations are this file's own, except in the last block, which reads the application's
// registry and the real nav_groups: what a group holds today is a fact about config/layout.yml and
// config/sources.yml together, and that is the one thing no synthetic fixture can check.
//
// What this does NOT cover: the list opening. There is no DOM in this suite, so no menu is clicked
// and no $effect runs; a closed Menu renders its opener and no list, which is what is asserted.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail, {
    GROUP_MAX,
    arrange,
    type NavGroup
} from '../../src/lib/shell/ActivityRail.svelte';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import {
    registerView,
    views,
    type Registration,
    type ViewProps
} from '../../src/lib/views/registry.ts';
import type { Component } from 'svelte';
// Importing the barrel registers the application's own views, exactly as the page does it; the
// collections are registered the way the page registers them, from the keys of sources.yml.
import { registerCollections } from '../../src/routes/views.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const COLLECTIONS = collectionKeys(config);
registerCollections(COLLECTIONS);

/** A stand-in for a view component; the registry stores it and the rail never mounts it. */
const component = (() => {}) as unknown as Component<ViewProps>;

/** A registration of this file's own, told apart from the application's by its id. */
function probe(id: string): Registration {
    return { id, label: 'views.status', glyph: 'views.status_glyph', component };
}

/** How many times a fragment occurs in a rendering. */
function count(body: string, fragment: string): number {
    return body.split(fragment).length - 1;
}

describe('arrange', () => {
    it("puts a group's views in the group's own key order, and the rest at the end", () => {
        const found = arrange(
            [probe('c'), probe('a'), probe('b')],
            [{ label: 'Two', keys: ['b', 'a'] }]
        );
        expect(found.map((section) => section.label)).toEqual(['Two', null]);
        expect(found[0].items.map((view) => view.id)).toEqual(['b', 'a']);
        expect(found[1].items.map((view) => view.id)).toEqual(['c']);
    });

    it('draws no group for keys no registration answers', () => {
        expect(arrange([probe('a')], [{ label: 'None', keys: ['x', 'y'] }])).toEqual([
            { label: null, items: [probe('a')] }
        ]);
    });

    it("carries the group's glyph when it has one, and leaves it off when it has none", () => {
        const found = arrange(
            [probe('a'), probe('b')],
            [
                { label: 'Iconed', keys: ['a'], glyph: 'chat' },
                { label: 'Bare', keys: ['b'] }
            ]
        );
        expect(found[0].glyph).toBe('chat');
        expect(found[1].glyph).toBe(undefined);
    });
});

describe('the rail, drawn', () => {
    /** Five views in one group and two in another, which is either side of GROUP_MAX. */
    const BIG = ['big-1', 'big-2', 'big-3', 'big-4', 'big-5'];
    const SMALL = ['small-1', 'small-2'];
    for (const id of [...BIG, ...SMALL]) registerView(probe(id));

    const groups: NavGroup[] = [
        { label: 'Bigger', keys: BIG, glyph: 'chat' },
        { label: 'Smaller', keys: SMALL }
    ];
    const body = render(ActivityRail, { props: { groups } }).body;

    it('holds more views in the big group than a group may have and still be buttons', () => {
        expect(BIG.length).toBeGreaterThan(GROUP_MAX);
        expect(SMALL.length).toBeLessThanOrEqual(GROUP_MAX);
    });

    it('draws the big group as one opener with no heading and no button of its own', () => {
        expect(count(body, 'data-group="Bigger"')).toBe(1);
        expect(body).not.toContain('>Bigger</p>');
        for (const id of BIG) expect(body).not.toContain(`data-view="${id}"`);
    });

    it('names the group on the opener and gives it the glyph the group carries', () => {
        expect(body).toContain('aria-label="Bigger"');
        expect(body).toContain(glyphCatalog(config).chat);
    });

    it('draws the small group as a heading over one button per view', () => {
        expect(body).not.toContain('data-group="Smaller"');
        expect(body).toContain('>Smaller</p>');
        for (const id of SMALL) expect(count(body, `data-view="${id}"`)).toBe(1);
    });
});

describe('a rail badge', () => {
    it('draws the registration badge beside its glyph', () => {
        registerView({ ...probe('badged'), badge: () => '3 5' });
        const body = render(ActivityRail, {
            props: { groups: [{ label: 'Badge', keys: ['badged'] }] }
        }).body;
        expect(body).toMatch(/class="badge\s/);
        expect(body).toContain('3 5');
    });
});

describe('the groups of the real config', () => {
    /** The `nav_groups` of config/layout.yml, both of its lists flattened, as the page reads it. */
    function realGroups(): NavGroup[] {
        const raw = config.nav_groups as Record<string, NavGroup[]>;
        return Object.values(raw).flat();
    }

    const sections = arrange(
        views().filter((view) => view.listed !== false),
        realGroups()
    );

    function section(label: string): Registration[] {
        return sections.find((found) => found.label === label)?.items ?? [];
    }

    it('registers the eight collections of sources.yml', () => {
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
    });

    it('puts six of them under Academic life, which is therefore a flyout', () => {
        expect(section('Academic life').map((view) => view.id)).toEqual([
            'funding',
            'events',
            'education',
            'applications',
            'collaborations',
            'tasks'
        ]);
        expect(section('Academic life').length).toBeGreaterThan(GROUP_MAX);
    });

    it('puts the other two collections, Venues and Data under Sources', () => {
        expect(section('Sources').map((view) => view.id)).toEqual([
            'venues',
            'data',
            'code',
            'statements'
        ]);
        expect(section('Sources').length).toBeLessThanOrEqual(GROUP_MAX);
    });

    it('leaves every collection in a group, so none of them trails at the end', () => {
        const rest = sections.find((found) => found.label === null)?.items ?? [];
        expect(rest.map((view) => view.id).filter((id) => COLLECTIONS.includes(id))).toEqual([]);
    });

    it('draws the Feeds heading with Lit Watch, Position Leads, and Inbox', () => {
        expect(section('Feeds').map((view) => view.id)).toEqual(['radar', 'leads', 'inbox']);
        expect(section('Feeds').length).toBeLessThanOrEqual(GROUP_MAX);
        expect(render(ActivityRail, { props: { groups: realGroups() } }).body).toContain(
            '>Feeds</p>'
        );
    });
});
