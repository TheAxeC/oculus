// The rail drawn as VS Code's activity bar: one icon per rail page named by its label, the one in
// force for the page on screen, the digit and the badge's words in its hover words, one badge per
// button, and Bookmarks, Search and Update at the foot; the fades of its list; and the lists a drag
// or a Hide on a page button writes. The rail over the real config is rail-config.test.ts beside
// this.
//
// The catalog and glyphs are the real config. The pages are this file's own.
//
// What this does NOT cover: a button pressed, dragged or right-clicked, the rail's width and the
// badge's place inside its button, which are tests/browser/shell/rail.spec.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import {
    firstBadge,
    listFade,
    railHidden,
    railInsertAt,
    railMoved
} from '../../../src/lib/shell/rail/rail.ts';
import type { RailEntry } from '../../../src/lib/state/workbench/navigation/rail.ts';
import type { RailPage } from '../../../src/lib/state/workbench/navigation/rail.ts';
import { glyphCatalog } from '../../../src/lib/data/sources/config.ts';
import { setGlyphMode } from '../../../src/lib/state/shared/words/text.ts';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { catalog, config, count, probe } from './rail-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
});

const NODE = { root: { kind: 'pane', view: 'status' } };

/** Eleven pages, two past the nine a digit reaches. */
const PAGES: RailPage[] = 'abcdefghijk'.split('').map((key, at) => ({
    label: `Page ${key}`,
    glyph: at === 0 ? 'compass' : 'inbox',
    page: key,
    node: NODE
}));

function drawn(props: Record<string, unknown> = { pages: PAGES }): string {
    return render(ActivityRail, { context: clientContext(client), props }).body;
}

describe('the fades of the rail list', () => {
    it('draws neither on a list that fits, or holds nothing', () => {
        // revert: src/lib/shell/rail/rail.ts:77 => above: true,
        expect(listFade(0, 300, 300)).toEqual({ above: false, below: false });
        expect(listFade(0, 0, 0)).toEqual({ above: false, below: false });
    });

    it('fades the bottom alone at the top of a longer list and the top alone at its end', () => {
        // revert: src/lib/shell/rail/rail.ts:78 => below: scrollTop < scrollHeight,
        expect(listFade(0, 1000, 400)).toEqual({ above: false, below: true });
        expect(listFade(600, 1000, 400)).toEqual({ above: true, below: false });
    });

    it('fades both edges in the middle of the list', () => {
        // revert: src/lib/shell/rail/rail.ts:77 => above: false,
        expect(listFade(300, 1000, 400)).toEqual({ above: true, below: true });
    });

    it('takes a list a fraction of a pixel short of either end as at that end', () => {
        // revert: src/lib/shell/rail/rail.ts:77 => above: scrollTop > 0,
        expect(listFade(0.5, 1000, 400)).toEqual({ above: false, below: true });
        expect(listFade(599.5, 1000, 400)).toEqual({ above: true, below: false });
    });
});

