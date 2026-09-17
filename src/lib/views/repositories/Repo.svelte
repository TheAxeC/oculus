<script lang="ts">
    // Layer 3, partial of views/Repositories.svelte. The one repository the view shows: its branch
    // line, then Changes, Commits, Branches and Worktrees as collapsible sections of explorer rows,
    // each with its count at the right edge of its head. The sections are one tree and one stop of
    // the focus order through ui/TreeView.svelte, moved along with the arrow keys over the rows
    // state/repositories.ts's repositoryKeyRows() lists, Right and Left opening and closing a head or
    // a group.
    //
    // It draws and reports presses; every write is the view's, so a section knows nothing about the
    // endpoint. Which sections are closed is the view's instance state, handed in, so a section the
    // reader closed stays closed across a tab switch and a switch to another repository.

    import TreeItem from '$lib/ui/TreeItem.svelte';
    import TreeSection from '$lib/ui/TreeSection.svelte';
    import TreeView from '$lib/ui/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree-keys';
    import Branches from './Branches.svelte';
    import Changes from './Changes.svelte';
    import Worktrees from './Worktrees.svelte';
    import { elide, stamp } from '$lib/state/format';
    import { repositoryKeyRows, type DiffSubject } from '$lib/state/repositories';
    import type { GitState } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

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

    /** A key's toggle names a group by its row id; the view keeps it by the group's own id. */
    function toggled(id: string): void {
        ontoggle(id.startsWith('group:') ? id.slice('group:'.length) : id);
    }

    /** What the branch line says beside the name: detached, the distance, or in step. */
    function branchState(held: GitState): string {
        const bits: string[] = [];
        if (held.detached) bits.push(t('sessions.ch_detached'));
        if (held.ahead > 0) bits.push(t('sessions.ch_ahead', held.ahead));
        if (held.behind > 0) bits.push(t('sessions.ch_behind', held.behind));
        if (bits.length === 0) bits.push(t('sessions.ch_insync'));
        return bits.join(` ${t('sessions.meta_sep')} `);
    }
</script>

<section class="repo" data-root={root}>
    <div class="branch" title={root}>
        <span class="lb">{t('sessions.ch_branch')}</span>
        <span class="nm">{git.branch}</span>
        <span class="mt">{branchState(git)}</span>
    </div>
    <p class="path" title={root}>{elide(root)}</p>
    {#if busy}
        <p class="none">{t('git.busy')}</p>
    {/if}
    {#if outcome !== ''}
        <p class="outcome">{outcome}</p>
    {/if}

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
