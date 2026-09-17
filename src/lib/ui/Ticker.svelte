<script lang="ts">
    // Layer 3, primitive. A dense list of dated lines: a glyph, a name, and what the date says about
    // it. It knows no domain, so what a row means and what picking one does are the caller's; the
    // Focus board draws one of these per group of its ticker, and the gallery draws one with sample
    // rows so the shape is visible under every theme.
    //
    // The tail's hue is a tone name, turned into `--c-<tone>-txt` on a custom property here, so the
    // only colours in the rules below are tokens.
    //
    // A list that `reveal`s draws a row's buttons only while the pointer is over the row or the
    // keyboard is inside it, and always on a device with no hover. A hidden button is transparent
    // and keeps its place, so nothing moves when it appears and Tab still reaches it. The button
    // `kept` names for a row, the one the row exists for, is drawn all the time, on a plain row
    // too.

    import type { TickerRow } from '$lib/ui/ticker-rows';
    import Glyph from './Glyph.svelte';

    type Props = {
        rows: TickerRow[];
        /** What picking a row means. Rows are plain text when the caller wants none. */
        onpick?: (id: string) => void;
        /** What pressing one of a row's buttons means, by the row's id and the button's. */
        onaction?: (row: string, action: string) => void;
        /** Draw a row's buttons only under the pointer or the keyboard. */
        reveal?: boolean;
        /** The id of the one button a row keeps drawn, and nothing for a row that keeps none. */
        kept?: (row: TickerRow) => string | undefined;
    };

    let { rows, onpick, onaction, reveal = false, kept }: Props = $props();

    function toneStyle(tone: string | undefined): string | undefined {
        return tone === undefined ? undefined : `--tone-txt: var(--c-${tone}-txt)`;
    }
</script>

<ul class="ticker" class:reveal>
    {#each rows as row, at (`${at}:${row.id}`)}
        <li>
            <Glyph name={row.glyph} />
            {#if onpick !== undefined && row.id !== '' && row.plain !== true}
                <button
                    type="button"
                    class="name"
                    data-ticker-id={row.id}
                    onclick={() => onpick(row.id)}
                >
                    {row.label}
                    {#if row.tail !== undefined && row.tail !== ''}
                        <span
                            class="tail"
                            class:toned={row.tone !== undefined}
                            style={toneStyle(row.tone)}
                        >
                            {row.tail}
                        </span>
                    {/if}
                </button>
            {:else}
                <span class="name plain">{row.label}</span>
                {#if row.tail !== undefined && row.tail !== ''}
                    <span
                        class="tail"
                        class:toned={row.tone !== undefined}
                        style={toneStyle(row.tone)}
                    >
                        {row.tail}
                    </span>
                {/if}
            {/if}
            {#if onaction !== undefined && row.actions !== undefined}
                {@const keep = kept?.(row)}
                {#each row.actions as action (action.id)}
                    <button
                        type="button"
                        class="act"
                        class:kept={action.id === keep}
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

    /* The words that date a row belong to the row's own control, so the whole line opens what the
       count names rather than only the count. */
    button.name .tail {
        font-weight: 400;
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

    .reveal .act {
        opacity: 0;
        transition: opacity 120ms ease-out;
    }

    .reveal li:hover .act,
    .reveal li:focus-within .act,
    .reveal .act.kept {
        opacity: 1;
    }

    @media (hover: none) {
        .reveal .act {
            opacity: 1;
        }
    }

    .act:hover,
    .act:focus-visible {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent-txt, var(--accent));
    }
</style>
