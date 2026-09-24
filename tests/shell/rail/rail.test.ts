// The rail drawn: one button per rail page with its label under its glyph, the one in force for the
// page on screen, the digit in its hover words, the bookmarks under their heading, and Search and
// Update at the foot; and the fades of its list. The rail over the real config is
// rail-config.test.ts beside this.
//
// The catalog and glyphs are the real config. The pages are this file's own.
//
// What this does NOT cover: a button pressed, which is tests/browser/shell/rail.spec.ts.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import { listFade } from '../../../src/lib/shell/rail/rail.ts';
import type { RailPage } from '../../../src/lib/state/workbench/navigation/rail.ts';
import { glyphCatalog } from '../../../src/lib/data/sources/config.ts';
import { setGlyphMode } from '../../../src/lib/state/words/text.ts';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { buttonWith, catalog, config, count, probe } from './rail-fixture.ts';

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
        // revert: src/lib/shell/rail/rail.ts:48 => above: true,
        expect(listFade(0, 300, 300)).toEqual({ above: false, below: false });
        expect(listFade(0, 0, 0)).toEqual({ above: false, below: false });
    });

    it('fades the bottom alone at the top of a longer list and the top alone at its end', () => {
        // revert: src/lib/shell/rail/rail.ts:49 => below: scrollTop < scrollHeight,
        expect(listFade(0, 1000, 400)).toEqual({ above: false, below: true });
        expect(listFade(600, 1000, 400)).toEqual({ above: true, below: false });
    });

    it('fades both edges in the middle of the list', () => {
        // revert: src/lib/shell/rail/rail.ts:48 => above: false,
        expect(listFade(300, 1000, 400)).toEqual({ above: true, below: true });
    });

    it('takes a list a fraction of a pixel short of either end as at that end', () => {
        // revert: src/lib/shell/rail/rail.ts:48 => above: scrollTop > 0,
        expect(listFade(0.5, 1000, 400)).toEqual({ above: false, below: true });
        expect(listFade(599.5, 1000, 400)).toEqual({ above: true, below: false });
    });
});

describe('the rail, drawn', () => {
    it('draws one button per page, keyed by its page, with its label under its glyph', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:241 => label={entry.page}
        // The glyph is named by its stand-in, the text the ASCII mode draws it as.
        setGlyphMode('ascii');
        try {
            const body = drawn();
            expect(count(body, 'data-rail-page=')).toBe(PAGES.length);
            const first = /data-rail-page="a"[\s\S]*?<\/button>/.exec(body)?.[0] ?? '';
            expect(first).toMatch(/class="[^"]*rail-control[^"]*stacked/);
            expect(first).toContain(`>${glyphCatalog(config).compass}</span>`);
            expect(first).toMatch(/class="label[^"]*">Page a</);
        } finally {
            setGlyphMode('icon');
        }
    });

    it('puts the digit that reaches a page in its hover words, for the first nine alone', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:59 => return t('ui.page_shortcut', entry.label, index + 1);
        const body = drawn();
        expect(body).toContain(
            `>${catalog['ui.page_shortcut'].replace('{0}', 'Page i').replace('{1}', '9')}<`
        );
        expect(body).not.toContain(
            catalog['ui.page_shortcut'].replace('{0}', 'Page j').replace('{1}', '10')
        );
        // The words name the key after a comma, with no hyphen standing in for a dash.
        expect(body).toContain('>Page i, key 9<');
    });

    it('draws the button of the page on screen as the one in force, and no other', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:244 => active={false}
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
        // revert: src/lib/shell/rail/ActivityRail.svelte:298 => <div class="controls" data-foot><button data-view="status" data-stop="theme">x</button>
        const body = drawn();
        expect(body).not.toContain('data-view=');
        expect(body).not.toContain('data-group=');
        expect(body).not.toContain('data-stop="theme"');
        expect(body).not.toContain('data-stop="crt"');
    });

    it('draws the search and update controls with their names under their glyphs', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:315 => label={t('app.search')}
        const body = drawn();
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

    it('uses the measured rail width and clips labels without removing their tooltip', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:59 => return '';
        const tokens = readFileSync('src/lib/themes/tokens.css', 'utf8');
        const button = readFileSync('src/lib/ui/controls/ToolButton.svelte', 'utf8');
        expect(tokens).toContain('--rail-width: 98px');
        expect(button).toMatch(
            /\.tool\.stacked :global\(\.label\)\s*{[^}]*text-overflow:\s*ellipsis/s
        );
        expect(drawn()).toMatch(/role="tooltip"[^>]*>Page j<\/span>/);
    });

    it('puts the browser identity and the rail box class on a bookmark button', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:282 => dataBookmark={mark.path}
        const body = drawn({
            pages: [],
            saved: [{ label: 'Manual', root: 'docs', path: 'manual.html', view: 'document' }]
        });
        const bookmark = buttonWith(body, 'data-bookmark="docs/manual.html"');
        expect(bookmark).toMatch(/class="[^"]*rail-control/);
        expect(bookmark).toMatch(/class="[^"]*stacked/);
        expect(body).not.toContain('<div class="control" data-bookmark=');
    });

    it("draws the badges of the views a page holds, in its tabs' order, and none for a page without", () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:253 => {#if false}
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
            [...held.matchAll(/class="badge(?: [^"]*)?"[^>]*>(?:<!--[^>]*-->)*([^<]*)</g)].map(
                (m) => m[1]
            )
        ).toEqual(['2', '7']);
        expect(held).toContain('--badge-bg: var(--c-red)');
        const bare = body.slice(body.indexOf('data-rail-page="bare"'));
        expect(bare).not.toContain('data-rail-badges');
    });
});
