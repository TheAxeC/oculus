<script module lang="ts">
    /**
     * One row: the glyph it is drawn with, the words that name it, the words that date it, and the
     * hue the tail is drawn in. A row with an `id` is one the caller can be told about; a row
     * without one is read and not clicked.
     */
    export type TickerRow = {
        id: string;
        glyph: string;
        label: string;
        tail?: string;
        tone?: string;
    };
</script>

<script lang="ts">
    // Layer 3, primitive. A dense list of dated lines: a glyph, a name, and what the date says about
    // it. It knows no domain, so what a row means and what picking one does are the caller's; the
    // Focus board draws one of these per group of its ticker, and the gallery draws one with sample
    // rows so the shape is visible under every theme.
    //
    // The tail's hue is a tone name, turned into `--c-<tone>-txt` on a custom property here, so the
    // only colours in the rules below are tokens.

    import Glyph from './Glyph.svelte';

    type Props = {
        rows: TickerRow[];
        /** What picking a row means. Rows are plain text when the caller wants none. */
        onpick?: (id: string) => void;
    };

    let { rows, onpick }: Props = $props();

    function toneStyle(tone: string | undefined): string | undefined {
        return tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`;
    }
</script>

<ul class="ticker">
    {#each rows as row, at (`${at}:${row.id}`)}
        <li>
            <Glyph name={row.glyph} />
            {#if onpick !== undefined && row.id !== ''}
                <button type="button" class="name" onclick={() => onpick(row.id)}>
                    {row.label}
                </button>
            {:else}
                <span class="name plain">{row.label}</span>
            {/if}
            {#if row.tail !== undefined && row.tail !== ''}
                <span class="tail" class:toned={row.tone !== undefined} style={toneStyle(row.tone)}>
                    {row.tail}
                </span>
            {/if}
        </li>
    {/each}
</ul>

<style>
    .ticker {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    li {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
        line-height: 1.5;
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font: inherit;
        font-weight: 600;
        color: var(--ink-txt, var(--ink));
    }

    button.name {
        padding: 0;
        border: 0;
        background: none;
        text-align: left;
        cursor: pointer;
    }

    button.name:hover,
    button.name:focus-visible {
        text-decoration: underline;
    }

    .plain {
        font-weight: 600;
    }

    .tail {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
    }

    .tail.toned {
        color: var(--tone-txt);
        font-weight: 600;
    }
</style>
