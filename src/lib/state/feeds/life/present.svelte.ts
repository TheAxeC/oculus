// Layer 2, client state. What the public deck holds, derived from what the socket delivered.
//
// The deck itself is derived, not stored: the deck-level slides come from the merged config and the
// project slides from the portfolio snapshot, so a PRESENT.md saved or a line of config/present.yml
// changed reaches the open view on the next push with nothing to invalidate.
//
// Where a reader is in the deck is not here. It belongs to the pane, in the instance state of
// state/workbench/ui.svelte.ts, so two Present panes hold two positions, a pane is on its slide
// when its page comes back, and the slide a project card opens the deck at is the same key. Every
// reader below therefore takes that key and answers over the deck, holding nothing of its own.

import { item } from '../../../data/helpers/guards.ts';
import { deckCatalog, deckDefaultKeys, deckFrom, deckSlides } from './present.ts';
import type { EntitiesStore } from '../../stores/shapes.ts';
import type { Deck, DeckSlide, PresentSlide, Project } from '../../../data/model/index.ts';

export type PresentStore = {
    /** The deck of config/present.yml as it currently stands. */
    deck: () => Deck;
    /** Every slide the deck shows, in order. */
    slides: () => DeckSlide[];
    /** Every slide the deck could show, in catalog order, whatever the saved selection keeps. */
    catalog: () => DeckSlide[];
    /** The keys a deck with no saved selection shows, which is what a catalog row is ticked by. */
    defaults: () => string[];
    /**
     * The slide a key names, the first slide when the deck does not hold it, null for an empty
     * deck.
     */
    current: (key: string) => DeckSlide | null;
    /** The position of that slide, counting from one; zero for an empty deck. */
    position: (key: string) => number;
    /** The key one slide on, stopping at the last; the key given back for an empty deck. */
    next: (key: string) => string;
    /** The key one slide back, stopping at the first. */
    previous: (key: string) => string;
    /** The key of the deck's first slide, and of its last. */
    first: () => string;
    last: () => string;
    /** The project slide behind a row, or null for a deck-level row. */
    slideOf: (key: string) => PresentSlide | null;
    /** The project a row belongs to, or null for a deck-level row. */
    projectOf: (key: string) => Project | null;
};

export function createPresent(entities: EntitiesStore): PresentStore {
    const deck = $derived(deckFrom(entities.config()?.config ?? {}));
    const projects = $derived(Object.values(entities.portfolio()?.entities.projects ?? {}));
    const slides = $derived(deckSlides(deck, projects));
    const catalog = $derived(deckCatalog(deck, projects));
    const defaults = $derived(deckDefaultKeys(deck, projects));

    /** Where a key sits in the deck, and the first slide when the deck does not hold it. */
    function at(key: string): number {
        const found = slides.findIndex((slide) => slide.key === key);
        return found === -1 ? 0 : found;
    }

    function current(key: string): DeckSlide | null {
        return item(slides, at(key)) ?? null;
    }

    function step(key: string, by: number): string {
        const next = Math.min(Math.max(at(key) + by, 0), slides.length - 1);
        return item(slides, next)?.key ?? key;
    }

    /** The project a key names, which is the project half of the slide id for a project row. */
    function projectOf(key: string): Project | null {
        const id = key.split('/')[0];
        return projects.find((project) => project.id === id) ?? null;
    }

    function slideOf(key: string): PresentSlide | null {
        return projectOf(key)?.present?.find((slide) => slide.id === key) ?? null;
    }

    return {
        deck: () => deck,
        slides: () => slides,
        catalog: () => catalog,
        defaults: () => defaults,
        current,
        position: (key: string) => (slides.length === 0 ? 0 : at(key) + 1),
        next: (key: string) => step(key, 1),
        previous: (key: string) => step(key, -1),
        first: () => item(slides, 0)?.key ?? '',
        last: () => item(slides, slides.length - 1)?.key ?? '',
        slideOf,
        projectOf
    };
}
