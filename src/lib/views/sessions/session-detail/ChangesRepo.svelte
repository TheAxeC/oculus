<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/ChangesRepository.svelte. The repository a
    // session works in when git has read it: its branch line, the new-branch field, its changes and
    // the commit box. The commit box is views/shared/changes/CommitBox.svelte, the one the
    // Repositories view draws, so a message typed here is the message that view shows for the same
    // repository, the four ways to commit are the same four, and its one button says Sync Changes
    // or Publish Branch where there is nothing to commit, which is how this section pushes.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ChangeGroups from '$lib/views/shared/changes/ChangeGroups.svelte';
    import CommitBox from '$lib/views/shared/changes/CommitBox.svelte';
    import type { ChangeActions } from '$lib/views/shared/changes/change-actions';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import SharedMark from './SharedMark.svelte';

    type Props = {
        root: string;
        state: GitState;
        branchItems: MenuItem[];
        busy: boolean;
        branchName: string;
        outcome: string;
        shared: (path: string) => string[];
        onswitch: (name: string) => void;
        onbranch: () => void;
        onbranchname: (name: string) => void;
        /** Ends the git write in flight; absent while the busy work is not a git write. */
        oncancel?: () => void;
    } & ChangeActions;

    let {
        root,
        state,
        branchItems,
        busy,
        branchName,
        outcome,
        shared,
        onswitch,
        onbranch,
        onbranchname,
        onstage,
        onunstage,
        ondiscard,
        onresolve,
        ongroup,
        onopen,
        onopenfile,
        oncancel
    }: Props = $props();
</script>

{#snippet mark(entry: GitEntry)}
    <SharedMark also={shared(entry.path)} />
{/snippet}

<section class="sec" data-repo="readable">
    <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
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
    <ChangeGroups
        conflicted={state.conflicted}
        staged={state.staged}
        unstaged={state.unstaged}
        untracked={state.untracked}
        held={state.held}
        {busy}
        {onstage}
        {onunstage}
        {ondiscard}
        {onresolve}
        {ongroup}
        {onopen}
        {onopenfile}
        beside={mark}
        marked={(entry: GitEntry) => shared(entry.path).length > 0}
    />
    {#if busy}
        <div class="busy">
            <p class="none">{t('git.busy')}</p>
            {#if oncancel !== undefined}
                <ToolButton
                    small
                    label={t('git.cancel')}
                    title={t('git.cancel_title')}
                    onclick={oncancel}
                />
            {/if}
        </div>
    {/if}
    {#if outcome !== ''}
        <p class="outcome">{outcome}</p>
    {/if}
</section>

<style>
    /* A section heading: the group label in the size of a label, bold and in capitals. */
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        font-weight: 700;
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    .busy {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .none {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        margin: 2px 0 0;
    }
    .outcome {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }
    .branch,
    .newbranch {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
    .newbranch,
    .commit {
        margin-top: 6px;
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
