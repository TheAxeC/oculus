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
    // overflow, and a bubble laid out inside either would be cut off at its edge. It is drawn on the
    // body for the same reason: a surface that filters or clips what it holds is the containing
    // block of a fixed element inside it, which reads those window coordinates from its own corner
    // and cuts the bubble at its edge, and on the body there is no such ancestor.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The words, already translated by the caller. The empty string draws no bubble at all. */
        text: string;
        /** Under the control, or beside it: the rail is narrow and has no room underneath. */
        placement?: 'below' | 'beside';
        /**
         * Make the wrapper presentational, for a control whose parent owns it by role: a tab inside
         * a tablist is not a tab any more once a generic element sits between them. Such a wrapper
         * describes nothing, so it is for a tooltip that only repeats the control's own name.
         */
        presentational?: boolean;
        /** Put a wrapper around non-control content in the tab order so its tooltip opens on focus. */
        focusable?: boolean;
        /** Fill the available width, for a control in the activity rail's fixed-width column. */
        block?: boolean;
        children: Snippet;
    };

    let {
        text,
        placement = 'below',
        presentational = false,
        focusable = false,
        block = false,
        children
    }: Props = $props();

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

    /**
     * A bubble is shown while the pointer rests on its control, and an overlay opened by a keyboard
     * shortcut takes focus without moving the pointer; the bubble would then paint over it. Focus
     * landing anywhere outside this wrapper puts the bubble away, whatever opened it.
     */
    function elsewhere(event: FocusEvent): void {
        const target = event.target;
        if (box === undefined) return;
        if (target instanceof Node && box.contains(target)) return;
        hide();
    }

    $effect(() => {
        if (!open || typeof document === 'undefined') return;
        document.addEventListener('focusin', elsewhere);
        return () => document.removeEventListener('focusin', elsewhere);
    });

    /** Move the bubble out of the wrapper's ancestors and onto the body, and take it away with it. */
    function onBody(node: HTMLElement): { destroy: () => void } {
        document.body.append(node);
        return { destroy: () => node.remove() };
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_no_noninteractive_tabindex -->
<!-- The wrapper normally takes no focus because the control inside it is focused and described.
     With focusable it wraps non-control content such as a Chip and enters the tab order so focusin
     reveals the description. -->
<span
    class="tip"
    class:block
    bind:this={box}
    role={presentational ? 'presentation' : undefined}
    tabindex={focusable ? 0 : undefined}
    aria-describedby={presentational || text === '' ? undefined : id}
    onpointerenter={later}
    onpointerleave={hide}
    onfocusin={show}
    onfocusout={hide}
    onkeydown={key}
>
    {@render children()}
    {#if text !== ''}
        <span
            {id}
            class="bubble"
            role="tooltip"
            hidden={!open}
            style="left: {left}px; top: {top}px"
            use:onBody>{text}</span
        >
    {/if}
</span>

<style>
    .tip {
        display: inline-flex;
        min-width: 0;
    }

    .tip.block {
        display: flex;
        width: 100%;
    }

    /* The control fills the wrapper, so a wrapped button is exactly as wide as the unwrapped one was
       wherever its parent stretches it: the rail's column is the case that shows it. */
    .tip > :global(*:first-child) {
        flex: 1 1 auto;
        min-width: 0;
    }

    .bubble {
        position: fixed;
        /* Drawn on the body, so it orders against the overlays rather than inside the one whose
           control it describes: above the tray, the confirm box, the palette and the key sheet. */
        z-index: 80;
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

    /* The bubble floats over whatever it explains, so it keeps more of its colour than the pane does. */
    :global(body.wall) .bubble {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The terminal shape: the same face as the rest of the theme, and a square corner. */
    :global(body.rice) .bubble {
        font-family: var(--font-mono);
        border-radius: 0;
    }
</style>
