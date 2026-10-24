// Layer 2, client state. The config's colours as tones. A tone is the hue part of a palette token:
// the config says a status is `#7c5cff`, `palette:` says that hex is the token `c-violet`, and the
// tone is `violet`, which a component turns into `--c-violet`, `--c-violet-txt` and
// `--on-c-violet`. Nothing outside this module reads a hex, so no component carries one.
//
// The maps are installed the way the text catalog and the glyph vocabulary are: the server ships
// them as the page's data at first load, and every later edit of config/catalogs/vocab.yml arrives
// on the `config` channel. The research domains are each hub's own: a record of a hub is drawn with
// the `domains` of that hub, found from the hub name in front of its domain, and a domain its hub
// does not list is drawn as an unlisted domain, never with another hub's entry. Every lookup is
// pure over what was last installed and reads the configuration's generation,
// state/shared/words/generation.svelte.ts, so a component calling one during its first render gets
// the page's data and draws again when a push replaces it.
//
// A name is looked up among the record's own keys, so a name every object has, such as
// `constructor`, finds nothing.

import { z } from 'zod';
import type { HubVocabs } from '../../../data/model/index.ts';
import { byKey, scalar } from '../../../data/helpers/guards.ts';
import { splitHubId } from '../../../data/helpers/hub-names.ts';
import { mapOfShape, mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { configGeneration } from './generation.svelte.ts';

/** The tone anything unknown gets: a hue every theme defines and nothing means. */
export const UNKNOWN_TONE = 'grey';

/** A tone is a CSS custom-property name fragment, so it may hold nothing else. */
const TONE = /^[a-z][a-z0-9-]*$/;

/** One word of the legend, a stage, a form or a chip: the word, its glyph name and its words. */
type Legend = { key: string; icon: string; label: string };

/** The three lists of the words a project shows, in the order the legend reads them. */
const LISTS = ['stages', 'forms', 'chips'] as const;

/** One of the three lists of the words a project shows. */
export type LegendList = (typeof LISTS)[number];

/**
 * The installed legend: every word of the three lists by its key, and each list that holds a word
 * with its words in the config's order.
 */
type Installed = {
    words: Record<string, Legend | undefined>;
    lists: { list: LegendList; keys: string[] }[];
};

/** The palette hex is written in either case in the config, and matched in lower case here. */
let palette: Record<string, string | undefined> = {};
let statusPalette: Record<string, string | undefined> = {};
let stageColor: Record<string, string | undefined> = {};
let legend: Installed = { words: {}, lists: [] };
let domainColor: Record<string, Record<string, string | undefined> | undefined> = {};
let domainText: Record<string, Record<string, string | undefined> | undefined> = {};
let dataAccess: Record<string, string | undefined> = {};

/** A value that is a string. */
const hexShape = z.string();

/** A record holding its string at `color`, read as that string. */
const colorShape = z.object({ color: z.string() }).transform((row) => row.color);

/** A record holding its string at `label`, read as that string. */
const labelShape = z.object({ label: z.string() }).transform((row) => row.label);

/**
 * A map of lower-cased name to string, from a map whose values `value` reads: the string itself, or
 * the string a record holds. It reads the hexes of `palette` and `data_access`, the `color` of a
 * word of `statuses` and `stages`, and the `color` and the `label` of a `domains` entry. A value
 * `value` refuses leaves its name out.
 */
function stringMap(node: unknown, value: z.ZodType<string>): Record<string, string> {
    const held = readAs(mapOfShape(value), node) ?? {};
    return Object.fromEntries(
        Object.entries(held)
            .map(([name, one]) => [name.toLowerCase(), one] as const)
            .filter(([name]) => name !== '__proto__')
    );
}

/** A word of `stages`, `forms` or `chips`: the icon and the label it may leave out. */
const legendRowShape = z.object({
    icon: z.string().catch(''),
    label: z.string().optional().catch(undefined)
});

/**
 * The words of one of `stages`, `forms` and `chips`, in order, each drawn with its `label`, or the
 * word itself when the row holds no label as text, and its `icon`, none when it holds no text. A
 * row that is not a map, and the key `__proto__`, are left out.
 */
function legendRows(value: unknown): Legend[] {
    const map = readAs(mapShape, value) ?? {};
    return Object.entries(map).flatMap(([key, row]) => {
        const held = key === '__proto__' ? null : readAs(legendRowShape, row);
        return held === null ? [] : [{ key, icon: held.icon, label: held.label ?? key }];
    });
}

/**
 * Install the vocabulary from the merged config: `palette` (hex to token name), the `color` of the
 * words of `statuses` and `stages`, the legend of the words a project shows (its stage of
 * `stages`, its form of `forms` and its chips of `chips`, a word of a later list taking the place
 * of one of an earlier list among the words, and each list's words kept in the config's order),
 * and from `hubs` the research `domains` of every hub of the workspace, read from each hub's
 * domains registry, each under its hub's name; a domain with no colour wears the neutral tone. A
 * key the config does not hold installs as empty, so every lookup answers with its unknown case
 * rather than throwing: a half-read config still renders a page.
 */
export function setVocab(config: Record<string, unknown>, hubs: HubVocabs): void {
    palette = stringMap(config.palette, hexShape);
    statusPalette = stringMap(config.statuses, colorShape);
    stageColor = stringMap(config.stages, colorShape);
    domainColor = {};
    domainText = {};
    for (const [name, vocab] of Object.entries(hubs.lists)) {
        if (name === '' || name === '__proto__') continue;
        domainColor[name] = stringMap(vocab.domains, colorShape);
        domainText[name] = stringMap(vocab.domains, labelShape);
    }
    dataAccess = stringMap(config.data_access, hexShape);
    const lists = LISTS.map((list) => ({ list, rows: legendRows(config[list]) }));
    legend = {
        words: Object.fromEntries(lists.flatMap((one) => one.rows).map((row) => [row.key, row])),
        lists: lists
            .filter((one) => one.rows.length > 0)
            .map((one) => ({ list: one.list, keys: one.rows.map((row) => row.key) }))
    };
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

/** The tone of a collection entry's status, through the `color` of its word of `statuses`. */
export function statusTone(status: unknown): string {
    configGeneration();
    const hex = byKey(statusPalette, scalar(status).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/** The tone of a project's stage, through the `color` of its word of `stages`. */
export function stageTone(stage: unknown): string {
    configGeneration();
    const hex = byKey(stageColor, scalar(stage).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/**
 * A domain's key and the entry of `maps` it names: the domain's id is its hub and its key
 * (data/snapshot/hubs/merge.ts), and the entry is the key's in the `domains` of that hub. A hub the
 * maps do not hold, and a key its hub does not list, have no entry.
 */
function domainEntry(
    maps: Record<string, Record<string, string | undefined> | undefined>,
    domain: unknown
): { key: string; entry: string | undefined } {
    const { root, id } = splitHubId(scalar(domain), Object.keys(maps));
    const own = byKey(maps, root);
    return { key: id, entry: own === undefined ? undefined : byKey(own, id.toLowerCase()) };
}

/** The tone of a research domain, through `domains`. */
export function domainTone(domain: unknown): string {
    configGeneration();
    const hex = domainEntry(domainColor, domain).entry;
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex);
}

/**
 * A research domain's words, the `label` of its `domains` entry ("Cardiology | ECG"), which is the
 * `title` of its entry in the hub's domains registry, and the domain's key for one the registry
 * does not list. This is the label a project card carries; a UI theme's name in the theme list is
 * themeLabel() of state/shared/words/appearance.ts, which is another thing.
 */
export function domainLabel(domain: unknown): string {
    configGeneration();
    const named = domainEntry(domainText, domain);
    return named.entry ?? named.key;
}

/**
 * The glyph name a stage, a form or a chip carries, and nothing for a word the legend does not
 * list or one whose row names no icon.
 */
export function chipGlyphName(chip: string): string {
    configGeneration();
    return byKey(legend.words, chip)?.icon ?? '';
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
    orange_square: 'orange'
};

/**
 * The hue a status mark is drawn in: the tone of its word's `color` of `stages` when the word is a
 * stage with one, and otherwise the colour its legend icon is named by, so a mark drawn as a line
 * icon keeps the colour its dot had. The unknown tone for a word neither gives a colour.
 */
export function statusMarkTone(word: string): string {
    configGeneration();
    if (byKey(stageColor, word.toLowerCase()) !== undefined) return stageTone(word);
    return byKey(ICON_HUES, byKey(legend.words, word)?.icon ?? '') ?? UNKNOWN_TONE;
}

/**
 * The words of a stage, a form or a chip, its row's `label`, and the word itself for one the legend
 * does not list.
 */
export function chipLabel(chip: string): string {
    configGeneration();
    return byKey(legend.words, chip)?.label ?? chip;
}

/**
 * The words a project's status marks draw on a lane card and in the board's list, in order: its
 * stage when the stage's word of `stages` has a glyph, then its form and its chips. Every stage of
 * oculus's own vocab.yml has a glyph; a stage without one, in a hub that names such a stage, gives
 * no mark. A board card draws every stage as its filled chip.
 */
export function projectStatusWords(
    stage: string | undefined,
    form: string | undefined,
    chips: readonly string[]
): string[] {
    const marked = stage !== undefined && chipGlyphName(stage) !== '' ? [stage] : [];
    return [...marked, ...(form === undefined ? [] : [form]), ...chips];
}

/** Every word the legend lists: the stages, the forms, then the chips, in the config's order. */
export function chipKeys(): string[] {
    configGeneration();
    return Object.keys(legend.words);
}

/**
 * The words of each of `stages`, `forms` and `chips`, in that order, each list with its words in
 * the config's order, so a word of two lists is in both. A list that holds no word is left out.
 */
export function legendLists(): { list: LegendList; keys: string[] }[] {
    configGeneration();
    return legend.lists.map((one) => ({ list: one.list, keys: [...one.keys] }));
}

/**
 * The hue a word of the vocabulary wears: its stage's, and its status's where no stage has one. The
 * two maps cover different halves of the vocabulary, and taking both is what gives the gallery's
 * row its spread of hues instead of a wall of grey.
 */
export function chipTone(key: string): string {
    const stage = stageTone(key);
    return stage === UNKNOWN_TONE ? statusTone(key) : stage;
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
