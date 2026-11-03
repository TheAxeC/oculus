<script lang="ts">
    // Layer 3, shared view partial. A repository's change groups as rows of an explorer tree, the
    // part the Repositories view's Changes section
    // (views/sources/repositories/changes/Changes.svelte) and a session's Changes section both
    // draw: Merge Changes while anything is unmerged, then the staged, changed and untracked
    // groups, each a row that opens and closes with its count as a badge at the right edge, and
    // under each one explorer row per path. The caller gives the level and the indent of the group
    // rows, and their rows stand one step further in, in list and tree mode, as VS Code draws a
    // repository's groups under it. An empty merge, staged or untracked group is not drawn, and an
    // empty changed group keeps its row with no rows under it.
    //
    // A group's row carries what acts on the whole group, as VS Code's do: Open Changes (the diff
    // pane over every path of the group; the untracked group has none), Unstage All on the staged
    // group, Discard All Changes and Stage All Changes on the changed group, and Stage All on the
    // untracked one. A discard of the whole group asks first, naming how many paths it throws away.
    //
    // In list mode a group's rows are its files, each with its folder after its name. In tree mode
    // the staged, changed and untracked groups fall into folder rows
    // (state/sources/repositories/change-tree.ts) that open and close; the merge group stays a
    // list. Which groups and folders are folded is the caller's (`folds`), so the Repositories view
    // keeps them in its closed list and a session's section in its tab's folds; a folder that
    // closes with the focus inside it takes the focus. A file row is ChangeRow.svelte and a folder
    // row FolderRow.svelte, both beside it.
    //
    // A group's paths have no cap, so each group draws them through
    // ui/tree/list/VirtualRows.svelte, which draws only the rows in view of the pane and holds the
    // height of the rest; a key moving to a row not drawn has it scrolled in first, and the
    // type-ahead reads every row's name.
    //
    // A press with Cmd (Ctrl off macOS) held adds the row to a selection or takes it out, a press
    // with Shift held selects the rows from the last one pressed (change-picks.svelte.ts), and the
    // Stage, Unstage and Discard controls of a selected row, and the same writes and Add to
    // .gitignore picked from its right-click menu, act on every selected row of its group.
    //
    // A group's row opens a right-click menu of what its controls do (change-menu.ts), with Reveal
    // in Explorer View on a file row; the merge group keeps its own controls and has none.
    //
    // Discarding in the untracked group moves the paths to the Trash: its row carries Discard All
    // Untracked Changes beside Stage All, behind the question VS Code asks, naming the count. When
    // the list was cut at 200 entries (GitState.held holds what git reported), the group that was
    // shortened says so in one muted row under its own, one step in. A linked worktree's rows offer
    // Compare with Workspace. A session's rows open their diff as that session's (`session`) and
    // carry the caller's mark beside the path (`mark`).

    import type { Snippet } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ChangeRow from './ChangeRow.svelte';
    import FolderRow from './FolderRow.svelte';
    import {
        changeGroups,
        changeTree,
        folderId,
        insideFolder,
        leafOf,
        visibleRows,
        type GroupFolds,
        type TreeRow
    } from '$lib/state/sources/repositories/change-tree';
    import { cutGroups } from '$lib/state/sources/repositories/repositories';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        GROUP_DISCARD_ALL,
        GROUP_DISCARD_UNTRACKED,
        GROUP_STAGE_ALL,
        GROUP_STAGE_UNTRACKED,
        GROUP_UNSTAGE_ALL,
        askTrash,
        groupMenu,
        hasMenu,
        type MenuGroupId
    } from './change-menu';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        /** The tree level of a group's row; its rows stand one level further in. */
        level: number;
        /** The indent guides a group's row draws; its rows draw one more. */
        depth: number;
        /** Whether the groups list their files or draw them as folders. */
        mode: 'list' | 'tree';
        /** The ids the groups and folders fold under, and which of them are folded. */
        folds: GroupFolds;
        /** Fold or unfold the group or folder that folds under this id. */
        ontoggle: (id: string) => void;
        /** Ask before a write that loses work, in the view's own dialog. */
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        /** The ids of the rows the reader selected, which the rows' controls act on together. */
        picked: readonly string[];
        /** A press on a row: true when it only changed the selection, so the row does not open. */
        onpress: (id: string, event: MouseEvent) => boolean;
        /** The session whose rows these are, whose diffs they open as its own. */
        session?: string;
        /** Drawn beside a row's path: the caller's mark of the file. */
        mark?: Snippet<[GitEntry]>;
    };

    let {
        root,
        git,
        nav,
        level,
        depth,
        mode,
        folds,
        ontoggle,
        ask,
        picked,
        onpress,
        session,
        mark
    }: Props = $props();

    const { repositories } = useState();

    const groups = $derived(changeGroups(git));
    const busy = $derived(repositories.busy(root));
    /** The groups whose list git cut at 200 entries. */
    const cut = $derived(cutGroups(git));
    /** Whether the repository is a linked worktree, whose rows compare with the main one. */
    const linked = $derived(git.worktrees.some((one) => one.path === root && !one.main));

    /** The words one change group is headed with. */
    function labelOf(id: string): string {
        if (id === 'merge') return t('repositories.merge_changes');
        if (id === 'staged') return t('sessions.ch_staged');
        if (id === 'changed') return t('sessions.ch_changed');
        return t('sessions.ch_untracked');
    }

    /** The row id of one path of a group, which is what the tree and the keys know it by. */
    function rowId(group: string, path: string): string {
        return `change:${group}:${path}`;
    }

    /** The id a row of a group is known by. */
    function idOf(group: string, row: TreeRow<GitEntry>): string {
        return row.kind === 'folder' ? folderId(root, group, row.path) : rowId(group, row.path);
    }

    /** Whether the folder at `path` of a group is open. */
    function folderOpen(group: string, path: string): boolean {
        return !folds.folded(folds.folder(group, path));
    }

    /** The rows each group draws: its files, or in tree mode its folders and files that show. */
    const shown = $derived(
        groups.map((group) => {
            const tree = mode === 'tree' && group.id !== 'merge';
            const rows: TreeRow<GitEntry>[] = tree
                ? visibleRows(changeTree(group.entries), (path) => !folderOpen(group.id, path))
                : group.entries.map((entry) => ({
                      kind: 'file' as const,
                      name: leafOf(entry.path),
                      path: entry.path,
                      depth: 0,
                      entry
                  }));
            const at = new Map(rows.map((row, index) => [idOf(group.id, row), index]));
            return { ...group, rows, at };
        })
    );

    /** Open or close a folder; a folder closing over the row that holds the focus takes it. */
    function folderToggled(group: string, path: string): void {
        const open = folderOpen(group, path);
        ontoggle(folds.folder(group, path));
        if (open && nav.kept().some((held) => insideFolder(held, root, group, path))) {
            nav.focus(folderId(root, group, path));
        }
    }

    /** A pick from a group row's menu: what the row's control of the same name does. */
    function groupPicked(pick: string): void {
        if (pick === GROUP_UNSTAGE_ALL) void repositories.unstageAll(root);
        else if (pick === GROUP_STAGE_ALL) void repositories.stageAll(root, 'changed');
        else if (pick === GROUP_STAGE_UNTRACKED) void repositories.stageAll(root, 'untracked');
        else if (pick === GROUP_DISCARD_ALL) discardAll();
        else if (pick === GROUP_DISCARD_UNTRACKED) discardUntracked();
    }

    /** Ask before moving every untracked path to the Trash. */
    function discardUntracked(): void {
        askTrash(
            root,
            git.untracked.map((one) => one.path),
            {
                ask,
                trash: (at: string, paths: readonly string[]) =>
                    void repositories.trashUntracked(at, paths)
            },
            t
        );
    }

    function discardAll(): void {
        const count = git.unstaged.length;
        const question =
            count === 1 ? t('git.discard_all_confirm_one') : t('git.discard_all_confirm', count);
        ask(question, t('git.discard_all_detail'), () => {
            void repositories.discardAll(root);
        });
    }

    /** Open the diff pane over every path of the staged or the changed group. */
    function openGroup(id: 'staged' | 'changed'): void {
        repositories.openDiff(
            { root, path: '', staged: id === 'staged', worktree: false, group: id },
            id === 'staged'
                ? t('repositories.group_diff_staged')
                : t('repositories.group_diff_changed')
        );
    }
