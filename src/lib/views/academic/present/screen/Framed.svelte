<script lang="ts">
    // Layer 3, view partial. One slide of a deck as the workbench draws it: in a Stage, in the
    // slide's shape, measured, the measure going to the Present store
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
    //
    // A slide given `turns` (an Overview tile's) is laid out at its turn on that queue, and what
    // the Stage measures while a layout waits there is a slide its layout has not caught up with.
    // The slide is handed the queue through a wrapper that notes each ask, so from any ask (the
    // first layout, a change of the slide, a font load, a probe change, an image's load or failure)
    // until that layout has run (`onlaid`) no measure goes to the store, and the finished layout
    // has the Stage measure the slide anew. A tile with a layout waiting therefore writes no
    // measure, its earlier mark and finding staying as they were, and a tile destroyed while
    // waiting writes none. A slide given no queue is measured at once.

    import Slide from '../Slide.svelte';
    import Stage from './Stage.svelte';
    import type { LayoutTurns } from './layout-turns';
    import type { Deck, DeckSlide } from '$lib/state/life/present';
    import { useState } from '$lib/state/client/use';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether the frame goes edge to edge with no line and no corner, as on the monitor. */
        bare?: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
        /** The queue the slide's layouts wait on, an Overview tile's; none: at once. */
        turns?: LayoutTurns;
        /** Told each time the slide has been laid out. */
        onlaid?: () => void;
    };

    let { row, deck, bare = false, facts, turns, onlaid }: Props = $props();

    const {
        present: { measured }
    } = useState();

    /** Whether a layout of the slide has been asked of the queue and has not run. */
    let asked = false;
    /** How many layouts have finished, which has the Stage of a tile measure anew at each. */
    let layouts = $state(0);

    /** The queue as the slide asks it: an ask starts the wait for that layout. */
    const watched = $derived.by((): LayoutTurns | undefined => {
        const queue = turns;
        if (queue === undefined) return undefined;
        return {
            ask: (job) => {
                asked = true;
                queue.ask(job);
            },
            drop: (job) => queue.drop(job)
        };
    });

    /** A measure goes to the store, unless a layout of this slide is waiting on the queue. */
    function report(over: number): void {
        if (!asked) measured(deck, row, over);
    }

    /** The slide has been laid out: what it now draws is measured. */
    function settled(): void {
        asked = false;
        layouts += 1;
        onlaid?.();
    }

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

<Stage {bare} drawing={turns === undefined ? drawing : `${drawing}${layouts}`} onmeasure={report}>
    <Slide {row} {deck} {facts} turns={watched} onlaid={settled} />
</Stage>
