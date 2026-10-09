<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The Timeline section, VS Code's: the
    // history of one file, newest first, as the local copies the server keeps before a save, a
    // replace or a delete ("File Saved", "File Replaced", "File Deleted") merged with the commits
    // that touched the file. A commit row is its subject with its author beside it, how long ago
    // at its right end and a tooltip naming the author, the date, the subject and the hash; a copy
    // row is its words with how long ago at its right end.
    //
    // The file is the pinned one, else the one selected in the tree, else the file of the file tab
    // the page showed last, read from the panes' tab order
    // (state/sources/explorer/sections/timeline-state.svelte.ts), so a press in the Files pane, or
    // a Files tab shown for the first time, does not lose it. The head carries Pin, which holds the
    // Timeline on the file it shows, Refresh, which reads both lists again from the first page, and
    // a `...` menu that shows or hides the commits (Git History) and the copies (Local History).
    // The pin and the two choices are the Files tab's own state.
    //
    // The commits come fifty to a page. A Load more row after the last one reads the next page when
    // it is pressed, when Enter is pressed on it and when it scrolls into view, one page at a time.
    // While a page is read the row stays the same row of the tree, with its place and its focus,
    // and says Reading...; the focus stays on it when the page lands. The pages after the first are
    // held under a key naming the repository, the path, the repository's HEAD and the count of
    // Refresh presses, so an answer for a list that is no longer the one drawn is dropped. The
    // copies older than the oldest commit read wait while older commits remain.
    //
    // A press on a commit opens the diff of the file at that commit, at the path it had there,
    // against its parent; a press on a copy opens the diff of that copy against the file now, both
    // in the diff view the Repositories view opens. The right-click menu of a copy offers Restore,
    // which writes the copy back through the source save, so the text it replaces is itself kept
    // as a copy first. A read that failed says so in one line of its own and leaves the other list
    // drawn. This component holds nothing of its own but the line a failed restore said.

    import type { Attachment } from 'svelte/attachments';
    import { untrack } from 'svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Section from '$lib/views/shared/explorer/sections/Section.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import {
        headKeys,
        type SectionMove
    } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { nameOf, type FilesView, type RowRef } from '$lib/state/sources/fs';
    import {
        createPages,
        followedFile
    } from '$lib/state/sources/explorer/sections/timeline-state.svelte';
    import { timelineOf, type TimelineEntry } from '$lib/state/sources/explorer/sections/timeline';
    import { panes } from '$lib/state/workbench/layout';
    import { fileOfTab } from '$lib/state/workbench/navigation/pages';
    import { ago, repoOfFile } from '$lib/state/sources/repositories/file-git';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        open: boolean;
        ontoggle: () => void;
        /** The file selected in the tree, or null when the selection is not one file. */
        selected: RowRef | null;
        /** What the Files tab remembers: the pinned file and the two lists the Timeline shows. */
        view: FilesView;
        /** Write part of the Files tab's own state. */
        onpatch: (part: Partial<FilesView>) => void;
        /** What lets the head be dragged and moved by Alt+Up/Down. */
        move?: SectionMove;
    };

    let { open, ontoggle, selected, view, onpatch, move }: Props = $props();

    const {
        fs: { commitPage, commits, copies, copyText, refreshFile, roots, workspaces },
        layout: { activeInstance, currentPage, layout },
        repositories: { openDiff },
        selectors: { gitFor, gitRoots },
        source: { saveSource }
    } = useState();

    const page = $derived(currentPage().id);
    const pages = createPages();

    const pinned = $derived(view.timelinePinned);
    const followed = $derived(
        followedFile(
            panes(layout(page)).map((held) => held.pane),
            activeInstance(page)?.id ?? null,
            fileOfTab
        )
    );
    const file = $derived(pinned ?? selected ?? followed);

    // A pinned file whose root has left the workspace cannot be read through it, so the pin goes.
    const workspace = $derived(workspaces());
    $effect(() => {
        if (pinned === null || workspace.loading || workspace.error !== '') return;
        const gone = !roots().some((root) => root.key === pinned.root);
        if (gone) untrack(() => onpatch({ timelinePinned: null }));
    });

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

    /** What the repository is at: its branch and its newest commit, which a move of reads again. */
    const head = $derived.by(() => {
        const held = inRepo === null ? null : gitFor(inRepo.root);
        return held === null ? '' : `${held.branch}\n${held.log.at(0)?.hash ?? ''}`;
    });
    const listKey = $derived(
        inRepo === null ? '' : [inRepo.root, inRepo.path, head, String(pages.pressed())].join('\n')
    );

    const saved = $derived(
        file === null || !view.timelineLocal ? null : copies(file.root, file.path)
    );
    const logged = $derived(
        file === null || inRepo === null || !view.timelineGit
            ? null
            : commits(inRepo.root, inRepo.path, head)
    );
    const later = $derived(pages.of(listKey));
    const read = $derived(logged === null ? [] : [...logged.commits, ...later.commits]);
    /** Whether commits older than the last one read remain. */
    const older = $derived(
        logged === null || logged.failed ? false : later.started ? later.more : logged.more
    );
    const rows = $derived(timelineOf(saved?.copies ?? [], read, older));
    const copiesFailed = $derived(saved?.failed === true);
    const commitsFailed = $derived(logged?.failed === true);

    /** The file a restore failed on and what it said; another file leaves the line unsaid. */
    let failed = $state({ on: '', text: '' });
    const fileKey = $derived(file === null ? '' : `${file.root}:${file.path}`);
    const said = $derived(failed.on === fileKey ? failed.text : '');

    const MORE_ID = 'timeline:more';
    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: keyOf(row), parent: 'head' })) : []),
        ...(open && older && !later.failed ? [{ id: MORE_ID, parent: 'head' }] : [])
    ]);

    function keyOf(row: TimelineEntry): string {
        return `timeline:${row.kind}:${row.key}`;
    }

    function labelOf(row: TimelineEntry): string {
        if (row.kind === 'commit') return row.subject;
        if (row.kind === 'replace') return t('files.timeline_replaced');
        if (row.kind === 'lsp-edit') return t('files.timeline_lsp_edited');
        if (row.kind === 'writing-fix') return t('files.timeline_writing_fixed');
        return row.kind === 'save' ? t('files.timeline_saved') : t('files.timeline_deleted');
    }

    function whenOf(row: TimelineEntry): string {
        return row.at === 0 ? '' : ago(new Date(row.at).toISOString());
    }

    /** A moment written out: its date and the time of day, as git wrote its offset. */
    function stampOf(iso: string): string {
        return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
    }

    /** The tooltip of a row: a commit's author, dates, subject and hash, a copy's comparison. */
    function titleOf(row: TimelineEntry): string {
        if (row.kind !== 'commit') return t('files.timeline_row_title', labelOf(row));
        const title = t(
            'files.timeline_commit_title',
            row.author,
            row.email,
            stampOf(row.committed),
            ago(row.committed),
            row.subject,
            row.short
        );
        const same = Date.parse(row.authored) === Date.parse(row.committed);
        return same
            ? title
            : `${title} ${t('files.timeline_commit_authored', stampOf(row.authored))}`;
    }

    /** Open the diff a row stands for. */
    function show(row: TimelineEntry): void {
        if (file === null) return;
        if (row.kind === 'commit') {
            if (inRepo === null) return;
            openDiff(
                {
                    root: inRepo.root,
                    path: row.path,
                    staged: false,
                    worktree: false,
                    commit: row.key,
                    short: row.short
                },
                t('files.timeline_commit_diff', nameOf(row.path), row.short)
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

    /** Read the page after the last commit read, unless one is being read or failed. */
    function loadMore(): void {
        const last = read.at(-1);
        const repository = inRepo;
        if (last === undefined || repository === null || listKey === '') return;
        void pages.next(listKey, () => commitPage(repository.root, repository.path, last.hash));
    }

    /** The Load more row asks for its page when it scrolls into view. */
    const reaching: Attachment<HTMLElement> = (node) => {
        if (typeof IntersectionObserver === 'undefined') return;
        const seen = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) loadMore();
        });
        seen.observe(node);
        return () => seen.disconnect();
    };

    /** Hold the Timeline on the file it shows, or let it follow the editor again. */
    function pin(): void {
        if (pinned !== null) onpatch({ timelinePinned: null });
        else if (file !== null) onpatch({ timelinePinned: { root: file.root, path: file.path } });
    }

    /** Read both lists again from the first page. */
    function refresh(): void {
        pages.refresh();
        if (file === null) return;
        refreshFile(file.root, file.path, inRepo?.root ?? '', inRepo?.path ?? '');
    }

    /** The `...` menu: which of the two lists the Timeline shows. */
    const sources = $derived<MenuItem[]>([
        { id: 'git', label: t('files.timeline_git'), checked: view.timelineGit },
        { id: 'local', label: t('files.timeline_local'), checked: view.timelineLocal }
    ]);

    function picked(id: string): void {
        if (id === 'git') onpatch({ timelineGit: !view.timelineGit });
        else onpatch({ timelineLocal: !view.timelineLocal });
    }
