// Layer 3, view helper. The presenter screen as one Present pane drives it: the press that starts
// it over the deck as saved, with the link the presenting store reads the pane through (the slide
// it is on and the kept list of its filter, each read from the pane's saved state at the call, so
// the presentation goes on while the pane is not drawn), and, while it is on, the audience window
// told which slide is on and when the deck was read again, and the presentation ended with the
// deck's last slide gone. The presentation is the page's (state/life/present.svelte.ts). It is
// called while the view is being initialised, since it registers its effects there.

import {
    parsePresentState,
    type Deck,
    type DeckRef,
    type DeckSlide
} from '$lib/state/life/present';
import type { Keep, PresentLink } from '$lib/state/life/present.svelte';
import { useState } from '$lib/state/client/use';

/** What the presentation reads from the pane. */
type Reads = {
    instance: () => string;
    ref: () => DeckRef | null;
    /** Whether the pane shows the presenter screen. */
    presented: () => boolean;
    shown: () => DeckSlide | null;
    /** The slides of the deck the pane draws. */
    rows: () => DeckSlide[];
    /** The deck as saved under the pane's kept list, which the audience window draws. */
    files: () => Deck | null;
    /** The kept list of a pane by its instance id, read from its saved state at the call. */
    keepFor: (instance: string, ref: DeckRef) => Keep;
    focus: () => void;
};

/** Start the presenter screen over the deck as saved, and the audience window beside it. */
export function createPresentation(reads: Reads): () => void {
    const {
        layout: { holding },
        present: { presenting },
        ui: { instanceState, setInstanceState }
    } = useState();

    $effect(() => {
        const shown = reads.shown();
        if (reads.presented() && shown !== null) presenting.send(reads.instance(), shown.key);
    });
    let sentDeck: Deck | null = null;
    $effect(() => {
        const read = reads.files();
        if (reads.presented() && sentDeck !== null && read !== sentDeck) {
            presenting.changed(reads.instance());
        }
        sentDeck = read;
    });
    $effect(() => {
        if (reads.presented() && reads.rows().length === 0) presenting.end(reads.instance());
    });

    return () => {
        const ref = reads.ref();
        if (ref === null || reads.rows().length === 0) return;
        const id = reads.instance();
        const link: PresentLink = {
            current: () => parsePresentState(instanceState(id)).slide,
            keep: () => reads.keepFor(id, ref),
            show: (key) =>
                setInstanceState(id, { ...parsePresentState(instanceState(id)), slide: key }),
            held: () => holding(id) !== null
        };
        presenting.start(id, ref, link);
        reads.focus();
    };
}
