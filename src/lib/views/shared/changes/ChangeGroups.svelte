<script lang="ts">
    // Layer 3, shared view partial. A repository's changes as the Changes panel of the session
    // views draws them: Merge Changes while a merge left paths in conflict, then staged, changed
    // and untracked, each group drawn only while it holds an entry but for Changes, which keeps its
    // head with no rows, as VS Code's does; each row its letter, its path, its line counts and the
    // controls that act on it, and each group head the actions VS Code puts on it (Unstage All,
    // Discard All Changes, Stage All Changes). What a row offers beyond these is the caller's: the
    // "also open" mark is a snippet the session views supply.
    //
    // A group whose list git cut at 200 entries (GitState.held holds the count git reported) says
    // so in one line under its head, as the Repositories view does.
    //
    // The rows of a group are one grid of five columns (the letter, the path, the caller's mark,
    // the line counts and the controls) and each row takes the group's columns by subgrid, so the
    // counts start at one x in every row of the group. A path is drawn whole in one line and cut at
    // its end by the stylesheet, and it keeps its room at every width: under 16rem the caller's
    // mark gives way, and under 11rem the counts do. A row's controls take no width while they are
    // hidden; drawn, on the row the pointer is on or the focus is in, they cover the row's right
    // end on the row's hover surface, as a row of VS Code's lists draws its actions, so no other
    // row moves. On a screen that does not hover they are always drawn, in their own column.
    //
    // A press on a row's path opens what the Repositories view opens for the same row, through
    // state/sources/repositories/repositories.svelte.ts's openChange: the merge editor for a
    // conflict, the file itself for an untracked path, and the diff for the rest. The path is the
    // file's name first and its folder after it, dimmed and cut at its end, the whole path in the
    // tooltip, as the Repositories view's rows draw it. The controls are VS Code's, in its order:
    // Open File, Discard (on a changed path), then Stage, Unstage or Mark Resolved.
    //
    // The Repositories view draws the same changes as explorer rows of its own, and takes what
    // both must agree on from one place each: the colour of a status letter from
    // state/sources/repositories/repositories.ts's statusStyle(), the line counts from
    // shared/changes/ChangeCounts.svelte, and the icons of Stage, Unstage and Discard, which are
    // the glyphs stage, unstage and note_back in both.
    //
    // The groups are one tree (ui/tree/TreeView.svelte), as a section of the Files view is: one
    // stop of the focus order, Up and Down moving between the group heads and the rows, Home and
    // End to the ends, Right into a group's rows and Left out to its head. A group head is a row
    // that is always open and never closes. Enter on a row opens what a press on its path opens. A
    // row's controls are no stop until the focus is in the row, as the Files view's are: they take
    // tabindex 0 while the focus is on the row or one of them and -1 otherwise, and the path's
    // button is no stop of its own.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import ChangeCounts from './ChangeCounts.svelte';
    import type { ChangeActions } from './change-actions';
    import { dirOf, leafOf } from '$lib/state/sources/repositories/change-tree';
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
        onopenfile,
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

    /** The groups drawn, in the order they are drawn: a group's kind, its label and its rows. */
    const groups = $derived(
        [
            { kind: 'merge', label: t('repositories.merge_changes'), entries: conflicted },
            { kind: 'staged', label: t('sessions.ch_staged'), entries: staged },
            { kind: 'changed', label: t('sessions.ch_changed'), entries: unstaged },
            { kind: 'untracked', label: t('sessions.ch_untracked'), entries: untracked }
        ].filter((one) => one.kind === 'changed' || one.entries.length > 0)
    );

    /** The rows as the tree's keys read them: each group's head, open, then its rows. */
    const rows: KeyRow[] = $derived(
        groups.flatMap((one) => [
            { id: headKey(one.kind), parent: null, open: true, fixed: true },
            ...one.entries.map((entry) => ({
                id: rowKey(one.kind, entry.path),
                parent: headKey(one.kind)
            }))
        ])
    );

    /** The row the focus is in, on the row or one of its controls; the empty string for none. */
    let inside = $state('');

    function headKey(kind: string): string {
        return `head:${kind}`;
    }

    function rowKey(kind: string, path: string): string {
        return `${kind}:${path}`;
    }

    /** The tabindex of a row's controls: 0 while the focus is in the row, else -1. */
    function stopOf(key: string): number {
        return inside === key ? 0 : -1;
    }

    /** The focus leaving a row for a place outside it. */
    function leftRow(event: FocusEvent, key: string): void {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget instanceof Node) {
            if (event.currentTarget.contains(next)) return;
        }
        if (inside === key) inside = '';
    }

    /** Enter on a row itself opens what a press on its path opens. */
    function enteredRow(event: KeyboardEvent, nav: TreeNav, open: () => void): void {
        if (event.target !== event.currentTarget || event.key !== 'Enter') return;
        if (nav.bound?.(event) === true) return;
        event.preventDefault();
        open();
    }

    /** What pressing a row's path opens, as its hover words. */
    function openTitle(kind: string, path: string): string {
        if (kind === 'merge') return `${path}\n${t('repositories.merge_open_title')}`;
        if (kind === 'untracked') return `${path}\n${t('repositories.open_file_title')}`;
        return `${path}\n${kind === 'staged' ? t('repositories.diff_staged_title') : t('repositories.diff_title')}`;
    }
