<script lang="ts">
    // Layer 3, sessions view partial. The repository a session works in: its branch line, the
    // new-branch field, its changes and the commit box. The commit box is
    // views/shared/changes/CommitBox.svelte, the one the Repositories view draws, so a message
    // typed here is the message that view shows for the same repository, the four ways to commit
    // are the same four, and its one button says Sync Changes or Publish Branch where there is
    // nothing to commit, which is how this panel pushes.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ChangeGroups from '$lib/views/shared/changes/ChangeGroups.svelte';
    import CommitBox from '$lib/views/shared/changes/CommitBox.svelte';
    import { branchState } from '$lib/views/shared/changes/branch-state';
    import type { GitEntry, GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

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
        onstage: (path: string) => void;
        onunstage: (path: string) => void;
        ondiscard: (path: string) => void;
        onresolve: (path: string) => void;
        ongroup: (act: 'stage-changed' | 'stage-untracked' | 'unstage' | 'discard') => void;
        onopen: (path: string, kind: string) => void;
    };

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
        onopen
    }: Props = $props();
</script>

{#snippet mark(entry: GitEntry)}
    {@const also = shared(entry.path)}
    {#if also.length > 0}
        <span class="mark" title={t('sessions.ch_shared_tip', also.join(', '))}
            >{t('sessions.ch_shared')}</span
        >
    {/if}
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
        {busy}
        {onstage}
        {onunstage}
        {ondiscard}
        {onresolve}
        {ongroup}
        {onopen}
        beside={mark}
        marked={(entry: GitEntry) => shared(entry.path).length > 0}
    />
    {#if busy}
        <p class="none">{t('git.busy')}</p>
    {/if}
    {#if outcome !== ''}
        <p class="outcome">{outcome}</p>
    {/if}
</section>

<style>
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-sm);
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    .mark {
        flex: 0 0 auto;
        font-size: var(--fs-xs);
        color: var(--c-amber-txt, var(--muted));
    }
    .none {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        margin: 2px 0 0;
    }
    .outcome {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }
    .branch,
    .newbranch {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
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
        font-size: var(--fs-xs);
    }
</style>
