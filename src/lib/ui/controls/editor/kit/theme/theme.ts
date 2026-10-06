// Layer 3, primitive. The editor's theme, built from the tokens of the theme in force: Monaco's
// colour map, and the TextMate theme Shiki colours the text with. Monaco and Shiki take colours as
// values through their own API rather than reading CSS, so the tokens are read as computed values
// (the caller hands in the reading) and built into both here, again on every theme change.
//
// Monaco refuses a three-digit hex and Shiki's bridge passes one through, so every value is
// expanded before either sees it; a token whose value is no hex at all is named in `bad` and the
// keys painted from it are left out, which a test holds at none for every theme.
//
// The TextMate rules give each scope the code hue of its role in the `-txt` form the code window
// paints with, which themes/derive.ts nudges until it clears 4.5:1 on every surface, so a file is
// coloured the same whether it is read or written; the bare hues fall under that on the panel in
// most themes. A `-txt` form the body does not carry yet reads as its hue, as the page's own
// `var(--ink-txt, var(--ink))` falls back.
//
// A bare `meta` scope wraps whole functions and classes in the grammars, so the meta hue goes to
// the preprocessor, directive and tag scopes alone, and to punctuation and variables.
//
// Under a code theme (a Shiki theme the reader chose in place of the tokens) only the TextMate
// rules change: `codeRules` takes the theme's own scoped rules for the syntax colours, while the
// colour map, the type and the base foreground and background stay built from the tokens, so the
// editor's background and chrome follow the UI theme either way.

import { wcagLuminance } from 'culori';
import type { ThemeRegistration } from 'shiki';
import { COLOURS } from './colours';

/** One TextMate rule: the scopes it matches, the token it paints them with, its font style. */
type ScopeRule = { scopes: string[]; token: string | null; fontStyle?: string };

/**
 * The scope rules. TextMate paints a scope by the most specific rule whose selector is the scope
 * or a prefix of it, so the punctuation of a comment or a string is named with its own rule, ahead
 * of the punctuation rule that would otherwise take it.
 */
const RULES: ScopeRule[] = [
    { scopes: ['comment', 'punctuation.definition.comment'], token: '--c-code-comment-txt' },
    {
        scopes: ['string', 'punctuation.definition.string', 'constant.character.escape'],
        token: '--c-code-string-txt'
    },
    { scopes: ['keyword', 'storage'], token: '--c-code-keyword-txt' },
    { scopes: ['constant.numeric', 'constant.language'], token: '--c-code-number-txt' },
    {
        scopes: [
            'entity.name',
            'entity.other.attribute-name',
            'entity.other.inherited-class',
            'support.function',
            'support.type',
            'support.class',
            'markup.heading'
        ],
        token: '--c-code-name-txt'
    },
    {
        scopes: [
            'meta.preprocessor',
            'meta.directive',
            'meta.tag',
            'entity.name.tag',
            'punctuation',
            'variable'
        ],
        token: '--c-code-meta-txt'
    },
    { scopes: ['markup.bold'], token: '--ink-txt', fontStyle: 'bold' },
    { scopes: ['markup.italic'], token: '--ink-txt', fontStyle: 'italic' },
    {
        scopes: ['markup.bold markup.italic', 'markup.italic markup.bold'],
        token: '--ink-txt',
        fontStyle: 'bold italic'
    },
    { scopes: ['markup.inserted'], token: '--c-green-txt' },
    { scopes: ['markup.deleted'], token: '--c-red-txt' }
];

/** The rules of a TextMate theme, as the registration Shiki takes holds them. */
type TokenColors = NonNullable<ThemeRegistration['tokenColors']>;

/** The editor's theme: Monaco's colours, Shiki's TextMate theme and the tokens that were no hex. */
export type EditorTheme = {
    colors: Record<string, string>;
    textmate: ThemeRegistration;
    bad: string[];
};

/**
 * A hex colour in the form Monaco takes: 3 digits made 6 and 4 made 8, each digit doubled, 6 and 8
 * as they are, lower case. Null for a value that is no hex colour.
 */
export function expandHex(value: string): string | null {
    const hex = value.trim().toLowerCase();
    if (!/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return null;
    const digits = hex.slice(1);
    if (digits.length > 4) return hex;
    return `#${digits.replace(/./g, (digit) => digit + digit)}`;
}

/** The token a TextMate scope is painted with, by the most specific rule, or null for none. */
export function scopeToken(scope: string): string | null {
    let best: { length: number; token: string | null } | null = null;
    for (const rule of RULES) {
        for (const selector of rule.scopes) {
            const matches = scope === selector || scope.startsWith(`${selector}.`);
            if (matches && (best === null || selector.length > best.length)) {
                best = { length: selector.length, token: rule.token };
            }
        }
    }
    return best?.token ?? null;
}

/** Whether a 6 or 8 digit hex is a dark colour, by its WCAG relative luminance, alpha aside. */
export function isDark(hex: string): boolean {
    return wcagLuminance(hex) < 0.18;
}

/**
 * Build the editor's theme from a reading of the tokens in force. `read` answers a token's computed
 * value; `name` names the theme in Shiki and in Monaco.
 */
export function editorTheme(read: (token: string) => string, name = 'oculus'): EditorTheme {
    const bad: string[] = [];
    const held = new Map<string, string | null>();
    const value = (token: string): string | null => {
        if (held.has(token)) return held.get(token) ?? null;
        const said = read(token).trim();
        const hue = token.endsWith('-txt') ? token.slice(0, -'-txt'.length) : '';
        const expanded = expandHex(said === '' && hue !== '' ? read(hue) : said);
        held.set(token, expanded);
        if (expanded === null) bad.push(token);
        return expanded;
    };
    const colors: Record<string, string> = {};
    for (const [key, paint] of Object.entries(COLOURS)) {
        const [token, alpha = ''] = paint.split(' ');
        const hex = value(token);
        if (hex === null) continue;
        colors[key] = alpha === '' ? hex : `${hex.slice(0, 7)}${alpha}`;
    }
    const tokenColors = RULES.map((rule) => {
        const foreground = rule.token === null ? null : value(rule.token);
        return {
            scope: rule.scopes,
            settings: {
                ...(foreground === null ? {} : { foreground }),
                ...(rule.fontStyle === undefined ? {} : { fontStyle: rule.fontStyle })
            }
        };
    });
    const panel = value('--panel');
    const ink = value('--ink-txt');
    const textmate: ThemeRegistration = {
        name,
        type: panel !== null && isDark(panel) ? 'dark' : 'light',
        colors,
        tokenColors,
        ...(ink === null ? {} : { fg: ink }),
        ...(panel === null ? {} : { bg: panel })
    };
    return { colors, textmate, bad };
}

/**
 * The syntax rules of a Shiki theme for painting over the tokens' background: its scoped rules,
 * each without a `background`. A rule with no scope is the theme's own foreground and background
 * for all text, which the tokens set instead, and a rule left with no setting after its background
 * is removed does nothing.
 */
export function codeRules(theme: ThemeRegistration): TokenColors {
    const rules: TokenColors = [];
    for (const rule of theme.tokenColors ?? []) {
        if (rule.scope === undefined) continue;
        const settings = Object.fromEntries(
            Object.entries(rule.settings).filter(([key]) => key !== 'background')
        );
        if (Object.keys(settings).length > 0) rules.push({ ...rule, settings });
    }
    return rules;
}
