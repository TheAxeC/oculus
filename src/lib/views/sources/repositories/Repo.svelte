<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. The one repository the
    // view shows: its branch line, then Changes, Commits, Branches and Worktrees as collapsible
    // sections of explorer rows, each with its count at the right edge of its head. The sections
    // are one tree and one stop of the focus order through ui/tree/TreeView.svelte, moved along
    // with the arrow keys over the rows state/sources/repositories.ts's repositoryKeyRows() lists,
    // Right and Left opening and closing a head or a group.
    //
    // A state with no repository to draw says so as one row in the explorer's row style in place of
    // the sections, which such a state has nothing true to fill: git's reason in the error hue for
    // a repository whose read failed, and the muted sentence for a folder that is not there and for
    // one that is no repository. Every sentence is the one the Changes panel draws, from the one
    // catalog key, so the two views say one thing about one state. The branch line and the path
    // stay above the row whenever the state names a branch, since the branch was read before
    // whatever failed.
    //
    // Four of the six shapes of views/shared/changes/repo-shape.ts are drawn here, and the picker
    // offers a root of each: state/sources/repositories.ts's pickerRoots() offers every root the
    // channel carries, so a folder that is not there, one that is no repository, a repository whose
    // read failed and one that reads are all reachable. The two that are not drawn are `unplaced`
    // and `reading`, which need a root with no name and a root with no state, and this file is
    // drawn for neither.
    //
    // It draws and reports presses; every write is the view's, so a section knows nothing about the
    // endpoint. Which sections are closed is the view's instance state, handed in, so a section the
    // reader closed stays closed across a tab switch and a switch to another repository.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import Branches from './Branches.svelte';
    import Changes from './Changes.svelte';
    import Worktrees from './Worktrees.svelte';
    import { elide, stamp } from '$lib/state/words/format';
    import { repositoryKeyRows, type DiffSubject } from '$lib/state/sources/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/words/text';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import { repoShape, type RepoShape } from '$lib/state/sources/repositories';

    type Props = {
        root: string;
        git: GitState;
        busy: boolean;
        outcome: string;
        /** The section ids the reader closed. */
        collapsed: string[];
        ontoggle: (id: string) => void;
        onstage: (path: string) => void;
        onunstage: (path: string) => void;
        ondiscard: (path: string) => void;
        ondiff: (subject: DiffSubject, label: string) => void;
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
        busy,
        outcome,
        collapsed,
        ontoggle,
        onstage,
        onunstage,
        ondiscard,
        ondiff,
        onswitch,
        onbranch,
        onworktree,
        onremove,
        onmerge,
        onterminal
    }: Props = $props();

    const keyRows = $derived(repositoryKeyRows(git, collapsed));
    const shape = $derived(repoShape(root, git));

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
        <TreeView label={t('views.repositories')} rows={keyRows} ontoggle={toggled}>
            {#snippet children(nav: TreeNav)}
                <Changes
                    {root}
                    {git}
                    {nav}
                    {collapsed}
                    {ontoggle}
                    {onstage}
                    {onunstage}
                    {ondiscard}
                    {ondiff}
                />

                <div data-group="log">
                    <TreeSection
                        label={t('repositories.log')}
                        id="log"
                        {nav}
                        count={git.log.length}
                        open={!collapsed.includes('log')}
                        ontoggle={() => ontoggle('log')}
                    >
                        {#if git.log.length === 0}
                            <li role="none">
                                <TreeItem label={t('repositories.log_empty')} tone="muted" />
                            </li>
                        {/if}
                        {#each git.log as commit (commit.hash)}
                            <li role="none" data-commit={commit.hash}>
                                <TreeItem
                                    label={commit.subject}
                                    id={`commit:${commit.hash}`}
                                    {nav}
                                    level={2}
                                    glyph="commit"
                                >
                                    {#snippet detail()}
                                        <span class="hash">{commit.short}</span>
                                    {/snippet}
                                    {#snippet end()}
                                        {stamp(commit.when)}
                                    {/snippet}
                                </TreeItem>
                            </li>
                        {/each}
                    </TreeSection>
                </div>

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
                    {ondiff}
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

    .hash {
        margin-right: 4px;
        font-family: var(--font-mono);
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
</style>
