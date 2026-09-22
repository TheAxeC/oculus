// Layer 2, client state, pure. The Slides view's own state: which slides the reader has ticked,
// what order they have dragged them into, and the line the status region is showing.
//
// It is here rather than inside the component because it is what the view is: a tick and a move are
// answers over two lists, and a pure answer is a plain call in a test rather than a rendered page.
// The catalog itself is not here; it is the deck's, and state/life/present.ts computes it.
//
// The work is held against the catalog it was made over. A push that adds or removes a slide leaves
// the two out of step, and the view then draws what the file says and says that the unsaved work
// was dropped, rather than saving an order over a deck that has moved underneath it.

import { movedOrder } from '../boards/collection.ts';
import { t } from '../words/text.ts';

/** What the reader is looking at: the order the rows are in, and which of them are ticked. */
export type SlidePicks = {
    /** Every key of the catalog, in the order the deck would show them. */
    order: string[];
    /** The keys whose slides the deck shows, a subset of `order`, in `order`'s own order. */
    picked: string[];
};

/**
 * One Slides pane's own state: the reader's work, the catalog it was made over, and the last line.
 */
export type SlidesState = SlidePicks & {
    /** The signature of the catalog the work was made over; empty when there is no work. */
    at: string;
    /** What the status region is showing, already translated; empty for nothing. */
    said: string;
};

/** What a write answered, as much of it as the status line depends on. */
export type SaveAnswer = { ok: boolean; error?: string; network?: boolean };

/** A list of words out of unknown data, and the empty list for anything else. */
function words(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((one): one is string => typeof one === 'string');
}

/**
 * One pane's own state out of whatever its instance holds, with the defaults for what is missing.
 */
export function parseSlidesState(value: unknown): SlidesState {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { at: '', order: [], picked: [], said: '' };
    }
    const held = value as Record<string, unknown>;
    return {
        at: typeof held.at === 'string' ? held.at : '',
        order: words(held.order),
        picked: words(held.picked),
        said: typeof held.said === 'string' ? held.said : ''
    };
}

/**
 * The catalog a piece of work was made over. Work held against a different one is the reader's
 * edits over a deck that has since gained, lost or moved a slide, so it is dropped and the file
 * answers.
 */
export function catalogSignature(keys: string[]): string {
    return keys.join('\n');
}

/**
 * What the file says: every slide of the catalog in its order, ticked where the saved selection
 * holds it. A deck that has saved no selection shows the slides `defaults` names, which is the deck
 * a reader moving through it sees today, so a first save writes what they already see.
 */
export function fileState(
    keys: string[],
    selection: string[] | null,
    defaults: string[]
): SlidePicks {
    const shown = selection ?? defaults;
    return { order: [...keys], picked: keys.filter((key) => shown.includes(key)) };
}

/**
 * One slide ticked or unticked. The ticks stay in the catalog's own order, whatever order they came
 * in.
 */
export function withTick(held: SlidePicks, key: string, on: boolean): SlidePicks {
    if (!held.order.includes(key)) return held;
    const picked = held.order.filter((one) => (one === key ? on : held.picked.includes(one)));
    return { order: held.order, picked };
}

/** One slide moved to another place in the deck, and nothing when it cannot go there. */
export function withMove(held: SlidePicks, key: string, to: number): SlidePicks | null {
    const order = movedOrder(held.order, held.order.indexOf(key), to);
    return order === null ? null : { order, picked: held.picked };
}

/**
 * The line the status region shows for one answer. The endpoint answers a word for the machine, and
 * the reader is shown a sentence: a word this does not know gets the general one rather than being
 * printed, so nothing on screen is the wire's vocabulary.
 */
/**
 * The pane's state once a save has answered: the work as it was sent, the sentence for the answer,
 * and the catalog the work is held against. A save that landed is held against the catalog its own
 * write produces, which is the order just sent, so the push it causes is not read as a deck that
 * moved underneath the reader; a save that was refused changed nothing on the disk, so the work is
 * held against the catalog on screen and stays, and the reader sees why the save was refused.
 */
export function savedState(answer: SaveAnswer, picks: SlidePicks, signature: string): SlidesState {
    return {
        at: answer.ok ? catalogSignature(picks.order) : signature,
        ...picks,
        said: saveMessage(answer)
    };
}

export function saveMessage(answer: SaveAnswer): string {
    if (answer.ok) return t('slides.saved');
    if (answer.network === true) return t('slides.failed_network');
    if (answer.error === 'invalid') return t('slides.failed_invalid');
    if (answer.error === 'invalid_order') return t('slides.failed_order');
    if (answer.error === 'unwritable') return t('slides.failed_file');
    return t('slides.failed_other');
}