</script>

{#snippet heads(kind: string, entries: GitEntry[], stop: number)}
    {#if kind === 'staged' && entries.length > 0}
        <ToolButton
            label={t('git.unstage_all')}
            glyph="unstage"
            compact
            tabindex={stop}
            disabled={busy}
            onclick={() => ongroup('unstage')}
        />
    {:else if kind === 'changed' && entries.length > 0}
        <ToolButton
            label={t('git.discard_all')}
            glyph="note_back"
            compact
            tabindex={stop}
            disabled={busy}
            onclick={() => ongroup('discard')}
        />
        <ToolButton
            label={t('git.stage_all')}
            glyph="stage"
            compact
            tabindex={stop}
            disabled={busy}
            onclick={() => ongroup('stage-changed')}
        />
    {:else if kind === 'untracked' && entries.length > 0}
        <ToolButton
            label={t('git.stage_all_untracked')}
            glyph="stage"
            compact
            tabindex={stop}
            disabled={busy}
            onclick={() => ongroup('stage-untracked')}
        />
    {/if}
{/snippet}

{#snippet group(nav: TreeNav, label: string, entries: GitEntry[], kind: string)}
    {@const head = headKey(kind)}
    <div class="group" data-changes-group={kind}>
        <div
            class="group-h"
            {...nav.row(head, label)}
            aria-label={label}
            onfocusin={() => (inside = head)}
            onfocusout={(event: FocusEvent) => leftRow(event, head)}
        >
            <span>{label}</span>
            <span class="n">{entries.length}</span>
            <span class="hacts">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render heads(kind, entries, stopOf(head))}
            </span>
        </div>
        {#if cut(kind, entries)}
            <p class="cut" data-cut={kind}>{t('git.cut_warning')}</p>
        {/if}
        {#if entries.length > 0}
            <div class="rows" role="group">
                {#each entries as entry (entry.path)}
                    {@const key = rowKey(kind, entry.path)}
                    <div
                        class="file"
                        class:shared={marked?.(entry) ?? false}
                        data-entry={entry.path}
                        {...nav.row(key, leafOf(entry.path))}
                        aria-label={entry.path}
                        onfocusin={() => (inside = key)}
                        onfocusout={(event: FocusEvent) => leftRow(event, key)}
                        onkeydown={(event: KeyboardEvent) => {
                            enteredRow(event, nav, () => onopen(entry.path, kind));
                        }}
                    >
                        <span class="st" style={statusStyle(entry.status)}>{entry.status}</span>
                        <span class="pa">
                            <ToolButton
                                label={entry.path}
                                title={openTitle(kind, entry.path)}
                                cell
                                tabindex={-1}
                                onclick={() => onopen(entry.path, kind)}
                            >
                                <span>{leafOf(entry.path)}</span>
                                {#if dirOf(entry.path) !== ''}
                                    <span class="dir">{dirOf(entry.path)}</span>
                                {/if}
                            </ToolButton>
                        </span>
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
                                label={t('repositories.open_file')}
                                glyph="open_file"
                                compact
                                tabindex={stopOf(key)}
                                onclick={() => onopenfile(entry.path)}
                            />
                            {#if kind === 'changed'}
                                <ToolButton
                                    label={t('git.discard')}
                                    title={t('git.discard_title')}
                                    glyph="note_back"
                                    compact
                                    tabindex={stopOf(key)}
                                    disabled={busy}
                                    onclick={() => ondiscard(entry.path)}
                                />
                            {/if}
                            {#if kind === 'staged'}
                                <ToolButton
                                    label={t('git.unstage')}
                                    title={t('git.unstage_title')}
                                    glyph="unstage"
                                    compact
                                    tabindex={stopOf(key)}
                                    disabled={busy}
                                    onclick={() => onunstage(entry.path)}
                                />
                            {:else if kind === 'merge'}
                                <ToolButton
                                    label={t('repositories.merge_mark')}
                                    title={t('repositories.merge_mark_title')}
                                    small
                                    tabindex={stopOf(key)}
                                    disabled={busy}
                                    onclick={() => onresolve(entry.path)}
                                />
                            {:else}
                                <ToolButton
                                    label={t('git.stage')}
                                    title={t('git.stage_title')}
                                    glyph="stage"
                                    compact
                                    tabindex={stopOf(key)}
                                    disabled={busy}
                                    onclick={() => onstage(entry.path)}
                                />
                            {/if}
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<TreeView label={t('sessions.ch_tree')} {rows}>
    {#snippet children(nav: TreeNav)}
        {#each groups as one (one.kind)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(nav, one.label, one.entries, one.kind)}
        {/each}
    {/snippet}
</TreeView>

<style>
    /* A group head and a file row are one line of the tree's row height. Their controls are drawn
       while the pointer is on the line or the focus is inside it, and always on a screen that does
       not hover; a control keeps the keyboard focus while it is drawn. */
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

    /* The ring is the row's, so it closes round the controls as well as the name, as a row of the
       Files view's tree draws it. */
    .group-h:focus-visible,
    .group-h:has(:focus-visible),
    .file:focus-visible,
    .file:has(:focus-visible) {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    @media (hover: none) {
        .group-h,
        .file {
            --row-reveal: 1;
        }
    }

    /* A group head is a heading of the Session view under its sub-heading, in capitals, at
       `--fs-xs`, the step of an uppercase heading. */
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
        container: changes / inline-size;
    }
    .file {
        display: grid;
        position: relative;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        font-size: var(--fs-sm);
    }

    /* The row the pointer is on or the focus is in takes the hover surface of a row of the Files
       view's tree, which its drawn controls stand on. */
    .file:hover,
    .file:focus-within {
        background: var(--chip);
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
    /* The folder after the file's name: the row's size, `--fs-sm`, dimmed, cut at its end. */
    .dir {
        margin-left: 0.5em;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
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
        display: none;
        align-items: center;
        gap: 2px;
        padding-left: 6px;
    }
    .file:hover .acts,
    .file:focus-within .acts {
        display: flex;
        position: absolute;
        inset-block: 0;
        right: 0;
        background: inherit;
    }
    @media (hover: none) {
        .file .acts,
        .file:focus-within .acts {
            display: flex;
            position: static;
            background: none;
        }
    }

    /* A narrow list keeps the file's name: the caller's mark gives way first, then the counts. */
    @container changes (width < 16rem) {
        .beside {
            display: none;
        }
    }
    @container changes (width < 11rem) {
        .counts {
            display: none;
        }
    }
</style>
