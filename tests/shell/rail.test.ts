// The rail's grouping: what arrange() puts where, and which groups are drawn as one button with a
// list rather than as a heading over one button per view.
//
// The catalog and glyphs are the real config. The registrations are this file's own, except in the
// last block, which reads the application's registry and nav_groups.
//
// What this does NOT cover: the list opening. There is no DOM in this suite, so no menu is clicked
// and no $effect runs; a closed Menu renders its opener and no list, which is what is asserted.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../src/lib/shell/ActivityRail.svelte';
import {
    GROUP_MAX,
    arrange,
    docState,
    documentState,
    isFlyout,
    railOrder,
    sectionSize,
    type DocEntry,
    type Bookmark,
    type NavGroup
} from '../../src/lib/shell/rail.ts';
import {
    collectionKeys,
    asciiCatalog,
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import {
    setAscii,
    setCatalog,
    setGlyphMode,
    setGlyphs,
    setIcons
} from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { setAppearance } from '../../src/lib/state/appearance.ts';
import { installBadges } from '../state/rail-badges-fixture.ts';
import type { Registration, ViewProps } from '../../src/lib/views/registry.ts';
import type { Component } from 'svelte';
// Importing the route loader registers the application's views. Collections use sources.yml keys.
import { registerAll, registerCollections } from '../../src/routes/views.ts';
import { noop } from '../doubles.ts';
import { present } from '../present.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let setTextScale: ClientState['ui']['setTextScale'];
let setTheme: ClientState['ui']['setTheme'];
let receive: ClientState['entities']['receive'];
let registerView: ClientState['registry']['registerView'];
let viewFor: ClientState['registry']['viewFor'];
let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ setTextScale, setTheme } = client.ui);
    ({ receive } = client.entities);
    ({ registerView, viewFor, views } = client.registry);
    registerAll(client.registry);
    registerCollections(client.registry, COLLECTIONS);
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));
setAppearance(config);

const COLLECTIONS = collectionKeys(config);

/** A stand-in for a view component; the registry stores it and the rail never mounts it. */
const component = noop as unknown as Component<ViewProps>;

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

/** A configured hub document, the shape of one entry of the `docs:` list of layout.yml. */
function doc(path: string, group: string, label = path): DocEntry {
    return { label, path, group };
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
            { label: null, items: [probe('a')], docs: [] }
        ]);
    });

    it("puts a group's documents after its views, in the order the config lists them", () => {
        const found = arrange(
            [probe('b', 'one', 1), probe('a', 'one', 0)],
            [{ id: 'one', label: 'One' }],
            [doc('SECOND.md', 'one'), doc('FIRST.md', 'one')]
        );
        expect(found).toHaveLength(1);
        expect(found[0].items.map((view) => view.id)).toEqual(['a', 'b']);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['SECOND.md', 'FIRST.md']);
        expect(sectionSize(found[0])).toBe(4);
    });

    it('draws a group whose documents are all it has', () => {
        const found = arrange([], [{ id: 'one', label: 'One' }], [doc('ONE.md', 'one')]);
        expect(found.map((section) => section.label)).toEqual(['One']);
        expect(found[0].items).toEqual([]);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['ONE.md']);
    });

    it('trails a document whose group nothing configures, with the ungrouped views', () => {
        const found = arrange([probe('a')], [{ id: 'one', label: 'One' }], [doc('ONE.md', 'gone')]);
        expect(found.map((section) => section.label)).toEqual([null]);
        expect(found[0].docs.map((entry) => entry.path)).toEqual(['ONE.md']);
    });

    it('counts a document towards the size that makes a group a list', () => {
        const views = [probe('a', 'one', 0), probe('b', 'one', 1), probe('c', 'one', 2)];
        const small = arrange(views, [{ id: 'one', label: 'One' }], [doc('ONE.md', 'one')]);
        expect(isFlyout(small[0])).toBe(false);
        const large = arrange(
            views,
            [{ id: 'one', label: 'One' }],
            [doc('ONE.md', 'one'), doc('TWO.md', 'one')]
        );
        expect(sectionSize(large[0])).toBe(GROUP_MAX + 1);
        expect(isFlyout(large[0])).toBe(true);
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

    it('exposes direct digits and configured flyout chords', () => {
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
            chords: { c: ['c', 'd', 'e', 'f', 'g'] }
        });
    });

    it('puts the direct views under the configured letter, which a group of its own keeps', () => {
        const registrations = [
            probe('a', 'direct', 0),
            ...['c', 'd', 'e', 'f', 'g'].map((id, order) => probe(id, 'flyout', order))
        ];
        const groups = [
            { id: 'direct', label: 'Direct' },
            { id: 'flyout', label: 'Flyout', chord: 'c' }
        ];
        expect(railOrder(registrations, groups, 'v').chords).toEqual({
            v: ['a'],
            c: ['c', 'd', 'e', 'f', 'g']
        });
        expect(railOrder(registrations, groups, 'c').chords).toEqual({
            c: ['c', 'd', 'e', 'f', 'g']
        });
        expect(railOrder([], groups, 'v').chords).toEqual({});
    });
});