describe('the rail, drawn', () => {
    it('draws one icon per page, keyed by its page and named by its label', () => {
        // revert: src/lib/shell/rail/RailPages.svelte:198 => label={entry.page}
        // The glyph is named by its stand-in, the text the ASCII mode draws it as.
        setGlyphMode('ascii');
        try {
            const body = drawn();
            expect(count(body, 'data-rail-page=')).toBe(PAGES.length);
            const first = /data-rail-page="a"[\s\S]*?<\/button>/.exec(body)?.[0] ?? '';
            expect(first).toMatch(/class="[^"]*rail-control/);
            expect(first).toContain('aria-label="Page a"');
            expect(first).toContain(`>${glyphCatalog(config).compass}</span>`);
            // The icon alone: no words are drawn in the button.
            expect(first).not.toContain('class="label');
        } finally {
            setGlyphMode('icon');
        }
    });

    it('puts the digit that reaches a page in its hover words, for the first nine alone', () => {
        // revert: src/lib/shell/rail/RailPages.svelte:79 => index < SHORTCUTS ? entry.label : entry.label;
        const body = drawn();
        expect(body).toContain(
            `>${catalog['ui.page_shortcut'].replace('{0}', 'Page i').replace('{1}', '9')}<`
        );
        expect(body).not.toContain(
            catalog['ui.page_shortcut'].replace('{0}', 'Page j').replace('{1}', '10')
        );
        // The words name the key after a comma, with no hyphen standing in for a dash.
        expect(body).toContain('>Page i, key 9<');
        expect(body).toMatch(/role="tooltip"[^>]*>Page j<\/span>/);
    });

    it('draws the button of the page on screen as the one in force, and no other', () => {
        // revert: src/lib/shell/rail/RailPages.svelte:201 => active={false}
        client.layout.openRailPage('c', 'Page c', NODE);
        const body = drawn();
        const buttons = [...body.matchAll(/data-rail-page="(\w)"[\s\S]*?<button\b([^>]*)>/g)];
        expect(
            buttons
                .filter(([, , attrs]) => /class="[^"]*\bactive\b/.test(attrs))
                .map(([, key]) => key)
        ).toEqual(['c']);
    });

    it('draws no view buttons, no group and none of the appearance controls', () => {
        // revert: src/lib/shell/rail/RailFoot.svelte:55 => <div class="foot" data-foot><button data-view="status" data-stop="theme">x</button>
        const body = drawn();
        expect(body).not.toContain('data-view=');
        expect(body).not.toContain('data-group=');
        expect(body).not.toContain('data-stop="theme"');
        expect(body).not.toContain('data-stop="crt"');
    });

    it('draws Search and Update as icons named by their words, with their tips', () => {
        // revert: src/lib/shell/rail/RailFoot.svelte:71 => label={t('app.update')}
        const body = drawn();
        for (const [action, key, tip] of [
            ['search', 'app.search', 'app.search_tip'],
            ['update', 'app.update', 'app.update_tip']
        ]) {
            const block = new RegExp(`data-action="${action}"[\\s\\S]*?<\\/button>`).exec(
                body
            )?.[0];
            expect(block).toMatch(/class="[^"]*rail-control/);
            expect(block).toContain(`aria-label="${catalog[key]}"`);
            expect(block).not.toContain('class="label');
            expect(body).toContain(catalog[tip]);
        }
    });

    it('draws Bookmarks at the foot as a menu opener, and no bookmark in the list above it', () => {
        // revert: src/lib/shell/rail/RailFoot.svelte:58 => label={t('app.search')}
        const body = drawn({
            pages: PAGES,
            saved: [{ label: 'Manual', root: 'docs', path: 'manual.html', view: 'document' }]
        });
        const block = /data-action="bookmarks"[\s\S]*?<\/button>/.exec(body)?.[0] ?? '';
        expect(block).toContain('aria-haspopup="menu"');
        expect(block).toContain(`aria-label="${catalog['ui.docs']}"`);
        expect(block).toMatch(/class="[^"]*\brail\b/);
        expect(block).toContain(`data-glyph="${catalog['ui.bookmarks_glyph']}"`);
        // The bookmarks are the menu's choices, drawn when it opens, not buttons or a heading.
        expect(body).not.toContain('data-bookmark=');
        expect(body).not.toContain('Manual');
        expect(body).not.toContain(`>${catalog['ui.docs']}</p>`);
    });

    it('draws Bookmarks with no bookmark at all', () => {
        // revert: src/lib/shell/rail/RailFoot.svelte:56 => <div data-action={saved.length > 0 ? 'bookmarks' : undefined}>
        const body = drawn({ pages: [], saved: [] });
        expect(body).toContain('data-action="bookmarks"');
        expect(body).toContain(`aria-label="${catalog['ui.docs']}"`);
    });

    it('draws one badge per page, the first counted view in tab order, and none for a page without', () => {
        // revert: src/lib/shell/rail/RailPages.svelte:70 => return badges.at(-1) ?? null;
        client.registry.registerView({
            ...probe('probe-counted'),
            badge: () => '7',
            badgeTone: () => 'red'
        });
        client.registry.registerView({ ...probe('probe-marked'), badge: () => '2' });
        client.registry.registerView(probe('probe-quiet'));
        const holding = {
            root: { kind: 'pane', view: ['probe-quiet', 'probe-marked', 'probe-counted'] }
        };
        const body = drawn({
            pages: [
                { label: 'Held', glyph: 'compass', page: 'held', node: holding },
                { label: 'Bare', glyph: 'inbox', page: 'bare', node: NODE }
            ]
        });
        const held = body.slice(
            body.indexOf('data-rail-page="held"'),
            body.indexOf('data-rail-page="bare"')
        );
        expect(
            [...held.matchAll(/data-rail-badge[^>]*>(?:<!--[^>]*-->)*([^<]*)</g)].map((m) =>
                m[1].trim()
            )
        ).toEqual(['2']);
        // A view's tone colours its tab and its catalogue entry; the rail's badge is one colour.
        expect(held).not.toContain('var(--c-red)');
        const bare = body.slice(body.indexOf('data-rail-page="bare"'));
        expect(bare).not.toContain('data-rail-badge');
    });

    it("says in a badged button's hover words what its badge counts", () => {
        // revert: src/lib/shell/rail/RailPages.svelte:80 => return name;
        client.registry.registerView({ ...probe('probe-counted'), badge: () => '7' });
        const body = drawn({
            pages: [
                {
                    label: 'Held',
                    glyph: 'compass',
                    page: 'held',
                    node: { root: { kind: 'pane', view: 'probe-counted' } }
                }
            ]
        });
        const title = catalog['views.badge_title']
            .replace('{0}', catalog['views.status'])
            .replace('{1}', '7');
        const words = catalog['ui.page_badge_tip']
            .replace('{0}', catalog['ui.page_shortcut'].replace('{0}', 'Held').replace('{1}', '1'))
            .replace('{1}', title);
        expect(body).toContain(`>${words}<`);
    });
});

