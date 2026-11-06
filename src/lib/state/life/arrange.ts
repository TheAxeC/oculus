// Layer 2, client state, pure. Arranging a deck in the Present view's Overview: the deck laid out
// as its `order:` places it, each group at its place with the decks it holds, the one sentence a
// group's rule reads as, the lists a move, a removal or an addition writes, the values the forms
// of the deck's keys and of a group's rule show and write, and the line an answer says.
//
// It is here rather than in the components because each of these is an answer over a deck the
// server read: a move is a list in and a list out, and the Overview draws and writes what these
// give. Every list is computed from the lists the file holds now (a group's `slides:`, the
// order's tokens), which a write names as its bases, so an act is always made over the deck on
// screen and the server refuses one made over a file that changed since.
//
// A group's tiles are the members the pane's filter keeps (`kept` of each member the deck's answer
// lists), every member without a filter. A move writes the group's whole `slides:` list, so the
// members the filter hides keep their places in the file: a tile dropped beside another goes
// beside it in the list, and a step changes places with the next tile drawn.
//
// The keys the forms set (`deck.title`, `defaults.tag_tones` and each group's `find`, `sort` and
// `discover`, the keys config/schemas/deck-schema.yml describes) are held by the form as work by
// each key's path and written with the value the file held as their base.

import { isEqual } from 'lodash-es';
import { hueNames } from '../../data/sources/config/catalog/options.ts';
import { fields, isMap, strings } from '../../data/helpers/guards.ts';
import { t } from '../shared/words/text.ts';
import { deckWords } from './present.ts';
import type { WriteAnswer } from '../shared/stores/shapes.ts';
import type {
    Deck,
    DeckGroup,
    DeckKeys,
    DeckOrderEntry,
    DeckSlide
} from '../../data/model/index.ts';

export type { DeckKeys };

/** One deck a group holds, as the Overview draws it: its slides, or a title tile for none. */
export type DeckTile = {
    name: string;
    /** The deck's title in plain words, its name when it has none. */
    title: string;
    /** Whether the group's `slides:` names it; one that is not was found by discovery. */
    named: boolean;
    slides: DeckSlide[];
};

/**
 * What every tile of one Overview reads: the deck, the pane's Project facts toggle the strip of a
 * project's facts shows its words by, the words of a slide's place, the key of the slide the reader
 * was on, the card the shell's cursor is on (null for none) and the press that shows a slide.
 */
export type TileView = {
    deck: Deck;
    facts: boolean;
    placeOf: (row: DeckSlide) => string;
    current: string;
    cursor: string | null;
    onpick: (key: string) => void;
};

/** One entry of `order:` that draws its own slides: a file, a summary or a grid. */
export type EntryBlock = {
    kind: 'entry';
    entry: DeckOrderEntry;
    /** The entry's place in `order:`. */
    at: number;
    slides: DeckSlide[];
    /** What the deck's reader found about an entry that places no slide, empty for none. */
    finding: string;
};

/**
 * One group at its place: headed at its `slides:` entry, at the first summary or grid entry that
 * names it when no `slides:` entry does, or at the end (`token` null) when no entry names it.
 */
export type GroupBlock = {
    kind: 'group';
    group: DeckGroup;
    /** The token of the entry the group is headed at, null for a group drawn at the end. */
    token: string | null;
    /** The entry's place in `order:`, -1 for a group drawn at the end. */
    at: number;
    decks: DeckTile[];
};

/** What the Overview draws, in order: runs of entry tiles, and groups. */
type OverviewRun = { kind: 'entries'; entries: EntryBlock[] } | GroupBlock;

/**
 * The slides each entry of `order:` placed, by the entry's place in the file's list (`entry` of a
 * DeckOrderEntry). A slide carries that place in `source.entry`; a slide with no source belongs to
 * the entry of the slide before it.
 */
function slidesByEntry(slides: DeckSlide[]): Map<number, DeckSlide[]> {
    const placed = new Map<number, DeckSlide[]>();
    let entry = 0;
    for (const slide of slides) {
        entry = slide.source?.entry ?? entry;
        placed.set(entry, [...(placed.get(entry) ?? []), slide]);
    }
    return placed;
}

/**
 * The decks of a group the pane's filter keeps, every one without a filter, with the slides each
 * placed, known by the key prefix of the deck.
 */
