<script lang="ts">
    // Layer 3, partial of views/sources/repositories/changes/Changes.svelte. One changed path as an
    // explorer row, drawn as VS Code draws a row of Source Control: the file's Seti icon, then its
    // name in its status colour and struck through for a deleted file, its folder after it at 0.9
    // of the row's size and muted (in the list; the tree has the folder as a row above), its line
    // counts, the controls on hover (Open File, then Discard in Changes, then Stage or Unstage),
    // and the status letter last. In the merge group the controls are Open in Merge Editor, Open
    // File and Mark Resolved.
    //
    // Pressing the row opens what it stands for
    // (state/sources/repositories/repositories.svelte.ts's openChange): the three-way merge editor
    // for a conflict, the file for an untracked path, and the diff for the rest. A conflict's
    // status is its unmerged pair, worded and coloured as a conflict. The colour of a status is
    // state/sources/repositories/repositories.ts's statusStyle() and the line counts are
    // shared/changes/ChangeCounts.svelte, which the session views' Changes panel draws them with,
    // so the two lists agree.
    //
    // A row of Changes, Staged and Untracked opens a right-click menu of what its controls do
    // (menus/change-menu.ts), with Reveal in Explorer View besides; the merge group has none. A
    // Discard picked there asks the question the row's Discard control asks.

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
    import { askDiscard, changeMenu, changePicked, hasMenu } from '../menus/change-menu';

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
        ask: (message: string, detail: string, act: () => void) => void;
        /** The row's measuring hook, handed by the list that draws only the rows in view. */
        measure: Attachment<HTMLElement>;
    };

    let { root, entry, group, nav, level, depth, showFolder, busy, ask, measure }: Props = $props();

    const { repositories } = useState();

    /** The folder a path sits in, which a row says after the file's own name. */
    const folder = $derived(dirOf(entry.path));

    /** What pressing the row opens, as its hover words. */
    const title = $derived.by(() => {
        if (group === 'merge') return t('repositories.merge_open_title');
        if (group === 'untracked') return t('repositories.open_file_title');
        return group === 'staged'
            ? t('repositories.diff_staged_title')
            : t('repositories.diff_title');
    });

    /** The calls a pick from the row's menu runs, the row's own controls' among them. */
    const deps = {
        ask: (message: string, detail: string, act: () => void) => ask(message, detail, act),
        discard: (at: string, path: string) => void repositories.discard(at, path),
        openChange: (at: string, kind: string, path: string) =>
            repositories.openChange(at, kind, path),
        openFile: (at: string, path: string) => void repositories.openFile(at, path),
        stage: (at: string, path: string) => void repositories.stage(at, path),
        unstage: (at: string, path: string) => void repositories.unstage(at, path),
        reveal: (at: string, path: string) => void repositories.revealFile(at, path)
    };
</script>

<li role="none" data-entry={entry.path} {@attach measure}>
    {#if hasMenu(group)}
        <ContextMenu
            label={entry.path}
            items={changeMenu(group, busy, t)}
            onpick={(pick: string) =>
                changePicked(pick, { root, group, path: entry.path }, deps, t)}
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
        id={`change:${group}:${entry.path}`}
        {nav}
        {level}
        {depth}
        {title}
        struck={entry.status === 'D'}
        nameStyle={statusStyle(entry.status)}
        onclick={() => repositories.openChange(root, group, entry.path)}
    >
        {#snippet detail()}
            {#if showFolder && folder !== ''}
                <span class="folder">{folder}</span>
            {/if}
            {#if group !== 'merge'}
                <span class="detail-counts"><ChangeCounts {entry} /></span>
            {/if}
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
                    onclick={() => askDiscard(root, entry.path, deps, t)}
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
                    onclick={() => void repositories.unstage(root, entry.path)}
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
                    onclick={() => void repositories.stage(root, entry.path)}
                />
            {/if}
        {/snippet}
        {#snippet end()}
            <span class="st" style={statusStyle(entry.status)}>{entry.status}</span>
        {/snippet}
    </TreeItem>
{/snippet}

<style>
    /* 90% of the row's own size: the detail part is drawn at the small size, so the folder is
       sized from the tree's font token, as the status letter below is. */
    .folder {
        margin-left: 0.5em;
        font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9);
        opacity: 0.7;
    }

    .detail-counts {
        display: inline-flex;
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
