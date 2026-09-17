<script lang="ts">
    // Layer 3, primitive. A collapsible section of explorer rows, drawn inside a ui/TreeView.svelte:
    // a heading row with the section's name, its controls and its count at the right edge, and
    // under it, while it is open, the group the caller's rows are drawn into. Whether it is open is
    // the caller's, so a view keeps it in its instance state and a section closed before a tab
    // switch is closed after it.

    import type { Snippet } from 'svelte';
    import TreeItem from './TreeItem.svelte';
    import type { TreeNav } from './tree-keys.ts';

    type Props = {
        /** The section's name, already translated; also the name of its group. */
        label: string;
        /** The head's id in the tree the section is drawn in. */
        id: string;
        nav?: TreeNav;
        /** How many rows the section holds, drawn on its head. */
        count?: number;
        open: boolean;
        ontoggle: () => void;
        /** The tooltip of the head, when it says more than the name does. */
        title?: string;
        /** The section's own controls, drawn on its head and handed the tabindex they take. */
        actions?: Snippet<[number]>;
        /** The rows, each an `li` with role none around a row of level 2. */
        children?: Snippet;
    };

    let { label, id, nav, count, open, ontoggle, title, actions, children }: Props = $props();
</script>

<div class="section">
    <TreeItem
        {label}
        {id}
        {nav}
        level={1}
        heading
        {count}
        expanded={open}
        {title}
        onclick={ontoggle}
        {actions}
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
