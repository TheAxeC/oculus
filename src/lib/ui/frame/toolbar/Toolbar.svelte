<script lang="ts">
    // Layer 3, primitive. A row of controls. It is a strip and a name and nothing else: the
    // buttons, the segments and the search boxes in it are the caller's snippet. Left to itself it
    // wraps onto further lines, which is what a bar under a pane header wants.
    //
    // A pane header's toolbar asks for `overflow`: the controls are drawn on one line, as many as
    // the room holds (fit.ts), and a `more` button at the line's end opens the rest in a popover
    // built on bits-ui's Popover, which gives it Escape, a press outside, the focus leaving and the
    // focus back on the button. A control the line has no room for is out of the tab order, so Tab
    // runs from the last shown control to the button; opening the popover puts the focus on the
    // first control in it, and a press on a control closes it after the control's action ran, a
    // control that opens a menu excepted (fit.ts closesPopover), which closes it once an item of
    // its menu is picked (fit.ts picksMenuItem). The popover draws the same
    // controls again, with the shown ones hidden, so the caller writes its controls once. `shown`
    // is how many controls the line draws while some are clipped, and null while all fit; the
    // toolbar measures it itself, and a render with no layout is told it.
    //
    // The room the line has is never read from the toolbar's own box: that box is as wide as what
    // it draws, so a room read from it would grow when the `more` button is drawn and shrink when
    // it goes, and the line would change on every measure. The room is the `[data-toolbar-room]`
    // span Pane's header lays out beside the toolbar, whose width the header alone gives and the
    // toolbar's content does not size. A toolbar with no such span beside it measures nothing and
    // draws every control, with no `more` button. Every width, the room's, the controls' and the
    // button's, is read in fractional pixels, so a control 28.5625 px wide counts as 28.5625 and
    // the arithmetic matches the layout to the fraction.
    //
    // The popover stays inside the pane the toolbar is in: the pane is its collision boundary, and
    // its controls wrap onto further lines within the pane's width, read again on every measure
    // while the popover is open, so in a pane narrower than the popover's line it never lies over
    // the activity bar or a neighbouring pane.
    //
    // The `more` button is the toolbar's own plain button drawn with Glyph, because ui/frame
    // imports nothing above ui/display, and not a ToolButton.

    import { Popover } from 'bits-ui';
    import { untrack, type Snippet } from 'svelte';
    import { t } from '$lib/state/shared/words/text';
    import Glyph from '../../display/Glyph.svelte';
    import { closesPopover, fit, picksMenuItem } from './fit';
    import { watchToolbar } from './watch';

    type Props = {
        /** The strip's accessible name, already translated by the view. */
        label: string;
        /** Draw the controls on one line and put the ones without room in a popover. */
        overflow?: boolean;
        /**
         * How many controls the line draws while some are clipped, and null while all fit. Measured
         * by the toolbar; a render with no layout is told it.
         */
        shown?: number | null;
        children?: Snippet;
    };

    let { label, overflow = false, shown = $bindable(null), children }: Props = $props();

    // `bind:this` sets an element to null when it goes, so each element is null while it is not
    // drawn. The popover's box is held by markPanel(), which runs while the box is drawn.
    let root = $state<HTMLElement | null>(null);
    let run = $state<HTMLElement | null>(null);
    let panel: HTMLElement | null = null;
    let open = $state(false);
    /** The pane the toolbar is in, and its width, read while the popover is open. */
    let pane = $state<HTMLElement | null>(null);
    let paneWidth = $state(0);

    /**
     * The pane's width as the popover's limit reads it, taken when it opens and on each measure.
     */
    function readPane(): void {
        if (!open || root === null) return;
        pane = root.closest<HTMLElement>('.pane');
        paneWidth = pane?.getBoundingClientRect().width ?? 0;
    }

    $effect(readPane);

    /**
     * The box whose width is the line's room: the `[data-toolbar-room]` span Pane's header lays out
     * beside the toolbar, which the toolbar's content does not size, so the toolbar's own layout
     * cannot change it. Null where there is no such span: the toolbar then measures nothing and
     * draws every control, with no `more` button.
     */
    function roomBox(host: HTMLElement): HTMLElement | null {
        return (
            host.parentElement?.querySelector<HTMLElement>(':scope > [data-toolbar-room]') ?? null
        );
    }

    /** The width of the `more` button, which is the width of a header action. */
    function openerWidth(host: HTMLElement): number {
        const probe = document.createElement('span');
        probe.style.cssText =
            'position:absolute;visibility:hidden;width:var(--bare-box, var(--header-action))';
        host.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
    }

    /**
     * Which controls the room holds, and the line's controls marked clipped from there on. A
     * toolbar that is not laid out (its tab hidden) keeps its line until it is, since every width
     * reads zero there.
     */
    function measure(): void {
        if (!overflow || root === null || run === null) return;
        const room = roomBox(root);
        if (room === null || root.getClientRects().length === 0) return;
        const controls = Array.from(run.children).filter(
            (one): one is HTMLElement => one instanceof HTMLElement
        );
        const gap = parseFloat(getComputedStyle(run).columnGap) || 0;
        const result = fit(
            controls.map((one) => one.getBoundingClientRect().width),
            room.getBoundingClientRect().width,
            openerWidth(root),
            gap
        );
        controls.forEach((one, at) => {
            const clipped = result.opener && at >= result.shown;
            one.toggleAttribute('data-clipped', clipped);
            one.inert = clipped;
        });
        shown = result.opener ? result.shown : null;
        if (!result.opener) open = false;
        readPane();
    }

    $effect(() => {
        if (!overflow || root === null || run === null) return;
        const room = roomBox(root);
        if (room === null) return;
        // The measure reads `open` for the pane's width; the watch stays as long as the elements.
        untrack(measure);
        return watchToolbar(room, run, measure);
    });

    /**
     * The popover's copy of the controls shows only the ones the line is missing. It is the box's
     * attachment, so it runs once the box is drawn and again when `shown` changes, and ends when
     * the popover closes and the box goes; the box is held for focusFirst() only while it is drawn.
     */
    function markPanel(box: HTMLElement): () => void {
        panel = box;
        const count = shown ?? 0;
        Array.from(box.children).forEach((one, at) =>
            one.toggleAttribute('data-shown', at < count)
        );
        return () => {
            panel = null;
        };
    }

    /** The focus goes to the first control of the popover, which the shown controls are not. */
    function focusFirst(event: Event): void {
        event.preventDefault();
        const found = panel?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        Array.from(found ?? [])
            .find((one) => one.closest('[data-shown]') === null)
            ?.focus();
    }

    /** A press on a control of the popover closes it once the control has acted. */
    function pressed(event: MouseEvent): void {
        if (event.target instanceof Element && closesPopover(event.target)) open = false;
    }

    // A menu opened from the popover is drawn outside it, so a pick in that menu reaches the page,
    // not the popover's handler: while the popover is open, a pick of a menu item closes it once
    // the item has acted.
    $effect(() => {
        if (!open) return;
        const picked = (event: MouseEvent): void => {
            if (event.target instanceof Element && picksMenuItem(event.target)) open = false;
        };
        document.addEventListener('click', picked);
        return () => document.removeEventListener('click', picked);
    });
