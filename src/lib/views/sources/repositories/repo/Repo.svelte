<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. The one repository the
    // view shows, under a header row in the explorer's section-head style: the repositories glyph,
    // the name the list's row draws for it and, whenever a branch is known, the branch as the row's
    // Branch control draws it (repo/branch-words.ts), with the path as the header's hover words.
    // Under the header: its commit box, a line saying the last fetch failed while it has (the kind
    // and the fix the hub's `connections.failures` tell it apart by, else the line ssh or git
    // wrote, which is the line's hover words), a line saying a merge, a rebase or a cherry pick is
    // in progress with Abort and, for a rebase, Continue (a cherry pick is finished by committing,
    // so it has none), then Changes, Graph, Stashes, Tags, Branches and Worktrees as collapsible
    // sections of explorer rows, each with its count as a badge at the right edge of its head. How
    // far the branch is from its upstream is on the repository's row in the list above. The
    // sections are one tree and one stop of the focus order through ui/tree/TreeView.svelte, moved
    // along with the arrow keys over the rows state/sources/repositories/change-tree.ts's
    // repositoryKeyRows() lists, Right and Left opening and closing a head or a group. In the
    // view's tree mode the change groups and the files of the open commit draw folders, and the key
    // rows list them. A write in flight (with its Cancel) and what the last write answered are said
    // on one message line laid over the foot of the pane (repo/RepoMessage.svelte). The moving line
    // of an action that says words of its own is drawn under the repository's name in the
    // Repositories section (../RepoList.svelte), so the header draws none.
    //
    // A state with no repository to draw says so as one row in the explorer's row style in place of
    // the sections, which such a state has nothing true to fill: git's reason in the error hue for
    // a repository whose read failed, and the muted sentence for a folder that is not there and for
    // one that is no repository. Every sentence is the one the Changes panel draws, from the one
    // catalog key, so the two views say one thing about one state. The header keeps the branch
    // whenever the state names one, since the branch was read before whatever failed.
    //
    // The sections press through the Source Control store themselves; what asks first is asked in
    // the view's dialog, handed in as `ask`. The graph's menus check a branch out through the
    // view's switch and delete a tag through the Tags section's question. Which sections and
    // folders are closed and which commit of the graph is open are the view's instance state,
    // handed in, so both survive a tab switch. The repository's project commands are a row of
    // buttons above the commit box (views/shared/sessions/CommandBar.svelte). The Branch control
    // of a repository's row asks for the Branches section to open with the focus on its head,
    // through `reveal`.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import Branches from '../refs/Branches.svelte';
    import Changes from '../changes/Changes.svelte';
    import Graph from '../graph/Graph.svelte';
    import Stashes from '../refs/Stashes.svelte';
    import Tags from '../refs/Tags.svelte';
    import Worktrees from '../refs/Worktrees.svelte';
    import CommandBar from '$lib/views/shared/sessions/CommandBar.svelte';
    import CommitBox from '$lib/views/shared/changes/CommitBox.svelte';
    import RepoMessage from './RepoMessage.svelte';
    import {
        drawnChanges,
        everything,
        extended,
        idOfRef,
        pressed,
        refOf,
        type Pick
    } from '../changes/picking';
    import { filesKeymap } from '$lib/state/sources/explorer/acts/keys';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import { repoShape, type RepoShape } from '$lib/state/sources/repositories/repositories';
    import { repositoryKeyRows } from '$lib/state/sources/repositories/change-tree';
    import type { WorktreeStart } from '$lib/state/sources/repositories/repositories.svelte';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { fetchFailureWords } from '$lib/state/workbench/navigation/status';
    import { branchOf } from './branch-words';
    import { useState } from '$lib/state/client/use';
    import { askBranchDelete, askTagDelete } from '../menus/graph-menu';

    type Props = {
        root: string;
        /** The name the list's row draws for the repository. */
        name: string;
        git: GitState;
        /** The section ids the reader closed. */
        collapsed: string[];
        /** The commit of the graph whose files are open. */
        commit: string;
        ontoggle: (id: string) => void;
        oncommit: (hash: string) => void;
        /** Whether the change groups and the open commit's files are lists or folders. */
        mode: 'list' | 'tree';
        /** `branches` while the Branch control of the row asked for that section to open. */
        reveal: '' | 'branches';
        /** The request in `reveal` was answered. */
        onrevealed: () => void;
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        onswitch: (name: string) => void;
        onbranch: (name: string) => void;
        onworktree: (name: string, start: WorktreeStart) => void;
        onremove: (path: string, label: string) => void;
        onmerge: (branch: string, onto: string) => void;
        onterminal: (path: string, label: string) => void;
        onagent: (path: string, agent: 'claude' | 'codex') => void;
        /** The ids of the change rows the reader selected, kept in the view's instance state. */
        picked: string[];
        /** The selection changed to these rows. */
        onpicked: (ids: string[]) => void;
    };

    let {
        root,
        name,
        git,
        collapsed,
        commit,
        ontoggle,
        oncommit,
        mode,
        reveal,
        onrevealed,
        ask,
        onswitch,
        onbranch,
        onworktree,
        onremove,
        onmerge,
        onterminal,
        onagent,
        picked,
        onpicked
    }: Props = $props();

    const { repositories } = useState();

    let graphRows: KeyRow[] = $state([]);

    const keyRows = $derived(repositoryKeyRows(git, collapsed, graphRows, { root, mode }));
    const shape = $derived(repoShape(root, git));
    const busy = $derived(repositories.busy(root));

    /** The keys of the change rows: the selection's two Shift keys and Open to the Side. */
    const keymap = filesKeymap(onMac()).filter(
        (one) =>
            one.action === 'extend-up' || one.action === 'extend-down' || one.action === 'open-side'
    );
    /** The change rows drawn now, in the order they are drawn. */
    const drawnRows = $derived(drawnChanges(keyRows.map((row) => row.id)));
    /** The selected rows that are still drawn: a row staged away or gone leaves the selection. */
    const live = $derived.by(() => {
        const ids = new Set(drawnRows.map(idOfRef));
        return picked.filter((id) => ids.has(id));
    });
    /** The row the last press or key was on, and the row a range grows from. */
    let cursor = $state('');
    let anchor = $state('');
    /** The tree's focus control, held to move the focus with a Shift key. */
    let treeNav: TreeNav | undefined;

    function take(next: Pick, at: string): void {
        anchor = next.anchor;
        cursor = at;
        onpicked(next.picked);
    }

    /** A press on a change row; true when it only changed the selection, so the row stays shut. */
    function pressedRow(id: string, event: MouseEvent): boolean {
        const kind = event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'plain';
        take(pressed({ picked: live, anchor }, cursor, drawnRows, id, kind), id);
        return kind !== 'plain';
    }

    /** A key of the change rows: Cmd+A, Shift+Up, Shift+Down and Cmd+Enter. */
    function keyed(action: string, id: string): boolean {
        const row = refOf(id);
        if (row === null) return false;
        const now = { picked: live, anchor };
        if (action === 'select-all') take(everything(now, id, drawnRows), id);
        else if (action === 'extend-up' || action === 'extend-down') {
            const next = extended(now, id, drawnRows, action === 'extend-up' ? -1 : 1);
            take(next.pick, next.cursor);
            treeNav?.focus(next.cursor);
        } else if (action === 'open-side') {
            repositories.openChangeBeside(root, row.root, row.path);
        } else return false;
        return true;
    }

    /** Keep the tree's focus control, and hand it on to the rows drawn with it. */
    function keep(nav: TreeNav): TreeNav {
        treeNav = nav;
        return nav;
    }

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
        const picking = git.sequence === 'cherry-picking';
        ask(
            picking ? t('repositories.abort_cherry_confirm') : t('repositories.abort_confirm'),
            picking ? t('repositories.abort_cherry_detail') : t('repositories.abort_detail'),
            () => {
                void repositories.abortMerge(root);
            }
        );
    }

    /** The line that says which operation is in progress, with how many files are in conflict. */
    function sequenceWords(held: GitState): string {
        const count = held.conflicted.length;
        if (held.sequence === 'merging') {
            return count === 1 ? t('repositories.merging_one') : t('repositories.merging', count);
        }
        if (held.sequence === 'cherry-picking') {
            return count === 1
                ? t('repositories.cherry_picking_one')
                : t('repositories.cherry_picking', count);
        }
        return count === 1 ? t('repositories.rebasing_one') : t('repositories.rebasing', count);
    }

    /** Delete a tag named on a graph commit, through the Tags section's question. */
    function deleteTag(name: string): void {
        askTagDelete(
            name,
            { ask, deleteTag: (tag: string) => void repositories.deleteTag(root, tag) },
            t
        );
    }

    /** Delete a local branch, through the question the graph's Delete Branch asks. */
    function deleteBranch(name: string): void {
        askBranchDelete(
            name,
            {
                ask,
                deleteBranch: (branch: string) => repositories.deleteBranch(root, branch),
                deleteAnyway: (branch: string) => void repositories.deleteBranchAnyway(root, branch)
            },
            t
        );
    }

    function carryOn(): void {
        ask(t('repositories.continue_confirm'), t('repositories.continue_detail'), () => {
            void repositories.continueRebase(root);
        });
    }