function decksOf(group: DeckGroup, slides: DeckSlide[]): DeckTile[] {
    return group.members
        .flatMap((member) => (member.kept ? [member] : []))
        .map((member) => ({
            name: member.name,
            title: deckWords(member.title, member.name),
            named: member.named,
            slides: slides.filter((slide) => slide.key.startsWith(`${member.name}/`))
        }));
}

/**
 * The finding the deck's reader raised at an entry in the deck's own file, which a placeholder
 * tile names: one that names the entry, then any, else the general line.
 */
function findingOf(entry: DeckOrderEntry): string {
    const found = entry.findings.find((one) => one.includes(entry.name)) ?? entry.findings.at(0);
    return found ?? t('present.arrange_places_nothing');
}

/** The deck as the Overview draws it, in the order of its `order:`. */
export function overviewRuns(deck: Deck): OverviewRun[] {
    const placed = slidesByEntry(deck.slides);
    const groups = new Map(deck.groups.map((group) => [group.name, group]));
    const bySlides = new Set(
        deck.order.flatMap((entry) => (entry.kind === 'group' ? [entry.name] : []))
    );
    const headed = new Set<string>();
    const runs: OverviewRun[] = [];
    const entryTile = (block: EntryBlock): void => {
        const last = runs.at(-1);
        if (last?.kind === 'entries') last.entries.push(block);
        else runs.push({ kind: 'entries', entries: [block] });
    };
    for (const [at, entry] of deck.order.entries()) {
        const slides = placed.get(entry.entry) ?? [];
        const group = groups.get(entry.name);
        if (entry.kind === 'group' && group !== undefined) {
            headed.add(group.name);
            runs.push({
                kind: 'group',
                group,
                token: entry.token,
                at,
                decks: decksOf(group, slides)
            });
            continue;
        }
        const finding = slides.length === 0 ? findingOf(entry) : '';
        entryTile({ kind: 'entry', entry, at, slides, finding });
        if (entry.kind !== 'file' && group !== undefined && !bySlides.has(group.name)) {
            if (headed.has(group.name)) continue;
            headed.add(group.name);
            runs.push({ kind: 'group', group, token: entry.token, at, decks: decksOf(group, []) });
        }
    }
    for (const group of deck.groups) {
        if (headed.has(group.name)) continue;
        runs.push({ kind: 'group', group, token: null, at: -1, decks: decksOf(group, []) });
    }
    return runs;
}

/** Which side of a target a drop lands on. */
export type Side = 'before' | 'after';

/**
 * A list of names with the name at `at` taken out and put back at `to`, or null when either place
 * is outside the list or the two are one.
 */
function movedOrder(order: readonly string[], at: number, to: number): string[] | null {
    if (at < 0 || to < 0 || at >= order.length || to >= order.length || at === to) return null;
    const moved = [...order];
    const [held] = moved.splice(at, 1);
    moved.splice(to, 0, held);
    return moved;
}

/** One name moved to another place in a list, and nothing when it cannot go there. */
function withMove(list: string[], name: string, to: number): string[] | null {
    return movedOrder(list, list.indexOf(name), to);
}

/**
 * The place `name` lands at, counted in `list` without it, dropped on `side` of `onto`: the end of
 * the list for a target the list does not name (a deck found by discovery, a group's header).
 */
function landing(list: string[], name: string, onto: string | null, side: Side): number {
    const rest = list.filter((one) => one !== name);
    const at = onto === null ? -1 : rest.indexOf(onto);
    return at === -1 ? rest.length : at + (side === 'after' ? 1 : 0);
}

/** The order's tokens with one entry dropped on a side of another; null when nothing moves. */
export function entryDropped(
    tokens: string[],
    token: string,
    onto: string,
    side: Side
): string[] | null {
    if (token === onto || !tokens.includes(onto)) return null;
    return withMove(tokens, token, landing(tokens, token, onto, side));
}

/** The order's tokens with one entry a place earlier (-1) or later (1); null at either end. */
export function entryStepped(tokens: string[], token: string, by: -1 | 1): string[] | null {
    return withMove(tokens, token, tokens.indexOf(token) + by);
}

