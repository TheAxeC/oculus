<script lang="ts">
    // Layer 3, primitive. One control in a toolbar. It is a button and nothing else: what pressing
    // it means, and whether it is the one in force, are the caller's.
    //
    // `checked` is what makes an exclusive group possible without a second component: given it, the
    // button reports itself as a radio and says whether it is the chosen one, which is what
    // Segment.svelte needs and a lone button does not.

    import Glyph from './Glyph.svelte';
    import Tooltip from './Tooltip.svelte';

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
        /** Draw a compact rail glyph above its visible label instead of hiding the label. */
        stacked?: boolean;
        /** A rail view id, rendered on the button for browser navigation. */
        dataView?: string;
        /** A configured bookmark identity, rendered on the button for browser navigation. */
        dataBookmark?: string;
        /** Marks the project-card control the keyboard cursor activates when its title is plain. */
        dataCardToggle?: boolean;
    };

    let {
        label,
        glyph,
        active = false,
        expanded,
        pressed,
        onclick,
        title,
        checked,
        disabled = false,
        compact = false,
        rail = false,
        stacked = false,
        dataView,
        dataBookmark,
        dataCardToggle = false
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
        class:stacked
        role={checked === undefined ? undefined : 'radio'}
        aria-checked={checked}
        aria-expanded={expanded}
        aria-pressed={pressed}
        aria-label={iconOnly ? label : undefined}
        data-view={dataView}
        data-bookmark={dataBookmark}
        data-card-toggle={dataCardToggle || undefined}
        {disabled}
        {onclick}
    >
        {#if glyph !== undefined}
            <Glyph name={glyph} />
        {/if}
        {#if !iconOnly}
            <span class="label">{label}</span>
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

    .tool.rail-control {
        justify-content: center;
        width: 100%;
        height: 34px;
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

    .tool.stacked :global(.label) {
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

    .tool:hover:not(:disabled) {
        border-color: var(--accent);
    }

    .tool:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .tool.active {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--on-accent);
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

    :global(body.rice) .tool::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .tool::after {
        content: ']';
        opacity: 0.5;
    }

    :global(body.rice) .tool.rail-control {
        height: 34px;
        padding: 0;
    }
</style>
