<script lang="ts">
    // Layer 3, primitive. One row of an explorer: a line of one fixed height holding the indent
    // guides of its depth, the expand arrow of a row that opens, a glyph, the name and a muted
    // detail, then the row's own controls, and at the right edge a count or a mark. A heading row
    // is the same line drawn as the head of a section, its name in small capitals.
    //
    // A row with something to do when pressed carries a button over its name, which is what a
    // pointer presses, and the row itself answers a press on the space beyond its parts, so the
    // whole line opens what the name opens; a row given nothing to do is the same line as text.
    // The controls sit beside the line rather than inside it, since a button holds no button, and
    // the tooltip opens while the pointer is anywhere over the row. They are shown while
    // the pointer is over the row or the focus is inside it, and are otherwise transparent rather
    // than removed, so a control is where the reader's pointer will land. A row given
    // `showActions` draws them at full strength always, for a section head whose one control adds
    // to the section and is looked for before the pointer is over it.
    //
    // A row drawn in a ui/tree/TreeView.svelte is a treeitem with its level, and the treeitem is
    // what takes the keyboard's focus: it reads its place in the focus order and its key handler
    // from the tree's `nav`, and Enter on it presses its button. The button is no stop of its own,
    // and a press on it puts the focus on the treeitem, so the arrow keys go on from there. The
    // row's controls are no stop either until the focus is inside the row: the caller's `actions`
    // snippet is handed the tabindex to give them, 0 while the row holds the focus and -1
    // otherwise, so Tab from a focused row reaches its controls and a Tab from outside the tree
    // never does.
    //
    // Selected is the reader's cursor and is drawn with the accent tint under the ink; current is
    // what is in force (a checked-out branch, the workspace in use) and is drawn as a bold name
    // with a check, never as a selection.
    //
    // The tooltip sits inside the button, around the line, so it opens for a pointer resting on the
    // row and never for the keyboard's focus: a tooltip opened by an arrow key would cover the row
    // the next arrow key goes to.

    import type { Snippet } from 'svelte';
    import Glyph from '../controls/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import type { TreeNav } from './tree-keys.ts';

    type Props = {
        /** The row's name, already translated; also the row's and the button's accessible name. */
        label: string;
        /** A name in `glyphs:`, drawn before the name. */
        glyph?: string;
        /** How many indent guides the row draws. */
        depth?: number;
        /** The row's level in its tree, 1 for the top; given, the row is a treeitem. */
        level?: number;
        /** Whether the row is open: omitted for a row that does not open, which draws no arrow. */
        expanded?: boolean;
        /** Draw the row as the reader's cursor. */
        selected?: boolean;
        /** Draw the row as the one in force. */
        current?: boolean;
        /** Draw the row as the head of a section. */
        heading?: boolean;
        /** The row's accessible name, when it says more than the label drawn. */
        name?: string;
        /**
         * Draw the name muted, or in the warning or the error hue, for a row that says something.
         */
        tone?: 'muted' | 'warn' | 'error';
        /** A number drawn at the right edge, for a heading or a group that counts its rows. */
        count?: number;
        /** The tooltip, when it says more than the name does. */
        title?: string;
        /** The row's id in the tree it is drawn in. */
        id?: string;
        /** The tree the row is drawn in, which gives it its stop and its keys. */
        nav?: TreeNav;
        /** What pressing the row does; a row with none is drawn as text. */
        onclick?: (event: MouseEvent) => void;
        ondblclick?: (event: MouseEvent) => void;
        /** What the row says after its name, muted: a path, a time. */
        detail?: Snippet;
        /** A field drawn after the name, for a row a reader types into. */
        field?: Snippet;
        /** The row's own controls, handed the tabindex they take. */
        actions?: Snippet<[number]>;
        /** Draw the controls at full strength whether or not the pointer is over the row. */
        showActions?: boolean;
        /** Drawn at the right edge after the controls: a status letter. */
        end?: Snippet;
    };

    let {
        label,
        name,
        glyph,
        depth = 0,
        level,
        expanded,
        selected = false,
        current = false,
        heading = false,
        tone,
        count,
        title,
        id,
        nav,
        onclick,
        ondblclick,
        detail,
        field,
        actions,
        showActions = false,
        end
    }: Props = $props();

    const guides = $derived(Array.from({ length: Math.max(0, depth) }, (_, at) => at));

    /** Whether the focus is on the row or one of its controls. */
    let inside = $state(false);

    let box: HTMLDivElement | undefined = $state();
    let button: HTMLButtonElement | undefined = $state();

    /** Whether the row is a stop of a tree, which is what makes the treeitem the focus target. */
    const inTree = $derived(id !== undefined && nav !== undefined && level !== undefined);

    function keyed(event: KeyboardEvent): void {
        if (event.target !== box || id === undefined || nav === undefined) return;
        if (event.key === 'Enter' && button !== undefined) {
            event.preventDefault();
            button.click();
            return;
        }
        nav.onkeydown(id)(event);
    }

    function pressed(event: MouseEvent): void {
        if (inTree) box?.focus({ preventScroll: true });
        onclick?.(event);
    }

    /** A press on the row's own space, beyond every part drawn in it, opens the row. */
    function pressedRow(event: MouseEvent): void {
        if (event.target === box && onclick !== undefined) pressed(event);
    }

    function left(event: FocusEvent): void {
        const next = event.relatedTarget;
        if (box !== undefined && next instanceof Node && box.contains(next)) return;
        inside = false;
    }