/**
 * One name taken out of the list of one group and put in the list of another at `to`, which is
 * the place it lands counted in the list it joins. Null when the name is not in the list it
 * leaves, when the two groups are one, or when the name is already in the list it joins.
 */
function withCross(
    lists: Record<string, string[]>,
    from: string,
    into: string,
    name: string,
    to: number
): Record<string, string[]> | null {
    const leaving = lists[from];
    const joining = lists[into];
    if (from === into || !leaving.includes(name) || joining.includes(name)) return null;
    const placed = Math.max(0, Math.min(to, joining.length));
    return {
        [from]: leaving.filter((one) => one !== name),
        [into]: joining.toSpliced(placed, 0, name)
    };
}

/** One group's list as a write names it: the group, the list the file holds and the new one. */
export type GroupList = { group: string; base: string[]; slides: string[] };

/** What a drop of a member deck writes, or why it writes nothing. */
type DeckDrop = { lists: GroupList[] } | { already: true } | null;

/** Whether a group holds a deck: its `slides:` names it or it found it. */
function holds(group: DeckGroup, name: string): boolean {
    return group.slides.includes(name) || group.members.some((one) => one.name === name);
}

/**
 * The lists a member deck of `from` dropped on a side of `onto` in `into` writes (`onto` null for
 * the group's header or a place no deck holds). In its own group the deck moves in `slides:`, a
 * deck found by discovery named at its new place. On another group it leaves its own `slides:`
 * and joins that one in one write, a deck found by discovery only joining; a group that holds it
 * already writes nothing and says so. Null for a drop that moves nothing.
 */
export function deckDropped(
    from: DeckGroup,
    into: DeckGroup,
    name: string,
    onto: string | null,
    side: Side
): DeckDrop {
    const list = (slides: string[]): GroupList[] => [
        { group: into.name, base: into.slides, slides }
    ];
    if (from.name === into.name) {
        if (onto === null || onto === name) return onto === null ? { already: true } : null;
        const to = landing(into.slides, name, onto, side);
        if (!into.slides.includes(name)) return { lists: list(into.slides.toSpliced(to, 0, name)) };
        const moved = withMove(into.slides, name, to);
        return moved === null ? null : { lists: list(moved) };
    }
    if (holds(into, name)) return { already: true };
    const to = landing(into.slides, name, onto, side);
    if (!from.slides.includes(name)) return { lists: list(into.slides.toSpliced(to, 0, name)) };
    const crossed = withCross(
        { [from.name]: from.slides, [into.name]: into.slides },
        from.name,
        into.name,
        name,
        to
    );
    if (crossed === null) return { already: true };
    return {
        lists: [
            { group: from.name, base: from.slides, slides: crossed[from.name] },
            { group: into.name, base: into.slides, slides: crossed[into.name] }
        ]
    };
}

/**
 * A group's `slides:` with one deck a place earlier (-1) or later (1) among the decks the group
 * draws, or null at either end. The deck changes places with the next deck the pane's filter keeps
 * in that direction, the neighbouring deck without a filter, so the decks the filter hides between
 * the two keep their places. The decks before the moved one's new place, and every deck named
 * already, are named in the order of the group's members, so a deck found by discovery is named at
 * its new place and the decks it passes with it; a name that matches no deck keeps its place in
 * the list.
 */
export function deckStepped(group: DeckGroup, name: string, by: -1 | 1): string[] | null {
    const drawn = group.members.map((one) => one.name);
    const at = drawn.indexOf(name);
    const shown = group.members.flatMap((one, place) => (one.kept ? [place] : []));
    const passed =
        by === 1 ? shown.find((place) => place > at) : shown.findLast((place) => place < at);
    if (at === -1 || passed === undefined) return null;
    const next = drawn.with(at, drawn[passed]).with(passed, name);
    const named = new Set(group.members.filter((one) => one.named).map((one) => one.name));
    const last = Math.max(next.indexOf(name), ...next.map((one, at) => (named.has(one) ? at : -1)));
    const wanted = next.slice(0, last + 1);
    const missing = new Set(group.missing);
    let taken = 0;
    const kept = group.slides.flatMap((one) => {
        if (missing.has(one)) return [one];
        const next = wanted.at(taken);
        taken += 1;
        return next === undefined ? [] : [next];
    });
    return [...kept, ...wanted.slice(taken)];
}

