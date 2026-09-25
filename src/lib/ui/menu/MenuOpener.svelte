<script lang="ts">
    // Layer 3, primitive. The button a Menu opens its list from, in the looks a menu takes: a word
    // with an optional glyph, the glyph alone in a narrow strip, a strip's bare icon box, an item
    // of the activity rail, drawn as ToolButton.svelte draws its rail control, and an item of the
    // status bar, drawn as ToolButton.svelte draws its status item. It
    // holds nothing: whether the list is open and what a press does are the menu's, and the menu
    // reads the button itself through `button` to give it the focus back.

    import Glyph from '../display/Glyph.svelte';
    import Tooltip from './Tooltip.svelte';

    type Props = {
        /** The button's own words, and its tooltip. */
        label: string;
        /** Whether the menu's list is open, which the button says to assistive technology. */
        open: boolean;
        onclick: () => void;
        /** The button element, bound so the menu can focus and measure it. */
        button?: HTMLButtonElement;
        glyph?: string;
        compact?: boolean;
        bare?: boolean;
        /** An item of the activity rail: the rail's square box, muted until hovered. */
        rail?: boolean;
        /**
         * An item of the status bar: the bar's height and words, `words` drawn after the glyph,
         * and the tooltip over it saying `title`.
         */
        status?: boolean;
        /** The status item's own few words, drawn in place of the label. */
        words?: string;
        /** The status item's tooltip, when it says more than the label. */
        title?: string;
        tabindex?: number;
        stop?: string;
        onkeydown?: (event: KeyboardEvent) => void;
    };

    let {
        label,
        open,
        onclick,
        button = $bindable(),
        glyph,
        compact = false,
        bare = false,
        rail = false,
        status = false,
        words = '',
        title,
        tabindex,
        stop,
        onkeydown
    }: Props = $props();
</script>

<!-- A compact menu is an icon in a narrow column, so its words go beside it; a menu that shows
     its label has room underneath. -->
<Tooltip
    text={title ?? label}
    placement={status ? 'above' : compact || rail ? 'beside' : 'below'}
    presentational={!status}
    block={rail}
>
    <button
        type="button"
        class="opener"
        class:compact
        class:bare
        class:rail
        class:status
        bind:this={button}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        data-stop={stop}
        {tabindex}
        {onclick}
        {onkeydown}
    >
        {#if glyph !== undefined}
            <Glyph name={glyph} />
        {/if}
        {#if status}
            <span class="label">{words}</span>
        {:else if !compact && !rail}
            <span class="label">{label}</span>
        {/if}
    </button>
</Tooltip>

<style>
    .opener {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 4px 6px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
    }

    .opener:hover {
        border-color: var(--accent);
    }

    .opener.compact {
        justify-content: center;
        font-size: var(--fs-lg);
    }

    .opener.bare {
        justify-content: center;
        box-sizing: border-box;
        width: auto;
        min-width: var(--tab-action);
        height: var(--tab-action);
        padding: 0 var(--tab-action-pad);
        border-color: transparent;
        background: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-lg);
        line-height: 1;
    }

    .opener.bare:hover {
        border-color: transparent;
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
    }

    .opener:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    /* The rail item's box, the same as ToolButton.svelte's rail control: square at the rail's
       width, the icon at 24 px, no border and no fill, muted until the pointer or the keyboard is
       on it, and VS Code's one pixel focus line inside the box. */
    .opener.rail {
        justify-content: center;
        height: var(--rail-width);
        box-sizing: border-box;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--rail-icon);
        line-height: 1;
    }

    .opener.rail:hover,
    .opener.rail:focus-visible,
    .opener.rail[aria-expanded='true'] {
        color: var(--ink-txt, var(--ink));
    }

    .opener.rail:focus-visible {
        outline-width: 1px;
        outline-offset: -1px;
    }

    :global(body.rice) .opener.rail :global(.glyph:not(:has(svg))) {
        font-size: var(--fs-lg);
    }

    /* The status bar's item, the same as ToolButton.svelte's status item: the bar's height, 8 px
       either side, the bar's 12 px words in its own colour, and a fill while the pointer is on it
       or its list is open. */
    .opener.status,
    :global(body.rice) .opener.status {
        box-sizing: border-box;
        width: auto;
        height: var(--status-height);
        gap: 4px;
        padding: 0 8px;
        border: 0;
        border-radius: 0;
        background: none;
        color: inherit;
        font-size: var(--status-text);
        line-height: 1;
    }

    .opener.status:hover,
    .opener.status[aria-expanded='true'] {
        background: var(--chip);
    }

    .opener.status :global(.glyph) {
        font-size: var(--status-icon);
    }

    :global(body.rice) .opener.status :global(.glyph:not(:has(svg))) {
        font-size: var(--status-text);
        width: auto;
    }
</style>
