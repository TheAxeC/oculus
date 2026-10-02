<script module lang="ts">
    // Layer 3, view registration. Present is the Present page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'present',
        label: 'views.present',
        glyph: 'views.present_glyph',
        group: 'present',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The public slide deck, live: one slide filling the pane, the arrow keys and
    // the toolbar to move through it, and `O` for the grid of the whole deck.
    //
    // A slide is drawn in a frame of 1280 by 720 px, the size its parts are laid out for, scaled
    // uniformly by `fit` to the pane and centred in it, so a slide keeps its proportions and its
    // words shrink or grow with the pane as a slide program's do. The frame draws its own surface
    // (the card colour, translucent over a wallpaper) and carries the slide type scale, in px at
    // the design size and multiplied by the text size. A slide taller than the frame scrolls
    // inside it. The overview grid and the empty state are not scaled and keep the UI's tokens.
    //
    // The deck is not a file this builds and it is not a copy of one: the deck-level slides are
    // config/present.yml and the project slides are the PRESENT.md front matter the snapshot
    // carries, so a slide edited on disk is the slide on screen at the next push.
    //
    // Where the reader is, and whether the grid is open, belong to the instance rather than to the
    // store, so two panes on the deck hold two positions and a push that rebuilds the deck leaves
    // each reader where they were. The instance's `slide` is the same key a project card sets.
    //
    // The keys are the pane's own, bound to the view's box rather than to the window: the shell
    // owns the digits and the chords, and a deck that swallowed an arrow key wherever the reader
    // was looking would take the pane strip's own keys with it. The box takes the focus when the
    // view is mounted and on a press inside it, so the arrows work from the moment the deck is
    // opened.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Overview from './Overview.svelte';
    import Slide from './Slide.svelte';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        FRAME_HEIGHT,
        FRAME_WIDTH,
        fit,
        parsePresentState,
        type PresentState
    } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        layout: { openBeside },
        present: { current, first, last, next, position, previous, slides },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    let box = $state<HTMLElement | null>(null);

    /** The deck box's measured size, 0 until it has been laid out and while its tab is hidden. */
    let width = $state(0);
    let height = $state(0);
    const scale = $derived(fit(width, height));

    const held = $derived(parsePresentState(instanceState(instance.id)));
    const rows = $derived(slides());
    const shown = $derived(current(held.slide));
    const grid = $derived(held.overview);
    /** The shell's card cursor, which the overview grid's tiles carry as every card list does. */
    const cursor = $derived(cardCursor(instance.state));

    /**
     * Keep the pane's own place with the instance, so the pane is where it was when its page comes
     * back.
     */
    function write(changes: Partial<PresentState>): void {
        setInstanceState(instance.id, { ...held, ...changes });
    }

    // The box is what the keys are bound to, so it takes the focus as soon as it exists: a reader
    // who opens the deck from the rail presses an arrow next, not a control. It never takes the
    // keyboard from a control the reader is typing in or from another pane the reader is inside: a
    // page switch mounts every view of the page again, and the deck is not what they were doing.
    $effect(() => {
        if (box === null) return;
        const active = document.activeElement;
        const held =
            active !== null &&
            active !== document.body &&
            !box.contains(active) &&
            (active.closest('[data-pane-page]') !== null ||
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement);
        if (!held) box.focus();
    });

    /**
     * Move, and put the keys in force, so the next arrow key reaches this pane and not the shell.
     */
    function step(by: number): void {
        write({ slide: by > 0 ? next(held.slide) : previous(held.slide) });
        box?.focus();
    }

    function keys(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        switch (event.key) {
            case 'ArrowRight':
            case 'PageDown':
                event.preventDefault();
                write({ slide: next(held.slide) });
                return;
            case 'ArrowLeft':
            case 'PageUp':
                event.preventDefault();
                write({ slide: previous(held.slide) });
                return;
            case 'Home':
                event.preventDefault();
                write({ slide: first() });
                return;
            case 'End':
                event.preventDefault();
                write({ slide: last() });
                return;
            case 'o':
            case 'O':
                event.preventDefault();
                write({ overview: !grid });
                return;
            case 'Escape':
                if (!grid) return;
                event.preventDefault();
                write({ overview: false });
                return;
            default:
        }
    }

    /** Show a slide picked in the grid, and close the grid over it. */
    function pick(key: string): void {
        write({ slide: key, overview: false });
        box?.focus();
    }
