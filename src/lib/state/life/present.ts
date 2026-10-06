// Layer 2, client state, pure. What one Present pane holds of its own, and the reads over a deck
// the server answered.
//
// A deck is read by the server (data/sources/deck/read.ts) and arrives whole: the slides in order
// with their words, the groups with their members. What is here is the pane's own state (the
// slide it is on, whether its grid is open and the decks it has shown), the deck a tab's layout
// state names, the moves over a deck's slides, the frame the slides are laid out in, and the one
// hue a slide's status tag wears.
//
// Nothing here reads a store or a file.

import { z } from 'zod';
import { byKey, isMap, item } from '../../data/helpers/guards.ts';
import { optionalTextShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';
import { domainTone } from '../shared/words/tones.ts';
import type { Deck, DeckSlide, PresentSlide } from '../../data/model/index.ts';

export { DECK_GAP } from '../../data/model/index.ts';

/** The model types a Present component needs, re-exported so no view imports the data layer. */
export type {
    Deck,
    DeckCard,
    DeckIdeaCard,
    DeckSlide,
    DeckSummaryRow,
    PresentPanel,
    PresentSlide
} from '../../data/model/index.ts';

/**
 * Whether a project slide was written with the rich keys. One written with none carries its body
 * alone, and that is what the view draws instead of the four-layer slide.
 */
export function hasSlideContent(slide: PresentSlide): boolean {
    return (
        slide.title !== undefined ||
        slide.sub !== undefined ||
        slide.hook !== undefined ||
        slide.tag !== undefined ||
        slide.eli5 !== undefined ||
        slide.equation !== undefined ||
        slide.specs.length > 0 ||
        slide.panels.length > 0 ||
        slide.method.length > 0 ||
        slide.results.length > 0
    );
}

/** A deck by the served root it is in and its folder under that root. */
export type DeckRef = { root: string; path: string };

/** How many decks a pane remembers having shown. */
const RECENT_LIMIT = 10;

/** What one Present pane holds of its own: its place in the deck it shows and its history. */
export type PresentState = {
    /** The key of the slide the pane draws; empty means the deck's first. */
    slide: string;
    overview: boolean;
    /** The decks the pane has shown, newest first, without the one it shows now. */
    recent: DeckRef[];
};

/** One remembered deck, kept when it names both halves. */
const refShape = z.object({ root: z.string().min(1), path: z.string() });

/** The fields a Present pane keeps, each read as absent when it is of the wrong type. */
const presentStateShape = z.object({
    slide: optionalTextShape,
    overview: z.boolean().catch(false),
    recent: rowsShape(refShape).catch(() => [])
});

/** One pane's own state out of what its instance holds, with defaults for what is missing. */
export function parsePresentState(value: unknown): PresentState {
    const held = readAs(presentStateShape, value);
    return {
        slide: held?.slide ?? '',
        overview: held?.overview ?? false,
        recent: (held?.recent ?? []).slice(0, RECENT_LIMIT)
    };
}

/**
 * The `path` a tab's layout state holds for the deck that is a root's own folder. A tab's identity
 * needs a filled path, and that deck's path is empty, so the state holds this one in its place.
 */
const ROOT_TOP = '.';

/** The `root` and `path` fields of a state that names a deck. */
const deckFieldsShape = z.object({ root: optionalTextShape, path: optionalTextShape });

/**
 * The deck a tab's layout state names: its `root` and `path`, which are the tab's identity as a
 * LaTeX tab's are. A state with no root names the portfolio deck, which is the empty reference;
 * the Present store resolves it against the configuration.
 */
export function deckRefOf(state: unknown): DeckRef {
    const held = readAs(deckFieldsShape, state);
    const root = held?.root ?? '';
    if (root === '') return { root: '', path: '' };
    const path = held?.path ?? '';
    return { root, path: path === ROOT_TOP ? '' : path };
}

/** Whether two references name one deck. */
export function sameDeck(left: DeckRef, right: DeckRef): boolean {
    return left.root === right.root && left.path === right.path;
}

/**
 * The reference a tab is named by for a deck: the empty one for the portfolio deck (`home`, null
 * while the configuration is unread), so every way of opening it finds the one portfolio tab.
 */
export function tabDeck(ref: DeckRef, home: DeckRef | null): DeckRef {
    return home !== null && sameDeck(ref, home) ? { root: '', path: '' } : ref;
}

/** The remembered decks after the pane left `shown` for `next`: `shown` first, `next` removed. */
function withRecent(recent: DeckRef[], shown: DeckRef, next: DeckRef): DeckRef[] {
    const rest = recent.filter((one) => !sameDeck(one, shown) && !sameDeck(one, next));
    return [shown, ...rest].slice(0, RECENT_LIMIT);
}

/** The size in px a slide is laid out at; the pane scales this frame as a whole. */
export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 720;

/**
 * The uniform scale that fits the frame inside a box of the given size, or 0 for a box with no
 * size, a negative one or one that is not a number (a hidden tab, the first paint).
 */
export function fit(width: number, height: number): number {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0;
    return Math.min(width / FRAME_WIDTH, height / FRAME_HEIGHT);
}

/**
 * The least scale a slide's equation is drawn at to fit its card. A formula that needs more is
 * drawn at it and scrolls in its card, since text any smaller is no longer read from a slide.
 */
export const LEAST_EQUATION_SCALE = 0.5;

/**
 * The scale, in em of the formula's own size, that draws an equation `needed` px wide in `room` px
 * of its card: 1 when it fits or the card has no width yet, else the ratio rounded down to a
 * hundredth, so the rounding never leaves it a pixel too wide, and never below
 * LEAST_EQUATION_SCALE.
 */
export function equationScale(needed: number, room: number): number {
    if (room <= 0 || needed <= room) return 1;
    return Math.max(LEAST_EQUATION_SCALE, Math.floor((room / needed) * 100) / 100);
}

/** The hue a slide's status chip wears, from the deck's `tag_tones` by the tag's class. */
export function tagToneOf(deck: Deck, slide: PresentSlide): string | undefined {
    return byKey(deck.tagTones, slide.tag?.class ?? '');
}

/** Where a key sits in a deck's slides, and the first slide when the deck does not hold it. */
export function indexOf(slides: DeckSlide[], key: string): number {
    const found = slides.findIndex((slide) => slide.key === key);
    return found === -1 ? 0 : found;
}

/** The slide a key names, the first slide when the deck does not hold it, null for none. */
export function slideAt(slides: DeckSlide[], key: string): DeckSlide | null {
    return item(slides, indexOf(slides, key)) ?? null;
}

/** The key `by` slides on, stopping at both ends; the key given back for an empty deck. */
export function stepKey(slides: DeckSlide[], key: string, by: number): string {
    const next = Math.min(Math.max(indexOf(slides, key) + by, 0), slides.length - 1);
    return item(slides, next)?.key ?? key;
}

/**
 * The hue a slide carries on the overview tile and on its own left edge: its project's domain, and
 * nothing for a slide that belongs to no project.
 */
export function slideTone(row: DeckSlide): string | undefined {
    if (row.kind === 'project')
        return row.domain === undefined ? undefined : domainTone(row.domain);
    if (row.kind === 'idea') {
        return row.card.domain === undefined ? undefined : domainTone(row.card.domain);
    }
    return undefined;
}

/** The words a deck's tab and menu entry carry: its title, else its name. */
export function deckLabel(deck: Deck): string {
    return deck.title === '' ? deck.name : deck.title;
}

/** The `label` a tab's layout state holds, which names the tab; empty for none. */
export function labelOf(state: unknown): string {
    const label = isMap(state) ? state.label : undefined;
    return typeof label === 'string' ? label : '';
}

/** A tab's layout state with its label set, every other field kept. */
export function withLabel(state: unknown, label: string): unknown {
    return { ...(isMap(state) ? state : {}), label };
}

/**
 * A tab's layout state naming a deck: `base` (the label) with the deck's `root` and `path`, which
 * make the deck the tab's identity. The portfolio deck is the one with no root and no path.
 */
export function deckState(base: unknown, ref: DeckRef): Record<string, unknown> {
    const rest: Record<string, unknown> = { ...(isMap(base) ? base : {}) };
    delete rest.root;
    delete rest.path;
    return ref.root === '' ? rest : { ...rest, root: ref.root, path: ref.path || ROOT_TOP };
}

/**
 * A pane's own state after it leaves the deck it showed (`shown`, null when none is resolved) for
 * `next`: the first slide, the grid closed, and the deck it left remembered.
 */
export function leftDeck(value: unknown, shown: DeckRef | null, next: DeckRef): PresentState {
    const held = parsePresentState(value);
    return {
        ...held,
        slide: '',
        overview: false,
        recent: shown === null ? held.recent : withRecent(held.recent, shown, next)
    };
}

/** One row of the deck menu: what it is called, and the deck it opens. */
export type DeckChoice = { id: string; label: string; ref: DeckRef };

/** The folder name a deck reference ends in, which names a deck the menu has no title for. */
function folderName(ref: DeckRef): string {
    return (
        ref.path
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? ref.root
    );
}

/** What the catalog's `t` is to the helpers below. */
type Say = (key: string, ...args: (string | number)[]) => string;

/** The decks the menu lists: the one on screen, portfolio, project and recent ones. */
export function deckChoices(
    on: { ref: DeckRef; deck: Deck } | null,
    home: DeckRef | null,
    projects: { ref: DeckRef; id: string; title: string }[],
    recent: DeckRef[],
    t: Say
): DeckChoice[] {
    const found: DeckChoice[] = [];
    const add = (choice: DeckChoice): void => {
        if (!found.some((one) => sameDeck(one.ref, choice.ref))) found.push(choice);
    };
    if (on !== null) add({ id: 'shown', label: deckLabel(on.deck), ref: on.ref });
    if (home !== null) add({ id: 'portfolio', label: t('present.deck_portfolio'), ref: home });
    for (const one of projects) {
        add({ id: `project:${one.id}`, label: t('present.deck_project', one.title), ref: one.ref });
    }
    for (const [index, one] of recent.entries()) {
        add({ id: `recent:${index}`, label: folderName(one), ref: one });
    }
    return found;
}

/**
 * What a pane says when its deck draws nothing, and whether that is a failure: no deck named, the
 * answer yet to come, a request that failed, or a folder that holds no slides.
 */
export function nothingToShow(
    ref: DeckRef | null,
    answer: { deck: Deck | null; error: string; loading: boolean } | null,
    t: Say
): { message: string; error: boolean } {
    if (ref === null) return { message: t('present.empty_unnamed'), error: false };
    if (answer === null || answer.loading) return { message: t('present.loading'), error: false };
    const deck = answer.deck;
    if (deck === null) return { message: t('present.failed', answer.error), error: true };
    const folder = deck.path === '' ? deck.name : deck.path;
    if (deck.state === 'missing')
        return { message: t('present.empty_missing', folder), error: true };
    if (deck.state === 'no_file') {
        return { message: t('present.empty_no_file', folder), error: false };
    }
    if (deck.state === 'unreadable') {
        return { message: t('present.empty_unreadable', folder), error: true };
    }
    return { message: t('present.empty', folder), error: false };
}
