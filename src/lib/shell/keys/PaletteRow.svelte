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
    // and its whole words are the row's tooltip, as VS Code's quick pick does. The Command reads
    // the row's id and selection from the item, so the row's own control is pressed through the row
    // and does nothing more.

    import { Command } from 'bits-ui';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';

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
                    title={row.label}
                    active={row.active}
                    onclick={pressed}
                >
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
            {#if row.hint !== undefined}<span class="hint">{row.hint}</span>{/if}
            {#if row.note !== undefined}<span class="unavailable">{row.note}</span>{/if}
        </div>
    {/snippet}
</Command.Item>

<style>
    /* One row of the list is one line of the tree's row height with its words at the main size,
       which the plain button inside it takes; the row in force is ringed by the application's one
       ring. */
    .result {
        display: grid;
        grid-template-columns: minmax(5rem, auto) minmax(0, 1fr) auto;
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
