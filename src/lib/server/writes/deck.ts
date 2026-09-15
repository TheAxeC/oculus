// Layer 2, server. The deck's saved selection and slide order, written into config/present.yml.
//
// It is the one write that touches an engine file rather than the hub: the deck is oculus's
// configuration, not the researcher's data. The file and the `deck:` map it holds are both on the
// PortfolioConfig the request already carries, so nothing here reads the config a second time. The
// watcher watches `config/`, so the file this writes is pushed on the `config` channel within a
// second and every open Present view redraws from it; there is no build step and nothing to
// invalidate.
//
// What may be written is the catalog data/deck.ts computes over this engine's deck and the projects
// of the snapshot, which is the same list the Slides view offers: every project slide there is, an
// archived project's included, so a reader can put one on the deck. A key outside it, a repeated
// key, an empty selection and an order that is not the whole catalog are each refused and the file
// is left exactly as it was, and so is a file the edit could not keep or could not read.

import { readFileSync, writeFileSync } from 'node:fs';
import { catalogKeys, deckOrder, deckSources, savedKeys } from '../../data/deck.ts';
import { fields } from '../../data/guards.ts';
import { setDeckLists } from '../deck-edit.ts';
import type { PortfolioConfig, Project } from '../../data/model.ts';

/** What a deck write answers with: what it changed, or the one word saying what was wrong. */
export type DeckOutcome =
    { changed: string[]; refused: [] } | { error: 'invalid' | 'invalid_order' | 'unwritable' };

/** Whether every entry of a list is a key the catalog holds, each at most once. */
function known(keys: string[], catalog: Set<string>): boolean {
    return new Set(keys).size === keys.length && keys.every((key) => catalog.has(key));
}

/**
 * Write the deck's selection and order. `selection` is which slides the deck shows and `order` is
 * where every slide of the catalog sits, shown or not, so unchecking a slide and checking it again
 * later brings it back where it was.
 */
export function writeDeck(
    config: PortfolioConfig,
    projects: Project[],
    selection: string[],
    order: string[]
): DeckOutcome {
    const deck = fields(config.deck);
    const catalog = catalogKeys(
        deckOrder(deck.order),
        deckSources(projects),
        savedKeys(deck.slide_order)
    );
    const held = new Set(catalog);
    if (selection.length === 0 || !known(selection, held)) return { error: 'invalid' };
    if (order.length !== catalog.length || !known(order, held)) return { error: 'invalid_order' };

    const path = config.deckFile;
    let source: string;
    try {
        source = readFileSync(path, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    const kept = order.filter((key) => selection.includes(key));
    const text = setDeckLists(source, { selection: kept, slideOrder: order });
    if (text === null) return { error: 'invalid' };
    if (text === source) return { changed: [], refused: [] };
    try {
        writeFileSync(path, text, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    return { changed: ['deck'], refused: [] };
}
