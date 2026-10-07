<script lang="ts">
    // Layer 3, partial of the TeX view. The Commands section: the tree of commands.ts under a head
    // that opens and closes it. A group opens and closes by a press on its row or the arrow keys, a
    // command runs by a press on its row, and a group that holds no command is not drawn. The
    // groups the reader closed are this component's own, since which of them is closed is nothing
    // the view needs to keep across a reload.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { t } from '$lib/state/shared/words/text';
    import { toggled } from '../../shared/latex/opened';
    import type { CommandNode } from './commands';

    type Props = {
        nodes: CommandNode[];
        open: boolean;
        ontoggle: () => void;
    };

    let { nodes, open, ontoggle }: Props = $props();

    /** The groups the reader opened; a group starts closed, as LaTeX Workshop's tree does. */
    let opened: string[] = $state([]);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? nodes.flatMap((node) => {
                  const here = opened.includes(node.id);
                  return [
                      { id: node.id, parent: 'head', open: here },
                      ...(here
                          ? (node.children ?? []).map((child) => ({
                                id: `${node.id}/${child.id}`,
                                parent: node.id
                            }))
                          : [])
                  ];
              })
            : [])
    ]);

    function toggle(id: string): void {
        if (id === 'head') {
            ontoggle();
            return;
        }
        opened = toggled(opened, id);
    }
</script>

<div class="commands" data-latex-commands>
    <TreeView label={t('latex.commands')} {rows} ontoggle={toggle}>
        {#snippet children(nav: TreeNav)}
            <TreeSection label={t('latex.commands')} id="head" {nav} {open} {ontoggle}>
                {#each nodes as node (node.id)}
                    {@const here = opened.includes(node.id)}
                    <li role="none">
                        <TreeItem
                            label={node.label}
                            id={node.id}
                            {nav}
                            level={2}
                            glyph={node.glyph}
                            expanded={node.children === undefined ? undefined : here}
                            onclick={() =>
                                node.children === undefined ? node.run?.() : toggle(node.id)}
                        />
                    </li>
                    {#if here}
                        {#each node.children ?? [] as child (child.id)}
                            <li role="none">
                                <TreeItem
                                    label={child.label}
                                    id={`${node.id}/${child.id}`}
                                    {nav}
                                    level={3}
                                    depth={1}
                                    onclick={() => child.run?.()}
                                />
                            </li>
                        {/each}
                    {/if}
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