describe('the rail, drawn', () => {
    /** Five views in one group and two in another, which is either side of GROUP_MAX. */
    const BIG = ['big-1', 'big-2', 'big-3', 'big-4', 'big-5'];
    const SMALL = ['small-1', 'small-2'];
    beforeEach(() => {
        for (const [order, id] of BIG.entries()) registerView(probe(id, 'bigger', order));
        for (const [order, id] of SMALL.entries()) registerView(probe(id, 'smaller', order));
    });

    const groups: NavGroup[] = [
        { id: 'bigger', label: 'Bigger', glyph: 'chat' },
        { id: 'smaller', label: 'Smaller' }
    ];
    let body: string;
    beforeEach(() => {
        body = render(ActivityRail, { context: clientContext(client), props: { groups } }).body;
    });

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
            const button = new RegExp(`<button[^>]*data-view="${id}"[\\s\\S]*?<\\/button>`).exec(
                body
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
            const themed = render(ActivityRail, {
                context: clientContext(client),
                props: { groups }
            }).body;
            for (const [key, glyph] of [
                ['ui.crt_on', 'crt'],
                ['ui.wallpaper', 'wallpaper'],
                ['ui.unicode', 'unicode']
            ]) {
                const button = new RegExp(
                    `<button[^>]*aria-label="${catalog[key]}"[^>]*>[\\s\\S]*?<\\/button>`
                ).exec(themed)?.[0];
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
            const themed = render(ActivityRail, {
                context: clientContext(client),
                props: { groups }
            }).body;
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
            const body = render(ActivityRail, {
                context: clientContext(client),
                props: { groups: [] }
            }).body;
            const keys = ['app.text_smaller', 'app.text_larger', 'app.text_reset'];
            for (const [index, key] of keys.entries()) {
                const button = buttonWith(body, `aria-label="${catalog[key]}"`);
                expect(button).toBeDefined();
                expect(/\sdisabled(?:[\s=>])/.test(present(button, `control ${key}`))).toBe(
                    disabled[index]
                );
            }
        } finally {
            setTextScale(null);
        }
    });
});

