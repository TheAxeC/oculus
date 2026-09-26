<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/Diff.svelte. One file of a diff, drawn
    // side by side (the old version's lines on the left, the new one's on the right, a changed line
    // on one row with its changed words marked on both sides) or inline (one column, the removed
    // line above the added one). Both draw the line numbers of both sides and fold every unchanged
    // run longer than six lines behind an expander, three lines kept each side; pressing the
    // expander shows the run, which the pane remembers.
    //
    // Each hunk starts with a bar carrying the hunk actions the pane allows: Stage, or Unstage in a
    // staged diff, and Revert. A changed line's number is a toggle that chooses the line, and a
    // hunk holding chosen lines offers the same actions for just those lines. What the actions do
    // is the pane's: this draws and reports presses.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        foldsOf,
        hunksOf,
        partnersOf,
        piecesOf,
        sideRows,
        type DiffFile,
        type DiffLine,
        type Hunk
    } from '$lib/state/sources/repositories/diff-rows';
    import { pairedWords } from '$lib/state/sources/repositories/diff-words';
    import type { PatchMode } from '$lib/state/sources/repositories/diff-patch';
    import type { DiffMode } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        file: DiffFile;
        /** This file's place among the pane's files, which its rows' ids carry. */
        index: number;
        mode: DiffMode;
        /** The folds opened, by their first row. */
        opened: number[];
        /** Whether hunks may be acted on, and which way: a staged diff unstages. */
        acts: boolean;
        staged: boolean;
        busy: boolean;
        /** The rows chosen, by index. */
        chosen: number[];
        /** The hunk the pane is at, by index in this file, or -1. */
        current: number;
        /** Whether to draw the file's path above it, for a diff of several files. */
        headed: boolean;
        onopen: (from: number) => void;
        onchoose: (row: number) => void;
        onhunk: (hunk: Hunk, mode: PatchMode, rows: number[] | null) => void;
    };

    let {
        file,
        index,
        mode,
        opened,
        acts,
        staged,
        busy,
        chosen,
        current,
        headed,
        onopen,
        onchoose,
        onhunk
    }: Props = $props();

    const hunks = $derived(hunksOf(file.lines));
    const pieces = $derived(piecesOf(file.lines.length, foldsOf(file.lines), opened));
    const partners = $derived(partnersOf(file.lines));
    /** The changed words of each paired row, worked out once per diff. */
    const words = $derived(pairedWords(file.lines, partners));

    /** The hunk a bar is drawn above, for a row that starts one. */
    function startsHunk(row: number | null): number {
        return row === null ? -1 : hunks.findIndex((hunk) => hunk.start === row);
    }

    /** The rows of a hunk the reader chose. */
    function chosenIn(hunk: Hunk): number[] {
        return chosen.filter((row) => row >= hunk.first && row <= hunk.last);
    }

    /** The words of a hunk's bar, git's own head for it. */
    function headOf(hunk: Hunk): string {
        const rows = file.lines.slice(hunk.start, hunk.end);
        const olds = rows.filter((line) => line.kind !== 'added');
        const news = rows.filter((line) => line.kind !== 'removed');
        return t(
            'repositories.hunk_head',
            olds.at(0)?.old ?? 0,
            olds.length,
            news.at(0)?.new ?? 0,
            news.length
        );
    }

    function number(value: number | null): string {
        return value === null ? '' : String(value);
    }
</script>

