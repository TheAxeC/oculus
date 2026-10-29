// Layer 2, client state, pure. The Slides view's own state: for each group of a deck, the list of
// deck names the reader has ticked and ordered, the deck's `order:` as the reader has arranged it,
// the line the status region is showing, and the groups the reader folded.
//
// It is here rather than inside the component because it is what the view is: a tick and a move are
// answers over a list, and a pure answer is a plain call in a test rather than a rendered page.
// The groups themselves are the deck's, which the server answers; what the reader's work is held
// against is each group's `slides:` as the file holds it.
//
// A deck moves within its group and across groups: the work keeps each list the reader touched,
// and one move across groups changes two of them. The order is a list of the tokens the write names
// its entries by (data/sources/deck/spec.ts), empty until the reader moves an entry.
//
// The work is held against the lists it was made over. A push that changes a group's `slides:`
// leaves the two out of step, and the view then draws what the file says and says that the unsaved
// work was dropped, rather than saving a list over a deck that has moved underneath it.
//
// The keys the view sets beside the lists (`deck.title`, `defaults.tag_tones` and each group's
// `find`, `sort` and `discover`, the keys config/schemas/deck-schema.yml describes) are work of the
// same kind: each value the reader set is held by its key's path, held against the keys the file
// holds with the lists, and sent with them, each with the value the file held as its base.

import { isEqual } from 'lodash-es';
import { z } from 'zod';
import { hueNames } from '../../data/sources/config/catalog/options.ts';
import { fields, isMap, strings } from '../../data/helpers/guards.ts';
import { mapOfShape, readAs, stringItemsShape } from '../../data/shapes/shapes.ts';
import { movedOrder } from '../boards/collection/index.ts';
import { instanceFolded } from '../shared/page/folds.ts';
import { t } from '../shared/words/text.ts';
import type { DeckGroup, DeckKeys, DeckOrderEntry } from '../../data/model/index.ts';

export type { DeckOrderEntry };

/** What the reader changed: the list of each group they touched, by group name. */
export type SlideWork = Record<string, string[]>;

/** One Slides pane's own state: the work, what it was made over and a line. */
export type SlidesState = {
    work: SlideWork;
    /** The tokens of the deck's order entries in the order the reader made; empty for no work. */
    order: string[];
    /** The signature of the lists the work was made over; empty when there is no work. */
    at: string;
    /** What the status region is showing, already translated; empty for nothing. */
    said: string;
    /** The folded groups, each by its name after `group:`, and the order's list under `order`. */
    folded: string[];
    /** The values the reader set for the deck's keys, by `keyId`; null takes a key out. */
    keys: KeyWork;
};

/** The values the reader set for the deck's keys, each by `keyId` of its path. */
export type KeyWork = Record<string, unknown>;

/** What a write answered, as much of it as the status line depends on. */
export type SaveAnswer = {
    ok: boolean;
    error?: string;
    network?: boolean;
    refused?: { field: string; reason: string }[];
};

/** The fields a Slides pane keeps, each read as absent when it is of the wrong type. */
const slidesStateShape = z.object({
    work: mapOfShape(stringItemsShape).catch(() => ({})),
    order: stringItemsShape.catch(() => []),
    at: z.string().catch(''),
    said: z.string().catch(''),
    keys: z.record(z.string(), z.unknown()).catch(() => ({}))
});

/**
 * One pane's own state out of whatever its instance holds, with the defaults for what is missing.
 */
export function parseSlidesState(value: unknown): SlidesState {
    const held = readAs(slidesStateShape, value);
    return {
        work: held?.work ?? {},
        order: held?.order ?? [],
        at: held?.at ?? '',
        said: held?.said ?? '',
        folded: instanceFolded(value),
        keys: held?.keys ?? {}
    };
}

/**
 * The lists a piece of work was made over. Work held against different ones is the reader's edits
 * over a deck whose file has since changed, so it is dropped and the file answers.
 */
export function listsSignature(
    groups: DeckGroup[],
    order: DeckOrderEntry[],
    keys: DeckKeys | null = null
): string {
    return JSON.stringify([
        groups.map((group) => [group.name, group.slides]),
        order.map((entry) => entry.token),
        keys
    ]);
}

/** The kinds of row a group lists. */
export type RowKind = 'named' | 'found' | 'candidate' | 'missing' | 'conflict';

/** One row of a group: a deck name, whether it is ticked, what it is and the words it wears. */
export type GroupRow = {
    name: string;
    title: string;
    kind: RowKind;
    ticked: boolean;
    /** The other groups a conflicting deck is found by. */
    others: string[];
};

/** The list a group is drawn from: the reader's work when they made some, else the file's. */
export function listOf(group: DeckGroup, work: SlideWork): string[] {
    return work[group.name] ?? group.slides;
}

/**
 * The rows of one group, over the list that is being edited: the ticked ones in the list's order
 * (a name no deck matches is marked missing), then the decks found by discovery, which the group
 * holds without naming, then the decks found and not held, then the conflicting ones.
 */
