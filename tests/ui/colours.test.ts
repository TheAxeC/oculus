// Every colour a component paints is inside the set tests/contrast.test.ts measured.
//
// That test walks every `--<x>-txt` on `--bg`, `--panel` and `--chip`, every `--c-<hue>-txt` on its
// own tint, and every `--on-c-<hue>` on `--c-<hue>`, under all fifteen themes. A component that only
// ever paints text with a `-txt` token or an `--on-` token, and only ever fills with a surface or a
// hue, can produce only pairs out of that set and the five `--on-<surface>` on `--<surface>` pairs
// measured at the foot of this file. It reads the style of every component under ui/, shell/, views/
// and routes/ and fails on a declaration outside the rule, naming the file, the selector and the
// declaration.
//
// The rule, in three parts:
//   color        var(--<x>-txt, ...), var(--on-<x>, ...), inherit or currentColor. A fallback may be
//                another such token or the bare chrome colour it is derived from, since the fallback
//                is what paints in the moment before applyTheme has set the derived tokens.
//   background   a surface (--bg, --panel, --chip, --line, --accent), a hue (--c-<hue>) or its tint
//                (--c-<hue>-bg), none, or transparent.
//   anywhere     no raw colour: no hex, no rgb()/hsl()/lab()/oklch(), no named colour.
//
// A `var()` of a custom property the component sets itself is read through to what it was set from,
// so the hue a Chip puts on `--tone` is checked exactly as if the rule named the hue. That covers
// the inline `style` a component writes for a tone, which is the one place a token name is built at
// run time.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { deriveTokens, ratio } from '../../src/lib/themes/derive.ts';
import { parseBlocks, resolveTheme } from '../../src/lib/themes/parse.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { setAppearance, themeClass, themes } from '../../src/lib/state/appearance.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** The folders the rule holds in: the three layer-3 folders, and the page shell above them. */
const ROOTS = ['lib/ui', 'lib/shell', 'lib/views', 'routes'];

/** Backgrounds a component may name directly. */
const SURFACES = ['--bg', '--panel', '--chip', '--line', '--accent'];

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
        found.push(match[1].replace(/\/\*[\s\S]*?\*\//g, ' '));
    }
    return found;
}

/**
 * Every literal `style="..."` in the markup. It is CSS the style block does not hold and the rule
 * holds in it too. A `style={...}` built in the script is seen only through the custom properties it
 * sets, which is what the tone path uses and all it uses.
 */
function inlineStyles(source: string): string[] {
    const markup = source.replace(/<style[^>]*>[\s\S]*?<\/style>/g, ' ');
    return [...markup.matchAll(/style="([^"]*)"/g)].map((match) => match[1]);
}

/**
 * The declarations of one stylesheet, each with the selector it sits under. Nested blocks (a media
 * query around a rule) carry both preludes, innermost last, which is what a reader needs to find it.
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
    const fallback = match[2] === undefined ? null : match[2].trim();
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

/** A token a component may paint text with: the derived families and nothing else. */
function textToken(name: string): boolean {
    return name.endsWith('-txt') || name.startsWith('--on-');
}

/** A token a component may fill with: a surface, a hue, or a hue's tint. */
function fillToken(name: string): boolean {
    if (SURFACES.includes(name)) return true;
    return name.startsWith('--c-') && !textToken(name);
}

function allowedColour(value: string, set: Record<string, string[]>): boolean {
    const text = value.trim().toLowerCase();
    if (text === 'inherit' || text === 'currentcolor' || NEUTRAL.includes(text)) return true;
    const found = variable(value);
    if (found === null) return false;
    const own = set[found.name];
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
    const own = set[found.name];
    if (own !== undefined) return own.every((assigned) => allowedFill(assigned, set));
    if (!fillToken(found.name)) return false;
    return found.fallback === null || allowedFill(found.fallback, set);
}

function svelteFiles(root: string, prefix = ''): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) found.push(...svelteFiles(root, rel));
        else if (entry.name.endsWith('.svelte')) found.push(rel);
    }
    return found;
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
 * The one pair the rule allows that tests/contrast.test.ts does not walk: an `--on-<surface>` on the
 * surface it is named after, which is what a ToolButton in force paints. That test measures only the
 * `--on-c-<hue>` half of the `--on-` family, so this measures the other half here rather than
 * editing it. It fails if a theme is ever given a surface no black and no white reads on.
 */
describe('the surfaces a component may fill and paint on', () => {
    const THEMES_DIR = resolve(SRC, 'lib', 'themes');
    const blocks = parseBlocks(
        `${readFileSync(join(THEMES_DIR, 'tokens.css'), 'utf8')}\n${readFileSync(join(THEMES_DIR, 'themes.css'), 'utf8')}`
    );
    setAppearance(loadConfig(engineDir()).config);
    const names = themes().map((entry) => entry.name);

    it('keeps every --on-<surface> on its surface at 4.5:1, under every theme', () => {
        const failures: string[] = [];
        let measured = 0;
        for (const name of names) {
            const theme = resolveTheme(blocks, themeClass(name));
            const all: Record<string, string> = { ...theme, ...deriveTokens(theme) };
            for (const surface of SURFACES) {
                const on = `--on-${surface.slice(2)}`;
                if (all[on] === undefined || all[surface] === undefined) continue;
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
        const dir = mkdtempSync(join(tmpdir(), 'oculus-colours-'));
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);

        const write = (rel: string, body: string) => {
            const full = join(dir, rel);
            expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        };

        write(
            'ui/Good.svelte',
            [
                '<span class="a" style="--tone: var(--c-teal)"></span>',
                '<style>',
                '    .a { color: var(--c-teal-txt); background: var(--tone); }',
                '    .b { color: var(--on-c-teal); background: var(--c-teal); }',
                '    .c { color: inherit; background: none; border: 1px solid var(--line); }',
                '    .d::before { content: "["; }',
                '</style>'
            ].join('\n')
        );
        write('ui/Hex.svelte', '<style>\n    .a { color: #ff0000; }\n</style>');
        write('ui/Named.svelte', '<style>\n    .a { border-color: rebeccapurple; }\n</style>');
        write('ui/Hue.svelte', '<style>\n    .a { color: var(--c-teal); }\n</style>');
        write('ui/Unset.svelte', '<style>\n    .a { background: var(--nonesuch); }\n</style>');
        write(
            'ui/Indirect.svelte',
            '<span style="--tone: #ff0000"></span>\n<style>\n    .a { background: var(--tone); }\n</style>'
        );
        write('ui/Inline.svelte', '<span style="color: #00ff00"></span>');

        expect(findColourViolations(dir, ['ui'])).toEqual([
            'ui/Hex.svelte: .a: color: #ff0000 (raw colour)',
            'ui/Hue.svelte: .a: color: var(--c-teal) (not a -txt or --on- token)',
            'ui/Indirect.svelte: .a: background: var(--tone) (not a surface or a hue)',
            'ui/Indirect.svelte: style attribute: --tone: #ff0000 (raw colour)',
            'ui/Inline.svelte: style attribute: color: #00ff00 (raw colour)',
            'ui/Named.svelte: .a: border-color: rebeccapurple (raw colour)',
            'ui/Unset.svelte: .a: background: var(--nonesuch) (not a surface or a hue)'
        ]);
    });
});
