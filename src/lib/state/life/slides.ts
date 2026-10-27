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

import { z } from 'zod';
import { mapOfShape, readAs, stringItemsShape } from '../../data/shapes/shapes.ts';
import { movedOrder } from '../boards/collection/index.ts';
import { instanceFolded } from '../shared/page/folds.ts';
import { t } from '../shared/words/text.ts';
import type { DeckGroup, DeckOrderEntry } from '../../data/model/index.ts';

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
};

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
    said: z.string().catch('')
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
        folded: instanceFolded(value)
    };
}

/**
 * The lists a piece of work was made over. Work held against different ones is the reader's edits
 * over a deck whose file has since changed, so it is dropped and the file answers.
 */
export function listsSignature(groups: DeckGroup[], order: DeckOrderEntry[]): string {
    return JSON.stringify([
        groups.map((group) => [group.name, group.slides]),
        order.map((entry) => entry.token)
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
