// Layer 2, client state. The text catalog, the glyph vocabulary and its ASCII stand-ins as the page
// received them, and the lookups every component uses. Nothing here touches the filesystem: the
// server reads config/text.yml and config/glyphs.yml, ships them as the page's data, and O6's
// watcher pushes later edits over the socket. The browser never fetches the YAML itself.
//
// The ASCII mode is a lookup at the moment a glyph renders, not a pass over the document: a glyph
// reaches the DOM through ui/Glyph.svelte and a legend icon through ui/Chip.svelte's `icon`, so
// those two calls are the whole of it.

import { glyphMode } from './glyphmode.svelte.ts';

export { setGlyphMode, type GlyphMode } from './glyphmode.svelte.ts';

let catalog: Record<string, string> = {};
let glyphs: Record<string, string> = {};
let ascii: Record<string, string> = {};

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
 * rather than by the glyph's name, so it also covers an icon that came from data: a status chip's
 * own icon in config/vocab.yml, or an emoji somebody typed into a manifest.
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
export function lookup(key: string): string {
    const value = catalog[key];
    if (value === undefined) throw new Error(`text key not in config/text.yml: ${key}`);
    return value.replace(/\{G\.([a-zA-Z0-9_-]+)\}/g, (placeholder, name: string) => {
        return glyphs[name] ?? placeholder;
    });
}

/**
 * The string for a dotted key, with {0} and {1} replaced by the arguments.
 * A key that is not in the catalog throws, so a typo fails loudly instead of rendering blank.
 */
export function t(key: string, ...args: (string | number)[]): string {
    const template = lookup(key);
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const arg = args[Number(index)];
        return arg === undefined ? placeholder : String(arg);
    });
}

/**
 * The glyph character a name stands for, or its ASCII stand-in while the mode is `ascii`. A missing
 * name throws like a missing text key: a glyph that silently renders as nothing is a hole in a rail
 * or a tab strip that nobody notices. A character with no stand-in is drawn as it is.
 */
export function glyph(name: string): string {
    const character = glyphs[name];
    if (character === undefined) throw new Error(`glyph not in config/glyphs.yml: ${name}`);
    return asciiOf(character);
}

/**
 * The same swap for a character that came from data rather than from a name in config/glyphs.yml: a
 * status legend's `icon` through Chip. Unknown characters and every character while the mode is
 * `unicode` come back unchanged, so this is safe on any string.
 */
export function asciiOf(character: string): string {
    if (glyphMode() !== 'ascii') return character;
    return ascii[character] ?? character;
}
