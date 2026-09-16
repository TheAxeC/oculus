<script lang="ts">
    // Layer 3, shared view partial. The three groups of a repository's changes: staged, changed and
    // untracked, each row its letter, its path, its line counts and the controls that act on it.
    //
    // Two views draw them, the Changes panel over a session's workspace and the Repositories view
    // over every root, so they live here once rather than as a copy in each. What a row offers
    // beyond staging is the caller's: the "also open" mark belongs to the session views and the
    // diff control to Repositories, and each is a snippet the caller supplies or leaves out.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { elide } from '$lib/state/format';
    import type { GitEntry } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        staged: GitEntry[];
        unstaged: GitEntry[];
        untracked: GitEntry[];
        onstage: (path: string) => void;
        onunstage: (path: string) => void;
        ondiscard: (path: string) => void;
        /** Drawn after the path of every row: the caller's own mark or controls. */
        beside?: Snippet<[GitEntry, string]>;
        /** Drawn before the staging controls of every row. */
        controls?: Snippet<[GitEntry, string]>;
        /** Whether a row is drawn as one another session is holding open. */
        marked?: (entry: GitEntry) => boolean;
    };

    let {
        staged,
        unstaged,
        untracked,
        onstage,
        onunstage,
        ondiscard,
        beside,
        controls,
        marked
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
                <div class="file" class:shared={marked?.(entry) ?? false} data-entry={entry.path}>
                    <span class="st" style={letterStyle(entry.status)}>{entry.status}</span>
                    <span class="pa" title={entry.path}>{elide(entry.path)}</span>
                    {#if beside}
                        {@render beside(entry, kind)}
                    {/if}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render counts(entry)}
                    <span class="acts">
                        {#if controls}
                            {@render controls(entry, kind)}
                        {/if}
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

<!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
{@render group(t('sessions.ch_staged'), staged, 'staged')}
<!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
{@render group(t('sessions.ch_changed'), unstaged, 'changed')}
<!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
{@render group(t('sessions.ch_untracked'), untracked, 'untracked')}

<style>
    .group-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
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
    .acts {
        flex: 0 0 auto;
        display: flex;
        gap: 2px;
        margin-left: auto;
    }
</style>