{#snippet text(row: number)}
    {@const line = file.lines[row]}
    {@const marked = words.get(row)}
    {#if marked === undefined}
        {line.text}
    {:else}
        {#each marked as piece, at (at)}
            {#if piece.changed}
                <mark class="word">{piece.text}</mark>
            {:else}
                {piece.text}
            {/if}
        {/each}
    {/if}
{/snippet}

{#snippet gutter(row: number, line: DiffLine, shown: number | null)}
    {#if acts && line.kind !== 'context'}
        <span class="num pick" class:chosen={chosen.includes(row)}>
            <ToolButton
                cell
                label={t('repositories.line_choose', number(shown))}
                title={t('repositories.line_choose_title')}
                pressed={chosen.includes(row)}
                data={{ choose: row }}
                onclick={() => onchoose(row)}
            >
                {number(shown)}
            </ToolButton>
        </span>
    {:else}
        <span class="num">{number(shown)}</span>
    {/if}
{/snippet}

{#snippet half(row: number, side: 'old' | 'new')}
    {@const line = file.lines[row]}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render gutter(row, line, line[side])}
    <span class="cell" class:removed={line.kind === 'removed'} class:added={line.kind === 'added'}>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render text(row)}
    </span>
{/snippet}

{#snippet bar(at: number)}
    {@const hunk = hunks[at]}
    {@const picked = chosenIn(hunk)}
    <div class="bar" class:current={at === current} data-hunk={at} data-hunk-id={`${index}:${at}`}>
        <span class="head">{headOf(hunk)}</span>
        {#if acts}
            {#if staged}
                <ToolButton
                    label={picked.length > 0
                        ? t('repositories.lines_unstage', picked.length)
                        : t('repositories.hunk_unstage')}
                    glyph="collapse"
                    disabled={busy}
                    onclick={() => onhunk(hunk, 'unstage', picked.length > 0 ? picked : null)}
                />
            {:else}
                <ToolButton
                    label={picked.length > 0
                        ? t('repositories.lines_stage', picked.length)
                        : t('repositories.hunk_stage')}
                    glyph="expand"
                    disabled={busy}
                    onclick={() => onhunk(hunk, 'stage', picked.length > 0 ? picked : null)}
                />
                <ToolButton
                    label={picked.length > 0
                        ? t('repositories.lines_revert', picked.length)
                        : t('repositories.hunk_revert')}
                    glyph="note_back"
                    disabled={busy}
                    onclick={() => onhunk(hunk, 'revert', picked.length > 0 ? picked : null)}
                />
            {/if}
        {/if}
    </div>
{/snippet}

<section class="file" data-diff-file={file.newPath || file.oldPath} data-mode={mode}>
    {#if headed}
        <p class="path">{file.newPath || file.oldPath}</p>
    {/if}
    {#if file.binary}
        <p class="note">{t('repositories.diff_binary')}</p>
    {/if}
    {#each pieces as piece (`${piece.kind}:${piece.from}`)}
        {#if piece.kind === 'fold'}
            <div class="fold">
                <ToolButton
                    label={t('repositories.fold_open', piece.to - piece.from)}
                    glyph="unfold"
                    onclick={() => onopen(piece.from)}
                />
            </div>
        {:else if mode === 'side'}
            {#each sideRows(file.lines, piece.from, piece.to) as pair (`${pair.left}:${pair.right}`)}
                {@const starts = startsHunk(pair.left ?? pair.right)}
                {#if starts >= 0}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render bar(starts)}
                {/if}
                <div class="pair" data-row={pair.left ?? pair.right}>
                    {#if pair.left === null}
                        <span class="num"></span>
                        <span class="cell empty"></span>
                    {:else}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render half(pair.left, 'old')}
                    {/if}
                    {#if pair.right === null}
                        <span class="num"></span>
                        <span class="cell empty"></span>
                    {:else}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render half(pair.right, 'new')}
                    {/if}
                </div>
            {/each}
        {:else}
            {#each file.lines.slice(piece.from, piece.to) as line, at (piece.from + at)}
                {@const row = piece.from + at}
                {@const starts = startsHunk(row)}
                {#if starts >= 0}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render bar(starts)}
                {/if}
                <div class="line" data-row={row}>
                    {#if line.kind === 'added'}
                        <span class="num"></span>
                    {:else}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render gutter(row, line, line.old)}
                    {/if}
                    {#if line.kind === 'removed'}
                        <span class="num"></span>
                    {:else}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render gutter(row, line, line.new)}
                    {/if}
                    <span
                        class="cell"
                        class:removed={line.kind === 'removed'}
                        class:added={line.kind === 'added'}
                    >
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render text(row)}
                    </span>
                </div>
            {/each}
        {/if}
    {/each}
</section>

<style>
    .file {
        display: flex;
        flex-direction: column;
        min-width: max-content;
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
    }

    /* Side by side, the two columns share the pane's width and a long line wraps inside its own
       column, so both sides stay in view and a wrapped row keeps its pair on the same row. */
    .file[data-mode='side'] {
        min-width: 0;
    }

    .file[data-mode='side'] .cell {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    .path {
        margin: 8px 0 2px;
        font-weight: 600;
    }

    .note {
        margin: 2px 0;
        color: var(--muted-txt, var(--muted));
    }

    .pair {
        display: grid;
        grid-template-columns: 4em minmax(0, 1fr) 4em minmax(0, 1fr);
    }

    .line {
        display: grid;
        grid-template-columns: 4em 4em minmax(0, 1fr);
    }

    .num {
        padding: 0 6px;
        border: 0;
        background: transparent;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        text-align: right;
        user-select: none;
    }

    /* The cell the chooser button fills is a flex box, which stretches the button to its height. */
    .pick {
        display: flex;
        cursor: pointer;
    }

    .pick.chosen {
        background: var(--accent-bg);
        color: var(--ink-txt, var(--ink));
    }

    .cell {
        padding: 0 6px;
        white-space: pre;
    }

    .cell.removed {
        background: var(--c-scm-deleted-bg);
    }

    .cell.added {
        background: var(--c-scm-added-bg);
    }

    .cell.empty {
        background: var(--chip);
    }

    .word {
        border-radius: 2px;
        color: inherit;
    }

    .removed .word {
        background: var(--c-scm-deleted);
        color: var(--on-c-scm-deleted);
    }

    .added .word {
        background: var(--c-scm-added);
        color: var(--on-c-scm-added);
    }

    .bar {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 4px;
        padding: 1px 6px;
        border-top: 1px solid var(--line);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
    }

    .bar.current {
        border-top-color: var(--accent);
    }

    .bar .head {
        margin-right: auto;
    }

    .fold {
        display: flex;
        justify-content: center;
        padding: 1px 0;
        background: var(--chip);
    }

    :global(body.wall) .cell.empty {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
    }

    :global(body.wall) .bar {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
    }

    :global(body.wall) .fold {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
    }
</style>
