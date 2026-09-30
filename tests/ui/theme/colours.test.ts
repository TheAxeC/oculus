// Every colour a component paints is inside the set tests/checks/look/contrast.test.ts measured.
//
// That test walks every `--<x>-txt` on `--bg`, `--panel`, `--card` and `--chip`, every
// `--c-<hue>-txt` on its own tint, every `--c-<hue>-lane-txt` on its lane surface `--c-<hue>-lane`,
// and every `--on-c-<hue>` on `--c-<hue>`, under all seventeen themes. A component that only ever
// paints text with a `-txt` token or an `--on-` token, and only ever fills with a surface or a hue,
// can produce only pairs out of that set and the seven `--on-<surface>` on `--<surface>` pairs
// measured at the foot of this file. It reads the style of every component under ui/, shell/,
// views/ and routes/ and fails on a declaration outside the rule, naming the file, the selector and
// the declaration.
//
// The rule, in three parts:
//   color        var(--<x>-txt, ...), var(--on-<x>, ...), inherit or currentColor. A fallback may
//                be another such token or the bare chrome colour it is derived from, since the
//                fallback is what paints in the moment before applyTheme has set the derived
//                tokens.
//   background   a surface (--bg, --panel, --chip, --line, --accent, --accent-bg), a hue
//                (--c-<hue>), its tint (--c-<hue>-bg) or its lane surface (--c-<hue>-lane), none,
//                or transparent.
//   anywhere     no raw colour: no hex, no rgb()/hsl()/lab()/oklch(), no named colour.
//
// One form is allowed past both rules, for `background` and nothing else: a surface token with some
// of its alpha taken out, `color-mix(in srgb, var(--panel) var(--wall-panel), transparent)`, and
// the same with `--wall-popover` or with any other of the surfaces. That is how a surface goes
// translucent over the wallpaper. The colour is still the surface's own, so the pair the contrast
// test measured is the pair that paints; what changes is how much of the picture shows through. The
// token is written as a percentage by ui/theme.ts's applyWallpaper and by nothing else, and a hue
// inside a `color-mix` is refused exactly as before, which the negative fixture at the foot of the
// file shows. The surfaces are the four a reader looks at a view through, `--bg`, `--panel`,
// `--card` and `--chip`; `--line` and `--accent` are not among them.
//
// A `var()` of a custom property the component sets itself is read through to what it was set from,
// so the hue a Chip puts on `--tone` is checked exactly as if the rule named the hue. That covers
// the inline `style` a component writes for a tone, which is the one place a token name is built at
// run time.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { withoutComments } from '../../checks/source/code.ts';
import { deriveTokens, ratio } from '../../../src/lib/themes/derive.ts';
import { parseBlocks, resolveTheme } from '../../../src/lib/themes/parse.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { byKey } from '../../../src/lib/data/helpers/guards.ts';
import {
    setAppearance,
    themeClass,
    themes
} from '../../../src/lib/state/shared/words/appearance.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { treeFiles } from '../../checks/walk.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');

/** The folders the rule holds in: the three layer-3 folders, and the page shell above them. */
const ROOTS = ['lib/ui', 'lib/shell', 'lib/views', 'routes'];

/** The highlighter classes the code window's stylesheet colours, sorted, each once. */
const HIGHLIGHT_CLASSES = [
    '.hljs-addition',
    '.hljs-attr',
    '.hljs-attribute',
    '.hljs-built_in',
    '.hljs-bullet',
    '.hljs-comment',
    '.hljs-deletion',
    '.hljs-doctag',
    '.hljs-emphasis',
    '.hljs-keyword',
    '.hljs-literal',
    '.hljs-meta',
    '.hljs-name',
    '.hljs-number',
    '.hljs-params',
    '.hljs-punctuation',
    '.hljs-quote',
    '.hljs-regexp',
    '.hljs-section',
    '.hljs-selector-class',
    '.hljs-selector-id',
    '.hljs-selector-tag',
    '.hljs-string',
    '.hljs-strong',
    '.hljs-symbol',
    '.hljs-tag',
    '.hljs-template-variable',
    '.hljs-title',
    '.hljs-type',
    '.hljs-variable'
];

/** Backgrounds a component may name directly. */
const SURFACES = ['--bg', '--panel', '--card', '--chip', '--line', '--accent', '--accent-bg'];

