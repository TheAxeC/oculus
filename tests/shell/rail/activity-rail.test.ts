// Layer 3, shell test. The rail is one stop of the browser's focus order: rendered to HTML, exactly
// one of its controls carries tabindex 0 and every other carries -1, and a control that cannot be
// pressed is no stop at all. The rule the arrow keys follow along the ring and the foot's row of
// text steps is plain arithmetic over stop names, read here too.
//
// What this does NOT cover: the arrow keys pressed, which need a DOM and are pressed in
// tests/browser/shell/keyboard.spec.ts and tests/browser/shell/shell-defects.spec.ts.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../../src/lib/shell/rail/ActivityRail.svelte';
import { TEXT_ROW, railStop } from '../../../src/lib/shell/rail/rail.ts';
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

/**
 * The rail's markup, with the appearance controls at its foot and whatever views were registered.
 */
function railHtml(): string {
    const client = createClientState();
    return render(ActivityRail, { context: clientContext(client), props: {} }).body;
}

/**
 * Every `data-stop` name in the order the rail draws them, with what the button says about itself.
 */
function stops(body: string): { name: string; tabindex: string; disabled: boolean }[] {
    const found: { name: string; tabindex: string; disabled: boolean }[] = [];
    const pattern = /data-stop="([^"]*)"([^>]*)/g;
    for (const [, name, rest] of body.matchAll(pattern)) {
        found.push({
            name,
            tabindex: /tabindex="(-?\d+)"/.exec(rest)?.[1] ?? '',
            disabled: rest.includes('disabled')
        });
    }
    return found;
}

describe('the rail as one stop of the focus order', () => {
    it('draws the ring as a vertical toolbar inside the navigation landmark', () => {
        const body = railHtml();
        expect(body).toContain('role="toolbar"');
        expect(body).toContain('aria-orientation="vertical"');
        // The toolbar sits inside the landmark, and neither takes a stop of its own.
        expect(body.indexOf('<nav')).toBeLessThan(body.indexOf('role="toolbar"'));
        expect(/<nav[^>]*tabindex/.test(body)).toBe(false);
        expect(/role="toolbar"[^>]*tabindex|tabindex[^>]*role="toolbar"/.test(body)).toBe(false);
    });

    it('gives exactly one control tabindex 0 and every other one -1', () => {
        const found = stops(railHtml());
        expect(found.length).toBeGreaterThan(1);
        expect(found.filter((one) => one.tabindex === '0').map((one) => one.name)).toEqual([
            found[0].name
        ]);
        expect(found.slice(1).every((one) => one.tabindex === '-1')).toBe(true);
    });

    it('names the appearance controls at the foot, so the arrows reach every one of them', () => {
        const names = stops(railHtml()).map((one) => one.name);
        expect(names).toContain('search');
        expect(names).toContain('update');
        expect(names).toContain('theme');
        expect(names).toContain('crt');
        expect(names).toContain('unicode');
    });

    it('never puts the stop on a control that cannot be pressed', () => {
        // Nothing has changed the text size yet, so the control that puts it back is unavailable.
        const found = stops(railHtml());
        const reset = found.find((one) => one.name === 'text-reset');
        expect(reset?.disabled).toBe(true);
        expect(reset?.tabindex).toBe('-1');
        expect(found.filter((one) => one.disabled && one.tabindex === '0')).toEqual([]);
    });
});

describe('the arrow keys along the rail and its row of text steps', () => {
    const ring = ['view:a', 'theme', 'text-smaller', 'text-reset', 'text-larger', 'crt', 'unicode'];

    it('moves down and up the column with the row as one place, entering it at its first step', () => {
        expect(railStop('ArrowDown', 'theme', ring, TEXT_ROW)).toBe('text-smaller');
        expect(railStop('ArrowUp', 'crt', ring, TEXT_ROW)).toBe('text-smaller');
    });

    it('leaves the row downwards and upwards from any of its steps', () => {
        for (const step of TEXT_ROW) {
            expect(railStop('ArrowDown', step, ring, TEXT_ROW)).toBe('crt');
            expect(railStop('ArrowUp', step, ring, TEXT_ROW)).toBe('theme');
        }
    });

    it('moves along the row with left and right and stays at its ends', () => {
        expect(railStop('ArrowRight', 'text-smaller', ring, TEXT_ROW)).toBe('text-reset');
        expect(railStop('ArrowRight', 'text-reset', ring, TEXT_ROW)).toBe('text-larger');
        expect(railStop('ArrowRight', 'text-larger', ring, TEXT_ROW)).toBe('text-larger');
        expect(railStop('ArrowLeft', 'text-reset', ring, TEXT_ROW)).toBe('text-smaller');
        expect(railStop('ArrowLeft', 'text-smaller', ring, TEXT_ROW)).toBe('text-smaller');
    });

    it('answers no left or right outside the row, and no other key', () => {
        expect(railStop('ArrowLeft', 'theme', ring, TEXT_ROW)).toBeNull();
        expect(railStop('ArrowRight', 'crt', ring, TEXT_ROW)).toBeNull();
        expect(railStop('Enter', 'theme', ring, TEXT_ROW)).toBeNull();
    });

    it('skips a step that is out of the ring, and enters a row whose first step is out at its next', () => {
        const noReset = ring.filter((id) => id !== 'text-reset');
        expect(railStop('ArrowRight', 'text-smaller', noReset, TEXT_ROW)).toBe('text-larger');
        const noSmaller = ring.filter((id) => id !== 'text-smaller');
        expect(railStop('ArrowDown', 'theme', noSmaller, TEXT_ROW)).toBe('text-reset');
        expect(railStop('ArrowUp', 'text-larger', noSmaller, TEXT_ROW)).toBe('theme');
    });

    it('wraps at the ends of the column and goes to either end on Home and End', () => {
        expect(railStop('ArrowDown', 'unicode', ring, TEXT_ROW)).toBe('view:a');
        expect(railStop('ArrowUp', 'view:a', ring, TEXT_ROW)).toBe('unicode');
        expect(railStop('Home', 'text-larger', ring, TEXT_ROW)).toBe('view:a');
        expect(railStop('End', 'theme', ring, TEXT_ROW)).toBe('unicode');
    });

    it('starts at the first place for a stop that is nowhere, and answers nothing on an empty ring', () => {
        expect(railStop('ArrowDown', 'gone', ring, TEXT_ROW)).toBe('view:a');
        expect(railStop('ArrowDown', 'gone', [], TEXT_ROW)).toBeNull();
    });
});
