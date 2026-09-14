// The rail's grouping: what arrange() puts where, and which groups are drawn as one button with a
// list rather than as a heading over one button per view.
//
// The catalog and glyphs are the real config. The registrations are this file's own, except in the
// last block, which reads the application's registry and nav_groups.
//
// What this does NOT cover: the list opening. There is no DOM in this suite, so no menu is clicked
// and no $effect runs; a closed Menu renders its opener and no list, which is what is asserted.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail, {
    GROUP_MAX,
    arrange,
    railOrder,
    type NavGroup
} from '../../src/lib/shell/ActivityRail.svelte';
import {
    collectionKeys,
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setAscii, setCatalog, setGlyphMode, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { setAppearance } from '../../src/lib/state/appearance.ts';
import { setTextScale, setTheme } from '../../src/lib/state/ui.svelte.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { installBadges } from '../state/rail-badges-fixture.ts';
import {
    registerView,
    viewFor,
    views,
    type Registration,
    type ViewProps
} from '../../src/lib/views/registry.ts';
import type { Component } from 'svelte';
// Importing the route loader registers the application's views. Collections use sources.yml keys.
import { registerCollections } from '../../src/routes/views.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
setAppearance(config);

const COLLECTIONS = collectionKeys(config);
registerCollections(COLLECTIONS);

/** A stand-in for a view component; the registry stores it and the rail never mounts it. */
const component = (() => {}) as unknown as Component<ViewProps>;

/** A registration of this file's own, told apart from the application's by its id. */
function probe(id: string, group = '', order = 0): Registration {
    return { id, label: 'views.status', glyph: 'views.status_glyph', component, group, order };
}

/** How many times a fragment occurs in a rendering. */
function count(body: string, fragment: string): number {
    return body.split(fragment).length - 1;
}

/** The rendered button carrying one attribute, or nothing when the attribute stayed on a wrapper. */
function buttonWith(body: string, attribute: string): string | undefined {
    return [...body.matchAll(/<button\b[^>]*>/g)]
        .map(([button]) => button)
        .find((button) => button.includes(attribute));
}

describe('arrange', () => {
    it("puts a group's views in the group's own key order, and the rest at the end", () => {
        const found = arrange(
            [probe('c'), probe('a', 'two', 1), probe('b', 'two', 0)],
            [{ id: 'two', label: 'Two' }]
        );
        expect(found.map((section) => section.label)).toEqual(['Two', null]);
        expect(found[0].items.map((view) => view.id)).toEqual(['b', 'a']);
        expect(found[1].items.map((view) => view.id)).toEqual(['c']);
    });

    it('resolves equal orders by view id', () => {
        const found = arrange(
            [probe('charlie', 'one', 2), probe('alpha', 'one', 2), probe('bravo', 'one', 2)],
            [{ id: 'one', label: 'One' }]
        );
        expect(found[0].items.map((view) => view.id)).toEqual(['alpha', 'bravo', 'charlie']);
    });

    it('draws no group for keys no registration answers', () => {
        expect(arrange([probe('a')], [{ id: 'none', label: 'None' }])).toEqual([
            { label: null, items: [probe('a')] }
        ]);
    });

    it("carries the group's glyph when it has one, and leaves it off when it has none", () => {
        const found = arrange(
            [probe('a', 'iconed'), probe('b', 'bare')],
            [
                { id: 'iconed', label: 'Iconed', glyph: 'chat' },
                { id: 'bare', label: 'Bare' }
            ]
        );
        expect(found[0].glyph).toBe('chat');
        expect(found[1].glyph).toBe(undefined);
    });

    it('exposes direct digits, full display order, and configured flyout chords', () => {
        const registrations = [
            probe('a', 'direct', 1),
            probe('b', 'direct', 0),
            ...['c', 'd', 'e', 'f', 'g'].map((id, order) => probe(id, 'flyout', order))
        ];
        const found = railOrder(registrations, [
            { id: 'direct', label: 'Direct' },
            { id: 'flyout', label: 'Flyout', chord: 'c' }
        ]);
        expect(found).toEqual({
            direct: ['b', 'a'],
            all: ['b', 'a', 'c', 'd', 'e', 'f', 'g'],
            chords: { c: ['c', 'd', 'e', 'f', 'g'] }
        });
    });
});

describe('the rail, drawn', () => {
    /** Five views in one group and two in another, which is either side of GROUP_MAX. */
    const BIG = ['big-1', 'big-2', 'big-3', 'big-4', 'big-5'];
    const SMALL = ['small-1', 'small-2'];
    for (const [order, id] of BIG.entries()) registerView(probe(id, 'bigger', order));
    for (const [order, id] of SMALL.entries()) registerView(probe(id, 'smaller', order));

    const groups: NavGroup[] = [
        { id: 'bigger', label: 'Bigger', glyph: 'chat' },
        { id: 'smaller', label: 'Smaller' }
    ];
    const body = render(ActivityRail, { props: { groups } }).body;

    it('holds more views in the big group than a group may have and still be buttons', () => {
        expect(BIG.length).toBeGreaterThan(GROUP_MAX);
        expect(SMALL.length).toBeLessThanOrEqual(GROUP_MAX);
    });

    it('draws the big group as one opener under its heading and no button of its own', () => {
        expect(count(body, 'data-group="Bigger"')).toBe(1);
        expect(body).toContain('>Bigger</p>');
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

    it('draws each direct view label under its glyph without moving its browser identity', () => {
        for (const id of SMALL) {
            const button = body.match(
                new RegExp(`<button[^>]*data-view="${id}"[\\s\\S]*?<\\/button>`)
            )?.[0];
            expect(button).toMatch(/class="[^"]*stacked[^"]*"/);
            expect(button).toMatch(/class="glyph[^"]*"[\s\S]*class="label[^"]*">Status/);
        }
    });

    it('uses the measured rail width and clips labels without removing their tooltip', () => {
        const tokens = readFileSync('src/lib/themes/tokens.css', 'utf8');
        const button = readFileSync('src/lib/ui/ToolButton.svelte', 'utf8');
        expect(tokens).toContain('--rail-width: 98px');
        expect(button).toMatch(
            /\.tool\.stacked :global\(\.label\)\s*{[^}]*text-overflow:\s*ellipsis/s
        );
        expect(body).toMatch(/role="tooltip"[^>]*>Status<\/span>/);
    });

    it('draws the search, update, and three app text controls from the catalog', () => {
        expect(body).toContain('data-action="search"');
        expect(body).toContain('data-action="update"');
        expect(body).toContain(`aria-label="${catalog['app.search']}"`);
        expect(body).toContain(`aria-label="${catalog['app.tasks.update_tasks']}"`);
        expect(body).toContain(catalog['app.search_tip']);
        expect(body).toContain(catalog['app.update_tip']);
        expect(body).toContain(`aria-label="${catalog['app.text_smaller']}"`);
        expect(body).toContain(`aria-label="${catalog['app.text_larger']}"`);
        expect(body).toContain(`aria-label="${catalog['app.text_reset']}"`);
        for (const label of ['app.text_smaller', 'app.text_larger', 'app.text_reset']) {
            expect(buttonWith(body, `aria-label="${catalog[label]}"`)).toMatch(
                /class="[^"]*rail-control/
            );
        }
    });

    it('draws the three appearance toggles with their own glyphs and short labels', () => {
        setTheme('mocha');
        try {
            const themed = render(ActivityRail, { props: { groups } }).body;
            for (const [key, glyph] of [
                ['ui.crt_on', 'crt'],
                ['ui.wallpaper', 'wallpaper'],
                ['ui.unicode', 'unicode']
            ]) {
                const button = themed.match(
                    new RegExp(
                        `<button[^>]*aria-label="${catalog[key]}"[^>]*>[\\s\\S]*?<\\/button>`
                    )
                )?.[0];
                expect(button).toBeDefined();
                expect(button).toContain(glyphCatalog(config)[glyph]);
            }
        } finally {
            setTheme('light');
        }
    });

    it('draws the three appearance toggles with ASCII stand-ins in ASCII mode', () => {
        setTheme('mocha');
        setAscii(asciiCatalog(config));
        setGlyphMode('ascii');
        try {
            const themed = render(ActivityRail, { props: { groups } }).body;
            for (const [key, name, standIn] of [
                ['ui.crt_on', 'crt', '[/]'],
                ['ui.wallpaper', 'wallpaper', '[w]'],
                ['ui.unicode', 'unicode', '&lt;>']
            ]) {
                const button = [...themed.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
                    .map(([html]) => html)
                    .find((html) => html.includes(`aria-label="${catalog[key]}"`));
                expect(button).toBeDefined();
                expect(button).toContain(`>${standIn}</span>`);
                expect(button).not.toContain(glyphCatalog(config)[name]);
            }
        } finally {
            setGlyphMode('unicode');
            setTheme('light');
        }
    });
});

describe('the app text controls', () => {
    it.each([
        { scale: null, disabled: [false, false, true] },
        { scale: 0.7, disabled: [true, false, false] },
        { scale: 1.6, disabled: [false, true, false] }
    ])('disables the applicable controls at scale $scale', ({ scale, disabled }) => {
        setTextScale(scale);
        try {
            const body = render(ActivityRail, { props: { groups: [] } }).body;
            const keys = ['app.text_smaller', 'app.text_larger', 'app.text_reset'];
            for (const [index, key] of keys.entries()) {
                const button = buttonWith(body, `aria-label="${catalog[key]}"`);
                expect(button).toBeDefined();
                expect(/\sdisabled(?:[\s=>])/.test(button!)).toBe(disabled[index]);
            }
        } finally {
            setTextScale(null);
        }
    });
});

describe('a rail badge', () => {
    it('draws a toned registration badge beside its glyph and nothing at zero', () => {
        registerView({ ...probe('badged', 'badge'), badge: () => '3 5', badgeTone: () => 'red' });
        registerView({
            ...probe('zero-badge', 'badge'),
            badge: () => '',
            badgeTone: () => 'green'
        });
        const body = render(ActivityRail, {
            props: { groups: [{ id: 'badge', label: 'Badge' }] }
        }).body;
        expect(body).toMatch(/class="badge\s/);
        expect(body).toContain('3 5');
        expect(body).toContain('--badge-bg: var(--c-red)');
        expect(body).not.toContain('--badge-bg: var(--c-green)');
        expect(body).toContain('title="Status 3 5"');
    });

    it('puts browser identities and the rail box class on direct and bookmark buttons', () => {
        const direct = render(ActivityRail, {
            props: {
                groups: [{ id: 'badge', label: 'Controls' }],
                bookmarks: [{ label: 'Manual', root: 'docs', path: 'manual.html' }]
            }
        }).body;
        const view = buttonWith(direct, 'data-view="badged"');
        const bookmark = buttonWith(direct, 'data-bookmark="docs/manual.html"');
        expect(view).toMatch(/class="[^"]*rail-control/);
        expect(view).toMatch(/class="[^"]*stacked/);
        expect(bookmark).toMatch(/class="[^"]*rail-control/);
        expect(bookmark).toMatch(/class="[^"]*stacked/);
        expect(direct).not.toContain('<div class="control" data-view=');
        expect(direct).not.toContain('<div class="control" data-bookmark=');
    });

    it('gives the large-group opener the same rail box class', () => {
        const ids = ['flyout-1', 'flyout-2', 'flyout-3', 'flyout-4', 'flyout-5'];
        for (const [order, id] of ids.entries()) registerView(probe(id, 'flyout', order));
        const rendered = render(ActivityRail, {
            props: { groups: [{ id: 'flyout', label: 'Flyout', glyph: 'chat' }] }
        }).body;
        const group = rendered.match(/data-group="Flyout"[\s\S]*?<button\b[^>]*>/)?.[0] ?? '';
        expect(group).toContain('rail-control');
        expect(group).toContain('stacked');
    });

    it('puts the Live HPC split in the compact rail badge title', () => {
        receive({
            channel: 'hpc',
            version: 7001,
            payload: { status: 'ok', total: 3, running: 2, pending: 1 }
        });
        const registered = viewFor('hpc');
        expect(registered).toBeDefined();
        registerView({ ...registered!, id: 'probe-hpc', group: 'hpc-only', order: 0 });
        const hpc = render(ActivityRail, {
            props: { groups: [{ id: 'hpc-only', label: 'HPC' }] }
        }).body;
        expect(hpc).toContain('title="running: 2 | pending: 1"');
        expect(hpc).toMatch(/class="badge[^>]*aria-hidden="true"/);
    });

    it('puts an archive rollup and a collection rule label in the rail badge titles', () => {
        installBadges(config);
        const body = render(ActivityRail, { props: { groups: [] } }).body;
        const archive = body.match(
            /data-view="archive"[\s\S]*?<span\b[^>]*class="badge[^>]*>/
        )?.[0];
        const funding = body.match(
            /data-view="funding"[\s\S]*?<span\b[^>]*class="badge[^>]*>/
        )?.[0];
        const projects = body.match(
            /data-view="projects"[\s\S]*?<span\b[^>]*class="badge[^>]*>/
        )?.[0];
        const coauthor = body.match(
            /data-view="coauthor"[\s\S]*?<span\b[^>]*class="badge[^>]*>/
        )?.[0];
        expect(archive).toContain('title="papers: 1 | outputs: 1 | dead-ends: 1"');
        expect(funding).toContain('title="1 undecided"');
        expect(projects).toMatch(/title="active: \d+ \| manuscript: \d+ \| idea: \d+"/);
        expect(coauthor).toMatch(
            /title="in progress: \d+ \| papers: \d+ \| outputs: \d+ \| dead-ends: \d+"/
        );
        expect(archive).toContain('aria-hidden="true"');
        expect(funding).toContain('aria-hidden="true"');
    });
});

describe('the groups of the real config', () => {
    /** The `nav_groups` mapping of config/layout.yml, as the page reads it. */
    function realGroups(): NavGroup[] {
        const raw = config.nav_groups as Record<string, Omit<NavGroup, 'id'>>;
        return Object.entries(raw).map(([id, group]) => ({ id, ...group }));
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

    it('draws headings above the Sessions and Academic life flyout openers', () => {
        const body = render(ActivityRail, { props: { groups: realGroups() } }).body;
        for (const [label, chord] of [
            ['Sessions', 'm'],
            ['Academic life', 'c']
        ]) {
            expect(body).toContain(`data-group="${label}"`);
            expect(body).toContain(`data-chord="${chord}"`);
            expect(body).toMatch(
                new RegExp(`<p class="group[^"]*">${label}<\\/p>[\\s\\S]*?aria-label="${label}"`)
            );
        }
    });

    it('exposes the real rail order and the two configured flyout chords', () => {
        const order = railOrder(
            views().filter((view) => view.listed !== false),
            realGroups()
        );
        expect(order.direct.slice(0, 4)).toEqual(['focus', 'projects', 'coauthor', 'archive']);
        expect(order.all).toContain('funding');
        expect(order.chords.c).toEqual([
            'funding',
            'events',
            'education',
            'applications',
            'collaborations',
            'tasks'
        ]);
        expect(order.chords.m).toEqual([
            'session-list',
            'session-detail',
            'terminal',
            'transcript',
            'timeline',
            'changes',
            'agents'
        ]);
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

    it('draws the Feeds heading with Lit Watch, Position Leads, Inbox, and LinkedIn', () => {
        expect(section('Feeds').map((view) => view.id)).toEqual([
            'radar',
            'leads',
            'inbox',
            'linkedin'
        ]);
        expect(section('Feeds').length).toBeLessThanOrEqual(GROUP_MAX);
        expect(render(ActivityRail, { props: { groups: realGroups() } }).body).toContain(
            '>Feeds</p>'
        );
    });

    it('keeps the four boards together and puts Programs, Domains and Map under Pillars', () => {
        expect(section('Boards').map((view) => view.id)).toEqual([
            'focus',
            'projects',
            'coauthor',
            'archive'
        ]);
        expect(section('Pillars').map((view) => view.id)).toEqual(['programs', 'domains', 'map']);
        expect(realGroups().find((group) => group.label === 'Pillars')?.glyph).toBe('program');
    });
});
