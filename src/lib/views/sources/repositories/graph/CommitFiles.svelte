<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. The paths one commit
    // changed, read from GET /api/git when the commit is opened, each a row of the tree under its
    // commit with its status that opens the commit's diff of that path in a diff pane. The rows'
    // ids go to the graph, which puts them after the commit's own in the keyboard's order.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { nameOf } from '$lib/state/sources/fs';
    import {
        commitUrl,
        statusStyle,
        type GitCommitFile
    } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
        hash: string;
        nav: TreeNav;
        /** Handed the file rows' ids, in order, each time the files are read. */
        onrows: (ids: string[]) => void;
    };

    let { root, hash, nav, onrows }: Props = $props();

    const { repositories } = useState();

    let files: GitCommitFile[] = $state([]);
    let failure = $state('');
    let reading = $state(true);

    $effect(() => {
        void load(root, hash);
    });

    $effect(() => {
        onrows(files.map((file) => idOf(file)));
    });

    /** A file row's id in the tree, unique across the commits the graph may open. */
    function idOf(file: GitCommitFile): string {
        return `file:${hash}:${file.path}`;
    }

    async function load(from: string, commit: string): Promise<void> {
        reading = true;
        try {
            const response = await fetch(commitUrl(from, commit));
            const body = (await response.json()) as { files?: GitCommitFile[]; error?: string };
            files = Array.isArray(body.files) ? body.files : [];
            failure = response.ok ? '' : (body.error ?? t('repositories.graph_failed'));
        } catch {
            failure = t('repositories.graph_failed');
        } finally {
            reading = false;
        }
    }

    function opened(file: GitCommitFile): void {
        repositories.openDiff(
            { root, path: file.path, staged: false, worktree: false, commit: hash },
            t('repositories.commit_diff_label', nameOf(file.path), hash.slice(0, 7))
        );
    }
</script>

{#if failure !== ''}
    <li role="none">
        <TreeItem label={failure} depth={1} tone="error" />
    </li>
{:else if reading && files.length === 0}
    <li role="none">
        <TreeItem label={t('repositories.graph_pending')} depth={1} tone="muted" />
    </li>
{/if}
{#each files as file (file.path)}
    <li role="none" data-commit-file={file.path}>
        <TreeItem
            label={nameOf(file.path)}
            id={idOf(file)}
            {nav}
            level={3}
            depth={1}
            glyph="diff"
            title={file.from === ''
                ? file.path
                : t('repositories.renamed_from', file.path, file.from)}
            onclick={() => opened(file)}
        >
            {#snippet detail()}
                {file.path}
            {/snippet}
            {#snippet end()}
                <span class="st" style={statusStyle(file.status)}>{file.status}</span>
            {/snippet}
        </TreeItem>
    </li>
{/each}

<style>
    .st {
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }
</style>
