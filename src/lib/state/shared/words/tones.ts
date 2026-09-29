// Layer 2, client state. The config's colours as tones. A tone is the hue part of a palette token:
// the config says a status is `#7c5cff`, `palette:` says that hex is the token `c-violet`, and the
// tone is `violet`, which a component turns into `--c-violet`, `--c-violet-txt` and
// `--on-c-violet`. Nothing outside this module reads a hex, so no component carries one and the
// colour gate in tests/ui/theme/colours.test.ts can insist on that.
//
// The maps are installed the way the text catalog and the glyph vocabulary are: the server ships
// them as the page's data at first load, and every later edit of config/catalogs/vocab.yml arrives
// on the `config` channel. Every lookup is pure over what was last installed and reads the
// configuration's generation, state/shared/words/generation.svelte.ts, so a component calling one
// during its first render gets the page's data and draws again when a push replaces it.
//
// A parsed value is taken for a map by data/helpers/guards.ts's `isMap`.

import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { configGeneration } from './generation.svelte.ts';

/** The tone anything unknown gets: a hue every theme defines and nothing means. */
export const UNKNOWN_TONE = 'grey';

/** A tone is a CSS custom-property name fragment, so it may hold nothing else. */
const TONE = /^[a-z][a-z0-9-]*$/;

/** One row of `status_legend`: the chip's key, glyph name and words. */
type Legend = { key: string; icon: string; label: string };

/** The palette hex is written in either case in the config, and matched in lower case here. */
let palette: Record<string, string | undefined> = {};
let statusPalette: Record<string, string | undefined> = {};
let typeColor: Record<string, string | undefined> = {};
let legend: Record<string, Legend | undefined> = {};
let domainColor: Record<string, string | undefined> = {};
let domainText: Record<string, string | undefined> = {};
let dataAccess: Record<string, string | undefined> = {};

/** The string at `key` of a record, or nothing. */
function stringAt(node: unknown, key: string): string | undefined {
    if (!isMap(node)) return undefined;
    const value = node[key];
    return typeof value === 'string' ? value : undefined;
}

/**
 * A map of name to string, from a map whose values are either that string (`key` null) or a record
 * holding it at `key`. It reads the hexes of `palette` and `type_color`, and the `color` and the
 * `label` of a `domains` entry, which are the same shape read twice.
 */
function stringMap(node: unknown, key: string | null): Record<string, string> {
    const map: Record<string, string> = {};
    if (!isMap(node)) return map;
    for (const [name, value] of Object.entries(node)) {
        const hex =
            key === null ? (typeof value === 'string' ? value : undefined) : stringAt(value, key);
        if (hex !== undefined) map[name.toLowerCase()] = hex;
    }
    return map;
}

/**
 * Install the vocabulary from the merged config: `palette` (hex to token name), `status_palette`
 * and `type_color` (a name to a hex), `status_legend` (the chips) and `domains` (the research
 * domains). A key the config does not hold installs as empty, so every lookup answers with its
 * unknown case rather than throwing: a half-read config still renders a page.
 */
