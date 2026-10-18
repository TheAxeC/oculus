<script lang="ts">
    // Layer 3, partial of views/sources/repositories/changes/Changes.svelte. One changed path as an
    // explorer row, drawn as VS Code draws a row of Source Control: the file's Seti icon, then its
    // name in its status colour and struck through for a deleted file, its folder after it at 0.9
    // of the row's size and muted (in the list; the tree has the folder as a row above), its line
    // counts, the controls on hover (Open File, then Discard in Changes and Untracked, then Stage
    // or Unstage), and the status letter last. In the merge group the controls are Open in Merge
    // Editor, Open File and Mark Resolved.
    //
    // The row's tooltip is the whole path, then what a press opens. Pressing the row opens what it
    // stands for (state/sources/repositories/repositories.svelte.ts's openChange): the three-way
    // merge editor for a conflict, the file for an untracked path, and the diff for the rest. A
    // conflict's status is its unmerged pair, worded and coloured as a conflict. The colour of a
    // status is state/sources/repositories/repositories.ts's statusStyle() and the line counts are
    // shared/changes/ChangeCounts.svelte, which the session views' Changes panel draws them with,
    // so the two lists agree.
    //
    // A row of Changes, Staged and Untracked opens a right-click menu of what its controls do
    // (menus/change-menu.ts), with Reveal in Explorer View, Add to .gitignore, Open File (HEAD),
    // Open File (Index) and, on a linked worktree, Compare with Workspace besides; the merge group
    // has none. The controls and the menu's writes act on the same paths (`acted`): every selected
    // row of the group when this row is among them, this row alone otherwise; the menu's items that
    // open something open this row. A Discard picked there asks the question the row's Discard
    // control asks: the restore question on a changed row, and on an untracked row the Trash
    // question, whose yes moves the files to the Trash, each naming the count when it acts on
    // several.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import ChangeCounts from '$lib/views/shared/changes/ChangeCounts.svelte';
    import { dirOf, isFolderPath, leafOf } from '$lib/state/sources/repositories/change-tree';
    import { statusStyle, statusWordKey } from '$lib/state/sources/repositories/repositories';
    import type { GitEntry } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        askDiscardPaths,
        askTrash,
        changeMenu,
        changePicked,
        hasMenu
    } from '../menus/change-menu';
    import { actedPaths } from './picking';

    type Props = {
        root: string;
        entry: GitEntry;
        group: string;
        nav: TreeNav;
        /** The tree level of the row: one below its group, and one more for each folder above. */
        level: number;
        /** The indent guides the row draws. */
        depth: number;
        /** Whether the folder is said after the name, which the list does and the tree does not. */
        showFolder: boolean;
        busy: boolean;
        /** Ask before a write that loses work, in the view's own dialog. */
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        /** Whether the repository is a linked worktree, whose rows compare with the main one. */
        linked?: boolean;
        /**
         * The ids of the rows selected in the view; the controls act on them when this row is one.
         */
        picked: readonly string[];
        /**
         * A press on the row, told before it opens anything: true when the press only changed the
         * selection (Cmd or Shift held), so the row does not open.
         */
        onpress: (id: string, event: MouseEvent) => boolean;
        /** The row's measuring hook, handed by the list that draws only the rows in view. */
        measure: Attachment<HTMLElement>;
    };

    let {
        root,
        entry,
        group,
        nav,
        level,
        depth,
        showFolder,
        busy,
        ask,
        linked = false,
        picked,
        onpress,
        measure
    }: Props = $props();

    const { repositories } = useState();

    const id = $derived(`change:${group}:${entry.path}`);
    /** The paths of the row's group the controls act on: the selected ones, or the row's own. */
    const acted = $derived(actedPaths(picked, id));

    /** The folder a path sits in, which a row says after the file's own name. */
    const folder = $derived(dirOf(entry.path));

    /** The whole path, which the row may cut, and what a press opens, as its hover words. */
    const title = $derived.by(() => {
        if (group === 'merge') return `${entry.path}\n${t('repositories.merge_open_title')}`;
        if (group === 'untracked') return `${entry.path}\n${t('repositories.open_file_title')}`;
        const opens =
            group === 'staged' ? t('repositories.diff_staged_title') : t('repositories.diff_title');
        return `${entry.path}\n${opens}`;
    });

    /** The calls a pick from the row's menu runs, the row's own controls' among them. */
    const deps = {
        ask: (message: string, detail: string, act: () => void, confirm?: string) =>
            ask(message, detail, act, confirm),
        discardPaths: (at: string, paths: readonly string[]) =>
            void repositories.discardPaths(at, paths),
        trash: (at: string, paths: readonly string[]) =>
            void repositories.trashUntracked(at, paths),
        ignore: (at: string, paths: readonly string[]) => void repositories.ignore(at, paths),
        openChange: (at: string, kind: string, path: string) =>
            repositories.openChange(at, kind, path),
        openHead: (at: string, kind: string, path: string) => repositories.openHead(at, kind, path),
        openIndex: (at: string, kind: string, path: string) =>
            repositories.openIndex(at, kind, path),
        compareWorkspace: (at: string, _kind: string, path: string) => {
            repositories.compareWorkspace(at, path);
        },
        openFile: (at: string, path: string) => void repositories.openFile(at, path),
        stagePaths: (at: string, paths: readonly string[]) =>
            void repositories.stagePaths(at, paths),
        unstagePaths: (at: string, paths: readonly string[]) =>
            void repositories.unstagePaths(at, paths),
        reveal: (at: string, path: string) => void repositories.revealFile(at, path)
    };
