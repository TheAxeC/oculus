<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The paths one commit
    // changed, read from GET /api/git when the commit is opened, each a row of the tree under its
    // commit with its Seti icon, its folder after the name in the list and its status, that opens
    // the commit's diff of that path in a diff pane. Given a `range` in place of a commit, the rows
    // are the paths changed between its two commits (Incoming Changes and Outgoing Changes), read
    // as a comparison, each opening that comparison's diff of its path. Beside each row are the
    // lanes of the graph that pass the commit, 3 px on the open commit's own. The rows go to the
    // graph, which puts them after the commit's own in the keyboard's order.
    //
    // In the view's tree mode the paths fall into folder rows as the change groups' do, a folder
    // opening and closing by a press, and taking the focus when it closes over the row that holds
    // it; a file row then carries its name alone. The folders' closed ids are the instance's,
    // under a group named for the commit and the place it is drawn in, so two commits, and one
    // commit drawn in two lists, close apart.

    import { untrack } from 'svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import Lanes from './Lanes.svelte';
    import { readJson } from '$lib/data/shapes/shapes';
    import { nameOf } from '$lib/state/sources/fs';
    import { commitFilesOf } from '$lib/state/sources/repositories/answers';
    import {
        changeTree,
        dirOf,
        folderId,
        insideFolder,
        visibleRows,
        type TreeRow
    } from '$lib/state/sources/repositories/change-tree';
    import {
        commitUrl,
        statusStyle,
        type GitCommitFile
    } from '$lib/state/sources/repositories/repositories';
    import { refCompareUrl } from '$lib/state/sources/repositories/diff/compare';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
        hash: string;
        /** The commit's abbreviated hash, git's `%h`, which a file's diff names the commit by. */
        short: string;
        /**
         * The two commits whose difference is listed in place of the commit's own change (`hash`
         * is then `to`), and the words a file's diff is named by.
         */
        range?: { from: string; to: string; label: string };
        /**
         * Where the files are drawn (`log` under a commit of the history, `outside` under a commit
         * drawn above it, `incoming` or `outgoing` under the entry of that side), so the ids of
         * the rows and the folders of two lists drawn at once are each one row's.
         */
        place: string;
        nav: TreeNav;
        /**
         * Handed the rows drawn, in order, each time they change; a row whose parent is null sits
         * directly under the commit.
         */
        onrows: (rows: KeyRow[]) => void;
        /** The lanes that pass beside the commit's files, and the commit's own among them. */
        passing: number[];
        open: number;
        mode?: 'list' | 'tree';
        collapsed?: readonly string[];
        /** Open or close a folder. */
        onfolder?: (id: string) => void;
        /**
         * The files the component starts with, before its read replaces them. A render that runs
         * no effect, as a server rendering does not, draws these.
         */
        seed?: GitCommitFile[];
    };

    let {
        root,
        hash,
        short,
        range,
        place,
        nav,
        onrows,
        passing,
        open,
        mode = 'list',
        collapsed = [],
        onfolder = () => undefined,
        seed = []
    }: Props = $props();

    const { repositories } = useState();

    // The seed is the files the component starts with; the read below replaces them.
    let files: GitCommitFile[] = $state(untrack(() => seed));
    let failure = $state('');
    let reading = $state(true);

    $effect(() => {
        void load(root, hash);
    });

    /** The group a folder of this commit's files is named under in the closed list. */
    const group = $derived(`commit-${place}-${hash}`);

    /** The rows drawn: the files as they come, or the folders and files of the tree. */
    const rows = $derived.by((): TreeRow<GitCommitFile>[] => {
        if (mode !== 'tree') {
            return files.map((file) => ({
                kind: 'file' as const,
                depth: 0,
                path: file.path,
                name: nameOf(file.path),
                entry: file
            }));
        }
        return visibleRows(changeTree(files), (path) =>
            collapsed.includes(folderId(root, group, path))
        );
    });

    $effect(() => {
        const keys: KeyRow[] = [];
        const folders: string[] = [];
        for (const row of rows) {
            const parent = row.depth === 0 ? null : folders[row.depth - 1];
            if (row.kind === 'folder') {
                const id = folderId(root, group, row.path);
                folders[row.depth] = id;
                keys.push({ id, parent, open: !collapsed.includes(id) });
            } else {
                keys.push({ id: idOf(row.entry), parent });
            }
        }
        onrows(keys);
    });

    /** Open or close a folder; a folder closing over the row that holds the focus takes it. */
    function folderToggled(path: string): void {
        const id = folderId(root, group, path);
        const closing = !collapsed.includes(id);
        onfolder(id);
        const holding = nav
            .kept()
            .some((kept) => insideFolder(kept, root, group, path, `file:${place}:${hash}:`));
        if (closing && holding) nav.focus(id);
    }

    /** A file row's id in the tree, unique across the commits the graph may open. */
    function idOf(file: GitCommitFile): string {
        return `file:${place}:${hash}:${file.path}`;
    }

    async function load(from: string, commit: string): Promise<void> {
        reading = true;
        try {
            const response = await fetch(
                range === undefined
                    ? commitUrl(from, commit)
                    : refCompareUrl(from, range.from, range.to)
            );
            const read = commitFilesOf(response.ok, await readJson(response));
            files = read.files ?? files;
            failure = read.failure;
        } catch {
            failure = t('repositories.graph_failed');
        } finally {
            reading = false;
        }
    }

    function opened(file: GitCommitFile): void {
        if (range !== undefined) {
            const compare = { from: range.from, to: range.to };
            repositories.openDiff(
                { root, path: file.path, staged: false, worktree: false, compare },
                t('repositories.range_diff_label', nameOf(file.path), range.label)
            );
            return;
        }
        repositories.openDiff(
            { root, path: file.path, staged: false, worktree: false, commit: hash, short },
            t('repositories.commit_diff_label', nameOf(file.path), short)
        );
    }