</script>

{#each shown as group (group.id)}
    {@const open = !folds.folded(folds.group(group.id))}
    <li role="none" data-changes={group.id}>
        {#if hasMenu(group.id)}
            <ContextMenu
                label={labelOf(group.id)}
                items={groupMenu(group.id, group.entries.length, busy, t)}
                onpick={groupPicked}
            >
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render groupHead(group, open)}
            </ContextMenu>
        {:else}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render groupHead(group, open)}
        {/if}
    </li>
    {#if open && cut.includes(group.id)}
        <li role="none" data-cut={group.id}>
            <TreeItem label={t('git.cut_warning')} tone="warn" depth={depth + 1} />
        </li>
    {/if}
    {#if open}
        <VirtualRows
            count={group.rows.length}
            key={(at: number) => idOf(group.id, group.rows[at])}
            {nav}
            owns={(id: string) => group.at.get(id) ?? -1}
            label={(id: string) => {
                const at = group.at.get(id);
                return at === undefined ? undefined : group.rows[at].name;
            }}
        >
            {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                {@const row = group.rows[at]}
                {#if row.kind === 'folder'}
                    <FolderRow
                        {root}
                        group={group.id as MenuGroupId}
                        {row}
                        {nav}
                        level={level + 1 + row.depth}
                        depth={depth + 1 + row.depth}
                        open={folderOpen(group.id, row.path)}
                        {busy}
                        ontoggle={() => folderToggled(group.id, row.path)}
                        {ask}
                        {measure}
                    />
                {:else}
                    <ChangeRow
                        {root}
                        entry={row.entry}
                        group={group.id}
                        {nav}
                        level={level + 1 + row.depth}
                        depth={depth + 1 + row.depth}
                        showFolder={mode !== 'tree' || group.id === 'merge'}
                        {busy}
                        {ask}
                        {linked}
                        {picked}
                        {onpress}
                        {session}
                        {mark}
                        {measure}
                    />
                {/if}
            {/snippet}
        </VirtualRows>
    {/if}
{/each}

{#snippet groupHead(group: { id: string; entries: GitEntry[] }, open: boolean)}
    <TreeItem
        label={labelOf(group.id)}
        id={`group:${group.id}`}
        {nav}
        {level}
        {depth}
        count={group.entries.length}
        badge
        expanded={open}
        tone={group.id === 'merge' ? 'error' : undefined}
        onclick={() => ontoggle(folds.group(group.id))}
    >
        {#snippet actions(reach: number)}
            {#if (group.id === 'staged' || group.id === 'changed') && group.entries.length > 0}
                <ToolButton
                    label={t('repositories.diff_open')}
                    glyph="diff"
                    compact
                    tabindex={reach}
                    onclick={() => openGroup(group.id as 'staged' | 'changed')}
                />
            {/if}
            {#if group.id === 'staged'}
                <ToolButton
                    label={t('git.unstage_all')}
                    glyph="unstage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.unstageAll(root)}
                />
            {:else if group.id === 'changed' && group.entries.length > 0}
                <ToolButton
                    label={t('git.discard_all')}
                    glyph="note_back"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={discardAll}
                />
                <ToolButton
                    label={t('git.stage_all')}
                    glyph="stage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.stageAll(root, 'changed')}
                />
            {:else if group.id === 'untracked' && group.entries.length > 0}
                <ToolButton
                    label={t('git.discard_all_untracked')}
                    glyph="note_back"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={discardUntracked}
                />
                <ToolButton
                    label={t('git.stage_all_untracked')}
                    glyph="stage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.stageAll(root, 'untracked')}
                />
            {/if}
        {/snippet}
    </TreeItem>
{/snippet}
