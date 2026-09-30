// The editor's colours from the tokens: the hex expansion Monaco needs, the colour map naming every
// key the installed monaco-editor registers, and the TextMate theme Shiki colours the text with.
//
// The registered keys are read from the installed package itself, every `registerColor('<key>'`
// under its esm tree, so a Monaco release that adds a key turns this red until the map names it.
// What this does NOT cover: that a browser paints the values Monaco is handed, which the look does.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHighlighter } from 'shiki';
import { describe, expect, it } from 'vitest';
import { COLOURS } from '../../../../../src/lib/ui/controls/editor/kit/colours.ts';
import {
    editorTheme,
    expandHex,
    isDark,
    scopeToken
} from '../../../../../src/lib/ui/controls/editor/kit/theme.ts';
import { NAMES, themeTokens } from '../../../../checks/look/themes.ts';
import { ROOT, monacoSources } from '../monaco-sources.ts';

/** Every colour key the installed monaco-editor registers. */
function registeredKeys(): Set<string> {
    const keys = new Set<string>();
    for (const text of monacoSources()) {
        for (const found of text.matchAll(/registerColor\(\s*(['"])([^'"]+)\1/g)) {
            keys.add(found[2]);
        }
    }
    return keys;
}

/** The custom properties tokens.css defines and those themes/derive.ts derives from them. */
function definedTokens(): Set<string> {
    const text = readFileSync(join(ROOT, 'src', 'lib', 'themes', 'tokens.css'), 'utf8');
    const authored = [...text.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((found) => found[1]);
    return new Set([...authored, ...Object.keys(themeTokens(NAMES[0]).derived)]);
}

/**
 * A reading of the body's computed style in which each token holds a hex of its own, so a colour in
 * the output names the token it came from.
 */
function distinct(): (token: string) => string {
    const seen = new Map<string, string>();
    return (token: string) => {
        const held = seen.get(token);
        if (held !== undefined) return held;
        const value = `#${(seen.size + 1).toString(16).padStart(6, '0')}`;
        seen.set(token, value);
        return value;
    };
}

describe('the hex expansion', () => {
    // Red when a short hex reaches Monaco unexpanded, which Monaco refuses.
    it('expands 3 digits to 6 and 4 to 8, and leaves 6 and 8 as they are', () => {
        expect(expandHex('#fff')).toBe('#ffffff');
        expect(expandHex('#fff8')).toBe('#ffffff88');
        expect(expandHex('#1a2b3c')).toBe('#1a2b3c');
        expect(expandHex('#1a2b3c80')).toBe('#1a2b3c80');
        expect(expandHex(' #ABC ')).toBe('#aabbcc');
    });

    // Red when a value that is no hex is passed on as a colour.
    it('answers nothing for a value that is not hex', () => {
        expect(expandHex('rgb(1, 2, 3)')).toBe(null);
        expect(expandHex('#12345')).toBe(null);
        expect(expandHex('')).toBe(null);
    });

    // Red when a bad token goes unreported, or a key is painted from it.
    it('names a token whose value is not hex among the bad values, and maps no key from it', () => {
        const read = distinct();
        const theme = editorTheme((token) => (token === '--line' ? 'rgb(1, 2, 3)' : read(token)));
        expect(theme.bad).toEqual(['--line']);
        const fromLine = Object.entries(COLOURS)
            .filter(([, paint]) => paint.split(' ')[0] === '--line')
            .map(([key]) => key);
        expect(fromLine.length).toBeGreaterThan(0);
        for (const key of fromLine) expect(theme.colors[key]).toBeUndefined();
    });
});

describe('the colour map', () => {
    // Red when the map leaves out a key Monaco registers, which would paint in VS Code's default.
    it('names every colour key the installed monaco-editor registers, and no other', () => {
        const registered = registeredKeys();
        expect(registered.size).toBeGreaterThan(300);
        const mapped = new Set(Object.keys(COLOURS));
        expect([...registered].filter((key) => !mapped.has(key))).toEqual([]);
        expect([...mapped].filter((key) => !registered.has(key))).toEqual([]);
        // Reading every script of the package from a cold disk takes longer than the default.
    }, 60_000);

    // Red when a key is painted from a name tokens.css does not define.
    it('paints every key from a token tokens.css defines or derive.ts derives, alpha two digits', () => {
        const defined = definedTokens();
        for (const [key, paint] of Object.entries(COLOURS)) {
            const [token, alpha = '', ...rest] = paint.split(' ');
            expect({ key, token, known: defined.has(token) }).toEqual({ key, token, known: true });
            expect(rest).toEqual([]);
            expect({ key, alpha }).toMatchObject({ alpha: /^([0-9a-f]{2})?$/ });
        }
    });

    // Red when a key is left out of the built map or the background is not the panel.
    it('hands Monaco a 6 or 8 digit hex for every key, the background from the panel', () => {
        const read = distinct();
        const theme = editorTheme(read);
        expect(theme.bad).toEqual([]);
        expect(Object.keys(theme.colors).sort()).toEqual(Object.keys(COLOURS).sort());
        for (const value of Object.values(theme.colors)) {
            expect(value).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
        }
        expect(theme.colors['editor.background']).toBe(read('--panel'));
    });

    // Red when a theme gives a token the map paints from a value that is no hex, which would leave
    // the keys painted from it to VS Code's defaults under that theme.
    it('reads a hex for every token it paints from, under every theme the picker offers', () => {
        expect(NAMES.length).toBeGreaterThan(0);
        for (const name of NAMES) {
            const { theme, derived } = themeTokens(name);
            const tokens: Record<string, string> = { ...theme, ...derived };
            const built = editorTheme((token) => tokens[token] ?? '');
            expect({ name, bad: built.bad }).toEqual({ name, bad: [] });
        }
    });
});

describe('the text colours', () => {
    // Red when a `-txt` form the body does not carry yet is reported bad and its keys left out,
    // rather than read as its hue.
    it('reads a text colour the body does not carry yet as its hue', () => {
        const read = distinct();
        const bare = (token: string): string => (token.endsWith('-txt') ? '' : read(token));
        const theme = editorTheme(bare);
        expect(theme.bad).toEqual([]);
        expect(theme.colors['editor.foreground']).toBe(read('--ink'));
        expect(scopeToken('comment')).toBe('--c-code-comment-txt');
    });
});

describe('the scope map', () => {
    // Red when a scope takes a hue other than its role's, or the bare hue rather than the readable
    // `-txt` form the code window paints with.
    it('gives each TextMate scope the code hue of its role', () => {
        expect(scopeToken('comment.line')).toBe('--c-code-comment-txt');
        expect(scopeToken('string.quoted.double')).toBe('--c-code-string-txt');
        expect(scopeToken('keyword.control')).toBe('--c-code-keyword-txt');
        expect(scopeToken('constant.numeric')).toBe('--c-code-number-txt');
        expect(scopeToken('entity.name.function')).toBe('--c-code-name-txt');
        expect(scopeToken('markup.inserted')).toBe('--c-green-txt');
        expect(scopeToken('markup.deleted')).toBe('--c-red-txt');
        expect(scopeToken('source.python')).toBe(null);
    });

    // Red when the TextMate theme does not reach Shiki's tokens in the hues it names.
    it('colours a Python comment, string and keyword through Shiki in the hues of the tokens', async () => {
        const read = distinct();
        const { textmate } = editorTheme(read);
        const highlighter = await createHighlighter({ themes: [textmate], langs: ['python'] });
        const lines = highlighter.codeToTokensBase('# note\nimport os\nx = "s"\n', {
            lang: 'python',
            theme: textmate
        });
        const colour = (text: string): string | undefined =>
            lines
                .flat()
                .find((token) => token.content.includes(text))
                ?.color?.toLowerCase();
        expect(colour('note')).toBe(read('--c-code-comment-txt'));
        expect(colour('import')).toBe(read('--c-code-keyword-txt'));
        expect(colour('"s"') ?? colour('s')).toBe(read('--c-code-string-txt'));
        highlighter.dispose();
    });
});

describe('whether a panel is dark', () => {
    // The cut is a WCAG relative luminance of 0.18; an eight-digit hex is read by its colour alone.
    it('reads a near-black panel as dark, white as light and a half grey with alpha as light', () => {
        expect(isDark('#1e1e1e')).toBe(true);
        expect(isDark('#ffffff')).toBe(false);
        expect(isDark('#80808080')).toBe(false);
    });
});