</script>

{#snippet branchWords()}
    <span class="branch" data-repo-branch>{branchOf(git)}</span>
{/snippet}

<section class="repo" data-root={root}>
    <div title={root}>
        <TreeItem
            label={name}
            glyph="repositories"
            heading
            detail={git.detached || git.branch !== '' ? branchWords : undefined}
        />
    </div>
    {#if shape !== 'readable'}
        <!-- git's reason as the row's hover words, the attribute the Changes panel carries it on:
             ui/tree/TreeItem.svelte draws its own tooltip for a row that is pressed, and this row
             is text. -->
        <div data-repo={shape} title={git.error ?? undefined}>
            <TreeItem label={rowLabel(shape, git)} tone={shape === 'failed' ? 'error' : 'muted'} />
        </div>
    {:else}
        <div class="commands">
            <CommandBar repo={root} />
        </div>
        <div class="commit">
            <CommitBox {root} {git} />
        </div>
        {#if git.fetchFailure !== undefined}
            <!-- The line ssh or git wrote as the hover words, the attribute the failed read's row
                 carries git's reason on. -->
            <p class="fetch-failed" data-fetch-failure title={git.fetchFailure.line}>
                {fetchFailureWords(git.fetchFailure)}
            </p>
        {/if}
        {#if git.sequence !== ''}
            <div class="sequence" data-sequence={git.sequence}>
                <span class="said">
                    {sequenceWords(git)}
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
        <TreeView
            label={t('views.repositories')}
            rows={keyRows}
            ontoggle={toggled}
            {keymap}
            onkey={keyed}
        >
            {#snippet children(tree: TreeNav)}
                {@const nav = keep(tree)}
                <Changes
                    {root}
                    {git}
                    {nav}
                    {collapsed}
                    {ontoggle}
                    {ask}
                    {mode}
                    picked={live}
                    onpress={pressedRow}
                />

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
                    {ask}
                    {mode}
                    {collapsed}
                    onfolder={ontoggle}
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
                    ondelete={deleteBranch}
                    {onbranch}
                    reveal={reveal === 'branches'}
                    {onrevealed}
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
                    {onagent}
                    oncreate={onworktree}
                />
            {/snippet}
        </TreeView>
    {/if}
    <RepoMessage {root} />
</section>

<style>
    /* The section fills the pane, so the message line at its end sits at the pane's foot. */
    .repo {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    /* The header's name is drawn in capitals (ui/tree/TreeItem.svelte's heading row); the branch
       words after it keep their own case, since a branch name, the short hash of a detached HEAD
       and the detached sentence read as git and the catalog write them. */
    .branch {
        text-transform: none;
    }

    /* The message box and its button, 11px in from the left of the row and 12px from its right. */
    .commit {
        padding: 0 12px 0 11px;
    }

    /* The row of project commands, in line with the message box beneath it. */
    .commands {
        padding: 0 12px 0 11px;
        margin-bottom: 4px;
    }

    .sequence {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--c-scm-conflict-txt);
        font-size: var(--fs-md);
    }

    .sequence .said {
        margin-right: auto;
    }

    /* The last failed fetch, in line with the message box above it, in the warning hue. */
    .fetch-failed {
        margin: 0;
        padding: 0 12px 0 11px;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }
</style>
