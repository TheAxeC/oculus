<script lang="ts">
    // Layer 3, primitive. One control in a toolbar. It is a button and nothing else: what pressing
    // it means, and whether it is the one in force, are the caller's.
    //
    // `checked` is what makes an exclusive group possible without a second component: given it, the
    // button reports itself as a radio and says whether it is the chosen one, which is what
    // Segment.svelte needs and a lone button does not.

    import Glyph from '../display/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import type { ToolButtonProps as Props } from './tool-button';

    let {
        label,
        glyph,
        picture,
        turning = false,
        active = false,
        expanded,
        pressed,
        current = false,
        onclick,
        ondblclick,
        title,
        checked,
        disabled = false,
        waiting = false,
        inert = false,
        compact = false,
        small = false,
        rail = false,
        bare = false,
        status = false,
        warning = false,
        fill,
        cell = false,
        plain = false,
        primary = false,
        wide = false,
        joined = false,
        cut = false,
        dataView,
        dataDoc,
        dataCardToggle = false,
        data = {},
        tabindex,
        stop,
        onkeydown,
        children
    }: Props = $props();

    const iconOnly = $derived((compact || bare) && (glyph !== undefined || picture !== undefined));
    const tip = $derived(title ?? (iconOnly ? label : ''));
    const named = $derived(iconOnly || cell || children !== undefined);
    const attributes = $derived(
        Object.fromEntries(Object.entries(data).map(([name, value]) => [`data-${name}`, value]))
    );
</script>

<!-- A button of an exclusive group is a radio its group owns, and a radiogroup owns radios: a
     wrapper with semantics of its own between them would leave the group with no radios in it. -->
<Tooltip
    text={tip}
    placement={rail ? 'beside' : status ? 'above' : 'below'}
    presentational={checked !== undefined}
    block={rail || cell || primary || wide}
