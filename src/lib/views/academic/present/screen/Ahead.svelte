<script lang="ts">
    // Layer 3, view partial. The slides laid out ahead of being shown, the slide after the one on
    // show and then the one before it, each in a Stage of the shown slide's frame size that nobody
    // sees or reaches, so their images are loaded and their layouts kept when they are shown. The
    // box is hidden by visibility, which keeps the boxes the layout measures and leaves it out of
    // find in page, and it is inert and hidden from the accessibility tree, takes no pointer and
    // is contained, so a layout inside it does not lay out the rest of the page. It writes nothing
    // but the kept layouts: no slide in it is measured for a finding.
    //
    // The work runs on a queue of its own (layout/layout-turns.ts) whose frames are the page's idle
    // times, one job in each: a slide mounted, or one factor of its search, so a key pressed
    // meanwhile is answered between two of them. A slide is mounted once the one listed before it
    // has been laid out, and stays mounted, which keeps its images loaded. The owner draws this
    // once its own slide has been laid out and drops it at a switch of slide, and what is left of
    // the work goes with it. While the page's document is hidden nothing is mounted.

    import { flushSync } from 'svelte';
    import Slide from '../Slide.svelte';
    import Stage from './Stage.svelte';
    import { createLayoutTurns } from './layout/layout-turns';
    import type { Deck, DeckSlide } from '$lib/state/life/present';
    import type { KeptLayouts } from '$lib/state/life/present.svelte';

    type Props = {
        /** The slides, in the order they are laid out. */
        rows: readonly DeckSlide[];
        deck: Deck;
        /** Whether the frame goes edge to edge, as the shown slide's. */
        bare: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
        kept: KeptLayouts;
    };

    let { rows, deck, bare, facts, kept }: Props = $props();

    let visibility = $state<DocumentVisibilityState>('visible');
    const away = $derived(visibility === 'hidden');

    /** How many of the slides are mounted. */
    let mounted = $state(0);

    /** The page's idle times, and its next task in a browser that tells of none. */
    const idle =
        'requestIdleCallback' in window
            ? {
                  request: (run: () => void) => requestIdleCallback(run),
                  cancel: (handle: number) => cancelIdleCallback(handle)
              }
            : {
                  request: (run: () => void) => window.setTimeout(run),
                  cancel: (handle: number) => clearTimeout(handle)
              };

    const turns = createLayoutTurns({
        frames: idle,
        now: () => performance.now(),
        budget: 0,
        stepped: true
    });

    /** Mount the next slide, its cost in this turn. */
    function mount(): void {
        flushSync(() => {
            mounted += 1;
        });
    }

    /** A slide has been laid out: the one after it is mounted at its turn. */
    function laid(at: number): void {
        if (at === mounted - 1 && mounted < rows.length) turns.ask(mount);
    }

    $effect(() => {
        if (away) return;
        turns.ask(mount);
        return () => {
            turns.drop(mount);
            mounted = 0;
        };
    });
</script>

<svelte:document bind:visibilityState={visibility} />

<div class="ahead" inert aria-hidden="true">
    {#each rows.slice(0, mounted) as row, at (row.key)}
        <div class="one">
            <Stage {bare} hidden>
                <Slide {row} {deck} {facts} {turns} {kept} onlaid={() => laid(at)} />
            </Stage>
        </div>
    {/each}
</div>

<style>
    .ahead {
        position: absolute;
        inset: 0;
        visibility: hidden;
        pointer-events: none;
        contain: strict;
    }

    /* The slides lie over each other, each in the whole room. */
    .one {
        position: absolute;
        inset: 0;
    }
</style>
