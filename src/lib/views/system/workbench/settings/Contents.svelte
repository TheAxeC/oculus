<script lang="ts">
    // Layer 3, view partial. The table of contents of the Settings view, on the left: each group
    // and, under it while it is open, its headed sections. A press on a group scrolls the list to
    // that group's heading and closes the group when it was open, opens it when it was closed (a
    // group with no section stays as it is); a press on a section scrolls to its heading; Left and
    // Right close and open a group. The heading at the top of the list is drawn as the selected
    // row.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { t } from '$lib/state/shared/words/text';
    import { pressedGroups, toggledGroups, type TocEntry } from '$lib/state/system/config/groups';

    type Props = {
        entries: TocEntry[];
        /** The id of the heading at the top of the list. */
        current: string;
        onpick: (id: string) => void;
    };

    let { entries, current, onpick }: Props = $props();

    /** The groups the reader closed. */
    let closed: string[] = $state([]);

    const rows = $derived(
        entries.flatMap((entry) => {
            const open = !closed.includes(entry.id);
            return [
                // A group with no section has nothing to open, so it carries no `open`.
                entry.sections.length > 0
                    ? { id: entry.id, parent: null, open }
                    : { id: entry.id, parent: null },
                ...(open ? entry.sections.map((one) => ({ id: one.id, parent: entry.id })) : [])
            ];
        })
    );

    function toggle(id: string): void {
        closed = toggledGroups(closed, id);
    }

    function pressGroup(entry: TocEntry): void {
        closed = pressedGroups(closed, entry);
        onpick(entry.id);
    }
</script>

<TreeView label={t('workbench.settings_contents')} {rows} ontoggle={toggle}>
    {#snippet children(nav: TreeNav)}
        {#each entries as entry (entry.id)}
            {@const open = !closed.includes(entry.id)}
            <div class="group">
                <TreeItem
                    label={entry.title}
                    id={entry.id}
                    {nav}
                    level={1}
                    expanded={entry.sections.length > 0 ? open : undefined}
                    selected={current === entry.id}
                    onclick={() => pressGroup(entry)}
                />
                {#if open && entry.sections.length > 0}
                    <ul class="sections" role="group" aria-label={entry.title}>
                        {#each entry.sections as one (one.id)}
                            <li role="none">
                                <TreeItem
                                    label={one.heading}
                                    id={one.id}
                                    {nav}
                                    level={2}
                                    depth={1}
                                    selected={current === one.id}
                                    onclick={() => onpick(one.id)}
                                />
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/each}
    {/snippet}
</TreeView>

<style>
    .group {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .sections {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }
</style>
