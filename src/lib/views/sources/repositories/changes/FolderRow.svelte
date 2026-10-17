<script lang="ts">
    // Layer 3, partial of views/sources/repositories/changes/Changes.svelte. One folder of a change
    // group in the view's tree mode: a row with a chevron that opens and closes it, named by its
    // whole path when a chain of folders with one child each was joined into it. Its controls, on
    // hover and in its right-click menu (menus/change-menu.ts), act on every path under the folder
    // in one write: Unstage in Staged, Discard (asking first, naming how many paths and the folder)
    // and Stage in Changes, Stage in Untracked; the menu adds Add to .gitignore, and Discard in
    // Untracked sends the paths to the Trash behind the Trash question. All are disabled while a
    // write runs on the repository.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import { folderId, type FolderRow } from '$lib/state/sources/repositories/change-tree';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        askDiscardFolder,
        folderMenu,
        folderPicked,
        type MenuGroupId
    } from '../menus/change-menu';

    type Props = {
        root: string;
        group: MenuGroupId;
        row: FolderRow;
        nav: TreeNav;
        open: boolean;
        busy: boolean;
        /** Open or close the folder, by its id in the instance's closed list. */
        ontoggle: (id: string) => void;
        /** Ask before a write that loses work, in the view's own dialog. */
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        /** The row's measuring hook, handed by the list that draws only the rows in view. */
        measure: Attachment<HTMLElement>;
    };

    let { root, group, row, nav, open, busy, ontoggle, ask, measure }: Props = $props();

    const { repositories } = useState();

    const id = $derived(folderId(root, group, row.path));

    /** The calls a pick from the folder's menu runs, and its Discard control's question. */
    const deps = {
        ask: (message: string, detail: string, act: () => void, confirm?: string) =>
            ask(message, detail, act, confirm),
        stagePaths: (at: string, paths: readonly string[]) =>
            void repositories.stagePaths(at, paths),
        unstagePaths: (at: string, paths: readonly string[]) =>
            void repositories.unstagePaths(at, paths),
        discardPaths: (at: string, paths: readonly string[]) =>
            void repositories.discardPaths(at, paths),
        trashPaths: (at: string, paths: readonly string[]) =>
            void repositories.trashUntracked(at, paths),
        ignorePaths: (at: string, paths: readonly string[]) => void repositories.ignore(at, paths)
    };

    const target = $derived({ root, folder: row.path, paths: row.paths, group });
</script>

<li role="none" data-folder={row.path} {@attach measure}>
    <ContextMenu
        label={row.path}
        items={folderMenu(group, busy, t)}
        onpick={(pick: string) => folderPicked(pick, target, deps, t)}
    >
        <TreeItem
            label={row.name}
            name={row.path}
            {id}
            {nav}
            level={3 + row.depth}
            depth={2 + row.depth}
            expanded={open}
            onclick={() => ontoggle(id)}
        >
            {#snippet actions(reach: number)}
                {#if group === 'changed'}
                    <ToolButton
                        label={t('repositories.folder_discard_title')}
                        title={busy
                            ? repositories.busyWords(root)
                            : t('repositories.folder_discard_title')}
                        glyph="note_back"
                        compact
                        tabindex={reach}
                        disabled={busy}
                        onclick={() => askDiscardFolder(target, deps, t)}
                    />
                {/if}
                {#if group === 'staged'}
                    <ToolButton
                        label={t('repositories.folder_unstage_title')}
                        title={busy
                            ? repositories.busyWords(root)
                            : t('repositories.folder_unstage_title')}
                        glyph="unstage"
                        compact
                        tabindex={reach}
                        disabled={busy}
                        onclick={() => deps.unstagePaths(root, row.paths)}
                    />
                {:else}
                    <ToolButton
                        label={t('repositories.folder_stage_title')}
                        title={busy
                            ? repositories.busyWords(root)
                            : t('repositories.folder_stage_title')}
                        glyph="stage"
                        compact
                        tabindex={reach}
                        disabled={busy}
                        onclick={() => deps.stagePaths(root, row.paths)}
                    />
                {/if}
            {/snippet}
        </TreeItem>
    </ContextMenu>
</li>