/** One name added at the end of a list (`on`) or taken out of it. */
export function withTick(list: string[], name: string, on: boolean): string[] {
    const without = list.filter((one) => one !== name);
    return on ? [...without, name] : without;
}

/** The values a form set for the deck's keys, each by `keyId` of its path. */
export type KeyWork = Record<string, unknown>;

/** One key of a deck the forms set: its path from the top of the file and the value it holds. */
type DeckKeyRow = { path: string[]; held: unknown };

/** The id a key's work is held under: its path, which a group name with a dot keeps apart. */
function keyId(path: readonly string[]): string {
    return JSON.stringify(path);
}

/** The path of a group's key. */
export function groupKey(group: string, key: 'find' | 'sort' | 'discover'): string[] {
    return ['groups', group, key];
}

/** The deck's title key and its tag tones key. */
export const TITLE_KEY = ['deck', 'title'];
export const TONES_KEY = ['defaults', 'tag_tones'];

/** Every key the forms set for a deck, with the value the file holds; none for an unread file. */
function keyRows(keys: DeckKeys | null): DeckKeyRow[] {
    if (keys === null) return [];
    return [
        { path: TITLE_KEY, held: keys.title },
        { path: TONES_KEY, held: keys.tagTones },
        ...keys.groups.flatMap((group) => [
            { path: groupKey(group.name, 'find'), held: group.find },
            { path: groupKey(group.name, 'sort'), held: group.sort },
            { path: groupKey(group.name, 'discover'), held: group.discover }
        ])
    ];
}

/** The value a key shows: the form's when it set one, else the file's; null for none. */
export function keyShown(keys: DeckKeys | null, work: KeyWork, path: readonly string[]): unknown {
    const id = keyId(path);
    if (Object.hasOwn(work, id)) return work[id];
    return keyRows(keys).find((row) => keyId(row.path) === id)?.held ?? null;
}

/** The work with one key set; a value equal to the file's drops the key's work. */
export function withKey(
    keys: DeckKeys | null,
    work: KeyWork,
    path: readonly string[],
    value: unknown
): KeyWork {
    const id = keyId(path);
    const held = keyRows(keys).find((row) => keyId(row.path) === id)?.held ?? null;
    const { [id]: _was, ...rest } = work;
    return isEqual(value, held) ? rest : { ...rest, [id]: value };
}

/** One key a write sets: its path, the value the file holds as its base, and the value to write. */
export type KeyEdit = { path: string[]; base: unknown; value: unknown };

/** The keys whose work differs from the file, each with the file's value as its base. */
export function keyChanges(keys: DeckKeys | null, work: KeyWork): KeyEdit[] {
    return keyRows(keys).flatMap(({ path, held }) => {
        const id = keyId(path);
        if (!Object.hasOwn(work, id) || isEqual(work[id], held)) return [];
        return [{ path, base: held, value: work[id] }];
    });
}

/** The tag tones a value holds, each tag with its hue, in the file's order. */
export function tonesOf(value: unknown): [string, string][] {
    return Object.entries(fields(value)).flatMap(([tag, hue]) =>
        typeof hue === 'string' ? [[tag, hue] as [string, string]] : []
    );
}

/**
 * The tag tones with one tag given a hue, or taken out with the empty hue; null when no tag is
 * left, which takes the key out.
 */
export function withTone(value: unknown, tag: string, hue: string): Record<string, string> | null {
    const tones = Object.fromEntries(tonesOf(value).filter(([one]) => one !== tag));
    if (hue !== '') tones[tag] = hue;
    return Object.keys(tones).length === 0 ? null : tones;
}

/** The hue names a tag tone may name, from the palette of the engine's configuration. */
export function deckHues(config: Record<string, unknown> | undefined): string[] {
    return config === undefined ? [] : hueNames(config);
}

/** The lists a group's `find:` holds beside its folders, and the vocabulary each is a word of. */
export const FIND_LISTS = [
    { key: 'tiers', vocab: 'tiers' },
    { key: 'stages', vocab: 'stages' },
    { key: 'forms', vocab: 'forms' },
    { key: 'status', vocab: 'chips' }
] as const;

/** One of those lists. */
export type FindList = (typeof FIND_LISTS)[number]['key'];

/** A group's `find:` as the form draws it: the folder globs as one text and each list's words. */
export type FindForm = { folders: string } & Record<FindList, string[]>;

