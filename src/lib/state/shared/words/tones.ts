// Layer 2, client state. The config's colours as tones, and the words of each hub's records. A tone
// is the hue part of a palette token: the config says a status is `#7c5cff`, `palette:` says that
// hex is the token `c-violet`, and the tone is `violet`, which a component turns into
// `--c-violet`, `--c-violet-txt` and `--on-c-violet`. Nothing outside this module reads a hex, so
// no component carries one.
//
// The words are installed the way the text catalog and the glyph vocabulary are: the server ships
// them as the page's data at first load, and every later edit of a hub's `.oculus/config.yml` or
// of config/catalogs/vocab.yml arrives on the `config` channel. Each hub's words are its own: the
// words of config/catalogs/vocab.yml with that hub's settings laid over them, and its research
// `domains`. A lookup is made with the name of the record's hub (`rootOf` of the record, or the hub
// in front of a domain's id) and reads that hub's words; a name the workspace holds no hub of, a
// folder that is no hub, reads oculus's own words. A lookup made with no hub, for a list drawn over
// the records of several hubs, reads the union of every hub's words: the primary's first, then each
// other hub's in the workspace's order, each word once with the row of the first hub that holds it
// (data/shapes/vocab-keys.ts, `unionWords`). A domain its hub does not list is drawn as an unlisted
// domain, never with another hub's entry. Every lookup is pure over what was last installed and
// reads the configuration's generation, state/shared/words/generation.svelte.ts, so a component
// calling one during its first render gets the page's data and draws again when a push replaces
// it.
//
// A name is looked up among the record's own keys, so a name every object has, such as
// `constructor`, finds nothing.

