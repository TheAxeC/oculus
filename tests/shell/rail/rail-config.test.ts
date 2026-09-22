// The rail over the application's own registry and nav_groups: the documents it lists, the groups
// of the real config, a bookmark opened as a document tab, and the reader's own bookmarks under
// their heading.
//
// What this does NOT cover: the list opening. There is no DOM in this suite, so no menu is clicked
// and no $effect runs; a closed Menu renders its opener and no list, which is what is asserted.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import {
    GROUP_MAX,
    arrange,
    docState,
    documentState,
    isFlyout,
    railOrder,
    type DocEntry,
    type Bookmark,
    type NavGroup
} from '../../../src/lib/shell/rail/rail.ts';
import { glyphCatalog } from '../../../src/lib/data/sources/config.ts';
import type { Registration } from '../../../src/lib/views/registry.ts';
import { registerAll, registerCollections } from '../../../src/routes/views.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { COLLECTIONS, config, probe, buttonWith, doc } from './rail-fixture.ts';

let client: ClientState;

let registerView: ClientState['registry']['registerView'];

let views: ClientState['registry']['views'];

beforeEach(() => {
    client = createClientState();
    ({ registerView, views } = client.registry);
    registerAll(client.registry);
    registerCollections(client.registry, COLLECTIONS);
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

    it('draws Personal for the wall, the agenda and its two documents, and puts the third in System', () => {
        const personal = sections.find((found) => found.label === 'Personal');
        expect(personal?.items.map((view) => view.id)).toEqual(['memories', 'calendar']);
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
            'memories',
            'calendar'
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
            'repositories',
            'search'
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
            'repositories',
            'search'
        ]);
        // More views than GROUP_MAX, so the rail draws Sources as one labelled button with a list
        // beside it, the shape Sessions and Academic life already have.
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
