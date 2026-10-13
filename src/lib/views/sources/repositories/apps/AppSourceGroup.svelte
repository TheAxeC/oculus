<script lang="ts">
    // Layer 3, partial of views/sources/repositories/apps/AppSource.svelte. One group of an app's
    // source control: a head with the group's label and its count, then its resources, drawn
    // through ui/tree/list/VirtualRows.svelte so a group of thousands draws the rows in view. In
    // the view's tree mode the resources fall into folders that open and close, each folder a row
    // with the `scm/resourceFolder/context` entries. The entries of `scm/resourceGroup/context` in
    // the group `inline` are buttons on the head and the others its right-click menu; both act on
    // the group. A folder's commands act on the resources below it.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import ActionStrip from '$lib/ui/tabs/ActionStrip.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import AppSourceRow from './AppSourceRow.svelte';
    import { groupId, groupRows, resourceId } from '$lib/state/system/apps/tools/source-rows';
    import { folderId } from '$lib/state/sources/repositories/change-tree';
    import { scmKey } from '$lib/state/system/apps/tools/scm.svelte';
    import type { AppScmGroup, AppScmState } from '$lib/state/system/apps/tools/scm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        control: AppScmState;
        group: AppScmGroup;
        nav: TreeNav;
        collapsed: string[];
        ontoggle: (id: string) => void;
        mode: 'list' | 'tree';
        picked: readonly string[];
        onpress: (uri: string, event: MouseEvent) => boolean;
    };

    let { control, group, nav, collapsed, ontoggle, mode, picked, onpress }: Props = $props();

    const { appShell, appTools } = useState();

    const key = $derived(scmKey(control.app, control.id));
    const head = $derived(groupId(key, group.id));
    const open = $derived(!collapsed.includes(head));
    const rows = $derived(groupRows(key, group, mode, collapsed));
    const at = $derived(
        new Map(
            rows.map((row, index) => [
                row.kind === 'folder'
                    ? folderId(key, group.id, row.path)
                    : resourceId(key, group.id, row.entry.uri),
                index
            ])
        )
    );
    const keys = $derived({ scmProvider: control.id, scmResourceGroup: group.id });
    const inline = $derived(appShell.strip('scm/resourceGroup/context', { keys }, 'inline'));
    const menu = $derived(appShell.choices('scm/resourceGroup/context', { keys }, '', 'inline'));
    const folderInline = $derived(appShell.strip('scm/resourceFolder/context', { keys }, 'inline'));
    const folderMenu = $derived(
        appShell.choices('scm/resourceFolder/context', { keys }, '', 'inline')
    );

    /** The uris of the resources below a folder row. */
    function below(paths: readonly string[]): string[] {
        const wanted = new Set(paths);
        return group.resources
            .filter((one) => wanted.has(one.path === '' ? one.uri : one.path))
            .map((one) => one.uri);
    }

    function runGroup(offers: typeof inline.offers, pick: string, alt: boolean): void {
        void appTools.scm.execute(control, offers, pick, { scope: 'group', group: group.id }, alt);
    }

    function runFolder(
        offers: typeof inline.offers,
        pick: string,
        paths: readonly string[],
        alt: boolean
    ): void {
        void appTools.scm.execute(
            control,
            offers,
            pick,
            { scope: 'resource', group: group.id, resources: below(paths) },
            alt
        );
    }
</script>

<li role="none" data-scm-group={group.id}>
    <ContextMenu
        label={group.label}
        items={menu.items}
        onpick={(pick: string) => runGroup(menu.offers, pick, false)}
    >
        <TreeItem
            label={group.label}
            id={head}
            {nav}
            level={2}
            count={group.resources.length}
            badge
            expanded={open}
            onclick={() => ontoggle(head)}
        >
            {#snippet actions()}
                <ActionStrip
                    label={t('repositories.app_source_group_actions')}
                    actions={inline.actions}
                    onpick={(pick: string, event: MouseEvent) =>
                        runGroup(inline.offers, pick, event.altKey)}
                />
            {/snippet}
        </TreeItem>
    </ContextMenu>
</li>
{#if open}
    <VirtualRows
        count={rows.length}
        key={(index: number) => {
            const row = rows[index];
            return row.kind === 'folder'
                ? folderId(key, group.id, row.path)
                : resourceId(key, group.id, row.entry.uri);
        }}
        {nav}
        owns={(id: string) => at.get(id) ?? -1}
        label={(id: string) => {
            const index = at.get(id);
            return index === undefined ? undefined : rows[index].name;
        }}
    >
        {#snippet item(index: number, measure: Attachment<HTMLElement>)}
            {@const row = rows[index]}
            {#if row.kind === 'folder'}
                {@const id = folderId(key, group.id, row.path)}
                {@const paths = row.paths}
                <li role="none" {@attach measure}>
                    <ContextMenu
                        label={row.name}
                        items={folderMenu.items}
                        onpick={(pick: string) => runFolder(folderMenu.offers, pick, paths, false)}
                    >
                        <TreeItem
                            label={row.name}
                            folder={row.name}
                            {id}
                            {nav}
                            level={3 + row.depth}
                            depth={1 + row.depth}
                            expanded={!collapsed.includes(id)}
                            onclick={() => ontoggle(id)}
                        >
                            {#snippet actions()}
                                <ActionStrip
                                    label={t('repositories.app_source_folder_actions')}
                                    actions={folderInline.actions}
                                    onpick={(pick: string, event: MouseEvent) =>
                                        runFolder(folderInline.offers, pick, paths, event.altKey)}
                                />
                            {/snippet}
                        </TreeItem>
                    </ContextMenu>
                </li>
            {:else}
                <AppSourceRow
                    {control}
                    group={group.id}
                    resource={row.entry}
                    {nav}
                    level={3 + row.depth}
                    depth={1 + row.depth}
                    showFolder={mode !== 'tree'}
                    {picked}
                    {onpress}
                    {measure}
                />
            {/if}
        {/snippet}
    </VirtualRows>
{/if}
