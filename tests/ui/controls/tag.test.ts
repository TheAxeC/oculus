// Layer 3, primitive test. The tag: its glyph, its words, and the two things it does not have, a
// capsule and a hue. Those two are what tells a reader a status word from everything else a card
// lists, so they are asserted off the component's own style rather than left to the eye.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Tag from '../../../src/lib/ui/controls/Tag.svelte';
import Chip from '../../../src/lib/ui/controls/Chip.svelte';
import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import {
    setAscii,
    setCatalog,
    setGlyphMode,
    setGlyphs
} from '../../../src/lib/state/words/text.ts';

const TAG = 'src/lib/ui/controls/Tag.svelte';

const { config } = loadConfig(engineDir());
const GLYPHS = glyphCatalog(config);
setCatalog(textCatalog(config));
setGlyphs(GLYPHS);
setAscii(asciiCatalog(config));

/** One CSS rule of the component's style block: the selector as written, and its declarations. */
type Rule = { selector: string; body: string };

function rules(file: string): Rule[] {
    const css = [...readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => match[1])
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
        selector: match[1].trim().replace(/\s+/g, ' '),
        body: match[2]
    }));
}

/** The declarations of one selector in the component's style block. */
function declarations(file: string, selector: string): string {
    const css = [...readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => match[1])
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
    const found = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
        (match) => match[1].trim().replace(/\s+/g, ' ') === selector
    );
    return found?.[2] ?? '';
}

describe('the tag primitive', () => {
    it('draws its words in a labelled span', () => {
        const body = render(Tag, { props: { label: 'DATA-1' } }).body;
        expect(body).toContain('class="tag');
        expect(body).toContain('>DATA-1</span>');
    });

    it('draws the glyph it is given before them, and none when it is given none', () => {
        const withGlyph = render(Tag, { props: { label: 'DATA-1', glyph: 'data' } }).body;
        expect(withGlyph).toContain(GLYPHS.data);
        expect(withGlyph.indexOf(GLYPHS.data)).toBeLessThan(withGlyph.indexOf('DATA-1'));
        const without = render(Tag, { props: { label: 'DATA-1', glyph: '' } }).body;
        expect(without).not.toContain('class="glyph');
    });

    it('wears no capsule, which is what the chip keeps for a status', () => {
        const tag = declarations(TAG, '.tag');
        expect(tag).not.toMatch(/border(?!-)/);
        expect(tag).not.toMatch(/border-radius/);
        expect(tag).not.toMatch(/background/);
        expect(tag).toMatch(/color:\s*var\(--muted-txt/);
        expect(render(Chip, { props: { label: 'submitted', tone: 'green' } }).body).toContain(
            'class="chip'
        );
    });

    it('paints its words and its mark in the hue it is given, and is muted without one', () => {
        const toned = render(Tag, { props: { label: 'FAILED', glyph: 'warn', tone: 'red' } }).body;
        expect(toned).toContain('--tone-txt: var(--c-red-txt)');
        expect(toned).toMatch(/class="tag[^"]*\btoned\b/);
        // The mark is inside the tag, so the icon takes that colour through currentColor.
        expect(toned.indexOf('class="glyph')).toBeGreaterThan(toned.indexOf('--tone-txt'));
        expect(declarations(TAG, '.tag.toned')).toMatch(/color:\s*var\(--tone-txt/);

        const plain = render(Tag, { props: { label: 'DATA-1' } }).body;
        expect(plain).not.toContain('--tone-txt');
        expect(plain).not.toContain('toned');
    });

    it('is bracketed under a terminal palette, and not when its stand-in brackets itself', () => {
        const rice = rules(TAG).filter((rule) => rule.selector.includes('body.rice'));
        expect(rice.map((rule) => rule.selector)).toEqual([
            ':global(body.rice) .tag:not(.bracketed)::before',
            ':global(body.rice) .tag:not(.bracketed)::after'
        ]);
        expect(rice[0].body).toMatch(/content:\s*'\['/);
        expect(rice[1].body).toMatch(/content:\s*'\]'/);

        setGlyphMode('ascii');
        try {
            // `data` stands in as `<#>`, which brackets nothing, and `code` stands in as `[_]`.
            expect(render(Tag, { props: { label: 'one', glyph: 'data' } }).body).not.toContain(
                'bracketed'
            );
            expect(render(Tag, { props: { label: 'one', glyph: 'code' } }).body).toContain(
                'bracketed'
            );
        } finally {
            setGlyphMode('unicode');
        }
    });

    it('cuts a long value at its own edge', () => {
        expect(declarations(TAG, '.tag .label')).toMatch(/text-overflow:\s*ellipsis/);
    });
});
