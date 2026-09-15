// Layer 1, data, pure. Which slides the public deck holds, under which keys, and in which order.
//
// The rule lives here rather than beside the view because two readers need the same answer: the
// Present view draws the deck a reader moves through, and the write that saves a selection checks
// the keys it was sent against the same catalog. A second copy of the rule on the server would let
// the two disagree, and a disagreement means a save the reader made is refused as invalid.
//
// Nothing here knows what a slide looks like. It answers over entries and keys; the titles, the
// hues and the drawing are state/present.ts's, over the same entries.

import { isMap, str, strings } from './guards.ts';
import type { DeckEntry, DeckKind, Project } from './model.ts';

/** The one file a project's slides and its deck narrative are read from. */
export const PRESENT_DOC = 'PRESENT.md';

/** The kinds `order:` may name, so a line naming anything else places no slide. */
export const DECK_KINDS: DeckKind[] = [
    'title',
    'framing',
    'project',
    'summary',
    'ideas',
    'closing'
];

/** Where a project sorts among the slides no `order:` line placed. */
const TYPE_RANK: Record<string, number> = { active: 0, manuscript: 1, idea: 2 };

/** The rank of a type the map does not name, which puts archived and coauthor work last. */
const LAST_RANK = 9;

/**
 * The tiers whose slides are on the deck on their own. Work that is finished or somebody else's is
 * shown only when the `order:` places it or a saved selection holds it, so a public deck does not
 * grow an archived project the day its PRESENT.md is written. The catalog still offers it, unticked,
 * so the reader can put it on the deck.
 */
const OPEN_TIERS = ['active', 'manuscripts', 'ideas'];

/** What the placement rule needs of one project slide: its key, and the project it belongs to. */
export type DeckSource = {
    /** The slide's own id, which is the key it is named by. */
    id: string;
    tier: string;
    type: string;
    /** The project's title, which is what the unplaced slides are ordered by. */
    title: string;
};

/** The key a slide is named by in `selection:` and `slide_order:`. */
export function slideKey(entry: DeckEntry): string {
    if (entry.slide === 'project') return entry.ref ?? '';
    return entry.ref === undefined ? entry.slide : `${entry.slide}:${entry.ref}`;
}

/** The `order:` lines, dropping one that names a kind the deck has no slide of. */
export function deckOrder(value: unknown): DeckEntry[] {
    if (!Array.isArray(value)) return [];
    const held: DeckEntry[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        const kind = str(item.slide);
        if (kind === undefined || !DECK_KINDS.includes(kind as DeckKind)) continue;
        const ref = str(item.ref);
        held.push(
            ref === undefined ? { slide: kind as DeckKind } : { slide: kind as DeckKind, ref }
        );
    }
    return held;
}

/** A saved list of keys, or null when the file holds none and the order alone decides. */
export function savedKeys(value: unknown): string[] | null {
    return Array.isArray(value) ? strings(value) : null;
}

/**
 * Every project slide there is, in the order the slides no `order:` line placed are appended: active
 * work first, then manuscripts, then ideas, then everything else, each by its project's title.
 */
export function deckSources(projects: Project[]): DeckSource[] {
    const rows = projects.flatMap((project) =>
        (project.present ?? []).map((slide) => ({
            id: slide.id,
            tier: project.tier,
            type: project.type ?? '',
            title: project.title
        }))
    );
    return rows.sort((left, right) => {
        const gap = (TYPE_RANK[left.type] ?? LAST_RANK) - (TYPE_RANK[right.type] ?? LAST_RANK);
        return gap !== 0 ? gap : left.title.localeCompare(right.title);
    });
}

/**
 * The entries the deck places, in order, one per key: the `order:` lines that resolve, and every
 * project slide the order did not name placed before the closing slide. A deck whose order places
 * something but names no closing slide still ends with one; a deck that places nothing holds no
 * slides at all, so the view's empty state is what a config with no `deck:` reads as.
 *
 * `all` places every project slide there is. It is false only for the deck a reader moves through
 * with nothing saved, where an unnamed slide is placed from the three open tiers alone; a saved
 * selection is the reader's own list and decides on its own, and the catalog offers all of them.
 */
export function deckEntries(order: DeckEntry[], sources: DeckSource[], all: boolean): DeckEntry[] {
    const named = new Set(
        order.filter((entry) => entry.slide === 'project').map((entry) => entry.ref ?? '')
    );
    const placed = [...order];
    if (placed.length > 0 && !placed.some((entry) => entry.slide === 'closing')) {
        placed.push({ slide: 'closing' });
    }
    const extras: DeckEntry[] = sources
        .filter((source) => !named.has(source.id))
        .filter((source) => all || OPEN_TIERS.includes(source.tier))
        .map((source) => ({ slide: 'project' as const, ref: source.id }));
    const close = placed.findIndex((entry) => entry.slide === 'closing');
    const cut = close === -1 ? placed.length : close;

    const ids = new Set(sources.map((source) => source.id));
    const kept: DeckEntry[] = [];
    const seen = new Set<string>();
    for (const entry of [...placed.slice(0, cut), ...extras, ...placed.slice(cut)]) {
        if (entry.slide === 'project' && !ids.has(entry.ref ?? '')) continue;
        const key = slideKey(entry);
        if (key === '' || seen.has(key)) continue;
        seen.add(key);
        kept.push(entry);
    }
    return kept;
}

/**
 * The entries a saved selection keeps, in the positions a saved order gives them. A key either list
 * holds for a slide that is no longer there places nothing, because the two lists are written over
 * one hub and read over whatever the hub holds now.
 */
export function deckChoice(
    entries: DeckEntry[],
    selection: string[] | null,
    slideOrder: string[] | null
): DeckEntry[] {
    const chosen =
        selection === null
            ? entries
            : entries.filter((entry) => selection.includes(slideKey(entry)));
    if (slideOrder === null) return chosen;
    const positions = slideOrder;
    const at = (key: string): number => {
        const found = positions.indexOf(key);
        return found === -1 ? positions.length : found;
    };
    return [...chosen].sort((left, right) => at(slideKey(left)) - at(slideKey(right)));
}

/**
 * Every key the deck could hold, in the order the catalog offers them: every project slide there is
 * beside the deck's own, put in the saved order. It is what the Slides view lists and what the deck
 * write checks a selection and an order against, so the two cannot disagree about what a key is. An
 * archived project's slide is in it, so the reader can put it on the deck; whether it starts ticked
 * is defaultKeys below.
 */
export function catalogKeys(
    order: DeckEntry[],
    sources: DeckSource[],
    slideOrder: string[] | null
): string[] {
    return deckChoice(deckEntries(order, sources, true), null, slideOrder).map(slideKey);
}

/**
 * The keys a deck with no saved selection shows, which is what a catalog row is ticked by until the
 * reader saves a selection of their own: the deck's own slides, the project slides its `order:`
 * places, and the unnamed ones from the three open tiers.
 */
export function defaultKeys(order: DeckEntry[], sources: DeckSource[]): string[] {
    return deckEntries(order, sources, false).map(slideKey);
}
