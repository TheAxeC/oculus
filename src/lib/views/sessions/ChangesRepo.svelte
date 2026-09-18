<script lang="ts">
    // Layer 3, sessions view partial. Repository rows, branch controls and the commit box live here
    // because git presentation changes independently of the selected session's own file activity.

    import Menu from '$lib/ui/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu-items';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import ChangeGroups from '$lib/views/shared/ChangeGroups.svelte';
    import { branchState } from '$lib/views/shared/branch-state';
    import type { GitEntry, GitState } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        state: GitState;
        branchItems: MenuItem[];
        upstream: string;
        busy: boolean;
        suggesting: boolean;
        canCommit: boolean;
        message: string;
        branchName: string;
        outcome: string;
        shared: (path: string) => string[];
        onswitch: (name: string) => void;
        onpush: () => void;
        onbranch: () => void;
        onbranchname: (name: string) => void;
        onstage: (path: string) => void;
        onunstage: (path: string) => void;
        ondiscard: (path: string) => void;
        onmessage: (message: string) => void;
        onsuggest: () => void | Promise<void>;
        oncommit: () => void;
    };

    let {
        state,
        branchItems,
        upstream,
        busy,
        suggesting,
        canCommit,
        message,
        branchName,
        outcome,
        shared,
        onswitch,
        onpush,
        onbranch,
        onbranchname,
        onstage,
        onunstage,
        ondiscard,
        onmessage,
        onsuggest,
        oncommit
    }: Props = $props();

    /**
     * The git state says whether the branch tracks anything before the branch listing names the
     * upstream: `upstream === false` is a branch with none, and anything else with no error is a
     * state git has not answered for yet. The push control says "no upstream" only for the first;
     * until the listing answers for the rest it says the upstream is being looked up, and it is
     * disabled either way.
     */
    const noUpstream = $derived(state.upstream === false);
    const pending = $derived(upstream === '' && !noUpstream && state.error === null);
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
        <ToolButton
            label={t('git.push')}
            title={upstream !== ''
                ? t('git.push_title', state.ahead, upstream)
                : pending
                  ? t('git.push_pending')
                  : t('git.push_none')}
            disabled={upstream === '' || busy}
            onclick={onpush}
        />
    </div>
    {#if pending}
        <p class="none">{t('git.push_pending')}</p>
    {:else if upstream === ''}
        <p class="none">{t('git.push_none')}</p>
    {/if}
    <div class="newbranch">
        <span class="lb">{t('git.branch_new')}</span>
        <TextInput value={branchName} label={t('git.branch_new_label')} oninput={onbranchname} />
        <ToolButton label={t('git.branch_new_create')} onclick={onbranch} />
    </div>
    <ChangeGroups
        staged={state.staged}
        unstaged={state.unstaged}
        untracked={state.untracked}
        {onstage}
        {onunstage}
        {ondiscard}
        beside={mark}
        marked={(entry: GitEntry) => shared(entry.path).length > 0}
    />
    <div class="commit">
        <TextArea value={message} label={t('git.commit_label')} rows={4} oninput={onmessage} />
        <div class="cacts">
            <ToolButton
                label={suggesting ? t('git.suggest_pending') : t('git.suggest')}
                title={t('git.suggest_title')}
                disabled={busy || suggesting || state.staged.length === 0}
                onclick={onsuggest}
            />
            <ToolButton label={t('git.commit')} disabled={!canCommit} onclick={oncommit} />
            {#if state.staged.length === 0}
                <span class="none">{t('git.commit_none')}</span>
            {/if}
        </div>
        {#if busy}
            <p class="none">{t('git.busy')}</p>
        {/if}
        {#if outcome !== ''}
            <p class="outcome">{outcome}</p>
        {/if}
    </div>
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
    .cacts .none {
        font-size: var(--fs-sm);
    }
    .outcome {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }
    .branch,
    .newbranch,
    .cacts {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
    }
    .newbranch,
    .commit {
        margin-top: 6px;
    }
    .commit {
        display: flex;
        flex-direction: column;
        gap: 4px;
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
