<script lang="ts">
    // Layer 3, primitive. One control in a toolbar. It is a button and nothing else: what pressing
    // it means, and whether it is the one in force, are the caller's.
    //
    // `checked` is what makes an exclusive group possible without a second component: given it, the
    // button reports itself as a radio and says whether it is the chosen one, which is what
    // Segment.svelte needs and a lone button does not.

    import Glyph from '../display/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import type { Snippet } from 'svelte';

    type Props = {
        /** The button's words, already translated by the view. */
        label: string;
        /** A name in `glyphs:`, drawn before the label. */
        glyph?: string;
        /** Draw it as the one in force. */
        active?: boolean;
        /**
         * Whether this button's controlled content is open. Omitted for buttons with no content.
         */
        expanded?: boolean;
        /** A toggle button's current state. Omitted for ordinary action buttons. */
        pressed?: boolean;
        onclick: (event: MouseEvent) => void;
        /** A second press in quick succession, for a control whose two speeds mean two things. */
        ondblclick?: (event: MouseEvent) => void;
        /**
         * The tooltip, when it should say more than the label does. A button with none shows none.
         */
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
        /**
         * One item of the activity rail: the glyph alone, at the icon size, in a square box the
         * rail's width, with no border and no fill, muted until the pointer is over it; the one in
         * force draws its glyph in the text colour with the accent bar on its left edge.
         */
        rail?: boolean;
        /**
         * The glyph alone in a bare icon box, for a strip's own buttons: no border, no fill and no
         * terminal brackets until the pointer is over it, the same box a bare menu opener draws.
         */
        bare?: boolean;
        /**
         * One item of the status bar, drawn as VS Code draws one: the bar's height, the bar's own
         * text size and colour, no border and no fill until the pointer is over it, and its
         * tooltip over it rather than under, since the bar is the window's foot.
         */
        status?: boolean;
        /** A rail view id, rendered on the button for browser navigation. */
        dataView?: string;
        /** A configured hub document's path, rendered on the button for browser navigation. */
        dataDoc?: string;
        /** Marks the project-card control the keyboard cursor activates when its title is plain. */
        dataCardToggle?: boolean;
        /**
         * The button's place in the browser's focus order, for a strip that is one stop: 0 for the
         * control at the stop and -1 for the rest. A button with none is an ordinary stop.
         */
        tabindex?: number;
        /**
         * This control's name in the strip that carries the stop, rendered for that strip to read.
         */
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
        status = false,
        dataView,
        dataDoc,
        dataCardToggle = false,
        tabindex,
        stop,
        onkeydown,
        children
    }: Props = $props();

    const compactGlyph = $derived(compact && glyph !== undefined);
    const iconOnly = $derived(compactGlyph);
    const tip = $derived(title ?? (compactGlyph ? label : ''));
</script>

<!-- A button of an exclusive group is a radio its group owns, and a radiogroup owns radios: a
     wrapper with semantics of its own between them would leave the group with no radios in it. -->
<Tooltip
    text={tip}
    placement={rail ? 'beside' : status ? 'above' : 'below'}
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
        class:status
        role={checked === undefined ? undefined : 'radio'}
        aria-checked={checked}
        aria-expanded={expanded}
        aria-pressed={pressed}
        aria-label={iconOnly || children !== undefined ? label : undefined}
        data-view={dataView}
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

    /* An item of the activity rail, drawn as VS Code draws one (activityaction.css): a square box
       the bar's width, a 24 px icon centred in it, no border and no fill, the icon muted until the
       pointer or the keyboard is on it. */
    .tool.rail-control {
        justify-content: center;
        width: 100%;
        height: var(--rail-width);
        box-sizing: border-box;
        border: 0;
        border-radius: 0;
        background: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--rail-icon);
        padding: 0;
    }

    .tool.rail-control:hover:not(:disabled),
    .tool.rail-control:focus-visible {
        color: var(--ink-txt, var(--ink));
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

    /* An item of the status bar (statusbarpart.css): the bar's height, flush with the next item,
       8 px either side, the bar's 12 px words in the bar's own colour, and a fill over it while
       the pointer is on it. The size is fixed as the rail's is, under every theme, a terminal
       palette included. */
    .tool.status,
    :global(body.rice) .tool.status {
        box-sizing: border-box;
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

    .tool.status:hover:not(:disabled),
    .tool.status[aria-expanded='true'] {
        background: var(--chip);
    }

    /* Its icon at the size VS Code draws a status bar icon, and a stand-in at the words' size. */
    .tool.status :global(.glyph) {
        font-size: var(--status-icon);
    }

    :global(body.rice) .tool.status :global(.glyph:not(:has(svg))) {
        font-size: var(--status-text);
        width: auto;
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

    /* The rail item of the page on screen: its icon in the text colour and a 2 px bar in the accent
       down its left edge, VS Code's active item indicator. The bar is an inset shadow so the icon
       stays centred in the box, and it is drawn under a terminal palette as under every other. */
    .tool.rail-control.active,
    :global(body.rice) .tool.rail-control.active {
        border: 0;
        background: none;
        color: var(--ink-txt, var(--ink));
        box-shadow: inset 2px 0 0 var(--accent);
    }

    .tool:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    /* The rail's focus is VS Code's focus border: a one pixel line inside the item's box, which the
       active item's bar stays visible beside. */
    .tool.rail-control:focus-visible {
        outline-width: 1px;
        outline-offset: -1px;
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

    /* The brackets are a row's shape, around a word with the glyph inside them. A rail control is
       a glyph in a box the rail's width sets, where the terminal stand-in the glyph draws carries
       its own brackets already. A bare button is a strip's icon and draws none, as a bare menu
       opener beside it draws none, and a status bar item is a word in a bar of words. */
    :global(body.rice) .tool:not(.rail-control):not(.bare):not(.status)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .tool:not(.rail-control):not(.bare):not(.status)::after {
        content: ']';
        opacity: 0.5;
    }

    /* A terminal palette keeps the rail's box, and draws the one in force in its accent text as
       every terminal control in force is. A stand-in of three characters at the icon size would
       fill the box, so a glyph drawn as text takes the size of the theme's controls; an icon, when
       the reader asked for the icons, keeps the icon size. */
    :global(body.rice) .tool.rail-control {
        height: var(--rail-width);
        padding: 0;
    }

    :global(body.rice) .tool.rail-control.active {
        color: var(--accent-txt, var(--accent));
    }

    :global(body.rice) .tool.rail-control :global(.glyph:not(:has(svg))) {
        font-size: var(--fs-lg);
    }
</style>