export function setVocab(config: Record<string, unknown>): void {
    palette = stringMap(config.palette, null);
    statusPalette = stringMap(config.status_palette, 'color');
    typeColor = stringMap(config.type_color, null);
    domainColor = stringMap(config.domains, 'color');
    domainText = stringMap(config.domains, 'label');
    dataAccess = stringMap(config.data_access, null);

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
 * A token that is not a hue (`muted`) and a hex the palette does not list are both the unknown
 * tone, since a tone must name a `--c-<tone>` the stylesheets define.
 */
export function toneOf(hex: string): string {
    return paletteTone(hex) ?? UNKNOWN_TONE;
}

/**
 * A hue named directly, as `focus_lane_tones` names one, when the palette holds that hue's token,
 * and the unknown tone otherwise: a name no stylesheet defines would draw `--c-<name>` as nothing,
 * and an empty one as `--c-`.
 */
export function namedTone(name: unknown): string {
    configGeneration();
    const tone = scalar(name).trim();
    if (!TONE.test(tone)) return UNKNOWN_TONE;
    return Object.values(palette).includes(`c-${tone}`) ? tone : UNKNOWN_TONE;
}

/** A palette hue, or undefined when the value has no usable palette token. */
export function paletteTone(hex: unknown): string | undefined {
    configGeneration();
    const token = palette[scalar(hex).trim().toLowerCase()];
    if (!token?.startsWith('c-')) return undefined;
    const tone = token.slice('c-'.length);
    return TONE.test(tone) ? tone : undefined;
}

/** The dataset access colour from `data_access`, with an unknown value kept neutral. */
export function dataAccessTone(access: unknown): string {
    configGeneration();
    const hex = dataAccess[scalar(access).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a collection entry's status, through `status_palette`. */
export function statusTone(status: unknown): string {
    configGeneration();
    const hex = statusPalette[scalar(status).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a project type, through `type_color`. */
export function typeTone(type: unknown): string {
    configGeneration();
    const hex = typeColor[scalar(type).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a research domain, through `domains`. */
export function domainTone(domain: unknown): string {
    configGeneration();
    const hex = domainColor[scalar(domain).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/**
 * A research domain's words, the `label` of its `domains` entry ("Cardiology | ECG"), and the
 * domain's own key for one the config does not list. This is the label a project card carries; a UI
 * theme's name in the picker is themeLabel() of state/shared/words/appearance.ts, which is another
 * thing.
 */
export function domainLabel(domain: unknown): string {
    configGeneration();
    const text = scalar(domain);
    return domainText[text.toLowerCase()] ?? text;
}

/** The glyph name a status chip carries, and nothing for a chip the legend does not list. */
export function chipGlyphName(chip: string): string {
    configGeneration();
    return legend[chip]?.icon ?? '';
}

/**
 * The hue a status legend icon carries in its name: the coloured dots and squares of the legend
 * are named by their colour, and a line icon is the same shape for all of them, so the name is
 * where the colour is kept. A name that is not a colour carries none.
 */
const ICON_HUES: Record<string, string> = {
    red: 'red',
    purple: 'purple',
    green: 'green',
    brown: 'amber',
    yellow: 'gold',
    blue: 'blue',
    orange: 'orange',
    white: 'grey',
    black: 'slate',
    orange_square: 'orange',
    green_square: 'green'
};

/**
 * The hue a status mark is drawn in: the status palette's tone when the palette names the status,
 * and otherwise the colour its legend icon is named by, so a mark drawn as a line icon keeps the
 * colour its dot had. The unknown tone for a status the legend does not list.
 */
export function statusMarkTone(chip: string): string {
    configGeneration();
    if (statusPalette[chip.toLowerCase()] !== undefined) return statusTone(chip);
    return ICON_HUES[legend[chip]?.icon ?? ''] ?? UNKNOWN_TONE;
}

/** A status chip's words, and the chip's own key for one the legend does not list. */
export function chipLabel(chip: string): string {
    configGeneration();
    return legend[chip]?.label ?? chip;
}

/** Every chip the legend lists, in the config's order. */
export function chipKeys(): string[] {
    configGeneration();
    return Object.keys(legend);
}

/**
 * The hue a chip of the vocabulary wears: its project type's, and its status's where no type has
 * one. The two maps cover different halves of the vocabulary, and taking both is what gives the
 * gallery's row its spread of hues instead of a wall of grey.
 */
export function chipTone(key: string): string {
    const type = typeTone(key);
    return type === UNKNOWN_TONE ? statusTone(key) : type;
}

/**
 * One row per hue the given chips wear, in the order the hues first occur: the hue, the first chip
 * that wears it, and how many do.
 */
export function chipsByTone(
    keys: readonly string[]
): { tone: string; key: string; count: number }[] {
    const byTone = new Map<string, { tone: string; key: string; count: number }>();
    for (const key of keys) {
        const tone = chipTone(key);
        const held = byTone.get(tone);
        if (held === undefined) byTone.set(tone, { tone, key, count: 1 });
        else held.count += 1;
    }
    return [...byTone.values()];
}
