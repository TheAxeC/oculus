// Layer 2, client state. The config's colours as tones. A tone is the hue part of a palette token:
// the config says a status is `#7c5cff`, `palette:` says that hex is the token `c-violet`, and the
// tone is `violet`, which a component turns into `--c-violet`, `--c-violet-txt` and `--on-c-violet`.
// Nothing outside this module reads a hex, so no component carries one and the colour gate in
// tests/ui/colours.test.ts can insist on that.
//
// The maps are installed the way the text catalog and the glyph vocabulary are: the server ships
// them as the page's data at first load, and every later edit of config/vocab.yml arrives on the
// `config` channel. Every lookup is pure over what was last installed, so a component calling one
// during its first render gets the page's data and re-renders when a push replaces it.

/** The tone anything unknown gets: a hue every theme defines and nothing means. */
export const UNKNOWN_TONE = 'grey';

/** A tone is a CSS custom-property name fragment, so it may hold nothing else. */
const TONE = /^[a-z][a-z0-9-]*$/;

/** One row of `status_legend`: the chip's key, the character it is drawn with, and its words. */
type Legend = { key: string; icon: string; label: string };

/** The palette hex is written in either case in the config, and matched in lower case here. */
let palette: Record<string, string> = {};
let statusPalette: Record<string, string> = {};
let typeColor: Record<string, string> = {};
let legend: Record<string, Legend> = {};
let themeColor: Record<string, string> = {};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The string at `key` of a record, or nothing. */
function stringAt(node: unknown, key: string): string | undefined {
    if (!isRecord(node)) return undefined;
    const value = node[key];
    return typeof value === 'string' ? value : undefined;
}

/** A map of name to hex, from a map whose values are either a hex or a record holding one. */
function colourMap(node: unknown, key: string | null): Record<string, string> {
    const map: Record<string, string> = {};
    if (!isRecord(node)) return map;
    for (const [name, value] of Object.entries(node)) {
        const hex =
            key === null ? (typeof value === 'string' ? value : undefined) : stringAt(value, key);
        if (hex !== undefined) map[name.toLowerCase()] = hex;
    }
    return map;
}

/**
 * Install the vocabulary from the merged config: `palette` (hex to token name), `status_palette`
 * and `type_color` (a name to a hex), `status_legend` (the chips) and `themes` (the research
 * themes). A key the config does not hold installs as empty, so every lookup answers with its
 * unknown case rather than throwing: a half-read config still renders a page.
 */
export function setVocab(config: Record<string, unknown>): void {
    palette = colourMap(config.palette, null);
    statusPalette = colourMap(config.status_palette, 'color');
    typeColor = colourMap(config.type_color, null);
    themeColor = colourMap(config.themes, 'color');

    legend = {};
    const rows = config.status_legend;
    if (Array.isArray(rows)) {
        for (const row of rows) {
            const key = stringAt(row, 'key');
            if (key === undefined) continue;
            legend[key] = {
                key,
                icon: stringAt(row, 'icon') ?? '',
                label: stringAt(row, 'label') ?? key
            };
        }
    }
}

/**
 * The tone a hex is written as. `palette:` maps it to a token name; a `c-` token's hue is the tone.
 * A token that is not a hue (`muted`) and a hex the palette does not list are both the unknown tone,
 * since a tone must name a `--c-<tone>` the stylesheets define.
 */
export function toneOf(hex: string): string {
    const token = palette[String(hex).trim().toLowerCase()];
    if (token === undefined || !token.startsWith('c-')) return UNKNOWN_TONE;
    const tone = token.slice('c-'.length);
    return TONE.test(tone) ? tone : UNKNOWN_TONE;
}

/** The tone of a collection entry's status, through `status_palette`. */
export function statusTone(status: string): string {
    const hex = statusPalette[String(status).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a project type, through `type_color`. */
export function typeTone(type: string): string {
    const hex = typeColor[String(type).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a research theme, through `themes`. */
export function themeTone(theme: string): string {
    const hex = themeColor[String(theme).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The character a status chip is drawn with, and nothing for a chip the legend does not list. */
export function chipGlyph(chip: string): string {
    return legend[chip]?.icon ?? '';
}

/** A status chip's words, and the chip's own key for one the legend does not list. */
export function chipLabel(chip: string): string {
    return legend[chip]?.label ?? chip;
}

/** Every chip the legend lists, in the config's order. */
export function chipKeys(): string[] {
    return Object.keys(legend);
}
