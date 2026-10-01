<script lang="ts">
    // Layer 3, shared view partial. A repository's changes as the Changes panel of the session
    // views draws them: Merge Changes while a merge left paths in conflict, then staged, changed
    // and untracked, each row its letter, its path, its line counts and the controls that act on
    // it, and each group head the actions VS Code puts on it (Unstage All, Discard All Changes,
    // Stage All Changes). What a row offers beyond these is the caller's: the "also open" mark is a
    // snippet the session views supply.
    //
    // A row's Open control opens what the Repositories view opens for the same row, through
    // state/sources/repositories/repositories.svelte.ts's openChange: the merge editor for a
    // conflict, the file itself for an untracked path, and the diff for the rest.
    //
    // The Repositories view draws the same changes as explorer rows of its own, and takes what
    // both must agree on from one place each: the colour of a status letter from
    // state/sources/repositories/repositories.ts's statusStyle(), the line counts from
    // shared/changes/ChangeCounts.svelte, and the icons of Stage, Unstage and Discard, which are
    // the glyphs stage, unstage and note_back in both.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ChangeCounts from './ChangeCounts.svelte';
    import { elide } from '$lib/state/shared/words/format';
    import { statusStyle } from '$lib/state/sources/repositories/repositories';
    import type { GitEntry } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        conflicted: GitEntry[];
        staged: GitEntry[];
        unstaged: GitEntry[];
        untracked: GitEntry[];
        /** Whether a write is in flight, which disables every control that writes. */
        busy: boolean;
        onstage: (path: string) => void;
        onunstage: (path: string) => void;
        ondiscard: (path: string) => void;
        /** Mark a conflicted path resolved, staging it as it stands or its deletion. */
        onresolve: (path: string) => void;
        /** A group head's action: stage the changed or untracked, unstage all, discard all. */
        ongroup: (act: 'stage-changed' | 'stage-untracked' | 'unstage' | 'discard') => void;
        /** Open what a row stands for, by the group it is in. */
        onopen: (path: string, kind: string) => void;
        /** Drawn after the path of every row: the caller's own mark or controls. */
        beside?: Snippet<[GitEntry, string]>;
        /** Whether a row is drawn as one another session is holding open. */
        marked?: (entry: GitEntry) => boolean;
    };

    let {
        conflicted,
        staged,
        unstaged,
        untracked,
        busy,
        onstage,
        onunstage,
        ondiscard,
        onresolve,
        ongroup,
        onopen,
        beside,
        marked
    }: Props = $props();

    /** The words of a row's Open control, which say what it opens. */
    function openWords(kind: string): string {
        if (kind === 'merge') return t('repositories.merge_open');
        if (kind === 'untracked') return t('repositories.open_file');
        return t('repositories.diff_open');
    }
</script>

{#snippet heads(kind: string, entries: GitEntry[])}
    {#if kind === 'staged' && entries.length > 0}
        <ToolButton
            label={t('git.unstage_all')}
            glyph="unstage"
            compact
            disabled={busy}
            onclick={() => ongroup('unstage')}
        />
    {:else if kind === 'changed' && entries.length > 0}
        <ToolButton
            label={t('git.discard_all')}
            glyph="note_back"
            compact
            disabled={busy}
            onclick={() => ongroup('discard')}
        />
        <ToolButton
            label={t('git.stage_all')}
            glyph="stage"
            compact
            disabled={busy}
            onclick={() => ongroup('stage-changed')}
        />
    {:else if kind === 'untracked' && entries.length > 0}
        <ToolButton
            label={t('git.stage_all_untracked')}
            glyph="stage"
            compact
            disabled={busy}
            onclick={() => ongroup('stage-untracked')}
        />
    {/if}
{/snippet}

{#snippet group(label: string, entries: GitEntry[], kind: string)}
    <div class="group" data-changes-group={kind}>
        <div class="group-h">
            <span>{label}</span>
            <span class="n">{entries.length}</span>
            <span class="hacts">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render heads(kind, entries)}
            </span>
        </div>
        {#if entries.length === 0}
            <p class="none">{t('sessions.ch_group_empty')}</p>
        {:else}
            {#each entries as entry (entry.path)}
                <div class="file" class:shared={marked?.(entry) ?? false} data-entry={entry.path}>
                    <span class="st" style={statusStyle(entry.status)}>{entry.status}</span>
                    <span class="pa" title={entry.path}>{elide(entry.path)}</span>
                    {#if beside}
                        {@render beside(entry, kind)}
                    {/if}
                    <ChangeCounts {entry} />
                    <span class="acts">
                        <ToolButton
                            label={openWords(kind)}
                            glyph={kind === 'merge'
                                ? 'merge'
                                : kind === 'untracked'
                                  ? 'open_file'
                                  : 'diff'}
                            compact
                            onclick={() => onopen(entry.path, kind)}
                        />
                        {#if kind === 'staged'}
                            <ToolButton
                                label={t('git.unstage')}
                                title={t('git.unstage_title')}
                                glyph="unstage"
                                disabled={busy}
                                onclick={() => onunstage(entry.path)}
                            />
                        {:else if kind === 'merge'}
                            <ToolButton
                                label={t('repositories.merge_mark')}
                                title={t('repositories.merge_mark_title')}
                                disabled={busy}
                                onclick={() => onresolve(entry.path)}
                            />
                        {:else}
                            <ToolButton
                                label={t('git.stage')}
                                title={t('git.stage_title')}
                                glyph="stage"
                                disabled={busy}
                                onclick={() => onstage(entry.path)}
                            />
                        {/if}
                        {#if kind === 'changed'}
                            <ToolButton
                                label={t('git.discard')}
                                title={t('git.discard_title')}
                                glyph="note_back"
                                disabled={busy}
                                onclick={() => ondiscard(entry.path)}
                            />
                        {/if}
                    </span>
                </div>
            {/each}
        {/if}
    </div>
{/snippet}

{#if conflicted.length > 0}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render group(t('repositories.merge_changes'), conflicted, 'merge')}
{/if}
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
    .hacts {
        display: flex;
        gap: 2px;
        text-transform: none;
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
    .none {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        margin: 2px 0 0;
    }
    .acts {
        flex: 0 0 auto;
        display: flex;
        gap: 2px;
        margin-left: auto;
    }
</style>
