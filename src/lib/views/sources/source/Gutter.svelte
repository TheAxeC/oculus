<script lang="ts">
    // Layer 3, partial of views/sources/source/Source.svelte, drawn by
    // views/shared/prose/Code.svelte for a file the tab may not write; the editor draws its own
    // gutter as Monaco decorations (ui/controls/editor/gutter.ts) from the same marks and blame.
    // The source tab's gutter as VS Code draws it for a file in a repository: the line numbers, and
    // beside them the quick diff marks against the index (a bar for an added or a modified run, a
    // wedge where lines were deleted, at the top of the line after them or at the foot of the last
    // line for a deletion at the end) and, while blame is on, each line's blame.
    //
    // A mark is a button that opens the file's diff at that change, as a press on VS Code's gutter
    // mark peeks it. The blame writes its author and how long ago on the first line of each run
    // from one commit, with the commit and its subject on the hover, and a press opens that commit
    // in the Repositories view's graph; a line no commit holds yet says "Not Committed Yet".
    //
    // The gutter is one column of rows at the text's own line height, moved by the scroll the text
    // reports, so it stays beside its lines without scrolling itself.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { GitBlameLine } from '$lib/state/sources/repositories/repositories';
    import {
        blameStarts,
        blameWords,
        markWords,
        type LineMark
    } from '$lib/state/sources/repositories/file-git';

    type Props = {
        /** How many lines the text holds. */
        lines: number;
        /** How far the text is scrolled down, in pixels. */
        top: number;
        /** The mark each line draws, by line from one. */
        marks: Map<number, LineMark>;
        /** Each line's blame, or null while blame is off. */
        blame: GitBlameLine[] | null;
        /** The moment "how long ago" is counted from. */
        now: number;
        onmark: (line: number) => void;
        onblame: (line: GitBlameLine) => void;
    };

    let { lines, top, marks, blame, now, onmark, onblame }: Props = $props();

    const numbers = $derived(Array.from({ length: Math.max(1, lines) }, (_, at) => at + 1));
    const byLine = $derived(new Map((blame ?? []).map((one) => [one.line, one])));
    const starts = $derived(blameStarts(blame ?? []));
</script>

<div class="gutter" class:blamed={blame !== null} data-gutter>
    <div class="rows" style="transform: translateY({-top}px)">
        {#each numbers as line (line)}
            {@const mark = marks.get(line)}
            {@const held = byLine.get(line)}
            <div class="row" data-gutter-line={line}>
                {#if blame !== null}
                    {#if held === undefined}
                        <span class="blame"></span>
                    {:else}
                        {@const words = blameWords(held, now)}
                        <span
                            class="blame"
                            class:start={starts.has(line)}
                            class:uncommitted={held.uncommitted}
                        >
                            <ToolButton
                                cell
                                label={words.title}
                                title={words.title}
                                data={{ 'blame-line': line }}
                                disabled={held.uncommitted}
                                onclick={() => onblame(held)}
                            >
                                {starts.has(line) ? words.gutter : ''}
                            </ToolButton>
                        </span>
                    {/if}
                {/if}
                <span class="num">{line}</span>
                {#if mark === undefined}
                    <span class="mark"></span>
                {:else}
                    <span
                        class="mark {mark.kind}"
                        class:foot={mark.kind === 'deleted' && mark.start > line}
                    >
                        <ToolButton
                            cell
                            label={markWords(mark)}
                            title={markWords(mark)}
                            data={{ mark: mark.kind, 'mark-line': line }}
                            onclick={() => onmark(mark.start)}
                        />
                    </span>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .gutter {
        flex: 0 0 auto;
        overflow: hidden;
        border-right: 1px solid var(--line);
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        user-select: none;
    }

    .rows {
        padding: 8px 0;
    }

    .row {
        display: grid;
        grid-template-columns: auto 5px;
        align-items: stretch;
        height: 1.45em;
    }

    .blamed .row {
        grid-template-columns: 16em auto 5px;
    }

    .num {
        min-width: 2.5em;
        padding: 0 6px;
        text-align: right;
    }

    /* A cell a gutter button fills is a flex box, which stretches the button to its height. */
    .blame,
    .mark {
        display: flex;
    }

    .blame {
        overflow: hidden;
        padding: 0 6px;
        border-left: 2px solid transparent;
        text-align: left;
        white-space: nowrap;
    }

    .blame:not(.uncommitted) {
        border-left-color: var(--line);
    }

    .blame.start {
        color: var(--ink-txt, var(--ink));
    }

    .blame.uncommitted {
        font-style: italic;
    }

    .blame:not(.uncommitted):hover {
        background: var(--accent-bg);
    }

    .mark.added {
        background: var(--c-scm-added);
    }

    .mark.modified {
        background: var(--c-scm-modified);
    }

    .mark.deleted {
        border-top: 3px solid var(--c-scm-deleted);
    }

    .mark.deleted.foot {
        border-top: 0;
        border-bottom: 3px solid var(--c-scm-deleted);
    }
</style>
