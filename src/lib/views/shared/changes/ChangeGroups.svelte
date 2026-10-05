<script lang="ts">
    // Layer 3, shared view partial. A repository's changes as the Changes panel of the session
    // views draws them: Merge Changes while a merge left paths in conflict, then staged, changed
    // and untracked, each row its letter, its path, its line counts and the controls that act on
    // it, and each group head the actions VS Code puts on it (Unstage All, Discard All Changes,
    // Stage All Changes). What a row offers beyond these is the caller's: the "also open" mark is a
    // snippet the session views supply.
    //
    // A group whose list git cut at 200 entries (GitState.held holds the count git reported) says
    // so in one line under its head, as the Repositories view does.
    //
    // The rows of a group are one grid of five columns (the letter, the path, the caller's mark,
    // the line counts and the controls) and each row takes the group's columns by subgrid, so the
    // counts and the controls start at one x in every row of the group. A path is drawn whole in
    // one line and cut at its end by the stylesheet.
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
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ChangeCounts from './ChangeCounts.svelte';
    import type { ChangeActions } from './change-actions';
    import { statusStyle } from '$lib/state/sources/repositories/repositories';
    import type { GitEntry } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        conflicted: GitEntry[];
        staged: GitEntry[];
        unstaged: GitEntry[];
        untracked: GitEntry[];
        /** How many paths git reported in each group, which exceeds the list once it was cut. */
        held: { merge: number; staged: number; changes: number; untracked: number };
        /** Whether a write is in flight, which disables every control that writes. */
        busy: boolean;
        /** Drawn after the path of every row: the caller's own mark or controls. */
        beside?: Snippet<[GitEntry, string]>;
        /** Whether a row is drawn as one another session is holding open. */
        marked?: (entry: GitEntry) => boolean;
    } & ChangeActions;

    let {
        conflicted,
        staged,
        unstaged,
        untracked,
        held,
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

    /** Whether git reported more paths in a group than the list holds. */
    function cut(kind: string, entries: GitEntry[]): boolean {
        const reported = {
            merge: held.merge,
            staged: held.staged,
            changed: held.changes,
            untracked: held.untracked
        };
        return reported[kind as keyof typeof reported] > entries.length;
    }

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
        {#if cut(kind, entries)}
            <p class="cut" data-cut={kind}>{t('git.cut_warning')}</p>
        {/if}
        {#if entries.length === 0}
            <Empty message={t('sessions.ch_group_empty')} />
        {:else}
            <div class="rows">
                {#each entries as entry (entry.path)}
                    <div
                        class="file"
                        class:shared={marked?.(entry) ?? false}
                        data-entry={entry.path}
                    >
                        <span class="st" style={statusStyle(entry.status)}>{entry.status}</span>
                        <span class="pa" title={entry.path}>{entry.path}</span>
                        {#if beside}
                            <span class="beside">
                                {@render beside(entry, kind)}
                            </span>
                        {/if}
                        <span class="counts">
                            <ChangeCounts {entry} />
                        </span>
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
                                    compact
                                    disabled={busy}
                                    onclick={() => onunstage(entry.path)}
                                />
                            {:else if kind === 'merge'}
                                <ToolButton
                                    label={t('repositories.merge_mark')}
                                    title={t('repositories.merge_mark_title')}
                                    small
                                    disabled={busy}
                                    onclick={() => onresolve(entry.path)}
                                />
                            {:else}
                                <ToolButton
                                    label={t('git.stage')}
                                    title={t('git.stage_title')}
                                    glyph="stage"
                                    compact
                                    disabled={busy}
                                    onclick={() => onstage(entry.path)}
                                />
                            {/if}
                            {#if kind === 'changed'}
                                <ToolButton
                                    label={t('git.discard')}
                                    title={t('git.discard_title')}
                                    glyph="note_back"
                                    compact
                                    disabled={busy}
                                    onclick={() => ondiscard(entry.path)}
                                />
                            {/if}
                        </span>
                    </div>
                {/each}
            </div>
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
    /* A group head and a file row are one line of the tree's row height. Their controls are drawn
       while the pointer is on the line or the focus is inside it, and always on a screen that does
       not hover; a control keeps the keyboard focus while it is clear. */
    .group-h,
    .file {
        --row-reveal: 0;
        align-items: center;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .group-h {
        display: flex;
        gap: 6px;
    }

    .group-h:hover,
    .group-h:focus-within,
    .file:hover,
    .file:focus-within {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .group-h,
        .file {
            --row-reveal: 1;
        }
    }

    .group-h {
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        font-weight: 700;
    }
    .group {
        margin-top: 6px;
    }
    .cut {
        margin: 0;
        color: var(--c-amber-txt, var(--muted-txt));
        font-size: var(--fs-sm);
    }
    .group-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }
    .hacts {
        display: flex;
        gap: 2px;
        text-transform: none;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    /* The group's columns: the letter, the path, the caller's mark, the counts and the controls.
       The gaps between them are margins of the cells, so a column no row fills takes no room. */
    .rows {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr) max-content max-content max-content;
    }
    .file {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        font-size: var(--fs-md);
    }
    .st {
        grid-column: 1;
        width: 1.2em;
        margin-right: 6px;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }
    .pa {
        grid-column: 2;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .beside {
        grid-column: 3;
        margin-left: 6px;
    }
    .counts {
        grid-column: 4;
        display: flex;
        gap: 6px;
        margin-left: 6px;
        justify-self: end;
    }
    .beside:empty,
    .counts:empty {
        display: none;
    }
    .acts {
        grid-column: 5;
        display: flex;
        gap: 2px;
        margin-left: 6px;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }
</style>
