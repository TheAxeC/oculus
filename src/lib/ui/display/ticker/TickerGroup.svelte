<script module lang="ts">
    // Layer 3, primitive. One group of dated rows in the Focus board's look, and the box the groups
    // stand in: the command center draws its groups with it, so the look of a group, its heading,
    // its note lines and the box is written once.
    //
    // A group is a block that does not break across the box's columns, 4px under the one before it:
    // a heading of the glyph and the label in extra-small bold capitals in the accent colour, then
    // its runs, each run an optional note line (a muted small line) over a ticker (Ticker.svelte),
    // then an optional note line under the runs and whatever the caller draws after them. The
    // ticker's props are passed through as the caller gives them. Two more forms are drawn:
    // `split`, where each run is a block of its own that does not break, the heading inside the
    // first, so a long group runs on into the second column a run at a time and its heading never
    // stands alone at a column's foot; and `folded`, a group closed by default whose heading is the
    // control that opens it.
    //
    // The box is the snippet `box`, exported here so its rules are written in this file: a section
    // with the box's padding, borders and radius, a left edge in the colour the caller names (a
    // tone of themes/tokens.css, `--c-<tone>`), the chip ground, and a flow of two columns of at
    // least 22em with 16px between them. Over a wallpaper the box is the one translucent layer
    // under its rows, so it carries `data-surface`; drawn inside a surface already (a free float's
    // fill) it paints nothing. What spans both columns (the heading row) says so itself.

    import type { ComponentProps, Snippet } from 'svelte';

    export { box };
</script>

<script lang="ts">
    import Glyph from '../Glyph.svelte';
    import Ticker from './Ticker.svelte';
    import type { TickerRow } from './ticker-rows';

    /** One run of a group: a note line over it, if any, and its rows. */
    type Run = { key: string; note?: string; rows: TickerRow[] };

    /** The ticker's own props but its rows, passed to every run as the caller gives them. */
    type TickerProps = Omit<ComponentProps<typeof Ticker>, 'rows'>;

    type Props = TickerProps & {
        /** The heading's words and glyph name. */
        label: string;
        glyph: string;
        runs: Run[];
        /** A note line under the runs, if any. */
        note?: string;
        /** What the caller draws after the runs and the note line. */
        after?: Snippet;
        /** Each run its own block that does not break, the heading inside the first. */
        split?: boolean;
        /** Closed by default, the heading the control that opens it. */
        folded?: boolean;
    };

    let {
        label,
        glyph,
        runs,
        note,
        after,
        split = false,
        folded = false,
        ...ticker
    }: Props = $props();
</script>

{#snippet box(edge: string, content: Snippet)}
    <section class="box" data-surface style:--edge={`var(--c-${edge})`}>
        {@render content()}
    </section>
{/snippet}

{#snippet heading()}
    <p class="lbl">
        <Glyph name={glyph} />{label}
    </p>
{/snippet}

{#snippet run(one: Run)}
    {#if one.note !== undefined}
        <p class="sub">{one.note}</p>
    {/if}
    <Ticker rows={one.rows} {...ticker} />
{/snippet}

{#snippet body()}
    {#each runs as one (one.key)}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render run(one)}
    {/each}
    {#if note !== undefined}
        <p class="sub">{note}</p>
    {/if}
    {#if after !== undefined}
        {@render after()}
    {/if}
{/snippet}

{#if folded}
    <details class="grp">
        <summary class="lbl">
            <Glyph name={glyph} />{label}
        </summary>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render body()}
    </details>
{:else if split}
    <div class="grp split">
        {#each runs as one, at (one.key)}
            <div class="category">
                {#if at === 0}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render heading()}
                {/if}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render run(one)}
            </div>
        {/each}
    </div>
{:else}
    <div class="grp">
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render heading()}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render body()}
    </div>
{/if}

<style>
    .box {
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--edge);
        border-radius: var(--input-radius);
        background: var(--chip);
        columns: 2 22em;
        column-gap: 16px;
    }

    :global(body.wall) .box {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .box {
        background: transparent;
        backdrop-filter: none;
    }

    .grp {
        margin-top: 4px;
        break-inside: avoid;
    }

    .grp.split {
        break-inside: auto;
    }

    .category {
        break-inside: avoid;
    }

    .lbl {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
    }

    summary.lbl {
        cursor: pointer;
    }

    .sub {
        margin: 6px 0 2px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
