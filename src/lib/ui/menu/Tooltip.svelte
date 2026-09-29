<script lang="ts">
    // Layer 3, primitive. The words a control shows after the pointer rests on it, or as soon as
    // the keyboard brings the focus to it. It wraps whatever it is given and knows nothing about
    // it: the caller passes the words, and a caller with none passes the empty string and gets a
    // plain wrapper.
    //
    // The browser's own `title` is what this replaces. That one waits about a second, cannot be
    // styled, and never appears for a control reached by keyboard; this waits 150 ms, paints in the
    // theme's tokens, and shows on keyboard focus as well.
    //
    // The bubble is bits-ui's Tooltip: the wrapper is its trigger, and the bubble is drawn on the
    // body through its Portal and placed by its floating positioning, which keeps it inside the
    // window, since both places it is most needed scroll and clip what they hold: the rail's list
    // of pages and the tab strip. The pointer's rest, the delay and the press that puts the bubble
    // away are bits-ui's: a press puts it away until the pointer has left the control and rested on
    // it again. A pointer that arrives with a button held is a drag passing over it, which opens no
    // words, as no hover opens during a drag in VS Code.
    //
    // It draws bits-ui's Root alone: the Provider is ui/menu/TooltipGroup.svelte's, one for the
    // whole page, so a bubble opening closes the one that was open, and bits-ui refuses a tooltip
    // drawn outside the group.
    //
    // The focus is this wrapper's own, since the control the reader focuses is inside the trigger
    // and a focus there reaches the trigger only as `focusin`: focus shows the words only when the
    // browser draws the control's focus ring, which is its answer to whether the focus came from
    // the keyboard, and never for the focus the page gives through `focusQuietly` of
    // ui/frame/quiet-focus.ts: a closing menu's back to its opener, and a dialog's.
    //
    // The description is always on: the control carries `aria-describedby` naming a hidden copy of
    // the words kept in place under the page's own tooltip id (ui/menu/tip-ids.ts), so a screen
    // reader has the words whether or not the bubble is showing.

    import { Tooltip } from 'bits-ui';
    import { QUIET_FOCUS } from '$lib/ui/frame/quiet-focus';
    import { DELAY, describedBy, describedControl } from '$lib/ui/menu/tooltip-rules';
    import { useTipIds } from '$lib/ui/menu/tip-ids';
    import type { Snippet } from 'svelte';

    type Props = {
        /** The words, already translated by the caller. The empty string draws no bubble at all. */
        text: string;
        /**
         * Under the control, beside it, or over it: the rail is narrow and has no room underneath,
         * and the status bar is the window's foot, with nothing under it.
         */
        placement?: 'below' | 'beside' | 'above';
        /**
         * Make the wrapper presentational, for a control whose parent owns it by role: a tab inside
         * a tablist is not a tab any more once a generic element sits between them. Such a wrapper
         * describes nothing, so it is for a tooltip that only repeats the control's own name.
         */
        presentational?: boolean;
        /**
         * Put a wrapper around non-control content in the tab order so its tooltip opens when the
         * keyboard brings the focus to it, which `:focus-visible` answers; a click on it opens
         * none.
         */
        focusable?: boolean;
        /** Fill the available width, for a control in the activity rail's fixed-width column. */
        block?: boolean;
        /**
         * The element the words describe, where it is not the control inside the wrapper: a tree
         * row, whose focus sits on the row around the button the wrapper holds.
         */
        describes?: HTMLElement;
        /**
         * The element a pointer resting on opens the words, where it is wider than the wrapper: a
         * tree row, whose line is what a reader points at and whose name is the wrapper. The
         * bubble is still laid out beside the wrapper, which is where the words belong.
         */
        over?: HTMLElement;
        children: Snippet;
    };

    let {
        text,
        placement = 'below',
        presentational = false,
        focusable = false,
        block = false,
        describes,
        over,
        children
    }: Props = $props();

    /** The gap between the control and the bubble; a bubble beside it has its arrow across it. */
    const GAP = 6;

    /** How near the window's edges the bubble may be laid out. */
    const MARGIN = 8;

    const id = useTipIds().nextTipId();

    let box: HTMLElement | undefined = $state();
    let open = $state(false);
    let timer: ReturnType<typeof setTimeout> | null = null;

    const side = $derived(
        placement === 'beside' ? 'right' : placement === 'above' ? 'top' : 'bottom'
    );

    /**
     * The trigger's attributes as the wrapper takes them: a button's `type` means nothing on it,
     * its tab stop is `focusable`'s to say, and the description is the control's, not the
     * wrapper's, which a presentational wrapper would lose its role for carrying.
     */
    function wrapperOf(given: unknown): Record<string, unknown> {
        const props = given as Record<string, unknown>;
        const { type: _type, tabindex: _tabindex, 'aria-describedby': _described, ...rest } = props;
        return rest;
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

    /** A pointer arriving with a button held is a drag: the trigger's own rest is not started. */
    function dragging(event: PointerEvent): void {
        if (event.buttons !== 0) event.preventDefault();
    }

    /**
     * The trigger's own focus and blur are left out: the wrapper is not what takes the focus, and
     * the focus that does come is answered by `focused` and `left` below.
     */
    function passed(event: FocusEvent): void {
        event.preventDefault();
    }

    /**
     * Focus shows the words only when it came from the keyboard, which `:focus-visible` answers,
     * and only when the reader moved it: a focus the page gives, a closing menu's back to its
     * opener or a dialog's, is marked through `focusQuietly` and opens none.
     */
    function focused(event: FocusEvent): void {
        const target = event.target;
        if (!(target instanceof Element) || target.closest(`[${QUIET_FOCUS}]`) !== null) return;
        if (target.matches(':focus-visible')) {
            stop();
            open = true;
        }
    }

    /** The focus leaving the wrapper puts the words away. */
    function left(event: FocusEvent): void {
        const next = event.relatedTarget;
        if (box !== undefined && next instanceof Node && box.contains(next)) return;
        hide();
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

    /**
     * Escape puts the bubble away and goes on to whatever else answers it: the bubble is closed
     * before the key reaches bits-ui's own Escape layer, which would otherwise take the key and
     * keep it from the shell.
     */
    function escaped(event: KeyboardEvent): void {
        if (event.key === 'Escape') hide();
    }

    function later(event: PointerEvent): void {
        if (event.buttons !== 0) return;
        stop();
        timer = setTimeout(() => {
            timer = null;
            open = true;
        }, DELAY);
    }

    $effect(() => {
        if (over === undefined || text === '') return;
        const source = over;
        source.addEventListener('pointerenter', later);
        source.addEventListener('pointerleave', hide);
        source.addEventListener('pointerdown', hide);
        return () => {
            source.removeEventListener('pointerenter', later);
            source.removeEventListener('pointerleave', hide);
            source.removeEventListener('pointerdown', hide);
        };
    });

    $effect(() => {
        if (!open || typeof document === 'undefined') return;
        document.addEventListener('focusin', elsewhere);
        document.addEventListener('keydown', escaped, true);
        return () => {
            document.removeEventListener('focusin', elsewhere);
            document.removeEventListener('keydown', escaped, true);
        };
    });

    $effect(() => stop);

    // The words' id goes on the control once it is in the document: the control is what the
    // reader focuses, so it is what the description hangs on.
    $effect(() => {
        const wanted = describedBy(id, text, presentational);
        const node = describes ?? (box === undefined ? null : describedControl(box, focusable));
        if (node === null) return;
        if (wanted === '') {
            node.removeAttribute('aria-describedby');
            return;
        }
        node.setAttribute('aria-describedby', wanted);
        return () => node.removeAttribute('aria-describedby');
    });
</script>

<!-- The wrapper normally takes no focus because the control inside it is focused and described; the
     description is put on that control on mount and the wrapper carries none. With focusable it
     wraps non-control content such as a Chip and enters the tab order, and is described itself. -->
{#if text === ''}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <span
        class="tip"
        class:block
        role={presentational ? 'presentation' : undefined}
        tabindex={focusable ? 0 : undefined}
        bind:this={box}
    >
        {@render children()}
    </span>
{:else}
    <Tooltip.Root bind:open>
        <Tooltip.Trigger
            onpointerenter={dragging}
            onpointermove={dragging}
            onfocus={passed}
            onblur={passed}
        >
            {#snippet child({ props })}
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <span
                    {...wrapperOf(props)}
                    class="tip"
                    class:block
                    role={presentational ? 'presentation' : undefined}
                    tabindex={focusable ? 0 : undefined}
                    bind:this={box}
                    onfocusin={focused}
                    onfocusout={left}
                >
                    {@render children()}
                    <span {id} class="words" hidden>{text}</span>
                </span>
            {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Portal>
            <Tooltip.Content
                {side}
                align={placement === 'beside' ? 'center' : 'start'}
                sideOffset={placement === 'beside' ? 0 : GAP}
                collisionPadding={MARGIN}
                strategy="fixed"
            >
                {#snippet child({ wrapperProps, props })}
                    <div {...wrapperProps}>
                        <div
                            {...props}
                            class="bubble"
                            class:beside={placement === 'beside'}
                            role="tooltip"
                        >
                            {text}
                            {#if placement === 'beside'}
                                <Tooltip.Arrow>
                                    {#snippet child({ props: arrow })}
                                        <span {...arrow} class="arrow"></span>
                                    {/snippet}
                                </Tooltip.Arrow>
                            {/if}
                        </div>
                    </div>
                {/snippet}
            </Tooltip.Content>
        </Tooltip.Portal>
    </Tooltip.Root>
{/if}

<style>
    .tip {
        display: inline-flex;
        min-width: 0;
    }

    .tip.block {
        display: flex;
        width: 100%;
    }

    /* The control fills the wrapper, so a wrapped button is exactly as wide as the unwrapped one
       was wherever its parent stretches it: the rail's column is the case that shows it. */
    .tip > :global(*:first-child) {
        flex: 1 1 auto;
        min-width: 0;
    }

    .bubble {
        position: relative;
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

    /* A bubble beside its control points at it, as VS Code's hover beside an activity item does:
       bits-ui's arrow, drawn as a triangle across the gap pointing down and turned by bits-ui to
       face the control, its outline in the bubble's border and its inside in the bubble's fill,
       one pixel in so the border between them does not show. */
    .arrow {
        width: 12px;
        height: 6px;
    }

    .arrow::before,
    .arrow::after {
        content: '';
        position: absolute;
        left: 0;
        width: 0;
        height: 0;
        border: 6px solid transparent;
        border-bottom: 0;
    }

    .arrow::before {
        top: 0;
        border-top-color: var(--line);
    }

    .arrow::after {
        top: -1px;
        border-top-color: var(--panel);
    }

    /* The bubble floats over whatever it explains, so it keeps more of its colour than the pane
       does. */
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
