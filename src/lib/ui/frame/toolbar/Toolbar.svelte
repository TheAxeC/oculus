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
    // The `more` button is the toolbar's own plain button drawn with Glyph, because ui/frame
    // imports nothing above ui/display, and not a ToolButton.

    import { Popover } from 'bits-ui';
    import type { Snippet } from 'svelte';
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

    let root: HTMLElement | undefined = $state();
    let run: HTMLElement | undefined = $state();
    let panel: HTMLElement | undefined = $state();
    let open = $state(false);

    /** The width of the `more` button, which is the width of a header action. */
    function openerWidth(host: HTMLElement): number {
        const probe = document.createElement('span');
        probe.style.cssText =
            'position:absolute;visibility:hidden;width:var(--bare-box, var(--header-action))';
        host.append(probe);
        const width = probe.offsetWidth;
        probe.remove();
        return width;
    }

    /** Which controls the room holds, and the line's controls marked clipped from there on. */
    function measure(): void {
        if (!overflow || root === undefined || run === undefined) return;
        const controls = Array.from(run.children).filter(
            (one): one is HTMLElement => one instanceof HTMLElement
        );
        const gap = parseFloat(getComputedStyle(run).columnGap) || 0;
        const result = fit(
            controls.map((one) => one.offsetWidth),
            root.clientWidth,
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
    }

    $effect(() => {
        if (!overflow || root === undefined || run === undefined) return;
        measure();
        return watchToolbar(root, run, measure);
    });

    /** The popover's copy of the controls shows only the ones the line is missing. */
    function markPanel(): void {
        if (panel === undefined) return;
        Array.from(panel.children).forEach((one, at) =>
            one.toggleAttribute('data-shown', at < (shown ?? 0))
        );
    }

    $effect(() => {
        markPanel();
    });

    /** The focus goes to the first control of the popover, which the shown controls are not. */
    function focusFirst(event: Event): void {
        event.preventDefault();
        markPanel();
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
                                bind:this={panel}
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