>
    <button
        type="button"
        class="tool"
        class:active
        class:compact={iconOnly}
        class:small
        class:rail-control={rail}
        class:bare
        class:status
        class:warning
        class:fill-warning={fill === 'warning'}
        class:fill-error={fill === 'error'}
        class:cell
        class:plain
        class:primary
        class:wide
        class:joined
        class:cut
        class:inert
        class:waiting
        role={checked === undefined ? undefined : 'radio'}
        aria-checked={checked}
        aria-expanded={expanded}
        aria-pressed={pressed}
        aria-current={current ? 'page' : undefined}
        aria-label={named ? label : undefined}
        data-view={dataView}
        data-doc={dataDoc}
        data-card-toggle={dataCardToggle || undefined}
        data-stop={stop}
        {tabindex}
        disabled={disabled || inert}
        aria-disabled={waiting ? 'true' : undefined}
        onclick={(event: MouseEvent) => {
            if (!waiting) onclick(event);
        }}
        {ondblclick}
        {onkeydown}
        {...attributes}
    >
        {#if glyph !== undefined}
            <Glyph name={glyph} {turning} />
        {:else if picture !== undefined}
            <img class="picture" src={picture} alt="" />
        {/if}
        {#if cell}
            {#if children !== undefined}
                {@render children()}
            {/if}
        {:else if !iconOnly}
            {#if children !== undefined}
                <span class="label">{@render children()}</span>
            {:else}
                <span class="label">{label}</span>
            {/if}
        {/if}
    </button>
</Tooltip>

<style>
    /* A picture takes the glyph's box. */
    .picture {
        flex: none;
        width: calc(var(--icon-box) * var(--text-scale, 1));
        height: calc(var(--icon-box) * var(--text-scale, 1));
        object-fit: contain;
    }

    /* A text button, VS Code's: 12px words on a 16px line, 4px above and below and 8px beside
       them, a 1px border and the input radius, which make it 26 px high. */
    .tool {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--panel);
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-sm);
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        padding: 4px 8px;
        cursor: pointer;
        white-space: nowrap;
    }

    /* The small text button, VS Code's: 22 px high, for a row that is 22 px high. Its 16 px glyph
       stands 2 px taller than the 14 px line, so it overhangs the line by 1 px above and below
       instead of making the button taller. */
    .tool.small {
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
        padding: 3px 6px;
    }

    .tool.small > :global(.glyph) {
        margin-block: -1px;
    }

    /* An icon control of a row or a card: the 16 px icon in 2 px of room either side, 20 px, no
       border, the chip fill under the pointer, as VS Code's pane
       actions have. */
    .tool.compact {
        justify-content: center;
        box-sizing: border-box;
        min-width: var(--header-action);
        height: var(--header-action);
        padding: 0 var(--tab-action-pad);
        border: 0;
        background: none;
        line-height: 1;
    }

    .tool.compact:not(.active):hover:not(:disabled) {
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
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
        --glyph-size: var(--rail-icon);
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

    /* A waiting button looks disabled and takes no pointer, so no fill comes under the pointer;
       the wrapper around it still opens the tooltip. */
    .tool.waiting {
        opacity: 0.5;
        pointer-events: none;
    }

    /* A strip's own button: the glyph in a box of the strip's action size, or of the box a pane
       sets as `--bare-box` for its header actions, the same under every theme, a terminal palette
       included. Under a terminal palette the font size is the stand-in's. */
    .tool.bare,
    :global(body.rice) .tool.bare {
        justify-content: center;
        box-sizing: border-box;
        min-width: var(--bare-box, var(--tab-action));
        height: var(--bare-box, var(--tab-action));
        padding: 0 var(--tab-action-pad);
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-lg);
        line-height: 1;
    }

    /* A checked action is drawn by its fill alone: the accent fill with the text colour that reads
       on it. The outline is the focus ring's (`.tool:focus-visible`), so a focused checked action
       differs from an unfocused one by its ring. The pointer over it changes neither colour. */
    .tool.bare[aria-pressed='true'],
    :global(body.rice) .tool.bare[aria-pressed='true'],
    .tool.bare[aria-pressed='true']:hover:not(:disabled),
    :global(body.rice) .tool.bare[aria-pressed='true']:hover:not(:disabled) {
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    /* An item of the status bar (statusbarpart.css): the bar's height, flush with the next item,
       8 px either side, the bar's 12 px words in the bar's own colour, and a fill over it while
       the pointer is on it. The size is fixed as the rail's is, under every theme, a terminal
       palette included. The bar sets `--status-hover`, `--status-warning` and
       `--status-warning-weight` when its own colour makes the chip fill or the amber text
       unreadable. */
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
        max-width: var(--status-item-max);
    }

    /* A label wider than the item's cap ends in an ellipsis. The label's own padding and negative
       margin give its line box room for the descenders that a line height of 1 would clip. */
    .tool.status > :global(.label) {
        min-width: 0;
        margin: -0.2em 0;
        padding: 0.2em 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tool.status:hover:not(:disabled),
    .tool.status[aria-expanded='true'] {
        background: var(--status-hover, var(--chip));
    }

    .tool.status.warning {
        color: var(--status-warning, var(--c-amber-txt));
        font-weight: var(--status-warning-weight, normal);
    }

    .tool.status.fill-warning {
        background: var(--c-amber-bg);
        color: var(--c-amber);
    }

    .tool.status.fill-error {
        background: var(--c-red-bg);
        color: var(--c-red-d);
    }

    /* Its icon at the size VS Code draws a status bar icon, and a stand-in at the words' size. */
    .tool.status {
        --glyph-size: var(--status-icon);
    }

    :global(body.rice) .tool.status :global(.glyph:not(:has(svg))) {
        font-size: var(--status-text);
        width: auto;
    }

    /* A cell of a grid: the button is the cell's whole box and draws nothing of its own, so the
       caller's cell around it holds the colour, the fill and the alignment of its state. */
    .tool.cell,
    :global(body.rice) .tool.cell {
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        color: inherit;
        font: inherit;
        line-height: inherit;
        text-align: inherit;
        white-space: inherit;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* The words or marks alone, inline: the box around the button holds its look, so the button
       takes that box's font, colour, case and decoration and draws nothing of its own. Its glyph
       stands 4px from its words, as every button's does; the button's box is the tooltip's span,
       which has no gap of its own to give. */
    .tool.plain,
    :global(body.rice) .tool.plain {
        gap: 4px;
        min-width: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: none;
        color: inherit;
        font: inherit;
        line-height: inherit;
        letter-spacing: inherit;
        text-align: inherit;
        text-decoration: inherit;
        text-transform: inherit;
        white-space: inherit;
    }

    /* The action button of a form (VS Code's button): the width of its box, 4px above and below and
       8px beside its line, the input radius, and the accent fill. */
    .tool.primary {
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        padding: 4px 8px;
        border: 1px solid var(--accent);
        border-radius: var(--input-radius);
        background: var(--accent);
        color: var(--on-accent);
        font-size: calc(var(--button-font) * var(--text-scale, 1));
        line-height: calc(var(--button-line) * var(--text-scale, 1));
    }

    /* The Command Center: the width of its box, the glyph and the words centred in it. */
    .tool.wide {
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
    }

    .tool.primary:hover:not(:disabled) {
        filter: brightness(1.1);
    }

    /* Followed by a dropdown part: square on the right, and a 1px line in the text colour at 40%
       between the two that leaves 4px above and below. */
    .tool.primary.joined {
        position: relative;
        min-width: 0;
        border-radius: var(--input-radius) 0 0 var(--input-radius);
    }

    .tool.primary.joined::after {
        content: '';
        position: absolute;
        top: 4px;
        right: 0;
        bottom: 4px;
        width: 0;
        border-left: 1px solid var(--on-accent);
        opacity: 0.4;
    }

    /* A terminal palette draws the button as a bracketed word, and no separator, while the
       option `rice.brackets` is on. */
    :global(body.rice:where(:not(.rice-plain))) .tool.primary.joined::after {
        display: none;
    }

    /* Words cut to the room: the button is capped at its parent's width, and the label, the one
       box that gives way, is one line ended with an ellipsis where the room ends. */
    .tool.cut {
        max-width: 100%;
    }

    /* The label is named through :global so the compiler stamps no scoping class on it: every
       button draws its label as the plain `label` class, cut or not. */
    .tool.cut > :global(.label) {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tool.cell:disabled,
    .tool.inert:disabled {
        opacity: 1;
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
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* A plain button has no box of its own to draw the ring inside, so the ring sits just
       outside its words. */
    .tool.plain:focus-visible {
        outline-offset: 1px;
    }

    /* The rail's focus is VS Code's focus border: a one pixel line inside the item's box, which the
       active item's bar stays visible beside. */
    .tool.rail-control:focus-visible {
        outline-width: 1px;
        outline-offset: -1px;
    }

    /* The terminal shape: a bracketed word, and the one in force is the only one in ink. It is
       the option `rice.brackets`'s (the Settings view's option, written into the workspace file's
       `settings:`): with the option off, the body carries `rice-plain` and the button keeps its
       box in the rice palette and shape. */
    :global(body.rice:where(:not(.rice-plain))) .tool {
        border: 0;
        border-radius: 0;
        background: none;
        padding: 3px 4px;
    }

    :global(body.rice:where(:not(.rice-plain))) .tool.active {
        background: none;
        color: var(--accent-txt, var(--accent));
    }

    /* The brackets are a row's shape, around a word with the glyph inside them. A rail control is
       a glyph in a box the rail's width sets, where the terminal stand-in the glyph draws carries
       its own brackets already. A bare button is a strip's icon and draws none, as a bare menu
       opener beside it draws none, and a status bar item is a word in a bar of words. A cell and a
       plain button draw nothing of their own, so the box around them keeps its own shape. */
    :global(body.rice:where(:not(.rice-plain)))
        .tool:not(.rail-control):not(.bare):not(.status):not(.cell):not(.plain)::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice:where(:not(.rice-plain)))
        .tool:not(.rail-control):not(.bare):not(.status):not(.cell):not(.plain)::after {
        content: ']';
        opacity: 0.5;
    }

    /* A terminal palette keeps the rail's box, and draws the one in force in its accent text as
       every terminal control in force is. A stand-in of three characters at the icon size would
       fill the box, so a glyph drawn as text takes the size of the theme's controls; an icon,
       drawn while the option `rice.icons` is on, keeps the icon size. */
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