describe('a rail badge', () => {
    beforeEach(() => {
        registerView({ ...probe('badged', 'badge'), badge: () => '3 5', badgeTone: () => 'red' });
        registerView({
            ...probe('zero-badge', 'badge'),
            badge: () => '',
            badgeTone: () => 'green'
        });
        registerView({
            ...probe('marked', 'badge'),
            badgeGlyph: () => 'bang',
            badgeTone: () => 'red'
        });
    });

    it('draws a toned registration badge beside its glyph and nothing at zero', () => {
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: { groups: [{ id: 'badge', label: 'Badge' }] }
        }).body;
        expect(body).toMatch(/class="badge\s/);
        expect(body).toContain('3 5');
        expect(body).toContain('--badge-bg: var(--c-red)');
        expect(body).not.toContain('--badge-bg: var(--c-green)');
        expect(body).toContain('title="Status 3 5"');
    });

    it('draws a badge that is a mark as an icon, and says it in words in its title', () => {
        setIcons(iconSet(config));
        try {
            const body = render(ActivityRail, {
                context: clientContext(client),
                props: { groups: [{ id: 'badge', label: 'Badge' }] }
            }).body;
            // The badge of this view, from its class to the tag that closes it around the drawing.
            const at = body.indexOf('class="badge', body.indexOf('data-view="marked"'));
            expect(at).toBeGreaterThan(-1);
            const badge = body.slice(
                body.lastIndexOf('<span', at),
                body.indexOf('</span>', body.indexOf('</svg>', at)) + 7
            );
            expect(badge).toContain('<svg');
            // Nothing is drawn as text inside the badge: the mark is the drawing and no more.
            expect(badge.replace(/<[^>]*>/g, '').trim()).toBe('');
            // The hover words are text, so there the mark is still its character.
            expect(badge).toContain(`title="Status ${glyphCatalog(config).bang}"`);
        } finally {
            setIcons({});
        }
    });

    it('puts browser identities and the rail box class on direct and bookmark buttons', () => {
        const direct = render(ActivityRail, {
            context: clientContext(client),
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
            context: clientContext(client),
            props: { groups: [{ id: 'flyout', label: 'Flyout', glyph: 'chat' }] }
        }).body;
        const group = /data-group="Flyout"[\s\S]*?<button\b[^>]*>/.exec(rendered)?.[0] ?? '';
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
        registerView({
            ...present(registered, 'hpc registration'),
            id: 'probe-hpc',
            group: 'hpc-only',
            order: 0
        });
        const hpc = render(ActivityRail, {
            context: clientContext(client),
            props: { groups: [{ id: 'hpc-only', label: 'HPC' }] }
        }).body;
        expect(hpc).toContain('title="running: 2 | pending: 1"');
        expect(hpc).toMatch(/class="badge[^>]*aria-hidden="true"/);
    });

    it('puts an archive rollup and a collection rule label in the rail badge titles', () => {
        installBadges(client, config);
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: { groups: [] }
        }).body;
        const archive = /data-view="archive"[\s\S]*?<span\b[^>]*class="badge[^>]*>/.exec(body)?.[0];
        const funding = /data-view="funding"[\s\S]*?<span\b[^>]*class="badge[^>]*>/.exec(body)?.[0];
        const projects = /data-view="projects"[\s\S]*?<span\b[^>]*class="badge[^>]*>/.exec(
            body
        )?.[0];
        const coauthor = /data-view="coauthor"[\s\S]*?<span\b[^>]*class="badge[^>]*>/.exec(
            body
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

describe('the documents in the rail', () => {
    it("draws a group's document after its views, as a button carrying the path", () => {
        registerView(probe('first', 'one', 0));
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: {
                groups: [{ id: 'one', label: 'One' }],
                docs: [doc('NOTES.md', 'one', 'Notes')]
            }
        }).body;
        const button = buttonWith(body, 'data-doc="NOTES.md"');
        expect(button).toBeDefined();
        expect(button).toMatch(/class="[^"]*rail-control/);
        expect(body.indexOf('data-view="first"')).toBeLessThan(body.indexOf('data-doc='));
        expect(body).toContain('Notes');
    });

    it('draws a group of documents alone under its own heading', () => {
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: {
                groups: [{ id: 'papers', label: 'Papers' }],
                docs: [doc('ONE.md', 'papers'), doc('TWO.md', 'papers')]
            }
        }).body;
        expect(body).toContain('>Papers</p>');
        expect(buttonWith(body, 'data-doc="ONE.md"')).toBeDefined();
        expect(buttonWith(body, 'data-doc="TWO.md"')).toBeDefined();
    });

    it("holds a large group's documents in its list rather than beside it", () => {
        const ids = ['flyout-1', 'flyout-2', 'flyout-3', 'flyout-4'];
        for (const [order, id] of ids.entries()) registerView(probe(id, 'flyout', order));
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: {
                groups: [{ id: 'flyout', label: 'Flyout', glyph: 'chat' }],
                docs: [doc('ONE.md', 'flyout')]
            }
        }).body;
        expect(body).toContain('data-group="Flyout"');
        // The list is closed in a rendering with no DOM, so neither its views nor its documents
        // are drawn as buttons of the rail.
        expect(buttonWith(body, 'data-doc="ONE.md"')).toBeUndefined();
        expect(buttonWith(body, 'data-view="flyout-1"')).toBeUndefined();
    });

    it('is a tab of its own per path, so two documents are two tabs', () => {
        expect(docState(doc('ONE.md', 'one')).id).toBe('ONE.md');
        expect(docState(doc('TWO.md', 'one')).id).toBe('TWO.md');
    });
});

