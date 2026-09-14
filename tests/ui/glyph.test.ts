// Layer 3, primitive test. The glyph slot and the terminal palette's brackets, read off the sources.
// Both are declared under a body class, which no server render shows and no assertion over markup
// reaches: what a rail of controls looks like under a terminal palette is these two rules.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GLYPH = 'src/lib/ui/Glyph.svelte';
const TOOL = 'src/lib/ui/ToolButton.svelte';

/** One CSS rule of a component's style block: the selector as written, and its declarations. */
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
});

describe('the terminal palette brackets', () => {
    it('are drawn around a row and never around a stacked control', () => {
        const brackets = rules(TOOL).filter((rule) => /content:\s*'[[\]]'/.test(rule.body));
        expect(brackets.length).toBe(2);
        for (const rule of brackets) {
            expect(rule.selector, rule.selector).toMatch(/:not\(\.stacked\)/);
        }
    });
});
