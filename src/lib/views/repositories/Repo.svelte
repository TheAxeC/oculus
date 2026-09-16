<script lang="ts">
    // Layer 3, partial of views/Repositories.svelte. One repository: its branch line, what is
    // changed in it, its newest commits, its branches and its worktrees.
    //
    // It draws and reports presses; every write is the view's, so a section knows nothing about the
    // endpoint. The change groups are the shared partial the Changes panel draws, with one control
    // added per row: the diff of that path, which the view opens as a pane of its own.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ChangeGroups from '$lib/views/shared/ChangeGroups.svelte';
    import Worktrees from './Worktrees.svelte';
    import { elide, stamp } from '$lib/state/format';
    import type { DiffSubject } from '$lib/state/repositories';
    import type { GitEntry, GitState } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        root: string;
        git: GitState;
        busy: boolean;
        outcome: string;
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

    let branchName = $state('');

    /** What the branch line says beside the name: detached, the distance, or in step. */
    function branchState(held: GitState): string {
        const bits: string[] = [];
        if (held.detached) bits.push(t('sessions.ch_detached'));
        if (held.ahead > 0) bits.push(t('sessions.ch_ahead', held.ahead));
        if (held.behind > 0) bits.push(t('sessions.ch_behind', held.behind));
        if (bits.length === 0) bits.push(t('sessions.ch_insync'));
        return bits.join(` ${t('sessions.meta_sep')} `);
    }

    function created(): void {
        const name = branchName.trim();
        if (name === '') return;
        branchName = '';
        onbranch(name);
    }
</script>

{#snippet diffControl(entry: GitEntry, kind: string)}
    {@const staged = kind === 'staged'}
    <ToolButton
        label={t('repositories.diff')}
        title={staged ? t('repositories.diff_staged_title') : t('repositories.diff_title')}
        onclick={() => ondiff({ root, path: entry.path, staged, worktree: false }, entry.path)}
    />
{/snippet}

<section class="repo" data-root={root}>
    <div class="sec-h">
        <span class="path" title={root}>{elide(root)}</span>
    </div>
    {#if git.error !== null}
        <p class="none" title={git.error}>{t('repositories.error')}</p>
    {:else}
        <div class="branch">
            <span class="lb">{t('sessions.ch_branch')}</span>
            <span class="nm">{git.branch}</span>
            <span class="mt">{branchState(git)}</span>
        </div>

        <div data-group="changes">
            <ChangeGroups
                staged={git.staged}
                unstaged={git.unstaged}
                untracked={git.untracked}
                {onstage}
                {onunstage}
                {ondiscard}
                controls={diffControl}
            />
        </div>

        <div class="group">
            <div class="group-h"><span>{t('repositories.log')}</span></div>
            {#if git.log.length === 0}
                <p class="none">{t('repositories.log_empty')}</p>
            {:else}
                <ul class="log">
                    {#each git.log as commit (commit.hash)}
                        <li class="row">
                            <span class="hash">{commit.short}</span>
                            <span class="subject" title={commit.subject}>{commit.subject}</span>
                            <span class="when">{stamp(commit.when)}</span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <div class="group">
            <div class="group-h"><span>{t('repositories.branches')}</span></div>
            {#if git.branches.length === 0}
                <p class="none">{t('repositories.branches_empty')}</p>
            {:else}
                <ul class="list">
                    {#each git.branches as branch (branch.name)}
                        <li class="row" class:current={branch.current}>
                            <span class="nm">{branch.name}</span>
                            <span class="up">{branch.upstream}</span>
                            {#if !branch.current}
                                <span class="acts">
                                    <ToolButton
                                        label={t('repositories.switch')}
                                        disabled={busy}
                                        onclick={() => onswitch(branch.name)}
                                    />
                                </span>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
            <div class="add">
                <span class="lb">{t('git.branch_new')}</span>
                <TextInput
                    value={branchName}
                    label={t('git.branch_new_label')}
                    oninput={(next: string) => (branchName = next)}
                />
                <ToolButton label={t('git.branch_new_create')} disabled={busy} onclick={created} />
            </div>
        </div>

        <Worktrees
            {root}
            {git}
            {busy}
            {ondiff}
            {onremove}
            {onmerge}
            {onterminal}
            oncreate={onworktree}
        />

        {#if busy}
            <p class="none">{t('git.busy')}</p>
        {/if}
        {#if outcome !== ''}
            <p class="outcome">{outcome}</p>
        {/if}
    {/if}
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
        margin-top: 8px;
    }
    .path {
        font-family: var(--font-mono);
        text-transform: none;
    }
    .branch,
    .add {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
    }
    .add {
        margin-top: 4px;
    }
    .branch .lb,
    .add .lb {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .branch .mt {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .log,
    .list {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }
    .row.current .nm {
        color: var(--c-green-txt, var(--muted));
    }
    .hash {
        flex: 0 0 auto;
        font-family: var(--font-mono);
        color: var(--muted-txt, var(--muted));
    }
    .subject {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .when,
    .up {
        flex: 0 0 auto;
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .acts {
        flex: 0 0 auto;
        display: flex;
        gap: 2px;
    }
    .none {
        margin: 2px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .outcome {
        margin: 4px 0 0;
        font-size: var(--fs-md);
    }
</style>
