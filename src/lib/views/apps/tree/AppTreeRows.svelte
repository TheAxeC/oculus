<script lang="ts">
    // Layer 3, partial of AppTree.svelte. The rows of an app's tree view: one line each, drawn
    // through the virtual list of the tree, a right-click menu of the entries of
    // `view/item/context`, and the entries of its group `inline` as buttons on the line. The tree
    // that holds the keys hands `nav`, which the parent keeps to put the cursor on a row.

    import type { Attachment } from 'svelte/attachments';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { AppIcon } from '$lib/state/system/apps/shell/show/icons';
    import type { TreeRow } from '$lib/state/system/apps/shell/show/tree-feed.svelte';
    import type { ChoiceItem } from '$lib/state/system/apps/shell/show/strip';

    type Props = {
        nav: TreeNav;
        rows: TreeRow[];
        /** The position of each row's handle in `rows`. */
        index: Map<string, number>;
        selected: string[];
        /** The choices of a row's menu, and the position and icon of those on its line. */
        menuOf: (row: TreeRow) => {
            items: ChoiceItem[];
            inline: { at: number; icon: AppIcon }[];
        };
        iconOf: (row: TreeRow) => AppIcon;
        onpress: (row: TreeRow, event: MouseEvent) => void;
        onpick: (row: TreeRow, pick: string, event: MouseEvent) => void;
        /** Told the tree's `nav` as the rows are drawn. */
        onnav: (nav: TreeNav) => void;
    };

    let { nav, rows, index, selected, menuOf, iconOf, onpress, onpick, onnav }: Props = $props();

    $effect(() => {
        onnav(nav);
    });
</script>

<ul class="list" role="none">
    <VirtualRows
        count={rows.length}
        key={(at: number) => rows[at].handle}
        {nav}
        owns={(id: string) => index.get(id) ?? -1}
        label={(id: string) => rows[index.get(id) ?? -1]?.label}
    >
        {#snippet item(at: number, measure: Attachment<HTMLElement>)}
            {@const one = rows[at]}
            {@const menu = menuOf(one)}
            {@const icon = iconOf(one)}
            <li role="none" {@attach measure}>
                <ContextMenu
                    label={one.label}
                    items={menu.items.filter(
                        (_, position) => !menu.inline.some((entry) => entry.at === position)
                    )}
                    onpick={(id: string, event: MouseEvent) => onpick(one, id, event)}
                >
                    <TreeItem
                        label={one.label}
                        id={one.handle}
                        {nav}
                        level={one.depth + 1}
                        depth={one.depth}
                        expanded={one.open}
                        selected={selected.includes(one.handle)}
                        glyph={icon !== null && 'glyph' in icon ? icon.glyph : undefined}
                        picture={icon !== null && 'picture' in icon ? icon.picture : undefined}
                        title={one.tooltip === '' ? undefined : one.tooltip}
                        onclick={(event: MouseEvent) => onpress(one, event)}
                    >
                        {#snippet detail()}
                            {one.description}
                        {/snippet}
                        {#snippet actions(tabindex: number)}
                            {#each menu.inline as { at: position, icon: shown } (position)}
                                <ToolButton
                                    label={menu.items[position].label}
                                    glyph={shown !== null && 'glyph' in shown
                                        ? shown.glyph
                                        : undefined}
                                    picture={shown !== null && 'picture' in shown
                                        ? shown.picture
                                        : undefined}
                                    compact
                                    bare
                                    {tabindex}
                                    onclick={(event: MouseEvent) =>
                                        onpick(one, menu.items[position].id, event)}
                                />
                            {/each}
                        {/snippet}
                    </TreeItem>
                </ContextMenu>
            </li>
        {/snippet}
    </VirtualRows>
</ul>

<style>
    .list {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }
</style>
