// Reading the two stylesheets as data. A theme is a block of token overrides, so the tokens of a
// theme are recoverable from the sheet itself and nothing has to restate them in TypeScript.
//
// parseBlocks reads `:root` and every `body.<name>` block; resolveTheme merges the blocks a body
// class string names over `:root`, in the order the sheet declares them, which is the order the
// browser resolves them in when two blocks set the same token. deriveTokens then turns that map
// into the readable foregrounds, and windowColours reads from it the two colours a window of the
// desktop app takes before its page paints, which the host reads; the page sends the same `--bg`
// token of the theme it drew once it has drawn one (shell/window/strip-colours.ts). Nothing here
// touches the document or the filesystem: the caller passes the stylesheet text, so this runs in
// the browser, in a test, on the server and in the desktop host alike.

/** Tokens by block: the key is `:root` or the body class name (`dark`, `mocha`, `rice`). */
export type ThemeBlocks = Record<string, Record<string, string>>;

/**
 * A selector this module reads. Anything else in the sheet belongs to a component, not a theme.
 * A hyphen is part of a class name here: `vscode-dark-modern` is one class, not two.
 */
const SELECTOR = /^(?::root|body\.[a-z0-9-]+)$/;

function stripComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The custom properties of one block body, in declaration order. */
function declarations(body: string): Record<string, string> {
    const tokens: Record<string, string> = {};
    for (const part of body.split(';')) {
        const colon = part.indexOf(':');
        if (colon < 0) continue;
        const name = part.slice(0, colon).trim();
        if (!name.startsWith('--')) continue;
        tokens[name] = part
            .slice(colon + 1)
            .trim()
            .split(/\s+/)
            .join(' ');
    }
    return tokens;
}

/**
 * The token map of `:root` and of every `body.<name>` block, comments stripped first because the
 * sheets contain prose that mentions `:root{` and `body.rice{`. Blocks inside a media query or any
 * other nesting are not themes and are skipped; a block that appears twice is merged in file order.
 */
export function parseBlocks(css: string): ThemeBlocks {
    const text = stripComments(css);
    const blocks: ThemeBlocks = {};
    let depth = 0;
    let selector = '';
    let pending = '';
    let start = 0;

    for (let i = 0; i < text.length; i += 1) {
        const character = text[i];
        if (character === '{') {
            if (depth === 0) {
                selector = pending.trim().split(/\s+/).join(' ');
                start = i + 1;
            }
            depth += 1;
            pending = '';
        } else if (character === '}') {
            depth -= 1;
            if (depth === 0 && SELECTOR.test(selector)) {
                const name = selector === ':root' ? ':root' : selector.slice('body.'.length);
                blocks[name] = { ...blocks[name], ...declarations(text.slice(start, i)) };
            }
            pending = '';
        } else if (depth === 0) {
            pending += character;
        }
    }
    return blocks;
}

/**
 * The tokens in force for a body carrying `classes`, a space-separated class string as a theme's
 * `class` in config/defaults/appearance.yml gives it. An empty string is the light theme:
 * `:root` alone.
 */
export function resolveTheme(blocks: ThemeBlocks, classes: string): Record<string, string> {
    const wanted = new Set(classes.split(/\s+/).filter((name) => name.length > 0));
    const merged: Record<string, string> = { ...blocks[':root'] };
    for (const [name, tokens] of Object.entries(blocks)) {
        if (name !== ':root' && wanted.has(name)) Object.assign(merged, tokens);
    }
    return merged;
}

/**
 * The colours a window of the desktop app takes before its page paints: `background`, which fills
 * the window under the page, and `symbol`, which the system draws the window buttons' symbols in
 * where it draws them over the page's title bar strip.
 */
export type WindowColours = { background: string; symbol: string };

/** A colour as a window takes it: `#` and 3, 4, 6 or 8 hex digits. */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Whether a value is a colour as a window takes it, which the desktop host checks a page's by. */
export function isHexColour(value: unknown): value is string {
    return typeof value === 'string' && HEX.test(value);
}

/**
 * The window colours of the theme a body carrying `classes` draws: its `--bg`, and its title bar
 * words `--titlebar-txt`, or its `--ink` for a theme that sets none, each as the sheet writes it.
 * Null when either is not a hex colour, which a window cannot take.
 */
export function windowColours(blocks: ThemeBlocks, classes: string): WindowColours | null {
    const tokens = resolveTheme(blocks, classes);
    const background = tokens['--bg'];
    const symbol = tokens['--titlebar-txt'] ?? tokens['--ink'];
    return isHexColour(background) && isHexColour(symbol) ? { background, symbol } : null;
}
