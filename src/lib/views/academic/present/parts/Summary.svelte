<script lang="ts">
    // Layer 3, Present partial. A cross-project summary slide: one row per project, the domain's
    // label and hue as the field and the dot beside it, and the foot line under the table.
    //
    // The table is ui/display/table/Table.svelte. Every cell but the field is words, and the field
    // is the one the `cell` snippet is for, so the slide describes its four columns and draws
    // nothing of a table itself. The rows are the deck's own order and are not sortable: a summary
    // is written as a sequence, and a reader who sorted it would lose the sequence its author
    // chose.

    import Table from '$lib/ui/display/table/Table.svelte';
    import type { Column } from '$lib/ui/display/table/table-rows';
    import { t } from '$lib/state/shared/words/text';
    import Dot from './Dot.svelte';
    import Words from './Words.svelte';
    import { domainLabel, domainTone } from '$lib/state/shared/words/tones';
    import type { DeckSummaryRow } from '$lib/state/life/present';

    type Props = { heading: string; rows: DeckSummaryRow[]; foot: string };

    let { heading, rows: summary, foot }: Props = $props();

    const columns: Column[] = [
        { key: 'field', label: t('present.col_field') },
        { key: 'project', label: t('present.col_project') },
        { key: 'mechanism', label: t('present.col_mechanism') },
        { key: 'headline', label: t('present.col_headline') }
    ];

    /** The rows as the table takes them, each carrying the key it is drawn under. */
    const rows = $derived(
        summary.map((row, at) => ({
            row: at,
            field: row.domain === undefined ? '' : domainLabel(row.domain),
            project: row.project,
            mechanism: row.mechanism,
            headline: row.headline,
            tone: row.domain === undefined ? undefined : domainTone(row.domain)
        }))
    );

    /**
     * A row's value as the text the cell snippet renders; every column of this table holds words.
     */
    function value(row: Record<string, unknown>, key: string): string {
        const held = row[key];
        return typeof held === 'string' ? held : '';
    }

    function tone(row: Record<string, unknown>): string | undefined {
        return typeof row.tone === 'string' ? row.tone : undefined;
    }
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'field'}
        <span class="field">
            <Dot tone={tone(row)} />
            <Words text={value(row, column.key)} />
        </span>
    {:else}
        <Words text={value(row, column.key)} />
    {/if}
{/snippet}

<section class="slide" data-slide-kind="summary">
    {#if heading !== ''}
        <h3 class="headline"><Words text={heading} /></h3>
    {/if}
    <div class="scroll">
        <Table {columns} {rows} rowKey="row" {cell} />
    </div>
    {#if foot !== ''}
        <p class="hint"><Words text={foot} /></p>
    {/if}
</section>

<style>
    .headline {
        margin: 0 0 0.3em;
        font-size: var(--slide-fs-h);
        line-height: 1.15;
    }

    /* The table is the one thing on a slide wider than the reading width, so it scrolls in its own
       box. */
    .scroll {
        margin-top: 12px;
        overflow-x: auto;
    }

    .field {
        display: flex;
        align-items: baseline;
        gap: 6px;
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }
</style>