/** Keywords that are not a colour. */
const NEUTRAL = ['none', 'transparent', 'initial', 'unset', 'revert'];

/** Chrome colours a `-txt` token may fall back to before the derived tokens are on the document. */
const RAW_CHROME = ['--ink', '--muted', '--accent'];

/** A function that carries a colour by numbers rather than by token. */
const FUNCTIONS = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/;

/** The CSS named colours. A word from this list in a value is a raw colour like a hex is. */
const NAMED = [
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
    'brown',
    'burlywood',
    'cadetblue',
    'chartreuse',
    'chocolate',
    'coral',
    'cornflowerblue',
    'cornsilk',
    'crimson',
    'cyan',
    'darkblue',
    'darkcyan',
    'darkgoldenrod',
    'darkgray',
    'darkgreen',
    'darkgrey',
    'darkkhaki',
    'darkmagenta',
    'darkolivegreen',
    'darkorange',
    'darkorchid',
    'darkred',
    'darksalmon',
    'darkseagreen',
    'darkslateblue',
    'darkslategray',
    'darkslategrey',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dimgray',
    'dimgrey',
    'dodgerblue',
    'firebrick',
    'floralwhite',
    'forestgreen',
    'fuchsia',
    'gainsboro',
    'ghostwhite',
    'gold',
    'goldenrod',
    'gray',
    'green',
    'greenyellow',
    'grey',
    'honeydew',
    'hotpink',
    'indianred',
    'indigo',
    'ivory',
    'khaki',
    'lavender',
    'lavenderblush',
    'lawngreen',
    'lemonchiffon',
    'lightblue',
    'lightcoral',
    'lightcyan',
    'lightgoldenrodyellow',
    'lightgray',
    'lightgreen',
    'lightgrey',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lightslategray',
    'lightslategrey',
    'lightsteelblue',
    'lightyellow',
    'lime',
    'limegreen',
    'linen',
    'magenta',
    'maroon',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'midnightblue',
    'mintcream',
    'mistyrose',
    'moccasin',
    'navajowhite',
    'navy',
    'oldlace',
    'olive',
    'olivedrab',
    'orange',
    'orangered',
    'orchid',
    'palegoldenrod',
    'palegreen',
    'paleturquoise',
    'palevioletred',
    'papayawhip',
    'peachpuff',
    'peru',
    'pink',
    'plum',
    'powderblue',
    'purple',
    'rebeccapurple',
    'red',
    'rosybrown',
    'royalblue',
    'saddlebrown',
    'salmon',
    'sandybrown',
    'seagreen',
    'seashell',
    'sienna',
    'silver',
    'skyblue',
    'slateblue',
    'slategray',
    'slategrey',
    'snow',
    'springgreen',
    'steelblue',
    'tan',
    'teal',
    'thistle',
    'tomato',
    'turquoise',
    'violet',
    'wheat',
    'white',
    'whitesmoke',
    'yellow',
    'yellowgreen'
];

const NAMED_WORD = new RegExp(`(?<![\\w-])(?:${NAMED.join('|')})(?![\\w-])`, 'i');

/** One declaration, with the selector it was written under. */
type Declaration = { selector: string; property: string; value: string };

/**
 * A Svelte template interpolation in a token name is the tone a component builds at run time. It is
 * replaced by a name-shaped stand-in so `var(--c-${tone})` reads as the hue it always is; tones.ts
 * allows nothing else through, so the stand-in is not an assumption about the data.
 */
function normalise(source: string): string {
    return source.replace(/\$\{[^}]*\}/g, 'hue');
}

/** Quoted text is content, not colour: `content: '['` carries no declaration of anything. */
function unquote(value: string): string {
    return value.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
}

/** Every `<style>` block of a file, comments removed. */
function styles(source: string): string[] {
    const found: string[] = [];
    for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
        found.push(withoutComments('style.css', match[1]));
    }
    return found;
}

/**
 * Every literal `style="..."` in the markup. It is CSS the style block does not hold and the rule
 * holds in it too. A `style={...}` built in the script is seen only through the custom properties
 * it sets, which is what the tone path uses and all it uses.
 */
