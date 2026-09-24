// The rail over the application's own config: the `rail:` list of config/layout.yml drawn as its
// buttons in its order, and the reader's own bookmarks under their heading, a bookmark opened as a
// document tab.
//
// What this does NOT cover: a button pressed, which is tests/browser/shell/rail.spec.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import { documentState, type Bookmark } from '../../../src/lib/shell/rail/rail.ts';
import { railPages } from '../../../src/lib/state/workbench/navigation/rail.ts';
import { glyphCatalog } from '../../../src/lib/data/sources/config.ts';
import { setGlyphMode } from '../../../src/lib/state/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { config } from './rail-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

describe('the rail of the real config', () => {
    it('draws the thirteen pages of layout.yml in their order, Views and Settings last', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:237 => {#each pages.slice(1) as entry, index (entry.page)}
        const body = render(ActivityRail, {
            context: clientContext(client),
            props: { pages: railPages(config) }
        }).body;
        expect([...body.matchAll(/data-rail-page="([^"]+)"/g)].map((found) => found[1])).toEqual([
            'focus',
            'projects',
            'academic',
            'pillars',
            'feeds',
            'references',
            'present',
            'explorer',
            'sessions',
            'info',
            'calendar',
            'inbox',
            'views'
        ]);
    });

    it("draws each page's glyph from the vocabulary", () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:243 => glyph="compass"
        // The glyph is named by its stand-in, the text the ASCII mode draws it as.
        const pages = railPages(config);
        setGlyphMode('ascii');
        try {
            const body = render(ActivityRail, {
                context: clientContext(client),
                props: { pages }
            }).body;
            const glyphs = glyphCatalog(config);
            for (const entry of pages) {
                const button = new RegExp(
                    `data-rail-page="${entry.page}"[\\s\\S]*?<\\/button>`
                ).exec(body)?.[0];
                const text = glyphs[entry.glyph].replaceAll('&', '&amp;').replaceAll('<', '&lt;');
                expect(button).toContain(`>${text}</span>`);
            }
        } finally {
            setGlyphMode('icon');
        }
    });
});

describe('a bookmark opened as a document tab', () => {
    it('carries the bookmark label in the instance state, which is what the tab strip draws', () => {
        // revert: src/lib/state/client/instance.ts:60 => label: mark.path
        const state = documentState({ label: 'cathedra manual', root: 'cathedra', path: 'a.html' });
        expect(state).toEqual({
            id: 'cathedra/a.html',
            root: 'cathedra',
            path: 'a.html',
            label: 'cathedra manual'
        });
    });

    it('gives two manuals two identities, so each opens as its own tab', () => {
        // revert: src/lib/state/client/instance.ts:57 => id: mark.root,
        const one = documentState({ label: 'One', root: 'cathedra', path: 'a.html' });
        const two = documentState({ label: 'Two', root: 'cathedra', path: 'b.html' });
        expect(one.id).not.toBe(two.id);
        expect(one.label).toBe('One');
        expect(two.label).toBe('Two');
    });
});

describe("the reader's own bookmarks under their heading", () => {
    /** The rail with the reader's own bookmarks. */
    function drawn(saved: Bookmark[]): string {
        return render(ActivityRail, {
            context: clientContext(client),
            props: { saved }
        }).body;
    }

    /** The bookmark identities the heading's list drew, in the order it drew them. */
    function order(body: string): string[] {
        return [...body.matchAll(/data-bookmark="([^"]+)"/g)].map((found) => found[1]);
    }

    it('draws them in the order the file holds them, under the one heading', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:277 => {#each [...saved].reverse() as mark, at (at)}
        const body = drawn([
            {
                label: 'cathedra manual',
                root: 'cathedra',
                path: 'docs/user/manual.html',
                view: 'document'
            },
            { label: 'run.py', root: 'hub', path: 'code/run.py', view: 'file' }
        ]);
        expect(order(body)).toEqual(['cathedra/docs/user/manual.html', 'hub/code/run.py']);
        expect(body.match(/>Bookmarks</g)).toHaveLength(1);
        expect(body).toContain('run.py');
    });

    it('draws no heading at all when there is none', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:273 => {#if true}
        expect(drawn([])).not.toContain('>Bookmarks<');
    });

    it('draws two on one file as two buttons, under their two labels', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:277 => {#each saved.slice(0, 1) as mark, at (at)}
        const body = drawn([
            { label: 'first', root: 'hub', path: 'x.md', view: 'file' },
            { label: 'second', root: 'hub', path: 'x.md', view: 'file' }
        ]);
        expect(order(body)).toEqual(['hub/x.md', 'hub/x.md']);
        expect(body).toContain('first');
        expect(body).toContain('second');
    });
});
