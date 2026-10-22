<script lang="ts">
    // Layer 3, primitive. A collapsible section of explorer rows, drawn inside a
    // ui/tree/TreeView.svelte: a heading row with the section's name, its controls and its count at
    // the right edge, and under it, while it is open, the group the caller's rows are drawn into.
    // Whether it is open is the caller's, so a view keeps it in its instance state and a section
    // closed before a tab switch is closed after it. The caller may draw the head's name itself,
    // through `words`, and give the head an accessible name that says more than the name drawn,
    // through `name`, as a row of ui/tree/TreeItem.svelte takes both.

    import type { Snippet } from 'svelte';
    import TreeItem from './TreeItem.svelte';
    import type { ItemDrag } from './item-props.ts';
    import type { TreeNav } from './tree-keys.ts';

    type Props = {
        /** The section's name, already translated; also the name of its group. */
        label: string;
        /** The head's accessible name, when it says more than the name drawn. */
        name?: string;
        /**
         * The head's name drawn by the caller in the place of the label's text, for a head that
         * draws something under its name, such as the moving line of a folded list.
         */
        words?: Snippet;
        /** The head's id in the tree the section is drawn in. */
        id: string;
        nav?: TreeNav;
        /** How many rows the section holds, drawn on its head. */
        count?: number;
        /** Draw the count as a pill. */
        badge?: boolean;
        /** The hover words of the count. */
        countTitle?: string;
        open: boolean;
        ontoggle: () => void;
        /** The tooltip of the head, when it says more than the name does. */
        title?: string;
        /** The section's own controls, drawn on its head and handed the tabindex they take. */
        actions?: Snippet<[number]>;
        /**
         * Draw the head's controls at full strength always, rather than while the pointer is over
         * the head: for a control that adds to the section, which a reader looks for first.
         */
        showActions?: boolean;
        /** What lets the head be dragged over the heads of the other sections of its view. */
        drag?: ItemDrag;
        /** The rows, each an `li` with role none around a row of level 2. */
        children?: Snippet;
    };

    let {
        label,
        name,
        words,
        id,
        nav,
        count,
        badge = false,
        countTitle,
        open,
        ontoggle,
        title,
        actions,
        showActions = false,
        drag,
        children
    }: Props = $props();
</script>

<div class="section">
    <TreeItem
        {label}
        {name}
        {words}
        {id}
        {nav}
        level={1}
        heading
        {count}
        {badge}
        {countTitle}
        expanded={open}
        {title}
        onclick={ontoggle}
        {actions}
        {showActions}
        {drag}
    />
    {#if open && children !== undefined}
        <ul class="list" role="group" aria-label={label}>
            {@render children()}
        </ul>
    {/if}
</div>

<style>
    .section {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border-top: 1px solid var(--line);
    }

    .list {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }
</style>
