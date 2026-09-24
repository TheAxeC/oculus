// The rail over the application's own config: the `rail:` list of config/layout.yml drawn as its
// buttons in its order, the Bookmarks menu's choices over the reader's own bookmarks, and a
// bookmark opened as a document tab.
//
// What this does NOT cover: a button pressed, which is tests/browser/shell/rail.spec.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import {
    bookmarkChoices,
    bookmarkPicked,
    documentState,
    type Bookmark
} from '../../../src/lib/shell/rail/rail.ts';
import { railPages } from '../../../src/lib/state/workbench/navigation/rail.ts';
import { glyphCatalog } from '../../../src/lib/data/sources/config.ts';
import { setGlyphMode } from '../../../src/lib/state/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { catalog, config } from './rail-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

describe('the rail of the real config', () => {
    it('draws the thirteen pages of layout.yml in their order, Views and Settings last', () => {
        // revert: src/lib/shell/rail/RailPages.svelte:181 => {#each pages.slice(1) as entry, index (entry.page)}
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
        // revert: src/lib/shell/rail/RailPages.svelte:200 => glyph="compass"
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

describe("the Bookmarks menu's choices", () => {
    const manual: Bookmark = {
        label: 'cathedra manual',
        root: 'cathedra',
        path: 'docs/user/manual.html',
        view: 'document'
    };
    const script: Bookmark = { label: 'run.py', root: 'hub', path: 'code/run.py', view: 'file' };

    it('are the bookmarks by label in the order the file holds them, each naming its file', () => {
        // revert: src/lib/shell/rail/rail.ts:38 => return [...saved].reverse().map((mark, at) => ({
        expect(bookmarkChoices([manual, script])).toEqual([
            { id: 'mark:0', label: 'cathedra manual', title: 'cathedra/docs/user/manual.html' },
            { id: 'mark:1', label: 'run.py', title: 'hub/code/run.py' }
        ]);
    });

    it('are two choices for two bookmarks on one file, under their two labels', () => {
        // revert: src/lib/shell/rail/rail.ts:48 => return saved.at(0) ?? null;
        const first = { ...script, label: 'first' };
        const second = { ...script, label: 'second' };
        const choices = bookmarkChoices([first, second]);
        expect(choices.map((one) => one.label)).toEqual(['first', 'second']);
        expect(bookmarkPicked([first, second], choices[1].id)).toEqual(second);
        expect(bookmarkPicked([first, second], choices[0].id)).toEqual(first);
    });

    it('say there is none when there is none, and that choice opens nothing', () => {
        // revert: src/lib/shell/rail/rail.ts:35 => if (saved.length < 0) {
        const choices = bookmarkChoices([]);
        expect(choices.map((one) => one.label)).toEqual([catalog['ui.bookmarks_none']]);
        expect(bookmarkPicked([], choices[0].id)).toBeNull();
        expect(bookmarkPicked([manual], 'mark:4')).toBeNull();
    });
});
