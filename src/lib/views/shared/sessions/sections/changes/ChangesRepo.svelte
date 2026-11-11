<script lang="ts">
    // Layer 3, partial of ChangesRepository.svelte beside it. The repository a session works in
    // when git has read it, under its group row: its branch line, the new-branch field and the
    // commit box, then its change groups one step in, then the line of a write in flight and what
    // the last write answered. The change groups are the Repositories view's own
    // (views/shared/changes/groups/GroupList.svelte): their rows, controls, right-click menus,
    // selection, tree mode, cut warning and Compare with Workspace, with the session's rows opening
    // their diffs as the session's and carrying the mark of a file another live session holds
    // open (SharedMark.svelte). The commit box is views/shared/changes/CommitBox.svelte, the one
    // the Repositories view draws, so a message typed here is the message that view shows for the
    // same repository, the four ways to commit are the same four, and its one button says Sync
    // Changes or Publish Branch where there is nothing to commit, which is how this section pushes.
    //
    // The branch line, the field and the commit box are no rows of the tree: Tab reaches them and
    // the arrows pass them by.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import CommitBox from '$lib/views/shared/changes/CommitBox.svelte';
    import GroupList from '$lib/views/shared/changes/groups/GroupList.svelte';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import type { GroupFolds } from '$lib/state/sources/repositories/change-tree';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import SharedMark from './SharedMark.svelte';

    type Props = {
        root: string;
        state: GitState;
        /** The session whose repository this is, whose diffs the rows open as its own. */
        session: string;
        nav: TreeNav;
        mode: 'list' | 'tree';
        folds: GroupFolds;
        onfold: (id: string) => void;
        picked: readonly string[];
        onpress: (id: string, event: MouseEvent) => boolean;
        /** Ask before a write that loses work, in the section's own dialog. */
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        branchItems: MenuItem[];
        busy: boolean;
        /** What the busy line says while a write runs: the action's words, or Working. */
        busyWords: string;
        branchName: string;
        outcome: string;
        shared: (path: string) => string[];
        onswitch: (name: string) => void;
        onbranch: () => void;
        onbranchname: (name: string) => void;
        /** Ends the git write in flight; absent while the busy work is not a git write. */
        oncancel?: () => void;
    };

    let {
        root,
        state,
        session,
        nav,
        mode,
        folds,
        onfold,
        picked,
        onpress,
        ask,
        branchItems,
        busy,
        busyWords,
        branchName,
        outcome,
        shared,
        onswitch,
        onbranch,
        onbranchname,
        oncancel
    }: Props = $props();
</script>

{#snippet mark(entry: GitEntry)}
    <SharedMark also={shared(entry.path)} />
{/snippet}

<li role="none" class="lines" data-repo="readable">
    <div class="branch">
        <span class="lb">{t('sessions.ch_branch')}</span>
        <Menu label={state.branch} items={branchItems} placement="down" onpick={onswitch} />
        <span class="mt">{branchState(state)}</span>
    </div>
    <div class="newbranch">
        <span class="lb">{t('git.branch_new')}</span>
        <TextInput value={branchName} label={t('git.branch_new_label')} oninput={onbranchname} />
        <ToolButton label={t('git.branch_new_create')} disabled={busy} onclick={onbranch} />
    </div>
    <div class="commit">
        <CommitBox {root} git={state} />
    </div>
</li>
<GroupList
    {root}
    git={state}
    {nav}
    level={3}
    depth={2}
    {mode}
    {folds}
    ontoggle={onfold}
    {ask}
    {picked}
    {onpress}
    {session}
    {mark}
/>
{#if busy}
    <li role="none" class="lines busy">
        <span class="none">{busyWords}</span>
        {#if oncancel !== undefined}
            <ToolButton
                small
                label={t('git.cancel')}
                title={t('git.cancel_title')}
                onclick={oncancel}
            />
        {/if}
    </li>
{/if}
{#if outcome !== ''}
    <li role="none">
        <TreeItem label={outcome} depth={2} />
    </li>
{/if}

<style>
    /* The lines that are no rows stand where a row's words under the group row start: past two
       indent guides and the arrow's box. */
    .lines {
        --inset: calc(
            2 * (var(--tree-indent) * var(--text-scale, 1) + 2 * var(--tree-guide-gap)) +
                var(--icon-box) * var(--text-scale, 1) + 6px
        );
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        padding: 4px 8px 6px var(--inset);
    }
    .busy {
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }
    .none {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .branch,
    .newbranch {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
    .branch .lb,
    .newbranch .lb {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .branch .mt {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