</script>

<div class="timeline" data-fs-timeline>
    <TreeView
        label={t('files.timeline')}
        rows={keyRows}
        {ontoggle}
        keymap={MOVE_KEYMAP}
        onkey={headKeys(move)}
    >
        {#snippet children(nav: TreeNav)}
            <Section
                label={t('files.timeline')}
                {nav}
                count={rows.length}
                {open}
                {ontoggle}
                drag={move?.drag}
            >
                {#snippet more(reach: number)}
                    <ToolButton
                        label={pinned === null
                            ? t('files.timeline_pin')
                            : t('files.timeline_unpin')}
                        glyph="pin"
                        compact
                        pressed={pinned !== null}
                        disabled={pinned === null && file === null}
                        tabindex={reach}
                        onclick={pin}
                    />
                    <ToolButton
                        label={t('files.timeline_refresh')}
                        glyph="refresh"
                        compact
                        disabled={file === null}
                        tabindex={reach}
                        onclick={refresh}
                    />
                    <Menu
                        label={t('files.timeline_actions')}
                        glyph="more"
                        compact
                        bare
                        placement="down"
                        align="right"
                        tabindex={reach}
                        items={sources}
                        onpick={picked}
                    />
                {/snippet}
                {#if file === null}
                    <li role="none">
                        <TreeItem label={t('files.timeline_no_file')} tone="muted" />
                    </li>
                {:else}
                    {#if copiesFailed}
                        <li role="none">
                            <TreeItem label={t('files.timeline_copies_failed')} tone="error" />
                        </li>
                    {/if}
                    {#if commitsFailed}
                        <li role="none">
                            <TreeItem label={t('files.timeline_commits_failed')} tone="error" />
                        </li>
                    {/if}
                    {#if rows.length === 0 && !copiesFailed && !commitsFailed}
                        <li role="none">
                            <TreeItem
                                label={saved?.loading === true || logged?.loading === true
                                    ? t('files.timeline_reading')
                                    : t('files.timeline_empty')}
                                tone="muted"
                            />
                        </li>
                    {/if}
                {/if}
                {#if said !== ''}
                    <li role="none">
                        <TreeItem label={said} tone="error" />
                    </li>
                {/if}
                {#each rows as row (keyOf(row))}
                    {#snippet author()}
                        {row.kind === 'commit' ? row.author : ''}
                    {/snippet}
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
                                trailing
                                title={titleOf(row)}
                                detail={row.kind === 'commit' ? author : undefined}
                                onclick={() => show(row)}
                            >
                                {#snippet end()}
                                    {whenOf(row)}
                                {/snippet}
                            </TreeItem>
                        </ContextMenu>
                    </li>
                {/each}
                {#if later.failed}
                    <li role="none">
                        <TreeItem label={t('files.timeline_commits_failed')} tone="error" />
                    </li>
                {:else if older}
                    <li role="none" data-fs-timeline-more {@attach reaching}>
                        <TreeItem
                            label={later.loading
                                ? t('files.timeline_reading')
                                : t('files.timeline_load_more')}
                            id={MORE_ID}
                            {nav}
                            level={2}
                            tone={later.loading ? 'muted' : 'link'}
                            onclick={later.loading ? undefined : loadMore}
                        />
                    </li>
                {/if}
            </Section>
        {/snippet}
    </TreeView>
</div>
