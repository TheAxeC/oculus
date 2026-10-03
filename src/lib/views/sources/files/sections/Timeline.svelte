<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Timeline section: the history of
    // one file, newest first, as the local copies the server keeps before a save, a replace or a
    // delete ("File Saved", "File Replaced", "File Deleted") merged with the commits that touched
    // the file, each row with how long ago it was and a commit's subject. The file is the one
    // selected in the tree when a file is, else the file of the active tab.
    //
    // A press on a copy opens the diff of that copy against the file now; a press on a commit opens
    // the diff of the file at that commit against its parent, both in the diff view the
    // Repositories view opens. The right-click menu of a copy offers Restore, which writes the copy
    // back through the source save, so the text it replaces is itself kept as a copy first.
    //
    // The reads are the file store's `copies` and `commits`, which are keyed by the file and its
    // version: another file is another read, and an answer for a file no longer asked about is not
    // drawn. This component holds nothing of its own but the line a failed restore said.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Section from './Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { nameOf, type RowRef } from '$lib/state/sources/fs';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { timelineOf, type TimelineEntry } from '$lib/state/sources/explorer/sections/timeline';
    import { ago, repoOfFile } from '$lib/state/sources/repositories/file-git';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        open: boolean;
        ontoggle: () => void;
        /** The file selected in the tree, or null when the selection is not one file. */
        selected: RowRef | null;
    };

    let { open, ontoggle, selected }: Props = $props();

    const {
        fs: { commits, copies, copyText, workspaces },
        layout: { activeInstance, currentPage },
        repositories: { openDiff },
        selectors: { gitFor, gitRoots },
        source: { saveSource }
    } = useState();

    const tab = $derived(activeInstance(currentPage().id));
    const file = $derived(selected ?? (tab === null ? null : fileOfTab(tab)));

    /** The repository holding the file and its path there, or null for a file in none. */
    const inRepo = $derived.by(() => {
        if (file === null) return null;
        const served = workspaces().workspaces.flatMap((workspace) => workspace.roots);
        const repos = gitRoots().filter((one) => {
            const held = gitFor(one);
            return held !== null && held.repository && held.error === null;
        });
        return repoOfFile(served, file, repos);
    });

    const saved = $derived(file === null ? null : copies(file.root, file.path));
    const logged = $derived(
        file === null || inRepo === null
            ? null
            : commits(inRepo.root, inRepo.path, file.root, file.path)
    );
    const rows = $derived(timelineOf(saved?.copies ?? [], logged?.commits ?? []));
    const error = $derived(
        [saved?.error, logged?.error].find((one) => one !== undefined && one !== '') ?? ''
    );

    /** The file a restore failed on and what it said; another file leaves the line unsaid. */
    let failed = $state({ on: '', text: '' });
    const fileKey = $derived(file === null ? '' : `${file.root}:${file.path}`);
    const said = $derived(failed.on === fileKey ? failed.text : '');

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: keyOf(row), parent: 'head' })) : [])
    ]);

    function keyOf(row: TimelineEntry): string {
        return `timeline:${row.kind}:${row.key}`;
    }

    function labelOf(row: TimelineEntry): string {
        if (row.kind === 'commit') return row.subject;
        if (row.kind === 'replace') return t('files.timeline_replaced');
        return row.kind === 'save' ? t('files.timeline_saved') : t('files.timeline_deleted');
    }

    function whenOf(row: TimelineEntry): string {
        return row.at === 0 ? '' : ago(new Date(row.at).toISOString());
    }

    /** Open the diff a row stands for. */
    function show(row: TimelineEntry): void {
        if (file === null) return;
        if (row.kind === 'commit') {
            if (inRepo === null) return;
            openDiff(
                {
                    root: inRepo.root,
                    path: inRepo.path,
                    staged: false,
                    worktree: false,
                    commit: row.key
                },
                t('files.timeline_commit_diff', nameOf(file.path), row.short)
            );
            return;
        }
        openDiff(
            { root: file.root, path: file.path, staged: false, worktree: false, save: row.key },
            t('files.timeline_save_diff', nameOf(file.path))
        );
    }

    /** The menu of one row: Restore on a copy, nothing on a commit. */
    function menuOf(row: TimelineEntry): MenuItem[] {
        return row.kind === 'commit' ? [] : [{ id: 'restore', label: t('files.timeline_restore') }];
    }

    /** Write a copy back over the file, and say why when it cannot be. */
    async function restore(row: TimelineEntry): Promise<void> {
        if (file === null || row.kind === 'commit') return;
        const on = fileKey;
        const say = (text: string): void => {
            failed = { on, text };
        };
        const text = await copyText(file.root, file.path, row.key);
        if (text === null) {
            say(t('files.timeline_restore_failed'));
            return;
        }
        const answer = await saveSource(file.root, file.path, text);
        say(answer.ok ? '' : t('files.timeline_restore_failed'));
    }
</script>

<div class="timeline" data-fs-timeline>
    <TreeView label={t('files.timeline')} rows={keyRows} {ontoggle}>
        {#snippet children(nav: TreeNav)}
            <Section label={t('files.timeline')} {nav} count={rows.length} {open} {ontoggle}>
                {#if file === null}
                    <li role="none">
                        <TreeItem label={t('files.timeline_no_file')} tone="muted" />
                    </li>
                {:else if error !== ''}
                    <li role="none">
                        <TreeItem label={t('files.timeline_failed', error)} tone="error" />
                    </li>
                {:else if rows.length === 0}
                    <li role="none">
                        <TreeItem
                            label={saved?.loading === true || logged?.loading === true
                                ? t('files.timeline_reading')
                                : t('files.timeline_empty')}
                            tone="muted"
                        />
                    </li>
                {/if}
                {#if said !== ''}
                    <li role="none">
                        <TreeItem label={said} tone="error" />
                    </li>
                {/if}
                {#each rows as row (keyOf(row))}
                    <li role="none" data-fs-timeline-row={row.key}>
                        <ContextMenu
                            label={t('files.timeline_menu')}
                            items={menuOf(row)}
                            onpick={() => void restore(row)}
                        >
                            <TreeItem
                                label={labelOf(row)}
                                id={keyOf(row)}
                                {nav}
                                level={2}
                                glyph={row.kind === 'commit' ? 'commit' : 'save'}
                                title={t('files.timeline_row_title', labelOf(row))}
                                onclick={() => show(row)}
                            >
                                {#snippet detail()}
                                    {whenOf(row)}
                                {/snippet}
                            </TreeItem>
                        </ContextMenu>
                    </li>
                {/each}
            </Section>
        {/snippet}
    </TreeView>
</div>
