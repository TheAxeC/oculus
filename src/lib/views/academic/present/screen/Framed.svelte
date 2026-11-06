<script lang="ts">
    // Layer 3, view partial. One slide of a deck as the workbench draws it: in a Stage at the
    // deck's frame, measured, the measure going to the Present store
    // (state/life/present.svelte.ts), which makes a slide too tall a finding of the Findings view
    // and a mark on its Overview tile. A slide lays its figures out inside its frame and draws its
    // text as large as fits (Slide.svelte), so it is too tall only when its text, or a figure with
    // its caption, does not fit at the least size. The Present pane, both slides of its presenter
    // screen and the Overview's tiles draw a slide through this, so every slide the workbench
    // draws is measured the one way; the audience window draws its Stage itself and measures
    // nothing. The Stage is told what it draws (the deck's root and folder, the slide's key, its
    // title and the file and line it is written at), so a pane moved to another slide, a slide
    // given another title or a slide moved in its file is measured again and its finding names
    // the slide as drawn. The strip of a project's facts shows its words by the pane's Project
    // facts toggle (`facts`), and keeps its room either way, so the measure does not change with
    // the toggle.

    import Slide from '../Slide.svelte';
    import Stage from './Stage.svelte';
    import type { Deck, DeckSlide } from '$lib/state/life/present';
    import { useState } from '$lib/state/client/use';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether the frame goes edge to edge with no border and no corner, as on the monitor. */
        bare?: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
    };

    let { row, deck, bare = false, facts }: Props = $props();

    const {
        present: { measured }
    } = useState();

    const drawing = $derived(
        JSON.stringify([
            deck.root,
            deck.path,
            row.key,
            row.title,
            row.source?.path,
            row.source?.line
        ])
    );
</script>

<Stage frame={deck.frame} {bare} {drawing} onmeasure={(over: number) => measured(deck, row, over)}>
    <Slide {row} {deck} {facts} />
</Stage>
