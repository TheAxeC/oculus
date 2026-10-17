<script lang="ts" module>
    import type { TextPart } from '$lib/state/workbench/palette';

    /** One result row as the list draws it. */
    export type ResultRow = {
        value: string;
        kind: string;
        label: string;
        pick: () => void;
        /** The label's letters, matched and unmatched, when a query matched them. */
        parts?: TextPart[];
        hint?: string;
        /** The hint's letters, matched and unmatched, drawn in place of `hint`. */
        hintParts?: TextPart[];
        /** A file's name, which draws the icon of that name before the label. */
        file?: string;
        /** A word drawn muted after the hint. */
        trail?: string;
        /** A word drawn at the row's right, which is also the title of a row that cannot run. */
        note?: string;
        active?: boolean;
        disabled?: boolean;
        language?: string;
    };
</script>

<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. One result row of the palette's list: what it
    // is in words, then the control that opens it filling the rest. A `parts` label draws its
    // matched letters marked. A title longer than the row is cut with an ellipsis at the row's end
    // and its whole words are the row's tooltip, as VS Code's quick pick does. A file row draws the
    // icon of its file name before its label, its folder as the hint with the letters a query
    // matched marked, cut with an ellipsis where the row has no room for it, and the key of its
    // root after it, which it carries only when more than one root holds files. The Command reads
    // the row's id and selection from the item, so the row's own control is pressed through the row
    // and does nothing more.

    import { Command } from 'bits-ui';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FileIcon from '$lib/ui/display/FileIcon.svelte';

    let { row }: { row: ResultRow } = $props();

    const pressed = (): undefined => undefined;
</script>

{#snippet marked(parts: TextPart[])}
    {#each parts as part, at (at)}{#if part.hit}<mark class="hit">{part.text}</mark
            >{:else}{part.text}{/if}{/each}
{/snippet}

<Command.Item value={row.value} disabled={row.disabled} onSelect={row.pick}>
    {#snippet child({ props })}
        <div {...props} class="result" data-language={row.language}>
            <span class="kind">{row.kind}</span>
            {#if row.parts !== undefined}
                <ToolButton
                    plain
                    cut
                    label={row.label}
                    title={row.note ?? row.label}
                    active={row.active}
                    disabled={row.disabled}
                    onclick={pressed}
                >
                    {#if row.file !== undefined}
                        <FileIcon name={row.file} />
                    {/if}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render marked(row.parts)}
                </ToolButton>
            {:else}
                <ToolButton
                    plain
                    cut
                    label={row.label}
                    active={row.active}
                    disabled={row.disabled}
                    title={row.note ?? row.label}
                    onclick={pressed}
                />
            {/if}
            {#if row.hint !== undefined || row.hintParts !== undefined || row.note !== undefined}
                <span class="end">
                    {#if row.hintParts !== undefined}
                        <span class="hint">
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render marked(row.hintParts)}
                        </span>
                    {:else if row.hint !== undefined}
                        <span class="hint">{row.hint}</span>
                    {/if}
                    {#if row.trail !== undefined}<span class="hint trail">{row.trail}</span>{/if}
                    {#if row.note !== undefined}<span class="unavailable">{row.note}</span>{/if}
                </span>
            {/if}
        </div>
    {/snippet}
</Command.Item>

<style>
    /* One row of the list is one line of the tree's row height with its words at the main size,
       which the plain button inside it takes; the row in force is ringed by the application's one
       ring. The label takes the room its words need first and the hint the rest, at the row's
       end; a hint longer than that room is cut with an ellipsis and a label longer than the row
       is cut too, so no row is wider than the list and the list never scrolls sideways. */
    .result {
        display: grid;
        grid-template-columns: minmax(5rem, auto) minmax(0, max-content) minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        border-radius: var(--radius-sm);
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .result:hover {
        background: var(--chip);
    }

    .result[data-selected] {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .result :global(.tool) {
        justify-content: flex-start;
        width: 100%;
        text-align: left;
        white-space: nowrap;
    }

    /* The letters a query matched, marked as the Search view marks a match
       (views/sources/search/Results.svelte), so oculus has one match look: the accent's text
       colour, bold, on no fill of their own. */
    .hit {
        background: none;
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }

    /* The hint and the unavailable mark share the row's last column, so a row with both stays one
       line; the hint gives way first, cut with an ellipsis, and the mark keeps its words. */
    .end {
        display: flex;
        justify-self: end;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
        white-space: nowrap;
    }

    .end .hint {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* The root's key after a file's folder keeps its words while the folder gives way, and is cut
       only past half the column, so a long folder never leaves the root one letter. */
    .end .trail {
        flex: 0 0 auto;
        max-width: 50%;
    }

    .end .unavailable {
        flex: none;
    }

    .kind,
    .unavailable,
    .hint {
        color: var(--muted-txt, var(--muted));
    }

    .kind {
        font-size: var(--fs-xs);
        text-align: right;
    }

    .unavailable,
    .hint {
        font-size: var(--fs-sm);
    }
</style>
