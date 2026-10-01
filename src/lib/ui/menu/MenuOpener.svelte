<script lang="ts">
    // Layer 3, primitive. The button a Menu opens its list from, in the looks a menu takes: a word
    // with an optional glyph, the glyph alone in a narrow strip, a strip's bare icon box, an item
    // of the activity rail, drawn as ToolButton.svelte draws its rail control, an item of the
    // status bar, drawn as ToolButton.svelte draws its status item, and the dropdown part of a
    // joined primary ToolButton.svelte, in the same fill. It holds nothing: it is the
    // trigger of the menu's bits-ui Dropdown Menu, whose attributes and handlers the menu hands it
    // as `trigger`, so whether the list is open, what a press or a key does and what the button
    // says to assistive technology are the menu's.

    import Glyph from '../display/Glyph.svelte';
    import Tooltip from './Tooltip.svelte';

    type Props = {
        /** The button's own words, and its tooltip. */
        label: string;
        /**
         * The attributes and handlers of the menu's trigger: its id, whether the list is open, and
         * the press and the keys that open it.
         */
        trigger: Record<string, unknown>;
        /** The button element, bound so the menu can give it the focus back. */
        button?: HTMLButtonElement;
        glyph?: string;
        compact?: boolean;
        bare?: boolean;
        /** A bare opener's glyph in the ink of what it sits in rather than muted. */
        inherit?: boolean;
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
        stop?: string;
        /**
         * The dropdown part of a joined primary button: the accent fill, the height of the button
         * beside it and square corners on its left.
         */
        primary?: boolean;
    };

    let {
        label,
        trigger,
        button = $bindable(),
        glyph,
        compact = false,
        bare = false,
        inherit = false,
        rail = false,
        status = false,
        words = '',
        title,
        stop,
        primary = false
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
        class:inherit
        class:rail
        class:status
        class:primary
        bind:this={button}
        aria-label={label}
        data-stop={stop}
        {...trigger}
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

    .opener.bare.inherit {
        color: inherit;
    }

    .opener.bare:hover {
        border-color: transparent;
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
    }

    /* The dropdown of a primary button: the button's fill, 4px beside its glyph, and the input
       radius on its right corners only. */
    .opener.primary,
    :global(body.rice) .opener.primary {
        justify-content: center;
        box-sizing: border-box;
        width: auto;
        padding: 0 4px;
        border: 1px solid var(--accent);
        border-radius: 0 var(--input-radius) var(--input-radius) 0;
        background: var(--accent);
        color: var(--on-accent);
        font-size: calc(var(--button-font) * var(--text-scale, 1));
        line-height: calc(var(--button-line) * var(--text-scale, 1));
    }

    .opener.primary:hover {
        border-color: var(--accent);
        filter: brightness(1.1);
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