</script>

{#snippet bar()}
    <Toolbar label={t('present.toolbar')}>
        <ToolButton
            label={t('present.previous')}
            onclick={() => step(-1)}
            disabled={rows.length === 0}
        />
        <ToolButton
            label={t('present.next')}
            onclick={() => step(1)}
            disabled={rows.length === 0}
        />
        <Chip
            label={t('present.overview')}
            glyph={t('present.overview_glyph')}
            pressed={grid}
            onclick={() => {
                write({ overview: !grid });
                box?.focus();
            }}
        />
        <ToolButton
            label={t('slides.open')}
            title={t('slides.open_tip')}
            onclick={() => {
                openBeside('slides');
            }}
        />
        <span class="counter"
            >{t('present.counter', String(position(held.slide)), String(rows.length))}</span
        >
    </Toolbar>
{/snippet}

<Pane title={t('present.title')} {bar}>
    <!-- The box is the deck's own key surface: it is focusable and named as a region, and the keys
         it takes move the reader through the deck rather than acting on the box itself. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="present"
        class:framed={!grid && shown !== null}
        data-instance={instance.id}
        data-slide-key={shown?.key ?? ''}
        role="region"
        aria-label={t('present.title')}
        tabindex="-1"
        bind:this={box}
        bind:clientWidth={width}
        bind:clientHeight={height}
        onkeydown={keys}
        onpointerdown={() => box?.focus()}
    >
        {#if rows.length === 0}
            <Empty message={t('present.empty')} glyph={t('present.empty_glyph')} />
        {:else if grid}
            <Overview {rows} current={shown?.key ?? ''} {cursor} onpick={pick} />
        {:else if shown !== null}
            <div
                class="stage"
                style:width="{FRAME_WIDTH * scale}px"
                style:height="{FRAME_HEIGHT * scale}px"
            >
                <div
                    class="frame"
                    data-frame
                    data-scroll
                    style:width="{FRAME_WIDTH}px"
                    style:height="{FRAME_HEIGHT}px"
                    style:transform="scale({scale})"
                    style:visibility={scale === 0 ? 'hidden' : undefined}
                >
                    <Slide row={shown} />
                </div>
            </div>
        {/if}
    </div>
</Pane>

<style>
    .present {
        min-height: 100%;
        outline: none;
    }

    /* A slide fills the pane's body and is centred in it; what is not the frame's is letterbox. */
    .present.framed {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        overflow: hidden;
    }

    /* The box the scaled frame occupies on screen: the frame's transform does not change its layout
       size, so this box is the one that takes room. */
    .stage {
        flex: 0 0 auto;
    }

    /* The frame is laid out at the design size and scaled from its top left corner. The slide
       type scale is in px at that size and follows the text size; the padding and the reading
       width are px of the frame too. */
    .frame {
        --slide-fs-title: calc(56px * var(--text-scale, 1));
        --slide-fs-h: calc(36px * var(--text-scale, 1));
        --slide-fs-sub: calc(28px * var(--text-scale, 1));
        --slide-fs-body: calc(24px * var(--text-scale, 1));
        --slide-fs-small: calc(18px * var(--text-scale, 1));
        --slide-reading: 1040px;
        box-sizing: border-box;
        padding: 64px;
        overflow-y: auto;
        transform-origin: 0 0;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
        color: var(--ink-txt, var(--ink));
        font-size: var(--slide-fs-body);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .frame {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The place in the deck closes the bar. */
    .counter {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }
</style>
