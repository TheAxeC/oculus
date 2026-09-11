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
        /**
         * Small buttons after the tail. Each is an id the caller knows and words it translated;
         * what pressing one does is the caller's and nothing here knows what an action is.
         */
        actions?: TickerAction[];
        /**
         * Draw the name as text even in a list that can be picked. A row needs an id to be told
         * apart when one of its buttons is pressed, and not every such row names something the
         * caller can open; this says so, rather than leaving a button that does nothing.
         */
        plain?: boolean;
    };

    /** One button on a row: what it is called back with, its words, and its hover title. */
    export type TickerAction = {
        id: string;
        label: string;
        title?: string;
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
        /** What pressing one of a row's buttons means, by the row's id and the button's. */
        onaction?: (row: string, action: string) => void;
    };

    let { rows, onpick, onaction }: Props = $props();

    function toneStyle(tone: string | undefined): string | undefined {
        return tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`;
    }
</script>

<ul class="ticker">
    {#each rows as row, at (`${at}:${row.id}`)}
        <li>
            <Glyph name={row.glyph} />
            {#if onpick !== undefined && row.id !== '' && row.plain !== true}
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
            {#if onaction !== undefined && row.actions !== undefined}
                {#each row.actions as action (action.id)}
                    <button
                        type="button"
                        class="act"
                        title={action.title}
                        onclick={() => onaction(row.id, action.id)}
                    >
                        {action.label}
                    </button>
                {/each}
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

    .act {
        flex: 0 0 auto;
        padding: 0 5px;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: var(--chip);
        font: inherit;
        font-size: var(--fs-3xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
        cursor: pointer;
    }

    .act:hover,
    .act:focus-visible {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent-txt, var(--accent));
    }
</style>
