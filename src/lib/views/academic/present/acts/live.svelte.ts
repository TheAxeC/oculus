// Layer 3, view helper. The deck the Present pane draws: the one the files give, or, while an
// editor on the same page holds text the disk does not have and the pane is not presenting, the
// deck read over those drafts. The pane asks the deck route for that deck a twentieth of a second
// after the last keystroke and draws it in place of the one the files give; the answer to a draft
// typed over since is dropped. With no draft, or once the drafts are saved or closed, the pane
// draws the files again. The deck the pane draws is handed to the Present store's `drawing`, so a
// slide's measure stays while this pane draws a deck that holds the slide. It is called while the
// view is being initialised, since it registers its effects there and reads the Present store from
// the client state.

import type { Deck, DeckDraft, DeckRef } from '$lib/state/life/present';
import { useState } from '$lib/state/client/use';

/**
 * How long the drafts rest before the deck is asked for: short enough that the slide is drawn
 * within a quarter of a second of the last keystroke with the deck's answer included. A keystroke
 * asks at most once, and the answer to a draft typed over since is dropped.
 */
const DRAFT_REST_MS = 50;

/** What the drawn deck reads from the pane. */
type Reads = {
    ref: () => DeckRef | null;
    /** The pane's instance id, which the Present store knows the pane's deck by. */
    instance: () => string;
    /** Whether the pane shows the presenter screen, which draws the deck as the files hold it. */
    presented: () => boolean;
    /** The unsaved drafts of the source tabs of the pane's page. */
    drafts: () => DeckDraft[];
    /** The deck the files gave, which a new version of asks for the drafted deck again. */
    files: () => Deck | null;
};

/** The deck the pane draws, or null while the files have given none. */
export function createDrawn(reads: Reads): () => Deck | null {
    const {
        present: { drawn, drawing }
    } = useState();
    let live = $state<Deck | null>(null);
    const shown = $derived(reads.presented() ? reads.files() : (live ?? reads.files()));

    $effect(() => {
        const ref = reads.ref();
        const drafts = reads.presented() ? [] : reads.drafts();
        reads.files();
        if (ref === null || drafts.length === 0) {
            live = null;
            return;
        }
        let current = true;
        const timer = setTimeout(() => {
            void drawn(ref, drafts).then((answer) => {
                if (current) live = answer.deck;
            });
        }, DRAFT_REST_MS);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    });

    $effect(() => {
        const pane = reads.instance();
        drawing(pane, shown);
        return () => drawing(pane, null);
    });

    return () => shown;
}