export function groupRows(group: DeckGroup, list: string[]): GroupRow[] {
    const titles = new Map<string, string>();
    for (const one of [...group.members, ...group.candidates]) titles.set(one.name, one.title);
    const missing = new Set(group.missing);
    const ticked = list.map((name): GroupRow => ({
        name,
        title: titles.get(name) ?? name,
        kind: missing.has(name) ? 'missing' : 'named',
        ticked: true,
        others: []
    }));
    const found = group.members
        .filter((one) => !one.named && !list.includes(one.name))
        .map((one): GroupRow => ({
            name: one.name,
            title: one.title,
            kind: 'found',
            ticked: true,
            others: []
        }));
    const heldBefore = group.members.filter((one) => one.named && !list.includes(one.name));
    const candidates = [...heldBefore, ...group.candidates]
        .filter((one) => !list.includes(one.name))
        .map((one): GroupRow => ({
            name: one.name,
            title: one.title,
            kind: 'candidate',
            ticked: false,
            others: []
        }));
    const conflicts = group.conflicts
        .filter((one) => !list.includes(one.name))
        .map((one): GroupRow => ({
            name: one.name,
            title: titles.get(one.name) ?? one.name,
            kind: 'conflict',
            ticked: false,
            others: one.others
        }));
    return [...ticked, ...found, ...candidates, ...conflicts];
}

/** One name ticked or unticked in a list: ticked goes last, unticked is taken out. */
export function withTick(list: string[], name: string, on: boolean): string[] {
    const without = list.filter((one) => one !== name);
    return on ? [...without, name] : without;
}

/** One name moved to another place in a list, and nothing when it cannot go there. */
export function withMove(list: string[], name: string, to: number): string[] | null {
    return movedOrder(list, list.indexOf(name), to);
}

/**
 * One name taken out of the list of one group and put in the list of another at `to`, which is
 * the place it lands counted in the list it joins. Null when the name is not in the list it
 * leaves, when the two groups are one, or when the name is already in the list it joins.
 */
export function withCross(
    lists: SlideWork,
    from: string,
    into: string,
    name: string,
    to: number
): SlideWork | null {
    const leaving = lists[from];
    const joining = lists[into];
    if (from === into || !leaving.includes(name) || joining.includes(name)) return null;
    const placed = Math.max(0, Math.min(to, joining.length));
    return {
        [from]: leaving.filter((one) => one !== name),
        [into]: joining.toSpliced(placed, 0, name)
    };
}

/** The tokens the order is drawn from: the reader's work when they made some, else the file's. */
export function orderTokens(entries: DeckOrderEntry[], work: string[]): string[] {
    return work.length > 0 ? work : entries.map((entry) => entry.token);
}

/** The entries of the order in the order of `tokens`, each entry the deck has once. */
export function orderRows(entries: DeckOrderEntry[], tokens: string[]): DeckOrderEntry[] {
    const byToken = new Map(entries.map((entry) => [entry.token, entry]));
    return tokens.flatMap((token) => {
        const entry = byToken.get(token);
        return entry === undefined ? [] : [entry];
    });
}

/** Whether the tokens the reader arranged differ from the file's order. */
export function orderChanged(entries: DeckOrderEntry[], work: string[]): boolean {
    return work.length > 0 && work.some((token, at) => token !== entries[at]?.token);
}

/** The groups whose work differs from what the file holds, with the list to write. */
export function changedGroups(
    groups: DeckGroup[],
    work: SlideWork
): { group: DeckGroup; slides: string[] }[] {
    return groups.flatMap((group) => {
        const slides = Object.hasOwn(work, group.name) ? work[group.name] : group.slides;
        const same =
            slides.length === group.slides.length &&
            slides.every((name, at) => name === group.slides[at]);
        return same ? [] : [{ group, slides }];
    });
}

/**
 * The line the status region shows for one answer. The endpoint answers a word for the machine, and
 * the reader is shown a sentence: a refusal says why in the server's own sentence, and a word this
 * does not know gets the general one rather than being printed.
 */
export function saveMessage(answer: SaveAnswer): string {
    const reason = answer.refused?.at(0)?.reason;
    if (reason !== undefined) return reason;
    if (answer.ok) return t('slides.saved');
    if (answer.network === true) return t('slides.failed_network');
    if (answer.error === 'unwritable') return t('slides.failed_file');
    return t('slides.failed_other');
}

/** One key of a deck the view sets: its path from the top of the file and the value it holds. */
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

/** Every key the view sets for a deck, with the value the file holds; none for an unread file. */
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

/** The value a key shows: the reader's when they set one, else the file's; null for none. */
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

/** The keys whose work differs from the file, each with the file's value as its base. */
export function keyChanges(
    keys: DeckKeys | null,
    work: KeyWork
): { path: string[]; base: unknown; value: unknown }[] {
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

/** A `find:` value as the form draws it. */
export function findForm(value: unknown): FindForm {
    const held = fields(value);
    const folders = typeof held.folders === 'string' ? [held.folders] : strings(held.folders);
    return {
        folders: folders.join(GLOBS),
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

/** The words of a vocabulary of the engine's configuration, each with its label. */
export function vocabChoices(
    config: Record<string, unknown> | undefined,
    vocab: string
): { id: string; label: string }[] {
    return Object.entries(fields(config?.[vocab])).map(([id, about]) => {
        const label = fields(about).label;
        return { id, label: typeof label === 'string' ? label : id };
    });
}
