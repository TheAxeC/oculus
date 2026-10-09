// Layer 3, primitive. The colours of semantic tokens. A language server's tokens (clangd's) carry a
// type and modifiers, and Monaco's standalone theme looks a token up in the theme's own rules by
// the string `<type>` or `<type>.<modifier>...`; a token no rule matches takes the root rule's
// foreground and paints over Shiki's colour. So the theme gets one rule per row of the table
// below, which is VS Code's default mapping of semantic tokens to TextMate scopes
// (src/vs/platform/theme/common/tokenClassificationRegistry.ts, `registerTokenType` and
// `registerTokenStyle`), each painted the colour the theme in force gives the row's first scope,
// else its second, by the most specific rule whose selector is the scope or a prefix of it, which
// is the TextMate match the theme already runs. A row whose scopes the theme does not colour has no
// rule, and the provider (lsp/semantic.ts) leaves such a token to Shiki's colour.
//
// The modifiers a token keeps are `defaultLibrary` and `readonly`, the two VS Code's defaults
// style, so a lookup string is one of the four spellings of a type with them.

import type { ThemeRegistration } from 'shiki';

/** One row: the lookup string Monaco matches, and the TextMate scopes it is painted by. */
type SemanticRow = { lookup: string; scopes: readonly string[] };

/** VS Code's default semantic token styles, in its order. */
const SEMANTIC_ROWS: readonly SemanticRow[] = [
    { lookup: 'comment', scopes: ['comment'] },
    { lookup: 'keyword', scopes: ['keyword.control'] },
    { lookup: 'number', scopes: ['constant.numeric'] },
    { lookup: 'operator', scopes: ['keyword.operator'] },
    { lookup: 'namespace', scopes: ['entity.name.namespace'] },
    { lookup: 'type', scopes: ['entity.name.type', 'support.type'] },
    { lookup: 'class', scopes: ['entity.name.type.class', 'support.class'] },
    { lookup: 'interface', scopes: ['entity.name.type.interface'] },
    { lookup: 'enum', scopes: ['entity.name.type.enum'] },
    { lookup: 'typeParameter', scopes: ['entity.name.type.parameter'] },
    { lookup: 'function', scopes: ['entity.name.function', 'support.function'] },
    { lookup: 'method', scopes: ['entity.name.function.member', 'support.function'] },
    { lookup: 'macro', scopes: ['entity.name.function.preprocessor'] },
    { lookup: 'variable', scopes: ['variable.other.readwrite', 'entity.name.variable'] },
    { lookup: 'parameter', scopes: ['variable.parameter'] },
    { lookup: 'property', scopes: ['variable.other.property'] },
    { lookup: 'enumMember', scopes: ['variable.other.enummember'] },
    { lookup: 'variable.readonly', scopes: ['variable.other.constant'] },
    { lookup: 'property.readonly', scopes: ['variable.other.constant.property'] },
    { lookup: 'type.defaultLibrary', scopes: ['support.type'] },
    { lookup: 'class.defaultLibrary', scopes: ['support.class'] },
    { lookup: 'interface.defaultLibrary', scopes: ['support.class'] },
    { lookup: 'variable.defaultLibrary', scopes: ['support.variable', 'support.other.variable'] },
    { lookup: 'variable.defaultLibrary.readonly', scopes: ['support.constant'] },
    { lookup: 'property.defaultLibrary', scopes: ['support.variable.property'] },
    { lookup: 'property.defaultLibrary.readonly', scopes: ['support.constant.property'] },
    { lookup: 'function.defaultLibrary', scopes: ['support.function'] },
    { lookup: 'method.defaultLibrary', scopes: ['support.function'] }
];

/** The token types the rows cover, in the order of the legend the provider offers Monaco. */
export const SEMANTIC_TYPES: readonly string[] = [
    ...new Set(SEMANTIC_ROWS.map((row) => row.lookup.split('.')[0]))
];

/** The modifiers a token keeps, by the bit each one is in the legend the provider offers. */
export const SEMANTIC_MODIFIERS: readonly string[] = ['defaultLibrary', 'readonly'];

/** A rule of Monaco's token theme. */
export type SemanticRule = { token: string; foreground?: string; fontStyle?: string };

/** The rules of a TextMate theme, as the registration Shiki takes holds them. */
type TokenColors = NonNullable<ThemeRegistration['tokenColors']>;

/**
 * What a scope is painted: the foreground and font style of the most specific rule that matches.
 */
function paintOf(
    scope: string,
    rules: TokenColors
): { foreground?: string; fontStyle?: string } | null {
    let best: { length: number; foreground?: string; fontStyle?: string } | null = null;
    for (const rule of rules) {
        const selectors = Array.isArray(rule.scope) ? rule.scope : rule.scope ? [rule.scope] : [];
        for (const selector of selectors) {
            if (selector.includes(' ')) continue;
            const matches = scope === selector || scope.startsWith(`${selector}.`);
            if (!matches || (best !== null && selector.length < best.length)) continue;
            const { foreground, fontStyle } = rule.settings;
            best = { length: selector.length, foreground, fontStyle };
        }
    }
    if (best === null || (best.foreground === undefined && best.fontStyle === undefined))
        return null;
    return { foreground: best.foreground, fontStyle: best.fontStyle };
}

/** A colour as Monaco's rules take it: six or eight digits, no `#`, lower case. */
function digits(colour: string): string {
    const hex = (colour.startsWith('#') ? colour.slice(1) : colour).toLowerCase();
    return hex.length <= 4 ? hex.replace(/./g, (digit) => digit + digit) : hex;
}

/**
 * The rules the semantic tokens of a theme are painted by: for each row, the paint of its first
 * scope the theme colours, else of its second, and no rule when the theme colours neither.
 */
export function semanticRules(tokenColors: TokenColors): SemanticRule[] {
    const rules: SemanticRule[] = [];
    for (const row of SEMANTIC_ROWS) {
        for (const scope of row.scopes) {
            const paint = paintOf(scope, tokenColors);
            // A rule that only resets the style sets no colour and no style here, and a rule of
            // neither would paint the token in the editor's default ink over Shiki's colour.
            const style = paint?.fontStyle ?? '';
            if (paint === null || (paint.foreground === undefined && style === '')) continue;
            rules.push({
                token: row.lookup,
                ...(paint.foreground === undefined ? {} : { foreground: digits(paint.foreground) }),
                ...(paint.fontStyle === undefined || paint.fontStyle === ''
                    ? {}
                    : { fontStyle: paint.fontStyle })
            });
            break;
        }
    }
    return rules;
}
