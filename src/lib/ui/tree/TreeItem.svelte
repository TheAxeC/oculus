<script lang="ts">
    // Layer 3, primitive. One row of an explorer: a line of one fixed height holding the indent
    // guides of its depth, the expand arrow of a row that opens, a glyph or a file's Seti icon, the
    // name and a muted detail, then the row's own controls, and at the right edge a count or a
    // mark. A heading row is the same line drawn as the head of a section, its name in capitals.
    //
    // A row with something to do when pressed carries a button over its name, which is what a
    // pointer presses, and the row itself answers a press on the space beyond its parts, so the
    // whole line opens what the name opens; a row given nothing to do is the same line as text. The
    // controls sit beside the line rather than inside it, since a button holds no button, and the
    // tooltip opens while the pointer is anywhere over the row. They are shown while the pointer is
    // over the row or the focus is inside it, and are otherwise transparent rather than removed, so
    // a control is where the reader's pointer will land. A row given `showActions` draws them at
    // full strength always, for a section head whose one control adds to the section.
    //
    // A row drawn in a ui/tree/TreeView.svelte is a treeitem, and the treeitem is what takes the
    // keyboard's focus: it spreads what the tree's `nav` hands it from zag's tree-view machine (its
    // id, role, level, open state, place in the focus order and focus handler), and hands the tree
    // its label for the type-ahead. The tree answers the arrow keys; Enter on the row presses its
    // button unless the tree binds Enter to its caller's keymap. The button is no stop of its own,
    // and a press on it puts the focus on the treeitem, so the arrow keys go on from there. The
    // row's controls are no stop either until the focus is inside the row: the caller's `actions`
    // snippet is handed the tabindex to give them, 0 while the row holds the focus and -1
    // otherwise. A row given a `level` outside a tree is a treeitem at that level, with the open
    // state its `expanded` says.
    //
    // Selected is the reader's cursor and is drawn with the accent tint under the ink; current is
    // what is in force (a checked-out branch, the workspace in use) and is drawn as a bold name
    // with a check, never as a selection. A strong row is drawn at weight 600 with no check, for
    // the commit the checkout is on; a struck row has its name struck through, and `nameStyle` sets
    // custom properties on the name (a status tone). A caller that draws the name itself (a run of
    // folders, matched letters) hands `words`, which takes the name's place inside it.
    //
    // A count is plain text in the number font, or with `badge` a pill (the count of a section or a
    // group); `countTitle` says what it counts. A `trailing` row draws its `end` before its
    // controls, both at the right edge, for the pills of a graph row. A `yielding` row's controls
    // are the part of the line that gives way first when the pane is narrow, and are cut before the
    // name is.
    //
    // The row sets `--row-bg` to its own background in each state (rest, hover, selected). A holder
    // that draws beside the row rather than inside it, as a graph row does its lanes (CommitRow,
    // GraphHead), sets the same values on itself, and the rings of its circles are drawn in those.
    //
    // The tooltip sits inside the button, around the line, so it opens for a pointer resting on the
    // row and never for the keyboard's focus: a tooltip opened by an arrow key would cover the row
    // the next arrow key goes to.

    import FileIcon from '../display/FileIcon.svelte';
    import Glyph from '../display/Glyph.svelte';
    import Tooltip from '../menu/Tooltip.svelte';
    import TreeActions from './TreeActions.svelte';
    import { pressedByKey } from './tree-keys.ts';
    import type { TreeItemProps } from './item-props.ts';

    let {
        label,
        name,
        glyph,
        file,
        depth = 0,
        level,
        expanded,
        selected = false,
        current = false,
        heading = false,
        tone,
        count,
        badge = false,
        countTitle,
        strong = false,
        struck = false,
        nameStyle,
        trailing = false,
        yielding = false,
        title,
        id,
        nav,
        onclick,
        ondblclick,
        detail,
        words,
        field,
        actions,
        showActions = false,
        end
    }: TreeItemProps = $props();

    const guides = $derived(Array.from({ length: Math.max(0, depth) }, (_, at) => at));

    /** Whether the focus is on the row or one of its controls. */
    let inside = $state(false);

    let box: HTMLDivElement | undefined = $state();
    let button: HTMLButtonElement | undefined = $state();

    /** Whether the row is a stop of a tree, which is what makes the treeitem the focus target. */
    const inTree = $derived(id !== undefined && nav !== undefined && level !== undefined);

    /** What the tree's `nav` hands the row, while it is a row of a tree. */
    const fromTree = $derived(inTree && id !== undefined ? (nav?.row(id, label) ?? {}) : {});

    /**
     * Enter on the row presses its button; the tree's own keys go on to the tree. A key the tree
     * binds to its caller's keymap (Enter among them, in the file browser) is the caller's.
     */
    function keyed(event: KeyboardEvent): void {
        pressedByKey(event, { box, inTree, bound: nav?.bound, button });
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
    {#if file !== undefined}
        <FileIcon name={file} />
    {:else if glyph !== undefined}
        <Glyph name={glyph} />
    {/if}
    {#if words !== undefined}
        <span class="name" style={nameStyle}>{@render words()}</span>
    {:else}
        <span class="name" style={nameStyle}>{label}</span>
    {/if}
    {#if current}
        <span class="mark" aria-hidden="true">
            <Glyph name="check" />
        </span>
    {/if}
    {#if detail !== undefined}
        <span class="detail">{@render detail()}</span>
    {/if}
{/snippet}

<div
    class="item"
    class:selected
    class:current
    class:heading
    class:strong
    class:struck
    class:muted={tone === 'muted'}
    class:warn={tone === 'warn'}
    class:error={tone === 'error'}
    class:link={tone === 'link'}
    role={level === undefined ? undefined : 'treeitem'}
    aria-label={level === undefined ? undefined : (name ?? label)}
    aria-level={level}
    aria-expanded={level === undefined ? undefined : expanded}
    aria-selected={level === undefined ? undefined : selected}
    aria-current={current ? 'true' : undefined}
    {...fromTree}
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
    {#if trailing && end !== undefined}
        <span class="end">{@render end()}</span>
    {/if}
    {#if actions !== undefined}
        <TreeActions shown={showActions} {yielding}>
            {@render actions(inside ? 0 : -1)}
        </TreeActions>
    {/if}
    {#if count !== undefined}
        <span class="count" class:badge title={countTitle}>{count}</span>
    {/if}
    {#if !trailing && end !== undefined}
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
        --row-bg: var(--panel);
    }

    /* A row that only says something (no bookmark yet, nothing changed) has nothing to point at. */
    .item:not(.muted, .warn, .error):hover {
        --row-bg: var(--chip);
        background: var(--chip);
    }

    /* The controls are shown while the pointer is over the row or the focus is inside it. */
    .item:hover,
    .item:focus-within {
        --actions-opacity: 1;
    }

    .item.selected {
        --row-bg: var(--accent-bg);
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    /* The outline is the row's, so it closes round the controls as well as the name. */
    .item:focus-visible,
    .item:has(:focus-visible) {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* The name takes the row's free width, so a row's controls, count and status letter sit at the
       pane's right edge and the letters of a list read down one column, as in VS Code's Explorer
       and Source Control. */
    .main {
        display: flex;
        flex: 1 1 auto;
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
       is hovered or holds the focus, and is transparent otherwise. A tree sets the gap before a
       guide and how far the line sits right of its column (`--tree-guide-gap`,
       `--tree-guide-shift`). */
    .guide {
        flex: 0 0 calc(var(--tree-indent) * var(--text-scale, 1));
        align-self: stretch;
        box-sizing: border-box;
        margin-left: var(--tree-guide-gap, 4px);
        border-left: 1px solid transparent;
        translate: calc(var(--tree-guide-shift, 0px) * var(--text-scale, 1));
    }

    :global([role='tree']:hover) .guide,
    :global([role='tree']:focus-within) .guide {
        border-left-color: var(--line);
    }

    .twisty {
        display: inline-flex;
        flex: 0 0 auto;
        justify-content: center;
        width: calc(var(--icon-box) * var(--text-scale, 1));
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
        color: var(--tone-txt, currentcolor);
    }

    .current .name {
        font-weight: 700;
    }

    .strong .name,
    .strong .detail {
        font-weight: 600;
    }

    .struck .name {
        text-decoration: line-through;
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

    .link .name {
        color: var(--accent-txt, var(--accent));
    }

    .link .line {
        justify-content: center;
    }

    .link .twisty {
        display: none;
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
    /* The words after the name give up their room first, and the name shrinks only once they
       are gone, as VS Code's rows keep a file's name and cut its folder. */
    .detail {
        flex-shrink: 1000;
    }

    .item.selected .detail,
    .item.selected .count,
    .item.selected .end {
        color: var(--on-accent-bg, var(--ink));
    }

    .count,
    .end {
        flex: 0 0 auto;
        padding: 0 var(--tree-end-inset) 0 4px;
        font-family: var(--font-num);
    }

    /* A slot given nothing to show takes no room. */
    .end:empty {
        display: none;
    }

    /* A section head keeps its count 6px from the edge whatever the view's rows keep. */
    .heading .count {
        padding-right: 6px;
    }

    /* The count as a pill: the number in the small size on the line fill, at least a square of
       the badge size, `--tree-end-inset` from the row's edge (a section head's: 6px). */
    .count.badge,
    .item.selected .count.badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-width: calc(var(--tree-badge-size) * var(--text-scale, 1));
        min-height: calc(var(--tree-badge-size) * var(--text-scale, 1));
        margin-right: var(--tree-end-inset);
        padding: 3px 5px;
        border-radius: 11px;
        background: var(--line);
        color: var(--on-line);
        font-family: var(--font-ui);
        font-variant-numeric: tabular-nums;
        font-size: calc(var(--tree-badge-font) * var(--text-scale, 1));
        line-height: calc(var(--tree-badge-font) * var(--text-scale, 1));
        text-align: center;
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

    .heading .count.badge {
        margin-right: 6px;
    }

    .heading .main {
        font-weight: 700;
        text-transform: uppercase;
    }
</style>
