<script lang="ts">
    // Layer 3, sessions view partial. Repository rows, branch controls and the commit box live here
    // because git presentation changes independently of the selected session's own file activity.

    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { elide } from '$lib/state/format';
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
        branchState: (state: GitState) => string;
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
        branchState,
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

    const LETTERS: Record<string, string> = {
        M: 'amber',
        A: 'green',
        D: 'red',
        R: 'violet',
        C: 'violet',
        '?': 'slate'
    };

    /** The text color custom property for one git status letter. */
    function letterStyle(status: string): string {
        return `--tone-txt: var(--c-${LETTERS[status] ?? 'grey'}-txt)`;
    }
</script>

{#snippet counts(entry: GitEntry)}
    {#if entry.added === null && entry.deleted === null}
        <span class="bin">{t('sessions.ch_binary')}</span>
    {:else}
        {#if entry.added}
            <span class="add">{t('sessions.ch_added', entry.added)}</span>
        {/if}
        {#if entry.deleted}
            <span class="del">{t('sessions.ch_deleted', entry.deleted)}</span>
        {/if}
    {/if}
{/snippet}

{#snippet mark(also: string[])}
    {#if also.length > 0}
        <span class="mark" title={t('sessions.ch_shared_tip', also.join(', '))}
            >{t('sessions.ch_shared')}</span
        >
    {/if}
{/snippet}

{#snippet group(label: string, entries: GitEntry[], kind: string)}
    <div class="group">
        <div class="group-h">
            <span>{label}</span>
            <span class="n">{entries.length}</span>
        </div>
        {#if entries.length === 0}
            <p class="none">{t('sessions.ch_group_empty')}</p>
        {:else}
            {#each entries as entry (entry.path)}
                {@const also = shared(entry.path)}
                <div class="file" class:shared={also.length > 0}>
                    <span class="st" style={letterStyle(entry.status)}>{entry.status}</span>
                    <span class="pa" title={entry.path}>{elide(entry.path)}</span>
                    {@render mark(also)}
                    {@render counts(entry)}
                    <span class="acts">
                        {#if kind === 'staged'}
                            <ToolButton
                                label={t('git.unstage')}
                                title={t('git.unstage_title')}
                                onclick={() => onunstage(entry.path)}
                            />
                        {:else}
                            <ToolButton
                                label={t('git.stage')}
                                title={t('git.stage_title')}
                                onclick={() => onstage(entry.path)}
                            />
                        {/if}
                        {#if kind === 'changed'}
                            <ToolButton
                                label={t('git.discard')}
                                title={t('git.discard_title')}
                                onclick={() => ondiscard(entry.path)}
                            />
                        {/if}
                    </span>
                </div>
            {/each}
        {/if}
    </div>
{/snippet}

<section class="sec">
    <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
    <div class="branch">
        <span class="lb">{t('sessions.ch_branch')}</span>
        <Menu label={state.branch} items={branchItems} placement="down" onpick={onswitch} />
        <span class="mt">{branchState(state)}</span>
        <ToolButton
            label={t('git.push')}
            title={upstream === ''
                ? t('git.push_none')
                : t('git.push_title', state.ahead, upstream)}
            disabled={upstream === '' || busy}
            onclick={onpush}
        />
    </div>
    {#if upstream === ''}
        <p class="none">{t('git.push_none')}</p>
    {/if}
    <div class="newbranch">
        <span class="lb">{t('git.branch_new')}</span>
        <TextInput value={branchName} label={t('git.branch_new_label')} oninput={onbranchname} />
        <ToolButton label={t('git.branch_new_create')} onclick={onbranch} />
    </div>
    {@render group(t('sessions.ch_staged'), state.staged, 'staged')}
    {@render group(t('sessions.ch_changed'), state.unstaged, 'changed')}
    {@render group(t('sessions.ch_untracked'), state.untracked, 'untracked')}
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
    .sec-h,
    .group-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .sec-h {
        font-size: var(--fs-sm);
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    .group-h {
        font-size: var(--fs-xs);
    }
    .group {
        margin-top: 6px;
    }
    .group-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }
    .file {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }
    .pa {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .st {
        flex: 0 0 auto;
        width: 1.2em;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }
    .mark,
    .bin {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .none {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        margin: 2px 0 0;
    }
    .cacts .none {
        font-size: var(--fs-sm);
    }
    .add,
    .del {
        flex: 0 0 auto;
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }
    .add {
        color: var(--c-green-txt, var(--muted));
    }
    .del {
        color: var(--c-red-txt, var(--muted));
    }
    .mark {
        color: var(--c-amber-txt, var(--muted));
    }
    .outcome {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }
    .acts {
        flex: 0 0 auto;
        display: flex;
        gap: 2px;
        margin-left: auto;
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