</script>

{#if failure !== ''}
    <li role="none">
        <TreeItem label={failure} depth={2} tone="error" />
    </li>
{:else if reading && files.length === 0}
    <li role="none">
        <TreeItem label={t('repositories.graph_pending')} depth={2} tone="muted" />
    </li>
{/if}
{#each rows as row (row.kind === 'folder' ? `dir:${row.path}` : row.path)}
    <li role="none" class="file" data-commit-file={row.kind === 'file' ? row.path : undefined}>
        {#if passing.length > 0}
            <Lanes {passing} {open} />
        {/if}
        <div class="item">
            {#if row.kind === 'folder'}
                {@const id = folderId(root, group, row.path)}
                <TreeItem
                    label={row.name}
                    {id}
                    {nav}
                    level={3 + row.depth}
                    depth={1 + row.depth}
                    expanded={!collapsed.includes(id)}
                    onclick={() => folderToggled(row.path)}
                />
            {:else if row.kind === 'file'}
                {@const file = row.entry}
                <TreeItem
                    label={row.name}
                    id={idOf(file)}
                    {nav}
                    level={3 + row.depth}
                    depth={1 + row.depth}
                    file={file.path}
                    title={file.from === ''
                        ? file.path
                        : t('repositories.renamed_from', file.path, file.from)}
                    onclick={() => opened(file)}
                >
                    {#snippet detail()}
                        {#if mode !== 'tree'}
                            {dirOf(file.path)}
                        {/if}
                    {/snippet}
                    {#snippet end()}
                        <span class="st" style={statusStyle(file.status)}>{file.status}</span>
                    {/snippet}
                </TreeItem>
            {/if}
        </div>
    </li>
{/each}

<style>
    /* A file row stands one step in from the Graph's section head, as its commit does, its lanes
       included, and its own depth puts it one step under the commit. */
    .file {
        display: flex;
        align-items: center;
        min-width: 0;
        padding-left: calc(var(--tree-guide-gap, 4px) + var(--tree-indent) * var(--text-scale, 1));
    }

    .item {
        flex: 1 1 auto;
        min-width: 0;
    }

    .st {
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }
</style>