describe('the groups of the real config', () => {
    /** The `nav_groups` mapping of config/layout.yml, as the page reads it. */
    function realGroups(): NavGroup[] {
        const raw = config.nav_groups as Record<string, Omit<NavGroup, 'id'>>;
        return Object.entries(raw).map(([id, group]) => ({ id, ...group }));
    }

    /** The `docs` list of config/layout.yml, as the page reads it. */
    function realDocs(): DocEntry[] {
        return config.docs as DocEntry[];
    }

    let sections: ReturnType<typeof arrange>;

    beforeEach(() => {
        sections = arrange(
            views().filter((view) => view.listed !== false),
            realGroups(),
            realDocs()
        );
    });

    function section(label: string): Registration[] {
        return sections.find((found) => found.label === label)?.items ?? [];
    }

    it('draws Personal for the wall and its two documents, and puts the third in System', () => {
        const personal = sections.find((found) => found.label === 'Personal');
        expect(personal?.items.map((view) => view.id)).toEqual(['memories']);
        expect(personal?.docs.map((entry) => entry.path)).toEqual([
            'RESEARCH-APPROACH.md',
            'AGENT-APPROACH.md'
        ]);
        const [system] = sections.filter((found) => found.label === 'System');
        expect(system.docs.map((entry) => entry.path)).toEqual(['HPC-UTwente-howto.md']);
        expect(system.items.map((view) => view.id)).toEqual([
            'status',
            'findings',
            'gallery',
            'hpc',
            'usage',
            'help',
            'config',
            'audit',
            'history'
        ]);
        expect(isFlyout(system)).toBe(true);
    });

    it('registers the eight collections of sources.yml', () => {
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
    });

    it('puts the six collections and the deck under Academic life, which is therefore a flyout', () => {
        expect(section('Academic life').map((view) => view.id)).toEqual([
            'funding',
            'events',
            'education',
            'applications',
            'joint-work',
            'tasks',
            'present'
        ]);
        expect(section('Academic life').length).toBeGreaterThan(GROUP_MAX);
    });

    it('draws a heading, a chord and a mark above every flyout opener', () => {
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: { groups: realGroups() }
        }).body;
        const glyphs = glyphCatalog(config);
        // Every group the rail flies out, with the letter and the mark its configuration names.
        for (const section of sections) {
            if (section.label === null || section.items.length <= GROUP_MAX) continue;
            const { label, chord, glyph } = section;
            expect(body).toContain(`data-group="${label}"`);
            expect(body).toContain(`data-chord="${chord}"`);
            expect(glyph === undefined ? '' : glyphs[glyph]).not.toBe('');
            expect(body).toMatch(
                new RegExp(`<p class="group[^"]*">${label}<\\/p>[\\s\\S]*?aria-label="${label}"`)
            );
        }
        expect(
            sections
                .filter((one) => one.label !== null && one.items.length > GROUP_MAX)
                .map((one) => `${one.label ?? ''}:${one.chord ?? ''}:${one.glyph ?? ''}`)
        ).toEqual([
            'Sessions:m:live',
            'Academic life:c:scout',
            'Sources:s:folder',
            'System:y:audit'
        ]);
    });

    it('exposes the real rail order and the four configured flyout chords', () => {
        const order = railOrder(
            views().filter((view) => view.listed !== false),
            realGroups(),
            config.direct_chord as string,
            realDocs()
        );
        // The direct list is what a digit after the direct chord counts into, so it is pinned whole:
        // a group that grows past the group maximum leaves it, which is a keyboard change.
        expect(order.direct).toEqual([
            'focus',
            'projects',
            'coauthor',
            'archive',
            'pillars',
            'domains',
            'map',
            'radar',
            'leads',
            'inbox',
            'linkedin',
            'memories'
        ]);
        // The directly drawn groups' documents follow the direct views in the direct chord, so a
        // digit past the last view opens one; the direct list itself holds views alone.
        expect(order.chords[config.direct_chord as string]).toEqual([
            ...order.direct,
            'doc:RESEARCH-APPROACH.md',
            'doc:AGENT-APPROACH.md'
        ]);
        expect(order.chords.c).toEqual([
            'funding',
            'events',
            'education',
            'applications',
            'joint-work',
            'tasks',
            'present'
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
        expect(order.chords.s).toEqual([
            'venues',
            'data',
            'code',
            'statements',
            'files',
            'repositories'
        ]);
        expect(order.chords.y).toEqual([
            'status',
            'findings',
            'gallery',
            'hpc',
            'usage',
            'help',
            'config',
            'audit',
            'history',
            'doc:HPC-UTwente-howto.md'
        ]);
        expect(Object.keys(order.chords).sort()).toEqual(['c', 'm', 's', 'v', 'y']);
    });

    it('puts the other two collections, Venues and Data under Sources', () => {
        expect(section('Sources').map((view) => view.id)).toEqual([
            'venues',
            'data',
            'code',
            'statements',
            'files',
            'repositories'
        ]);
        // Six views, so the rail draws Sources as one labelled button with a list beside it, the
        // shape Sessions and Academic life already have.
        expect(section('Sources').length).toBeGreaterThan(GROUP_MAX);
        expect(section('Sources').map((view) => view.id)).not.toContain('projects');
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
        expect(
            render(ActivityRail, {
                context: clientContext(client),
                props: { groups: realGroups() }
            }).body
        ).toContain('>Feeds</p>');
    });

    it('keeps the four boards together and puts Pillars, Domains and Map under Pillars', () => {
        expect(section('Boards').map((view) => view.id)).toEqual([
            'focus',
            'projects',
            'coauthor',
            'archive'
        ]);
        expect(section('Pillars').map((view) => view.id)).toEqual(['pillars', 'domains', 'map']);
        expect(realGroups().find((group) => group.label === 'Pillars')?.glyph).toBe('pillar');
    });
});

