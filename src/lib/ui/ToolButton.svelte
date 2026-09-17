<script lang="ts">
    // Layer 3, primitive. One control in a toolbar. It is a button and nothing else: what pressing
    // it means, and whether it is the one in force, are the caller's.
    //
    // `checked` is what makes an exclusive group possible without a second component: given it, the
    // button reports itself as a radio and says whether it is the chosen one, which is what
    // Segment.svelte needs and a lone button does not.

    import Glyph from './Glyph.svelte';
    import Tooltip from './Tooltip.svelte';
    import type { Snippet } from 'svelte';

    type Props = {
        /** The button's words, already translated by the view. */
        label: string;
        /** A name in `glyphs:`, drawn before the label. */
        glyph?: string;
        /** Draw it as the one in force. */
        active?: boolean;
        /** Whether this button's controlled content is open. Omitted for buttons with no content. */
        expanded?: boolean;
        /** A toggle button's current state. Omitted for ordinary action buttons. */
        pressed?: boolean;
        onclick: (event: MouseEvent) => void;
        /** A second press in quick succession, for a control whose two speeds mean two things. */
        ondblclick?: (event: MouseEvent) => void;
        /** The tooltip, when it should say more than the label does. A button with none shows none. */
        title?: string;
        /** One of an exclusive group: the button becomes a radio and reports this as its state. */
        checked?: boolean;
        /**
         * Shown and not pressable, for a control whose action is unavailable right now. The reason
         * belongs in `title`: a button that cannot be pressed and does not say why is a dead end.
         */
        disabled?: boolean;
        /**
         * The glyph alone, with the words as the tooltip and the accessible name: for a control
         * that sits on every card of a board, where the words on each would cost a line. A button
         * with no glyph ignores this, since a button with nothing on it is not a control.
         */
        compact?: boolean;
        /** Use the activity rail's one full-width, 34 px control box. */
        rail?: boolean;
        /**
         * The glyph alone in a bare icon box, for a strip's own buttons: no border, no fill and no
         * terminal brackets until the pointer is over it, the same box a bare menu opener draws.
         */
        bare?: boolean;
        /** Draw a compact rail glyph above its visible label instead of hiding the label. */
        stacked?: boolean;
        /** A rail view id, rendered on the button for browser navigation. */
        dataView?: string;
        /** A configured bookmark identity, rendered on the button for browser navigation. */
        dataBookmark?: string;
        /** A configured hub document's path, rendered on the button for browser navigation. */
        dataDoc?: string;
        /** Marks the project-card control the keyboard cursor activates when its title is plain. */
        dataCardToggle?: boolean;
        /**
         * The button's place in the browser's focus order, for a strip that is one stop: 0 for the
         * control at the stop and -1 for the rest. A button with none is an ordinary stop.
         */
        tabindex?: number;
        /** This control's name in the strip that carries the stop, rendered for that strip to read. */
        stop?: string;
        /** A key pressed on the button, for a strip that moves its own stop with the arrow keys. */
        onkeydown?: (event: KeyboardEvent) => void;
        /**
         * What the button draws in place of its label's words, for a control whose words carry a
         * mark of their own: a search hit with the match emboldened in its line. `label` is still
         * the button's accessible name, since a screen reader is given words and not markup.
         */
        children?: Snippet;
    };

    let {
        label,
        glyph,
        active = false,
        expanded,
        pressed,
        onclick,
        ondblclick,
        title,
        checked,
        disabled = false,
        compact = false,
        rail = false,
        bare = false,
        stacked = false,
        dataView,
        dataBookmark,
        dataDoc,
        dataCardToggle = false,
        tabindex,
        stop,
        onkeydown,
        children
    }: Props = $props();

    const compactGlyph = $derived(compact && glyph !== undefined);
    const iconOnly = $derived(compactGlyph && !stacked);
    const tip = $derived(title ?? (compactGlyph ? label : ''));
</script>

<!-- A button of an exclusive group is a radio its group owns, and a radiogroup owns radios: a
     wrapper with semantics of its own between them would leave the group with no radios in it. -->
<Tooltip
    text={tip}
    placement={rail ? 'beside' : 'below'}
    presentational={checked !== undefined}
    block={rail}