</script>

<div class="toolbar" class:overflow bind:this={root} role="toolbar" aria-label={label}>
    <div class="run" bind:this={run}>
        {#if children}
            {@render children()}
        {/if}
    </div>
    {#if overflow && shown !== null}
        <Popover.Root bind:open>
            <Popover.Trigger>
                {#snippet child({ props })}
                    <button {...props} type="button" class="more" aria-label={t('ui.toolbar_more')}>
                        <Glyph name={t('ui.toolbar_more_glyph')} />
                    </button>
                {/snippet}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="end"
                    sideOffset={4}
                    collisionBoundary={pane ?? undefined}
                    collisionPadding={4}
                    onOpenAutoFocus={focusFirst}
                >
                    {#snippet child({ wrapperProps, props })}
                        <div {...wrapperProps}>
                            <!-- A key press on a control is a click on it, which the control's
                                 button turns into this event. -->
                            <div
                                {...props}
                                class="clipped"
                                role="toolbar"
                                tabindex="-1"
                                aria-label={label}
                                style:max-width={paneWidth > 0
                                    ? `min(90vw, 320px, ${paneWidth - 8}px)`
                                    : undefined}
                                {@attach markPanel}
                                onclick={pressed}
                            >
                                {#if children}
                                    {@render children()}
                                {/if}
                            </div>
                        </div>
                    {/snippet}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    {/if}
</div>

<style>
    .toolbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
    }

    /* A bar's toolbar takes the line's width, so a filling search grows to its limit and a trailing
       status reaches the line's end. */
    .toolbar:not(.overflow) {
        flex: 1 1 auto;
    }

    /* A header's toolbar: one line, the controls 4px apart, as VS Code's pane actions are, clipped
       to its room. The controls keep their width, and the line gives way to the button. */
    .toolbar.overflow {
        flex-wrap: nowrap;
        gap: 4px;
    }

    .run {
        display: contents;
    }

    .overflow .run {
        display: flex;
        align-items: center;
        flex: 0 1 auto;
        gap: 4px;
        min-width: 0;
        overflow: hidden;
    }

    .overflow .run > :global(*) {
        flex: none;
    }

    /* A control the line has no room for is hidden whole and out of the tab order. */
    .overflow .run > :global([data-clipped]) {
        visibility: hidden;
    }

    /* The `more` button: a header action's box, the pointer's fill under it. */
    .more {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-width: var(--bare-box, var(--header-action));
        height: var(--bare-box, var(--header-action));
        padding: 0 var(--tab-action-pad);
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        line-height: 1;
        cursor: pointer;
    }

    .more:hover,
    .more[data-state='open'] {
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
    }

    .more:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* The popover is drawn on the page and not inside the pane, so it sets the header action box
       itself. It floats over the panes as a list does. */
    .clipped {
        --bare-box: var(--header-action);
        z-index: 70;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        box-sizing: border-box;
        max-width: min(90vw, 320px);
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
        outline: none;
    }

    :global(body.wall) .clipped {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .clipped > :global([data-shown]) {
        display: none;
    }
</style>
