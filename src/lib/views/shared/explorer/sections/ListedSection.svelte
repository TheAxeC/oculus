<script lang="ts">
    // Layer 3, shared view partial. A section of the file browser drawn as a tree of its own whose
    // head is its one movable row: the tree that takes the keys (ui/tree/TreeView.svelte), with
    // Alt+Up and Alt+Down on the head moving the section, the head (Section.svelte), the muted row
    // that says why the section lists nothing, and the caller's rows under them. The Outline,
    // Backlinks and Tags sections are this frame around rows of their own, so the frame is written
    // once.

    import type { Snippet } from 'svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import Section from './Section.svelte';
    import { headKeys, type SectionMove } from './list-drag.svelte';

    type Props = {
        /** The section's name, already translated. */
        label: string;
        /** The rows the keys walk: the head first, then the caller's. */
        rows: KeyRow[];
        /** How many rows the head counts. */
        count: number;
        open: boolean;
        ontoggle: () => void;
        move?: SectionMove;
        /** Why the section lists nothing, drawn as one muted row; the empty text for none. */
        empty: string;
        /** The caller's rows, each an `li` with role none. */
        children: Snippet<[TreeNav]>;
    };

    let { label, rows, count, open, ontoggle, move, empty, children: own }: Props = $props();
</script>

<TreeView {label} {rows} {ontoggle} keymap={MOVE_KEYMAP} onkey={headKeys(move)}>
    {#snippet children(nav: TreeNav)}
        <Section {label} {nav} {count} {open} {ontoggle} drag={move?.drag}>
            {#if empty !== ''}
                <li role="none">
                    <TreeItem label={empty} tone="muted" />
                </li>
            {/if}
            {@render own(nav)}
        </Section>
    {/snippet}
</TreeView>
