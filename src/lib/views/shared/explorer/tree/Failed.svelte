<script lang="ts">
    // Layer 3, shared view partial, drawn by the sections of views/sources/files/sections/. The one
    // row a section under the trees draws in place of its list when the read failed: why it failed,
    // in the error hue, with the control that asks for the read again beside it, drawn where every
    // other row of the tree carries its controls.
    //
    // It is one component rather than a block in each of the three sections, because what a reader
    // is offered over a read that failed is one thing and reads the same in all three. The Notes
    // section draws it as a row of its tree, under the group it speaks of, which hands in the row's
    // place in the tree (`row`).

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The sentence saying what the read failed with, already translated. */
        label: string;
        /** The control's tooltip, naming the read it asks for again. */
        title: string;
        onretry: () => void;
        /** The row's key, the tree's keys and its depth, for a row of a tree. */
        row?: { id: string; nav: TreeNav; depth: number };
    };

    let { label, title, onretry, row }: Props = $props();
</script>

<TreeItem
    {label}
    tone="error"
    id={row?.id}
    nav={row?.nav}
    level={row === undefined ? undefined : row.depth + 1}
    depth={row?.depth}
>
    {#snippet actions(reach: number)}
        <ToolButton
            label={t('files.read_again')}
            {title}
            glyph="refresh"
            compact
            tabindex={reach}
            onclick={onretry}
        />
    {/snippet}
</TreeItem>