import { z } from 'zod';
import type { HubVocabs } from '../../../data/model/index.ts';
import { byKey, scalar } from '../../../data/helpers/guards.ts';
import { splitHubId } from '../../../data/helpers/hub-names.ts';
import { mapOfShape, mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { unionWords } from '../../../data/shapes/vocab-keys.ts';
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

/**
 * The words of one hub as the lookups read them: the palette (a hex in lower case to its token
 * name), the `color` of each word of `statuses` and `stages` and the hex of each word of
 * `data_access`, each by the word in lower case, the legend, the label of each word of `stages` by
 * the word as written, and the hub's words as the server sent them, which `vocabOf` gives.
 */
type Words = {
    palette: Record<string, string | undefined>;
    statuses: Record<string, string | undefined>;
    stages: Record<string, string | undefined>;
    legend: Installed;
    stageLabels: Record<string, string | undefined>;
    dataAccess: Record<string, string | undefined>;
    raw: Record<string, unknown>;
};

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
 * One hub's words as the lookups read them, from the words the server sent: `palette`, the `color`
 * of the words of `statuses` and `stages`, `data_access`, the legend of the words a project shows
 * (its stage of `stages`, its form of `forms` and its chips of `chips`, a word of a later list
 * taking the place of one of an earlier list among the words, and each list's words kept in the
 * config's order), and the label of each word of `stages`, which no later list takes the place of.
 * A key the words do not hold reads as empty, so every lookup answers with its unknown case rather
 * than throwing.
 */
function installed(raw: Record<string, unknown>): Words {
    const lists = LISTS.map((list) => ({ list, rows: legendRows(raw[list]) }));
    const stageRows = lists.find((one) => one.list === 'stages')?.rows ?? [];
    return {
        palette: stringMap(raw.palette, hexShape),
        statuses: stringMap(raw.statuses, colorShape),
        stages: stringMap(raw.stages, colorShape),
        dataAccess: stringMap(raw.data_access, hexShape),
        legend: {
            words: Object.fromEntries(
                lists.flatMap((one) => one.rows).map((row) => [row.key, row])
            ),
            lists: lists
                .filter((one) => one.rows.length > 0)
                .map((one) => ({ list: one.list, keys: one.rows.map((row) => row.key) }))
        },
        stageLabels: Object.fromEntries(stageRows.map((row) => [row.key, row.label])),
        raw
    };
}

/** Each hub's words by the hub's name, their union over the workspace, and oculus's own. */
let byHub: Record<string, Words | undefined> = {};
let union: Words = installed({});
let own: Words = installed({});
let domainColor: Record<string, Record<string, string | undefined> | undefined> = {};
let domainText: Record<string, Record<string, string | undefined> | undefined> = {};

/**
 * Install the words of every hub of the workspace from `hubs`: each hub's `words` under its name,
 * oculus's own words for a name no hub holds, the union over the hubs in `order` for a lookup made
 * with no hub (oculus's own words when the workspace holds no hub), and each hub's research
 * `domains`, read from its domains registry; a domain with no colour wears the neutral tone.
 */
export function setVocab(hubs: HubVocabs): void {
    byHub = {};
    domainColor = {};
    domainText = {};
    for (const [name, vocab] of Object.entries(hubs.lists)) {
        if (name === '' || name === '__proto__') continue;
        byHub[name] = installed(vocab.words);
        domainColor[name] = stringMap(vocab.domains, colorShape);
        domainText[name] = stringMap(vocab.domains, labelShape);
    }
    own = installed(hubs.own);
    const order = hubs.order.map((name) => byKey(hubs.lists, name)?.words ?? hubs.own);
    union = order.length === 0 ? own : installed(unionWords(order));
}

/**
 * The words a lookup reads: the union over the workspace's hubs with no hub, the hub's own words
 * for a hub the workspace holds, and oculus's own words for any other name.
 */
function wordsOf(hub: string | undefined): Words {
    configGeneration();
    if (hub === undefined) return union;
    return byKey(byHub, hub) ?? own;
}

/**
 * The words of config/catalogs/vocab.yml and `manifest_fields` a record of the hub `hub` is read
 * under, as `wordsOf` picks them: what a pure helper of data/shapes/vocab-keys.ts or a reader of
 * a list (`categories`, `roles`, `focus_lanes`) is given in place of the merged config.
 */
export function vocabOf(hub?: string): Record<string, unknown> {
    return wordsOf(hub).raw;
}

/**
 * The tone a hex is written as. `palette:` maps it to a token name; a `c-` token's hue is the tone.
 * A token that is not a hue (`muted`) and a hex the palette does not list are both the unknown
 * tone, since a tone must name a `--c-<tone>` the stylesheets define.
 */
export function toneOf(hex: string, hub?: string): string {
    return paletteTone(hex, hub) ?? UNKNOWN_TONE;
}

/**
 * A hue named directly, as `focus_lane_tones` names one, when the palette holds that hue's token,
 * and the unknown tone otherwise: a name no stylesheet defines would draw `--c-<name>` as nothing,
 * and an empty one as `--c-`.
 */
export function namedTone(name: unknown, hub?: string): string {
    const { palette } = wordsOf(hub);
    const tone = scalar(name).trim();
    if (!TONE.test(tone)) return UNKNOWN_TONE;
    return Object.values(palette).includes(`c-${tone}`) ? tone : UNKNOWN_TONE;
}

/** A palette hue, or undefined when the value has no usable palette token. */
export function paletteTone(hex: unknown, hub?: string): string | undefined {
    const token = byKey(wordsOf(hub).palette, scalar(hex).trim().toLowerCase());
    if (!token?.startsWith('c-')) return undefined;
    const tone = token.slice('c-'.length);
    return TONE.test(tone) ? tone : undefined;
}

/** The dataset access colour from `data_access`, with an unknown value kept neutral. */
export function dataAccessTone(access: unknown, hub?: string): string {
    const hex = byKey(wordsOf(hub).dataAccess, scalar(access).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex, hub);
}

/** The tone of a collection entry's status, through the `color` of its word of `statuses`. */
export function statusTone(status: unknown, hub?: string): string {
    const hex = byKey(wordsOf(hub).statuses, scalar(status).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex, hub);
}

/** The tone of a project's stage, through the `color` of its word of `stages`. */
export function stageTone(stage: unknown, hub?: string): string {
    const hex = byKey(wordsOf(hub).stages, scalar(stage).toLowerCase());
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex, hub);
}

/**
 * The words of a stage, the `label` of its row of `stages`, and the word itself for one no row of
 * `stages` holds. A word that `forms` or `chips` also lists keeps its stage row's label here, where
 * the legend `chipLabel` reads gives it the label of the later list.
 */
export function stageLabel(stage: string, hub?: string): string {
    return byKey(wordsOf(hub).stageLabels, stage) ?? stage;
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
    const held = byKey(maps, root);
    return { key: id, entry: held === undefined ? undefined : byKey(held, id.toLowerCase()) };
}

/** The tone of a research domain, through `domains` and the palette of the domain's hub. */
export function domainTone(domain: unknown): string {
    configGeneration();
    const hex = domainEntry(domainColor, domain).entry;
    const hub = splitHubId(scalar(domain), Object.keys(domainColor)).root;
    return hex === undefined ? UNKNOWN_TONE : toneOf(hex, hub);
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
export function chipGlyphName(chip: string, hub?: string): string {
    return byKey(wordsOf(hub).legend.words, chip)?.icon ?? '';
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
export function statusMarkTone(word: string, hub?: string): string {
    const words = wordsOf(hub);
    if (byKey(words.stages, word.toLowerCase()) !== undefined) return stageTone(word, hub);
    return byKey(ICON_HUES, byKey(words.legend.words, word)?.icon ?? '') ?? UNKNOWN_TONE;
}

/**
 * The words of a stage, a form or a chip, its row's `label`, and the word itself for one the legend
 * does not list.
 */
export function chipLabel(chip: string, hub?: string): string {
    return byKey(wordsOf(hub).legend.words, chip)?.label ?? chip;
}

/**
 * The words of a project's status marks, in order: its stage when the stage's word of `stages` has
 * a glyph, then its form and its chips. The board's list names them all, and a lane card those its
 * lane does not say (state/boards/focus.ts `laneMarks`). Every stage of oculus's own vocab.yml has
 * a glyph; a stage without one, in a hub that names such a stage, gives no mark. A board card draws
 * every stage as its filled chip. `hub` is the project's hub.
 */
export function projectStatusWords(
    stage: string | undefined,
    form: string | undefined,
    chips: readonly string[],
    hub?: string
): string[] {
    const marked = stage !== undefined && chipGlyphName(stage, hub) !== '' ? [stage] : [];
    return [...marked, ...(form === undefined ? [] : [form]), ...chips];
}

/** Every word the legend lists: the stages, the forms, then the chips, in the config's order. */
export function chipKeys(hub?: string): string[] {
    return Object.keys(wordsOf(hub).legend.words);
}

/**
 * The words of each of `stages`, `forms` and `chips`, in that order, each list with its words in
 * the config's order, so a word of two lists is in both. A list that holds no word is left out.
 */
export function legendLists(hub?: string): { list: LegendList; keys: string[] }[] {
    return wordsOf(hub).legend.lists.map((one) => ({ list: one.list, keys: [...one.keys] }));
}

/**
 * The hue a word of the vocabulary wears: its stage's, and its status's where no stage has one. The
 * two maps cover different halves of the vocabulary, and taking both is what gives the gallery's
 * row its spread of hues instead of a wall of grey.
 */
export function chipTone(key: string, hub?: string): string {
    const stage = stageTone(key, hub);
    return stage === UNKNOWN_TONE ? statusTone(key, hub) : stage;
}

/**
 * One row per hue the given chips wear, in the order the hues first occur: the hue, the first chip
 * that wears it, and how many do.
 */
export function chipsByTone(
    keys: readonly string[],
    hub?: string
): { tone: string; key: string; count: number }[] {
    const byTone = new Map<string, { tone: string; key: string; count: number }>();
    for (const key of keys) {
        const tone = chipTone(key, hub);
        const held = byTone.get(tone);
        if (held === undefined) byTone.set(tone, { tone, key, count: 1 });
        else held.count += 1;
    }
    return [...byTone.values()];
}