describe('a bookmark opened as a document tab', () => {
    it('carries the bookmark label in the instance state, which is what the tab strip draws', () => {
        const state = documentState({ label: 'cathedra manual', root: 'cathedra', path: 'a.html' });
        expect(state).toEqual({
            id: 'cathedra/a.html',
            root: 'cathedra',
            path: 'a.html',
            label: 'cathedra manual'
        });
    });

    it('gives two manuals two identities, so each opens as its own tab', () => {
        const one = documentState({ label: 'One', root: 'cathedra', path: 'a.html' });
        const two = documentState({ label: 'Two', root: 'cathedra', path: 'b.html' });
        expect(one.id).not.toBe(two.id);
        expect(one.label).toBe('One');
        expect(two.label).toBe('Two');
    });
});

describe("the reader's own bookmarks under their heading", () => {
    /** The rail with the configured bookmarks and the reader's own. */
    function drawn(bookmarks: Bookmark[], saved: Bookmark[]): string {
        return render(ActivityRail, {
            context: clientContext(client),
            props: { groups: [], bookmarks, saved }
        }).body;
    }

    /** The bookmark identities the heading's list drew, in the order it drew them. */
    function order(body: string): string[] {
        return [...body.matchAll(/data-bookmark="([^"]+)"/g)].map((found) => found[1]);
    }

    const CONFIGURED = [{ label: 'Manual', root: 'docs', path: 'manual.html' }];

    it("draws the reader's own after the configured ones, under the one heading", () => {
        const body = drawn(CONFIGURED, [
            { label: 'run.py', root: 'hub', path: 'code/run.py', view: 'file' }
        ]);

        expect(order(body)).toEqual(['docs/manual.html', 'hub/code/run.py']);
        expect(body.match(/>Bookmarks</g)).toHaveLength(1);
        expect(body).toContain('run.py');
    });

    it("draws the reader's own alone when the configuration names none", () => {
        const body = drawn(
            [],
            [{ label: 'run.py', root: 'hub', path: 'code/run.py', view: 'file' }]
        );

        expect(order(body)).toEqual(['hub/code/run.py']);
        expect(body).toContain('>Bookmarks<');
    });

    it('draws no heading at all when there is neither', () => {
        expect(drawn([], [])).not.toContain('>Bookmarks<');
    });

    it("draws two of the reader's own on one file as two buttons, under their two labels", () => {
        const body = drawn(
            [],
            [
                { label: 'first', root: 'hub', path: 'x.md', view: 'file' },
                { label: 'second', root: 'hub', path: 'x.md', view: 'file' }
            ]
        );

        expect(order(body)).toEqual(['hub/x.md', 'hub/x.md']);
        expect(body).toContain('first');
        expect(body).toContain('second');
    });

    it('draws one naming a configured document once, under the configured label', () => {
        const body = drawn(CONFIGURED, [
            { label: 'mine', root: 'docs', path: 'manual.html', view: 'document' }
        ]);

        expect(order(body)).toEqual(['docs/manual.html']);
        expect(body).toContain('Manual');
        expect(body).not.toContain('mine');
    });
});
