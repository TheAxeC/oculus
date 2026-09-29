// Layer 3, primitive test. What the glyph primitive draws in each of the two modes, the icon and
// the ASCII stand-in, the slot it draws into, and the terminal palette's brackets. The slot and the
// brackets are declared under a body class, which no server render shows and no assertion over
// markup reaches: what a rail of controls looks like under a terminal palette is those two rules.
//
// What this does NOT cover: DOMPurify's own filtering of an icon. The library needs a document to
// parse into and this suite runs in node (vite.config.ts sets `environment: 'node'`), where its
// `isSupported` is false and `sanitiseSvg` hands the drawing back as it came. What is checked here
// is the data the browser is given, the profile, and that the primitive puts every icon through it.
// The icons in the page, with no script and no handler among them, need a DOM and are not run here.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { withoutComments } from '../../checks/source/code.ts';
import Glyph from '../../../src/lib/ui/display/Glyph.svelte';
import { SVG_ATTR, SVG_PROFILE, SVG_TAGS } from '../../../src/lib/ui/html.ts';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig
} from '../../../src/lib/data/sources/config.ts';
import { setGlyphMode, setGlyphs, setIcons } from '../../../src/lib/state/shared/words/text.ts';

const GLYPH = 'src/lib/ui/display/Glyph.svelte';
const TOOL = 'src/lib/ui/controls/ToolButton.svelte';

const { config } = loadConfig(engineDir());
const GLYPHS = glyphCatalog(config);
const ICONS = iconSet(config);
setGlyphs(GLYPHS);
setIcons(ICONS);

/** One CSS rule of a component's style block: the selector as written, and its declarations. */
type Rule = { selector: string; body: string };

function rules(file: string): Rule[] {
    const css = [...readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => withoutComments('style.css', match[1]))
        .join('\n');
    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
        selector: match[1].trim().replace(/\s+/g, ' '),
        body: match[2]
    }));
}

function drawn(name: string): string {
    return render(Glyph, { props: { name } }).body;
}

describe('what the glyph primitive draws', () => {
    it('draws the icon of the name, and no text, while the icons are in force', () => {
        const body = drawn('pin');
        expect(body).toContain('<svg');
        expect(body).toContain('stroke="currentColor"');
        expect(body).not.toContain(GLYPHS.pin);
    });

    it('draws the ASCII stand-in, and no icon, under a terminal vocabulary', () => {
        setGlyphMode('ascii');
        try {
            const body = drawn('pin');
            expect(GLYPHS.pin).toMatch(/^[\x20-\x7E]+$/);
            expect(body).toContain(`>${GLYPHS.pin}</span>`);
            expect(body).not.toContain('<svg');
        } finally {
            setGlyphMode('icon');
        }
    });

    it('draws an empty box, and no text, for a name the icon map does not carry', () => {
        setIcons({});
        try {
            const body = drawn('pin');
            expect(body).toMatch(
                /<span class="glyph[^"]*" data-glyph="pin" aria-hidden="true"><\/span>/
            );
            expect(body).not.toContain(GLYPHS.pin);
            expect(body.replace('data-glyph="pin"', '')).not.toContain('pin');
        } finally {
            setIcons(ICONS);
        }
    });

    it('throws on a name the vocabulary does not hold while the icons are in force', () => {
        expect(() => drawn('nonesuch')).toThrow(/nonesuch/);
    });

    it('puts every icon through the icon filter before it reaches the page', () => {
        const source = readFileSync(GLYPH, 'utf8');
        expect(source).toContain('{@html sanitiseSvg(drawn.svg)}');
        expect(source.match(/\{@html/g)).toHaveLength(1);
    });
});

describe('the icon filter', () => {
    it('allows the elements a line icon is drawn out of', () => {
        for (const tag of ['svg', 'path', 'circle', 'line', 'polyline', 'rect']) {
            expect(SVG_TAGS).toContain(tag);
        }
    });

    it('allows nothing that runs, loads or reaches outside the drawing', () => {
        for (const tag of ['script', 'foreignObject', 'use', 'image', 'animate', 'style', 'a']) {
            expect(SVG_TAGS).not.toContain(tag);
        }
        for (const attr of SVG_ATTR) expect(attr.startsWith('on')).toBe(false);
        for (const attr of ['href', 'xlink:href', 'style', 'onload', 'onclick']) {
            expect(SVG_ATTR).not.toContain(attr);
        }
        expect(SVG_PROFILE.ALLOW_DATA_ATTR).toBe(false);
        expect(SVG_PROFILE.ALLOW_UNKNOWN_PROTOCOLS).toBe(false);
    });

    it('lets a drawing keep the stroke that makes it take the colour beside it', () => {
        for (const attr of ['d', 'viewbox', 'stroke', 'stroke-width', 'fill']) {
            expect(SVG_ATTR).toContain(attr);
        }
        // The filter would lowercase the list in place if it could, which would make the exported
        // profile disagree with this file after the first drawing.
        expect(Object.isFrozen(SVG_TAGS)).toBe(true);
        expect(Object.isFrozen(SVG_ATTR)).toBe(true);
    });
});

describe('the glyph slot', () => {
    it('holds a three-character stand-in under a terminal palette', () => {
        const rice = rules(GLYPH).filter((rule) => rule.selector.includes('body.rice'));
        expect(rice.map((rule) => rule.selector)).toEqual([':global(body.rice) .glyph']);
        expect(rice[0].body).toMatch(/width:\s*3ch\s*;/);
    });

    it('is the fixed box of one character elsewhere', () => {
        const plain = rules(GLYPH).find((rule) => rule.selector === '.glyph');
        expect(plain?.body).toMatch(/width:\s*1\.2em\s*;/);
    });

    it('draws an icon at the size of the text beside it', () => {
        const icon = rules(GLYPH).find((rule) => rule.selector === '.glyph :global(svg)');
        expect(icon?.body).toMatch(/width:\s*1em\s*;/);
        expect(icon?.body).toMatch(/height:\s*1em\s*;/);
    });
});

describe('the terminal palette brackets', () => {
    it('are drawn around a row and never around a rail control', () => {
        const brackets = rules(TOOL).filter((rule) => /content:\s*'[[\]]'/.test(rule.body));
        expect(brackets.length).toBe(2);
        for (const rule of brackets) {
            expect(rule.selector, rule.selector).toMatch(/:not\(\.rail-control\)/);
        }
    });
});
