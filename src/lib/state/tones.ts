// Layer 2, client state. The config's colours as tones. A tone is the hue part of a palette token:
// the config says a status is `#7c5cff`, `palette:` says that hex is the token `c-violet`, and the
// tone is `violet`, which a component turns into `--c-violet`, `--c-violet-txt` and `--on-c-violet`.
// Nothing outside this module reads a hex, so no component carries one and the colour gate in
// tests/ui/colours.test.ts can insist on that.
//
// The maps are installed the way the text catalog and the glyph vocabulary are: the server ships
// them as the page's data at first load, and every later edit of config/vocab.yml arrives on the
// `config` channel. Every lookup is pure over what was last installed and reads the configuration's
// generation, state/generation.svelte.ts, so a component calling one during its first render gets
// the page's data and draws again when a push replaces it.

import { configGeneration } from './generation.svelte.ts';
import { glyph } from './text.ts';

/** The tone anything unknown gets: a hue every theme defines and nothing means. */
export const UNKNOWN_TONE = 'grey';

/** A tone is a CSS custom-property name fragment, so it may hold nothing else. */
const TONE = /^[a-z][a-z0-9-]*$/;

/** One row of `status_legend`: the chip's key, glyph name and words. */
type Legend = { key: string; icon: string; label: string };

/** The palette hex is written in either case in the config, and matched in lower case here. */
let palette: Record<string, string> = {};
let statusPalette: Record<string, string> = {};
let typeColor: Record<string, string> = {};
let legend: Record<string, Legend> = {};
let domainColor: Record<string, string> = {};
let domainText: Record<string, string> = {};
let dataAccess: Record<string, string> = {};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The string at `key` of a record, or nothing. */
function stringAt(node: unknown, key: string): string | undefined {
    if (!isRecord(node)) return undefined;
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
 * A token that is not a hue (`muted`) and a hex the palette does not list are both the unknown tone,
 * since a tone must name a `--c-<tone>` the stylesheets define.
 */
export function toneOf(hex: string): string {
    return paletteTone(hex) ?? UNKNOWN_TONE;
}

/** A palette hue, or undefined when the value has no usable palette token. */
export function paletteTone(hex: string): string | undefined {
    configGeneration();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- the hex is a colour field of the config or a registry entry, which YAML may parse as a number
    const token = palette[String(hex).trim().toLowerCase()];
    if (!token?.startsWith('c-')) return undefined;
    const tone = token.slice('c-'.length);
    return TONE.test(tone) ? tone : undefined;
}

/** The dataset access colour from `data_access`, with an unknown value kept neutral. */
export function dataAccessTone(access: string): string {
    configGeneration();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- the access is a dataset registry field, which YAML may parse as a number
    const hex = dataAccess[String(access).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a collection entry's status, through `status_palette`. */
export function statusTone(status: string): string {
    configGeneration();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- the status is a collection entry field, which YAML may parse as a number
    const hex = statusPalette[String(status).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a project type, through `type_color`. */
export function typeTone(type: string): string {
    configGeneration();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- the type is a manifest field, which YAML may parse as a number
    const hex = typeColor[String(type).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a research domain, through `domains`. */
export function domainTone(domain: string): string {
    configGeneration();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- the domain is a manifest field, which YAML may parse as a number
    const hex = domainColor[String(domain).toLowerCase()];
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/**
 * A research domain's words, the `label` of its `domains` entry ("Cardiology | ECG"), and the
 * domain's own key for one the config does not list. This is the label a project card carries; a UI
 * theme's name in the picker is themeLabel() of state/appearance.ts, which is another thing.
 */
export function domainLabel(domain: string): string {
    configGeneration();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- the domain is a manifest field, which YAML may parse as a number
    return domainText[String(domain).toLowerCase()] ?? domain;
}

/** The glyph name a status chip carries, and nothing for a chip the legend does not list. */
export function chipGlyphName(chip: string): string {
    configGeneration();
    return legend[chip]?.icon ?? '';
}

/** The active glyph character for a status chip, and nothing for an unlisted chip. */
export function chipGlyph(chip: string): string {
    const name = chipGlyphName(chip);
    return name === '' ? '' : glyph(name);
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
