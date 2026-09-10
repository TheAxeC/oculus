<script module lang="ts">
    let counter = 0;

    /** One id per tooltip on the page, so aria-describedby names this bubble and no other. */
    function nextId(): string {
        counter += 1;
        return `tip-${counter}`;
    }
</script>

<script lang="ts">
    // Layer 3, primitive. The words a control shows after the pointer rests on it, or as soon as it
    // takes focus. It wraps whatever it is given and knows nothing about it: the caller passes the
    // words, and a caller with none passes the empty string and gets a plain wrapper.
    //
    // The browser's own `title` is what this replaces. That one waits about a second, cannot be
    // styled, and never appears for a control reached by keyboard; this waits 150 ms, paints in the
    // theme's tokens, and shows on focus as well.
    //
    // The bubble is positioned in viewport coordinates rather than against the wrapper, because both
    // places it is most needed scroll: the rail's view list and the tab strip both clip their own
    // overflow, and a bubble laid out inside either would be cut off at its edge.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The words, already translated by the caller. The empty string draws no bubble at all. */
        text: string;
        /** Under the control, or beside it: the rail is 52 px wide and has no room underneath. */
        placement?: 'below' | 'beside';
        /**
         * Make the wrapper presentational, for a control whose parent owns it by role: a tab inside
         * a tablist is not a tab any more once a generic element sits between them. Such a wrapper
         * describes nothing, so it is for a tooltip that only repeats the control's own name.
         */
        presentational?: boolean;
        children: Snippet;
    };

    let { text, placement = 'below', presentational = false, children }: Props = $props();

    /** How long the pointer rests before the words appear. */
    const DELAY = 150;

    /** The gap between the control and the bubble. */
    const GAP = 6;

    /** How near the right edge of the window the bubble may be laid out. */
    const MARGIN = 8;

    const id = nextId();

    let box: HTMLElement | undefined = $state();
    let open = $state(false);
    let left = $state(0);
    let top = $state(0);
    let timer: ReturnType<typeof setTimeout> | null = null;

    /** Where the bubble goes, in viewport coordinates, measured at the moment it is shown. */
    function place(): void {
        if (box === undefined) return;
        const rect = box.getBoundingClientRect();
        const x = placement === 'beside' ? rect.right + GAP : rect.left;
        const y = placement === 'beside' ? rect.top : rect.bottom + GAP;
        const width = typeof window === 'undefined' ? 0 : window.innerWidth;
        left = width === 0 ? x : Math.max(0, Math.min(x, width - MARGIN));
        top = y;
    }

    function show(): void {
        if (text === '') return;
        place();
        open = true;
    }

    function later(): void {
        if (text === '') return;
        stop();
        timer = setTimeout(show, DELAY);
    }

    function stop(): void {
        if (timer === null) return;
        clearTimeout(timer);
        timer = null;
    }

    function hide(): void {
        stop();
        open = false;
    }

    function key(event: KeyboardEvent): void {
        if (event.key === 'Escape') hide();
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- The wrapper is not a control and takes no focus: the handlers only decide when the words are
     drawn, and the control inside it is what is pressed, focused and described. -->
<span
    class="tip"
    bind:this={box}
    role={presentational ? 'presentation' : undefined}
    aria-describedby={presentational || text === '' ? undefined : id}
    onpointerenter={later}
    onpointerleave={hide}
    onfocusin={show}
    onfocusout={hide}
    onkeydown={key}
>
    {@render children()}
    {#if text !== ''}
        <span {id} class="bubble" role="tooltip" hidden={!open} style="left: {left}px; top: {top}px"
            >{text}</span
        >
    {/if}
</span>

<style>
    .tip {
        display: inline-flex;
        min-width: 0;
    }

    /* The control fills the wrapper, so a wrapped button is exactly as wide as the unwrapped one was
       wherever its parent stretches it: the rail's column is the case that shows it. */
    .tip > :global(*:first-child) {
        flex: 1 1 auto;
        min-width: 0;
    }

    .bubble {
        position: fixed;
        z-index: 40;
        max-width: 280px;
        padding: 3px 6px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-xs);
        line-height: 1.3;
        white-space: normal;
        pointer-events: none;
    }

    /* The terminal shape: the same face as the rest of the theme, and a square corner. */
    :global(body.rice) .bubble {
        font-family: var(--font-mono);
        border-radius: 0;
    }
</style>
