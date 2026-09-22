<script lang="ts">
    // Layer 3, primitive. The button a Menu opens its list from, in the looks a menu takes: a word
    // with an optional glyph, the glyph alone in a narrow strip, the rail's full-width box, a
    // strip's bare icon box, and a rail glyph above its visible label. It holds nothing: whether
    // the list is open and what a press does are the menu's, and the menu reads the button itself
    // through `button` to give it the focus back and to measure where a list beside the rail goes.

    import Glyph from '../controls/Glyph.svelte';
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
        rail?: boolean;
        bare?: boolean;
        stacked?: boolean;
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
        rail = false,
        bare = false,
        stacked = false,
        tabindex,
        stop,
        onkeydown
    }: Props = $props();
</script>

<!-- A compact menu is an icon in a narrow column, so its words go beside it; a menu that shows
     its label has room underneath. -->
<Tooltip text={label} placement={compact ? 'beside' : 'below'} presentational block={rail}>
    <button
        type="button"
        class="opener"
        class:compact
        class:rail-control={rail}
        class:bare
        class:stacked
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
        {#if !compact || stacked}
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

    .opener.rail-control {
        height: 34px;
        box-sizing: border-box;
        background: none;
        font-size: var(--fs-xl);
        padding: 0;
    }

    .opener.stacked {
        flex-direction: column;
        gap: 1px;
    }

    .opener.stacked :global(.label) {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-3xs);
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .opener:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
