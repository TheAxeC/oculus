<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. The one repository the
    // view shows: its branch line, the commit box, a line saying a merge or a rebase is in progress
    // with Abort and, for a rebase, Continue, then Changes, Graph, Stashes, Tags, Branches and
    // Worktrees as collapsible sections of explorer rows, each with its count at the right edge of
    // its head. The sections are one tree and one stop of the focus order through
    // ui/tree/TreeView.svelte, moved along with the arrow keys over the rows
    // state/sources/repositories/repositories.ts's repositoryKeyRows() lists, Right and Left
    // opening and closing a head or a group.
    //
    // A state with no repository to draw says so as one row in the explorer's row style in place of
    // the sections, which such a state has nothing true to fill: git's reason in the error hue for
    // a repository whose read failed, and the muted sentence for a folder that is not there and for
    // one that is no repository. Every sentence is the one the Changes panel draws, from the one
    // catalog key, so the two views say one thing about one state. The branch line and the path
    // stay above the row whenever the state names a branch, since the branch was read before
    // whatever failed.
    //
    // The sections press through the Source Control store themselves; what asks first is asked in
    // the view's dialog, handed in as `ask`. The graph's menus check a branch out through the
    // view's switch and delete a tag through the Tags section's question. Which sections are closed
    // and which commit of the graph is open are the view's instance state, handed in, so both
    // survive a tab switch.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import Branches from './refs/Branches.svelte';
    import Changes from './Changes.svelte';
    import Worktrees from './Worktrees.svelte';
    import Graph from './graph/Graph.svelte';
    import Stashes from './refs/Stashes.svelte';
    import Tags from './refs/Tags.svelte';
    import CommitBox from '$lib/views/shared/changes/CommitBox.svelte';
    import { elide } from '$lib/state/shared/words/format';
    import {
        repoShape,
        repositoryKeyRows,
        type RepoShape
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import { useState } from '$lib/state/client/use';
    import { askTagDelete } from './menus/graph-menu';

    type Props = {
        root: string;
        git: GitState;
        /** The section ids the reader closed. */
        collapsed: string[];
        /** The commit of the graph whose files are open. */
        commit: string;
        ontoggle: (id: string) => void;
        oncommit: (hash: string) => void;
        ask: (message: string, detail: string, act: () => void) => void;
        onswitch: (name: string) => void;
        onbranch: (name: string) => void;
        onworktree: (name: string) => void;
        onremove: (path: string, label: string) => void;
        onmerge: (branch: string, onto: string) => void;
        onterminal: (path: string, label: string) => void;
    };

    let {
        root,
        git,
        collapsed,
        commit,
        ontoggle,
        oncommit,
        ask,
        onswitch,
        onbranch,
        onworktree,
        onremove,
        onmerge,
        onterminal
    }: Props = $props();

    const { repositories } = useState();

    let graphRows: KeyRow[] = $state([]);

    const keyRows = $derived(repositoryKeyRows(git, collapsed, graphRows));
    const shape = $derived(repoShape(root, git));
    const busy = $derived(repositories.busy(root));
    const outcome = $derived(repositories.outcome(root));

    /** A key's toggle names a group by its row id; the view keeps it by the group's own id. */
    function toggled(id: string): void {
        ontoggle(id.startsWith('group:') ? id.slice('group:'.length) : id);
    }

    /** The one row a state with no repository to draw says in place of the sections. */
    function rowLabel(drawn: RepoShape, held: GitState): string {
        if (drawn === 'missing') return t('sessions.ch_nofolder');
        if (drawn === 'none') return t('sessions.ch_norepo');
        return t('sessions.ch_failed', held.error ?? '');
    }

    function abort(): void {
        ask(t('repositories.abort_confirm'), t('repositories.abort_detail'), () => {
            void repositories.abortMerge(root);
        });
    }

    /** Delete a tag named on a graph commit, through the Tags section's question. */
    function deleteTag(name: string): void {
        askTagDelete(
            name,
            { ask, deleteTag: (tag: string) => void repositories.deleteTag(root, tag) },
            t
        );
    }

    function carryOn(): void {
        ask(t('repositories.continue_confirm'), t('repositories.continue_detail'), () => {
            void repositories.continueRebase(root);
        });
    }
</script>

<section class="repo" data-root={root}>
    {#if git.branch !== ''}
        <div class="branch" title={root}>
            <span class="lb">{t('sessions.ch_branch')}</span>
            <span class="nm">{git.branch}</span>
            <span class="mt">{branchState(git)}</span>
        </div>
    {/if}
    <p class="path" title={root}>{elide(root)}</p>
    {#if busy}
        <p class="none">{t('git.busy')}</p>
    {/if}
    {#if outcome !== ''}
        <p class="outcome">{outcome}</p>
    {/if}

    {#if shape !== 'readable'}
        <!-- git's reason as the row's hover words, the attribute the Changes panel carries it on:
             ui/tree/TreeItem.svelte draws its own tooltip for a row that is pressed, and this row
             is text. -->
        <div data-repo={shape} title={git.error ?? undefined}>
            <TreeItem label={rowLabel(shape, git)} tone={shape === 'failed' ? 'error' : 'muted'} />
        </div>
    {:else}
        <CommitBox {root} {git} />
        {#if git.sequence !== ''}
            <div class="sequence" data-sequence={git.sequence}>
                <span class="said">
                    {git.sequence === 'merging'
                        ? t('repositories.merging', git.conflicted.length)
                        : t('repositories.rebasing', git.conflicted.length)}
                </span>
                {#if git.sequence === 'rebasing' && git.conflicted.length === 0}
                    <ToolButton
                        label={t('repositories.continue')}
                        glyph="goto"
                        disabled={busy}
                        onclick={carryOn}
                    />
                {/if}
                <ToolButton
                    label={t('repositories.abort')}
                    glyph="cross"
                    disabled={busy}
                    onclick={abort}
                />
            </div>
        {/if}
        <TreeView label={t('views.repositories')} rows={keyRows} ontoggle={toggled}>
            {#snippet children(nav: TreeNav)}
                <Changes {root} {git} {nav} {collapsed} {ontoggle} {ask} />

                <Graph
                    {root}
                    {git}
                    {nav}
                    open={!collapsed.includes('graph')}
                    ontoggle={() => ontoggle('graph')}
                    {commit}
                    onpick={oncommit}
                    onrows={(rows: KeyRow[]) => (graphRows = rows)}
                    {busy}
                    {onswitch}
                    ondeletetag={deleteTag}
                />

                <Stashes
                    {root}
                    {git}
                    {nav}
                    open={!collapsed.includes('stashes')}
                    ontoggle={() => ontoggle('stashes')}
                    {ask}
                />

                <Tags
                    {root}
                    {git}
                    {nav}
                    open={!collapsed.includes('tags')}
                    ontoggle={() => ontoggle('tags')}
                    {ask}
                />

                <Branches
                    {git}
                    {nav}
                    {busy}
                    open={!collapsed.includes('branches')}
                    ontoggle={() => ontoggle('branches')}
                    {onswitch}
                    {onbranch}
                />

                <Worktrees
                    {root}
                    {git}
                    {nav}
                    {busy}
                    open={!collapsed.includes('worktrees')}
                    ontoggle={() => ontoggle('worktrees')}
                    ondiff={repositories.openDiff}
                    {onremove}
                    {onmerge}
                    {onterminal}
                    oncreate={onworktree}
                />
            {/snippet}
        </TreeView>
    {/if}
</section>

<style>
    .repo {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .branch {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
    }

    .branch .lb,
    .branch .mt {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .branch .mt {
        margin-left: auto;
    }

    .path {
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
    }

    .none {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .outcome {
        margin: 0;
        font-size: var(--fs-md);
    }

    .sequence {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--c-scm-conflict-txt);
        font-size: var(--fs-sm);
    }

    .sequence .said {
        margin-right: auto;
    }
</style>