function inlineStyles(source: string): string[] {
    const markup = source.replace(/<style[^>]*>[\s\S]*?<\/style>/g, ' ');
    return [...markup.matchAll(/style="([^"]*)"/g)].map((match) => match[1]);
}

/**
 * The declarations of one stylesheet, each with the selector it sits under. Nested blocks (a media
 * query around a rule) carry both preludes, innermost last, which is what a reader needs to find
 * it.
 */
export function declarations(css: string): Declaration[] {
    const found: Declaration[] = [];
    const stack: string[] = [];
    let buffer = '';

    const flush = (): void => {
        const text = buffer.trim();
        buffer = '';
        if (text === '') return;
        const at = text.indexOf(':');
        if (at < 0) return;
        found.push({
            selector: stack.join(' / '),
            property: text.slice(0, at).trim().toLowerCase(),
            value: text.slice(at + 1).trim()
        });
    };

    for (const character of css) {
        if (character === '{') {
            stack.push(buffer.trim().replace(/\s+/g, ' '));
            buffer = '';
        } else if (character === '}') {
            flush();
            stack.pop();
        } else if (character === ';') {
            flush();
        } else {
            buffer += character;
        }
    }
    // An inline style has no closing brace, so the last declaration is flushed here.
    flush();
    return found;
}

