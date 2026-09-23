// Layer 3, shell test. The rail is one stop of the browser's focus order: rendered to HTML, exactly
// one of its controls carries tabindex 0 and every other carries -1. The rule the arrow keys follow
// along the ring is plain arithmetic over stop names, read here too.
//
// What this does NOT cover: the arrow keys pressed, which need a DOM and are pressed in
// tests/browser/shell/keyboard.spec.ts and tests/browser/shell/shell-defects.spec.ts.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import { railStop } from '../../../src/lib/shell/rail/rail.ts';
import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setAscii, setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setAscii(asciiCatalog(config));
setVocab(vocabCatalog(config));

/** The rail's markup, with two pages, one bookmark and the foot. */
function railHtml(): string {
    const client = createClientState();
    return render(ActivityRail, {
        context: clientContext(client),
        props: {
            pages: [
                { label: 'Focus', glyph: 'compass', page: 'focus', node: null },
                { label: 'Inbox', glyph: 'inbox', page: 'inbox', node: null }
            ],
            saved: [{ label: 'Notes', root: 'hub', path: 'notes.md', view: 'file' }]
        }
    }).body;
}

/** Every `data-stop` name in the order the rail draws them, with its button's tabindex. */
function stops(body: string): { name: string; tabindex: string }[] {
    const found: { name: string; tabindex: string }[] = [];
    const pattern = /data-stop="([^"]*)"([^>]*)/g;
    for (const [, name, rest] of body.matchAll(pattern)) {
        found.push({ name, tabindex: /tabindex="(-?\d+)"/.exec(rest)?.[1] ?? '' });
    }
    return found;
}

describe('the rail as one stop of the focus order', () => {
    it('draws the ring as a vertical toolbar inside the navigation landmark', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:228 => role="group"
        const body = railHtml();
        expect(body).toContain('role="toolbar"');
        expect(body).toContain('aria-orientation="vertical"');
        // The toolbar sits inside the landmark, and neither takes a stop of its own.
        expect(body.indexOf('<nav')).toBeLessThan(body.indexOf('role="toolbar"'));
        expect(/<nav[^>]*tabindex/.test(body)).toBe(false);
        expect(/role="toolbar"[^>]*tabindex|tabindex[^>]*role="toolbar"/.test(body)).toBe(false);
    });

    it('gives exactly one control tabindex 0 and every other one -1', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:146 => return 0;
        const found = stops(railHtml());
        expect(found.length).toBeGreaterThan(1);
        expect(found.filter((one) => one.tabindex === '0').map((one) => one.name)).toEqual([
            found[0].name
        ]);
        expect(found.slice(1).every((one) => one.tabindex === '-1')).toBe(true);
    });

    it('rings the pages, then the bookmarks, then Search and Update, and nothing else', () => {
        // revert: src/lib/shell/rail/ActivityRail.svelte:103 => delete
        const found = stops(railHtml());
        expect(found.map((one) => one.name)).toEqual([
            'page:focus',
            'page:inbox',
            'mark:0',
            'search',
            'update'
        ]);
        // The ring the arrows follow starts where the drawing does, so the first page is the stop.
        expect(found[0]).toEqual({ name: 'page:focus', tabindex: '0' });
    });
});

describe('the arrow keys along the rail', () => {
    const ring = ['page:a', 'page:b', 'mark:0', 'search', 'update'];

    it('moves down and up the ring', () => {
        // revert: src/lib/shell/rail/rail.ts:59 => const next = nextStop(key, ring.indexOf(current), ring.length, 'row');
        expect(railStop('ArrowDown', 'page:a', ring)).toBe('page:b');
        expect(railStop('ArrowUp', 'search', ring)).toBe('mark:0');
    });

    it('wraps at the ends and goes to either end on Home and End', () => {
        // revert: src/lib/shell/rail/rail.ts:60 => return next === null || next === 0 ? null : ring[next];
        expect(railStop('ArrowDown', 'update', ring)).toBe('page:a');
        expect(railStop('ArrowUp', 'page:a', ring)).toBe('update');
        expect(railStop('Home', 'search', ring)).toBe('page:a');
        expect(railStop('End', 'page:b', ring)).toBe('update');
    });

    it('answers no left or right and no other key, and nothing on an empty ring', () => {
        // revert: src/lib/shell/rail/rail.ts:60 => return ring[next ?? 0] ?? null;
        expect(railStop('ArrowLeft', 'page:a', ring)).toBeNull();
        expect(railStop('ArrowRight', 'page:a', ring)).toBeNull();
        expect(railStop('Enter', 'page:a', ring)).toBeNull();
        expect(railStop('ArrowDown', 'gone', [])).toBeNull();
    });

    it('starts at the first control for a stop that is nowhere', () => {
        // revert: src/lib/shell/rail/rail.ts:59 => const next = nextStop(key, Math.max(ring.indexOf(current), 1), ring.length, 'column');
        expect(railStop('ArrowDown', 'gone', ring)).toBe('page:a');
    });
});
