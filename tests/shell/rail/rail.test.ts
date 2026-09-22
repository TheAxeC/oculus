// The rail's grouping: what arrange() puts where, and which groups are drawn as one button with a
// list rather than as a heading over one button per view; the fades of its list, the app text
// controls and a rail badge. The rail over the real config is rail-config.test.ts beside this.
//
// The catalog and glyphs are the real config. The registrations are this file's own.
//
// What this does NOT cover: the list opening. There is no DOM in this suite, so no menu is clicked
// and no $effect runs; a closed Menu renders its opener and no list, which is what is asserted.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import {
    GROUP_MAX,
    arrange,
    isFlyout,
    listFade,
    railOrder,
    sectionSize,
    type NavGroup
} from '../../../src/lib/shell/rail/rail.ts';
import { asciiCatalog, glyphCatalog, iconSet } from '../../../src/lib/data/sources/config.ts';
import { setAscii, setGlyphMode, setIcons } from '../../../src/lib/state/words/text.ts';
import { installBadges } from '../../state/workbench/rail-badges-fixture.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { present } from '../../fixtures/present.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { catalog, COLLECTIONS, probe, count, buttonWith, doc, config } from './rail-fixture.ts';

let client: ClientState;

let setTextScale: ClientState['ui']['setTextScale'];

let setTheme: ClientState['ui']['setTheme'];

let receive: ClientState['entities']['receive'];

let registerView: ClientState['registry']['registerView'];

let viewFor: ClientState['registry']['viewFor'];

beforeEach(() => {
    client = createClientState();
    ({ setTextScale, setTheme } = client.ui);
    ({ receive } = client.entities);
    ({ registerView, viewFor } = client.registry);
    registerAll(client.registry);
    registerCollections(client.registry, COLLECTIONS);
});

describe('the fades of the rail list', () => {
    it('draws neither on a list that fits, or holds nothing', () => {
        expect(listFade(0, 300, 300)).toEqual({ above: false, below: false });
        expect(listFade(0, 0, 0)).toEqual({ above: false, below: false });
    });

    it('fades the bottom alone at the top of a longer list and the top alone at its end', () => {
        expect(listFade(0, 1000, 400)).toEqual({ above: false, below: true });
        expect(listFade(600, 1000, 400)).toEqual({ above: true, below: false });
    });

    it('fades both edges in the middle of the list', () => {
        expect(listFade(300, 1000, 400)).toEqual({ above: true, below: true });
    });

    it('takes a list a fraction of a pixel short of either end as at that end', () => {
        expect(listFade(0.5, 1000, 400)).toEqual({ above: false, below: true });
        expect(listFade(599.5, 1000, 400)).toEqual({ above: true, below: false });
    });
});

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
        const button = readFileSync('src/lib/ui/controls/ToolButton.svelte', 'utf8');
        expect(tokens).toContain('--rail-width: 98px');
        expect(button).toMatch(
            /\.tool\.stacked :global\(\.label\)\s*{[^}]*text-overflow:\s*ellipsis/s
        );
        expect(body).toMatch(/role="tooltip"[^>]*>Status<\/span>/);
    });

    it('draws the search and update controls with their names under their glyphs', () => {
        for (const [action, key, tip] of [
            ['search', 'app.search', 'app.search_tip'],
            ['update', 'app.update', 'app.update_tip']
        ]) {
            const block = new RegExp(`data-action="${action}"[\\s\\S]*?<\\/button>`).exec(
                body
            )?.[0];
            expect(block).toMatch(/class="[^"]*rail-control[^"]*stacked/);
            expect(block).toContain(`class="label">${catalog[key]}</span>`);
            expect(body).toContain(catalog[tip]);
        }
    });

    it('draws the three text steps glyph-only in one group named Text, smaller, reset, larger', () => {
        const group =
            /role="group" aria-label="([^"]*)"[\s\S]*?class="caption[^"]*"[^>]*>([^<]*)</.exec(
                body
            );
        expect(group?.[1]).toBe(catalog['app.text']);
        expect(group?.[2]).toBe(catalog['app.text']);
        const labels = [...(group?.[0] ?? '').matchAll(/<button\b[^>]*aria-label="([^"]*)"/g)].map(
            (found) => found[1]
        );
        expect(labels).toEqual([
            catalog['app.text_smaller'],
            catalog['app.text_reset'],
            catalog['app.text_larger']
        ]);
        for (const label of ['app.text_smaller', 'app.text_larger', 'app.text_reset']) {
            expect(buttonWith(body, `aria-label="${catalog[label]}"`)).toMatch(
                /class="[^"]*rail-control/
            );
        }
    });

    /** The foot control carrying one stop name, whole. */
    function footButton(html: string, stop: string): string | undefined {
        return [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
            .map(([button]) => button)
            .find((button) => button.includes(`data-stop="${stop}"`));
    }

    it('draws the three appearance toggles with their own glyphs and short labels', () => {
        setTheme('mocha');
        try {
            const themed = render(ActivityRail, {
                context: clientContext(client),
                props: { groups }
            }).body;
            for (const [key, glyph, stop] of [
                ['ui.crt_on', 'crt', 'crt'],
                ['ui.wallpaper', 'wallpaper', 'wall'],
                ['ui.unicode', 'unicode', 'unicode']
            ]) {
                const button = footButton(themed, stop);
                expect(button).toBeDefined();
                expect(button).toContain(`class="label">${catalog[key]}</span>`);
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
            for (const [key, name, stop, standIn] of [
                ['ui.crt_on', 'crt', 'crt', '[/]'],
                ['ui.wallpaper', 'wallpaper', 'wall', '[w]'],
                ['ui.unicode', 'unicode', 'unicode', '&lt;>']
            ]) {
                const button = footButton(themed, stop);
                expect(button).toBeDefined();
                expect(button).toContain(`class="label">${catalog[key]}</span>`);
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