>
    <button
        type="button"
        class="tool"
        class:active
        class:compact={iconOnly}
        class:rail-control={rail}
        class:bare
        class:stacked
        role={checked === undefined ? undefined : 'radio'}
        aria-checked={checked}
        aria-expanded={expanded}
        aria-pressed={pressed}
        aria-label={iconOnly || children !== undefined ? label : undefined}
        data-view={dataView}
        data-bookmark={dataBookmark}
        data-doc={dataDoc}
        data-card-toggle={dataCardToggle || undefined}
        data-stop={stop}
        {tabindex}
        {disabled}
        {onclick}
        {ondblclick}
        {onkeydown}
    >
        {#if glyph !== undefined}
            <Glyph name={glyph} />
        {/if}
        {#if !iconOnly}
            {#if children !== undefined}
                <span class="label">{@render children()}</span>
            {:else}
                <span class="label">{label}</span>
            {/if}
        {/if}
    </button>
</Tooltip>

<style>
    .tool {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
        cursor: pointer;
        white-space: nowrap;
    }

    .tool.compact {
        padding: 3px 5px;
    }

    /* The rail's height is a floor, not a size: a stacked label that wraps makes its button taller. */
    .tool.rail-control {
        justify-content: center;
        width: 100%;
        min-height: 34px;
        box-sizing: border-box;
        background: none;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-xl);
        padding: 0;
    }

    .tool.stacked {
        flex-direction: column;
        gap: 1px;
    }

    /* A label the rail's width cannot hold on one line wraps to a second, and only a third is cut:
       the rail stays its width and a long bookmark name is still read whole. */
    .tool.stacked :global(.label) {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        overflow-wrap: anywhere;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-3xs);
        line-height: 1.1;
        text-overflow: ellipsis;
        white-space: normal;
    }

    .tool:hover:not(:disabled) {
        border-color: var(--accent);
    }

    .tool:disabled {
        opacity: 0.5;
        cursor: default;
    }

    /* A strip's own button: the glyph in a box of the strip's action size, the same under every
       theme, a terminal palette included. */
    .tool.bare,
    :global(body.rice) .tool.bare {
        justify-content: center;
        box-sizing: border-box;
        min-width: var(--tab-action);
        height: var(--tab-action);
        padding: 0 var(--tab-action-pad);
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-lg);
        line-height: 1;
    }

    .tool.bare:hover:not(:disabled) {
        border-color: transparent;
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
    }

    .tool.active {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--on-accent);
    }

    /* A toggle in the rail that is on fills with the accent's tint and draws its border in the
       accent and its glyph and name in the tint's own text colour, which the contrast test measures
       on that tint. The solid accent block of a toolbar button is too heavy in a column of bare
       glyphs, and a terminal theme that fills no other button still fills this one. */
    .tool.rail-control.active,
    :global(body.rice) .tool.rail-control.active {
        border: 1px solid var(--accent);
        background: var(--accent-bg);
        color: var(--accent-bg-txt, var(--accent));
    }

    .tool.rail-control.active :global(.label) {
        color: var(--accent-bg-txt, var(--accent));
    }

    .tool:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    /* The terminal shape: a bracketed word, and the one in force is the only one in ink. */
    :global(body.rice) .tool {
        border: 0;
        border-radius: 0;
        background: none;
        padding: 3px 4px;
    }

    :global(body.rice) .tool.active {
        background: none;
        color: var(--accent-txt, var(--accent));
    }

    /* The brackets are a row's shape, around a word with the glyph inside them. A stacked control is
       a column of a glyph over a label, where the pair would be two lines of their own above and
       below it, and a rail control is a glyph in a box the rail's width sets, a third of it in the
       rail's row of text steps; in both the terminal stand-in the glyph draws carries its own
       brackets already. A bare button is a strip's icon and draws none, as a bare menu opener
       beside it draws none. */
    :global(body.rice) .tool:not(.stacked):not(.rail-control):not(.bare)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .tool:not(.stacked):not(.rail-control):not(.bare)::after {
        content: ']';
        opacity: 0.5;
    }

    :global(body.rice) .tool.rail-control {
        min-height: 34px;
        padding: 0;
    }
</style>
