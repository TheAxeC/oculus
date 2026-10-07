// Layer 3, view helper. The deck the Present pane draws while an editor on the same page holds text
// the disk does not have: the pane asks the deck route for the deck read over those drafts, a
// twentieth of a second after the last keystroke, and draws that deck in place of the one the files
// give. With no draft, or once the drafts are saved or closed, there is no live deck and the pane
// reads the files again. It is called while the view is being initialised, since it registers its
// effect there.

import type { Deck, DeckDraft, DeckRef } from '$lib/state/life/present';

/**
 * How long the drafts rest before the deck is asked for: short enough that the slide is drawn
 * within a quarter of a second of the last keystroke with the deck's answer included. A keystroke
 * asks at most once, and the answer to a draft typed over since is dropped.
 */
const DRAFT_REST_MS = 50;

/** What the live deck reads from the pane. */
type Reads = {
    ref: () => DeckRef | null;
    /** The unsaved drafts of the source tabs of the pane's page. */
    drafts: () => DeckDraft[];
    /** The deck the files gave, which a new version of asks for the drafted deck again. */
    files: () => Deck | null;
    drawn: (ref: DeckRef, drafts: DeckDraft[]) => Promise<{ deck: Deck | null }>;
};

/** The drafted deck, or null while there is no draft to draw. */
export function createLive(reads: Reads): () => Deck | null {
    let live = $state<Deck | null>(null);

    $effect(() => {
        const ref = reads.ref();
        const drafts = reads.drafts();
        reads.files();
        if (ref === null || drafts.length === 0) {
            live = null;
            return;
        }
        let current = true;
        const timer = setTimeout(() => {
            void reads.drawn(ref, drafts).then((answer) => {
                if (current) live = answer.deck;
            });
        }, DRAFT_REST_MS);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    });

    return () => live;
}