</script>

{#snippet line()}
    {#each guides as at (at)}
        <span class="guide" aria-hidden="true"></span>
    {/each}
    <span class="twisty" class:open={expanded === true} aria-hidden="true">
        {#if expanded !== undefined}
            <Glyph name="chevron" />
        {/if}
    </span>
    {#if glyph !== undefined}
        <Glyph name={glyph} />
    {/if}
    <span class="name">{label}</span>
    {#if current}
        <span class="mark" aria-hidden="true">
            <Glyph name="check" />
        </span>
    {/if}
    {#if detail !== undefined}
        <span class="detail">{@render detail()}</span>
    {/if}
{/snippet}

<!-- The row is a treeitem whenever it is a stop of a tree, which is the one case it takes a
     tabindex; the check cannot see a role chosen by a prop. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
    class="item"
    class:selected
    class:current
    class:heading
    class:muted={tone === 'muted'}
    class:warn={tone === 'warn'}
    class:error={tone === 'error'}
    role={level === undefined ? undefined : 'treeitem'}
    aria-label={level === undefined ? undefined : (name ?? label)}
    aria-level={level}
    aria-expanded={level === undefined ? undefined : expanded}
    aria-selected={level === undefined ? undefined : selected}
    aria-current={current ? 'true' : undefined}
    data-row-id={id}
    tabindex={inTree ? nav?.tabindex(id ?? '') : undefined}
    bind:this={box}
    onclick={pressedRow}
    onkeydown={keyed}
    onfocusin={() => (inside = true)}
    onfocusout={left}
>
    {#if onclick === undefined}
        <span class="main text" class:labelled={field !== undefined}>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render line()}
        </span>
        {#if field !== undefined}
            <span class="field">{@render field()}</span>
        {/if}
    {:else}
        <button
            type="button"
            class="main"
            aria-label={name ?? label}
            tabindex={inTree ? -1 : undefined}
            bind:this={button}
            onclick={pressed}
            {ondblclick}
        >
            <!-- The words describe the element that takes the focus: the row in a tree, whose
                 button takes none, and the button outside one. -->
            <Tooltip
                text={title ?? ''}
                block
                describes={level === undefined ? button : box}
                over={box}
            >
                <span class="line">
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render line()}
                </span>
            </Tooltip>
        </button>
    {/if}
    {#if actions !== undefined}
        <span class="actions" class:shown={showActions}>{@render actions(inside ? 0 : -1)}</span>
    {/if}
    {#if count !== undefined}
        <span class="count">{count}</span>
    {/if}
    {#if end !== undefined}
        <span class="end">{@render end()}</span>
    {/if}
</div>

<style>
    /* The row's height, one level's indent and the two type sizes are the tokens of
       themes/tokens.css, which an ancestor may set for a tree of its own, each multiplied here by
       the text size. */
    .item {
        display: flex;
        align-items: center;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
        border-radius: var(--radius-sm);
        color: var(--ink-txt, var(--ink));
        font-size: calc(var(--tree-font) * var(--text-scale, 1));
    }

    /* A row that only says something (no bookmark yet, nothing changed) has nothing to point at. */
    .item:not(.muted, .warn, .error):hover {
        background: var(--chip);
    }

    .item.selected {
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    /* The outline is the row's, so it closes round the controls as well as the name. */
    .item:focus-visible,
    .item:has(:focus-visible) {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* The row's parts follow its name rather than the pane's far edge: the name takes the width it
       needs and no more, so a row's controls and count sit beside the name a reader is pointing at
       however wide the pane is. The row itself still spans the pane, and a press on the space
       beyond its parts opens it as a press on the name does. */
    .main {
        display: flex;
        flex: 0 1 auto;
        align-items: center;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
        padding: 0 4px 0 2px;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        white-space: nowrap;
    }

    button.main {
        cursor: pointer;
    }

    /* A row of text lays its parts out as the button's line does. */
    .main.text {
        gap: 4px;
    }

    /* A row a name is typed into keeps its words to their own width and gives the rest to the
       field. */
    .main.labelled {
        flex: 0 0 auto;
    }

    button.main:focus-visible {
        outline: none;
    }

    .line {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    /* One guide per level: a column the indent's width with the line on its left edge, so the
       guides of the rows under one folder join into one vertical rule. It is drawn while the tree
       is hovered or holds the focus, and is transparent otherwise. */
    .guide {
        flex: 0 0 calc(var(--tree-indent) * var(--text-scale, 1));
        align-self: stretch;
        box-sizing: border-box;
        margin-left: 4px;
        border-left: 1px solid transparent;
    }

    :global([role='tree']:hover) .guide,
    :global([role='tree']:focus-within) .guide {
        border-left-color: var(--line);
    }

    .twisty {
        display: inline-flex;
        flex: 0 0 auto;
        justify-content: center;
        width: 1.2em;
        color: var(--muted-txt, var(--muted));
        transition: transform 120ms ease;
    }

    .twisty.open {
        transform: rotate(90deg);
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .current .name {
        font-weight: 700;
    }

    .mark {
        display: inline-flex;
        color: var(--muted-txt, var(--muted));
    }

    .muted .name {
        color: var(--muted-txt, var(--muted));
    }

    .warn .name {
        color: var(--c-amber-txt, var(--muted));
    }

    .error .name {
        color: var(--c-red-txt, var(--muted));
    }

    .detail,
    .count,
    .end {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* On the accent tint every part of the row is drawn in the tint's own text colour, which the
       theme derives to read on it, where the muted colour does not. */
    .item.selected .twisty,
    .item.selected .mark,
    .item.selected .detail,
    .item.selected .count,
    .item.selected .end {
        color: var(--on-accent-bg, var(--ink));
    }

    .count,
    .end {
        flex: 0 0 auto;
        padding: 0 6px 0 4px;
        font-family: var(--font-num);
    }

    .field {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        gap: 4px;
        min-width: 0;
        padding-right: 4px;
    }

    .heading {
        font-size: calc(var(--tree-heading-font) * var(--text-scale, 1));
    }

    .heading .main {
        font-weight: 700;
        font-variant-caps: all-small-caps;
        letter-spacing: 0.04em;
    }

    .heading:not(.selected) .main {
        color: var(--muted-txt, var(--muted));
    }

    .actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 1px;
        padding-right: 2px;
        opacity: 0;
    }

    .item:hover .actions,
    .item:focus-within .actions,
    .actions.shown {
        opacity: 1;
    }

    /* A screen with no pointer that hovers shows them all the time: they are pressable there too,
       and a control pressed where nothing is drawn is one nobody can aim at. */
    @media (hover: none) {
        .actions {
            opacity: 1;
        }
    }

    /* A control on a row is a glyph on the row's own surface: the box a toolbar button draws would
       make every line of the tree a line of boxes. */
    .actions :global(.tool) {
        border-color: transparent;
        background: none;
        padding: 1px 3px;
    }

    .actions :global(.tool:hover:not(:disabled)) {
        border-color: var(--line);
    }
</style>
