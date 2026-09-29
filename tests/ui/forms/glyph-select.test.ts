// Layer 3, primitive tests. The icon dropdown rendered on the server: the closed trigger with the
// chosen icon before its name, and the open list, held open by a harness, with the empty choice
// first, a stray value as its own item, and every choice holding its name and its icon.
//
// What this does NOT cover: the keys, type-ahead, the scroll and the press that picks, which need a
// DOM and are seen on the page.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import GlyphSelect from '../../../src/lib/ui/forms/choice/GlyphSelect.svelte';
import OpenGlyphList from './OpenGlyphList.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const EMPTY = 'Choose an icon';
const CHOICES = ['compass', 'sliders', 'terminal'];

/** Markup with the renderer's block markers taken out. */
function plain(body: string): string {
    return body.replace(/<!--[^>]*-->/g, '');
}

/** The closed dropdown's markup for this value. */
function closed(value: string): string {
    return plain(
        render(GlyphSelect, {
            props: { value, label: 'Icon of button 1', empty: EMPTY, choices: CHOICES, onchange }
        }).body
    );
}

/** The trigger's accessible name: the words of each element its aria-labelledby names, in order. */
function nameOf(body: string): string {
    const ids = /aria-labelledby="([^"]+)"/.exec(body)?.[1].split(' ') ?? [];
    return ids
        .map((id) => new RegExp(`<span id="${id}"[^>]*>([^<]*)</span>`).exec(body)?.[1] ?? '')
        .join(' ');
}

/** The open list's markup, the renderer's block markers taken out. */
function openList(value: string, choices: string[] = CHOICES): string {
    return plain(render(OpenGlyphList, { props: { value, empty: EMPTY, choices } }).body);
}

/** The element whose opening tag carries this attribute, to its own closing tag. */
function elementWith(body: string, attribute: string): string {
    if (!body.includes(attribute)) return '';
    const from = body.lastIndexOf('<div', body.indexOf(attribute));
    if (from < 0) return '';
    let depth = 0;
    for (const tag of body.slice(from).matchAll(/<div\b|<\/div>/g)) {
        depth += tag[0] === '</div>' ? -1 : 1;
        if (depth === 0) return body.slice(from, from + tag.index + tag[0].length);
    }
    return '';
}

/** The open list's items, each from its opening tag to the next item's. */
function items(value: string, choices: string[] = CHOICES): string[] {
    const body = openList(value, choices);
    return body.split(/(?=<[a-z]+ [^>]*role="option")/).slice(1);
}

function onchange(): void {
    return undefined;
}

/** The glyph names a trigger draws, its caret's left out. */
function icons(body: string): string[] {
    return [...body.matchAll(/data-glyph="([^"]*)"/g)]
        .map(([, name]) => name)
        .filter((name) => name !== 'disclosure');
}

describe('the icon dropdown closed', () => {
    // Red when the trigger stops drawing the chosen icon, or draws it after the name.
    it('draws the chosen icon before its name on the trigger', () => {
        const body = closed('sliders');
        expect(nameOf(body)).toBe('Icon of button 1 sliders');
        expect(icons(body)).toEqual(['sliders']);
        expect(body.indexOf('data-glyph="sliders"')).toBeLessThan(body.indexOf('>sliders<'));
    });

    // Red when the empty value draws an icon, or loses the empty words.
    it('draws the empty words and no icon when none is chosen', () => {
        const body = closed('');
        expect(body).toContain(`>${EMPTY}<`);
        expect(nameOf(body)).toBe(`Icon of button 1 ${EMPTY}`);
        expect(body).toContain('data-glyph="disclosure"');
        expect(icons(body)).toEqual([]);
    });

    // Red when a value the choices lack is dropped from the trigger.
    it('draws a value the choices lack by its name, with no icon', () => {
        const body = closed('not-a-glyph');
        expect(body).toContain('>not-a-glyph<');
        expect(icons(body)).toEqual([]);
    });
});

describe('the icon dropdown open', () => {
    // Red when the empty choice leaves the head of the list, a choice goes missing, or a choice
    // stops holding its icon with its name first in its markup.
    it('draws the empty choice first, then every choice with its name before its icon', () => {
        const drawn = items('sliders');
        expect(drawn).toHaveLength(CHOICES.length + 1);
        expect(drawn[0]).toContain(`>${EMPTY}<`);
        // the empty choice names no icon
        expect(drawn[0]).not.toContain('data-glyph');
        CHOICES.forEach((name, at) => {
            const item = drawn[at + 1];
            expect(item).toContain(`>${name}<`);
            expect(item).toContain(`data-glyph="${name}"`);
            expect(item.indexOf(`>${name}<`)).toBeLessThan(item.indexOf(`data-glyph="${name}"`));
        });
    });

    // Red when a value the choices lack stops being drawn as its own item after the empty one.
    it('draws a value the choices lack as its own item after the empty choice', () => {
        const drawn = items('not-a-glyph');
        expect(drawn).toHaveLength(CHOICES.length + 2);
        expect(drawn[1]).toContain('>not-a-glyph<');
        expect(drawn[1]).toContain('data-value="not-a-glyph"');
        expect(drawn[1]).toContain('aria-selected="true"');
    });

    // An audit of the value each item hands on: it pins the value bits-ui passes to onValueChange,
    // which GlyphSelect hands to onchange, and is red when an item hands a value other than its
    // name, or the empty choice one other than the empty string. The press that calls onchange
    // needs a DOM and is seen at the look.
    it('gives each item its name as the value a pick hands on, and the empty choice nothing', () => {
        const drawn = items('sliders');
        expect(drawn[0]).toContain('data-value=""');
        CHOICES.forEach((name, at) => {
            expect(drawn[at + 1]).toContain(`data-value="${name}"`);
        });
        expect(drawn[2]).toContain('aria-selected="true"');
    });

    // Red when an empty name or a name given twice is listed as an item of its own: two items with
    // one value are one pick, and the list keys its items by value.
    it('lists a name given twice once, and an empty name as the empty choice alone', () => {
        const drawn = items('', ['', 'compass', 'compass', 'sliders']);
        expect(drawn.map((item) => /data-value="([^"]*)"/.exec(item)?.[1])).toEqual([
            '',
            'compass',
            'sliders'
        ]);
    });

    // Red when the items are drawn outside bits-ui's viewport: bits-ui then has no viewport to
    // scroll, and the keys highlight items out of sight. The scroll itself is seen at the look.
    it('draws every item inside the viewport bits-ui scrolls', () => {
        const viewport = elementWith(openList('sliders'), 'data-select-viewport');
        expect(viewport).not.toBe('');
        expect([...viewport.matchAll(/role="option"/g)]).toHaveLength(CHOICES.length + 1);
    });

    // Red when the shared floating box stops carrying the attributes bits-ui's content hands it:
    // the list is then no listbox, and bits-ui neither places it nor finds its items.
    it('draws the list as the listbox bits-ui places, named by its field, around the viewport', () => {
        const box = elementWith(openList('sliders'), 'role="listbox"');
        expect(box).toMatch(/^<div [^>]*data-select-content=""/);
        expect(box).toMatch(/^<div [^>]*aria-label="Icon of button 1"/);
        expect(box).toContain('data-select-viewport');
    });
});
