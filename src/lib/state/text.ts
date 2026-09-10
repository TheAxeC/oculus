// Layer 2, client state. The text catalog and the glyph vocabulary as the page received them, and
// the lookups every component uses. Nothing here touches the filesystem: the server reads
// config/text.yml and config/glyphs.yml, ships them as the page's data, and O6's watcher pushes
// later edits over the socket. The browser never fetches the YAML itself.

let catalog: Record<string, string> = {};
let glyphs: Record<string, string> = {};

/** Install the catalog the page was given. Called once per load, again on every push. */
export function setCatalog(next: Record<string, string>): void {
    catalog = next;
}

/** Install the glyph vocabulary the page was given, the `glyphs:` map of config/glyphs.yml. */
export function setGlyphs(next: Record<string, string>): void {
    glyphs = next;
}

/**
 * The catalog entry for a dotted key, with no interpolation. It exists for the keys that are named
 * by data rather than by a call site: the theme names listed in `js.theme.order` and the label and
 * glyph keys a view hands the registry. tests/keys.test.ts can only check a literal key, so those
 * two families are checked instead by tests/views/registry.test.ts and tests/state/ui.test.ts, and
 * this throws on a missing key exactly as t() does.
 */
export function lookup(key: string): string {
    const value = catalog[key];
    if (value === undefined) throw new Error(`text key not in config/text.yml: ${key}`);
    return value;
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
 * The glyph character a name stands for. A missing name throws like a missing text key: a glyph that
 * silently renders as nothing is a hole in a rail or a tab strip that nobody notices.
 */
export function glyph(name: string): string {
    const character = glyphs[name];
    if (character === undefined) throw new Error(`glyph not in config/glyphs.yml: ${name}`);
    return character;
}

/** The theme names, in the order the picker lists them. */
export function themeOrder(): string[] {
    return lookup('js.theme.order')
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
}

/** A theme's label in the picker. */
export function themeLabel(name: string): string {
    return lookup(`js.theme.label_${name}`);
}

/** The body class string a theme lands on the document as. The light theme's is empty. */
export function themeClass(name: string): string {
    return lookup(`js.theme.class_${name}`);
}