/** The text the folder globs are written in, one after another. */
const GLOBS = ', ';

/** The folder globs a `find:` value holds, one glob or a list of them. */
function globsOf(value: unknown): string[] {
    const held = fields(value);
    return typeof held.folders === 'string' ? [held.folders] : strings(held.folders);
}

/** A `find:` value as the form draws it. */
export function findForm(value: unknown): FindForm {
    const held = fields(value);
    return {
        folders: globsOf(value).join(GLOBS),
        tiers: strings(held.tiers),
        stages: strings(held.stages),
        forms: strings(held.forms),
        status: strings(held.status)
    };
}

/**
 * The `find:` a form writes: the folder globs, one glob as the text alone when the file held them
 * so or held none, and each list that holds a word. Null for a form with nothing in it, which takes
 * the key out.
 */
export function findValue(base: unknown, form: FindForm): Record<string, unknown> | null {
    const globs = form.folders
        .split(',')
        .map((one) => one.trim())
        .filter((one) => one !== '');
    const listed = isMap(base) && Array.isArray(base.folders);
    const out: Record<string, unknown> = {};
    if (globs.length > 0) out.folders = globs.length === 1 && !listed ? globs[0] : globs;
    for (const { key } of FIND_LISTS) if (form[key].length > 0) out[key] = form[key];
    return Object.keys(out).length === 0 ? null : out;
}

/** Words written as one list: "a", "a and b", "a, b and c". */
function listWords(words: string[]): string {
    if (words.length < 2) return words.join('');
    return t(
        'present.rule_and',
        words.slice(0, -1).join(t('present.rule_comma')),
        words.at(-1) ?? ''
    );
}

/** The words each list of `find:` offers, each by its id and the label it is read by. */
export type FindChoices = (list: FindList) => { id: string; label: string }[];

/**
 * A group's rule as one sentence: the projects its `find:` finds (their tiers, stages, forms and
 * status chips, each list in the order the file holds it, each word by its label in the engine's
 * vocabulary, `choices`, or by itself when the vocabulary has none) and the folders it looks in,
 * then whether it adds what it finds and how it sorts. A group with no `find:` shows the decks it
 * names.
 */
export function ruleSentence(keys: DeckKeys | null, group: string, choices: FindChoices): string {
    const held = keys?.groups.find((one) => one.name === group);
    if (held === undefined || !isMap(held.find)) return t('present.rule_named');
    const form = findForm(held.find);
    const words = (list: FindList): string => {
        const offered = choices(list);
        return listWords(form[list].map((id) => offered.find((one) => one.id === id)?.label ?? id));
    };
    const subject =
        form.tiers.length === 0
            ? t('present.rule_projects_any')
            : t('present.rule_projects', words('tiers'));
    const parts = [
        subject,
        ...(form.stages.length === 0 ? [] : [t('present.rule_stages', words('stages'))]),
        ...(form.forms.length === 0 ? [] : [t('present.rule_forms', words('forms'))]),
        ...(form.status.length === 0 ? [] : [t('present.rule_status', words('status'))]),
        ...(form.folders === '' ? [] : [t('present.rule_folders', listWords(globsOf(held.find)))])
    ];
    const finds = t('present.rule_finds', parts.join(t('present.rule_comma')));
    if (held.discover !== true) return t('present.rule_names_only', finds);
    const sort =
        held.sort === 'title' ? t('present.field_sort_title') : t('present.field_sort_folder');
    return t('present.rule_adds', finds, sort);
}

/** Whether an answer wrote: the server took the write whole and changed the file. */
export function arrangeWrote(answer: WriteAnswer): boolean {
    return answer.ok && answer.refused.length === 0 && answer.changed.length > 0;
}

/**
 * The line the status line says for an answer: `said` when it wrote, a refusal in the server's
 * own sentence, and the general line for a failure whose word this does not know.
 */
export function arrangeLine(answer: WriteAnswer, said: string): string {
    const reason = answer.refused.at(0)?.reason;
    if (reason !== undefined) return reason;
    if (answer.ok) return said;
    if (answer.network === true) return t('present.failed_network');
    if (answer.error === 'unwritable') return t('present.arrange_failed_file');
    return t('present.arrange_failed');
}