</script>

<li role="none" data-entry={entry.path} {@attach measure}>
    {#if hasMenu(group)}
        <ContextMenu
            label={entry.path}
            items={changeMenu(group, busy, t, linked)}
            onpick={(pick: string) =>
                changePicked(pick, { root, group, path: entry.path, acted }, deps, t)}
        >
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render item()}
        </ContextMenu>
    {:else}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render item()}
    {/if}
</li>

{#snippet item()}
    <TreeItem
        label={leafOf(entry.path)}
        file={isFolderPath(entry.path) ? undefined : entry.path}
        glyph={isFolderPath(entry.path) ? t('files.folder_glyph') : undefined}
        name={t('repositories.change_name', entry.path, t(statusWordKey(entry.status)))}
        {id}
        selected={picked.length > 1 && picked.includes(id)}
        {nav}
        {level}
        {depth}
        {title}
        struck={entry.status === 'D'}
        nameStyle={statusStyle(entry.status)}
        onclick={(event: MouseEvent) => {
            if (!onpress(id, event)) repositories.openChange(root, group, entry.path);
        }}
    >
        {#snippet detail()}
            <span class="fit">
                {#if showFolder && folder !== ''}
                    <span class="folder">{folder}</span>
                {/if}
                {#if group !== 'merge'}
                    <span class="detail-counts"><ChangeCounts {entry} /></span>
                {/if}
            </span>
        {/snippet}
        {#snippet actions(reach: number)}
            {#if group === 'merge'}
                <ToolButton
                    label={t('repositories.merge_open')}
                    glyph="merge"
                    compact
                    tabindex={reach}
                    onclick={() => repositories.openMerge(root, entry.path)}
                />
            {/if}
            <ToolButton
                label={t('repositories.open_file')}
                glyph="open_file"
                compact
                tabindex={reach}
                onclick={() => repositories.openFile(root, entry.path)}
            />
            {#if group === 'changed'}
                <ToolButton
                    label={t('git.discard')}
                    title={t('git.discard_title')}
                    glyph="note_back"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => askDiscardPaths(root, acted, deps, t)}
                />
            {:else if group === 'untracked'}
                <ToolButton
                    label={t('git.discard')}
                    title={t('git.trash_title')}
                    glyph="note_back"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => askTrash(root, acted, deps, t)}
                />
            {/if}
            {#if group === 'staged'}
                <ToolButton
                    label={t('git.unstage')}
                    title={t('git.unstage_title')}
                    glyph="unstage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => deps.unstagePaths(root, acted)}
                />
            {:else if group === 'merge'}
                <ToolButton
                    label={t('repositories.merge_mark')}
                    title={t('repositories.merge_mark_title')}
                    glyph="expand"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => void repositories.markResolved(root, entry.path)}
                />
            {:else}
                <ToolButton
                    label={t('git.stage')}
                    title={t('git.stage_title')}
                    glyph="stage"
                    compact
                    tabindex={reach}
                    disabled={busy}
                    onclick={() => deps.stagePaths(root, acted)}
                />
            {/if}
        {/snippet}
        {#snippet end()}
            <span class="st" style={statusStyle(entry.status)}>{entry.status}</span>
        {/snippet}
    </TreeItem>
{/snippet}

<style>
    /* The detail's one line: the counts are drawn whole or not at all, since a cut count reads as
       another number. Counts with no room wrap onto a second line, which the line's height and
       its clip keep out of sight, and the folder is cut with an ellipsis. */
    .fit {
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        align-items: center;
        min-width: 0;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        overflow: hidden;
    }

    /* A line's first item never wraps, so this empty one opens the first line: the counts of a row
       with no folder can still wrap away. It is the row's height, so the second line starts below
       the clip and none of it shows. */
    .fit::before {
        content: '';
        flex: none;
        width: 0;
        height: 100%;
    }

    .fit .folder {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* 90% of the row's own size: the detail part is drawn at the small size, so the folder is
       sized from the tree's font token, as the status letter below is. */
    .folder {
        margin-left: 0.5em;
        font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9);
        opacity: 0.7;
    }

    .detail-counts {
        display: inline-flex;
        flex: none;
        gap: 4px;
        margin-left: 4px;
    }

    /* VS Code's decoration box: 16px wide, the letter centred, 5px from what precedes it. At 90%
       of the row's own size: the row's end slot is drawn at the small size, so the letter is sized
       from the tree's font token rather than from what it sits in. */
    .st {
        display: inline-block;
        width: calc(var(--icon-box) * var(--text-scale, 1));
        margin-left: 5px;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-ui);
        font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9);
        font-weight: 600;
        opacity: 0.75;
    }
</style>