describe('the one badge of a page button', () => {
    it('is the first of the page badges, and none when there is none', () => {
        // revert: src/lib/shell/rail/rail.ts:102 => return badges.at(-1) ?? null;
        expect(firstBadge(['2', '7'])).toBe('2');
        expect(firstBadge([])).toBeNull();
    });
});

describe('where a page button dragged along the rail lands', () => {
    const boxes = [0, 48, 96].map((top) => ({ top, height: 48 }));

    it('passes a button once the pointer is below its middle', () => {
        // revert: src/lib/shell/rail/rail.ts:114 => return buttons.filter((box) => y > box.top).length;
        expect(railInsertAt(10, boxes)).toBe(0);
        expect(railInsertAt(30, boxes)).toBe(1);
        expect(railInsertAt(60, boxes)).toBe(1);
        expect(railInsertAt(130, boxes)).toBe(3);
        expect(railInsertAt(500, boxes)).toBe(3);
        expect(railInsertAt(10, [])).toBe(0);
    });
});

describe('the rail list a drag or a Hide writes', () => {
    const entry = (page: string): RailEntry => ({ label: page, glyph: 'inbox', page });
    const rail = ['a', 'b', 'c', 'd'].map(entry);
    const pages = (list: RailEntry[]): string[] => list.map((one) => one.page);

    it('moves one entry before another, or to the end, and leaves the rest in order', () => {
        // revert: src/lib/shell/rail/rail.ts:133 => return [rail[from], ...rest];
        expect(pages(railMoved(rail, 'd', 'b'))).toEqual(['a', 'd', 'b', 'c']);
        expect(pages(railMoved(rail, 'a', 'd'))).toEqual(['b', 'c', 'a', 'd']);
        expect(pages(railMoved(rail, 'b', null))).toEqual(['a', 'c', 'd', 'b']);
    });

    it('answers the list unchanged for a page it does not hold, a place it does not hold or its own place', () => {
        // revert: src/lib/shell/rail/rail.ts:129 => if (before === page) return [...rail];
        expect(pages(railMoved(rail, 'x', 'b'))).toEqual(['a', 'b', 'c', 'd']);
        expect(pages(railMoved(rail, 'b', 'x'))).toEqual(['a', 'b', 'c', 'd']);
        expect(pages(railMoved(rail, 'b', 'b'))).toEqual(['a', 'b', 'c', 'd']);
        expect(railMoved([], 'a', null)).toEqual([]);
    });

    it('keeps an entry the rail does not draw where it stands', () => {
        // revert: src/lib/shell/rail/rail.ts:130 => const rest = rail.filter((one, at) => at !== from && one.glyph !== '');
        const broken = { label: 'Gone', glyph: '', page: 'gone' };
        const held = [entry('a'), broken, entry('b')];
        expect(railMoved(held, 'b', 'a')).toEqual([entry('b'), entry('a'), broken]);
    });

    it('hides the entry of one page, the first where two name it, and nothing else', () => {
        // revert: src/lib/shell/rail/rail.ts:139 => return rail.filter((one) => one.page !== page);
        expect(pages(railHidden(rail, 'c'))).toEqual(['a', 'b', 'd']);
        expect(pages(railHidden(rail, 'x'))).toEqual(['a', 'b', 'c', 'd']);
        const twice = [entry('a'), { ...entry('a'), label: 'second' }];
        expect(railHidden(twice, 'a')).toEqual([{ ...entry('a'), label: 'second' }]);
    });
});
