// Layer 2, client state. The config's colours as tones. A tone is the hue part of a palette token:
// the config says a status is `#7c5cff`, `palette:` says that hex is the token `c-violet`, and the
// tone is `violet`, which a component turns into `--c-violet`, `--c-violet-txt` and
// `--on-c-violet`. Nothing outside this module reads a hex, so no component carries one.
//
// The maps are installed the way the text catalog and the glyph vocabulary are: the server ships
// them as the page's data at first load, and every later edit of config/catalogs/vocab.yml arrives
// on the `config` channel. Every lookup is pure over what was last installed and reads the
// configuration's generation, state/shared/words/generation.svelte.ts, so a component calling one
// during its first render gets the page's data and draws again when a push replaces it.
//
// A name is looked up among the record's own keys, so a name every object has, such as
// `constructor`, finds nothing.

import { z } from 'zod';
import { byKey, scalar } from '../../../data/helpers/guards.ts';
import { mapOfShape, readAs, rowsShape } from '../../../data/shapes/shapes.ts';
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

/** A value that is a string. */
const hexShape = z.string();

/** A record holding its string at `color`, read as that string. */
const colorShape = z.object({ color: z.string() }).transform((row) => row.color);

/** A record holding its string at `label`, read as that string. */
const labelShape = z.object({ label: z.string() }).transform((row) => row.label);

/**
 * A map of lower-cased name to string, from a map whose values `value` reads: the string itself, or
 * the string a record holds. It reads the hexes of `palette` and `type_color`, and the `color` and
 * the `label` of a `domains` entry, which are the same shape read twice. A value `value` refuses
 * leaves its name out.
 */
function stringMap(node: unknown, value: z.ZodType<string>): Record<string, string> {
    const held = readAs(mapOfShape(value), node) ?? {};
    return Object.fromEntries(
        Object.entries(held)
            .map(([name, one]) => [name.toLowerCase(), one] as const)
            .filter(([name]) => name !== '__proto__')
    );
}

/** One row of `status_legend`: the key, and the icon and label the row may leave out. */
const legendRowShape = z
    .object({
        key: z.string(),
        icon: z.string().catch(''),
        label: z.string().optional().catch(undefined)
    })
    .transform((row): Legend => ({ key: row.key, icon: row.icon, label: row.label ?? row.key }));

/** The rows of `status_legend` that are rows, in order. */
const legendRowsShape = rowsShape(legendRowShape);

/**
 * Install the vocabulary from the merged config: `palette` (hex to token name), `status_palette`
 * and `type_color` (a name to a hex), `status_legend` (the chips) and `domains` (the research
 * domains). A key the config does not hold installs as empty, so every lookup answers with its
 * unknown case rather than throwing: a half-read config still renders a page.
 */
export function setVocab(config: Record<string, unknown>): void {
    palette = stringMap(config.palette, hexShape);
    statusPalette = stringMap(config.status_palette, colorShape);
    typeColor = stringMap(config.type_color, hexShape);
    domainColor = stringMap(config.domains, colorShape);
    domainText = stringMap(config.domains, labelShape);
    dataAccess = stringMap(config.data_access, hexShape);
    legend = Object.fromEntries(
        (readAs(legendRowsShape, config.status_legend) ?? [])
            .filter((row) => row.key !== '__proto__')
            .map((row) => [row.key, row])
    );
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
    const token = byKey(palette, scalar(hex).trim().toLowerCase());
    if (!token?.startsWith('c-')) return undefined;
    const tone = token.slice('c-'.length);
    return TONE.test(tone) ? tone : undefined;
}

/** The dataset access colour from `data_access`, with an unknown value kept neutral. */
export function dataAccessTone(access: unknown): string {
    configGeneration();
    const hex = byKey(dataAccess, scalar(access).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a collection entry's status, through `status_palette`. */
export function statusTone(status: unknown): string {
    configGeneration();
    const hex = byKey(statusPalette, scalar(status).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a project type, through `type_color`. */
export function typeTone(type: unknown): string {
    configGeneration();
    const hex = byKey(typeColor, scalar(type).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/**
 * The entry of `map` a domain names: the domain as written, else the word after its first colon,
 * since the portfolio gives a second hub's domain that hub's key and a colon
 * (data/snapshot/hubs/merge.ts) and the vocabulary names the word alone.
 */
function domainEntry(map: Record<string, string | undefined>, domain: unknown): string | undefined {
    const text = scalar(domain).toLowerCase();
    const colon = text.indexOf(':');
    return byKey(map, text) ?? (colon < 0 ? undefined : byKey(map, text.slice(colon + 1)));
}

/** The tone of a research domain, through `domains`. */
export function domainTone(domain: unknown): string {
    configGeneration();
    const hex = domainEntry(domainColor, domain);
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
    return domainEntry(domainText, domain) ?? scalar(domain);
}

/** The glyph name a status chip carries, and nothing for a chip the legend does not list. */
export function chipGlyphName(chip: string): string {
    configGeneration();
    return byKey(legend, chip)?.icon ?? '';
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
    if (byKey(statusPalette, chip.toLowerCase()) !== undefined) return statusTone(chip);
    return byKey(ICON_HUES, byKey(legend, chip)?.icon ?? '') ?? UNKNOWN_TONE;
}

/** A status chip's words, and the chip's own key for one the legend does not list. */
export function chipLabel(chip: string): string {
    configGeneration();
    return byKey(legend, chip)?.label ?? chip;
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
