// Layer 2, client state. The text catalog, glyph vocabulary and ASCII stand-ins received from the
// server, with the lookups components use. Nothing here touches the filesystem. Glyph tokens are
// resolved when a string renders, so changing display mode updates catalog and configuration text.
//
// The three maps are plain module variables, so every reader below first reads the configuration's
// generation, state/generation.svelte.ts: that is what a template's own effect depends on, and what
// makes a string drawn before a push redraw with the string the push installed.

import { configGeneration } from './generation.svelte.ts';
import { glyphMode } from './glyphmode.svelte.ts';

export { setGlyphMode, type GlyphMode } from './glyphmode.svelte.ts';

let catalog: Record<string, string | undefined> = {};
let glyphs: Record<string, string | undefined> = {};
let ascii: Record<string, string | undefined> = {};

/** Install the catalog the page was given. Called once per load, again on every push. */
export function setCatalog(next: Record<string, string>): void {
    catalog = next;
}

/** Install the glyph vocabulary the page was given, the `glyphs:` map of config/glyphs.yml. */
export function setGlyphs(next: Record<string, string>): void {
    glyphs = next;
}

/**
 * Install the ASCII stand-ins, the `ascii:` map of config/glyphs.yml. It is keyed by the character
 * rather than by the glyph's name, so one character shared by several names has one stand-in.
 */
export function setAscii(next: Record<string, string>): void {
    ascii = next;
}

/**
 * The catalog entry for a dotted key, with no interpolation. It exists for the keys that are named
 * by data rather than by a call site: the label and glyph keys a view hands the registry.
 * tests/keys.test.ts can only check a literal key, so that family is checked instead by
 * tests/views/registry.test.ts, and this throws on a missing key exactly as t() does.
 */
function catalogEntry(key: string): string {
    configGeneration();
    const value = catalog[key];
    if (value === undefined) {
        throw new Error(`text key not in the text catalog (config/text/): ${key}`);
    }
    return resolveGlyphTokens(value);
}

export function lookup(key: string): string {
    return catalogEntry(key);
}

/** Resolve every known {G.name} token through the active glyph mode and preserve unknown tokens. */
export function resolveGlyphTokens(value: string): string {
    configGeneration();
    return value.replace(/\{G\.([a-zA-Z0-9_-]+)\}/g, (placeholder, name: string) => {
        return glyphs[name] === undefined ? placeholder : glyph(name);
    });
}

/**
 * The string for a dotted key, with {0} and {1} replaced by the arguments.
 * A key that is not in the catalog throws, so a typo fails loudly instead of rendering blank.
 */
export function t(key: string, ...args: (string | number)[]): string {
    const template = catalogEntry(key);
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const arg = args.at(Number(index));
        return arg === undefined ? placeholder : String(arg);
    });
}

/**
 * The glyph character a name stands for, or its ASCII stand-in while the mode is `ascii`. A missing
 * name throws like a missing text key: a glyph that silently renders as nothing is a hole in a rail
 * or a tab strip that nobody notices. A character with no stand-in is drawn as it is.
 */
export function glyph(name: string): string {
    configGeneration();
    const character = glyphs[name];
    if (character === undefined) throw new Error(`glyph not in config/glyphs.yml: ${name}`);
    return asciiOf(character);
}

/**
 * The same swap for a character already resolved by a caller. Unknown characters and every
 * character while the mode is `unicode` come back unchanged, so this is safe on any string.
 */
export function asciiOf(character: string): string {
    configGeneration();
    if (glyphMode() !== 'ascii') return character;
    return ascii[character] ?? character;
}
