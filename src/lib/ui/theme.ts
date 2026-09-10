// Layer 3, primitive, and the only one that is not a component. Putting a theme on the document:
// the class string on the body, and the derived colour tokens on the root element.
//
// The two stylesheets reach this module as text through Vite's `?raw` import, which is the same
// bytes the page is styled with. The derivation therefore runs on the authored values themselves and
// nothing restates a colour in TypeScript. The caller may pass its own two sheets instead, which is
// how the test runs it over the files read from disk.

import { deriveTokens } from '$lib/themes/derive';
import { parseBlocks, resolveTheme } from '$lib/themes/parse';
import tokensCss from '$lib/themes/tokens.css?raw';
import themesCss from '$lib/themes/themes.css?raw';

/** What this needs of a Document, so a test can hand it a plain object and read back what was set. */
export type Themeable = {
    body: { className: string };
    documentElement: { style: { setProperty: (name: string, value: string) => void } };
};

/** The body class the CRT overlay is switched on by; themes.css draws it on top of any theme. */
export const CRT_CLASS = 'crt';

/**
 * Put a theme on the document: `classes` is the theme's own body class string, the `class` of its
 * config/appearance.yml entry, and the CRT class joins it when the overlay is on. The tokens the
 * components paint text with are derived from the theme the two sheets resolve to and set on the
 * root element, since a stylesheet cannot compute them.
 */
export function applyTheme(
    document: Themeable,
    classes: string,
    crt: boolean,
    tokens: string = tokensCss,
    themes: string = themesCss
): Record<string, string> {
    const className = [classes, crt ? CRT_CLASS : '']
        .join(' ')
        .split(/\s+/)
        .filter((name) => name.length > 0)
        .join(' ');
    document.body.className = className;

    const blocks = parseBlocks(`${tokens}\n${themes}`);
    const derived = deriveTokens(resolveTheme(blocks, className));
    for (const [name, value] of Object.entries(derived)) {
        document.documentElement.style.setProperty(name, value);
    }
    return derived;
}
