// Layer 2, client state. The text catalog, glyph vocabulary and icon drawings received from the
// server, with the lookups components use. Nothing here touches the filesystem.
//
// A glyph is drawn by ui/display/Glyph.svelte and nowhere else: as its line icon, or as its ASCII
// stand-in while the mode is `ascii`. No string of the catalog carries a glyph, so text is words
// and nothing here fills a glyph into it.
//
// The three maps are plain module variables, so every reader below first reads the configuration's
// generation, state/shared/words/generation.svelte.ts: that is what a template's own effect depends
// on, and what makes a string drawn before a push redraw with the string the push installed.

import { fillPlaceholders } from '../../../data/helpers/finding-text.ts';
import { configGeneration } from './generation.svelte.ts';
import { glyphMode } from './glyphmode.svelte.ts';

export { glyphMode, setGlyphMode, type GlyphMode } from './glyphmode.svelte.ts';

let catalog: Record<string, string | undefined> = {};
let glyphs: Record<string, string | undefined> = {};
let icons: Record<string, string | undefined> = {};

/** Install the catalog the page was given. Called once per load, again on every push. */
export function setCatalog(next: Record<string, string>): void {
    catalog = next;
}

/**
 * Install the glyph vocabulary the page was given, the `glyphs:` map of config/catalogs/glyphs.yml:
 * each name with its ASCII stand-in.
 */
export function setGlyphs(next: Record<string, string>): void {
    glyphs = next;
}

/**
 * Install the icon drawings the page was given, one SVG per glyph name, which the server read from
 * the icon package for every row of config/catalogs/icons.yml.
 */
export function setIcons(next: Record<string, string>): void {
    icons = next;
}

/**
 * The catalog entry for a dotted key, with no interpolation. It exists for the keys that are named
 * by data rather than by a call site: the label and glyph keys a view hands the registry.
 * tests/checks/source/keys.test.ts can only check a literal key, and this throws on a missing key
 * exactly as t() does.
 */
function catalogEntry(key: string): string {
    configGeneration();
    const value = catalog[key];
    if (value === undefined) {
        throw new Error(`text key not in the text catalog (config/text/): ${key}`);
    }
    return value;
}

export function lookup(key: string): string {
    return catalogEntry(key);
}

/** Whether the catalog holds a key, for the keys named by data that some data has no word for. */
export function hasText(key: string): boolean {
    configGeneration();
    return catalog[key] !== undefined;
}

/**
 * The string for a dotted key, with {0} and {1} replaced by the arguments.
 * A key that is not in the catalog throws, so a typo fails loudly instead of rendering blank.
 */
export function t(key: string, ...args: (string | number)[]): string {
    return fillPlaceholders(catalogEntry(key), args);
}

/**
 * The ASCII stand-in a glyph name has in config/catalogs/glyphs.yml, whatever the mode: what
 * ui/display/Glyph.svelte draws while the mode is `ascii`, and the only form of a glyph that may
 * go into text. A missing name throws like a missing text key: a glyph that silently renders as
 * nothing is a hole in a rail or a tab strip that nobody notices.
 */
export function glyph(name: string): string {
    configGeneration();
    // An own key only, so a name such as `constructor` is not answered by the object's prototype.
    const standIn = Object.hasOwn(glyphs, name) ? glyphs[name] : undefined;
    if (standIn === undefined) throw new Error(`glyph not in config/catalogs/glyphs.yml: ${name}`);
    return standIn;
}

/**
 * Whether the vocabulary holds a glyph name, for a caller handed a name by data it cannot trust to
 * be one: such a caller draws its words alone for a name this refuses, rather than a Glyph that
 * would throw.
 */
export function hasGlyph(name: string): boolean {
    configGeneration();
    return Object.hasOwn(glyphs, name) && glyphs[name] !== undefined;
}

/**
 * The icon a glyph name is drawn as, or nothing: while the mode is `ascii` there is no icon at all,
 * since a terminal theme draws the stand-in text, and a name the icon map does not carry has none,
 * which the server reports as a finding.
 */
export function iconSvg(name: string): string | undefined {
    configGeneration();
    if (glyphMode() === 'ascii') return undefined;
    return icons[name];
}

/**
 * Whether the vocabulary in force draws this name as a bracketed tag, which some ASCII stand-ins of
 * a terminal theme are and an icon never is. A caller that puts brackets of its own around a glyph
 * leaves them off such a one, so the reader is given one pair rather than two.
 */
export function bracketedGlyph(name: string): boolean {
    const drawn = glyph(name);
    if (glyphMode() !== 'ascii') return false;
    return drawn.startsWith('[') && drawn.endsWith(']');
}