/** Every custom property the file sets, with all the values it sets it to. */
export function assignments(source: string): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    for (const match of source.matchAll(/(--[a-z][a-z0-9-]*)\s*:\s*([^;}"'`\n]+)/gi)) {
        const name = match[1].toLowerCase();
        (map[name] ??= []).push(match[2].trim());
    }
    return map;
}

/** The token and the fallback of a `var()`, or nothing when the value is not one whole `var()`. */
function variable(value: string): { name: string; fallback: string | null } | null {
    const match = /^var\(\s*(--[a-z0-9-]+)\s*(?:,([\s\S]*))?\)$/i.exec(value.trim());
    if (match === null) return null;
    const fallback = match.at(2)?.trim() ?? null;
    return { name: match[1].toLowerCase(), fallback };
}

/** A value with every token name and every quoted string taken out, for the raw-colour scan. */
function bare(value: string): string {
    return unquote(value).replace(/--[a-z0-9-]+/gi, ' ');
}

/** Whether a declaration's value names a colour by its numbers or by its English name. */
export function rawColour(value: string): boolean {
    const text = bare(value);
    return /#[0-9a-f]{3,8}\b/i.test(text) || FUNCTIONS.test(text) || NAMED_WORD.test(text);
}

/**
 * The one `color-mix` a component may fill with: a surface at the wallpaper's opacity. Whitespace
 * is whatever prettier leaves; the tokens and their order are the whole of the form.
 */
const WALL_MIX =
    /^color-mix\(\s*in\s+srgb\s*,\s*var\(\s*(--[a-z-]+)\s*\)\s+var\(\s*--wall-(?:panel|popover)\s*\)\s*,\s*transparent\s*\)$/i;

/**
 * The surfaces a wallpaper rule may take a fraction of: the four a reader looks at a view through.
 * `--line` and `--accent` are not among them, and the contrast test measures no pair at a fraction
 * of either.
 */
const WALL_SURFACES = ['--bg', '--panel', '--card', '--chip'];

/** Whether a value is that form over one of those, which is what makes the pair a measured one. */
function wallMix(value: string): boolean {
    const found = WALL_MIX.exec(value.trim());
    return found !== null && WALL_SURFACES.includes(found[1].toLowerCase());
}

/** A token a component may paint text with: the derived families and nothing else. */
function textToken(name: string): boolean {
    return name.endsWith('-txt') || name.startsWith('--on-');
}

/** A token a component may fill with: a surface, a hue, or a hue's tint or lane surface. */
function fillToken(name: string): boolean {
    if (SURFACES.includes(name)) return true;
    return name.startsWith('--c-') && !textToken(name);
}

function allowedColour(value: string, set: Record<string, string[]>): boolean {
    const text = value.trim().toLowerCase();
    if (text === 'inherit' || text === 'currentcolor' || NEUTRAL.includes(text)) return true;
    const found = variable(value);
    if (found === null) return false;
    const own = byKey(set, found.name);
    if (own !== undefined) return own.every((assigned) => allowedColour(assigned, set));
    if (!textToken(found.name)) return false;
    if (found.fallback === null) return true;
    // The fallback paints only until applyTheme sets the derived tokens, so it may also be the bare
    // chrome colour the derived token comes from. It may never be a hue: that is the pair the
    // contrast test has no measurement for.
    const back = variable(found.fallback);
    if (back !== null && RAW_CHROME.includes(back.name)) return true;
    return allowedColour(found.fallback, set);
}

function allowedFill(value: string, set: Record<string, string[]>): boolean {
    const text = value.trim().toLowerCase();
    if (NEUTRAL.includes(text) || text === 'inherit') return true;
    const found = variable(value);
    if (found === null) return false;
    const own = byKey(set, found.name);
    if (own !== undefined) return own.every((assigned) => allowedFill(assigned, set));
    if (!fillToken(found.name)) return false;
    return found.fallback === null || allowedFill(found.fallback, set);
}

function svelteFiles(root: string): string[] {
    return treeFiles(root).filter((rel) => rel.endsWith('.svelte'));
}

/** Every declaration under `roots` that the rule refuses, as file, selector and declaration. */
export function findColourViolations(base: string, roots: string[]): string[] {
    const violations: string[] = [];
    for (const root of roots) {
        for (const rel of svelteFiles(join(base, root))) {
            const source = normalise(readFileSync(join(base, root, rel), 'utf8'));
            const set = assignments(source);
            const found: Declaration[] = [];
            for (const css of styles(source)) found.push(...declarations(css));
            for (const css of inlineStyles(source)) {
                for (const one of declarations(css)) {
                    found.push({ ...one, selector: 'style attribute' });
                }
            }
            // A custom property set in the markup is a declaration too: it is where a tone is
            // turned into a token name, and it is the one the rule most needs to see.
            for (const [name, values] of Object.entries(set)) {
                for (const value of values) {
                    if (found.some((one) => one.property === name && one.value === value)) continue;
                    found.push({ selector: 'style attribute', property: name, value });
                }
            }
            const say = (one: Declaration): string =>
                `${root}/${rel}: ${one.selector}: ${one.property}: ${one.value}`;
            for (const one of found) {
                if (one.property === 'background' && wallMix(one.value)) continue;
                if (rawColour(one.value)) {
                    violations.push(`${say(one)} (raw colour)`);
                    continue;
                }
                if (one.property === 'color' && !allowedColour(one.value, set)) {
                    violations.push(`${say(one)} (not a -txt or --on- token)`);
                }
                const fill = one.property === 'background' || one.property === 'background-color';
                if (fill && !allowedFill(one.value, set)) {
                    violations.push(`${say(one)} (not a surface or a hue)`);
                }
            }
        }
    }
    return violations.sort();
}

/**
 * The one pair the rule allows that tests/checks/look/contrast.test.ts does not walk: an
 * `--on-<surface>` on the surface it is named after, which is what a ToolButton in force paints.
 * That test measures only the `--on-c-<hue>` half of the `--on-` family, so this measures the other
 * half here rather than editing it. It fails if a theme is ever given a surface no black and no
 * white reads on.
 */
describe('the surfaces a component may fill and paint on', () => {
    const THEMES_DIR = resolve(SRC, 'lib', 'themes');
    const blocks = parseBlocks(
        `${readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8')}\n${readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8')}`
    );
    setAppearance(loadConfig(engineDir()).config);
    const names = themes().map((entry) => entry.name);

    it('keeps both type scales at their cockpit pixels when the app scale is one', () => {
        const expected = {
            ':root': [8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 15, 19, 24],
            rice: [8, 9, 10, 10.5, 11.5, 12.5, 13.5, 16, 20]
        };
        const tokens = ['3xs', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
        for (const [block, pixels] of Object.entries(expected)) {
            expect(
                tokens.map((token) => {
                    const value = blocks[block][`--fs-${token}`];
                    const match = /^calc\(([\d.]+)px \* var\(--text-scale, 1\)\)$/.exec(value);
                    return match === null ? Number.NaN : Number(match[1]);
                })
            ).toEqual(pixels);
        }
    });

    it('keeps every --on-<surface> on its surface at 4.5:1, under every theme', () => {
        const failures: string[] = [];
        let measured = 0;
        for (const name of names) {
            const theme = resolveTheme(blocks, themeClass(name));
            const all: Record<string, string> = { ...theme, ...deriveTokens(theme) };
            for (const surface of SURFACES) {
                const on = `--on-${surface.slice(2)}`;
                if (byKey(all, on) === undefined || byKey(all, surface) === undefined) continue;
                measured += 1;
                const found = ratio(all[on], all[surface]);
                if (found < 4.5) {
                    failures.push(`${name}: ${on} on ${surface} = ${found.toFixed(2)}:1`);
                }
            }
        }
        expect(measured).toBe(names.length * SURFACES.length);
        expect(failures).toEqual([]);
    });

    it('defines the card surface in the root and every theme block', () => {
        expect(
            Object.entries(blocks)
                .filter(([, tokens]) => byKey(tokens, '--panel') !== undefined)
                .filter(([, tokens]) => byKey(tokens, '--card') === undefined)
                .map(([name]) => name)
        ).toEqual([]);
    });

    it('defines the four Source Control hues in the root and in every theme block', () => {
        const scm = ['--c-scm-added', '--c-scm-modified', '--c-scm-deleted', '--c-scm-conflict'];
        const themed = Object.entries(blocks).filter(
            ([, tokens]) => byKey(tokens, '--panel') !== undefined
        );
        expect(themed.length).toBeGreaterThan(16);
        expect(
            themed
                .filter(([, tokens]) => scm.some((token) => byKey(tokens, token) === undefined))
                .map(([name]) => name)
        ).toEqual([]);
    });

    it('keeps the card surface distinct from the panel in every resolved theme', () => {
        expect(
            names.filter((name) => {
                const theme = resolveTheme(blocks, themeClass(name));
                return theme['--card'] === theme['--panel'];
            })
        ).toEqual([]);
    });
});

describe('the code window palette', () => {
    const root = parseBlocks(readFileSync(join(SRC, 'lib', 'themes', 'tokens.css'), 'utf8'))[
        ':root'
    ];
    const tokens = Object.keys(root)
        .filter((name) => name.startsWith('--c-code-'))
        .sort();

    it('names one hue per role the highlighter marks', () => {
        expect(tokens).toEqual([
            '--c-code-comment',
            '--c-code-keyword',
            '--c-code-meta',
            '--c-code-name',
            '--c-code-number',
            '--c-code-string'
        ]);
    });

    // Each is an authored hue of the palette, which is what makes derive.ts mint its `-txt` against
    // every theme's own surfaces and tests/checks/look/contrast.test.ts measure the pair.
    it('gives each one a colour of its own rather than a reference to another token', () => {
        expect(tokens.filter((name) => !/^#[0-9a-f]{6}$/i.test(root[name]))).toEqual([]);
    });

    // The code window and every painted Markdown block take the highlighter's classes from one
    // stylesheet, and the editor's theme paints the TextMate scopes, each with every role's `-txt`
    // form and nothing else, so a file is coloured the same whether it is read or written.
    it('paints the code window through those six and nothing else', () => {
        const source = readFileSync(join(SRC, 'lib', 'themes', 'code.css'), 'utf8');
        const painted = [...source.matchAll(/color:\s*var\((--c-code-[a-z-]+)-txt\)/g)].map(
            (found) => found[1]
        );
        expect([...new Set(painted)].sort()).toEqual(tokens);
    });

    // An audit of the stylesheet's text and the layout's imports: every class the highlighter
    // marks is coloured by one global stylesheet the page root loads, so a view carries none.
    it('colours every highlighter class from one stylesheet the page root imports', () => {
        const sheet = withoutComments(
            'code.css',
            readFileSync(join(SRC, 'lib', 'themes', 'code.css'), 'utf8')
        );
        const selectors = [...sheet.matchAll(/\.hljs-[a-z_-]+/g)].map((found) => found[0]).sort();
        expect(selectors).toEqual(HIGHLIGHT_CLASSES);
        const layout = readFileSync(join(SRC, 'routes', '+layout.svelte'), 'utf8');
        expect(layout).toContain("import '$lib/themes/code.css';");
        const viewsDir = join(SRC, 'lib', 'views');
        const views = treeFiles(viewsDir).filter((file) =>
            readFileSync(join(viewsDir, file), 'utf8').includes('hljs-')
        );
        expect(views).toEqual([]);
    });

    // An audit, a read of theme.ts's text: red when that text names a code role by its bare hue or
    // leaves one out. The behaviour, that Shiki colours the tokens in those hues, is tested by
    // tests/ui/controls/editor/kit/theme.test.ts:160-178.
    it("paints the editor's scopes through those six and nothing else", () => {
        const file = join(SRC, 'lib', 'ui', 'controls', 'editor', 'kit', 'theme.ts');
        const source = readFileSync(file, 'utf8');
        const painted = [...source.matchAll(/'(--c-code-[a-z]+)(-txt)?'/g)];
        const bare = painted.filter((found) => !found[0].endsWith("-txt'"));
        expect(bare.map((found) => found[0])).toEqual([]);
        expect([...new Set(painted.map((found) => found[1]))].sort()).toEqual(tokens);
    });
});

describe('the colour rule', () => {
    it('holds in every component under ui, shell, views and routes', () => {
        expect(findColourViolations(SRC, ROOTS)).toEqual([]);
    });

    it('reads the components at all', () => {
        const files = ROOTS.flatMap((root) => svelteFiles(join(SRC, root)));
        expect(files.length).toBeGreaterThan(10);
    });

    it('refuses a raw colour, a hue as text, and a token nothing sets', () => {
        const dir = plantScratch('oculus-colours-', {
            'ui/Good.svelte': [
                '<span class="a" style="--tone: var(--c-teal)"></span>',
                '<style>',
                '    .a { color: var(--c-teal-txt); background: var(--tone); }',
                '    .b { color: var(--on-c-teal); background: var(--c-teal); }',
                '    .c { color: inherit; background: none; border: 1px solid var(--line); }',
                '    .d::before { content: "["; }',
                '    .e { background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent); }',
                '    .f { background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent); }',
                '</style>'
            ].join('\n'),
            'ui/Hex.svelte': '<style>\n    .a { color: #ff0000; }\n</style>',
            'ui/Named.svelte': '<style>\n    .a { border-color: rebeccapurple; }\n</style>',
            'ui/Hue.svelte': '<style>\n    .a { color: var(--c-teal); }\n</style>',
            'ui/Unset.svelte': '<style>\n    .a { background: var(--nonesuch); }\n</style>',
            'ui/Indirect.svelte':
                '<span style="--tone: #ff0000"></span>\n<style>\n    .a { background: var(--tone); }\n</style>',
            'ui/Inline.svelte': '<span style="color: #00ff00"></span>',
            // The allowance is the four surfaces and no other token: a hue or an edge colour mixed
            // the same way is a colour the contrast test has no measurement for, and a `color-mix`
            // as text is refused whatever it holds.
            'ui/Mix.svelte': [
                '<style>',
                '    .a { background: color-mix(in srgb, var(--c-teal) var(--wall-panel), transparent); }',
                '    .b { color: color-mix(in srgb, var(--panel) var(--wall-panel), transparent); }',
                '    .c { background: color-mix(in srgb, var(--accent) var(--wall-panel), transparent); }',
                '</style>'
            ].join('\n')
        });

        expect(findColourViolations(dir, ['ui'])).toEqual([
            'ui/Hex.svelte: .a: color: #ff0000 (raw colour)',
            'ui/Hue.svelte: .a: color: var(--c-teal) (not a -txt or --on- token)',
            'ui/Indirect.svelte: .a: background: var(--tone) (not a surface or a hue)',
            'ui/Indirect.svelte: style attribute: --tone: #ff0000 (raw colour)',
            'ui/Inline.svelte: style attribute: color: #00ff00 (raw colour)',
            'ui/Mix.svelte: .a: background: color-mix(in srgb, var(--c-teal) var(--wall-panel), transparent) (raw colour)',
            'ui/Mix.svelte: .b: color: color-mix(in srgb, var(--panel) var(--wall-panel), transparent) (raw colour)',
            'ui/Mix.svelte: .c: background: color-mix(in srgb, var(--accent) var(--wall-panel), transparent) (raw colour)',
            'ui/Named.svelte: .a: border-color: rebeccapurple (raw colour)',
            'ui/Unset.svelte: .a: background: var(--nonesuch) (not a surface or a hue)'
        ]);
    });
});
