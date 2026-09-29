<script lang="ts">
    // A tree for tests/ui/tree/tree.test.ts: one ui/tree/TreeView.svelte drawing one
    // ui/tree/TreeItem.svelte per row it is handed, in order. Every row is given level 1 and the
    // arrow its own `open` asks for, so the levels a rendering carries are the tree's and not the
    // harness's. The rows the tree keeps drawn (`nav.kept`) are written on a hidden line after
    // them.

    import TreeItem from '../../../src/lib/ui/tree/TreeItem.svelte';
    import TreeView from '../../../src/lib/ui/tree/TreeView.svelte';
    import type { KeyRow, TreeNav } from '../../../src/lib/ui/tree/tree-keys.ts';

    type Props = {
        rows: (KeyRow & { label: string })[];
        current?: string;
    };

    let { rows, current }: Props = $props();
</script>

<TreeView label="Harness" {rows} {current}>
    {#snippet children(nav: TreeNav)}
        {#each rows as row (row.id)}
            <TreeItem
                label={row.label}
                id={row.id}
                {nav}
                level={1}
                expanded={row.open}
                onclick={() => undefined}
            />
        {/each}
        <p hidden data-kept={nav.kept().join(',')}></p>
    {/snippet}
</TreeView>
